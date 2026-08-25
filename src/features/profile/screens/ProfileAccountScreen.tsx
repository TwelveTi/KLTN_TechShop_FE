import { useState } from 'react'
import { toErrorMessage } from '@core/http'
import { formatDate } from '@shared/utils/date'
import { Avatar } from '@shared/ui/Avatar'
import { Button } from '@shared/ui/Button'
import { Icon } from '@shared/ui/Icon'
import { resendVerificationEmail, useAuth } from '@features/auth'
import { updateMyProfile, uploadMyAvatar } from '../api/profileApi'
import { ProfileAlert } from '../components/ProfileAlert'

/** Thông tin tài khoản: họ tên, liên hệ, ảnh đại diện. */
export function ProfileAccountScreen() {
  const { authResult, updateUser } = useAuth()

  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isRequestingEmailVerification, setIsRequestingEmailVerification] = useState(false)

  /**
   * Bản nháp của form. Chỉ giữ những gì người dùng ĐÃ SỬA; phần chưa sửa đọc
   * thẳng từ hồ sơ hiện tại.
   *
   * Nhờ vậy khi `/users/me` trả về muộn (sau khi màn hình đã mount) thì form tự
   * hiển thị dữ liệu mới, mà không cần một `useEffect` gọi `setForm` — vốn ghi
   * đè cả những ô người dùng đang gõ dở.
   */
  const [draft, setDraft] = useState<Partial<Record<'fullName' | 'phone' | 'gender' | 'birthday', string>>>({})

  const form = {
    fullName: draft.fullName ?? authResult?.user.fullName ?? '',
    email: authResult?.user.email ?? '',
    phone: draft.phone ?? authResult?.user.phone ?? '',
    gender: draft.gender ?? 'male',
    birthday: draft.birthday ?? '',
  }

  const updateField = (field: keyof typeof form, value: string) => {
    setNotice('')
    setError('')
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const saveProfile = async () => {
    const fullName = form.fullName.trim()
    if (fullName.length < 2) {
      setError('Full name must be at least 2 characters.')
      return
    }

    setIsSaving(true)
    setNotice('')
    setError('')
    try {
      updateUser(
        await updateMyProfile({
          fullName,
          phone: form.phone.trim() || null,
          avatarUrl: authResult?.user.avatarUrl,
        }),
      )
      setNotice('Profile details saved successfully.')
    } catch (profileError) {
      setError(toErrorMessage(profileError, 'Unable to update profile.'))
    } finally {
      setIsSaving(false)
    }
  }

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WEBP avatar files are supported.')
      return
    }
    if (file.size > 1024 * 1024) {
      setError('Avatar image must be 1 MB or smaller.')
      return
    }

    setIsUploadingAvatar(true)
    setError('')
    setNotice('')
    try {
      updateUser(await uploadMyAvatar(file))
      setNotice('Avatar photo updated successfully.')
    } catch (avatarError) {
      setError(toErrorMessage(avatarError, 'Unable to upload avatar.'))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  /**
   * Gửi lại email xác minh.
   *
   * Trước đây đây là một `setTimeout` GIẢ: nó hiện "đã gửi" mà không gọi API
   * nào, nên không có mail nào được gửi và người dùng bị chặn ở bước đặt hàng
   * (`403 Please verify your email`) mà không hiểu vì sao. Backend vẫn luôn có
   * `POST /auth/resend-verification`.
   */
  const requestEmailVerification = async () => {
    setIsRequestingEmailVerification(true)
    setError('')
    setNotice('')
    try {
      setNotice(await resendVerificationEmail())
    } catch (verificationError) {
      setError(toErrorMessage(verificationError, 'Could not send the verification email.'))
    } finally {
      setIsRequestingEmailVerification(false)
    }
  }

  if (!authResult) return null

  return (
    <>
      <ProfileAlert notice={notice} error={error} />
      <div className="ts-profile-form-grid">
        {/* Left Column: Form Fields */}
        <form
          className="ts-profile-form"
          onSubmit={(e) => {
            e.preventDefault()
            saveProfile()
          }}
        >
          {/* Full Name */}
          <div className="ts-form-field">
            <label htmlFor="prof-fullname" className="ts-form-label">
              Full Name <span className="ts-form-required">*</span>
            </label>
            <input
              id="prof-fullname"
              type="text"
              className="ts-form-input"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="e.g. Alex Nguyen"
              disabled={isSaving}
            />
          </div>

          {/* Email (Read-Only) */}
          <div className="ts-form-field">
            <label htmlFor="prof-email" className="ts-form-label">
              Email Address <span className="ts-form-optional">(Permanent Account Key)</span>
            </label>
            <div className="ts-input-wrap">
              <input
                id="prof-email"
                type="email"
                className="ts-form-input ts-form-input--readonly"
                value={form.email}
                readOnly
                aria-readonly="true"
              />
              <Icon name="lock" size={16} className="ts-input-icon-right" />
            </div>
          </div>

          {/* Email Verification Banner */}
          <div
            className={`ts-verify-card ${
              authResult?.user.emailVerifiedAt ? 'ts-verify-card--verified' : 'ts-verify-card--pending'
            }`}
          >
            <div className="ts-verify-card__main">
              <Icon
                name={authResult?.user.emailVerifiedAt ? 'check' : 'alert-circle'}
                size={18}
                className="ts-verify-card__icon"
              />
              <div>
                <strong>
                  {authResult?.user.emailVerifiedAt ? 'Email Verified' : 'Email Not Verified'}
                </strong>
                <p>
                  {authResult?.user.emailVerifiedAt
                    ? `Verified on ${formatDate(authResult.user.emailVerifiedAt)}`
                    : 'Verify your email to ensure priority warranty coverage and dispatch notices.'}
                </p>
              </div>
            </div>
            {!authResult?.user.emailVerifiedAt && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void requestEmailVerification()}
                disabled={isRequestingEmailVerification}
              >
                {isRequestingEmailVerification ? 'Sending…' : 'Verify Email'}
              </Button>
            )}
          </div>

          {/* Phone Number */}
          <div className="ts-form-field">
            <label htmlFor="prof-phone" className="ts-form-label">
              Phone Number
            </label>
            <input
              id="prof-phone"
              type="tel"
              className="ts-form-input"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="e.g. 0901234567"
              disabled={isSaving}
            />
          </div>

          {/* Gender Selection */}
          <div className="ts-form-field">
            <span className="ts-form-label">Gender</span>
            <div className="ts-radio-group">
              {['male', 'female', 'other'].map((gender) => (
                <label key={gender} className="ts-radio-label">
                  <input
                    type="radio"
                    name="gender"
                    className="ts-radio-input"
                    checked={form.gender === gender}
                    onChange={() => updateField('gender', gender)}
                  />
                  <span className="ts-radio-circle" />
                  <span className="ts-radio-text">
                    {gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Birthday */}
          <div className="ts-form-field">
            <label htmlFor="prof-birthday" className="ts-form-label">
              Date of Birth
            </label>
            <input
              id="prof-birthday"
              type="date"
              className="ts-form-input"
              value={form.birthday}
              onChange={(e) => updateField('birthday', e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Form Action */}
          <div className="ts-profile-form__actions">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              leadingIcon={
                isSaving ? <span className="ts-spinner" aria-hidden="true" /> : undefined
              }
            >
              {isSaving ? 'Saving changes…' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>

        {/* Right Column: Avatar Photo Card */}
        <aside className="ts-profile-avatar-panel">
          <div className="ts-profile-avatar-card">
            <h4 className="ts-profile-avatar-card__title">Profile Picture</h4>
            <div className="ts-profile-avatar-wrap">
              <Avatar
                src={authResult.user.avatarUrl || undefined}
                name={authResult.user.fullName}
                size="lg"
                className="ts-profile-avatar-img"
              />
              {isUploadingAvatar && (
                <div className="ts-avatar-upload-overlay" aria-label="Uploading avatar">
                  <span className="ts-spinner" />
                </div>
              )}
            </div>

            <label className="ts-avatar-upload-btn">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="ts-avatar-file-input"
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
                disabled={isUploadingAvatar}
              />
              <Icon name="camera" size={16} />
              <span>{isUploadingAvatar ? 'Uploading…' : 'Choose Photo'}</span>
            </label>
            <span className="ts-profile-avatar-hint">JPG, PNG, or WEBP. Max 1 MB.</span>
          </div>
        </aside>
      </div>
    </>
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default ProfileAccountScreen
