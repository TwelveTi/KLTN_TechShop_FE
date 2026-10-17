import { createContext, useContext, useEffect, useState } from 'react'
import vi from '../i18n/vi'

// Ngôn ngữ giao diện, EN hoặc VI. Chuỗi tiếng Anh viết thẳng trong JSX và cũng là
// khoá tra trong vi.js; câu nào chưa có bản dịch thì giữ nguyên tiếng Anh.
const LANGUAGE_KEY = 'language'

function translate(lang, text, params) {
  let result = (lang === 'vi' && vi[text]) || text
  // Chèn giá trị vào chỗ giữ chỗ, ví dụ t('{count} products', { count: 3 }).
  if (params) {
    Object.entries(params).forEach(([name, value]) => {
      result = result.replaceAll(`{${name}}`, value)
    })
  }
  return result
}

function readLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'vi' ? 'vi' : 'en'
  } catch {
    return 'en'
  }
}

const english = {
  lang: 'en',
  toggleLanguage: () => {},
  t: (text, params) => translate('en', text, params),
}

const LanguageContext = createContext(english)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readLanguage)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(LANGUAGE_KEY, lang)
    } catch {
      // Trình duyệt chặn localStorage thì chỉ không nhớ lựa chọn sau khi F5.
    }
  }, [lang])

  const value = {
    lang,
    toggleLanguage: () => setLang(lang === 'en' ? 'vi' : 'en'),
    t: (text, params) => translate(lang, text, params),
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// Trang quản trị luôn tiếng Anh, kể cả các component dùng chung như phân trang, hộp thoại.
export function EnglishOnly({ children }) {
  return <LanguageContext.Provider value={english}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
