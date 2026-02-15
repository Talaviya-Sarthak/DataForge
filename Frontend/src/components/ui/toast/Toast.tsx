"use client"

import { useEffect, useState, createContext, useContext } from "react"
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  className?: string
}

const toastIcons = {
  success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
}

const toastClasses = {
  success:
    "border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950",
  error: "border-red-100 bg-red-50 dark:border-red-900 dark:bg-red-950",
  warning:
    "border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
  info: "border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
}

type ToastContextType = {
  show: (toast: ToastProps) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastProps | null>(null)

  const show = (t: ToastProps) => setToast(t)

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <AnimatePresence>
        {toast && (
          <BasicToast
            {...toast}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be inside ToastProvider")
  return ctx
}

function BasicToast({
  message,
  type = "info",
  duration = 3000,
  className = "",
  onClose,
}: ToastProps & { onClose?: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed top-4 right-4 z-50 flex w-80 items-center gap-3 rounded-lg border p-4 shadow-lg ${toastClasses[type]} ${className}`}
          initial={{ opacity: 0, x: 50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.8, transition: { duration: 0.15 } }}
          transition={{ type: "spring", bounce: 0.25 }}
        >
          <div className="flex-shrink-0">{toastIcons[type]}</div>
          <p className="flex-1 text-sm">{message}</p>
          <button
            onClick={() => {
              setVisible(false)
              onClose?.()
            }}
            className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
