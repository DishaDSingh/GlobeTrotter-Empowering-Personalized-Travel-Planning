import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const fieldClasses =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-ink-50 disabled:text-ink-400'

interface FieldWrapperProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  htmlFor?: string
}

export function FieldWrapper({ label, error, hint, required, children, htmlFor }: FieldWrapperProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-800">
          {label}
          {required && <span className="text-sunset-500"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-danger-500">{error}</p>}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, required, leftIcon, id, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={id}>
        <div className="relative">
          {leftIcon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">{leftIcon}</span>}
          <input
            ref={ref}
            id={id}
            className={cn(fieldClasses, leftIcon && 'pl-10', error && 'border-danger-500 focus:ring-danger-500/20', className)}
            aria-invalid={!!error}
            {...props}
          />
        </div>
      </FieldWrapper>
    )
  },
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, id, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={id}>
        <textarea
          ref={ref}
          id={id}
          className={cn(fieldClasses, 'min-h-[100px] resize-y', error && 'border-danger-500 focus:ring-danger-500/20', className)}
          aria-invalid={!!error}
          {...props}
        />
      </FieldWrapper>
    )
  },
)
Textarea.displayName = 'Textarea'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, required, id, children, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={id}>
        <select
          ref={ref}
          id={id}
          className={cn(fieldClasses, 'appearance-none bg-no-repeat pr-10', error && 'border-danger-500 focus:ring-danger-500/20', className)}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237d97ac'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.1em',
          }}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
      </FieldWrapper>
    )
  },
)
Select.displayName = 'Select'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-ink-800', className)} {...props} />
}
