// ─── App Language Definitions with Flags ────────────────────────────────────
// Each language the UI itself can be displayed in.

export type AppLanguage = {
  code: string;
  label: string;
  flag: string;
};

export const APP_LANGUAGES: AppLanguage[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "bg", label: "Български", flag: "🇧🇬" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
];

// ─── Translation Maps ───────────────────────────────────────────────────────
// Each key maps lang code → translated string

type T = Record<string, Record<string, string>>;

export const T: T = {
  // Sidebar
  "nav.transcribe": { en: "Transcribe", tr: "Transkript", de: "Transkribieren", fr: "Transcrire", es: "Transcribir", it: "Trascrivi", pt: "Transcrever", ru: "Транскрипция", zh: "转写", ja: "文字起こし", ko: "전사", ar: "تفريغ", hi: "लिप्यंतरण", nl: "Transcribeer", pl: "Transkrybuj", sv: "Transkribera" },
  "nav.history": { en: "History", tr: "Geçmiş", de: "Verlauf", fr: "Historique", es: "Historial", it: "Cronologia", pt: "Histórico", ru: "История", zh: "历史", ja: "履歴", ko: "기록", ar: "السجل", hi: "इतिहास", nl: "Geschiedenis", pl: "Historia", sv: "Historik" },
  "nav.settings": { en: "Settings", tr: "Ayarlar", de: "Einstellungen", fr: "Paramètres", es: "Configuración", it: "Impostazioni", pt: "Configurações", ru: "Настройки", zh: "设置", ja: "設定", ko: "설정", ar: "الإعدادات", hi: "सेटिंग्स", nl: "Instellingen", pl: "Ustawienia", sv: "Inställningar" },
  "nav.offline": { en: "Offline", tr: "Çevrimdışı", de: "Offline", fr: "Hors ligne", es: "Sin conexión", it: "Offline", pt: "Offline", ru: "Оффлайн", zh: "离线", ja: "オフライン", ko: "오프라인" },
  "nav.noModel": { en: "No model", tr: "Model yok", de: "Kein Modell", fr: "Pas de modèle", es: "Sin modelo", ru: "Нет модели", zh: "无模型", ja: "モデルなし", ko: "모델 없음" },
  "nav.localProcessing": { en: "100% Local", tr: "Yerel İşlem" },
  "nav.processing": { en: "Processing…", tr: "İşleniyor…" },

  // Transcribe Page
  "transcribe.title": { en: "Transcribe", tr: "Transkript", de: "Transkribieren", fr: "Transcrire", es: "Transcribir", ru: "Транскрипция", zh: "转写", ja: "文字起こし", ko: "전사" },
  "transcribe.translate": { en: "Translate", tr: "Çevir", de: "Übersetzen", fr: "Traduire", es: "Traducir", ru: "Перевести", zh: "翻译", ja: "翻訳", ko: "번역" },
  "transcribe.sourceLang": { en: "Source Language", tr: "Kaynak Dil", de: "Quellsprache", fr: "Langue source", es: "Idioma origen", ru: "Исходный язык", zh: "源语言", ja: "元の言語", ko: "원본 언어" },
  "transcribe.targetLang": { en: "Target Language", tr: "Hedef Dil", de: "Zielsprache", fr: "Langue cible", es: "Idioma destino", ru: "Целевой язык", zh: "目标语言", ja: "翻訳先の言語", ko: "대상 언어" },
  "transcribe.dropHere": { en: "Drop audio/video file here", tr: "Ses/video dosyasını buraya sürükle", de: "Audio/Video-Datei hier ablegen", fr: "Déposez le fichier audio/vidéo ici", es: "Suelta el archivo aquí", ru: "Перетащите файл сюда", zh: "拖放音频/视频文件", ja: "ファイルをここにドロップ", ko: "파일을 여기에 놓으세요" },
  "transcribe.orBrowse": { en: "or browse", tr: "veya dosya seç", de: "oder durchsuchen", fr: "ou parcourir", es: "o explorar", ru: "или выберите файл", zh: "或浏览", ja: "またはファイルを選択", ko: "또는 찾아보기" },
  "transcribe.processing": { en: "Processing…", tr: "İşleniyor…", de: "Verarbeitung…", fr: "Traitement…", es: "Procesando…", ru: "Обработка…", zh: "处理中…", ja: "処理中…", ko: "처리 중…" },
  "transcribe.complete": { en: "Complete!", tr: "Tamamlandı!", de: "Fertig!", fr: "Terminé !", es: "¡Completado!", ru: "Готово!", zh: "完成!", ja: "完了!", ko: "완료!" },
  "transcribe.placeholder": { en: "Transcription will appear here.", tr: "Transkript burada görünecek.", de: "Transkription wird hier angezeigt.", fr: "La transcription apparaîtra ici.", ru: "Транскрипция появится здесь.", zh: "转写结果将显示在这里。", ja: "文字起こし結果がここに表示されます。", ko: "전사 결과가 여기에 표시됩니다." },
  "transcribe.selectFile": { en: "Click to select audio or video file", tr: "Ses veya video dosyası seçmek için tıklayın" },
  "transcribe.formats": { en: "MP3 · WAV · M4A · FLAC · MP4 · MKV · MOV", tr: "MP3 · WAV · M4A · FLAC · MP4 · MKV · MOV" },
  "transcribe.readyToProcess": { en: "Ready to process", tr: "İşleme hazır" },
  "transcribe.change": { en: "Change", tr: "Değiştir" },
  "transcribe.clear": { en: "Clear", tr: "Temizle" },
  "transcribe.configure": { en: "Configure options above, then click Transcribe or Translate.", tr: "Yukarıdaki seçenekleri yapılandırın, ardından Transkript veya Çevir düğmesine tıklayın." },
  "transcribe.transcriptionComplete": { en: "Transcription Complete", tr: "Transkript Tamamlandı" },
  "transcribe.translationComplete": { en: "Translation Complete", tr: "Çeviri Tamamlandı" },
  "transcribe.timeline": { en: "Timeline", tr: "Zaman Çizelgesi" },
  "transcribe.copyAll": { en: "Copy All", tr: "Tümünü Kopyala" },
  "transcribe.copied": { en: "Copied!", tr: "Kopyalandı!" },
  "transcribe.segments": { en: "segments", tr: "segment" },
  "transcribe.noCachedModels": { en: "No cached models found.", tr: "Önbellekte model bulunamadı." },
  "transcribe.firstDownload": { en: "First download only. Model is cached locally after.", tr: "Yalnızca ilk indirme. Model daha sonra yerel olarak önbelleğe alınır." },
  "transcribe.loadingModel": { en: "Loading model…", tr: "Model yükleniyor…" },
  "transcribe.switchingModel": { en: "Switching…", tr: "Değiştiriliyor…" },
  "transcribe.loadModel": { en: "Load Model", tr: "Modeli Yükle" },
  "transcribe.switchModel": { en: "Switch Model", tr: "Model Değiştir" },
  "transcribe.autoDetect": { en: "Auto-Detect", tr: "Otomatik Algıla" },
  "transcribe.cudaNvidia": { en: "CUDA — NVIDIA GPU", tr: "CUDA — NVIDIA GPU" },
  "transcribe.cpuOnly": { en: "CPU", tr: "CPU" },
  "transcribe.noCudaGpu": { en: "No CUDA GPU detected — using CPU", tr: "CUDA GPU algılanmadı — CPU kullanılıyor" },
  "transcribe.gpuDetected": { en: "GPU Detected: {name}", tr: "GPU Algılandı: {name}" },
  "transcribe.model": { en: "Model", tr: "Model" },
  "transcribe.device": { en: "Device", tr: "Cihaz" },
  "transcribe.active": { en: "(active)", tr: "(aktif)" },
  "transcribe.retry": { en: "Retry", tr: "Tekrar Dene" },
  "transcribe.loadDiarization": { en: "Load Diarization (Optional)", tr: "Diarizasyon Yükle (İsteğe Bağlı)" },
  "transcribe.loadingDiarization": { en: "Loading Diarization…", tr: "Diarizasyon Yükleniyor…" },
  "transcribe.reloadDiarization": { en: "Reload Diarization", tr: "Diarizasyonu Yeniden Yükle" },
  "transcribe.diarizationNoToken": { en: "SpeechBrain · No token required", tr: "SpeechBrain · Token gerekmez" },
  "transcribe.showAllLanguages": { en: "Show all {count} languages…", tr: "Tüm {count} dili göster…" },
  "transcribe.searchLanguage": { en: "Search language…", tr: "Dil ara…" },

  // Advanced Options
  "options.title": { en: "Advanced Options", tr: "Gelişmiş Seçenekler", de: "Erweiterte Optionen", fr: "Options avancées", es: "Opciones avanzadas", ru: "Расширенные настройки", zh: "高级选项", ja: "詳細設定", ko: "고급 옵션" },
  "options.vad": { en: "VAD Filter", tr: "VAD Filtresi", de: "VAD-Filter", fr: "Filtre VAD", es: "Filtro VAD", ru: "Фильтр VAD", zh: "VAD 过滤", ja: "VADフィルター", ko: "VAD 필터" },
  "options.vadDesc": { en: "Skip silence", tr: "Sessizlikleri atla", de: "Stille überspringen", fr: "Ignorer le silence", ru: "Пропускать тишину", zh: "跳过静音" },
  "options.words": { en: "Word Timestamps", tr: "Kelime Zamanı", de: "Wort-Zeitstempel", fr: "Horodatage des mots", es: "Marcas de palabras", ru: "Метки слов", zh: "词级时间戳" },
  "options.wordsDesc": { en: "Per-word timing", tr: "Kelime bazlı zamanlama", de: "Wortgenaues Timing", fr: "Timing par mot", ru: "Временные метки слов", zh: "逐词时间" },
  "options.diarize": { en: "Speaker Diarization", tr: "Konuşmacı Ayrımı", de: "Sprechererkennung", fr: "Diarisation", es: "Diarización", ru: "Диаризация", zh: "说话人分离" },
  "options.diarizeDesc": { en: "Identify speakers", tr: "Konuşmacıları tanı", de: "Sprecher identifizieren", fr: "Identifier les locuteurs", ru: "Определить говорящих", zh: "识别说话人" },
  "options.noise": { en: "Noise Suppression", tr: "Gürültü Bastırma", de: "Rauschunterdrückung", fr: "Suppression du bruit", es: "Supresión de ruido", ru: "Шумоподавление", zh: "降噪" },
  "options.noiseDesc": { en: "Clean audio", tr: "Sesi temizle", de: "Audio bereinigen", fr: "Nettoyer l'audio", ru: "Очистить звук", zh: "清理音频" },
  "options.numSpeakers": { en: "Num. Speakers", tr: "Konuşmacı Sayısı", de: "Anzahl Sprecher", fr: "Nb. locuteurs", es: "N.º oradores", ru: "Кол-во говорящих", zh: "说话人数" },

  // Settings
  "settings.title": { en: "Model & Engine Settings", tr: "Model ve Motor Ayarları", de: "Modell- & Engine-Einstellungen", fr: "Paramètres du modèle", es: "Configuración del modelo", ru: "Настройки модели", zh: "模型设置", ja: "モデル設定", ko: "모델 설정" },
  "settings.appLanguage": { en: "App Language", tr: "Uygulama Dili", de: "App-Sprache", fr: "Langue de l'app", es: "Idioma de la app", ru: "Язык приложения", zh: "应用语言", ja: "アプリ言語", ko: "앱 언어" },
  "settings.model": { en: "Model", tr: "Model", de: "Modell", fr: "Modèle", es: "Modelo", ru: "Модель", zh: "模型" },
  "settings.device": { en: "Device", tr: "Cihaz", de: "Gerät", fr: "Appareil", es: "Dispositivo", ru: "Устройство", zh: "设备" },
  "settings.loadModel": { en: "Load Model", tr: "Modeli Yükle", de: "Modell laden", fr: "Charger le modèle", es: "Cargar modelo", ru: "Загрузить модель", zh: "加载模型", ja: "モデルを読み込む", ko: "모델 로드" },
  "settings.switchModel": { en: "Switch Model", tr: "Model Değiştir", de: "Modell wechseln", fr: "Changer de modèle", es: "Cambiar modelo", ru: "Сменить модель", zh: "切换模型", ja: "モデルを切り替え", ko: "모델 전환" },
  "settings.cachedModels": { en: "Cached Models", tr: "Önbellekteki Modeller", de: "Zwischengespeicherte Modelle", fr: "Modèles en cache", es: "Modelos en caché", ru: "Кэшированные модели", zh: "缓存模型", ja: "キャッシュ済みモデル", ko: "캐시된 모델" },
  "settings.deleteCache": { en: "Delete", tr: "Sil", de: "Löschen", fr: "Supprimer", es: "Eliminar", ru: "Удалить", zh: "删除", ja: "削除", ko: "삭제" },
  "settings.loadDiarization": { en: "Load Diarization (Optional)", tr: "Diarizasyon Yükle (İsteğe Bağlı)", de: "Diarisierung laden (Optional)", fr: "Charger la diarisation", es: "Cargar diarización", ru: "Загрузить диаризацию", zh: "加载说话人分离", ja: "ダイアライゼーションを読み込む", ko: "분할 로드 (선택)" },
  "settings.diarizationReady": { en: "Diarization Ready", tr: "Diarizasyon Hazır", de: "Diarisierung bereit", fr: "Diarisation prête", es: "Diarización lista", ru: "Диаризация готова", zh: "说话人分离就绪", ja: "準備完了", ko: "준비 완료" },
  "settings.about": { en: "About", tr: "Hakkında", de: "Über", fr: "À propos", es: "Acerca de", ru: "О программе", zh: "关于", ja: "概要", ko: "정보" },
  "settings.aboutDesc1": { en: "Faster-Whisper Elite uses CTranslate2 for optimized inference on your local GPU.", tr: "Faster-Whisper Elite, yerel GPU'nuzda optimize edilmiş çıkarım için CTranslate2 kullanır." },
  "settings.aboutDesc2": { en: "All audio processing happens 100% on your machine. No data is sent to any server.", tr: "Tüm ses işleme %100 makinenizde gerçekleşir. Hiçbir veri herhangi bir sunucuya gönderilmez." },
  "settings.aboutDesc3": { en: "Supported models: tiny (75 MB) → large-v3 (2.9 GB). Larger models are more accurate but require more VRAM.", tr: "Desteklenen modeller: tiny (75 MB) → large-v3 (2.9 GB). Daha büyük modeller daha doğru ancak daha fazla VRAM gerektirir." },

  // History
  "history.title": { en: "History", tr: "Geçmiş", de: "Verlauf", fr: "Historique", es: "Historial", ru: "История", zh: "历史", ja: "履歴", ko: "기록" },
  "history.clear": { en: "Clear All", tr: "Tümünü Sil", de: "Alle löschen", fr: "Tout effacer", es: "Borrar todo", ru: "Очистить всё", zh: "清空", ja: "すべて削除", ko: "전체 삭제" },
  "history.empty": { en: "No transcriptions yet.", tr: "Henüz transkript yok.", de: "Noch keine Transkriptionen.", fr: "Aucune transcription.", ru: "Пока нет транскрипций.", zh: "暂无转写记录。", ja: "まだ文字起こしがありません。", ko: "아직 전사 기록이 없습니다." },
  "history.segments": { en: "segments", tr: "segment", de: "Segmente", fr: "segments", es: "segmentos", ru: "сегментов", zh: "段", ja: "セグメント", ko: "세그먼트" },

  // Processing steps
  "processing.preparing": { en: "Preparing audio file…", tr: "Ses dosyası hazırlanıyor…", de: "Audiodatei wird vorbereitet…", fr: "Préparation du fichier…", ru: "Подготовка файла…", zh: "准备音频文件…", ja: "ファイルを準備中…", ko: "오디오 파일 준비 중…" },
  "processing.noiseReduction": { en: "Applying noise reduction…", tr: "Gürültü azaltma uygulanıyor…", de: "Rauschunterdrückung wird angewendet…", fr: "Réduction du bruit…", ru: "Шумоподавление…", zh: "正在降噪…", ja: "ノイズ除去を適用中…" },
  "processing.diarization": { en: "Analyzing speakers…", tr: "Konuşmacılar analiz ediliyor…", de: "Sprecher werden analysiert…", fr: "Analyse des locuteurs…", ru: "Анализ говорящих…", zh: "分析说话人…", ja: "話者を分析中…" },
  "processing.transcribing": { en: "Transcribing audio…", tr: "Ses transkribe ediliyor…", de: "Audio wird transkribiert…", fr: "Transcription en cours…", ru: "Транскрипция аудио…", zh: "正在转写音频…", ja: "音声を文字起こし中…" },
  "processing.translating": { en: "Translating audio…", tr: "Ses çevriliyor…", de: "Audio wird übersetzt…", fr: "Traduction en cours…", ru: "Перевод аудио…", zh: "正在翻译音频…", ja: "音声を翻訳中…" },
  "processing.finalizing": { en: "Finalizing results…", tr: "Sonuçlar hazırlanıyor…", de: "Ergebnisse werden finalisiert…", fr: "Finalisation…", ru: "Завершение…", zh: "正在生成结果…", ja: "結果を生成中…" },
  "processing.stepsComplete": { en: "{done} / {total} steps complete", tr: "{done} / {total} adım tamamlandı" },
  "processing.finalizing.segments": { en: "Processing {count} segments…", tr: "{count} segment işleniyor…" },
  "processing.finalizing.assign": { en: "Assigning speakers…", tr: "Konuşmacılar atanıyor…" },
  "processing.finalizing.history": { en: "Saving to history…", tr: "Geçmişe kaydediliyor…" },
  "processing.finalizing.cleanup": { en: "Cleaning up temporary files…", tr: "Geçici dosyalar temizleniyor…" },
  "processing.complete": { en: "Complete!", tr: "Tamamlandı!" },

  // Toasts
  "toast.engineStarting": { en: "Engine is starting... This takes a few seconds.", tr: "Motor başlıyor... Bu birkaç saniye sürer." },
  "toast.gpuDetected": { en: "GPU Detected: {name}", tr: "GPU Algılandı: {name}" },
  "toast.modelLoading": { en: "Loading model \"{name}\"… First run downloads the model.", tr: "Model \"{name}\" yükleniyor… İlk çalıştırmada model indirilir." },
  "toast.transcriptionComplete": { en: "Transcription complete!", tr: "Transkript tamamlandı!" },
  "toast.translationComplete": { en: "Translation complete!", tr: "Çeviri tamamlandı!" },

  // Errors
  "error.selectFile": { en: "Select a file first.", tr: "Önce bir dosya seçin." },
  "error.engineOffline": { en: "Engine is offline.", tr: "Motor çevrimdışı." },
  "error.loadModel": { en: "Load a model first.", tr: "Önce bir model yükleyin." },

  // File info
  "file.size": { en: "Size", tr: "Boyut" },
  "file.duration": { en: "Duration", tr: "Süre" },
  "file.auto": { en: "Auto", tr: "Otomatik" },
};

// ─── Translation Helper ────────────────────────────────────────────────────

export function t(key: string, lang: string): string {
  const entry = T[key];
  if (!entry) return key;
  return entry[lang] || entry["en"] || key;
}
