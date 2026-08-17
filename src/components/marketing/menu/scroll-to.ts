"use client"

export function scrollToId(id: string, offset = 150) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: y, behavior: "smooth" })
}
