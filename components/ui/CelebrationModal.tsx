'use client'

import { motion } from 'framer-motion'
import { motionSpring } from '@/lib/celebrations'

interface CelebrationModalProps {
  open: boolean
  children: React.ReactNode
}

export function CelebrationModal({ open, children }: CelebrationModalProps) {
  if (!open) return null
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-[2px] px-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={motionSpring}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={motionSpring}
        className="w-full max-w-2xl rounded-lg border-2 border-primary bg-surface p-xl shadow-card-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
