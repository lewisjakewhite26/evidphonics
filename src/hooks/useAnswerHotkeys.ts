import { useEffect } from 'react'

/**
 * Number keys 1–9 click the on-screen button carrying a matching `data-hotkey="N"`,
 * so a teacher on a keyboard-connected IWB PC can drive multiple-choice activities
 * without reaching for the mouse. Ignored while a text input/textarea has focus.
 */
export function useAnswerHotkeys(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return
      if (!/^[1-9]$/.test(e.key)) return

      const el = document.querySelector<HTMLButtonElement>(`[data-hotkey="${e.key}"]`)
      if (!el || el.disabled) return
      e.preventDefault()
      el.click()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
