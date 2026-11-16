# Playbook — Emily Harrington, Senior Frontend & Web Engineer
Last updated: 2026-11-16

## Standards we follow
- Semantic HTML and keyboard support first; ARIA only fills real gaps. Every control has an accessible name that includes its visible text.
- CSS logical properties everywhere (`margin-inline-start`, `inset-inline`, `padding-inline`) so RTL works by construction. Exception: `env(safe-area-inset-*)` is physical, so map it per direction (see lessons).
- Every component has loading, empty, error and disabled states. Test at 360px (and 320px), light and dark, English and Arabic.
- Static hosting: no server code, no secrets in the client bundle, no third-party analytics without the COO's approval. $0 only.
- Validate all input (Zod or equivalent); never use `dangerouslySetInnerHTML`/`innerHTML` for user text.
- Names and user text inside sentences get bidi isolation (`<bdi>` or FSI...PDI); strip bidi control characters on input.
- Honour `prefers-reduced-motion`; never convey meaning by colour alone; contrast at WCAG 2.2 AA (4.5:1 text, 3:1 large text and UI).
- Before reporting: lint, typecheck, unit tests, Playwright journey, production build; report real output; say "not run" for anything not run.
- Pin dependency versions that are at least two weeks old; run `npm audit`.

## What's new
Items are dated; "secondary" means a news or vendor site, not the project's own page. Only search results were available (see note), so official pages were not opened.
- **Next.js 16.4** released 2026-10-06 (per a CodeZine report and BuildMVPFast, secondary; the official post lists lazy compilation, smaller Turbopack output, React 19.3 features and Cache Components improvements). Secondary sources say Cache Components become the default for new apps. A security patch is listed on 2026-10-14 (Releasebot, secondary). Action: for any Next.js project, check the installed version against the official security advisory before the next build. Sources: [nextjs.org/blog/next-16-4](https://nextjs.org/blog/next-16-4), [CodeZine](https://codezine.jp/news/detail/29959), [Releasebot](https://releasebot.io/updates/vercel/next-js). Most of our work is static Vite + React, so this is awareness, not an action.
- **Baseline, September 2026 roundup** (web.dev, published 2026-10-02): features reaching Baseline Newly available after Safari 27 and Firefox 155-157, including the `progress()` and `alpha()` CSS functions, scroll anchoring, and `cookieStore.set()` `maxAge`. Pairings came from machine-translated copies of the page, so confirm on the English page before using any of them. Source: [web.dev/blog/web-platform-09-2026](https://web.dev/blog/web-platform-09-2026). Action: check Baseline status on MDN or web.dev before using a new CSS or JS feature.
- **Baseline, August 2026 digest** (web.dev, published 2026-09-28): text-box properties and the global `autocorrect` attribute became Baseline Newly available. Source: [web.dev/blog/baseline-digest-aug-2026](https://web.dev/blog/baseline-digest-aug-2026). Action: `text-box-trim`/`text-box-edge` can help with Arabic/Latin vertical alignment in buttons; verify in a render first.
- **Safari 27.0** shipped about 2026-09-14 with iOS 27 and macOS 27 (9to5Mac 2026-09-17, secondary; WebKit's own tally of 83 features and 844 fixes). Action: our reviews have never run on real Safari; run the iPhone pass that the todo-app review requires on Safari 27. Source: [9to5Mac, 2026-09-17](https://9to5mac.com/2026/09/17/webkit-blog-breaks-down-whats-new-with-safari-27-for-developers-including-mcp-support/).
- **Chrome 155 and 156** (Chrome for Developers, WebGPU update dated 2026-10-07; Chrome 156 beta post, date not shown). Source: [developer.chrome.com/blog](https://developer.chrome.com/blog). No action identified.
- **WCAG 3.0 drafts**: Working Draft dated 2026-03-03; the WCAG 3 introduction page says updated drafts were published in September 2026 (contents not confirmed). Still not a compliance standard; WCAG 2.2 AA stays our baseline. Sources: [W3C WAI news 2026-03-03](https://www.w3.org/WAI/news/2026-03-03/wcag3), [WCAG 3 introduction](https://www.w3.org/WAI/WCAG3).
- **Just outside the 3-month window (context):** TypeScript 7.0, the Go-based native compiler, released 2026-07-08 (about 10x faster than 6.0 per the RC post; no stable JS API until 7.1; the 6.0 compiler is exposed as `tsc6`). Sources: [TypeScript 7.0 RC, 2026-06-18](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-rc/), [InfoQ, 2026-08](https://infoq.com/news/2026/08/typescript-7-released/). Action: try `tsc -b` timing on a branch when a project needs it; check that our lint/test tooling does not need the JS API first.
- **Context:** React 19.2 (2025-10-01) added `Activity`, `useEffectEvent` and Performance Tracks. Source: [react.dev/blog/2025/10/01/react-19-2](https://www.react.dev/blog/2025/10/01/react-19-2). Our projects use React 19. A third-party page puts the latest 19.2 patch at 19.2.7 (2026-06-01); not confirmed officially.

## Lessons from our projects
- **todo-app F-1:** two tabs, last write wins. Listen for the `storage` event on the versioned key and reload state, or document the limitation.
- **todo-app F-2:** do not save on mount. Entries dropped by validation are overwritten and lost; skip the first save or keep a backup key on parse failure.
- **todo-app F-3:** "today" computed per render goes stale across midnight. Recompute on `visibilitychange` or a timer.
- **todo-app F-4:** `padding-inline-start: env(safe-area-inset-left)` swaps in RTL. Use physical left/right for safe-area insets, or swap under `[dir=rtl]`.
- **todo-app F-5:** a language button named only "English" is a weak accessible name. Use "Language: English" (an unused `languageSwitchLabel` already existed). Check that defined strings are actually used.
- **todo-app:** overdue shown by text plus icon, not colour; Arabic plurals via `Intl.PluralRules` with all six CLDR forms (verified in Node ICU only, Safari ICU not run).
- **xo-online F-06 / N-03:** bidi isolation was missed in `aria-label` and share-text strings. Wrap every interpolated name, including attributes and plain strings, with `isolate()`.
- **xo-online F-07:** reduced motion was checked only by stylesheet inspection and a Chromium claim with no stored script. Commit the check script and its output, and test with the OS setting too.
- **xo-online F-03 / F-02:** never let one client's local clock decide to delete shared data; validate and bound every field from an untrusted channel (public MQTT broker).
- **xo-online N-01:** rejecting messages for clock skew fails silently; show a hint when a valid message is rejected for that reason alone.
- **Both:** claims without artifacts count as unverified. Real-device Safari and VoiceOver have not been run yet; say so in every report.

## Watch list
- Real iPhone/Safari 27 + VoiceOver pass for todo-app (private mode, date picker locale, safe-area, iOS input zoom).
- Safari/Firefox support for the features above before use; Baseline status of Customizable Select.
- TypeScript 7.1 stable API and compatibility with our oxlint/vitest/Vite setup.
- WCAG 3 draft changes, and the EN 301 549 status for the European Accessibility Act.
- Next.js/React security advisories for any project that adopts them.
- Not reached this session: react.dev, nextjs.org, web.dev, developer.chrome.com, devblogs.microsoft.com, MDN.

_Web access note: page fetching was blocked for every site tried (react.dev, nextjs.org, web.dev, developer.chrome.com, devblogs.microsoft.com), so all items come from web search results only; official pages were not opened. Items marked secondary rest on news or vendor sites. Not checked: the official React and Next.js release posts since August, TypeScript 7.x updates after July, Chrome 155/156 stable notes, WCAG 3 September 2026 draft contents, and anything published in November 2026._
