"use client"

import type { ReactNode } from "react"
import { scrollToId } from "./scroll-to"

export function ScrollLink({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => scrollToId(id)}
      className={className}
    >
      {children}
    </button>
  )
}
