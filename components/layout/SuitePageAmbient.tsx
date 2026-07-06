'use client'

import { BRAND_SURFACE } from '@/lib/brandAccent'

/** Flat suite wash — single lavender surface, no multi-stop gradient. */
export function SuitePageAmbient() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{ backgroundColor: BRAND_SURFACE }}
      aria-hidden
    />
  )
}
