"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  name?: string
} | null>(null)

function RadioGroup({
  value,
  onValueChange,
  name,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  value: string
  onValueChange: (value: string) => void
  name?: string
}) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div
        data-slot="radio-group"
        role="radiogroup"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
}

function RadioGroupItem({
  value,
  className,
  ...props
}: React.ComponentProps<"input"> & { value: string }) {
  const context = React.useContext(RadioGroupContext)
  const checked = context?.value === value

  return (
    <span
      data-slot="radio-group-item"
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "relative inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
        checked ? "border-primary" : "border-border bg-background",
        className
      )}
    >
      <input
        type="radio"
        name={context?.name}
        value={value}
        checked={checked}
        onChange={(e) => {
          if (e.target.checked) context?.onValueChange(value)
        }}
        className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-full opacity-0 focus-visible:ring-3 focus-visible:ring-ring/50"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none size-2 rounded-full bg-primary transition-transform duration-150",
          checked ? "scale-100" : "scale-0"
        )}
      />
    </span>
  )
}

export { RadioGroup, RadioGroupItem }
