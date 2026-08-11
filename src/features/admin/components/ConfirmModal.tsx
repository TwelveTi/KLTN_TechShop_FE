import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary' | 'warning'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      maxWidth="460px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: variant === 'danger' ? 'var(--danger-soft)' : 'var(--brand-50)',
            color: variant === 'danger' ? 'var(--danger-strong)' : 'var(--brand-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name={variant === 'danger' ? 'alert-triangle' : 'info'} size={20} />
        </div>
        <div>
          <p style={{ margin: 0, color: 'var(--color-text)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  )
}
