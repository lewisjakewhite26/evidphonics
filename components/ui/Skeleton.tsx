'use client'

import type { CSSProperties, HTMLAttributes } from 'react'

export type SkeletonTone = 'surface' | 'onDark' | 'card'
export type SkeletonVariant = 'text' | 'circular' | 'rect' | 'rounded'

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant
  tone?: SkeletonTone
  /** Disable shimmer (e.g. when parent already animates) */
  animate?: boolean
  width?: CSSProperties['width']
  height?: CSSProperties['height']
}

const VARIANT_CLASS: Record<SkeletonVariant, string> = {
  text: 'h-4 rounded-md',
  circular: 'rounded-full',
  rect: 'rounded-none',
  rounded: 'rounded-2xl',
}

const TONE_CLASS: Record<SkeletonTone, string> = {
  surface: 'skeleton-tone-surface',
  onDark: 'skeleton-tone-on-dark',
  card: 'skeleton-tone-card',
}

export function Skeleton({
  variant = 'text',
  tone = 'surface',
  animate = true,
  width,
  height,
  className = '',
  style,
  ...rest
}: SkeletonProps) {
  const sizeStyle: CSSProperties = { width, height, ...style }

  if (variant === 'circular' && !width && !height) {
    sizeStyle.width = sizeStyle.width ?? 40
    sizeStyle.height = sizeStyle.height ?? 40
  }

  if (variant === 'text' && !width) {
    sizeStyle.width = sizeStyle.width ?? '100%'
  }

  return (
    <div
      aria-hidden
      className={[
        'skeleton-block',
        VARIANT_CLASS[variant],
        TONE_CLASS[tone],
        animate ? 'skeleton-shimmer' : 'skeleton-static',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={sizeStyle}
      {...rest}
    />
  )
}
