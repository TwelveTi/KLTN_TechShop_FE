import { useState, type FormEvent } from 'react'
import { toErrorMessage } from '@core/http'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Icon } from '@shared/ui/Icon'
import { useToast } from '@shared/ui/useToast'
import { changePassword } from '@features/auth'
import { getPasswordChecklist, isPasswordSecure } from '@features/auth'
import { ProfileAlert } from '../components/ProfileAlert'

/**
 * Bảo mật & truy cập: đổi mật khẩu và tình trạng phiên.
 *
 * Toàn bộ state của form đổi mật khẩu nằm gọn ở đây — trong v1 nó chia sẻ
 * không gian với 23 biến state khác của bốn tab còn lại.
 */
export function ProfileSecurityScreen() {
  const { showToast } = useToast()
  const [isChangePwOpen, setIsChangePwOpen] = useState(false)
  const [isChangingPw, setIsChangingPw] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [notice, setNotice] = useState('')
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })

  const pwChecklist = getPasswordChecklist(pwForm.next)

  const closeChangePassword = () => {
    setIsChangePwOpen(false)
    setPwForm({ current: '', next: '', confirm: '' })
    setPwError('')
    setShowPw(false)
  }

  const updatePwField = (field: keyof typeof pwForm, value: string) => {
    setPwError('')
    setPwForm((current) => ({ ...current, [field]: value }))
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (isChangingPw) return

    const { current, next, confirm } = pwForm

    // Kiểm tra phía client phản chiếu chính sách chung; backend vẫn là nơi
    // quyết định cuối (sai mật khẩu hiện tại, dùng lại mật khẩu cũ...).
    if (!current) return setPwError('Please enter your current password.')
    if (!isPasswordSecure(next)) {
      return setPwError('Your new password does not satisfy all complexity requirements.')
    }
    if (next !== confirm) return setPwError('The confirmation password does not match.')
    if (next === current) {
      return setPwError('New password must be different from your current password.')
    }

    setIsChangingPw(true)
    setPwError('')
    try {
      const result = await changePassword(current, next)
      closeChangePassword()
      setNotice(
        result.revokedOtherSessions > 0
          ? `Password changed successfully. ${result.revokedOtherSessions} other session(s) were signed out.`
          : 'Password changed successfully.',
      )
      showToast('Password changed successfully.', { variant: 'success' })
    } catch (error) {
      setPwError(toErrorMessage(error, 'Unable to change password. Please try again.'))
    } finally {
      setIsChangingPw(false)
    }
  }

  return (
    <>
      <ProfileAlert notice={notice} />
      <div className="ts-profile-section">
          <div className="ts-security-group">
            <h3 className="ts-profile-section__title">Account Credentials & Access</h3>
            <p className="ts-profile-section__subtitle">
              Review authentication mechanisms and active hardware sessions.
            </p>

            <div className="ts-security-list">
              <div className="ts-security-card">
                <div className="ts-security-card__info">
                  <div className="ts-security-card__icon">
                    <Icon name="lock" size={20} />
                  </div>
                  <div>
                    <strong>Account Password</strong>
                    <span>Update your password. Other devices will be signed out for your security.</span>
                  </div>
                </div>
                {!isChangePwOpen ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsChangePwOpen(true)
                      setPwError('')
                    }}
                  >
                    Change Password
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={closeChangePassword} disabled={isChangingPw}>
                    Cancel
                  </Button>
                )}
              </div>

              {isChangePwOpen && (
                <form className="ts-change-pw" onSubmit={handleChangePassword} noValidate>
                  {pwError && (
                    <div className="ts-profile-alert ts-profile-alert--error" role="alert">
                      <Icon name="alert-circle" size={16} />
                      <span>{pwError}</span>
                    </div>
                  )}

                  <div className="ts-form-field">
                    <label htmlFor="pw-current" className="ts-form-label">
                      Current Password <span className="ts-form-required">*</span>
                    </label>
                    <input
                      id="pw-current"
                      type={showPw ? 'text' : 'password'}
                      className="ts-form-input"
                      autoComplete="current-password"
                      value={pwForm.current}
                      onChange={(e) => updatePwField('current', e.target.value)}
                      disabled={isChangingPw}
                    />
                  </div>

                  <div className="ts-form-field">
                    <label htmlFor="pw-next" className="ts-form-label">
                      New Password <span className="ts-form-required">*</span>
                    </label>
                    <input
                      id="pw-next"
                      type={showPw ? 'text' : 'password'}
                      className="ts-form-input"
                      autoComplete="new-password"
                      value={pwForm.next}
                      onChange={(e) => updatePwField('next', e.target.value)}
                      disabled={isChangingPw}
                    />
                  </div>

                  <div className="ts-form-field">
                    <label htmlFor="pw-confirm" className="ts-form-label">
                      Confirm New Password <span className="ts-form-required">*</span>
                    </label>
                    <input
                      id="pw-confirm"
                      type={showPw ? 'text' : 'password'}
                      className={`ts-form-input ${
                        pwForm.confirm && pwForm.confirm !== pwForm.next ? 'is-invalid' : ''
                      }`}
                      autoComplete="new-password"
                      value={pwForm.confirm}
                      onChange={(e) => updatePwField('confirm', e.target.value)}
                      disabled={isChangingPw}
                    />
                    {pwForm.confirm && pwForm.confirm !== pwForm.next && (
                      <span className="ts-form-error">Passwords do not match.</span>
                    )}
                  </div>

                  <label className="ts-checkbox-label ts-change-pw__reveal">
                    <input
                      type="checkbox"
                      className="ts-checkbox-input"
                      checked={showPw}
                      onChange={(e) => setShowPw(e.target.checked)}
                    />
                    <span className="ts-checkbox-box" aria-hidden="true">
                      {showPw && <Icon name="check" size={12} />}
                    </span>
                    <span className="ts-checkbox-text">Show passwords</span>
                  </label>

                  <ul className="ts-change-pw__rules" aria-label="Password requirements">
                    {pwChecklist.map((rule) => (
                      <li key={rule.label} className={rule.isValid ? 'is-valid' : ''}>
                        <Icon name={rule.isValid ? 'check' : 'alert-circle'} size={13} />
                        <span>{rule.label}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="ts-change-pw__actions">
                    <Button type="submit" variant="primary" size="sm" isLoading={isChangingPw}>
                      {isChangingPw ? 'Updating…' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              )}

              <div className="ts-security-card">
                <div className="ts-security-card__info">
                  <div className="ts-security-card__icon">
                    <Icon name="shield-check" size={20} />
                  </div>
                  <div>
                    <strong>Active Login Session</strong>
                    <span>Authenticated via stateless JWT token with secure refresh token rotation.</span>
                  </div>
                </div>
                <Badge variant="success">Secured</Badge>
              </div>
            </div>
          </div>
        </div>
    </>
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default ProfileSecurityScreen
