# EvidPhonics

Interactive phonics planner and lesson runner (**Vite + React**). Core lesson data and UI live under `components/`, `data/`, and `lib/` and are meant to stay **framework-agnostic** so you can adopt **Next.js** again later (e.g. `app/page.tsx` + `app/lesson/page.tsx` that import the same `@/components` and `@/data` modules).

## Scripts

```bash
npm install
npm run dev      # Vite dev server (default http://localhost:5173)
npm run build    # Typecheck + production bundle to dist/
npm run preview  # Serve dist/ locally
npm run lint
```

## Routes (React Router)

- `/` — planner (phase / step, day, activities)
- `/lesson?step=&day=&activities=` — fullscreen lesson runner (`week=` still accepted for older links)

## Returning to Next.js (later)

1. Add `next` and wire an `app/` layout (fonts can stay Google CSS or use `next/font` again).
2. Re-create `app/page.tsx` and `app/lesson/page.tsx` using `useRouter` / `useSearchParams` from `next/navigation`, calling the same handlers as `src/pages/PlannerPage.tsx` and `src/pages/LessonPage.tsx`.
3. Keep imports as `@/components/...` and `@/data/...` — paths already match the repo root via `tsconfig` `paths`.
