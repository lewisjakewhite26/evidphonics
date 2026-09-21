import { Link } from 'react-router-dom'
import { CaretRight } from '@phosphor-icons/react'

/** Legacy API. Main app uses sidebar. Kept for small in-app trails if needed. */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-xs px-lg py-sm text-label text-text-sub">
      {items.map((item, idx) => (
        <span key={`${item.label}-${idx}`} className="flex items-center gap-xs">
          {idx > 0 && <CaretRight className="h-4 w-4 text-text-hint" aria-hidden />}
          {item.href ? (
            <Link to={item.href} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="font-bold text-primary">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
