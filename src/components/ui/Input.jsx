import { useId } from 'react'

// Ô nhập liệu. Nhãn luôn nằm TRÊN ô, không dùng placeholder thay nhãn.
export default function Input({
  label,
  error,
  hint,
  className = '',
  as = 'input',
  children,
  ...props
}) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const Tag = as

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-heading">
          {label}
          {props.required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}

      <Tag
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-sm border bg-surface px-3 py-2 text-base text-heading
          placeholder:text-faint
          disabled:bg-sunken disabled:text-muted
          ${error ? 'border-danger' : 'border-line-strong'}`}
        {...props}
      >
        {children}
      </Tag>

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
