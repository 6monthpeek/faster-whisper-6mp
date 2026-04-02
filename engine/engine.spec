# -*- mode: python ; coding: utf-8 -*-

hiddenimports = [
    # FastAPI / Uvicorn
    'fastapi',
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'starlette',
    'starlette.middleware',
    'starlette.middleware.cors',
    'multipart',
    'python_multipart',
    
    # faster-whisper
    'faster_whisper',
    'faster_whisper.audio',
    'faster_whisper.feature_extractor',
    'faster_whisper.tokenizer',
    'faster_whisper.transcribe',
    'faster_whisper.utils',
    'faster_whisper.vad',
    
    # ctranslate2
    'ctranslate2',
    
    # huggingface_hub
    'huggingface_hub',
    'huggingface_hub.snapshot_download',
    'huggingface_hub.hf_api',
    'huggingface_hub.file_download',
    'huggingface_hub.utils',
    'huggingface_hub.constants',
    
    # tqdm
    'tqdm',
    'tqdm.std',
    'tqdm.auto',
    
    # torch
    'torch',
    
    # stdlib
    'logging',
    'threading',
    'json',
    'importlib',
]

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='engine',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
