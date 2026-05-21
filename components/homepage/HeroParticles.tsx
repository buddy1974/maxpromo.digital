'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  size: number
  life: number
  maxLife: number
}

// 12–16 particles max per spec. Barely noticed, slow, soft.
const PARTICLE_COUNT = 14

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      spawnParticle(canvas.width, canvas.height)
    )

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x    += p.vx
        p.y    += p.vy
        p.life += 1

        // Fade in first 20% of life, fade out last 30%
        const lifeRatio = p.life / p.maxLife
        if      (lifeRatio < 0.2) p.opacity = (lifeRatio / 0.2) * 0.18
        else if (lifeRatio > 0.7) p.opacity = ((1 - lifeRatio) / 0.3) * 0.18
        else                      p.opacity = 0.18

        if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          Object.assign(p, spawnParticle(canvas.width, canvas.height))
          p.y = canvas.height + 10   // respawn at bottom
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(249, 115, 22, ${p.opacity})`
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 3,
        pointerEvents: 'none',
        opacity: 1,
      }}
    />
  )
}

function spawnParticle(w: number, h: number): Particle {
  return {
    x:       Math.random() * w,
    y:       h + Math.random() * 20,
    vx:      (Math.random() - 0.5) * 0.18,
    vy:      -(0.12 + Math.random() * 0.20),
    opacity: 0,
    size:    0.8 + Math.random() * 1.0,
    life:    0,
    maxLife: 220 + Math.random() * 180,
  }
}
