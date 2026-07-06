import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LessonLoadingSkeleton } from '@/components/ui/LessonLoadingSkeleton'
import GraphemePickerPage from './pages/GraphemePickerPage'

/** Lesson stack pulls all activities + Framer Motion — keep it off the home screen's first load. */
const LessonPage = lazy(() => import('./pages/LessonPage'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GraphemePickerPage />} />
      <Route
        path="/lesson"
        element={
          <Suspense fallback={<LessonLoadingSkeleton />}>
            <LessonPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
