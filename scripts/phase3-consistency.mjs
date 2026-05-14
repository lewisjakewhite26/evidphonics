/**
 * Phase 3: segment cluster normalization + consistency checks (same pattern as phase 5).
 * Run: node scripts/phase3-consistency.mjs
 *
 * Prints before/after counts for segment join, missing segments, sortPair, and alien corpus collisions.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const PHASE_FILE = 'data/phase3.json'
const REPORT_FILE = 'scripts/phase3-consistency-report.json'

const KEEP_SORTED = [
  'eigh',
  'ough',
  'tion',
  'sion',
  'cian',
  'igh',
  'air',
  'ear',
  'ure',
  'our',
  'oor',
  'eer',
  'are',
  'ere',
  'ire',
  'ore',
  'tch',
  'dge',
  'sch',
  'i-e',
  'o-e',
  'a-e',
  'u-e',
  'e-e',
  'ai',
  'ay',
  'au',
  'aw',
  'ea',
  'ee',
  'ei',
  'ey',
  'ie',
  'oa',
  'oe',
  'oi',
  'oy',
  'oo',
  'ou',
  'ow',
  'ar',
  'or',
  'er',
  'ir',
  'ur',
  'ue',
  'ew',
  'ui',
  'ce',
  'ch',
  'sh',
  'th',
  'ph',
  'wh',
  'ng',
  'nk',
  'ck',
  'kn',
  'wr',
  'qu',
  'mb',
  'mn',
  'gh',
  'ct',
  'll',
  'ff',
  'ss',
  'zz',
  'nn',
  'mm',
  'tt',
  'pp',
  'bb',
  'dd',
  'cc',
  'gg',
  'ge',
  've',
  'dis',
  'mis',
  're',
  'un',
  'gn',
]

function buildKeepSet() {
  return new Set(KEEP_SORTED)
}

const KEEP = buildKeepSet()

function expandToken(token) {
  if (!token) return []
  if (token === '-') return [token]
  if (token.length === 1) return [token]

  const lower = token.toLowerCase()
  const maxLen = Math.min(5, token.length)
  for (let len = maxLen; len >= 2; len--) {
    const sub = lower.slice(0, len)
    if (KEEP.has(sub)) {
      return [token.slice(0, len), ...expandToken(token.slice(len))]
    }
  }
  return [token[0], ...expandToken(token.slice(1))]
}

function normalizeSegmentArray(arr) {
  return arr.flatMap((t) => expandToken(t))
}

function readPhase(file) {
  const raw = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
  if (Array.isArray(raw)) return { wrapped: false, raw, list: raw }
  return { wrapped: true, raw, list: raw.graphemes || [] }
}

function writePhase(file, wrapped, raw, list) {
  const out = wrapped ? { ...raw, graphemes: list } : list
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(out, null, 2)}\n`)
}

function loadAllGraphemeIds() {
  const files = ['data/phase2.json', 'data/phase3.json', 'data/phase5.json', 'data/phase6.json']
  const ids = new Set()
  for (const f of files) {
    const { list } = readPhase(f)
    for (const g of list) ids.add(g.grapheme)
  }
  return ids
}

function collectCorpusWords() {
  const words = new Set()
  for (const f of ['data/phase2.json', 'data/phase3.json', 'data/phase5.json', 'data/phase6.json']) {
    const { list } = readPhase(f)
    for (const g of list) {
      for (const w of g.words || []) words.add(String(w).toLowerCase())
    }
  }
  return words
}

function segmentsJoin(segments) {
  return segments.join('').toLowerCase().replace(/[^a-z]/g, '')
}

function shouldSkipJoinCheck(segments) {
  return segments.some((t) => t === '-' || (typeof t === 'string' && !/^[a-zA-Z]+$/.test(t)))
}

function lettersOnly(word) {
  return String(word)
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function greedySpellFromLetters(letters, maxLen, keepSet) {
  const out = []
  let i = 0
  while (i < letters.length) {
    let matched = false
    const cap = Math.min(maxLen, letters.length - i)
    for (let len = cap; len >= 2; len--) {
      const sub = letters.slice(i, i + len)
      if (keepSet.has(sub)) {
        out.push(sub)
        i += len
        matched = true
        break
      }
    }
    if (!matched) {
      out.push(letters[i])
      i += 1
    }
  }
  return out
}

function ensureSegmentEntryMatchesWord(g, word, maxLen, keepSet) {
  const w = lettersOnly(word)
  if (!w) return
  let arr = g.segments[word]
  if (!Array.isArray(arr)) arr = []
  arr = normalizeSegmentArray(arr)
  if (shouldSkipJoinCheck(arr)) {
    g.segments[word] = arr
    return
  }
  const j = segmentsJoin(arr)
  if (j === w) {
    g.segments[word] = arr
    return
  }
  const greedy = greedySpellFromLetters(w, maxLen, keepSet)
  if (segmentsJoin(greedy) === w) {
    g.segments[word] = greedy
    return
  }
  g.segments[word] = w.split('')
}

/** Read-only tallies (no mutations). */
function tally(list, graphemeIds, corpusWords) {
  let join = 0
  let missing = 0
  let sortPair = 0
  let alien = 0

  for (const g of list) {
    if (!graphemeIds.has(g.sortPair)) sortPair++

    if (g.segments && typeof g.segments === 'object') {
      const wordKeys = new Set([...Object.keys(g.segments), ...(g.words || [])])
      for (const word of wordKeys) {
        const arr = g.segments[word]
        if (!Array.isArray(arr)) {
          if ((g.words || []).includes(word)) missing++
          continue
        }
        const normalized = normalizeSegmentArray([...arr])
        if (!shouldSkipJoinCheck(normalized)) {
          const j = segmentsJoin(normalized)
          const w = word.toLowerCase().replace(/[^a-z]/g, '')
          if (j !== w) join++
        }
      }
    } else {
      for (const w of g.words || []) {
        missing++
      }
    }

    for (const aw of g.alienWords || []) {
      const low = String(aw).toLowerCase()
      if (corpusWords.has(low)) alien++
    }
  }

  return { join, missing, sortPair, alien }
}

function run() {
  const graphemeIds = loadAllGraphemeIds()
  const corpusWords = collectCorpusWords()

  const { wrapped, raw, list } = readPhase(PHASE_FILE)
  const listSnapshot = JSON.parse(JSON.stringify(list))

  const before = tally(listSnapshot, graphemeIds, corpusWords)

  const issues = []
  const add = (type, grapheme, field, detail, severity = 'report') => {
    issues.push({ type, grapheme, field, detail, severity })
  }

  for (const g of list) {
    if (!g.segments || typeof g.segments !== 'object') {
      g.segments = {}
    }
    if (g.segments && typeof g.segments === 'object') {
      const wordKeys = new Set([...Object.keys(g.segments), ...(g.words || [])])
      for (const word of wordKeys) {
        ensureSegmentEntryMatchesWord(g, word, 5, KEEP)
      }
      for (const word of Object.keys(g.segments)) {
        const normalized = g.segments[word]
        if (!Array.isArray(normalized)) continue
        if (!shouldSkipJoinCheck(normalized)) {
          const j = segmentsJoin(normalized)
          const w = word.toLowerCase().replace(/[^a-z]/g, '')
          if (j !== w) {
            add('3-segments-join', g.grapheme, `segments["${word}"]`, `expanded segments join "${j}" !== word "${w}"`)
          }
        }
      }
      for (const w of g.words || []) {
        if (!g.segments[w]) {
          add('3-segments-missing', g.grapheme, 'segments', `no segments entry for word "${w}"`)
        }
      }
    }

    ;(g.missingWordSentences || []).forEach((s, i) => {
      if (!Array.isArray(s.options) || !s.options.includes(s.missingWord)) {
        const detail = `missingWord "${s.missingWord}" not in options — inserted into options`
        if (Array.isArray(s.options) && s.options.length > 0) {
          s.options = [s.missingWord, ...s.options.filter((x) => x !== s.missingWord)].slice(0, Math.max(3, s.options.length))
        } else {
          s.options = [s.missingWord]
        }
        add('1-missingWord-options', g.grapheme, `missingWordSentences[${i}]`, detail, 'fixed')
      }
    })

    if (!graphemeIds.has(g.sortPair)) {
      add('2-sortPair', g.grapheme, 'sortPair', `sortPair "${g.sortPair}" does not resolve to a loaded grapheme ID`)
    }

    ;(g.oddOneOutSets || []).forEach((s, i) => {
      const len = Array.isArray(s.words) ? s.words.length : 0
      if (!(Number.isInteger(s.oddOneOut) && s.oddOneOut >= 0 && s.oddOneOut < len)) {
        const prev = s.oddOneOut
        s.oddOneOut = len > 0 ? Math.max(0, Math.min(Number.isInteger(s.oddOneOut) ? s.oddOneOut : 0, len - 1)) : 0
        add('4-oddOneOut-bounds', g.grapheme, `oddOneOutSets[${i}].oddOneOut`, `was ${prev}, clamped to ${s.oddOneOut} (length ${len})`, 'fixed')
      }
    })

    for (const aw of g.alienWords || []) {
      const low = String(aw).toLowerCase()
      if (corpusWords.has(low)) {
        add('5-alien-corpus-collision', g.grapheme, 'alienWords', `"${aw}" matches a word elsewhere in loaded phase data`)
      }
    }
  }

  const after = tally(list, graphemeIds, corpusWords)

  writePhase(PHASE_FILE, wrapped, raw, list)

  const reportPath = path.join(root, REPORT_FILE)
  fs.writeFileSync(reportPath, `${JSON.stringify(issues, null, 2)}\n`)

  console.log(JSON.stringify({ phase: 3, before, after, reportIssues: issues.length }, null, 2))
  console.error(
    `\nPhase 3 consistency — BEFORE: join=${before.join} missing=${before.missing} sortPair=${before.sortPair} alien=${before.alien}`,
  )
  console.error(
    `Phase 3 consistency — AFTER:  join=${after.join} missing=${after.missing} sortPair=${after.sortPair} alien=${after.alien}`,
  )
  console.error(`\nWrote ${issues.length} report row(s). Report: ${reportPath}`)
}

run()
