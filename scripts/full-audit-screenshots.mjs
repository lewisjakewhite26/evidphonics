import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'

const out = join(process.cwd(), 'ui-audit-full')
mkdirSync(out, { recursive: true })

const BASE = 'http://localhost:5173'

const ACTIVITIES = [
  'speedySounds',
  'soundBlender',
  'trickyTrap',
  'missingSound',
  'rhymeTime',
  'soundSort',
  'alienOrReal',
  'writeIt',
  'quickReview',
  'missingWord',
  'oddOneOut',
  'wordBuilder',
]

const browser = await chromium.launch()

async function shoot(page, path, opts = {}) {
  await page.screenshot({ path: join(out, path), fullPage: opts.fullPage ?? false })
  console.log('saved', path)
}

// Desktop pass
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text())
  })
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(600)
  await shoot(page, 'desktop-home.png', { fullPage: true })

  // open a phase modal
  const phaseButtons = await page.locator('button').allTextContents()
  await page.locator('button', { hasText: 'Basic Code' }).first().click({ timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(500)
  await shoot(page, 'desktop-phase-modal.png')
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(300)

  for (const act of ACTIVITIES) {
    const url = `${BASE}/lesson?graphemes=sh&activities=${act}`
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(900)
    await shoot(page, `desktop-activity-${act}.png`)
  }

  await page.close()
}

// Mobile pass
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(600)
  await shoot(page, 'mobile-home.png', { fullPage: true })

  await page.goto(`${BASE}/lesson?graphemes=sh&activities=soundBlender`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(900)
  await shoot(page, 'mobile-activity-soundBlender.png')

  await page.goto(`${BASE}/lesson?graphemes=sh&activities=missingWord`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(900)
  await shoot(page, 'mobile-activity-missingWord.png')

  await page.close()
}

await browser.close()
console.log('DONE', out)
