export type OrderStatus = 'PENDING_PAYMENT' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
export type UserRole = 'admin' | 'staff' | 'kitchen'

interface TransitionRule {
  from: OrderStatus
  to: OrderStatus
  allowedRoles: UserRole[]
}

const TRANSITIONS: TransitionRule[] = [
  // PENDING_PAYMENT (order not paid yet)
  { from: 'PENDING_PAYMENT', to: 'CANCELLED', allowedRoles: ['admin', 'staff'] },

  // PENDING
  { from: 'PENDING', to: 'CONFIRMED', allowedRoles: ['admin', 'staff'] },
  { from: 'PENDING', to: 'CANCELLED', allowedRoles: ['admin', 'staff'] },
  
  // CONFIRMED
  { from: 'CONFIRMED', to: 'PREPARING', allowedRoles: ['admin', 'kitchen'] },
  { from: 'CONFIRMED', to: 'CANCELLED', allowedRoles: ['admin', 'staff'] }, // Sometimes staff need to cancel before prep starts
  
  // PREPARING
  { from: 'PREPARING', to: 'READY', allowedRoles: ['admin', 'kitchen'] },
  
  // READY
  { from: 'READY', to: 'COMPLETED', allowedRoles: ['admin', 'staff'] }
]

export function canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus, role: UserRole): boolean {
  if (currentStatus === targetStatus) return false

  const transition = TRANSITIONS.find(
    (t) => t.from === currentStatus && t.to === targetStatus
  )

  if (!transition) return false

  return transition.allowedRoles.includes(role)
}

export function getAvailableTransitions(currentStatus: OrderStatus, role: UserRole): OrderStatus[] {
  return TRANSITIONS
    .filter((t) => t.from === currentStatus && t.allowedRoles.includes(role))
    .map((t) => t.to)
}
