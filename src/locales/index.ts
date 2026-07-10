import en from './en'
import ja from './ja'
import zhCN from './zh-CN'

export const SUPPORTED_LOCALES = ['en', 'ja', 'zh-CN'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const LOCALE_STORAGE_KEY = 'locale'

export const messages = {
  en,
  ja,
  'zh-CN': zhCN,
} as const

export const isAppLocale = (value: string): value is AppLocale => {
  return SUPPORTED_LOCALES.includes(value as AppLocale)
}

export const resolveLocale = (): AppLocale => {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && isAppLocale(stored)) {
    return stored
  }

  const language = navigator.language.toLowerCase()
  if (language.startsWith('zh')) return 'zh-CN'
  if (language.startsWith('ja')) return 'ja'
  return 'en'
}

export const persistLocale = (locale: AppLocale) => {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}
