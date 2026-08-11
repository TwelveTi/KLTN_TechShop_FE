import type { ReactNode } from 'react'
import { Icon } from '../../../shared/components/Icon'
import type { TableColumn } from '../types'

interface AdminTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  isLoading?: boolean
  emptyMessage?: string
  emptySubtext?: string
  emptyAction?: ReactNode
  onRowClick?: (item: T) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (columnKey: string) => void
  selectedIds?: Set<string>
  onToggleSelectAll?: () => void
  onToggleSelectRow?: (id: string) => void
  isAllSelected?: boolean
}

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your search or filters.',
  emptyAction,
  onRowClick,
  sortBy,
  sortOrder = 'asc',
  onSort,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  isAllSelected = false,
}: AdminTableProps<T>) {
  const showCheckboxes = Boolean(selectedIds && onToggleSelectRow)

  if (isLoading) {
    return (
      <div className="ts-admin-table-container">
        <div className="ts-admin-table-skeleton" aria-label="Loading records">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ts-admin-table-skeleton__row">
              <div className="ts-admin-table-skeleton__cell ts-admin-table-skeleton__cell--check" />
              <div className="ts-admin-table-skeleton__cell ts-admin-table-skeleton__cell--main" />
              <div className="ts-admin-table-skeleton__cell" />
              <div className="ts-admin-table-skeleton__cell" />
              <div className="ts-admin-table-skeleton__cell ts-admin-table-skeleton__cell--badge" />
              <div className="ts-admin-table-skeleton__cell ts-admin-table-skeleton__cell--actions" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="ts-admin-table-container">
        <div className="ts-admin-empty-state">
          <div className="ts-admin-empty-state__icon">
            <Icon name="package" size={36} />
          </div>
          <h3 className="ts-admin-empty-state__title">{emptyMessage}</h3>
          <p className="ts-admin-empty-state__subtext">{emptySubtext}</p>
          {emptyAction && <div className="ts-admin-empty-state__action">{emptyAction}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="ts-admin-table-container">
      <table className="ts-admin-table">
        <thead>
          <tr>
            {showCheckboxes && (
              <th className="ts-admin-th ts-admin-th--checkbox">
                <input
                  type="checkbox"
                  className="ts-admin-checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
            )}

            {columns.map((col) => {
              const isSorted = sortBy === col.key
              const alignClass = col.align ? `ts-admin-align-${col.align}` : 'ts-admin-align-left'

              return (
                <th
                  key={col.key}
                  className={`ts-admin-th ${alignClass} ${col.sortable ? 'is-sortable' : ''}`}
                  style={{ width: col.width }}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  <div className="ts-admin-th__content">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className={`ts-admin-sort-icon ${isSorted ? 'is-active' : ''}`}>
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <Icon name="chevron-up" size={14} />
                          ) : (
                            <Icon name="chevron-down" size={14} />
                          )
                        ) : (
                          <Icon name="arrow-up-down" size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {data.map((item, index) => {
            const rowId = keyExtractor(item)
            const isSelected = selectedIds?.has(rowId)

            return (
              <tr
                key={rowId}
                className={`ts-admin-tr ${isSelected ? 'is-selected' : ''} ${onRowClick ? 'is-clickable' : ''}`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {showCheckboxes && (
                  <td
                    className="ts-admin-td ts-admin-td--checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="ts-admin-checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectRow?.(rowId)}
                      aria-label={`Select item ${rowId}`}
                    />
                  </td>
                )}

                {columns.map((col) => {
                  const alignClass = col.align ? `ts-admin-align-${col.align}` : 'ts-admin-align-left'
                  return (
                    <td key={col.key} className={`ts-admin-td ${alignClass}`}>
                      {col.render ? col.render(item, index) : String((item as any)[col.key] ?? '-')}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
