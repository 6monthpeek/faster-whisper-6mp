import os
import sys
import gc
import time
import json
import logging
import threading
import tempfile
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# ─── NVIDIA CUDA DLL path registration (must happen BEFORE any CUDA import) ─
if sys.platform == "win32":
    _venv_root = os.path.dirname(os.path.abspath(__file__))
    _site_packages = os.path.join(_venv_root, ".venv", "Lib", "site-packages")
    _cuda_dirs = []
    for _subdir in ["nvidia/cublas/bin", "nvidia/cudnn/bin", "nvidia/cuda_nvrtc/bin"]:
        _dll_dir = os.path.join(_site_packages, _subdir)
        if os.path.isdir(_dll_dir):
            _cuda_dirs.append(_dll_dir)
            # Method 1: os.add_dll_directory (Python 3.8+)
            try:
                os.add_dll_directory(_dll_dir)
            except Exception:
                pass
            # Method 2: Also add to PATH env var — many native loaders only check PATH
            os.environ["PATH"] = _dll_dir + os.pathsep + os.environ.get("PATH", "")

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("engine")

# ─── Core imports (isolated so one failure doesn't kill others) ──────────────
try:
    import torch
    log.info("torch imported OK — version %s", torch.__version__)
except ImportError:
    torch = None
    log.warning("torch not available — CUDA detection will be limited")

try:
    from faster_whisper import WhisperModel
    log.info("faster-whisper imported OK")
except ImportError:
    WhisperModel = None  # type: ignore
    log.error("faster-whisper NOT installed — engine will not work")

try:
    from huggingface_hub import snapshot_download, HfApi
    log.info("huggingface-hub imported OK")
except ImportError:
    snapshot_download = None  # type: ignore
    HfApi = None
    log.error("huggingface-hub NOT installed — model download will fail")

try:
    import tqdm as _tqdm_module
    _HAS_TQDM = True
    log.info("tqdm imported OK")
except ImportError:
    _tqdm_module = None
    _HAS_TQDM = False
    log.warning("tqdm not available — using built-in progress tracker")

try:
    import ctranslate2
    log.info("ctranslate2 imported OK — version %s", getattr(ctranslate2, "__version__", "unknown"))
except ImportError:
    ctranslate2 = None
    log.warning("ctranslate2 not available")

# Optional: Speaker diarization (SpeechBrain-based, no HF token needed)
_SPEECHBRAIN_AVAILABLE = False
try:
    import speechbrain
    _SPEECHBRAIN_AVAILABLE = True
    log.info("speechbrain imported OK — diarization available (no token required)")
except ImportError:
    log.warning("speechbrain not installed — diarization disabled")

# Also check pyannote as alternative backend
_PYANNOTE_AVAILABLE = False
try:
    from pyannote.audio import Pipeline as PyannotePipeline
    _PYANNOTE_AVAILABLE = True
    log.info("pyannote.audio imported OK — available as alternative (requires HF token)")
except ImportError:
    pass

_HAS_DIARIZATION = _SPEECHBRAIN_AVAILABLE or _PYANNOTE_AVAILABLE

# Optional: Noise suppression
try:
    import noisereduce as nr
    _HAS_NOISE_REDUCE = True
    log.info("noisereduce imported OK")
except ImportError:
    nr = None  # type: ignore
    _HAS_NOISE_REDUCE = False
    log.warning("noisereduce not installed — noise suppression disabled")

# Optional: Audio processing for noise reduce
try:
    import librosa
    import soundfile as sf
    _HAS_AUDIO_LIBS = True
except ImportError:
    _HAS_AUDIO_LIBS = False

# ─── SSE streaming support ──────────────────────────────────────────────────
try:
    from sse_starlette.sse import EventSourceResponse
    _HAS_SSE = True
except ImportError:
    EventSourceResponse = None  # type: ignore
    _HAS_SSE = False

# -----------------------------------------------------------------------

app = FastAPI(title="Faster-Whisper Local Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Supported languages ────────────────────────────────────────────────────
LANGUAGES = {
    "auto": "Auto-Detect",
    "en": "English", "tr": "Turkish", "de": "German", "fr": "French",
    "es": "Spanish", "it": "Italian", "pt": "Portuguese", "ru": "Russian",
    "zh": "Chinese", "ja": "Japanese", "ko": "Korean", "ar": "Arabic",
    "hi": "Hindi", "nl": "Dutch", "pl": "Polish", "sv": "Swedish",
    "da": "Danish", "fi": "Finnish", "no": "Norwegian", "cs": "Czech",
    "el": "Greek", "he": "Hebrew", "hu": "Hungarian", "id": "Indonesian",
    "ms": "Malay", "ro": "Romanian", "sk": "Slovak", "th": "Thai",
    "uk": "Ukrainian", "vi": "Vietnamese", "bg": "Bulgarian", "ca": "Catalan",
    "hr": "Croatian", "lt": "Lithuanian", "lv": "Latvian", "sl": "Slovenian",
    "et": "Estonian", "tl": "Filipino", "ur": "Urdu", "ta": "Tamil",
}

# ─── Known model sizes (bytes) ─────────────────────────────────────────────
MODEL_SIZES = {
    "tiny":      75_500_000,
    "base":      142_000_000,
    "small":     466_000_000,
    "medium":    1_530_000_000,
    "large-v2":  2_950_000_000,
    "large-v3":  2_950_000_000,
}

# ─── Supported export formats ───────────────────────────────────────────────
EXPORT_FORMATS = ["txt", "srt", "vtt", "json"]


# ─── Global Engine State ────────────────────────────────────────────────────
class EngineState:
    def __init__(self):
        self.model = None
        self.current_model_size: Optional[str] = None
        self.device: Optional[str] = None
        self.compute_type: Optional[str] = None
        self.loading: bool = False
        self.error: Optional[str] = None

        # Download progress
        self.progress_pct: float = 0.0
        self.progress_bytes: int = 0
        self.total_bytes: int = 0
        self.speed: str = ""
        self.desc: str = ""

        # Diarization
        self.diarization_pipeline = None
        self.diarization_loading: bool = False

        # Transcription history (in-memory, last 100)
        self.history: List[dict] = []

state = EngineState()
_load_lock = threading.Lock()

# Shared progress counters
_dl_total = 0
_dl_downloaded = 0


def _reset_progress(total: int, desc: str):
    global _dl_total, _dl_downloaded
    _dl_total = total
    _dl_downloaded = 0
    state.total_bytes = total
    state.progress_bytes = 0
    state.progress_pct = 0.0
    state.speed = ""
    state.desc = desc


# ─── Progress Tracker ───────────────────────────────────────────────────────
class _StandaloneProgress:
    def __init__(self, *args, **kwargs):
        self._file_total = kwargs.get("total", 0) or 0
        self._file_n = kwargs.get("initial", 0) or 0
        self._desc = kwargs.get("desc", "")
        self._start_time = time.time()
        self._last_time = self._start_time
        self._last_n = _dl_downloaded
        self._closed = False
        self._rate: Optional[float] = None
        if self._desc:
            state.desc = self._desc

    def update(self, n: int = 1):
        if self._closed:
            return
        global _dl_downloaded
        self._file_n += n
        _dl_downloaded += n
        now = time.time()
        elapsed = now - self._last_time
        if elapsed > 0.1:
            self._rate = (_dl_downloaded - self._last_n) / elapsed
            self._last_time = now
            self._last_n = _dl_downloaded
        state.progress_bytes = _dl_downloaded
        if _dl_total > 0:
            state.progress_pct = min((_dl_downloaded / _dl_total) * 100, 100.0)
        if self._rate and self._rate > 0:
            state.speed = _format_bytes(self._rate) + "/s"

    def set_description(self, desc=None, refresh=True):
        if desc:
            self._desc = desc
            state.desc = desc

    def close(self):
        self._closed = True

    @property
    def format_dict(self):
        return {
            "n": self._file_n,
            "total": self._file_total,
            "elapsed": time.time() - self._start_time,
            "rate": self._rate,
        }


if _HAS_TQDM:
    class ProgressTracker(_tqdm_module.tqdm):  # type: ignore
        def __init__(self, *args, **kwargs):
            self._desc_text = kwargs.get("desc", "")
            if self._desc_text:
                state.desc = self._desc_text
            try:
                super().__init__(*args, **kwargs)
            except Exception as e:
                log.warning("ProgressTracker init warning: %s", e)

        def update(self, n: int = 1):
            global _dl_downloaded
            try:
                super().update(n)
            except Exception:
                pass
            _dl_downloaded += n
            state.progress_bytes = _dl_downloaded
            if _dl_total > 0:
                state.progress_pct = min((_dl_downloaded / _dl_total) * 100, 100.0)
            try:
                rate = self.format_dict.get("rate", None)
                if rate and rate > 0:
                    state.speed = _format_bytes(rate) + "/s"
            except Exception:
                pass

        def set_description(self, desc=None, refresh=True):
            try:
                super().set_description(desc, refresh)
            except Exception:
                pass
            if desc:
                state.desc = desc

        def close(self):
            try:
                super().close()
            except Exception:
                pass
else:
    ProgressTracker = _StandaloneProgress  # type: ignore


def _format_bytes(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def _get_repo_total_size(repo_id: str) -> int:
    if HfApi is None:
        return MODEL_SIZES.get(repo_id.split("-")[-1], 0)
    try:
        api = HfApi()
        files = api.list_repo_files(repo_id)
        total = 0
        allowed = {"config.json", "model.bin", "tokenizer.json", "vocabulary.txt", "vocabulary.json"}
        for f in files:
            if f.rfilename in allowed and f.size:
                total += f.size
        log.info("Repo %s total size: %s (%d bytes)", repo_id, _format_bytes(total), total)
        return total or MODEL_SIZES.get(repo_id.split("-")[-1], 0)
    except Exception as e:
        log.warning("Could not query repo size: %s — using estimate", e)
        return MODEL_SIZES.get(repo_id.split("-")[-1], 0)


# ─── Audio preprocessing ────────────────────────────────────────────────────
def _apply_noise_suppression(input_path: str) -> str:
    """Apply noise reduction and return path to cleaned audio file."""
    if not _HAS_NOISE_REDUCE or not _HAS_AUDIO_LIBS:
        log.warning("noisereduce or librosa/soundfile not available — skipping noise suppression")
        return input_path

    try:
        log.info("Applying noise suppression to: %s", input_path)
        audio, sr = librosa.load(input_path, sr=None)
        reduced_noise = nr.reduce_noise(y=audio, sr=sr, prop_decrease=0.8)
        output_path = input_path.rsplit(".", 1)[0] + "_clean.wav"
        sf.write(output_path, reduced_noise, sr)
        log.info("Noise suppression complete: %s", output_path)
        return output_path
    except Exception as e:
        log.warning("Noise suppression failed: %s — using original audio", e)
        return input_path


# ─── Speaker Diarization ───────────────────────────────────────────────────
def _run_diarization(audio_path: str, num_speakers: Optional[int] = None) -> List[dict]:
    """Run speaker diarization on audio file. Returns list of {speaker, start, end}."""
    if not _HAS_DIARIZATION or state.diarization_pipeline is None:
        return []

    try:
        log.info("Running diarization on: %s", audio_path)
        pipeline_type = state.diarization_pipeline.get("type", "")

        if pipeline_type == "speechbrain" and _SPEECHBRAIN_AVAILABLE:
            import numpy as np
            import librosa
            from sklearn.cluster import SpectralClustering

            classifier = state.diarization_pipeline["classifier"]

            # Load audio
            y, sr = librosa.load(audio_path, sr=16000)
            duration = len(y) / sr

            # Split into overlapping windows (2s window, 0.5s hop)
            window_size = int(2.0 * sr)
            hop_size = int(0.5 * sr)
            embeddings = []
            timestamps = []

            for start in range(0, len(y) - window_size, hop_size):
                chunk = y[start:start + window_size]
                if np.abs(chunk).max() < 0.01:
                    continue
                emb = classifier.encode_batch(torch.tensor(chunk).unsqueeze(0) if torch is not None else [chunk])
                embeddings.append(emb.squeeze().cpu().numpy())
                timestamps.append((start / sr, (start + window_size) / sr))

            if len(embeddings) < 2:
                return []

            # Cluster embeddings into speakers
            n_spk = num_speakers or min(max(2, len(set([round(e[0], 1) for e in embeddings]))), 8)
            clustering = SpectralClustering(n_clusters=n_spk, assign_labels="discretize", random_state=42)
            labels = clustering.fit_predict(np.array(embeddings))

            # Build turns from consecutive same-label segments
            turns = []
            current_label = labels[0]
            turn_start = timestamps[0][0]
            for i in range(1, len(labels)):
                if labels[i] != current_label:
                    turns.append({
                        "speaker": f"Speaker {current_label + 1}",
                        "start": round(turn_start, 2),
                        "end": round(timestamps[i][0], 2),
                    })
                    current_label = labels[i]
                    turn_start = timestamps[i][0]
            # Final turn
            turns.append({
                "speaker": f"Speaker {current_label + 1}",
                "start": round(turn_start, 2),
                "end": round(timestamps[-1][1], 2),
            })

            log.info("Diarization complete: %d turns from %d speakers",
                     len(turns), len(set(t["speaker"] for t in turns)))
            return turns

        elif pipeline_type == "pyannote":
            pipeline = state.diarization_pipeline["pipeline"]
            diarization = pipeline(
                audio_path,
                num_speakers=num_speakers,
            )
            turns = []
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                turns.append({
                    "speaker": speaker,
                    "start": turn.start,
                    "end": turn.end,
                })
            log.info("Diarization complete: %d turns from %d speakers",
                     len(turns), len(set(t["speaker"] for t in turns)))
            return turns

        return []
    except Exception as e:
        log.warning("Diarization failed: %s", e)
        return []


def _assign_speakers_to_segments(segments: List[dict], diarization_turns: List[dict]) -> List[dict]:
    """Assign speaker labels to transcription segments based on overlap."""
    if not diarization_turns:
        return segments

    for seg in segments:
        seg_start = seg["start"]
        seg_end = seg["end"]
        best_speaker = "Speaker 1"
        best_overlap = 0.0

        for turn in diarization_turns:
            overlap_start = max(seg_start, turn["start"])
            overlap_end = min(seg_end, turn["end"])
            overlap = max(0.0, overlap_end - overlap_start)
            if overlap > best_overlap:
                best_overlap = overlap
                best_speaker = turn["speaker"]

        seg["speaker"] = best_speaker

    return segments


# ─── Export formatters ──────────────────────────────────────────────────────
def _segments_to_srt(segments: List[dict]) -> str:
    pad = lambda n, z=2: str(int(n)).zfill(z)
    def to_srt_time(s):
        h, rem = divmod(s, 3600)
        m, sec = divmod(rem, 60)
        ms = int(round((s % 1) * 1000))
        return f"{pad(h)}:{pad(m)}:{pad(sec)},{str(ms).zfill(3)}"

    lines = []
    for i, seg in enumerate(segments):
        speaker_tag = f"[{seg.get('speaker', 'Unknown')}] " if seg.get("speaker") else ""
        lines.append(f"{i + 1}")
        lines.append(f"{to_srt_time(seg['start'])} --> {to_srt_time(seg['end'])}")
        lines.append(f"{speaker_tag}{seg['text'].strip()}")
        lines.append("")
    return "\n".join(lines)


def _segments_to_vtt(segments: List[dict]) -> str:
    def to_vtt_time(s):
        h, rem = divmod(s, 3600)
        m, sec = divmod(rem, 60)
        ms = int(round((s % 1) * 1000))
        return f"{int(h):02d}:{int(m):02d}:{int(sec):02d}.{str(ms).zfill(3)}"

    lines = ["WEBVTT", ""]
    for seg in segments:
        speaker_tag = f"<v {seg.get('speaker', 'Unknown')}>" if seg.get("speaker") else ""
        lines.append(f"{to_vtt_time(seg['start'])} --> {to_vtt_time(seg['end'])}")
        lines.append(f"{speaker_tag}{seg['text'].strip()}")
        lines.append("")
    return "\n".join(lines)


def _segments_to_txt(segments: List[dict]) -> str:
    lines = []
    current_speaker = None
    for seg in segments:
        speaker = seg.get("speaker")
        if speaker and speaker != current_speaker:
            lines.append(f"\n[{speaker}]")
            current_speaker = speaker
        lines.append(seg["text"].strip())
    return " ".join(lines).strip()


def _segments_to_json(segments: List[dict], language: str, language_probability: float) -> str:
    return json.dumps({
        "language": language,
        "language_probability": round(language_probability, 4),
        "segments": segments,
    }, ensure_ascii=False, indent=2)


# ─── Background loader ─────────────────────────────────────────────────────
def _run_load(model_size: str, device: str, compute_type: str):
    global state
    with _load_lock:
        try:
            if snapshot_download is None:
                raise EnvironmentError("huggingface_hub not found in engine venv.")
            if WhisperModel is None:
                raise EnvironmentError("faster-whisper not found in engine venv.")

            if state.model is not None:
                del state.model
                state.model = None
                gc.collect()

            resolved_device = _resolve_device(device)
            resolved_compute = _resolve_compute_type(compute_type, resolved_device)

            log.info("Loading model=%s device=%s compute=%s", model_size, resolved_device, resolved_compute)

            repo_id = f"Systran/faster-whisper-{model_size}"
            total_size = _get_repo_total_size(repo_id)
            _reset_progress(total_size, f"Downloading {model_size} model…")
            state.error = None

            cached_path = snapshot_download(
                repo_id=repo_id,
                tqdm_class=ProgressTracker,
                allow_patterns=[
                    "config.json", "model.bin", "tokenizer.json",
                    "vocabulary.txt", "vocabulary.json",
                ],
            )
            log.info("Model cached at: %s", cached_path)

            state.desc = f"Initializing {model_size} on {resolved_device}…"
            state.progress_pct = 99.0

            state.model = WhisperModel(
                cached_path,
                device=resolved_device,
                compute_type=resolved_compute,
            )
            state.current_model_size = model_size
            state.device = resolved_device
            state.compute_type = resolved_compute
            state.progress_pct = 100.0
            state.desc = f"{model_size} ready on {resolved_device.upper()}"
            log.info("Model %s loaded successfully on %s", model_size, resolved_device)

        except Exception as exc:
            err = str(exc)
            log.exception("Model load failed: %s", err)
            state.error = err
        finally:
            state.loading = False


def _run_load_diarization():
    """Load diarization pipeline in background. Uses SpeechBrain directly (no token required)."""
    global state
    if not _HAS_DIARIZATION:
        state.error = "Diarization not available. Install with: pip install speechbrain"
        state.diarization_loading = False
        return

    try:
        state.diarization_loading = True
        state.desc = "Loading diarization pipeline…"

        # SpeechBrain-based diarizer — no token required
        if _SPEECHBRAIN_AVAILABLE:
            from speechbrain.inference.speaker import EncoderClassifier
            # Pre-load the speaker embedding model so first diarization is fast
            classifier = EncoderClassifier.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb",
                savedir=os.path.join(os.path.expanduser("~"), ".cache", "speechbrain", "spkrec-ecapa-voxceleb"),
                run_opts={"device": "cuda" if (torch is not None and torch.cuda.is_available()) else "cpu"},
            )
            state.diarization_pipeline = {"type": "speechbrain", "classifier": classifier}
            log.info("SpeechBrain diarization pipeline loaded (no token required)")

        elif _PYANNOTE_AVAILABLE:
            # Fallback to pyannote (requires HF token)
            token = os.environ.get("HF_TOKEN", os.environ.get("HUGGINGFACE_TOKEN"))
            pipeline = PyannotePipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=token,
            )
            if torch is not None and torch.cuda.is_available():
                pipeline = pipeline.to(torch.device("cuda"))
            state.diarization_pipeline = {"type": "pyannote", "pipeline": pipeline}
            log.info("pyannote pipeline loaded as fallback")
        else:
            state.diarization_pipeline = None

    except Exception as exc:
        log.warning("Diarization pipeline load failed: %s", exc)
        state.diarization_pipeline = None
    finally:
        state.diarization_loading = False


def _resolve_device(device: str) -> str:
    if device != "auto":
        return device
    # CTranslate2 takes priority — works even with CPU-only PyTorch
    if ctranslate2 is not None:
        try:
            if ctranslate2.get_cuda_device_count() > 0:
                return "cuda"
        except Exception:
            pass
    if torch is not None and torch.cuda.is_available():
        return "cuda"
    return "cpu"


def _resolve_compute_type(compute_type: str, device: str) -> str:
    if compute_type != "auto":
        return compute_type
    return "float16" if device == "cuda" else "int8"


# ─── History management ────────────────────────────────────────────────────
def _add_to_history(filename: str, language: str, segments: List[dict], task: str, duration: float, file_path: str = ""):
    entry = {
        "id": int(time.time() * 1000),
        "filename": filename,
        "file_path": file_path,
        "language": language,
        "task": task,
        "segment_count": len(segments),
        "duration_seconds": round(duration, 2),
        "timestamp": time.time(),
        "text_preview": " ".join(s["text"].strip() for s in segments[:3])[:200],
        "segments": segments,
    }
    state.history.insert(0, entry)
    if len(state.history) > 100:
        state.history = state.history[:100]


# ─── API Endpoints ──────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Lightweight health check — returns OK without heavy computation."""
    return {"status": "ok", "uptime": time.time()}


@app.get("/status")
async def get_status():
    return {
        "loading": state.loading,
        "model_loaded": state.model is not None,
        "current_model": state.current_model_size,
        "device": state.device,
        "compute_type": state.compute_type,
        "error": state.error,
        "diarization_available": _HAS_DIARIZATION and state.diarization_pipeline is not None,
        "diarization_loading": state.diarization_loading,
        "noise_suppression_available": _HAS_NOISE_REDUCE,
        "progress": {
            "pct": round(state.progress_pct, 1),
            "bytes": state.progress_bytes,
            "total": state.total_bytes,
            "speed": state.speed,
            "desc": state.desc,
        },
    }


@app.get("/hardware")
async def get_hardware():
    has_cuda = False
    device_name = "CPU"
    vram_total = 0
    vram_free = 0
    compute_capability = ""
    driver_version = ""
    cuda_version = ""
    cpu_name = ""
    cpu_cores = 0
    ram_total = 0
    ctranslate2_devices = 0

    # ── GPU Detection (PyTorch first for richer info, CTranslate2 as fallback) ──
    if torch is not None and torch.cuda.is_available():
        has_cuda = True
        try:
            device_name = torch.cuda.get_device_name(0)
            vram_total = torch.cuda.get_device_properties(0).total_mem
            vram_free = torch.cuda.mem_get_info()[0]
            cap = torch.cuda.get_device_capability(0)
            compute_capability = f"{cap[0]}.{cap[1]}"
            driver_version = torch.cuda.get_driver_version()
            cuda_version = ".".join(torch.version.cuda.split(".")[:2]) if torch.version.cuda else ""
        except Exception:
            pass

    # ── GPU detection via CTranslate2 (fallback or supplement) ──
    if ctranslate2 is not None and not has_cuda:
        try:
            ctranslate2_devices = ctranslate2.get_cuda_device_count()
            has_cuda = ctranslate2_devices > 0
            if has_cuda and not device_name.startswith("NVIDIA") and device_name == "CPU":
                device_name = f"NVIDIA GPU ({ctranslate2_devices} device(s))"
        except Exception:
            pass
    elif ctranslate2 is not None:
        try:
            ctranslate2_devices = ctranslate2.get_cuda_device_count()
        except Exception:
            pass

    # ── GPU detection via nvidia-smi (fallback for GPU name / VRAM / driver) ──
    if not device_name or device_name == "CPU" or not vram_total:
        try:
            import subprocess as _sp
            result = _sp.run(
                [
                    "nvidia-smi",
                    "--query-gpu=name,memory.total,memory.free,driver_version",
                    "--format=csv,noheader,nounits",
                ],
                capture_output=True, text=True, timeout=5,
            )
            if result.returncode == 0 and result.stdout.strip():
                parts = [p.strip() for p in result.stdout.strip().split(",")]
                if len(parts) >= 1:
                    smi_name = parts[0]
                    if not has_cuda or device_name == "CPU":
                        device_name = smi_name
                if len(parts) >= 3:
                    if not vram_total:
                        vram_total = int(float(parts[1]) * 1024 * 1024)
                    if not vram_free:
                        vram_free = int(float(parts[2]) * 1024 * 1024)
                if len(parts) >= 4 and not driver_version:
                    driver_version = parts[3]
        except Exception:
            pass

    # ── CPU Info ──
    try:
        import platform
        import subprocess
        if sys.platform == "win32":
            try:
                result = subprocess.run(
                    ["wmic", "cpu", "get", "Name"],
                    capture_output=True, text=True, timeout=5,
                )
                lines = [l.strip() for l in result.stdout.strip().split("\n") if l.strip()]
                if len(lines) > 1:
                    cpu_name = lines[1]
            except Exception:
                pass
            if not cpu_name:
                try:
                    import winreg
                    key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
                    cpu_name, _ = winreg.QueryValueEx(key, "ProcessorNameString")
                    winreg.CloseKey(key)
                except Exception:
                    pass
            if not cpu_name:
                try:
                    result = subprocess.run(
                        ["powershell", "-NoProfile", "-Command",
                         "(Get-CimInstance Win32_Processor).Name"],
                        capture_output=True, text=True, timeout=5,
                    )
                    if result.stdout.strip():
                        cpu_name = result.stdout.strip()
                except Exception:
                    pass
            if not cpu_name:
                try:
                    result = subprocess.run(
                        ["powershell", "-NoProfile", "-Command",
                         "(Get-ItemProperty 'HKLM:\\HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0').ProcessorNameString"],
                        capture_output=True, text=True, timeout=5,
                    )
                    if result.stdout.strip():
                        cpu_name = result.stdout.strip()
                except Exception:
                    pass
        elif sys.platform == "darwin":
            try:
                result = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True, timeout=5)
                cpu_name = result.stdout.strip()
            except Exception:
                pass
        else:  # Linux
            try:
                with open("/proc/cpuinfo", "r") as f:
                    for line in f:
                        if line.startswith("model name"):
                            cpu_name = line.split(":", 1)[1].strip()
                            break
            except Exception:
                pass
        if not cpu_name:
            cpu_name = platform.processor() or platform.machine()
        cpu_cores = os.cpu_count() or 0
    except Exception:
        pass

    # ── System RAM ──
    try:
        import psutil
        ram_total = psutil.virtual_memory().total
        ram_free = psutil.virtual_memory().available
    except Exception:
        ram_total = 0
        ram_free = 0

    gpu_label = device_name if device_name and device_name != "CPU" else "No dedicated GPU"

    return {
        "cuda": has_cuda,
        "name": device_name,
        "gpu_label": gpu_label,
        "vram_total": vram_total,
        "vram_free": vram_free,
        "vram_total_label": _format_bytes(vram_total) if vram_total else "N/A",
        "vram_free_label": _format_bytes(vram_free) if vram_free else "N/A",
        "compute_capability": compute_capability,
        "driver_version": driver_version,
        "cuda_version": cuda_version,
        "gpu_count": ctranslate2_devices,
        "cpu_name": cpu_name,
        "cpu_cores": cpu_cores,
        "ram_total": ram_total,
        "ram_free": ram_free,
        "ram_total_label": _format_bytes(ram_total) if ram_total else "N/A",
        "ram_free_label": _format_bytes(ram_free) if ram_free else "N/A",
    }


@app.get("/models")
async def get_models():
    models = []
    for size_key, size_bytes in MODEL_SIZES.items():
        models.append({
            "size": size_key,
            "bytes": size_bytes,
            "label": _format_bytes(size_bytes),
        })
    return {"models": models}


@app.get("/languages")
async def get_languages():
    return {"languages": LANGUAGES}


@app.get("/capabilities")
async def get_capabilities():
    """Return what features are available based on installed packages."""
    return {
        "diarization": _HAS_DIARIZATION,
        "noise_suppression": _HAS_NOISE_REDUCE,
        "sse_streaming": _HAS_SSE,
        "export_formats": EXPORT_FORMATS,
    }


@app.post("/load")
async def load_model(
    model_size: str = Form(...),
    device: str = Form("auto"),
    compute_type: str = Form("auto"),
):
    if state.loading:
        raise HTTPException(status_code=400, detail="A model is already loading.")

    state.loading = True
    state.error = None
    state.progress_pct = 0.0
    state.progress_bytes = 0
    state.total_bytes = 0
    state.speed = ""
    state.desc = f"Preparing to download {model_size}…"

    log.info("Load requested: model=%s device=%s compute=%s", model_size, device, compute_type)

    t = threading.Thread(
        target=_run_load,
        args=(model_size, device, compute_type),
        daemon=True,
    )
    t.start()

    return {"status": "loading", "message": f"Started loading {model_size}."}


@app.post("/load-diarization")
async def load_diarization():
    """Load the pyannote diarization pipeline."""
    if state.diarization_loading:
        raise HTTPException(status_code=400, detail="Diarization pipeline is already loading.")
    if not _HAS_DIARIZATION:
        raise HTTPException(status_code=400, detail="Diarization not installed. Run: pip install simple-diarizer speechbrain")

    state.diarization_loading = True
    t = threading.Thread(target=_run_load_diarization, daemon=True)
    t.start()

    return {"status": "loading", "message": "Loading diarization pipeline…"}


@app.post("/unload")
async def unload_model():
    global state
    if state.loading:
        raise HTTPException(status_code=400, detail="Model is currently loading.")
    if state.model is None:
        raise HTTPException(status_code=400, detail="No model is loaded.")
    del state.model
    state.model = None
    state.current_model_size = None
    state.device = None
    state.compute_type = None
    state.progress_pct = 0.0
    state.desc = ""
    gc.collect()
    log.info("Model unloaded")
    return {"status": "unloaded"}


@app.post("/transcribe")
async def transcribe(
    audio: Optional[UploadFile] = File(None),
    file_path: Optional[str] = Form(None),
    task: str = Form("transcribe"),
    language: Optional[str] = Form(None),
    vad_filter: str = Form("true"),
    word_timestamps: str = Form("true"),
    diarize: str = Form("false"),
    num_speakers: Optional[str] = Form(None),
    noise_suppression: str = Form("false"),
    beam_size: str = Form("5"),
):
    if state.model is None:
        raise HTTPException(status_code=400, detail="No model loaded. Please load a model first.")
    if state.loading:
        raise HTTPException(status_code=400, detail="Model is currently loading. Please wait.")

    input_path: Optional[str] = None
    is_temp = False
    cleaned_path: Optional[str] = None

    if file_path and os.path.exists(file_path):
        input_path = file_path
    elif audio:
        input_path = os.path.join(tempfile.gettempdir(), f"fw_{int(time.time())}_{audio.filename}")
        with open(input_path, "wb") as f:
            f.write(await audio.read())
        is_temp = True
    else:
        raise HTTPException(status_code=400, detail="No audio file or file_path provided.")

    # Parse boolean/string params
    use_vad = vad_filter.lower() in ("true", "1", "yes")
    use_words = word_timestamps.lower() in ("true", "1", "yes")
    use_diarize = diarize.lower() in ("true", "1", "yes")
    use_noise_suppression = noise_suppression.lower() in ("true", "1", "yes")
    beam = int(beam_size) if beam_size.isdigit() else 5
    num_spk = int(num_speakers) if num_speakers and num_speakers.isdigit() else None
    resolved_lang = language if language and language != "auto" else None

    log.info("Transcribing: %s task=%s lang=%s vad=%s words=%s diarize=%s noise=%s",
             input_path, task, resolved_lang, use_vad, use_words, use_diarize, use_noise_suppression)

    start_time = time.time()

    try:
        # Apply noise suppression if requested
        if use_noise_suppression:
            cleaned_path = _apply_noise_suppression(input_path)
            transcription_path = cleaned_path
        else:
            transcription_path = input_path

        # Run diarization if requested and available
        diarization_turns = []
        if use_diarize:
            if not _HAS_DIARIZATION or state.diarization_pipeline is None:
                log.warning("Diarization requested but pipeline not available — skipping")
            else:
                diarization_turns = _run_diarization(transcription_path, num_spk)

        # Run transcription
        segments_gen, info = state.model.transcribe(
            transcription_path,
            beam_size=beam,
            task=task,
            language=resolved_lang,
            vad_filter=use_vad,
            word_timestamps=use_words,
        )

        result_segments = []
        for seg in segments_gen:
            words = (
                [{"word": w.word, "start": w.start, "end": w.end, "probability": w.probability}
                 for w in seg.words]
                if seg.words else []
            )
            result_segments.append({
                "id": seg.id,
                "start": seg.start,
                "end": seg.end,
                "text": seg.text,
                "words": words,
            })

        # Assign speakers if diarization was run
        if diarization_turns:
            result_segments = _assign_speakers_to_segments(result_segments, diarization_turns)

        elapsed = time.time() - start_time
        log.info("Transcription done: %d segments, lang=%s (%.1f%%), elapsed=%.1fs",
                 len(result_segments), info.language, info.language_probability * 100, elapsed)

        # Save to history
        filename = os.path.basename(input_path) if input_path else "unknown"
        _add_to_history(filename, info.language, result_segments, task, elapsed, input_path or "")

        return {
            "language": info.language,
            "language_probability": info.language_probability,
            "duration": info.duration,
            "segments": result_segments,
            "elapsed_seconds": round(elapsed, 2),
        }

    except Exception as exc:
        log.exception("Transcription failed")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if is_temp and input_path and os.path.exists(input_path):
            os.remove(input_path)
        if cleaned_path and cleaned_path != input_path and os.path.exists(cleaned_path):
            os.remove(cleaned_path)


@app.post("/export")
async def export_transcription(
    audio: Optional[UploadFile] = File(None),
    file_path: Optional[str] = Form(None),
    task: str = Form("transcribe"),
    language: Optional[str] = Form(None),
    vad_filter: str = Form("true"),
    word_timestamps: str = Form("true"),
    diarize: str = Form("false"),
    num_speakers: Optional[str] = Form(None),
    noise_suppression: str = Form("false"),
    format: str = Form("srt"),
):
    """Transcribe and return formatted output directly."""
    if format not in EXPORT_FORMATS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format}. Use: {EXPORT_FORMATS}")

    # Reuse transcription logic
    if state.model is None:
        raise HTTPException(status_code=400, detail="No model loaded.")
    if state.loading:
        raise HTTPException(status_code=400, detail="Model is loading.")

    input_path: Optional[str] = None
    is_temp = False
    cleaned_path: Optional[str] = None

    if file_path and os.path.exists(file_path):
        input_path = file_path
    elif audio:
        input_path = os.path.join(tempfile.gettempdir(), f"fw_export_{int(time.time())}_{audio.filename}")
        with open(input_path, "wb") as f:
            f.write(await audio.read())
        is_temp = True
    else:
        raise HTTPException(status_code=400, detail="No audio file or file_path provided.")

    use_vad = vad_filter.lower() in ("true", "1", "yes")
    use_words = word_timestamps.lower() in ("true", "1", "yes")
    use_diarize = diarize.lower() in ("true", "1", "yes")
    use_noise = noise_suppression.lower() in ("true", "1", "yes")
    num_spk = int(num_speakers) if num_speakers and num_speakers.isdigit() else None
    resolved_lang = language if language and language != "auto" else None

    try:
        if use_noise:
            cleaned_path = _apply_noise_suppression(input_path)
            tpath = cleaned_path
        else:
            tpath = input_path

        diarization_turns = []
        if use_diarize and _HAS_DIARIZATION and state.diarization_pipeline is not None:
            diarization_turns = _run_diarization(tpath, num_spk)

        segments_gen, info = state.model.transcribe(
            tpath, beam_size=5, task=task, language=resolved_lang,
            vad_filter=use_vad, word_timestamps=use_words,
        )

        result_segments = []
        for seg in segments_gen:
            words = (
                [{"word": w.word, "start": w.start, "end": w.end, "probability": w.probability}
                 for w in seg.words]
                if seg.words else []
            )
            result_segments.append({
                "id": seg.id, "start": seg.start, "end": seg.end,
                "text": seg.text, "words": words,
            })

        if diarization_turns:
            result_segments = _assign_speakers_to_segments(result_segments, diarization_turns)

        if format == "srt":
            content = _segments_to_srt(result_segments)
            media_type = "text/plain"
        elif format == "vtt":
            content = _segments_to_vtt(result_segments)
            media_type = "text/vtt"
        elif format == "json":
            content = _segments_to_json(result_segments, info.language, info.language_probability)
            media_type = "application/json"
        else:
            content = _segments_to_txt(result_segments)
            media_type = "text/plain"

        return JSONResponse(content={"format": format, "content": content, "language": info.language})

    except Exception as exc:
        log.exception("Export failed")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if is_temp and input_path and os.path.exists(input_path):
            os.remove(input_path)
        if cleaned_path and cleaned_path != input_path and os.path.exists(cleaned_path):
            os.remove(cleaned_path)


@app.get("/history")
async def get_history():
    return {"history": state.history}


@app.get("/history/{entry_id}")
async def get_history_entry(entry_id: int):
    for entry in state.history:
        if entry["id"] == entry_id:
            return entry
    raise HTTPException(status_code=404, detail="History entry not found")


@app.delete("/history")
async def clear_history():
    state.history = []
    return {"status": "cleared"}


@app.get("/cached-models")
async def get_cached_models():
    """List all locally cached Whisper models with their sizes."""
    cached = []
    try:
        cache_dir = os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub")
        if not os.path.isdir(cache_dir):
            # Try Windows AppData path
            cache_dir = os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub")
        if os.path.isdir(cache_dir):
            for folder in os.listdir(cache_dir):
                if folder.startswith("models--Systran--faster-whisper-"):
                    model_size = folder.replace("models--Systran--faster-whisper-", "")
                    folder_path = os.path.join(cache_dir, folder)
                    total_size = 0
                    for dirpath, dirnames, filenames in os.walk(folder_path):
                        for f in filenames:
                            fp = os.path.join(dirpath, f)
                            try:
                                total_size += os.path.getsize(fp)
                            except OSError:
                                pass
                    cached.append({
                        "size": model_size,
                        "folder": folder,
                        "bytes": total_size,
                        "label": _format_bytes(total_size),
                    })
    except Exception as e:
        log.warning("Error scanning cached models: %s", e)
    return {"cached": cached}


@app.delete("/cached-models/{model_size}")
async def delete_cached_model(model_size: str):
    """Delete a locally cached model to free disk space. Unloads if currently active."""
    # Unload first if this model is currently loaded
    if state.current_model_size == model_size and state.model is not None:
        del state.model
        state.model = None
        state.current_model_size = None
        state.device = None
        state.compute_type = None
        gc.collect()
        log.info("Auto-unloaded model %s before deletion", model_size)

    folder_name = f"models--Systran--faster-whisper-{model_size}"
    cache_dir = os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub")
    folder_path = os.path.join(cache_dir, folder_name)

    if not os.path.isdir(folder_path):
        raise HTTPException(status_code=404, detail=f"Model '{model_size}' not found in cache.")

    try:
        import shutil
        shutil.rmtree(folder_path)
        log.info("Deleted cached model: %s (%s)", model_size, folder_path)
        return {"status": "deleted", "model": model_size}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {e}")


if __name__ == "__main__":
    log.info("Starting Faster-Whisper Engine on 127.0.0.1:8181")
    uvicorn.run(app, host="127.0.0.1", port=8181, log_level="info")
