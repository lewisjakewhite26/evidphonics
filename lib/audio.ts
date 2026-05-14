export function speak(text: string, rate = 0.85): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'
  utterance.rate = rate
  utterance.pitch = 1.0
  window.speechSynthesis.speak(utterance)
}

export function speakPhoneme(phoneme: string): void {
  speak(phoneme, 0.7)
}

export function speakWord(word: string): void {
  speak(word, 0.8)
}

export function speakSentence(sentence: string): void {
  speak(sentence, 0.85)
}

export function speakInstruction(instruction: string): void {
  speak(instruction, 0.9)
}

export function cancelSpeech(): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
}

export function speakWithHooks(text: string, rate: number, onEnd: () => void): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'
  utterance.rate = rate
  utterance.pitch = 1.0
  utterance.onend = onEnd
  utterance.onerror = onEnd
  window.speechSynthesis.speak(utterance)
}
