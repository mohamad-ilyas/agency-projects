# Playbook — Henry Fletcher, Senior UI/UX Product Designer

Last updated: 2026-11-16

## Standards we follow

1. **WCAG 2.2 Level AA is the compliance target.** WCAG 3.0 is still a draft and W3C states it does not replace WCAG 2. Source: [W3C WAI news, 3 Mar 2026](https://www.w3.org/WAI/news/2026-03-03/wcag3) (as relayed by search; page not opened).
2. **Every screen specifies all states:** empty, loading, error, disabled, focus, and long Arabic and English strings (house rule, agent profile).
3. **RTL is designed, not mirrored.** Direction-sensitive items (icons, progress, carousels, numerals, safe-area insets) are specified explicitly (house rule).
4. **Visual decisions are tokens.** Prefer the DTCG format so tokens stay tool-neutral. Format, Color and Resolver modules 2025.10 are a Final Community Group Report (not a W3C Standard). Source: [DTCG announcement, 28 Oct 2025](https://w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/); spec at [designtokens.org/tr/2025.10](https://www.designtokens.org/tr/2025.10/).
5. **Light and dark mode, plus a 360 px layout, are requirements**, checked on rendered output, not only by token arithmetic.
6. Reference sets (from docs/learning-resources.md): NN/g, Material Design 3, Apple HIG, WCAG 2.2 quick reference, Laws of UX.

## What's new

- **EN 301 549 V4.1.1 (published 2 Sep 2026)** moves the web requirements from WCAG 2.1 to WCAG 2.2 A/AA, per commentary. Official Journal citation was expected in November; not confirmed. Until confirmed, design to WCAG 2.2 AA anyway. Source: [Davis Wright Tremaine, Sep 2026](https://www.dwt.com/insights/2026/09/european-accessibility-act-ict-standards-update) (secondary, not opened).
- **Baseline: `field-sizing`** (form controls that grow with content) became Baseline Newly available, per the June 2026 digest. Check support before specifying auto-growing text areas. Source: [web.dev, June 2026 digest](https://web.dev/blog/baseline-digest-jun-2026?hl=en) (via search summary).
- **Baseline monthly digests continue.** The August 2026 digest was published 28 Sep 2026, and the July one added a Baseline audit to Lighthouse (10 Aug 2026). Contents not read. Source: [Aug 2026 digest](https://web.dev/blog/baseline-digest-aug-2026), [Jul 2026 digest](https://web.dev/blog/baseline-digest-jul-2026).
- **WCAG 3 working draft, 3 Mar 2026** (older than 3 months, kept for context). Sources conflict about a later draft; none confirmed. Source: [W3C TR](https://www.w3.org/TR/2026/WD-wcag-3.0-20260303/).

## Lessons from our projects

- **todo-app review:** the 22 px checkboxes pass only because they sit inside a 44x44 label. Specify the label as the target, not the glyph.
- **todo-app F-4:** `padding-inline-start` mapped to `safe-area-inset-left` swaps the insets in RTL. Specify safe-area insets as physical values, or swap them under `[dir=rtl]`.
- **todo-app F-5:** a language button named only "English" or "العربية" has a weak accessible name. Spec "Language: English"-style labels.
- **todo-app:** the native date picker follows the browser locale, not the page locale, so Arabic UIs can show `mm/dd/yyyy`. Spec a custom or labelled alternative.
- **todo-app:** contrast was verified by calculation only. Native control rendering, placeholder, hover and focus states were not measured. Add them to the design QA list.
- **xo-online N-03:** names interpolated into `aria-label` and share text need bidi isolation. Spec isolation wherever user-supplied names mix scripts.
- **xo-online:** reduced motion, AA contrast (N3) and the 360 px layout (N5) had no recorded check. Every spec must name how each is verified.
- **Both:** WebKit/iOS was never run. Flag Safari input zoom, safe areas and Arabic plural ICU as open risks in every spec.

## Watch list

- Official Journal citation of EN 301 549 V4.1.1 (affects EU client work).
- WCAG 3 progress; do not adopt its conformance model until W3C publishes a stable version.
- Baseline status of anchor positioning and interest invokers (`interestfor`): not confirmed, so do not spec them without a fallback.
- Adoption of DTCG 2025.10 in our token export pipeline (tool support claims are unverified).
- NN/g, Material 3 and Apple HIG updates since August 2026.

*Web access note: only WebSearch worked. WebFetch could not reach w3.org, web.dev or nngroup.com (hosts not allowed), so no page was opened and every item above rests on search summaries. Not checked: NN/g research from Aug to Nov 2026, Material 3 and Apple HIG changes, the content of the Aug 2026 Baseline digest, WCAG 2.2 errata, and RTL-specific guidance updates. Nothing unconfirmed is included.*
