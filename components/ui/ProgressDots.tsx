'use client'

import { motion } from 'framer-motion'

interface ProgressDotsProps {
  total: number
  completedCount: number
  currentIndex: number
}

export function ProgressDots({ total, completedCount, currentIndex }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2 pr-lg" role="status" aria-live="polite">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < completedCount
        const current = !done && i === currentIndex
        return (
          <div key={i} className="relative flex h-4 w-4 items-center justify-center">
            {current && (
              <motion.span
                className="absolute inline-flex h-4 w-4 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              />
            )}
            <span
              className={`h-3 w-3 rounded-full border-2 border-white ${
                done ? 'bg-white' : current ? 'bg-white' : 'bg-transparent'
              }`}
            />
          </div>
        )
      })}
    </div>
  )
}
