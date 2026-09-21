import {
  promptAudioUrl,
  promptKeyForText,
  sentenceAudioUrl,
  wordAudioUrl,
} from '@/lib/audioPaths'

/**
 * Temporary kill switch: the pre-rendered TTS audio was generated with shouty prosody baked
 * into the actual MP3s (see ROADMAP.md Phase 1.2) and re-rendering it needs an API key that
 * isn't available right now. Flip this back to `true` once the audio has been regenerated —
 * nothing else needs to change.
 */
const SOUND_ENABLED = false

let activeAudio: HTMLAudioElement | null = null

function cancelActiveAudio(): void {
  if (!activeAudio) return
  activeAudio.pause()
  activeAudio.currentTime = 0
  activeAudio.onended = null
  activeAudio.onerror = null
  activeAudio = null
}

/** Play a pre-rendered MP3 from /public/audio. Silent if the file is missing, fails, or SOUND_ENABLED is false. */
export function playAudioUrl(url: string, rate = 0.85, onEnd?: () => void): void {
  if (typeof window === 'undefined') return

  cancelActiveAudio()

  if (!SOUND_ENABLED) {
    // Still resolve onEnd asynchronously so callers that gate UI state on "audio finished"
    // (button pulse animations, auto-advance timers, etc.) behave exactly as if a very short
    // clip had played.
    if (onEnd) window.setTimeout(onEnd, 0)
    return
  }

  const audio = new Audio(url)
  audio.playbackRate = rate
  activeAudio = audio

  const finish = () => {
    if (activeAudio === audio) activeAudio = null
    onEnd?.()
  }

  audio.onended = finish
  audio.onerror = finish
  void audio.play().catch(finish)
}

export function speak(text: string, rate = 0.85): void {
  const trimmed = text.trim()
  if (!trimmed.includes(' ')) {
    playAudioUrl(wordAudioUrl(trimmed), rate)
    return
  }
  playAudioUrl(sentenceAudioUrl(trimmed), rate)
}

/** Grapheme tiles are visual-only. No audio playback. */
export function speakPhoneme(_phoneme: string): void {}

export function speakWord(word: string): void {
  playAudioUrl(wordAudioUrl(word), 0.8)
}

export function speakSentence(sentence: string): void {
  playAudioUrl(sentenceAudioUrl(sentence), 0.85)
}

export function speakInstruction(instruction: string): void {
  playAudioUrl(promptAudioUrl(promptKeyForText(instruction)), 0.9)
}

export function cancelSpeech(): void {
  cancelActiveAudio()
}

export function speakWithHooks(text: string, rate: number, onEnd: () => void): void {
  const trimmed = text.trim()
  if (!trimmed.includes(' ')) {
    playAudioUrl(wordAudioUrl(trimmed), rate, onEnd)
    return
  }
  if (/[.!?]$/.test(trimmed) && trimmed.length < 120) {
    playAudioUrl(promptAudioUrl(promptKeyForText(trimmed)), rate, onEnd)
    return
  }
  playAudioUrl(sentenceAudioUrl(trimmed), rate, onEnd)
}
