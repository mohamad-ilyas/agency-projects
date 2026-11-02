/** English + Arabic UI strings, language detection and relative-time formatting. */
import type { Mark } from './game'
import type { TransportStatus } from './transport'

export type Lang = 'en' | 'ar'

export interface Messages {
  appTitle: string
  tagline: string
  languageLabel: string
  otherLanguageName: string
  status: Record<TransportStatus, string>
  statusAria: (s: string) => string
  // Name
  nameHeading: string
  nameIntro: string
  /** F-09: names and moves pass through a free public server. */
  privacyNote: string
  nameLabel: string
  namePlaceholder: string
  nameHint: string
  nameErrEmpty: string
  nameErrTooLong: string
  nameContinue: string
  nameCancel: string
  changeName: string
  playingAs: string
  // Lobby
  lobbyHeading: string
  lobbyIntro: string
  createGame: string
  openGames: string
  lobbyLoading: string
  lobbyEmpty: string
  lobbyEmptyHint: string
  join: string
  joinAria: (host: string) => string
  openOwn: string
  yourGame: string
  hostedBy: (name: string) => string
  created: (relative: string) => string
  lastScore: (x: number, o: number, draws: number) => string
  offlineNote: string
  // Game
  loadingGame: string
  notFoundTitle: string
  notFoundBody: string
  lockedTitle: string
  lockedBody: string
  backToLobby: string
  waitingTitle: string
  waitingBody: string
  linkLabel: string
  copyLink: string
  copied: string
  copyFailed: string
  share: string
  shareText: (host: string) => string
  you: string
  yourTurn: string
  theirTurn: (name: string) => string
  youWin: string
  winnerIs: (name: string) => string
  draw: string
  playAgain: string
  waitingFor: (name: string) => string
  wantsRematch: (name: string) => string
  leave: string
  online: string
  offline: string
  presenceUnknown: string
  draws: string
  round: (n: number) => string
  boardLabel: string
  cellLabel: (row: number, col: number, content: Mark | null) => string
  markName: (mark: Mark) => string
  playerCardAria: (name: string, mark: Mark, score: number, presence: string) => string
  opponentJoined: (name: string) => string
  opponentLeft: string
  opponentOffline: (name: string) => string
  opponentBack: (name: string) => string
  movesDisabledOffline: string
  scoreHeading: string
  roundOver: string
}

const en: Messages = {
  appTitle: 'XO Online',
  tagline: 'Tic-tac-toe with a friend, anywhere.',
  languageLabel: 'Language',
  otherLanguageName: 'العربية',
  status: { connecting: 'Connecting', online: 'Online', offline: 'Offline' },
  statusAria: (s) => `Connection: ${s}`,
  nameHeading: 'What should we call you?',
  nameIntro: 'Your name is shown to your opponent and in the lobby.',
  privacyNote:
    'Games run through a free public server, so your name and moves are visible to others. Do not enter any personal information.',
  nameLabel: 'Your name',
  namePlaceholder: 'e.g. Sam',
  nameHint: '1 to 20 characters.',
  nameErrEmpty: 'Enter your name.',
  nameErrTooLong: 'Use 20 characters or fewer.',
  nameContinue: 'Continue',
  nameCancel: 'Cancel',
  changeName: 'Change name',
  playingAs: 'Playing as',
  lobbyHeading: 'Play XO online',
  lobbyIntro: 'Create a game and share the link, or join someone who is waiting.',
  createGame: 'Create game',
  openGames: 'Open games',
  lobbyLoading: 'Looking for games…',
  lobbyEmpty: 'No games are waiting right now.',
  lobbyEmptyHint: 'Create one and send the link to a friend.',
  join: 'Join',
  joinAria: (h) => `Join ${h}’s game`,
  openOwn: 'Open',
  yourGame: 'Your game',
  hostedBy: (n) => `${n}’s game`,
  created: (r) => `Created ${r}`,
  lastScore: (x, o, d) => `Last match ${x}–${o}, ${d} draws`,
  offlineNote: 'You are offline. The list will refresh when the connection returns.',
  loadingGame: 'Loading game…',
  notFoundTitle: 'Game not found',
  notFoundBody: 'This game does not exist or has expired.',
  lockedTitle: 'This game is locked',
  lockedBody: 'Two players are already in this game. You can start your own from the lobby.',
  backToLobby: 'Back to lobby',
  waitingTitle: 'Waiting for an opponent',
  waitingBody: 'Send this link to a friend. The game starts as soon as they join.',
  linkLabel: 'Game link',
  copyLink: 'Copy link',
  copied: 'Link copied',
  copyFailed: 'Could not copy. Select the link and copy it manually.',
  share: 'Share',
  shareText: (h) => `${h} invites you to a game of XO`,
  you: 'You',
  yourTurn: 'Your turn',
  theirTurn: (n) => `${n}’s turn`,
  youWin: 'You win!',
  winnerIs: (n) => `${n} wins`,
  draw: 'Draw',
  playAgain: 'Play again',
  waitingFor: (n) => `Waiting for ${n}…`,
  wantsRematch: (n) => `${n} wants to play again`,
  leave: 'Leave game',
  online: 'Online',
  offline: 'Offline',
  presenceUnknown: 'Checking…',
  draws: 'Draws',
  round: (n) => `Round ${n}`,
  boardLabel: 'Game board',
  cellLabel: (r, c, m) => `Row ${r}, column ${c}, ${m ? m : 'empty'}`,
  markName: (m) => m,
  playerCardAria: (n, m, s, p) => `${n}, ${m}, score ${s}, ${p}`,
  opponentJoined: (n) => `${n} joined. X moves first.`,
  opponentLeft: 'Your opponent left the game.',
  opponentOffline: (n) => `${n} is offline.`,
  opponentBack: (n) => `${n} is back online.`,
  movesDisabledOffline: 'You are offline. Moves are paused until the connection returns.',
  scoreHeading: 'Score',
  roundOver: 'Round over',
}

const ar: Messages = {
  appTitle: 'إكس أو أونلاين',
  tagline: 'العب إكس أو مع صديقك من أي مكان.',
  languageLabel: 'اللغة',
  otherLanguageName: 'English',
  status: { connecting: 'جارٍ الاتصال', online: 'متصل', offline: 'غير متصل' },
  statusAria: (s) => `الاتصال: ${s}`,
  nameHeading: 'ما الاسم الذي تريد أن نناديك به؟',
  nameIntro: 'يظهر اسمك لخصمك وفي قائمة الألعاب.',
  privacyNote: 'تمر الألعاب عبر خادم عام مجاني، لذا يظهر اسمك وحركاتك للآخرين. لا تُدخل أي معلومات شخصية.',
  nameLabel: 'اسمك',
  namePlaceholder: 'مثال: سامي',
  nameHint: 'من 1 إلى 20 حرفًا.',
  nameErrEmpty: 'اكتب اسمك.',
  nameErrTooLong: 'استخدم 20 حرفًا أو أقل.',
  nameContinue: 'متابعة',
  nameCancel: 'إلغاء',
  changeName: 'تغيير الاسم',
  playingAs: 'تلعب باسم',
  lobbyHeading: 'العب إكس أو عبر الإنترنت',
  lobbyIntro: 'أنشئ لعبة وشارك الرابط، أو انضم إلى لاعب ينتظر.',
  createGame: 'إنشاء لعبة',
  openGames: 'الألعاب المتاحة',
  lobbyLoading: 'جارٍ البحث عن ألعاب…',
  lobbyEmpty: 'لا توجد ألعاب بانتظار لاعب الآن.',
  lobbyEmptyHint: 'أنشئ لعبة وأرسل الرابط إلى صديق.',
  join: 'انضمام',
  joinAria: (h) => `الانضمام إلى لعبة ${h}`,
  openOwn: 'فتح',
  yourGame: 'لعبتك',
  hostedBy: (n) => `لعبة ${n}`,
  created: (r) => `أُنشئت ${r}`,
  lastScore: (x, o, d) => `آخر مباراة ${x}–${o}، تعادل ${d}`,
  offlineNote: 'أنت غير متصل. ستُحدَّث القائمة عند عودة الاتصال.',
  loadingGame: 'جارٍ تحميل اللعبة…',
  notFoundTitle: 'اللعبة غير موجودة',
  notFoundBody: 'هذه اللعبة غير موجودة أو انتهت صلاحيتها.',
  lockedTitle: 'هذه اللعبة مقفلة',
  lockedBody: 'يوجد لاعبان في هذه اللعبة بالفعل. يمكنك بدء لعبتك من قائمة الألعاب.',
  backToLobby: 'العودة إلى قائمة الألعاب',
  waitingTitle: 'بانتظار خصم',
  waitingBody: 'أرسل هذا الرابط إلى صديق. تبدأ اللعبة فور انضمامه.',
  linkLabel: 'رابط اللعبة',
  copyLink: 'نسخ الرابط',
  copied: 'تم نسخ الرابط',
  copyFailed: 'تعذّر النسخ. حدّد الرابط وانسخه يدويًا.',
  share: 'مشاركة',
  shareText: (h) => `${h} يدعوك إلى لعبة إكس أو`,
  you: 'أنت',
  yourTurn: 'دورك',
  theirTurn: (n) => `دور ${n}`,
  youWin: 'لقد فزت!',
  winnerIs: (n) => `فاز ${n}`,
  draw: 'تعادل',
  playAgain: 'العب مجددًا',
  waitingFor: (n) => `بانتظار ${n}…`,
  wantsRematch: (n) => `${n} يريد اللعب مجددًا`,
  leave: 'مغادرة اللعبة',
  online: 'متصل',
  offline: 'غير متصل',
  presenceUnknown: 'جارٍ التحقق…',
  draws: 'تعادل',
  round: (n) => `الجولة ${n}`,
  boardLabel: 'لوحة اللعب',
  cellLabel: (r, c, m) => `الصف ${r}، العمود ${c}، ${m ? m : 'فارغ'}`,
  markName: (m) => m,
  playerCardAria: (n, m, s, p) => `${n}، ${m}، النقاط ${s}، ${p}`,
  opponentJoined: (n) => `انضم ${n}. يبدأ X أولًا.`,
  opponentLeft: 'غادر خصمك اللعبة.',
  opponentOffline: (n) => `${n} غير متصل.`,
  opponentBack: (n) => `${n} متصل مجددًا.`,
  movesDisabledOffline: 'أنت غير متصل. الحركات متوقفة حتى يعود الاتصال.',
  scoreHeading: 'النتيجة',
  roundOver: 'انتهت الجولة',
}

export const MESSAGES: Record<Lang, Messages> = { en, ar }

export function detectLang(languages: readonly string[] | undefined): Lang {
  for (const l of languages ?? []) {
    const code = l.toLowerCase()
    if (code.startsWith('ar')) return 'ar'
    if (code.startsWith('en')) return 'en'
  }
  return 'en'
}

export function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  return navigator.languages?.length ? navigator.languages : [navigator.language]
}

export function applyLang(lang: Lang): void {
  const root = document.documentElement
  root.lang = lang
  root.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

/** "2 minutes ago" / "منذ دقيقتين". */
export function relativeTime(from: number, now: number, lang: Lang): string {
  const diff = Math.round((from - now) / 1000)
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  const abs = Math.abs(diff)
  if (abs < 45) return rtf.format(0, 'second')
  if (abs < 45 * 60) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 22 * 3600) return rtf.format(Math.round(diff / 3600), 'hour')
  return rtf.format(Math.round(diff / 86400), 'day')
}
