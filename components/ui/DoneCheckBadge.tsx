'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from '@phosphor-icons/react'

/** Tier 1 "acknowledged" marker for reveal/tap tasks (Speedy Sounds, Quick Review) — a small
 * persistent check that pops in once, instead of firing the full CelebrationBurst on every tap. */
export function DoneCheckBadge() {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
      aria-hidden
    >
      <CheckCircle className="h-5 w-5 text-success" weight="fill" />
    </motion.span>
  )
}
