import { type RefObject, useEffect, useRef } from 'react'

const APP_CONTENT_ID = 'app-content'

let appContentInertDepth = 0

function acquireAppContentInert(): void {
  appContentInertDepth += 1
  if (appContentInertDepth === 1) {
    document.getElementById(APP_CONTENT_ID)?.setAttribute('inert', '')
  }
}

function releaseAppContentInert(): void {
  appContentInertDepth = Math.max(0, appContentInertDepth - 1)
  if (appContentInertDepth === 0) {
    document.getElementById(APP_CONTENT_ID)?.removeAttribute('inert')
  }
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.closest('[aria-hidden="true"]'),
  )
}

/**
 * Move focus into `rootRef` when `active`, cycle Tab inside, restore focus on deactivate.
 * Calls `onEscape` when Escape is pressed (typically closes the modal).
 */
export function useModalFocusTrap(
  active: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onEscape: () => void,
): void {
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  useEffect(() => {
    if (!active || !rootRef.current) return

    acquireAppContentInert()

    prevFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const root = rootRef.current
    const initial = tabbables(root)[0]
    queueMicrotask(() => initial?.focus())

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onEscapeRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const list = tabbables(root)
      if (list.length === 0) return

      const first = list[0]!
      const last = list[list.length - 1]!
      const docActive =
        document.activeElement instanceof HTMLElement ? document.activeElement : null

      if (e.shiftKey) {
        if (docActive === first || docActive === null || !root.contains(docActive)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (docActive === last || docActive === null || !root.contains(docActive)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      releaseAppContentInert()
      prevFocusRef.current?.focus?.({ preventScroll: true })
      prevFocusRef.current = null
    }
  }, [active, rootRef])
}
