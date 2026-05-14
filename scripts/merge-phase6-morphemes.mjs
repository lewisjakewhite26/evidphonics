/**
 * One-off / repeatable: merge morphemeData from Downloads into data/phase6.json.
 * Run: node scripts/merge-phase6-morphemes.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const MORPHEME_SOURCE = 'C:\\Users\\DRMLWhite\\Downloads\\phase6-morpheme-data.json'
const PHASE6 = path.join(root, 'data', 'phase6.json')

/** Words in current phase6.json not covered by the download file — hand-authored morpheme splits. */
const EXTRA_BY_GRAPHEME = {
  ssion: {
    morphemes: { emission: ['emiss', 'ion'] },
    roots: { emission: 'emit' },
  },
  cian: {
    morphemes: { clinician: ['clinic', 'ian'] },
    roots: { clinician: 'clinic' },
  },
  kn: {
    morphemes: {
      knoll: ['kn', 'oll'],
      knitter: ['kn', 'itter'],
    },
    roots: { knoll: 'knoll', knitter: 'knit' },
  },
  sion: {
    morphemes: {
      expansion: ['expans', 'ion'],
      tension: ['tens', 'ion'],
      extension: ['extens', 'ion'],
    },
    roots: {
      expansion: 'expand',
      tension: 'tense',
      extension: 'extend',
    },
  },
  'un-': {
    morphemes: {
      unlucky: ['un', 'lucky'],
      unopened: ['un', 'opened'],
      untried: ['un', 'tried'],
    },
    roots: { unlucky: 'lucky', unopened: 'opened', untried: 'tried' },
  },
  'dis-': {
    morphemes: {
      dismiss: ['dis', 'miss'],
      discomfort: ['dis', 'comfort'],
      disallow: ['dis', 'allow'],
      disapprove: ['dis', 'approve'],
    },
    roots: {
      dismiss: 'miss',
      discomfort: 'comfort',
      disallow: 'allow',
      disapprove: 'approve',
    },
  },
  'mis-': {
    morphemes: {
      misjudge: ['mis', 'judge'],
      misstep: ['mis', 'step'],
      misprint: ['mis', 'print'],
      mishear: ['mis', 'hear'],
      misname: ['mis', 'name'],
    },
    roots: {
      misjudge: 'judge',
      misstep: 'step',
      misprint: 'print',
      mishear: 'hear',
      misname: 'name',
    },
  },
  're-': {
    morphemes: { repaint: ['re', 'paint'] },
    roots: { repaint: 'paint' },
  },
  '-tion suffix': {
    morphemes: {
      vacation: ['vacat', 'ion'],
      location: ['locat', 'ion'],
      emotion: ['emot', 'ion'],
      suggestion: ['suggest', 'ion'],
      situation: ['situat', 'ion'],
      relation: ['relat', 'ion'],
      communication: ['communic', 'ation'],
      invitation: ['invit', 'ation'],
      expectation: ['expect', 'ation'],
    },
    roots: {
      vacation: 'vacate',
      location: 'locate',
      emotion: 'emote',
      suggestion: 'suggest',
      situation: 'situate',
      relation: 'relate',
      communication: 'communicate',
      invitation: 'invite',
      expectation: 'expect',
    },
  },
  '-ful': {
    morphemes: {
      grateful: ['grate', 'ful'],
      fearful: ['fear', 'ful'],
    },
    roots: { grateful: 'grate', fearful: 'fear' },
  },
  '-ness': {
    morphemes: {
      silliness: ['silli', 'ness'],
      sweetness: ['sweet', 'ness'],
      boldness: ['bold', 'ness'],
      softness: ['soft', 'ness'],
    },
    roots: {
      silliness: 'silly',
      sweetness: 'sweet',
      boldness: 'bold',
      softness: 'soft',
    },
  },
  '-ment': {
    morphemes: {
      basement: ['base', 'ment'],
      moment: ['mo', 'ment'],
      appointment: ['appoint', 'ment'],
      amusement: ['amuse', 'ment'],
      shipment: ['ship', 'ment'],
    },
    roots: {
      basement: 'base',
      moment: 'mo',
      appointment: 'appoint',
      amusement: 'amuse',
      shipment: 'ship',
    },
  },
}

function lettersOnly(word) {
  return String(word)
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function joinParts(parts) {
  return lettersOnly(parts.join(''))
}

function filterWordMap(map, words) {
  const out = {}
  if (!map || typeof map !== 'object') return out
  const wordSet = new Set(words.map((w) => String(w)))
  for (const [word, val] of Object.entries(map)) {
    if (!wordSet.has(word)) continue
    if (Array.isArray(val) && joinParts(val) === lettersOnly(word)) {
      out[word] = val
    }
  }
  return out
}

function filterRoots(map, words) {
  const out = {}
  if (!map || typeof map !== 'object') return out
  const wordSet = new Set(words.map((w) => String(w)))
  for (const [word, val] of Object.entries(map)) {
    if (!wordSet.has(word)) continue
    if (typeof val === 'string' && val.length > 0) out[word] = val
  }
  return out
}

function mergeRecords(base, extra) {
  const out = { ...base }
  for (const [k, v] of Object.entries(extra)) {
    if (out[k] === undefined) out[k] = v
  }
  return out
}

function main() {
  const raw = JSON.parse(fs.readFileSync(MORPHEME_SOURCE, 'utf8'))
  const morphemeData = raw.morphemeData
  if (!morphemeData || typeof morphemeData !== 'object') {
    throw new Error('morphemeData missing')
  }

  const phase = JSON.parse(fs.readFileSync(PHASE6, 'utf8'))
  const list = phase.graphemes || phase
  if (!Array.isArray(list)) throw new Error('phase6 graphemes not array')

  for (const g of list) {
    const key = g.grapheme
    const src = morphemeData[key]
    const extra = EXTRA_BY_GRAPHEME[key] || {}

    if (!src && !extra.morphemes && !extra.roots) continue

    const words = g.words || []
    let morphemes = {}
    let roots = {}

    if (src?.morphemes) morphemes = filterWordMap(src.morphemes, words)
    if (src?.roots) roots = filterRoots(src.roots, words)

    if (extra.morphemes) {
      morphemes = mergeRecords(morphemes, filterWordMap(extra.morphemes, words))
    }
    if (extra.roots) {
      roots = mergeRecords(roots, filterRoots(extra.roots, words))
    }

    // roots keys should cover morpheme keys where possible
    g.morphemes = morphemes
    g.roots = roots
  }

  fs.writeFileSync(PHASE6, `${JSON.stringify(phase, null, 2)}\n`)
  console.error(`Wrote ${PHASE6}`)
}

main()
