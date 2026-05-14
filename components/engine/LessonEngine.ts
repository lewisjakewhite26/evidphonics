import type {
  Activity,
  ActivityType,
  GraphemeData,
  LessonData,
  MeaningMatchData,
  MissingSoundWord,
  RhymeTimeData,
  RootHuntData,
  WordChangerData,
  WordChangerStep,
  WordSplitterData,
  WriteItData,
  WordBuilderData,
} from '@/data/types'
import { shuffle } from '@/lib/utils'

const CHECKLIST = ['Capital letter', 'Finger spaces', 'Full stop'] as [string, string, string]

function sample<T>(items: T[], count: number): T[] {
  if (count <= 0) return []
  if (items.length <= count) return [...items]
  return shuffle(items).slice(0, count)
}

function wordDedupeKey(w: string): string {
  return w.trim().toLowerCase()
}

function markWordsUsed(used: Set<string>, words: Iterable<string>): void {
  for (const w of words) {
    if (typeof w === 'string' && w.trim()) used.add(wordDedupeKey(w))
  }
}

/** Prefer words not yet used in this lesson; fall back to the full pool so activities never go empty. */
function sampleWordsPreferUnused(pool: string[], count: number, used: Set<string>): string[] {
  if (count <= 0) return []
  const uniqPool = [...new Set(pool.map((w) => w.trim()).filter(Boolean))]
  if (uniqPool.length === 0) return []
  const unused = uniqPool.filter((w) => !used.has(wordDedupeKey(w)))
  let picked = sample(unused, Math.min(count, unused.length))
  if (picked.length < count) {
    const need = count - picked.length
    const rest = uniqPool.filter((w) => !picked.includes(w))
    picked = [...picked, ...sample(rest, Math.min(need, rest.length))]
  }
  let guard = 0
  while (picked.length < count && guard++ < 24) {
    const fill = sample(uniqPool, 1)[0]
    if (!fill) break
    picked.push(fill)
  }
  picked = picked.slice(0, count)
  markWordsUsed(used, picked)
  return picked
}

function sentenceWordOverlapScore(text: string, used: Set<string>): number {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? []
  return words.reduce((n, w) => n + (used.has(w) ? 1 : 0), 0)
}

function pickWriteItSentences(
  sentences: GraphemeData['writeItSentences'],
  used: Set<string>,
  pinned: GraphemeData['pinned'],
): GraphemeData['writeItSentences'] {
  if (pinned?.writeItSentences) {
    for (const s of pinned.writeItSentences) {
      const words = s.text.toLowerCase().match(/[a-z']+/g) ?? []
      markWordsUsed(used, words)
    }
    return pinned.writeItSentences
  }
  if (sentences.length === 0) return []
  const ranked = [...sentences].sort(
    (a, b) => sentenceWordOverlapScore(a.text, used) - sentenceWordOverlapScore(b.text, used),
  )
  const chosen = ranked.slice(0, Math.min(3, ranked.length))
  for (const s of chosen) {
    const words = s.text.toLowerCase().match(/[a-z']+/g) ?? []
    markWordsUsed(used, words)
  }
  return chosen
}

function pickMissingWordSentences(
  pool: GraphemeData['missingWordSentences'],
  count: number,
  used: Set<string>,
  pinned: GraphemeData['pinned'],
): GraphemeData['missingWordSentences'] {
  if (pinned?.missingWordSentences) {
    markWordsUsed(
      used,
      pinned.missingWordSentences.map((s) => s.missingWord),
    )
    return pinned.missingWordSentences
  }
  if (pool.length === 0) return []
  const ranked = [...pool].sort(
    (a, b) =>
      (used.has(wordDedupeKey(a.missingWord)) ? 1 : 0) - (used.has(wordDedupeKey(b.missingWord)) ? 1 : 0),
  )
  let picked = sample(ranked, Math.min(count, ranked.length))
  if (picked.length < count) {
    const rest = pool.filter((s) => !picked.includes(s))
    picked = [...picked, ...sample(rest, Math.min(count - picked.length, rest.length))]
  }
  markWordsUsed(
    used,
    picked.map((s) => s.missingWord),
  )
  return picked.slice(0, count)
}

function pickOddOneOutSets(
  pool: GraphemeData['oddOneOutSets'],
  count: number,
  used: Set<string>,
  pinned: GraphemeData['pinned'],
): GraphemeData['oddOneOutSets'] {
  if (pinned?.oddOneOutSets) {
    for (const set of pinned.oddOneOutSets) {
      markWordsUsed(used, set.words)
    }
    return pinned.oddOneOutSets
  }
  if (pool.length === 0) return []
  const scored = pool.map((set) => ({
    set,
    score: set.words.reduce((n, w) => n + (used.has(wordDedupeKey(w)) ? 1 : 0), 0),
  }))
  scored.sort((a, b) => a.score - b.score)
  const ordered = scored.map((x) => x.set)
  let picked = sample(ordered, Math.min(count, ordered.length))
  if (picked.length < count) {
    const rest = pool.filter((s) => !picked.includes(s))
    picked = [...picked, ...sample(rest, Math.min(count - picked.length, rest.length))]
  }
  for (const set of picked) {
    markWordsUsed(used, set.words)
  }
  return picked.slice(0, count)
}

function normalizeAudioFilename(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function graphemeAudioUrl(grapheme: string): string {
  return `/audio/graphemes/${normalizeAudioFilename(grapheme)}.mp3`
}

function wordAudioUrl(word: string): string {
  return `/audio/words/${normalizeAudioFilename(word)}.mp3`
}

function selectRevisionGraphemes(current: GraphemeData, allGraphemes: GraphemeData[]): string[] {
  const samePhase = allGraphemes
    .filter((g) => g.phase === current.phase && g.grapheme !== current.grapheme)
    .map((g) => g.grapheme)
  const earlierPhases = allGraphemes
    .filter((g) => g.phase < current.phase)
    .map((g) => g.grapheme)

  const samePhaseSelection = sample(samePhase, 4)
  if (samePhaseSelection.length >= 4) return samePhaseSelection

  const needed = 4 - samePhaseSelection.length
  return [...samePhaseSelection, ...sample(earlierPhases, needed)]
}

function chooseWordBuilderTiles(
  word: string,
  graphemeData: GraphemeData,
  allGraphemes: GraphemeData[],
): { graphemes: string[]; distractors: string[] } {
  const seg = graphemeData.segments[word]
  const graphemes =
    Array.isArray(seg) && seg.length > 0 ? [...seg] : word.split('')

  const used = new Set(graphemes.map((g) => g.toLowerCase()))
  const pool: string[] = []

  for (const rel of graphemeData.relatedGraphemes) {
    const unit = rel.trim()
    if (!unit || used.has(unit.toLowerCase())) continue
    pool.push(unit)
  }

  const pair = allGraphemes.find((g) => g.grapheme === graphemeData.sortPair)
  if (pair?.segments) {
    for (const w of pair.words) {
      const arr = pair.segments[w]
      if (!Array.isArray(arr)) continue
      for (const token of arr) {
        const t = String(token).trim()
        if (!t || used.has(t.toLowerCase())) continue
        pool.push(t)
      }
    }
  }

  const unique = [...new Set(pool)]
  let distractors = sample(
    unique.filter((d) => !used.has(d.toLowerCase())),
    3,
  )

  const globalFallback = [
    'ai', 'ee', 'igh', 'oa', 'oo', 'ar', 'or', 'ur', 'ow', 'oi', 'ch', 'sh', 'th', 'ng', 'ck', 'qu', 'ph', 'wh',
  ]
  let guard = 0
  while (distractors.length < 3 && guard++ < 40) {
    const pick = sample(
      globalFallback.filter((x) => !used.has(x.toLowerCase()) && !distractors.includes(x)),
      1,
    )[0]
    if (!pick) break
    distractors.push(pick)
  }

  return { graphemes, distractors: distractors.slice(0, 3) }
}

/** Letters-only spelling used to find / mask the focus grapheme inside a word */
function primarySpellingFragment(graphemeId: string): string {
  const g = graphemeId.trim()
  const suffixMatch = g.match(/^-?\s*([a-z-]+)\s+suffix\s*$/i)
  if (suffixMatch) return suffixMatch[1].replace(/-/g, '')
  return g.replace(/[^a-z]/gi, '')
}

function wordContainsFragment(word: string, fragment: string): boolean {
  if (!fragment) return false
  return word.toLowerCase().includes(fragment.toLowerCase())
}

function maskFragmentInWord(word: string, fragment: string): string | null {
  const lowerW = word.toLowerCase()
  const f = fragment.toLowerCase()
  const i = lowerW.indexOf(f)
  if (i === -1) return null
  return word.slice(0, i) + '___' + word.slice(i + fragment.length)
}

function collectDistractorFragments(
  correct: string,
  graphemeData: GraphemeData,
  allGraphemes: GraphemeData[],
): string[] {
  const pool: string[] = []
  for (const id of graphemeData.relatedGraphemes) {
    const fr = primarySpellingFragment(id)
    if (fr && fr !== correct) pool.push(fr)
  }
  const pair = allGraphemes.find((g) => g.grapheme === graphemeData.sortPair)
  if (pair) {
    const fr = primarySpellingFragment(pair.grapheme)
    if (fr && fr !== correct) pool.push(fr)
  }
  const fallback = ['sh', 'ch', 'th', 'ph', 'wh', 'ng', 'ck', 'qu']
  for (const x of fallback) {
    if (x !== correct) pool.push(x)
  }
  return [...new Set(pool)].filter((x) => x.length > 0)
}

function buildMissingSoundWords(
  wordBank: GraphemeData,
  allGraphemes: GraphemeData[],
  used: Set<string>,
  phonemeSource: GraphemeData = wordBank,
): MissingSoundWord[] {
  const fragment = primarySpellingFragment(phonemeSource.grapheme)
  if (!fragment) return []
  let candidates = wordBank.words.filter((w) => wordContainsFragment(w, fragment))
  if (candidates.length === 0 && phonemeSource.keyword) candidates = [phonemeSource.keyword]
  const fresh = candidates.filter((w) => !used.has(wordDedupeKey(w)))
  const pickFrom = fresh.length ? fresh : candidates
  candidates = sample(pickFrom, Math.min(4, pickFrom.length))
  if (candidates.length === 0 && wordBank.words.length) {
    candidates = sampleWordsPreferUnused(wordBank.words, Math.min(4, wordBank.words.length), used)
  }

  const distractorPool = collectDistractorFragments(fragment, phonemeSource, allGraphemes)
  const words: MissingSoundWord[] = []

  for (const word of candidates) {
    const display = maskFragmentInWord(word, fragment)
    if (!display) continue
    let distractors = distractorPool.filter((d) => d !== fragment)
    distractors = sample(distractors, Math.min(3, distractors.length))
    const extras = ['sh', 'ch', 'th', 'ng', 'ck', 'qu', 'ph']
    let ei = 0
    while (distractors.length < 3) {
      const x = extras[ei++ % extras.length]
      if (x !== fragment && !distractors.includes(x)) distractors.push(x)
    }
    const options = shuffle([fragment, ...distractors.slice(0, 3)])
    const correctIndex = options.indexOf(fragment)
    words.push({
      word,
      display,
      missingPhoneme: fragment,
      options,
      correctIndex,
    })
  }

  if (words.length === 0 && fragment) {
    const word = phonemeSource.keyword || wordBank.words[0] || 'cat'
    let distractors = distractorPool.filter((d) => d !== fragment)
    distractors = sample(distractors, Math.min(3, distractors.length))
    const extras = ['sh', 'ch', 'th', 'ng']
    let ei = 0
    while (distractors.length < 3) {
      const x = extras[ei++ % extras.length]
      if (x !== fragment && !distractors.includes(x)) distractors.push(x)
    }
    const options = shuffle([fragment, ...distractors.slice(0, 3)])
    words.push({
      word,
      display: maskFragmentInWord(word, fragment) ?? word,
      missingPhoneme: fragment,
      options,
      correctIndex: options.indexOf(fragment),
    })
  }

  markWordsUsed(
    used,
    words.map((w) => w.word),
  )

  return words.slice(0, 4)
}

function rimeKey(w: string): string {
  const s = w.toLowerCase().replace(/[^a-z]/g, '')
  if (s.length <= 2) return s
  return s.slice(-3)
}

function pairDedupeKey(a: string, b: string): string {
  return a <= b ? `${a}|${b}` : `${b}|${a}`
}

function buildRhymeTimePairs(
  graphemeData: GraphemeData,
  comparison: GraphemeData | undefined,
  used: Set<string>,
): RhymeTimeData['pairs'] {
  const preferUnused = (pool: string[]) => {
    const fresh = pool.filter((w) => !used.has(wordDedupeKey(w)))
    return fresh.length ? fresh : pool
  }

  const focus = [...new Set(graphemeData.words.map((w) => w.trim()).filter(Boolean))]
  const other =
    comparison?.words?.length ? [...new Set(comparison.words.map((w) => w.trim()).filter(Boolean))] : []

  const totalPairs = 6 + Math.floor(Math.random() * 3)
  const targetRhyme = Math.round(totalPairs / 2)
  const targetNon = totalPairs - targetRhyme

  const rhymeOptions: RhymeTimeData['pairs'] = []
  const byRime = new Map<string, string[]>()
  for (const w of focus) {
    const k = rimeKey(w)
    if (!byRime.has(k)) byRime.set(k, [])
    byRime.get(k)!.push(w)
  }
  const seenR = new Set<string>()
  for (const arr of byRime.values()) {
    const uniq = [...new Set(arr)]
    if (uniq.length < 2) continue
    const pool = preferUnused(uniq)
    if (pool.length < 2) continue
    const [a, b] = sample(pool, 2)
    const pk = pairDedupeKey(a, b)
    if (seenR.has(pk)) continue
    seenR.add(pk)
    rhymeOptions.push({ word1: a, word2: b, rhymes: true })
  }

  const nonOptions: RhymeTimeData['pairs'] = []
  const seenN = new Set<string>()
  const outerPool = other.length ? other : focus
  for (let iter = 0; iter < 500 && nonOptions.length < Math.max(targetNon + 4, 8); iter++) {
    const w1 = sample(preferUnused(focus), 1)[0]
    const candidates = outerPool.filter((w) => w !== w1 && rimeKey(w) !== rimeKey(w1))
    const w2 = sample(preferUnused(candidates), 1)[0]
    if (!w1 || !w2) continue
    const pk = pairDedupeKey(w1, w2)
    if (seenN.has(pk)) continue
    seenN.add(pk)
    nonOptions.push({ word1: w1, word2: w2, rhymes: false })
  }

  let rhymeSel = shuffle([...rhymeOptions]).slice(0, targetRhyme)
  let nonSel = shuffle([...nonOptions]).slice(0, targetNon)

  let guard = 0
  while (rhymeSel.length < targetRhyme && rhymeOptions.length > 0 && guard++ < 50) {
    const extra = sample(rhymeOptions, 1)[0]
    if (!extra) break
    const pk = pairDedupeKey(extra.word1, extra.word2)
    if (rhymeSel.some((x) => pairDedupeKey(x.word1, x.word2) === pk)) continue
    rhymeSel.push(extra)
  }

  guard = 0
  while (nonSel.length < targetNon && guard++ < 80) {
    const w1 = sample(preferUnused(focus), 1)[0]
    const pool = other.length ? other.filter((w) => w !== w1) : focus.filter((w) => w !== w1)
    const w2 = sample(
      preferUnused(pool.filter((w) => rimeKey(w) !== rimeKey(w1))),
      1,
    )[0]
    if (!w2) continue
    const pk = pairDedupeKey(w1, w2)
    if (seenN.has(pk)) continue
    seenN.add(pk)
    nonSel.push({ word1: w1, word2: w2, rhymes: false })
  }

  let combined = shuffle([...rhymeSel, ...nonSel])

  guard = 0
  while (combined.length < totalPairs && focus.length >= 2 && guard++ < 40) {
    const w1 = sample(preferUnused(focus), 1)[0]
    const w2 = sample(
      preferUnused(focus.filter((w) => w !== w1)),
      1,
    )[0]
    if (!w2) break
    combined.push({ word1: w1, word2: w2, rhymes: rimeKey(w1) === rimeKey(w2) })
  }

  const out = combined.slice(0, totalPairs)
  for (const p of out) {
    markWordsUsed(used, [p.word1, p.word2])
  }
  return out
}

const QUICK_REVIEW_MAX = 12

function buildQuickReviewWordList(
  selection: GraphemeData[],
  merged: GraphemeData,
  pinned: GraphemeData['pinned'],
  usedWords: Set<string>,
): string[] {
  if (pinned?.quickReviewWords?.length) {
    const words = pinned.quickReviewWords.slice(0, QUICK_REVIEW_MAX)
    markWordsUsed(usedWords, words)
    return words
  }

  const dedupeAdd = (out: string[], w: string) => {
    const k = wordDedupeKey(w)
    if (out.some((x) => wordDedupeKey(x) === k)) return false
    out.push(w)
    return true
  }

  if (selection.length <= 1) {
    const all = merged.words
    const unused = shuffle(all.filter((w) => !usedWords.has(wordDedupeKey(w))))
    const usedPrior = shuffle(all.filter((w) => usedWords.has(wordDedupeKey(w))))
    const ordered = [...unused, ...usedPrior].slice(0, QUICK_REVIEW_MAX)
    markWordsUsed(usedWords, ordered)
    return ordered
  }

  const n = selection.length
  const base = Math.floor(QUICK_REVIEW_MAX / n)
  const extra = QUICK_REVIEW_MAX - base * n
  const targets = selection.map((_, i) => base + (i < extra ? 1 : 0))

  const pools = selection.map((g) =>
    shuffle([...new Set(g.words.map((w) => w.trim()).filter(Boolean))]),
  )

  const result: string[] = []

  for (let i = 0; i < n; i++) {
    const need = targets[i]!
    const pool = pools[i]!
    let taken = 0
    const preferUnused = pool.filter(
      (w) => !usedWords.has(wordDedupeKey(w)) && !result.some((x) => wordDedupeKey(x) === wordDedupeKey(w)),
    )
    const rest = pool.filter((w) => !result.some((x) => wordDedupeKey(x) === wordDedupeKey(w)))
    const order = [...preferUnused, ...rest.filter((w) => !preferUnused.includes(w))]
    for (const w of order) {
      if (taken >= need) break
      if (dedupeAdd(result, w)) taken++
    }
  }

  let guard = 0
  while (result.length < QUICK_REVIEW_MAX && guard++ < 200) {
    let addedAny = false
    for (let i = 0; i < n && result.length < QUICK_REVIEW_MAX; i++) {
      const pool = pools[i]!
      for (const w of pool) {
        if (result.length >= QUICK_REVIEW_MAX) break
        if (dedupeAdd(result, w)) {
          addedAny = true
          break
        }
      }
    }
    if (!addedAny) break
  }

  markWordsUsed(usedWords, result)
  return result
}

function dedupeLooseStrings(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of items) {
    const t = raw.trim()
    if (!t) continue
    const k = wordDedupeKey(t)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out
}

function mergeGraphemeSources(selection: GraphemeData[]): GraphemeData {
  if (selection.length === 0) {
    throw new Error('mergeGraphemeSources requires at least one grapheme')
  }
  if (selection.length === 1) return selection[0]!

  const primary = selection[0]!
  const words = dedupeLooseStrings(selection.flatMap((g) => g.words))
  const alienWords = dedupeLooseStrings(selection.flatMap((g) => g.alienWords))
  const segments: Record<string, string[]> = {}
  for (const g of selection) {
    for (const [word, segs] of Object.entries(g.segments)) {
      if (!segments[word] && Array.isArray(segs) && segs.length > 0) {
        segments[word] = [...segs]
      }
    }
  }

  const missingWordSentences: GraphemeData['missingWordSentences'] = []
  const seenM = new Set<string>()
  for (const g of selection) {
    for (const s of g.missingWordSentences) {
      const k = `${s.text}|${s.missingWord}`
      if (seenM.has(k)) continue
      seenM.add(k)
      missingWordSentences.push(s)
    }
  }

  const oddOneOutSets: GraphemeData['oddOneOutSets'] = []
  const seenO = new Set<string>()
  for (const g of selection) {
    for (const set of g.oddOneOutSets) {
      const k = [...set.words].map((w) => wordDedupeKey(w)).sort().join('|')
      if (seenO.has(k)) continue
      seenO.add(k)
      oddOneOutSets.push(set)
    }
  }

  const writeItSentences: GraphemeData['writeItSentences'] = []
  const seenW = new Set<string>()
  for (const g of selection) {
    for (const s of g.writeItSentences) {
      if (seenW.has(s.text)) continue
      seenW.add(s.text)
      writeItSentences.push(s)
    }
  }

  const trickyByWord = new Map<string, GraphemeData['trickyWords'][number]>()
  for (const g of selection) {
    for (const t of g.trickyWords) {
      const k = wordDedupeKey(t.word)
      if (!trickyByWord.has(k)) trickyByWord.set(k, t)
    }
  }

  const relatedGraphemes = dedupeLooseStrings(selection.flatMap((g) => g.relatedGraphemes))

  return {
    grapheme: primary.grapheme,
    keyword: primary.keyword,
    phase: Math.max(...selection.map((s) => s.phase)),
    words,
    alienWords,
    segments,
    sortPair: primary.sortPair,
    relatedGraphemes,
    missingWordSentences,
    oddOneOutSets,
    writeItSentences,
    trickyWords: [...trickyByWord.values()],
    pinned: null,
  }
}

const AFFIX_MEANINGS: Record<string, string> = {
  'un-': 'not',
  're-': 'again',
  'dis-': 'not / opposite',
  'mis-': 'wrongly',
  '-ful': 'full of',
  '-less': 'without',
  '-ness': 'state of',
  '-ly': 'in that way',
  '-ment': 'the result of',
  tion: 'the act of',
  sion: 'the act of',
  ssion: 'the act of',
  cian: 'a person who',
  '-tion suffix': 'the act of',
}

function affixMeaningLabel(graphemeId: string): string {
  return AFFIX_MEANINGS[graphemeId] ?? 'related to this affix'
}

function shoutMeaning(meaning: string): string {
  return meaning.split('/')[0]!.trim().toUpperCase()
}

function meaningHintSentence(graphemeId: string, root: string, result: string): string {
  const gloss = affixMeaningLabel(graphemeId)
  const shout = shoutMeaning(gloss)
  return `${graphemeId} means ${shout} → ${result} means ${shout} ${root}`
}

function getPrefixLetters(graphemeId: string): string | null {
  if (graphemeId.endsWith('-') && !graphemeId.startsWith('-')) {
    return graphemeId.slice(0, -1).toLowerCase()
  }
  return null
}

function getSuffixLetters(graphemeId: string): string | null {
  if (graphemeId.startsWith('-')) {
    const inner = graphemeId.slice(1).toLowerCase()
    return inner === 'tion suffix' ? 'tion' : inner
  }
  const bare = ['tion', 'sion', 'ssion', 'cian'] as const
  if ((bare as readonly string[]).includes(graphemeId)) return graphemeId.toLowerCase()
  return null
}

function splitMorph(
  word: string,
  graphemeId: string,
): { root: string; result: string; prefix?: string; suffix?: string } | null {
  const w = word.trim()
  if (!w) return null
  const low = w.toLowerCase()
  const pre = getPrefixLetters(graphemeId)
  if (pre && low.startsWith(pre)) {
    const root = w.slice(pre.length)
    if (root.length < 2) return null
    return { root, result: w, prefix: pre }
  }
  const suf = getSuffixLetters(graphemeId)
  if (suf && low.endsWith(suf)) {
    const root = w.slice(0, w.length - suf.length)
    if (root.length < 2) return null
    return { root, result: w, suffix: suf }
  }
  return null
}

/** Curriculum morpheme chunks (when they reassemble the word) beat naive affix stripping for Word Changer. */
function wordChangerStepFromMorphemes(
  word: string,
  graphemeId: string,
  morphemes: string[],
): import('@/data/types').WordChangerStep | null {
  const w = word.trim()
  if (morphemes.length < 2) return null
  if (morphemes.join('').toLowerCase() !== w.toLowerCase()) return null
  const tail = morphemes.slice(1).join('')
  const wlow = w.toLowerCase()
  if (tail && wlow.endsWith(tail.toLowerCase())) {
    const root = morphemes[0]!
    return {
      root,
      result: w,
      suffix: tail,
      meaningHint: meaningHintSentence(graphemeId, root, w),
    }
  }
  const head = morphemes.slice(0, -1).join('')
  if (head && wlow.startsWith(head.toLowerCase())) {
    const root = morphemes[morphemes.length - 1]!
    return {
      root,
      result: w,
      prefix: head,
      meaningHint: meaningHintSentence(graphemeId, root, w),
    }
  }
  return null
}

function rootSpanInWord(word: string, root: string): { rootStart: number; rootEnd: number } | null {
  const i = word.toLowerCase().indexOf(root.toLowerCase())
  if (i < 0) return null
  return { rootStart: i, rootEnd: i + root.length }
}

function segmentsJoinMatchesWord(word: string, segments: string[]): boolean {
  return segments.join('').toLowerCase() === word.trim().toLowerCase()
}

function rolesForSegments(
  word: string,
  graphemeId: string,
  segments: string[],
): ('prefix' | 'root' | 'suffix')[] | null {
  if (!segmentsJoinMatchesWord(word, segments)) return null
  const m = splitMorph(word, graphemeId)
  const wl = word.length
  const preLen = m?.prefix?.length ?? 0
  const sufLen = m?.suffix?.length ?? 0
  const sufStart = sufLen > 0 ? wl - sufLen : wl
  let pos = 0
  return segments.map((seg) => {
    const start = pos
    pos += seg.length
    const mid = (start + pos) / 2
    if (preLen > 0 && mid < preLen) return 'prefix'
    if (sufLen > 0 && mid >= sufStart) return 'suffix'
    return 'root'
  })
}

/** Role each morpheme chunk using an explicit curriculum root substring (e.g. `roots[word]`). */
function rolesForWordBoundaryChunks(
  word: string,
  chunks: string[],
  explicitRoot: string,
): ('prefix' | 'root' | 'suffix')[] | null {
  if (!segmentsJoinMatchesWord(word, chunks)) return null
  const w = word.trim()
  const span = rootSpanInWord(w, explicitRoot)
  if (!span) return null
  const { rootStart, rootEnd } = span
  let pos = 0
  return chunks.map((seg) => {
    const start = pos
    const end = pos + seg.length
    pos = end
    if (end <= rootStart) return 'prefix'
    if (start >= rootEnd) return 'suffix'
    if (start >= rootStart && end <= rootEnd) return 'root'
    const overlap = Math.min(end, rootEnd) - Math.max(start, rootStart)
    if (overlap >= seg.length / 2) return 'root'
    if (start < rootStart) return 'prefix'
    return 'suffix'
  })
}

function buildWordSplitterItemFromSegments(
  word: string,
  graphemeId: string,
  segments: string[],
  explicitRoot?: string,
): import('@/data/types').WordSplitterItem | null {
  let roles: ('prefix' | 'root' | 'suffix')[] | null = null
  if (explicitRoot) {
    roles = rolesForWordBoundaryChunks(word, segments, explicitRoot)
  }
  if (!roles) roles = rolesForSegments(word, graphemeId, segments)
  if (!roles) return null
  const morphemes: string[] = []
  const mergedRoles: ('prefix' | 'root' | 'suffix')[] = []
  for (let i = 0; i < segments.length; i++) {
    const r = roles[i] ?? 'root'
    const seg = segments[i]!
    if (mergedRoles.length > 0 && mergedRoles[mergedRoles.length - 1] === r) {
      morphemes[morphemes.length - 1] = `${morphemes[morphemes.length - 1]!}${seg}`
    } else {
      morphemes.push(seg)
      mergedRoles.push(r)
    }
  }
  return { word, morphemes, morphemeRoles: mergedRoles }
}

function buildMorphologyActivities(
  idSlug: string,
  selection: GraphemeData[],
  usedWords: Set<string>,
  allGraphemes: GraphemeData[],
): Activity[] {
  const out: Activity[] = []

  const changerSteps: WordChangerStep[] = []
  for (const g of shuffle([...selection])) {
    const n = 3 + Math.floor(Math.random() * 3)
    const pool = shuffle(
      g.words.filter((w) => {
        if (splitMorph(w, g.grapheme)) return true
        const mor = g.morphemes?.[w]
        return Boolean(mor && wordChangerStepFromMorphemes(w, g.grapheme, mor))
      }),
    )
    const picked = pool.slice(0, Math.min(n, pool.length))
    for (const w of picked) {
      const mor = g.morphemes?.[w]
      const fromMor = mor ? wordChangerStepFromMorphemes(w, g.grapheme, mor) : null
      if (fromMor) {
        changerSteps.push(fromMor)
      } else {
        const m = splitMorph(w, g.grapheme)
        if (!m) continue
        changerSteps.push({
          root: m.root,
          result: m.result,
          prefix: m.prefix,
          suffix: m.suffix,
          meaningHint: meaningHintSentence(g.grapheme, m.root, m.result),
        })
      }
      markWordsUsed(usedWords, [w])
    }
  }
  shuffle(changerSteps)
  if (changerSteps.length) {
    out.push({
      id: `${idSlug}-wordChanger`,
      type: 'wordChanger',
      title: 'Word Changer',
      emoji: '🔄',
      instruction: 'Compare the root and the new word. Tap what changed, then move on.',
      steps: changerSteps,
    } satisfies WordChangerData)
  }

  const splitterCandidates: { word: string; graphemeId: string; segments: string[]; explicitRoot?: string }[] = []
  for (const g of selection) {
    for (const w of g.words) {
      const segs = g.morphemes?.[w] ?? g.segments[w]
      const explicitRoot = g.roots?.[w]
      if (Array.isArray(segs) && segs.length > 0 && segmentsJoinMatchesWord(w, segs)) {
        splitterCandidates.push({ word: w, graphemeId: g.grapheme, segments: segs, explicitRoot })
      }
    }
  }
  const splitTarget = Math.min(6, Math.max(4, splitterCandidates.length))
  const splitPicked = shuffle(splitterCandidates).slice(0, splitTarget)
  const splitterItems = splitPicked
    .map(({ word, graphemeId, segments, explicitRoot }) =>
      buildWordSplitterItemFromSegments(word, graphemeId, segments, explicitRoot),
    )
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
  if (splitterItems.length) {
    markWordsUsed(
      usedWords,
      splitterItems.map((i) => i.word),
    )
    out.push({
      id: `${idSlug}-wordSplitter`,
      type: 'wordSplitter',
      title: 'Word Splitter',
      emoji: '✂️',
      instruction: 'Say the word, then read it in chunks.',
      items: splitterItems,
    } satisfies WordSplitterData)
  }

  const selectedAffixes = dedupeLooseStrings(selection.map((g) => g.grapheme))
  const pairCount = Math.min(6, Math.max(4, selectedAffixes.length))
  const extraAffixes = shuffle(Object.keys(AFFIX_MEANINGS)).filter((k) => !selectedAffixes.includes(k))
  const orderedAffixes = dedupeLooseStrings([...shuffle(selectedAffixes), ...extraAffixes])
  const pairs = orderedAffixes.slice(0, pairCount).map((affix) => {
    const source = allGraphemes.find((x) => x.grapheme === affix)
    const ex = sample((source?.words ?? []).filter(Boolean), 3)
    return {
      affix,
      meaning: affixMeaningLabel(affix),
      examples: ex,
    }
  })
  if (pairs.length >= 2) {
    out.push({
      id: `${idSlug}-meaningMatch`,
      type: 'meaningMatch',
      title: 'Meaning Match',
      emoji: '🧩',
      instruction: 'Pick the meaning that fits this affix — two choices.',
      pairs,
    } satisfies MeaningMatchData)
  }

  type HuntCand = { word: string; root: string; rootStart: number; rootEnd: number }
  const huntCands: HuntCand[] = []
  for (const g of selection) {
    for (const w of g.words) {
      const mor = g.morphemes?.[w]
      let root: string | null = null
      const ro = g.roots?.[w]
      if (ro && rootSpanInWord(w, ro)) root = ro
      else if (
        mor &&
        mor.length >= 2 &&
        mor.join('').toLowerCase() === w.trim().toLowerCase() &&
        mor[0] &&
        mor[0].length >= 2 &&
        rootSpanInWord(w, mor[0])
      ) {
        root = mor[0]
      }
      if (!root) {
        const m = splitMorph(w, g.grapheme)
        if (!m) continue
        root = m.root
      }
      if (root.length < 2) continue
      const span = rootSpanInWord(w, root)
      if (!span) continue
      huntCands.push({ word: w, root, ...span })
    }
  }
  const allRoots = dedupeLooseStrings(huntCands.map((c) => c.root))
  const builtHunts: import('@/data/types').RootHuntItem[] = []
  for (const c of shuffle(huntCands)) {
    const len = c.root.length
    const others = shuffle(
      allRoots.filter((r) => wordDedupeKey(r) !== wordDedupeKey(c.root)),
    )
    const close = others.filter((r) => Math.abs(r.length - len) <= 2)
    const pool = close.length >= 2 ? close : others
    const distractors = pool.slice(0, 2)
    if (distractors.length < 2) continue
    builtHunts.push({
      ...c,
      distractorRoots: [distractors[0]!, distractors[1]!],
    })
    if (builtHunts.length >= 6) break
  }
  const huntCount =
    builtHunts.length >= 4 ? Math.min(6, builtHunts.length) : Math.min(builtHunts.length, 6)
  const huntSlice = builtHunts.slice(0, huntCount)
  if (huntSlice.length >= 2) {
    markWordsUsed(
      usedWords,
      huntSlice.map((h) => h.word),
    )
    out.push({
      id: `${idSlug}-rootHunt`,
      type: 'rootHunt',
      title: 'Root Hunt',
      emoji: '🔍',
      instruction: 'Find the root inside the word.',
      items: huntSlice,
    } satisfies RootHuntData)
  }

  return out
}

export function buildLessonFromGrapheme(
  graphemeData: GraphemeData,
  allGraphemes: GraphemeData[],
): LessonData {
  return buildLessonFromGraphemes([graphemeData], allGraphemes)
}

export function buildLessonFromGraphemes(
  sources: GraphemeData[],
  allGraphemes: GraphemeData[],
): LessonData {
  if (sources.length === 0) {
    throw new Error('buildLessonFromGraphemes requires at least one grapheme')
  }
  const selection = sources
  const merged = mergeGraphemeSources(selection)
  const pinned = merged.pinned
  const primary = selection[0]!
  const idSlug = selection.map((s) => s.grapheme).join('-')
  const comparison = allGraphemes.find((g) => g.grapheme === merged.sortPair)

  const speedyCore = selection.map((g) => ({
    grapheme: g.grapheme,
    keyword: g.keyword,
    audioUrl: graphemeAudioUrl(g.grapheme),
  }))

  let speedyRevisionObjs: Array<{
    grapheme: string
    keyword: string
    audioUrl: string
  }> = []

  if (selection.length <= 6) {
    const exclude = new Set(selection.map((s) => s.grapheme))
    const speedyRevisionRaw =
      selection.length === 1 && pinned?.speedyRevisionGraphemes?.length
        ? pinned.speedyRevisionGraphemes
        : selectRevisionGraphemes(primary, allGraphemes)
    const letters = speedyRevisionRaw.filter((gLetter) => !exclude.has(gLetter))
    speedyRevisionObjs = letters.map((gLetter) => {
      const match = allGraphemes.find((x) => x.grapheme === gLetter)
      return {
        grapheme: gLetter,
        keyword: match?.keyword ?? gLetter,
        audioUrl: graphemeAudioUrl(gLetter),
      }
    })
  }

  const speedy = {
    id: `${idSlug}-speedySounds`,
    type: 'speedySounds' as const,
    title: 'Speedy Sounds',
    emoji: '🎵',
    instruction: 'Say the sound when the card flips!',
    graphemes: [...speedyCore, ...speedyRevisionObjs],
  }

  const usedWords = new Set<string>()

  const blendWords = (() => {
    if (pinned?.blendWords?.length) {
      markWordsUsed(usedWords, pinned.blendWords)
      return pinned.blendWords
    }
    return sampleWordsPreferUnused(merged.words, 5, usedWords)
  })()
  const soundBlender = {
    id: `${idSlug}-soundBlender`,
    type: 'soundBlender' as const,
    title: 'Sound Blender',
    emoji: '🚀',
    instruction: 'Drag the rocket to blend the sounds!',
    words: blendWords.map((word) => ({
      word,
      audioUrl: wordAudioUrl(word),
      segments: (merged.segments[word] ?? word.split('')).map((segment) => ({
        grapheme: segment,
        audioUrl: graphemeAudioUrl(segment),
      })),
    })),
  }

  const trickyWordsSource = pinned?.trickyWords ?? merged.trickyWords
  const trickyTrapSlice = trickyWordsSource.slice(0, 5)
  markWordsUsed(
    usedWords,
    trickyTrapSlice.map((t) => t.word),
  )
  const trickyTrap: Activity | null =
    trickyWordsSource.length > 0
      ? {
          id: `${idSlug}-trickyTrap`,
          type: 'trickyTrap' as const,
          title: 'Tricky Trap',
          emoji: '💡',
          instruction: 'Tap the word to find the tricky part!',
          words: trickyTrapSlice.map((entry) => ({
            word: entry.word,
            trickyLetters: entry.trickyLetters,
            explanation: entry.explanation,
            audioUrl: wordAudioUrl(entry.word),
          })),
        }
      : null

  const missingSoundWords =
    pinned?.missingSoundWords ?? buildMissingSoundWords(merged, allGraphemes, usedWords, primary)
  if (pinned?.missingSoundWords) {
    markWordsUsed(
      usedWords,
      pinned.missingSoundWords.map((m) => m.word),
    )
  }
  const missingSound = {
    id: `${idSlug}-missingSound`,
    type: 'missingSound' as const,
    title: 'Missing Sound',
    emoji: '🔍',
    instruction: 'Tap the grapheme that completes the word!',
    words: missingSoundWords,
  }

  const rhymePairs =
    pinned?.rhymeTimePairs ?? buildRhymeTimePairs(merged, comparison, usedWords)
  if (pinned?.rhymeTimePairs) {
    for (const p of pinned.rhymeTimePairs) {
      markWordsUsed(usedWords, [p.word1, p.word2])
    }
  }
  const rhymeTime = {
    id: `${idSlug}-rhymeTime`,
    type: 'rhymeTime' as const,
    title: 'Rhyme Time' as const,
    emoji: '🎵' as const,
    instruction: 'Listen to both words. Do they rhyme?',
    pairs: rhymePairs,
  } satisfies RhymeTimeData

  const soundSort =
    selection.length >= 2
      ? (() => {
          const g0 = selection[0]!
          const g1 = selection[1]!
          return {
            id: `${idSlug}-soundSort`,
            type: 'soundSort' as const,
            title: 'Sound Sort',
            emoji: '🎯',
            instruction: 'Sort the words into the correct sound zone!',
            anchorWords: [
              {
                id: 'target',
                word: g0.keyword,
                sound: g0.grapheme,
                audioUrl: wordAudioUrl(g0.keyword),
              },
              {
                id: 'pair',
                word: g1.keyword,
                sound: g1.grapheme,
                audioUrl: wordAudioUrl(g1.keyword),
              },
            ],
            sortWords: [
              ...sampleWordsPreferUnused(g0.words, 4, usedWords).map((word) => ({
                word,
                correctAnchorId: 'target' as const,
                audioUrl: wordAudioUrl(word),
              })),
              ...sampleWordsPreferUnused(g1.words, 4, usedWords).map((word) => ({
                word,
                correctAnchorId: 'pair' as const,
                audioUrl: wordAudioUrl(word),
              })),
            ],
          }
        })()
      : {
          id: `${idSlug}-soundSort`,
          type: 'soundSort' as const,
          title: 'Sound Sort',
          emoji: '🎯',
          instruction: 'Sort the words into the correct sound zone!',
          anchorWords: [
            {
              id: 'target',
              word: merged.keyword,
              sound: merged.grapheme,
              audioUrl: wordAudioUrl(merged.keyword),
            },
            {
              id: 'pair',
              word: comparison?.keyword ?? merged.sortPair,
              sound: merged.sortPair,
              audioUrl: wordAudioUrl(comparison?.keyword ?? merged.sortPair),
            },
          ],
          sortWords: [
            ...sampleWordsPreferUnused(merged.words, 4, usedWords).map((word) => ({
              word,
              correctAnchorId: 'target' as const,
              audioUrl: wordAudioUrl(word),
            })),
            ...sampleWordsPreferUnused(comparison?.words ?? [], 4, usedWords).map((word) => ({
              word,
              correctAnchorId: 'pair' as const,
              audioUrl: wordAudioUrl(word),
            })),
          ],
        }

  const alienOrRealWords = (() => {
    if (pinned?.alienOrRealWords) {
      markWordsUsed(
        usedWords,
        pinned.alienOrRealWords.map((e) => e.word),
      )
      return pinned.alienOrRealWords
    }
    const realSet = sampleWordsPreferUnused(merged.words, 4, usedWords).map((word) => ({
      word,
      isReal: true as const,
    }))
    const alienSet = sampleWordsPreferUnused(merged.alienWords, 4, usedWords).map((word) => ({
      word,
      isReal: false as const,
    }))
    return shuffle([...realSet, ...alienSet])
  })()
  const alienOrReal = {
    id: `${idSlug}-alienOrReal`,
    type: 'alienOrReal' as const,
    title: 'Alien or Real?',
    emoji: '👽',
    instruction: 'Is it a real word or an alien word?',
    words: alienOrRealWords.map((entry) => ({ ...entry, audioUrl: wordAudioUrl(entry.word) })),
  }

  const writeItSentences = pickWriteItSentences(merged.writeItSentences, usedWords, pinned)
  const writeIt: WriteItData = {
    id: `${idSlug}-writeIt`,
    type: 'writeIt',
    title: 'Write It',
    emoji: '✍️',
    instruction: 'Listen, then write the sentence.',
    sentences: writeItSentences.map((sentence) => ({
      ...sentence,
      audioUrl: `/audio/sentences/${normalizeAudioFilename(sentence.text)}.mp3`,
      checklist: CHECKLIST,
    })),
  }

  const quickReviewWords = buildQuickReviewWordList(selection, merged, pinned, usedWords)
  const quickReview = {
    id: `${idSlug}-quickReview`,
    type: 'quickReview' as const,
    title: 'Quick Review',
    emoji: '⚡',
    instruction: 'Click each word and read it aloud!',
    words: quickReviewWords,
  }

  const missingWordSentences = pickMissingWordSentences(merged.missingWordSentences, 3, usedWords, pinned)
  const missingWord = {
    id: `${idSlug}-missingWord`,
    type: 'missingWord' as const,
    title: 'Missing Word',
    emoji: '📝',
    instruction: 'Which word completes the sentence?',
    sentences: missingWordSentences.map((sentence) => ({
      ...sentence,
      audioUrl: wordAudioUrl(sentence.missingWord),
    })),
  }

  const oddOneOutSets = pickOddOneOutSets(merged.oddOneOutSets, 3, usedWords, pinned)
  const oddOneOut = {
    id: `${idSlug}-oddOneOut`,
    type: 'oddOneOut' as const,
    title: 'Odd One Out',
    emoji: '🔎',
    instruction: 'Three words share a sound — which one is different?',
    sets: oddOneOutSets,
  }

  const chosenBuilderWords = (() => {
    if (pinned?.wordBuilderWords?.length) {
      markWordsUsed(usedWords, pinned.wordBuilderWords)
      return pinned.wordBuilderWords
    }
    return sampleWordsPreferUnused(merged.words, 3, usedWords)
  })()
  const wordBuilder: WordBuilderData = {
    id: `${idSlug}-wordBuilder`,
    type: 'wordBuilder',
    title: 'Word Builder',
    emoji: '🧱',
    instruction: 'Build the word using the sound tiles!',
    words: chosenBuilderWords.map((word) => {
      const tiles = chooseWordBuilderTiles(word, merged, allGraphemes)
      return {
        word,
        graphemes: tiles.graphemes,
        distractors: tiles.distractors,
      }
    }),
  }

  const morphOnly = selection.length > 0 && selection.every((s) => s.type === 'morpheme')
  const morphologyActivities = morphOnly ? buildMorphologyActivities(idSlug, selection, usedWords, allGraphemes) : []

  const hasMorphemeFocus = selection.some((s) => s.type === 'morpheme')

  const activities: Activity[] = hasMorphemeFocus
    ? [
        ...(trickyTrap ? [trickyTrap] : []),
        soundSort,
        alienOrReal,
        quickReview,
        missingWord,
        oddOneOut,
        rhymeTime,
        writeIt,
        ...morphologyActivities,
      ]
    : [
        speedy,
        soundBlender,
        ...(trickyTrap ? [trickyTrap] : []),
        missingSound,
        rhymeTime,
        soundSort,
        alienOrReal,
        writeIt,
        quickReview,
        missingWord,
        oddOneOut,
        wordBuilder,
      ]

  const availableActivities: ActivityType[] = activities.map((a) => a.type)

  const sessionTitle =
    selection.length === 1 ? primary.keyword : selection.map((s) => s.grapheme).join(' · ')

  return {
    id: `phase${merged.phase}-${idSlug}`,
    yearGroup: 'reception',
    phase: merged.phase,
    week: merged.phase,
    day: 'monday',
    weekFocus: sessionTitle,
    dayFocus: sessionTitle,
    termName: `Phase ${merged.phase}`,
    availableActivities,
    activities,
  }
}
