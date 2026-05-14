interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg bg-surface shadow-card border-[1.5px] border-border ${className}`}>
      {children}
    </div>
  )
}
