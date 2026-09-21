/**
 * Orthographic rhyme detection: strips the real onset (the consonant sound(s) before the
 * vowel) and compares what's left (the rime: vowel + everything after). This replaces a much
 * older implementation that compared a fixed last-3-letters window, which broke on the most
 * common word shape in the curriculum: any 3-letter CVC word (cat/bat/hat never matched each
 * other, because the single onset letter was inside that fixed window) and on longer onsets
 * (shop/stop never matched, because "st" is two letters but the window only ever drops one).
 *
 * Purely spelling-based, not a pronouncing dictionary, so it won't catch every true phonetic
 * rhyme across different spellings (e.g. "know"/"no") — but it correctly handles same-family
 * words, which is what RhymeTime actually draws from (a single grapheme's own word list).
 * `RHYME_OVERRIDES` below covers the known exceptions where spelling and sound diverge badly
 * enough to matter (the "ough" family, which spans six unrelated vowel sounds in English).
 */

// Longest onset clusters first so greedy matching finds "str" before "s" + "tr".
const ONSET_CLUSTERS = [
  'scr', 'spl', 'spr', 'str', 'thr', 'shr', 'squ',
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm',
  'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'wr', 'wh', 'ch', 'sh', 'th', 'ph', 'qu', 'kn', 'gn',
].sort((a, b) => b.length - a.length)

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y'])

/** Known words whose spelling-based rime would be wrong. Grouped by real rhyme sound. */
const RHYME_OVERRIDES: Record<string, string> = {
  // /uː/ as in "food"
  through: 'ough:oo',
  // /ʌf/ as in "stuff"
  rough: 'ough:uff',
  tough: 'ough:uff',
  enough: 'ough:uff',
  // /ɒf/ as in "off"
  cough: 'ough:off',
  trough: 'ough:off',
  // unstressed /ə/
  thorough: 'ough:uh',
  borough: 'ough:uh',
  // /ɔːt/ as in "caught"
  thought: 'ough:ort',
  bought: 'ough:ort',
  brought: 'ough:ort',
  fought: 'ough:ort',
  sought: 'ough:ort',
  ought: 'ough:ort',
  nought: 'ough:ort',
  wrought: 'ough:ort',
  // /aʊ/ as in "shout"
  drought: 'ough:owt',
  though: 'ough:oh',
  although: 'ough:oh',
  dough: 'ough:oh',
  bough: 'ough:owt',
  plough: 'ough:owt',
}

function stripOnset(letters: string): string {
  for (const cluster of ONSET_CLUSTERS) {
    if (letters.startsWith(cluster) && letters.length > cluster.length) {
      return letters.slice(cluster.length)
    }
  }
  // Single-consonant onset, as long as it leaves a vowel behind.
  if (letters.length > 1 && !VOWELS.has(letters[0]!)) {
    return letters.slice(1)
  }
  return letters
}

/** Orthographic rime key for a word: used to decide whether two words are shown as rhyming. */
export function rimeKey(word: string): string {
  const letters = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!letters) return letters

  const override = RHYME_OVERRIDES[letters]
  if (override) return override

  if (letters.length <= 2) return letters
  return stripOnset(letters)
}
