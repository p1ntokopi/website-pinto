import { describe, it, expect } from 'vitest'
import { canTransition, getAvailableTransitions } from '@/lib/orders/status-machine'

describe('status-machine', () => {
  it('rejects same-status transitions', () => {
    expect(canTransition('PENDING', 'PENDING', 'admin')).toBe(false)
    expect(canTransition('READY', 'READY', 'staff')).toBe(false)
  })

  it('allows only the configured role for each step', () => {
    // staff/admin confirm + cancel from PENDING; kitchen cannot.
    expect(canTransition('PENDING', 'CONFIRMED', 'admin')).toBe(true)
    expect(canTransition('PENDING', 'CONFIRMED', 'staff')).toBe(true)
    expect(canTransition('PENDING', 'CONFIRMED', 'kitchen')).toBe(false)

    // kitchen + admin run PREPARING -> READY; staff cannot.
    expect(canTransition('PREPARING', 'READY', 'kitchen')).toBe(true)
    expect(canTransition('PREPARING', 'READY', 'admin')).toBe(true)
    expect(canTransition('PREPARING', 'READY', 'staff')).toBe(false)
  })

  it('rejects illegal jumps (no skipping steps)', () => {
    expect(canTransition('PENDING', 'READY', 'admin')).toBe(false)
    expect(canTransition('CONFIRMED', 'COMPLETED', 'admin')).toBe(false)
    expect(canTransition('READY', 'PENDING', 'admin')).toBe(false)
  })

  it('handles the PENDING_PAYMENT cancellation rule', () => {
    expect(canTransition('PENDING_PAYMENT', 'CANCELLED', 'admin')).toBe(true)
    expect(canTransition('PENDING_PAYMENT', 'CANCELLED', 'staff')).toBe(true)
    expect(canTransition('PENDING_PAYMENT', 'CANCELLED', 'kitchen')).toBe(false)
  })

  it('getAvailableTransitions lists the actionable next steps per role', () => {
    expect(getAvailableTransitions('PENDING', 'admin')).toEqual(
      expect.arrayContaining(['CONFIRMED', 'CANCELLED'])
    )
    expect(getAvailableTransitions('PREPARING', 'kitchen')).toEqual(['READY'])
    expect(getAvailableTransitions('COMPLETED', 'admin')).toEqual([])
  })
})