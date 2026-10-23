// Ảnh đại diện, không có ảnh thì hiện chữ cái đầu của tên.
const SIZES = { sm: 'size-7 text-caption', md: 'size-9 text-sm', lg: 'size-20 text-h3' }

export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${SIZES[size]} shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={`${SIZES[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary ${className}`}
    >
      {initial}
    </span>
  )
}
