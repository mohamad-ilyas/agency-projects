/** Typed UI dictionary, plural rules, and date formatting for English and Arabic. */
import type { Filter } from './tasks'

export type Lang = 'en' | 'ar'
export const LANGS: readonly Lang[] = ['en', 'ar'] as const

type PluralForms = Partial<Record<Intl.LDMLPluralRule, (n: string) => string>> & {
  other: (n: string) => string
}

export interface Messages {
  appTitle: string
  addHeading: string
  titleLabel: string
  titlePlaceholder: string
  dueLabel: string
  addButton: string
  errorEmptyTitle: string
  listHeading: string
  filterGroupLabel: string
  filters: Record<Filter, string>
  empty: Record<Filter, string>
  dueText: (date: string) => string
  overdue: string
  edit: string
  editAria: (title: string) => string
  delete: string
  deleteAria: (title: string) => string
  editTitleLabel: string
  editDueLabel: string
  save: string
  cancel: string
  editFormLabel: (title: string) => string
  deleted: (title: string) => string
  tasksLeft: PluralForms
  storageUnavailable: string
  storageWriteFailed: string
  languageSwitchLabel: string
  /** Name of the other language, written in that language. */
  otherLanguageName: string
  darkMode: string
  settingsLabel: string
}

const en: Messages = {
  appTitle: 'Tasks',
  addHeading: 'Add a task',
  titleLabel: 'Task',
  titlePlaceholder: 'What needs doing?',
  dueLabel: 'Due date (optional)',
  addButton: 'Add',
  errorEmptyTitle: 'Enter a task title.',
  listHeading: 'Your tasks',
  filterGroupLabel: 'Show tasks',
  filters: { all: 'All', active: 'Active', done: 'Done' },
  empty: {
    all: 'No tasks yet. Add one above.',
    active: 'No active tasks.',
    done: 'No completed tasks yet.',
  },
  dueText: (date) => `Due ${date}`,
  overdue: 'Overdue',
  edit: 'Edit',
  editAria: (title) => `Edit “${title}”`,
  delete: 'Delete',
  deleteAria: (title) => `Delete “${title}”`,
  editTitleLabel: 'Title',
  editDueLabel: 'Due date',
  save: 'Save',
  cancel: 'Cancel',
  editFormLabel: (title) => `Edit task “${title}”`,
  deleted: (title) => `Deleted “${title}”.`,
  tasksLeft: {
    one: (n) => `${n} task left`,
    other: (n) => `${n} tasks left`,
  },
  storageUnavailable: 'Storage is unavailable in this browser, so tasks will not be saved after you close the page.',
  storageWriteFailed: 'Your latest change could not be saved in this browser.',
  languageSwitchLabel: 'Language',
  otherLanguageName: 'العربية',
  darkMode: 'Dark mode',
  settingsLabel: 'Settings',
}

const ar: Messages = {
  appTitle: 'المهام',
  addHeading: 'إضافة مهمة',
  titleLabel: 'المهمة',
  titlePlaceholder: 'ما الذي تريد إنجازه؟',
  dueLabel: 'تاريخ الاستحقاق (اختياري)',
  addButton: 'إضافة',
  errorEmptyTitle: 'اكتب عنوان المهمة.',
  listHeading: 'مهامك',
  filterGroupLabel: 'عرض المهام',
  filters: { all: 'الكل', active: 'النشطة', done: 'المنجزة' },
  empty: {
    all: 'لا توجد مهام بعد. أضف مهمة من الأعلى.',
    active: 'لا توجد مهام نشطة.',
    done: 'لا توجد مهام منجزة بعد.',
  },
  dueText: (date) => `تستحق في ${date}`,
  overdue: 'متأخرة',
  edit: 'تعديل',
  editAria: (title) => `تعديل «${title}»`,
  delete: 'حذف',
  deleteAria: (title) => `حذف «${title}»`,
  editTitleLabel: 'العنوان',
  editDueLabel: 'تاريخ الاستحقاق',
  save: 'حفظ',
  cancel: 'إلغاء',
  editFormLabel: (title) => `تعديل المهمة «${title}»`,
  deleted: (title) => `تم حذف «${title}».`,
  tasksLeft: {
    zero: () => 'لا توجد مهام متبقية',
    one: () => 'مهمة واحدة متبقية',
    two: () => 'مهمتان متبقيتان',
    few: (n) => `${n} مهام متبقية`,
    many: (n) => `${n} مهمة متبقية`,
    other: (n) => `${n} مهمة متبقية`,
  },
  storageUnavailable: 'التخزين غير متاح في هذا المتصفح، لذلك لن تُحفظ المهام بعد إغلاق الصفحة.',
  storageWriteFailed: 'تعذّر حفظ آخر تغيير في هذا المتصفح.',
  languageSwitchLabel: 'اللغة',
  otherLanguageName: 'English',
  darkMode: 'الوضع الداكن',
  settingsLabel: 'الإعدادات',
}

export const messages: Record<Lang, Messages> = { en, ar }

/** BCP 47 locales: Gregorian calendar and Western digits in both languages (A-3). */
export const LOCALES: Record<Lang, string> = {
  en: 'en-u-ca-gregory-nu-latn',
  ar: 'ar-u-ca-gregory-nu-latn',
}

export function dirFor(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr'
}

/** A-1: Arabic if the browser language starts with "ar", otherwise English. */
export function detectLang(navigatorLanguage: string | undefined): Lang {
  return (navigatorLanguage ?? '').toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

const pluralCache = new Map<Lang, Intl.PluralRules>()
const numberCache = new Map<Lang, Intl.NumberFormat>()
const dateCache = new Map<Lang, Intl.DateTimeFormat>()

/** CLDR plural category via Intl.PluralRules (Arabic: zero/one/two/few/many/other). */
export function pluralCategory(lang: Lang, n: number): Intl.LDMLPluralRule {
  let pr = pluralCache.get(lang)
  if (!pr) {
    pr = new Intl.PluralRules(lang)
    pluralCache.set(lang, pr)
  }
  return pr.select(n)
}

export function formatNumber(lang: Lang, n: number): string {
  let nf = numberCache.get(lang)
  if (!nf) {
    nf = new Intl.NumberFormat(LOCALES[lang])
    numberCache.set(lang, nf)
  }
  return nf.format(n)
}

/** "3 tasks left" / "3 مهام متبقية" with the correct plural form (AC-6.1, AC-6.2). */
export function formatTasksLeft(lang: Lang, n: number): string {
  const forms = messages[lang].tasksLeft
  const fn = forms[pluralCategory(lang, n)] ?? forms.other
  return fn(formatNumber(lang, n))
}

/** Formats a YYYY-MM-DD date-only value in local time, e.g. "5 March 2026" / "5 مارس 2026". */
export function formatDueDate(lang: Lang, iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return iso
  let df = dateCache.get(lang)
  if (!df) {
    df = new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'long', year: 'numeric' })
    dateCache.set(lang, df)
  }
  return df.format(date)
}
