// Bộ mảnh ghép cho bảng dữ liệu của trang quản trị.
// Bảng luôn nằm trong khung cuộn ngang riêng, để trang không bao giờ cuộn ngang.

export function Table({ children }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-sm">
      <table className="w-full min-w-[52rem] text-sm">{children}</table>
    </div>
  )
}

export function Th({ align = 'left', className = '', children }) {
  return (
    <th
      scope="col"
      className={`bg-sunken px-4 py-3 text-caption font-semibold text-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  )
}

// Cột số luôn căn phải và dùng chữ số đều bề ngang, để các hàng thẳng cột.
export function Td({ align = 'left', numeric = false, className = '', children, ...props }) {
  return (
    <td
      className={`px-4 py-3 align-middle ${align === 'right' ? 'text-right' : ''} ${
        numeric ? 'tabular text-right' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}

export function Tr({ className = '', children, ...props }) {
  return (
    <tr className={`border-t border-line hover:bg-sunken ${className}`} {...props}>
      {children}
    </tr>
  )
}

// Ô chứa các nút thao tác của một hàng. Luôn nằm sát phải và trên một hàng ngang.
export function RowActions({ children }) {
  return (
    <Td align="right" className="whitespace-nowrap">
      <div className="flex justify-end gap-1">{children}</div>
    </Td>
  )
}

// Bảng rỗng: một hàng duy nhất trải hết các cột, không để bảng trống trơn.
export function TableEmpty({ colSpan, children }) {
  return (
    <tr className="border-t border-line">
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  )
}
