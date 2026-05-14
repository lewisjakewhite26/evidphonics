'use client'

import { useEffect, useRef } from 'react'

const PHONEME_SYMBOLS = ['s', 'a', 't', 'p', 'i', 'n', 'ch', 'sh', 'th', 'ng', 'ai', 'ee', 'igh', 'oa']

const PARTICLE_COLORS = [
  'rgba(124, 58, 237, 0.30)',
  'rgba(91, 33, 182, 0.26)',
  'rgba(30, 27, 75, 0.16)',
]

const FRICTION = 0.9
const REPULSE_RADIUS = 220
const REPULSE_STRENGTH = 12
const DRIFT_RETURN = 0.02
const MAX_SPEED = 14
const AREA_PER_PARTICLE = 20000

type Mouse = { x: number; y: number }

type Particle = {
  x: number
  y: number
  size: number
  symbol: string
  color: string
  driftX: number
  driftY: number
  vx: number
  vy: number
  angle: number
  spin: number
}

function createParticle(w: number, h: number): Particle {
  const driftX = (Math.random() - 0.5) * 0.4
  const driftY = (Math.random() - 0.5) * 0.4
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 12 + 14,
    symbol: PHONEME_SYMBOLS[Math.floor(Math.random() * PHONEME_SYMBOLS.length)]!,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]!,
    driftX,
    driftY,
    vx: driftX,
    vy: driftY,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.02,
  }
}

function updateParticle(p: Particle, mouse: Mouse, w: number, h: number) {
  const dx = p.x - mouse.x
  const dy = p.y - mouse.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < REPULSE_RADIUS && distance > 0) {
    const t = 1 - distance / REPULSE_RADIUS
    const strength = t * t * REPULSE_STRENGTH
    p.vx += (dx / distance) * strength
    p.vy += (dy / distance) * strength
  }

  p.vx *= FRICTION
  p.vy *= FRICTION
  p.vx += (p.driftX - p.vx) * DRIFT_RETURN
  p.vy += (p.driftY - p.vy) * DRIFT_RETURN

  const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
  if (speed > MAX_SPEED) {
    p.vx = (p.vx / speed) * MAX_SPEED
    p.vy = (p.vy / speed) * MAX_SPEED
  }

  p.x += p.vx
  p.y += p.vy
  p.angle += p.spin

  if (p.x < -50) p.x = w + 50
  if (p.x > w + 50) p.x = -50
  if (p.y < -50) p.y = h + 50
  if (p.y > h + 50) p.y = -50
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.angle)
  ctx.font = `${p.size}px var(--font-andika), Andika, sans-serif`
  ctx.fillStyle = p.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(p.symbol, 0, 0)
  ctx.restore()
}

function runParticleLoop(
  host: HTMLDivElement,
  canvasEl: HTMLCanvasElement,
  ctx2d: CanvasRenderingContext2D,
) {
  let raf = 0
  let w = 1
  let h = 1
  let dpr = 1
  const mouse: Mouse = { x: -1000, y: -1000 }
  let particles: Particle[] = []

  function layout() {
    const rect = host.getBoundingClientRect()
    w = Math.max(1, Math.floor(rect.width))
    h = Math.max(1, Math.floor(rect.height))
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvasEl.width = Math.floor(w * dpr)
    canvasEl.height = Math.floor(h * dpr)
    canvasEl.style.width = `${w}px`
    canvasEl.style.height = `${h}px`
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
    const n = Math.max(12, Math.floor((w * h) / AREA_PER_PARTICLE))
    particles = []
    for (let i = 0; i < n; i++) particles.push(createParticle(w, h))
  }

  function resetPointer() {
    mouse.x = -1000
    mouse.y = -1000
  }

  function onPointerMove(e: PointerEvent) {
    const rect = host.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (x < -48 || x > rect.width + 48 || y < -48 || y > rect.height + 48) resetPointer()
    else {
      mouse.x = x
      mouse.y = y
    }
  }

  layout()
  const fontsReady = document.fonts?.ready ?? Promise.resolve()
  void fontsReady.then(layout)

  const ro = new ResizeObserver(layout)
  ro.observe(host)

  window.addEventListener('pointermove', onPointerMove, { passive: true })

  function tick() {
    ctx2d.clearRect(0, 0, w, h)
    for (const p of particles) {
      updateParticle(p, mouse, w, h)
      drawParticle(ctx2d, p)
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(raf)
    ro.disconnect()
    window.removeEventListener('pointermove', onPointerMove)
  }
}

interface HeroParticleCanvasProps {
  active: boolean
  className?: string
}

export function HeroParticleCanvas({ active, className }: HeroParticleCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return

    const hostEl = wrapRef.current
    const canvasEl = canvasRef.current
    if (hostEl === null || canvasEl === null) return

    const ctx2d = canvasEl.getContext('2d')
    if (ctx2d === null) return

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return () => {}
    }

    return runParticleLoop(hostEl, canvasEl, ctx2d)
  }, [active])

  if (!active) return null

  return (
    <div
      ref={wrapRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
      aria-hidden
    >
      <canvas
        id="particle-canvas"
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  )
}
