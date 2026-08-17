import { useEffect, useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'

export interface OtpInputProps {
  /** Current OTP value (0–length digits). */
  value: string
  /** Called with the sanitized value on every change. */
  onChange: (value: string) => void
  /** Fired once the user has entered a full-length code. */
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  /** Renders the boxes in an error state. */
  hasError?: boolean
  autoFocus?: boolean
}

const onlyDigits = (raw: string, max: number) => raw.replace(/\D/g, '').slice(0, max)

/*
 * Accessible 6-box OTP input.
 * - digits only, never more than `length`
 * - auto-advances on type, backspace clears then steps back
 * - paste of a full code fills all boxes and blurs
 * - arrow keys move between boxes
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  hasError = false,
  autoFocus = false,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputsRef.current[0]?.focus()
    }
  }, [autoFocus, disabled])

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index))
    inputsRef.current[clamped]?.focus()
    inputsRef.current[clamped]?.select()
  }

  const commit = (next: string) => {
    onChange(next)
    if (next.length === length) {
      onComplete?.(next)
    }
  }

  const handleChange = (index: number, raw: string) => {
    // A single box may receive multiple chars (autofill / fast typing): treat
    // it as a fill starting at this box.
    const digits = onlyDigits(raw, length)

    if (!digits) {
      // Cleared this box.
      const chars = value.split('')
      chars[index] = ''
      commit(chars.join('').slice(0, length))
      return
    }

    const chars = value.padEnd(length, ' ').split('')
    let cursor = index
    for (const digit of digits) {
      if (cursor >= length) break
      chars[cursor] = digit
      cursor += 1
    }
    const next = chars.join('').replace(/\s/g, '').slice(0, length)
    commit(next)
    focusBox(cursor)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const chars = value.padEnd(length, ' ').split('')
      if (chars[index] && chars[index] !== ' ') {
        chars[index] = ''
        commit(chars.join('').replace(/\s/g, ''))
      } else if (index > 0) {
        chars[index - 1] = ''
        commit(chars.join('').replace(/\s/g, ''))
        focusBox(index - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusBox(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusBox(index + 1)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = onlyDigits(event.clipboardData.getData('text'), length)
    if (!pasted) return
    commit(pasted)
    focusBox(pasted.length >= length ? length - 1 : pasted.length)
  }

  return (
    <div
      className={`ts-otp-input ${hasError ? 'ts-otp-input--error' : ''}`}
      role="group"
      aria-label={`Enter the ${length}-digit code`}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="\d*"
          maxLength={1}
          className="ts-otp-box"
          value={value[index] ?? ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
