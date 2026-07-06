'use client'

import { LESSON_SHELL_ACCENT, LESSON_SHELL_BG } from '@/lib/lessonShellGradient'
import { Skeleton } from '@/components/ui/Skeleton'

/** Suspense fallback — mirrors lesson header + activity card layout. */
export function LessonLoadingSkeleton() {
  return (
    <div
      className="font-andika flex h-screen flex-col overflow-hidden"
      style={{ background: LESSON_SHELL_BG }}
      role="status"
      aria-busy="true"
      aria-label="Loading lesson"
    >
      <span className="sr-only">Loading lesson…</span>

      <div className="relative flex h-14 shrink-0 items-center gap-4 border-b border-border bg-white px-6">
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: LESSON_SHELL_ACCENT }}
          aria-hidden
        />
        <Skeleton variant="circular" tone="card" width={44} height={44} />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Skeleton variant="circular" tone="card" width={22} height={22} />
          <Skeleton variant="text" tone="card" width={128} height={18} className="rounded-full" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="circular"
              tone="card"
              width={i === 0 ? 12 : 10}
              height={i === 0 ? 12 : 10}
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="h-1 bg-gray-200">
        <Skeleton
          variant="rect"
          tone="card"
          width="38%"
          height={4}
          className="skeleton-progress-bar h-full rounded-full"
        />
      </div>

      <div className="flex min-h-0 flex-1 items-start justify-center overflow-hidden p-4 sm:p-8">
        <div className="flex w-full max-w-3xl flex-col rounded-[20px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="mb-6 space-y-2">
            <div className="flex justify-end">
              <Skeleton variant="text" tone="card" width={48} height={14} />
            </div>
            <Skeleton variant="rounded" tone="card" height={8} className="w-full" />
          </div>

          <header className="mb-8 w-full space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="rounded" tone="card" width={48} height={48} />
              <Skeleton variant="text" tone="card" width="42%" height={22} />
            </div>
            <div className="flex items-start gap-3">
              <Skeleton variant="circular" tone="card" width={56} height={56} />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton variant="text" tone="card" width="95%" />
                <Skeleton variant="text" tone="card" width="72%" />
              </div>
            </div>
          </header>

          <div className="flex w-full flex-col items-center gap-6">
            <Skeleton variant="rounded" tone="surface" height={88} className="w-full max-w-md" />

            <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  tone="surface"
                  height={72}
                  className="w-full"
                  style={{ animationDelay: `${i * 70}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
