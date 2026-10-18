import { useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { filterOptions } from '../../utils/filterOptions'

// Ô chọn có gõ để lọc: bấm vào là mở danh sách, gõ chữ thì danh sách thu hẹp lại.
// Mũi tên lên/xuống để di chuyển, Enter để chọn, Esc để đóng.
export default function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  stripPrefix,
}) {
  const { t } = useLanguage()
  const id = useId()
  const listId = `${id}-list`
  const listRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const filtered = open ? filterOptions(options, query, stripPrefix) : []

  function openList() {
    if (disabled) return
    setQuery('')
    setActive(Math.max(0, options.indexOf(value)))
    setOpen(true)
  }

  function choose(option) {
    onChange(option)
    setOpen(false)
  }

  // Giữ dòng đang chọn trong tầm nhìn khi đi bằng bàn phím.
  function moveTo(index) {
    setActive(index)
    listRef.current?.children[index]?.scrollIntoView({ block: 'nearest' })
  }

  function handleKeyDown(event) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault()
        openList()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveTo(Math.min(active + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveTo(Math.max(active - 1, 0))
    } else if (event.key === 'Enter') {
      // Enter chọn dòng đang sáng, không gửi cả form đi.
      event.preventDefault()
      if (filtered[active]) choose(filtered[active])
    } else if (event.key === 'Escape') {
      // Chỉ đóng danh sách, không để Esc lan lên đóng luôn hộp thoại.
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-heading">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          // Đang mở thì ô hiện chữ đang gõ, đóng lại thì hiện giá trị đã chọn.
          value={open ? query : value}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={openList}
          onClick={() => !open && openList()}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="h-[2.6875rem] w-full rounded-sm border border-line-strong bg-surface py-2 pl-3 pr-9 text-base
            text-heading placeholder:text-faint disabled:bg-sunken disabled:text-muted"
        />
        <ChevronDown
          size={16}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>

      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-md border border-line
            bg-raised py-1 shadow-md"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">{t('No matches')}</li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={option === value}
                // mousedown thay cho click: chọn trước khi ô nhập mất focus và đóng danh sách.
                onMouseDown={(event) => {
                  event.preventDefault()
                  choose(option)
                }}
                onMouseEnter={() => setActive(index)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === active ? 'bg-primary-soft text-primary' : 'text-body'
                } ${option === value ? 'font-semibold' : ''}`}
              >
                {option}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
