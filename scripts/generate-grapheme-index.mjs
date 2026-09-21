#!/usr/bin/env node
/**
 * Generates data/graphemeIndex.json: a tiny {id, grapheme, keyword, phase, type} summary of
 * every Phase 2-5 grapheme, plus the phase-level activity allowlist. This is what the home
 * page (phase cards, search bar, activity picker) actually needs — never the full per-grapheme
 * word lists / segments / sentences, which stay in data/graphemes.ts and only load once a
 * lesson is actually opened (a separate, already-lazy route chunk).
 *
 * Re-run this whenever a phase JSON file's grapheme/keyword/id/type/enabledActivities change:
 *   node scripts/generate-grapheme-index.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const ACTIVITY_ORDER = [
  'speedySounds', 'trickyTrap', 'quickReview', 'soundBlender', 'missingSound', 'alienOrReal',
  'rhymeTime', 'soundSort', 'missingWord', 'oddOneOut', 'wordBuilder', 'writeIt',
]

function normalizeActivityKey(raw) {
  if (typeof raw !== 'string') return null
  const t = raw.trim().toLowerCase()
  return ACTIVITY_ORDER.find((a) => a.toLowerCase() === t) ?? null
}

function extractEnabledActivities(raw) {
  const ea = raw && typeof raw === 'object' ? raw.enabledActivities : undefined
  if (!Array.isArray(ea) || ea.length === 0) return undefined
  const list = ea.map(normalizeActivityKey).filter(Boolean)
  return list.length > 0 ? list : undefined
}

function readPhaseFile(relPath) {
  const raw = JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'))
  const list = Array.isArray(raw) ? raw : Array.isArray(raw.graphemes) ? raw.graphemes : []
  return { raw, list }
}

const PHASE_FILES = {
  2: 'data/phase2.json',
  3: 'data/phase3.json',
  4: 'src/data/phase4.json',
  5: 'data/phase5.json',
}

const byPhase = {}
const activityAllowlist = {}

for (const [phase, relPath] of Object.entries(PHASE_FILES)) {
  const { raw, list } = readPhaseFile(relPath)
  byPhase[phase] = list.map((g) => {
    const entry = {
      grapheme: String(g.grapheme ?? ''),
      keyword: String(g.keyword ?? ''),
      phase: Number(phase),
    }
    if (typeof g.id === 'string' && g.id.length > 0) entry.id = g.id
    if (g.type === 'grapheme' || g.type === 'morpheme') entry.type = g.type
    return entry
  })
  const enabled = extractEnabledActivities(raw)
  if (enabled) activityAllowlist[phase] = enabled
}

const output = { byPhase, activityAllowlist }
const outPath = path.join(root, 'data', 'graphemeIndex.json')
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')

const totalEntries = Object.values(byPhase).reduce((n, arr) => n + arr.length, 0)
console.log(`Wrote ${outPath}: ${totalEntries} graphemes across ${Object.keys(byPhase).length} phases.`)
