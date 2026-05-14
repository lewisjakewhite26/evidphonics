'use client'

import { motion } from 'framer-motion'
import { motionSpring } from '@/lib/celebrations'
import { LESSON_SHELL_GRADIENT } from '@/lib/lessonShellGradient'

interface LessonCompleteProps {
  count: number
  onHome: () => void
}

export default function LessonComplete({ count, onHome }: LessonCompleteProps) {
  return (
    <div
      className="flex h-screen flex-col items-center justify-center font-sans"
      style={{ background: LESSON_SHELL_GRADIENT }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...motionSpring, delay: 0.1 }}
        className="mb-lg text-grapheme text-white"
        aria-hidden
      >
        🏆
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...motionSpring, delay: 0.2 }}
        className="text-center"
      >
        <div className="mb-sm text-display font-bold text-white">Lesson Complete! 🎉</div>
        <div className="mb-xl text-body text-white/70">
          {count} {count === 1 ? 'activity' : 'activities'} completed
        </div>
        <button
          type="button"
          onClick={onHome}
          className="touch-target inline-flex min-h-[56px] items-center justify-center rounded-full bg-white px-10 text-subheading font-bold text-[#8B00FF] shadow-evid-soft transition hover:-translate-y-0.5 hover:shadow-evid-hover"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  )
}
