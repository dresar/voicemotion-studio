export function previewWithWebSpeech(text: string, language = "id-ID", rate = 1): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = language;
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const indonesianVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("id"));
  if (indonesianVoice) {
    utterance.voice = indonesianVoice;
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopWebSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
