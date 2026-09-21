import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'

const out = join(process.cwd(), 'ui-audit-full')
mkdirSync(out, { recursive: true })
const BASE = 'http://localhost:5173'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// Missing Word: wrong answer feedback
await page.goto(`${BASE}/lesson?graphemes=sh&activities=missingWord`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
const buttons = page.locator('button').filter({ hasText: /^(shell|shift)$/ })
await buttons.first().click().catch(() => {})
await page.waitForTimeout(400)
await page.screenshot({ path: join(out, 'state-missingWord-wrong.png') })

// now click correct
const allBtns = await page.locator('button').all()
for (const b of allBtns) {
  const t = (await b.textContent())?.trim()
  if (t === 'shelf') { await b.click(); break }
}
await page.waitForTimeout(500)
await page.screenshot({ path: join(out, 'state-missingWord-correct.png') })

// Odd One Out: correct + wrong states
await page.goto(`${BASE}/lesson?graphemes=sh&activities=oddOneOut`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: join(out, 'state-oddOneOut-initial.png') })

// Sound Blender: drag interaction (simulate mouse drag)
await page.goto(`${BASE}/lesson?graphemes=sh&activities=soundBlender`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
const rocket = page.locator('[class*="cursor-grab"], [class*="cursor-pointer"]').first()
const track = page.locator('div.rounded-full').last()

// Lesson complete screen: run through all activities quickly by forcing completion via URL trick isn't available,
// so click through a short single-activity lesson (quickReview, click each word)
await page.goto(`${BASE}/lesson?graphemes=sh&activities=quickReview`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
const words = await page.locator('button').all()
for (const w of words) {
  await w.click().catch(() => {})
  await page.waitForTimeout(120)
}
await page.waitForTimeout(1200)
await page.screenshot({ path: join(out, 'state-lesson-complete.png') })

await browser.close()
console.log('done')
