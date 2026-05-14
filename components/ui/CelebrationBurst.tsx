'use client'

import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'

const COUNT = 14

export interface CelebrationBurstProps {
  /** Viewport X in pixels */
  x: number
  /** Viewport Y in pixels */
  y: number
  onComplete?: () => void
}

/**
 * Gentle “success” burst: soft purple glow, tiny dots and short pills in
 * brand primary / accent / success — fits Evid phonics without star shapes or emoji.
 */
export function CelebrationBurst({ x, y, onComplete }: CelebrationBurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const base = (360 / COUNT) * i
        const jitter = ((i * 17 + Math.round(x + y)) % 26) - 13
        const angle = base + jitter
        const distance = 46 + (i % 5) * 17
        const delay = i * 0.017
        const duration = 0.48 + (i % 4) * 0.055
        const variant = i % 3 as 0 | 1 | 2
        const isPill = i % 4 === 0
        return { id: i, angle, distance, delay, duration, variant, isPill }
      }),
    [x, y],
  )

  useEffect(() => {
    const id = window.setTimeout(() => onComplete?.(), 750)
    return () => window.clearTimeout(id)
  }, [onComplete])

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden>
      <div
        className="absolute h-0 w-0"
        style={{
          left: x,
          top: y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          initial={{ scale: 0.45, opacity: 0.5 }}
          animate={{ scale: 1.25, opacity: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute left-0 top-0 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.2] blur-2xl"
        />
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180
          const tx = Math.cos(rad) * p.distance
          const ty = Math.sin(rad) * p.distance
          const tint =
            p.variant === 0
              ? 'bg-primary shadow-[0_0_10px_rgba(139,0,255,0.38)]'
              : p.variant === 1
                ? 'bg-primary-accent shadow-[0_0_10px_rgba(255,105,180,0.42)]'
                : 'bg-success shadow-[0_0_8px_rgba(22,163,74,0.32)]'
          return (
            <motion.span
              key={p.id}
              className={`pointer-events-none absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2 ${tint} ${
                p.isPill ? 'h-2 w-6 rounded-full' : 'h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5'
              }`}
              initial={{ x: 0, y: 0, opacity: 0.95, scale: 1 }}
              animate={{ x: tx, y: ty, opacity: 0, scale: 0.3 }}
              transition={{ duration: p.duration, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
            />
          )
        })}
      </div>
    </div>
  )
}
