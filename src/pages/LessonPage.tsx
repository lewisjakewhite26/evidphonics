import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getLesson, getLessonForGraphemes } from '@/data/lessonQueries'
import ActivityShell from '@/components/activities/ActivityShell'
import LessonComplete from '@/components/layout/LessonComplete'
import LessonHeader from '@/components/layout/LessonHeader'
import { motionSpring } from '@/lib/celebrations'
import { ALL_ACTIVITY_TYPES, parseActivitiesParam, sortActivitiesByPedagogy } from '@/lib/lessonConstants'
import { LESSON_SHELL_GRADIENT } from '@/lib/lessonShellGradient'

function LessonContent() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const graphemesParam = params.get('graphemes')
  const graphemeLegacy = params.get('grapheme')
  const globalStep = Number(params.get('step') ?? params.get('week') ?? '11')
  const day = params.get('day') ?? 'monday'
  const rawActivities = params.get('activities') ?? ''

  const graphemeIds = useMemo(() => {
    if (graphemesParam?.trim()) {
      return graphemesParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    if (graphemeLegacy?.trim()) return [graphemeLegacy.trim()]
    return []
  }, [graphemesParam, graphemeLegacy])

  const requestedActivities = useMemo(() => {
    const parsed = parseActivitiesParam(rawActivities)
    const list = parsed.length ? parsed : [...ALL_ACTIVITY_TYPES]
    return sortActivitiesByPedagogy(list)
  }, [rawActivities])

  const lessonData = useMemo(() => {
    if (graphemeIds.length > 0) return getLessonForGraphemes(graphemeIds)
    return getLesson(globalStep, day)
  }, [graphemeIds, globalStep, day])

  const activities = useMemo(() => {
    if (!lessonData) return []
    const allowed = new Set(lessonData.availableActivities)
    return requestedActivities.filter((t) => allowed.has(t))
  }, [lessonData, requestedActivities])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [lessonFinished, setLessonFinished] = useState(false)

  useEffect(() => {
    setCurrentIndex(0)
    setCompletedCount(0)
    setLessonFinished(false)
  }, [lessonData?.id, activities.join(',')])

  const handleActivityComplete = useCallback(() => {
    setCompletedCount((c) => {
      const next = c + 1
      if (next >= activities.length) {
        queueMicrotask(() => {
          setLessonFinished(true)
        })
      }
      return next
    })
    setCurrentIndex((i) => (i >= activities.length - 1 ? i : i + 1))
  }, [activities.length])

  const handleExit = useCallback(() => {
    navigate('/')
  }, [navigate])

  if (lessonFinished) {
    return <LessonComplete count={activities.length} onHome={handleExit} />
  }

  if (!lessonData) {
    return (
      <div
        className="font-sans flex h-screen flex-col items-center justify-center gap-lg px-lg text-center"
        style={{ background: LESSON_SHELL_GRADIENT }}
      >
        <p className="text-heading font-bold text-white">Lesson not found</p>
        <p className="max-w-md text-body text-white/80">
          Check your link — grapheme codes must match the curriculum (e.g. ch, sh, th).
        </p>
        <button
          type="button"
          onClick={handleExit}
          className="touch-target rounded-lg bg-white px-lg py-3 text-body font-bold text-primary shadow-card"
        >
          Back to home
        </button>
      </div>
    )
  }

  if (!activities.length) {
    return (
      <div
        className="font-sans flex h-screen flex-col items-center justify-center gap-lg px-lg text-center"
        style={{ background: LESSON_SHELL_GRADIENT }}
      >
        <p className="text-heading font-bold text-white">No activities selected</p>
        <button
          type="button"
          onClick={handleExit}
          className="touch-target rounded-lg bg-white px-lg py-3 text-body font-bold text-primary shadow-card"
        >
          Back to home
        </button>
      </div>
    )
  }

  const currentActivityType = activities[currentIndex]
  const currentActivityData = lessonData.activities.find((a) => a.type === currentActivityType)

  return (
    <div
      className="font-sans flex h-screen flex-col overflow-hidden"
      style={{ background: LESSON_SHELL_GRADIENT }}
    >
      <LessonHeader
        activityType={currentActivityType}
        currentIndex={currentIndex}
        totalCount={activities.length}
        completedCount={completedCount}
        onExit={handleExit}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={motionSpring}
            className="flex h-full min-h-0 flex-col"
          >
            <ActivityShell
              activityType={currentActivityType}
              activityData={currentActivityData}
              onComplete={handleActivityComplete}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function LessonPage() {
  return <LessonContent />
}
