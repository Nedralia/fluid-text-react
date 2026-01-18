import React, { useCallback, useEffect, useRef } from 'react'
import {
  colorloop,
  shiftColorToOther
} from './colors'

import './FluidText.css'

interface FluidTextProps {
  text: string
  fontSize?: number
  strokeColor?: string
  fontStyle?: string
  leftColor?: string
  rightColor?: string
  particleRadius?: number
  particleDistance?: number
}

interface Point {
  x: number
  y: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  originalPoint: Point
  radius: number
  color: string
  age: number
}

interface TextStyle {
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  strokeStyle: string
}

/**
 * Renders a component that displays fluid text in a canvas.
 *
 * @component
 * @param {string} props.text - The text to be displayed.
 * @returns {React.ReactElement} The rendered component.
 */
const FluidText = ({
  text,
  fontSize: fSize,
  strokeColor: sColor,
  fontStyle: fStyle,
  leftColor: cLeft,
  rightColor: cRight,
  particleRadius: pRadius,
  particleDistance: pDistance
}: FluidTextProps): React.ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fontSize = fSize ?? 120
  const fontStyle = fStyle ?? 'Helvetica Neue'
  const strokeColor = sColor ?? '#000'
  const textStyle: TextStyle = {
    font: `bold ${fontSize}px ${fontStyle}`,
    textAlign: 'left',
    textBaseline: 'middle',
    strokeStyle: strokeColor
  }

  const particleRadius = pRadius ?? 4
  const particleDistance = pDistance ?? 10

  const strokeParticleColor = '#ffffff'
  let colorLeft = cLeft ?? '#578fb1'
  let colorRight = cRight ?? '#ff0000'

  // Fix the color gradient of the background particles so that it doesn't break

  const canvasPixelHeight = 150
  const canvasPixelWidth = 800

  const canvasResolutionHeight = 200
  const canvasResolutionWidth = 1000

  const particles: Particle[] = []
  const backgroundParticles: Particle[] = []

  const applyTextOverlay = (ctx: CanvasRenderingContext2D): void => {
    if (canvasRef.current === null) { return }
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = 'black'
    ctx.textAlign = textStyle.textAlign
    ctx.textBaseline = textStyle.textBaseline
    ctx.font = textStyle.font
    ctx.fillText(text, 0, canvasRef.current?.height / 2)
  }

  const drawTextOutline = (ctx: CanvasRenderingContext2D): void => {
    if (canvasRef.current === null) { return }
    ctx.globalCompositeOperation = 'xor'
    ctx.fillStyle = 'transparent'
    ctx.strokeStyle = textStyle.strokeStyle
    ctx.textAlign = textStyle.textAlign
    ctx.textBaseline = textStyle.textBaseline
    ctx.font = textStyle.font
    ctx.lineWidth = 3
    ctx.strokeText(text, 0, canvasRef.current?.height / 2)
  }

  const createParticle = (x: number, y: number, color: string, radius?: number, movement?: boolean): Particle => {
    const particle: Particle = {
      x,
      y,
      vx: movement ?? false ? Math.random() * 2 - 1 : 0,
      vy: movement ?? false ? Math.random() * 2 - 1 : 0,
      originalPoint: { x, y },
      radius: radius ?? Math.random() * 3 + 1,
      color,
      age: 0
    }

    return particle
  }

  const spawnParticle = (x: number, y: number): void => {
    const color = strokeParticleColor
    const particle = createParticle(x, y, color, particleRadius, true)
    particles.push(particle)
  }

  const spawnBackgroundParticle = (x: number, y: number): void => {
    const particle = createParticle(x, y, '#ffffff', particleRadius)
    backgroundParticles.push(particle)
  }

  const updateBackgroundParticleColors = (): void => {
    for (let i = 0; i < backgroundParticles.length; i += 1) {
      const particle = backgroundParticles[i]
      const trueColor = shiftColorToOther(colorLeft, colorRight, particle.x / 10)
      particle.color = trueColor
    }
  }

  const drawBackgroundParticles = (ctx: CanvasRenderingContext2D): void => {
    ctx.globalCompositeOperation = 'source-over'
    for (let i = 0; i < backgroundParticles.length; i += 1) {
      const particle = backgroundParticles[i]

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, 2 * Math.PI)
      ctx.fillStyle = particle.color
      ctx.fill()
    }
  }

  const drawParticles = (ctx: CanvasRenderingContext2D): void => {
    ctx.globalCompositeOperation = 'destination-over'
    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i]

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, 2 * Math.PI)
      ctx.fillStyle = particle.color
      ctx.fill()
    }
  }

  const removeParticle = (index: number): void => {
    particles.splice(index, 1)
  }

  /**
   * Color shift the edge colors
   *
   * @returns {void}
   */
  const updateEdgeColors = (): void => {
    const newColorLeft = colorloop(colorLeft)
    const newColorRight = colorloop(colorRight)
    colorLeft = newColorLeft
    colorRight = newColorRight
  }

  const updateParticles = (): void => {
    if (canvasRef.current === null) { return }

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i]

      // Update the age of the particle
      particle.age += 1

      // Remove particles that are too old
      if (particle.age > 50) {
        removeParticle(i)
      }

      // Update position
      particle.x += particle.vx
      particle.y += particle.vy

      // Slow down particles slightly
      particle.vx *= 0.99
      particle.vy *= 0.99

      // Shift color towards background color
      const trueColor = shiftColorToOther(colorLeft, colorRight, particle.x / 10)

      // Implement this color shift
      particle.color = shiftColorToOther(particle.color, trueColor, 3)

      if (particle.x < 0 || particle.x > canvasRef.current?.width) {
        removeParticle(i)
      }

      if (particle.y < 0 || particle.y > canvasRef.current?.height) {
        removeParticle(i)
      }
    }
  }

  /**
   * Apply a force to a particle to move it towards a point
   *
   * @param particle The particle to apply the force to
   * @param to The point to move the particle towards
   * @param force The strength of the force
   */
  const applyForce = (particle: Particle, to: Point, force: number): void => {
    const dx = to.x - particle.x
    const dy = to.y - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    particle.vx += force * Math.cos(angle) * Math.max(distance / 4, 1)
    particle.vy += force * Math.sin(angle) * Math.max(distance / 4, 1)
  }

  /**
   * Apply a force to repel close background particles, but attract far away ones.
   * This is to make the background particles more evenly distributed and avoid cracks.
   * @returns {void}
  */
  const evenOutBackgroundParticles = (): void => {
    for (let i = 0; i < backgroundParticles.length; i += 1) {
      const particle = backgroundParticles[i]
      applyForce(particle, particle.originalPoint, 0.04)
    }
  }

  const updateBackgroundParticles = (): void => {
    if (canvasRef.current === null) { return }

    evenOutBackgroundParticles()

    for (let i = 0; i < backgroundParticles.length; i += 1) {
      const particle = backgroundParticles[i]

      // Update position
      particle.x += particle.vx
      particle.y += particle.vy

      // Slow down particles slightly
      particle.vx *= 0.5
      particle.vy *= 0.5
    }
  }

  const spawnBackgroundParticles = (): void => {
    // Spawn background particles across the whole canvas with a little distance between them
    for (let x = 0; x < canvasResolutionWidth; x += particleDistance) {
      for (let y = 0; y < canvasResolutionHeight; y += particleDistance) {
        spawnBackgroundParticle(x, y)
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    let interval: NodeJS.Timeout

    if (canvas !== null) {
      const ctx = canvas.getContext('2d')

      spawnBackgroundParticles()

      if (ctx !== null) {
        canvas.width = canvasResolutionWidth
        canvas.height = canvasResolutionHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        interval = setInterval(() => { loop(ctx, canvas) }, 1000 / 60)
      }
    }

    return (): void => {
      clearInterval(interval)
    }
  }, [text])

  const loop = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
    // Increase performance on the page by skipping if the v of all particles are 0
    // Another check could be if there have been no mouse interactions in the last 5 seconds

    updateBackgroundParticles()
    updateBackgroundParticleColors()
    updateParticles()
    // updateEdgeColors()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawBackgroundParticles(ctx)
    drawParticles(ctx)
    applyTextOverlay(ctx)
    drawTextOutline(ctx)
  }

  const repellParticles = useCallback((x: number, y: number): void => {
    for (let i = 0; i < backgroundParticles.length; i += 1) {
      const particle = backgroundParticles[i]

      const dx = particle.x - x
      const dy = particle.y - y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < particleRadius * 12) {
        const angle = Math.atan2(dy, dx)
        const force = 60 / Math.max(distance, 1)
        particle.vx += force * Math.cos(angle)
        particle.vy += force * Math.sin(angle)
      }
    }
  }, [])

  // Set up mouse event handlers for the canvas
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (canvasRef.current === null) { return }
    const x = e.clientX - canvasRef.current.getBoundingClientRect().left
    const y = e.clientY - canvasRef.current.getBoundingClientRect().top

    const correctedX = x * (canvasResolutionWidth / canvasPixelWidth)
    const correctedY = y * (canvasResolutionHeight / canvasPixelHeight)

    for (let i = 0; i < 5; i += 1) {
      spawnParticle(correctedX, correctedY)
    }

    repellParticles(correctedX, correctedY)
  }, [])

  return <canvas
    className="fluid-text-react"
    ref={canvasRef}
    height={100}
    width={380}
    onMouseMove={handleMouseMove}
  />
}

export default FluidText
