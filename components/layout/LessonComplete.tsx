'use client'

import { motion } from 'framer-motion'
import { motionSpring } from '@/lib/celebrations'
import { LESSON_SHELL_BG } from '@/lib/lessonShellGradient'

interface LessonCompleteProps {
  count: number
  onHome: () => void
}

export default function LessonComplete({ count, onHome }: LessonCompleteProps) {
  return (
    <div
      className="flex h-screen flex-col items-center justify-center font-andika px-4"
      style={{ background: LESSON_SHELL_BG }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...motionSpring, delay: 0.1 }}
        className="mb-lg flex h-24 w-24 items-center justify-center rounded-full bg-white text-grapheme shadow-card"
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
        <div className="mb-sm text-display font-bold text-ink">Lesson complete</div>
        <div className="mb-xl text-body text-text-sub">
          {count} {count === 1 ? 'activity' : 'activities'} completed
        </div>
        <button
          type="button"
          onClick={onHome}
          className="touch-target inline-flex min-h-[56px] items-center justify-center rounded-full bg-primary px-10 text-subheading font-bold text-white shadow-evid-btn transition hover:-translate-y-0.5 hover:shadow-evid-btn-hover"
        >
          Back to home
        </button>
      </motion.div>
    </div>
  )
}
