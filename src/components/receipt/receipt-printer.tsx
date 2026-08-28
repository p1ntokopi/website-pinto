'use client'

import { createContext, useContext } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { CheckCircle, Loader2, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'

// motion props exclude the DOM drag handlers and carry MotionValue-typed
// children; both need adjusting before spreading plain div props through.
type MotionDivProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children?: React.ReactNode
}

export type ReceiptPrinterStage = 'processing' | 'printing' | 'tearing' | 'complete'
export type ReceiptPrinterFeedMotion = 'stepped' | 'smooth'

type ReceiptPrinterContextValue = {
  animate: boolean
  feedMotion: ReceiptPrinterFeedMotion
  shouldMove: boolean
  tuckAway: boolean
  stage: ReceiptPrinterStage
}

const ReceiptPrinterContext = createContext<ReceiptPrinterContextValue | null>(null)

const easeOutSmooth = [0.16, 1, 0.3, 1] as const
const easeInOutSmooth = [0.65, 0, 0.35, 1] as const

const receiptToothCount = 36
const receiptToothDepth = 3.5

const topToothPoints = Array.from(
  { length: receiptToothCount * 2 + 1 },
  (_, index) => {
    const x = (index * 100) / (receiptToothCount * 2)
    const y = index % 2 === 0 ? '0px' : `${receiptToothDepth}px`
    return `${x}% ${y}`
  },
).join(', ')

const bottomToothPoints = Array.from(
  { length: receiptToothCount * 2 + 1 },
  (_, index) => {
    const x = 100 - (index * 100) / (receiptToothCount * 2)
    const y = index % 2 === 0 ? '100%' : `calc(100% - ${receiptToothDepth}px)`
    return `${x}% ${y}`
  },
).join(', ')

const receiptClipPathAttached = `polygon(0 0, 100% 0, 100% calc(100% - ${receiptToothDepth}px), ${bottomToothPoints})`
const receiptClipPathTorn = `polygon(${topToothPoints}, 100% calc(100% - ${receiptToothDepth}px), ${bottomToothPoints})`

const printingTransformKeyframes = [
  'translateY(calc(-100% + 4px))',
  'translateY(-90%)',
  'translateY(-90%)',
  'translateY(-80%)',
  'translateY(-80%)',
  'translateY(-69%)',
  'translateY(-69%)',
  'translateY(-57%)',
  'translateY(-57%)',
  'translateY(-45%)',
  'translateY(-45%)',
  'translateY(-33%)',
  'translateY(-33%)',
  'translateY(-22%)',
  'translateY(-22%)',
  'translateY(-12%)',
  'translateY(-12%)',
  'translateY(-4%)',
  'translateY(-4%)',
  'translateY(0%)',
]

const printingKeyframeTimes = [
  0, 0.08, 0.11, 0.19, 0.22, 0.3, 0.33, 0.41, 0.44, 0.52, 0.55, 0.63, 0.66,
  0.74, 0.77, 0.85, 0.88, 0.94, 0.96, 1,
]

export const RECEIPT_PRINTER_STATUS_LABELS: Record<ReceiptPrinterStage, string> = {
  processing: 'Memproses pesanan kamu...',
  printing: 'Mencetak struk pesanan...',
  tearing: 'Menyobek struk...',
  complete: 'Pesanan berhasil dibuat!',
}

function useReceiptPrinter(component: string): ReceiptPrinterContextValue {
  const context = useContext(ReceiptPrinterContext)
  if (!context) {
    throw new Error(`${component} must be used inside ReceiptPrinter.Root.`)
  }
  return context
}

type ReceiptPrinterRootProps = React.ComponentProps<'section'> & {
  stage: ReceiptPrinterStage
  animate?: boolean
  feedMotion?: ReceiptPrinterFeedMotion
  /**
   * Whether the machine tucks away (slides up) once the receipt is complete.
   * Disable when the machine should stay in place (e.g. admin print preview).
   */
  tuckAway?: boolean
}

function ReceiptPrinterRoot({
  'aria-label': ariaLabel = 'Receipt printer',
  animate = true,
  children,
  className,
  feedMotion = 'stepped',
  stage,
  tuckAway = true,
  ...props
}: ReceiptPrinterRootProps) {
  const shouldReduceMotion = useReducedMotion()
  const context: ReceiptPrinterContextValue = {
    animate,
    feedMotion,
    shouldMove: animate && !shouldReduceMotion,
    tuckAway,
    stage,
  }

  return (
    <ReceiptPrinterContext.Provider value={context}>
      <section
        aria-label={ariaLabel}
        className={cn(
          'relative isolate flex w-full max-w-sm flex-col items-center',
          className,
        )}
        data-stage={stage}
        {...props}
      >
        {children}
      </section>
    </ReceiptPrinterContext.Provider>
  )
}

function ReceiptPrinterMachine({ children, className, ...props }: MotionDivProps) {
  const { stage, shouldMove, tuckAway } = useReceiptPrinter('ReceiptPrinter.Machine')
  const isTearing = stage === 'tearing'
  const isComplete = stage === 'complete'
  const shouldTuck = isComplete && shouldMove && tuckAway

  return (
    <motion.div
      animate={{
        y: shouldTuck ? -80 : 0,
        opacity: shouldTuck ? 0 : 1,
        scale: shouldTuck ? 0.94 : 1,
        marginBottom: shouldTuck ? -150 : 0,
      }}
      transition={{ duration: 0.65, ease: easeOutSmooth }}
      className={cn(
        'relative isolate z-30 w-full overflow-hidden rounded-[1.5rem] border border-[#3d342b] bg-[#221c16] p-3 pb-6',
        'shadow-[0_20px_36px_-20px_rgba(23,21,19,0.55),0_6px_14px_-8px_rgba(23,21,19,0.24),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.4)]',
        isComplete && shouldTuck && 'pointer-events-none',
        className,
      )}
      {...props}
    >
      {children}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 bottom-2 z-40 flex h-2.5 items-center justify-center overflow-hidden rounded-[0.25rem] border border-[#2a241e] bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)]"
      >
        {isTearing && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 1, 0.4, 0], scaleX: [0, 1, 1, 1] }}
            transition={{ duration: 0.35, ease: easeOutSmooth }}
            className="h-full w-full bg-warning shadow-[0_0_8px_rgba(197,139,42,0.8)]"
          />
        )}
      </div>
    </motion.div>
  )
}

function ReceiptPrinterHeader({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('relative z-10 flex h-11 items-start justify-between', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function ReceiptPrinterScreen({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative isolate z-10 overflow-hidden rounded-[calc(1.5rem_-_0.75rem)] border border-[#3d342b] bg-[#0e0b09] p-4 text-paper',
        'shadow-inner shadow-black/80',
        "after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:shadow-[inset_0_0_24px_4px_rgba(0,0,0,0.52)] after:content-['']",
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  )
}

type StatusIndicatorProps = {
  animate: boolean
  move: boolean
  stage: ReceiptPrinterStage
}

function StatusIndicator({ animate, move, stage }: StatusIndicatorProps) {
  const isComplete = stage === 'complete'
  const isTearing = stage === 'tearing'

  return (
    <span aria-hidden="true" className="relative grid size-5 shrink-0 place-items-center">
      <AnimatePresence initial={false} mode="sync">
        {isComplete ? (
          <motion.span
            animate={{ opacity: 1, transform: 'scale(1)' }}
            className="col-start-1 row-start-1 grid place-items-center text-success"
            exit={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.96)' : 'scale(1)',
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.94)' : 'scale(1)',
            }}
            key="complete"
            transition={{ duration: animate ? 0.2 : 0, ease: easeOutSmooth }}
          >
            <CheckCircle size={18} />
          </motion.span>
        ) : isTearing ? (
          <motion.span
            animate={{ opacity: 1, rotate: [0, -18, 12, 0] }}
            className="col-start-1 row-start-1 grid place-items-center text-warning"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, scale: 0.85 }}
            key="tearing"
            transition={{ duration: 0.4, ease: easeOutSmooth }}
          >
            <Scissors size={17} />
          </motion.span>
        ) : (
          <motion.span
            animate={{ opacity: 1, transform: 'scale(1)' }}
            className="col-start-1 row-start-1 grid place-items-center text-paper/60"
            exit={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.96)' : 'scale(1)',
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.94)' : 'scale(1)',
            }}
            key="working"
            transition={{ duration: animate ? 0.2 : 0, ease: easeOutSmooth }}
          >
            <Loader2 className={cn(animate && 'animate-spin')} size={18} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

function ReceiptPrinterStatus({ children, className, ...props }: React.ComponentProps<'div'>) {
  const { animate, shouldMove, stage } = useReceiptPrinter('ReceiptPrinter.Status')

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)} {...props}>
      <StatusIndicator animate={animate} move={shouldMove} stage={stage} />
      <div aria-live="polite" className="grid min-w-0 flex-1 items-center" role="status">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            className="col-start-1 row-start-1 truncate text-xs font-medium leading-none text-paper/60"
            exit={{
              opacity: animate ? 0 : 1,
              transform: shouldMove ? 'translateY(-4px)' : 'translateY(0px)',
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: shouldMove ? 'translateY(4px)' : 'translateY(0px)',
            }}
            key={stage}
            transition={{ duration: animate ? 0.22 : 0, ease: easeOutSmooth }}
          >
            {children ?? RECEIPT_PRINTER_STATUS_LABELS[stage]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function ReceiptPrinterPaper({
  children,
  className,
  style,
  ref,
  ...props
}: React.ComponentProps<'article'>) {
  const { stage } = useReceiptPrinter('ReceiptPrinter.Paper')
  const isTorn = stage === 'tearing' || stage === 'complete'

  return (
    <article
      ref={ref}
      className={cn(
        'relative z-10 bg-[#faf8f5] px-5 pt-3 pb-5 font-mono text-ink transition-[clip-path] duration-300',
        className,
      )}
      style={{
        clipPath: isTorn ? receiptClipPathTorn : receiptClipPathAttached,
        ...style,
      }}
      {...props}
    >
      {children}
    </article>
  )
}

function ReceiptPrinterOutput({ children, className, ...props }: MotionDivProps) {
  const { animate, feedMotion, shouldMove, tuckAway, stage } = useReceiptPrinter(
    'ReceiptPrinter.Output',
  )
  const isReceiptVisible = stage !== 'processing'
  const isComplete = stage === 'complete'
  const shouldUseSteppedFeed = feedMotion === 'stepped' && stage === 'printing' && shouldMove

  return (
    <motion.div
      animate={{
        marginTop: isComplete && shouldMove && tuckAway ? '0.25rem' : '-1.15rem',
      }}
      transition={{ duration: 0.65, ease: easeOutSmooth }}
      className={cn(
        'relative z-10 w-[calc(80%+3rem)] max-w-full px-6',
        isComplete ? 'h-auto overflow-visible' : 'h-[32rem] overflow-hidden',
        className,
      )}
      {...props}
    >
      {isReceiptVisible && !isComplete ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 z-20 h-2 bg-black/80 blur-[4px]"
        />
      ) : null}

      <motion.div
        animate={
          stage === 'printing' && shouldMove
            ? {
                opacity: 1,
                transform: shouldUseSteppedFeed
                  ? printingTransformKeyframes
                  : 'translateY(0%)',
                x: 0,
                rotate: 0,
              }
            : stage === 'tearing' && shouldMove
              ? {
                  opacity: 1,
                  transform: 'translateY(0%)',
                  x: [0, -2, 1.5, -0.5, 0],
                  rotate: [0, -0.6, 0.4, 0],
                }
              : isComplete && shouldMove
                ? {
                    opacity: 1,
                    transform: 'translateY(0%)',
                    x: 0,
                    rotate: 0,
                  }
                : {
                    opacity: isReceiptVisible ? 1 : 0,
                    transform: isReceiptVisible
                      ? 'translateY(0%)'
                      : 'translateY(calc(-100% + 4px))',
                    x: 0,
                    rotate: 0,
                  }
        }
        aria-hidden={stage !== 'complete'}
        className={cn(
          'relative isolate transition-shadow duration-500',
          isComplete
            ? "before:pointer-events-none before:absolute before:inset-x-2 before:top-2 before:bottom-2 before:z-0 before:rounded-sm before:shadow-[0_20px_45px_-10px_rgba(23,21,19,0.65),0_4px_16px_rgba(23,21,19,0.3)] before:content-['']"
            : "before:pointer-events-none before:absolute before:inset-x-3 before:top-3 before:bottom-4 before:z-0 before:rounded-sm before:shadow-[0_8px_24px_rgba(23,21,19,0.24)] before:content-[''] after:pointer-events-none after:absolute after:right-[8%] after:bottom-0 after:left-[8%] after:z-0 after:h-3 after:translate-y-1.5 after:rounded-full after:bg-black/10 after:blur-lg after:content-['']",
        )}
        whileHover={
          isComplete && shouldMove
            ? {
                y: -3,
                scale: 1.01,
                transition: { duration: 0.25, ease: easeOutSmooth },
              }
            : undefined
        }
        initial={false}
        transition={{
          opacity: { duration: animate ? 0.2 : 0, ease: easeOutSmooth },
          transform: {
            duration: shouldMove ? 3.4 : 0,
            ease: shouldUseSteppedFeed ? 'linear' : easeInOutSmooth,
            times: shouldUseSteppedFeed ? printingKeyframeTimes : undefined,
          },
          x: { duration: 0.4, ease: easeOutSmooth },
          rotate: { duration: 0.4, ease: easeOutSmooth },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export const ReceiptPrinter = {
  Header: ReceiptPrinterHeader,
  Machine: ReceiptPrinterMachine,
  Output: ReceiptPrinterOutput,
  Paper: ReceiptPrinterPaper,
  Root: ReceiptPrinterRoot,
  Screen: ReceiptPrinterScreen,
  Status: ReceiptPrinterStatus,
}
