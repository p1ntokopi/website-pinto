'use client'

import { useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

interface GalleryVideoProps {
  src: string
  poster?: string
}

export function GalleryVideo({ src, poster }: GalleryVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    if (!ref.current) return
    if (ref.current.paused) {
      ref.current.play().catch(() => {})
    } else {
      ref.current.pause()
    }
  }

  return (
    <div className="relative w-full h-full group">
      <video
        ref={ref}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Jeda video' : 'Putar video'}
        className="absolute inset-0 z-10 flex items-center justify-center bg-ink/0 group-hover:bg-ink/10 transition-colors cursor-pointer"
      >
        {!playing && (
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-ink/40 text-paper backdrop-blur-sm group-hover:bg-ink/60 transition-colors">
            <Play className="w-7 h-7 fill-current" />
          </span>
        )}
        {playing && (
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-ink/40 text-paper backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Pause className="w-7 h-7 fill-current" />
          </span>
        )}
      </button>
    </div>
  )
}