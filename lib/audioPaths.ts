/** Matches LessonEngine + download_tts.py filename rules under /public/audio/. */

export function normalizeAudioFilename(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function graphemeAudioUrl(grapheme: string): string {
  return `/audio/graphemes/${normalizeAudioFilename(grapheme)}.mp3`
}

export function wordAudioUrl(word: string): string {
  return `/audio/words/${normalizeAudioFilename(word)}.mp3`
}

export function sentenceAudioUrl(sentence: string): string {
  return `/audio/sentences/${normalizeAudioFilename(sentence)}.mp3`
}

/** Stable slug for prompt_* / feedback_* keys — must match scripts/extract_speech_segments.py */
export function speechSegmentSlug(text: string, maxLen = 40): string {
  const s = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const base = s || 'empty'
  return base.length > maxLen ? base.slice(0, maxLen).replace(/-$/, '') : base
}

export function promptKeyForText(text: string): string {
  return `prompt_${speechSegmentSlug(text)}`
}

/** Resolves speech_segments.json prompt_* keys to /public/audio/prompts/*.mp3 */
export function promptAudioUrl(promptKey: string): string {
  const slug = promptKey.startsWith('prompt_') ? promptKey.slice('prompt_'.length) : promptKey
  return `/audio/prompts/${slug}.mp3`
}

/** Spoken phoneme label (oo-short / oo-long → "oo"). */
export function graphemeSpeakText(grapheme: string): string {
  return grapheme === 'oo-short' || grapheme === 'oo-long' ? 'oo' : grapheme
}

export function graphemeAudioUrlForSpeak(grapheme: string): string {
  return graphemeAudioUrl(graphemeSpeakText(grapheme))
}
