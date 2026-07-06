import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'

const out = join(process.cwd(), 'ui-audit')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('text=EvidPhonics', { timeout: 30000 })
await page.waitForTimeout(800)
await page.screenshot({ path: join(out, 'home-iwb-1280.png'), fullPage: true })

await page.click('button:has-text("Basic Code")')
await page.waitForSelector('#phase-modal-title', { timeout: 10000 })
await page.waitForTimeout(400)
await page.screenshot({ path: join(out, 'phase-modal-iwb.png'), fullPage: false })

await browser.close()
console.log('saved', out)
