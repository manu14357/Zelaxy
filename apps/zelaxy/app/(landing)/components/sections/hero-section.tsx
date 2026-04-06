'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'

const GITHUB_REPO = 'manu14357/Zelaxy'

function FloatingMesh({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      container.offsetWidth / container.offsetHeight,
      0.1,
      100
    )
    camera.position.z = 4

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.offsetWidth, container.offsetHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Icosahedron wireframe with glow
    const geometry = new THREE.IcosahedronGeometry(1.4, 1)
    const wireframe = new THREE.WireframeGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#f97316'),
      transparent: true,
      opacity: 0.3,
    })
    const lineSegments = new THREE.LineSegments(wireframe, lineMaterial)
    scene.add(lineSegments)

    // Inner glow sphere
    const glowGeo = new THREE.SphereGeometry(1.2, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#f97316'),
      transparent: true,
      opacity: 0.04,
    })
    const glowSphere = new THREE.Mesh(glowGeo, glowMat)
    scene.add(glowSphere)

    // Orbiting particles
    const particleCount = 60
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.8 + Math.random() * 0.8
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color('#fb923c'),
      size: 0.025,
      transparent: true,
      opacity: 0.6,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      lineSegments.rotation.x += 0.002
      lineSegments.rotation.y += 0.003
      glowSphere.rotation.y += 0.001
      particles.rotation.y -= 0.001
      particles.rotation.x += 0.0005
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!container) return
      camera.aspect = container.offsetWidth / container.offsetHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.offsetWidth, container.offsetHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      geometry.dispose()
      lineMaterial.dispose()
      glowGeo.dispose()
      glowMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={mountRef} className={className} />
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === 'number') setStars(data.stargazers_count)
      })
      .catch(() => {})
  }, [])

  return (
    <section className='relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-white dark:bg-[#060606]'>
      {/* Subtle dot grid */}
      <div
        className='pointer-events-none absolute inset-0 opacity-100 dark:opacity-100'
        style={{
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)',
        }}
      >
        <div
          className='hidden h-full w-full dark:block'
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className='block h-full w-full dark:hidden'
          style={{
            backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Ambient orbs */}
      <div className='-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/4 left-1/2 h-[600px] w-[600px] rounded-full bg-orange-500/[0.06] blur-[160px]' />
      <div className='pointer-events-none absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-amber-400/[0.04] blur-[100px]' />

      <div className='relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-16 sm:pt-0 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
        {/* Text */}
        <div className='max-w-2xl text-center lg:text-left'>
          {/* Badge row */}
          <div
            className={`mb-6 flex flex-wrap items-center justify-center gap-2 transition-all duration-700 sm:mb-8 lg:justify-start ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <div className='inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-4 py-1.5 text-[13px] backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]'>
              <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400' />
              <span className='text-neutral-500 dark:text-neutral-400'>Open-Source</span>
            </div>
            {stars !== null && (
              <Link
                href={`https://github.com/${GITHUB_REPO}`}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 font-medium text-[13px] text-amber-600 transition-all duration-200 hover:border-amber-500/40 hover:bg-amber-500/15 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/15'
              >
                <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
                {stars.toLocaleString()}
              </Link>
            )}
          </div>

          {/* Headline */}
          <h1
            className={`mb-4 font-bold text-[clamp(2rem,6vw,4.5rem)] text-neutral-900 leading-[1.05] tracking-[-0.04em] transition-all delay-100 duration-700 sm:mb-6 dark:text-white ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            Build AI workflows <span className='text-gradient-apple'>visually.</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`mb-2 max-w-lg text-base text-neutral-600 leading-relaxed transition-all delay-200 duration-700 sm:text-lg dark:text-neutral-400 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            } mx-auto lg:mx-0`}
          >
            Wire up AI agents, APIs, and logic on a drag-and-drop canvas. Ship automations that run
            themselves.
          </p>

          {/* Tagline */}
          <p
            className={`mb-6 max-w-lg text-[14px] text-neutral-400 leading-relaxed transition-all delay-[250ms] duration-700 sm:mb-10 sm:text-[15px] dark:text-neutral-600 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            } mx-auto lg:mx-0`}
          >
            The visual canvas where AI workflows come to life.
          </p>

          {/* CTA */}
          <div
            className={`flex flex-wrap items-center justify-center gap-3 transition-all delay-300 duration-700 lg:justify-start ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <Button
              asChild
              size='lg'
              className='group h-12 rounded-full bg-neutral-900 px-8 font-medium text-[15px] text-white transition-all duration-300 hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-neutral-200'
            >
              <Link href='/signup'>
                Get Started
                <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5' />
              </Link>
            </Button>

            <Button
              asChild
              variant='ghost'
              size='lg'
              className='h-12 rounded-full border border-neutral-300 bg-transparent px-7 font-medium text-[15px] text-neutral-600 transition-all duration-300 hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.98] dark:border-white/[0.1] dark:text-neutral-300 dark:hover:border-white/[0.2] dark:hover:bg-white/[0.05] dark:hover:text-white'
            >
              <Link
                href='https://github.com/manu14357/Zelaxy'
                target='_blank'
                rel='noopener noreferrer'
              >
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>

        {/* 3D mesh */}
        <div
          className={`mt-8 h-[240px] w-[240px] shrink-0 transition-all delay-500 duration-1000 sm:mt-16 sm:h-[340px] sm:w-[340px] md:h-[420px] md:w-[420px] lg:mt-0 lg:h-[480px] lg:w-[480px] ${
            mounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        >
          <FloatingMesh className='h-full w-full' />
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={`-translate-x-1/2 absolute bottom-8 left-1/2 flex flex-col items-center gap-2 transition-all delay-700 duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className='h-8 w-[1px] animate-pulse bg-gradient-to-b from-transparent via-neutral-600 to-transparent' />
      </div>
    </section>
  )
}
