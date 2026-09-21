/** Small corner number shown on answer buttons that also respond to number-key presses. */
export function HotkeyBadge({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-[11px] font-bold text-current opacity-60"
    >
      {n}
    </span>
  )
}
