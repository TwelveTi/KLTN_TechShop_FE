import { Languages } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

// Nút đổi qua lại giữa tiếng Anh và tiếng Việt, ngôn ngữ đang dùng được tô đậm.
// Màn hình hẹp chỉ hiện ngôn ngữ đang dùng để header không bị tràn.
export default function LanguageToggle() {
  const { lang, toggleLanguage, t } = useLanguage()
  const label = lang === 'en' ? t('Switch to Vietnamese') : t('Switch to English')
  const codeClass = (code) =>
    lang === code ? 'font-semibold text-heading' : 'text-faint max-sm:hidden'

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={label}
      title={label}
      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm px-2 text-sm text-body hover:bg-sunken"
    >
      <Languages size={18} aria-hidden />
      <span aria-hidden className={codeClass('en')}>
        EN
      </span>
      <span aria-hidden className="text-faint max-sm:hidden">
        /
      </span>
      <span aria-hidden className={codeClass('vi')}>
        VI
      </span>
    </button>
  )
}
