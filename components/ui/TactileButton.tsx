'use client'

import type { MouseEventHandler, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { motionSpring } from '@/lib/celebrations'

interface TactileButtonProps {
  children: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  variant?: 'primary' | 'success' | 'ghost'
  size?: 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
  'aria-label'?: string
}

const variantBase =
  'inline-flex items-center justify-center rounded-full font-bold touch-target px-10 min-h-[56px] text-label disabled:cursor-not-allowed disabled:opacity-[0.45] disabled:shadow-none'

const primaryGrad = { background: 'linear-gradient(135deg, #8B00FF 0%, #FF69B4 100%)' }

export function TactileButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
}: TactileButtonProps) {
  const sizeCls = size === 'lg' ? 'min-h-[72px] px-12 text-[22px] sm:text-[26px]' : ''

  const variantCls =
    variant === 'primary'
      ? 'border-0 text-white shadow-evid-btn'
      : variant === 'success'
        ? 'border-0 bg-success text-white shadow-tactile-success'
        : 'border-2 border-[#8B00FF] bg-transparent text-[#8B00FF] shadow-none'

  const hoverTap =
    variant === 'primary' && !disabled
      ? {
          whileHover: { y: -2, boxShadow: '0 12px 25px rgba(139, 0, 255, 0.4)' },
          whileTap: { y: 0, boxShadow: '0 6px 16px rgba(139, 0, 255, 0.25)' },
        }
      : variant === 'ghost' && !disabled
        ? {
            whileHover: { y: -1 },
            whileTap: { y: 0 },
          }
        : variant === 'success' && !disabled
          ? {
              whileHover: { y: -2 },
              whileTap: { y: 0 },
            }
          : {}

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      className={`${variantBase} ${variantCls} ${sizeCls} ${className}`}
      style={variant === 'primary' && !disabled ? primaryGrad : undefined}
      {...hoverTap}
      transition={motionSpring}
    >
      {children}
    </motion.button>
  )
}
