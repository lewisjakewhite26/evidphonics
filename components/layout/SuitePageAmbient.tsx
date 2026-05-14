'use client'

/**
 * EvidEducation suite ambient: soft vertical wash + three drifting blobs.
 * Used on teacher-facing planner pages (see EvidDesign.md marketing tokens).
 */
export function SuitePageAmbient() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #FAF7FF 0%, #FFF5EE 100%)',
        }}
      />
      {/* Blob 1 — top left — faster, larger, overlaps centre more */}
      <div
        className="suite-blob-wrap absolute -left-[8%] -top-[8%] h-[min(78vw,40rem)] w-[min(78vw,40rem)] sm:h-[44rem] sm:w-[44rem]"
        style={{ animation: 'suite-breathe 13s ease-in-out infinite' }}
      >
        <div className="h-full w-full rounded-full bg-[rgba(139,0,255,0.2)] blur-3xl" />
      </div>
      {/* Blob 2 — bottom right */}
      <div
        className="suite-blob-wrap absolute -bottom-[6%] -right-[6%] h-[min(72vw,38rem)] w-[min(72vw,38rem)] sm:h-[42rem] sm:w-[42rem]"
        style={{ animation: 'suite-breathe 16s ease-in-out infinite', animationDelay: '-4s' }}
      >
        <div className="h-full w-full rounded-full bg-[rgba(255,105,180,0.17)] blur-3xl" />
      </div>
      {/* Blob 3 — centre */}
      <div className="absolute left-1/2 top-1/2 h-[min(68vw,34rem)] w-[min(68vw,34rem)] -translate-x-1/2 -translate-y-1/2 sm:h-[40rem] sm:w-[40rem]">
        <div
          className="suite-blob-wrap h-full w-full"
          style={{ animation: 'suite-breathe 19s ease-in-out infinite', animationDelay: '-8s' }}
        >
          <div className="h-full w-full rounded-full bg-[rgba(139,0,255,0.12)] blur-3xl" />
        </div>
      </div>
    </div>
  )
}
