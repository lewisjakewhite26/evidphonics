import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'

const baseUrl = process.env.UX_AUDIT_URL ?? 'http://127.0.0.1:5173/'
const out = join(process.cwd(), 'ui-audit')
mkdirSync(out, { recursive: true })

const viewports = [
  { name: 'iwb-1280', width: 1280, height: 800 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'mobile-390', width: 390, height: 844 },
]

const browser = await chromium.launch()

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('text=Build your phonics lesson', { timeout: 30000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: join(out, `home-${vp.name}.png`), fullPage: true })

  await page.click('button:has-text("Basic Code")')
  await page.waitForSelector('#phase-modal-title', { timeout: 10000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(out, `phase-modal-${vp.name}.png`) })

  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.close()
}

await browser.close()
console.log('saved', out)
