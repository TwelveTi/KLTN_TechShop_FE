import { LinkButton } from './Button'

// Trạng thái rỗng: biểu tượng · một câu nói rõ tình huống · một câu hướng dẫn
// · tối đa một hành động. Không bao giờ để một vùng trắng trơn.
export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-sunken text-muted">
          <Icon size={24} aria-hidden />
        </div>
      )}

      <p className="text-h4 text-heading">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}

      {actionLabel && actionTo && (
        <LinkButton to={actionTo} variant="primary" className="mt-2">
          {actionLabel}
        </LinkButton>
      )}
    </div>
  )
}
