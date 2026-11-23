# Playbook — Oliver Bennett, Senior Business Analyst
Last updated: 2026-11-23

## Standards we follow
- Every requirement gets an ID and at least one acceptance criterion a tester can pass or fail; no 'fast', 'easy' or 'user-friendly' without a number.
- Write stories as who / what / why, then acceptance criteria as declarative Given/When/Then: state the business behaviour, not click-by-click UI steps.
- One behaviour per scenario; keep Background to 2–3 steps; use Gherkin `Rule` to group scenarios under one business rule.
- List assumptions separately (A-1…) with a default so work is not blocked; the CEO or COO confirms them.
- For Arabic/English products, specify RTL, plural forms, and name/bidi handling as requirements, not afterthoughts.
- Use AI to draft stories, but a human validates them with the client; AI cannot rank business value or fill gaps in vague specs.

## What's new
- **Gherkin tooling snapshot (Oct 2026, secondary source)**: Cucumber-JVM 8.0.4, cucumber-js 13.3.0, pytest-bdd 9.0.0, behave 1.3.3, Reqnroll 3.3.4; SpecFlow reached end of life on 2024-12-31. Source: [issoh.co.jp guide](https://www.issoh.co.jp/md/tech/11693) (Japanese third-party page; verify on the Cucumber GitHub releases). Change: if a client needs .NET BDD, specify Reqnroll, not SpecFlow.
- **AI and Gherkin (2026)**: practitioner sources describe generating test scenarios from stories and mockups and Gherkin as a shared layer between people and AI agents. Source: [testomat.io](https://testomat.io/?p=5374); a May 2026 press release is promotional and ignored. Opinion only; our rule stands that a human validates AI-drafted criteria.
- No IIBA/BABOK update could be confirmed by search.
_Web access note (2026-11-23): page fetches failed for dora.dev, infoq.com and pmi.org (hosts not allowed in this session); findings come from web search summaries only._
- **Gherkin `Rule` keyword** (available since Gherkin v6) groups scenarios by business rule; it is documentation only and some tools support it slowly, so check tooling. Source: [Cucumber Gherkin reference](https://cucumber.io/docs/gherkin/reference/) (via search summary; page not opened). Not a new item this quarter; recorded as a standard.
- AI-assisted requirements guidance in 2026 converges on: AI drafts stories and criteria from research notes, humans do discovery, prioritisation and validation. Sources are vendor and practitioner blogs, e.g. [boundev.ai 2026 guide](https://www.boundev.ai/blog/how-to-write-user-story-guide-2026); low authority, treat as opinion, no exact date confirmed.
- No NN/g or IIBA 2026 publication on this topic could be confirmed.

_Web access note: the session could open no resource sites directly (fetch blocked); findings come from web search only, and items a search could not confirm are left out._

## Lessons from our projects
- todo-app review: 20 acceptance criteria were all verifiable, because each AC had an ID that tests reused (e.g. 'AC-1.1'). Keep that ID convention.
- todo-app F-4/F-5: requirements named RTL and accessibility in general but not safe-area insets in RTL or accessible names for the language switch. Add explicit RTL and accessible-name criteria to the template.
- xo-online: the spec's anti-cheat exclusion (A1) and untrusted-input risks surfaced only in review (F-02 to F-06). Add a 'what if another client sends hostile data?' discovery question for any multiplayer or shared-data product.
- xo-online F-08: AC counts in the test report disagreed with the spec (42 ACs, 36 covered, 6 partial). Keep one AC register and mark partial coverage up front.

## Watch list
- Open the Gherkin reference, IIBA and NN/g pages directly when the network allows.
- Evaluate a short 'hostile input' discovery checklist.
- Check whether EN 301 549 v4 / WCAG 2.2 should become a default non-functional requirement for EU clients.
- Verify the Gherkin tool versions on the official Cucumber release pages.
