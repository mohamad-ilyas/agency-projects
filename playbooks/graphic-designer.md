# Playbook — Imogen Clarke, Senior Graphic Designer & Brand Identity Specialist
Last updated: 2026-11-09

## Standards we follow
- Design the mark to work in one colour, at 16px, and mirrored contexts; deliver SVG with a transparent background and a clear-space rule.
- Bilingual identities: pair Arabic and Latin faces matched for x-height, weight and colour on the line; test Arabic with real words, not lorem ipsum.
- Contrast: WCAG 2.2 AA is the baseline (4.5:1 body text, 3:1 large text and UI components); check every colour pair, in light and dark themes.
- Never rely on colour alone to convey meaning (status, errors, overdue); pair with icon or text.
- Check licences: only open-licence fonts (OFL) and assets, since the work is public and costs $0.
- Document tokens (colours, type scale, spacing) in brand guidelines so engineers and the design reviewer can verify them.

## What's new
- **WCAG 3.0 Working Draft, March 2026** (W3C, 2026-03-03): still a draft, not a standard; contrast method (APCA) status is disputed between sources. WCAG 2.2 remains the compliance reference. Sources: [W3C WAI news 2026-03-03](https://www.w3.org/WAI/news/2026-03-03/wcag3), [W3C WCAG 3.0 draft](https://www.w3.org/TR/wcag-3.0/). Action: keep using 2.2 AA contrast; do not adopt APCA thresholds.
- **Alexandria** (Google Fonts) is a free variable Arabic and Latin family with nine weights and matched proportions, useful for bilingual identities. Source: [fontalternatives.com](https://fontalternatives.com/fonts/alexandria/) (secondary source; verify on fonts.google.com; no date confirmed, not a new release).
- European Accessibility Act has applied since 2025-06-28; its legal reference is EN 301 549, and sources disagree on whether WCAG 2.1 or 2.2 is formally required, so design to 2.2 AA. Source: [Level Access summary](https://www.levelaccess.com/blog/eaa-compliance-in-2026-how-enforcement-has-evolved-and-what-to-expect-next/) (vendor blog; verify against EUR-Lex).

_Web access note: the session could open no resource sites directly (fetch blocked); findings come from web search only, and items a search could not confirm are left out._

## Lessons from our projects
- xo-online F-06: player names mixing Arabic and Latin broke visually until wrapped in bidi isolation (<bdi>). Brand/type specs should show mixed-direction names and numerals.
- todo-app: overdue state used text plus an icon, not colour alone, and the reviewer verified it in a render. Keep this pattern.
- todo-app F-4: safe-area insets swap in RTL. Any edge-to-edge graphic needs an RTL mock.
- xo-online F-07: reduced-motion behaviour was only checked in Chromium. Specify a static fallback for any animated brand asset.

## Watch list
- Verify Alexandria and other Arabic families on fonts.google.com.
- Track WCAG 3.0 drafts and the EN 301 549 v4 status.
- Open Brand New, Typewolf and Google Fonts Knowledge, not reachable this session.
