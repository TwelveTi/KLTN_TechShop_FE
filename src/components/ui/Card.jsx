// Khung thẻ dùng chung. Chỉ MỘT lớp bao — không lồng thẻ trong thẻ.
export default function Card({ as: Tag = 'div', padded = true, className = '', children, ...props }) {
  return (
    <Tag
      className={`rounded-md border border-line bg-surface shadow-sm ${padded ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
