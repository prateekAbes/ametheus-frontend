import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Brackets } from './ui'

interface PortalProps {
  children: ReactNode
  lockScroll?: boolean
}

let activeModalCount = 0
let originalOverflow = ''
let originalPaddingRight = ''

/**
 * Universal Portal component that mounts children directly into document.body
 * and manages global body scroll locking without layout shift.
 */
export function Portal({ children, lockScroll = true }: PortalProps) {
  useEffect(() => {
    if (typeof document === 'undefined' || !lockScroll) return

    if (activeModalCount === 0) {
      originalOverflow = document.body.style.overflow
      originalPaddingRight = document.body.style.paddingRight
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`
      }
    }
    activeModalCount++

    return () => {
      activeModalCount--
      if (activeModalCount <= 0) {
        activeModalCount = 0
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [lockScroll])

  if (typeof document === 'undefined') return null

  return createPortal(children, document.body)
}

export interface ModalProps {
  open?: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  children: ReactNode
  maxWidth?: string
  brackets?: boolean
  raw?: boolean
  className?: string
  footer?: ReactNode
  ariaLabel?: string
}

/**
 * Universal Viewport-Locked Modal Component.
 * - Always renders via createPortal(..., document.body)
 * - Pinned to the browser viewport (fixed inset-0 z-[100])
 * - Locks body scroll while mounted
 * - Centers the modal dialog on screen
 * - Internal scrolling with max-h-[min(90vh,calc(100svh-2rem))] overflow-y-auto
 * - Escape key & backdrop click to close
 * - Mobile responsive down to 360px viewport
 */
export function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  badge,
  children,
  maxWidth = 'max-w-xl',
  brackets = true,
  raw = false,
  className = '',
  footer,
  ariaLabel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const modalAriaLabel =
    ariaLabel || (typeof title === 'string' ? title : 'Platform Dialog')

  return (
    <Portal lockScroll>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalAriaLabel}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-void/85 backdrop-blur-md overflow-hidden select-none"
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full ${maxWidth} max-h-[min(90vh,calc(100svh-2rem))] flex flex-col bg-graphite border border-white/20 shadow-2xl overflow-hidden select-text ${className}`}
        >
          {brackets && <Brackets color="border-cyan/50" />}

          {raw ? (
            <div className="overflow-y-auto max-h-[min(90vh,calc(100svh-2rem))] flex-1">
              {children}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-surface/80 px-6 py-4 shrink-0">
                <div className="min-w-0 pr-4">
                  {badge && <div className="mb-1.5">{badge}</div>}
                  {title && (
                    <h3 className="font-display text-2xl font-black uppercase text-ink truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="font-mono text-xs text-dim mt-0.5 line-clamp-2">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="shrink-0 p-1 text-dim hover:text-cyan border border-transparent hover:border-white/10 transition-colors cursor-pointer font-mono text-base"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto p-6 flex-1 text-ink">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="border-t border-white/10 bg-surface/50 px-6 py-4 shrink-0 flex items-center justify-end gap-3">
                  {footer}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Portal>
  )
}

export const PortalModal = Modal
export default Modal
