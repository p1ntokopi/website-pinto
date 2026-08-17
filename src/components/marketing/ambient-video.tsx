'use client'

import { useEffect, useRef, useState } from 'react'

interface AmbientVideoProps {
  src: string
  poster?: string
  className?: string
}

export function AmbientVideo({ src, poster, className }: AmbientVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const sync = (isReduced: boolean) => {
      setReduced(isReduced)
      if (isReduced) {
        ref.current?.pause()
      } else {
        ref.current?.play().catch(() => {})
      }
    }

    sync(mq.matches)

    const onChange = (e: MediaQueryListEvent) => sync(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (reduced) {
    return poster ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={poster} alt="" className={className} />
    ) : null
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      className={className}
    />
  )
}