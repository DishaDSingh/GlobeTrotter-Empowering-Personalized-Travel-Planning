import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  side?: 'left' | 'right' | 'bottom'
}

export function Drawer({ open, onClose, title, children, side = 'right' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isBottom = side === 'bottom'
  const initial = isBottom ? { y: '100%' } : side === 'right' ? { x: '100%' } : { x: '-100%' }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/50"
            onClick={onClose}
          />
          <motion.div
            initial={initial}
            animate={{ x: 0, y: 0 }}
            exit={initial}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={
              isBottom
                ? 'absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-[var(--shadow-lift)]'
                : `absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full w-full max-w-sm overflow-y-auto bg-white p-6 shadow-[var(--shadow-lift)]`
            }
          >
            {isBottom && <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink-200" />}
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
