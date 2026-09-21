'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SpeakerHigh } from '@phosphor-icons/react'
import { speakWithHooks } from '@/lib/audio'
import { motionSpring } from '@/lib/celebrations'

interface AudioButtonProps {
  text: string
  rate?: number
}

export function AudioButton({ text, rate = 0.85 }: AudioButtonProps) {
  const [active, setActive] = useState(false)

  const handleClick = () => {
    setActive(true)
    speakWithHooks(text, rate, () => setActive(false))
  }

  return (
    <motion.button
      type="button"
      aria-label="Play instruction audio"
      onClick={handleClick}
      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary touch-target"
      whileTap={{ scale: 0.95 }}
      transition={motionSpring}
    >
      {active && (
        <motion.span
          className="absolute inset-0 rounded-full border-[3px] border-primary/60"
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0.4, 0.8] }}
          transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
        />
      )}
      <SpeakerHigh className="relative z-10 h-7 w-7" weight="bold" />
    </motion.button>
  )
}
