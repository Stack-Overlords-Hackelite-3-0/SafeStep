// Maps SafeStep's language codes to BCP-47 locales for the Web Speech APIs.
const SPEECH_LOCALES = { en: "en-US", si: "si-LK", ta: "ta-IN" };

export function speakText(text, language) {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel(); // don't overlap with a reply still being read
  const utterance = new SpeechSynthesisUtterance(text);
  const locale = SPEECH_LOCALES[language] || SPEECH_LOCALES.en;
  utterance.lang = locale;

  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang === locale) || voices.find((v) => v.lang?.startsWith(language));
  if (match) utterance.voice = match;
  // If no matching voice exists for si/ta (common on some OS/browsers), the
  // browser falls back to a default voice reading the text with the wrong
  // accent rather than failing silently - acceptable degradation.

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechRecognitionSupported() {
  return typeof window !== "undefined" && !!(window.MediaRecorder && navigator.mediaDevices?.getUserMedia);
}
