# Playbook — Charlotte Ashworth, Senior Chief Operating Officer
Last updated: 2026-11-09

## Standards we follow
- Judge delivery health with the four DORA delivery metrics (lead time, deploy frequency, change failure rate, recovery time) plus rework; track trends, never rank people by them.
- Release only with evidence in hand: CI run IDs, the independent review verdict, and a named list of conditions with owners. A release with open conditions says so in the delivery brief.
- Keep batches small: one project, one release.json, one rollback path (revert the release commit).
- Treat AI as an amplifier: it speeds up good process and bad process alike, so strengthen tests, review and release gates before adding speed.
- Escalate to the CEO only decisions that are the CEO's (spend, contracts, client contact, deleting data) with options and a recommendation.

## What's new
- **DORA 2025 report, 'State of AI-assisted Software Development'** (survey of nearly 5,000 professionals, run June–July 2025; Google reported AI adoption at 90%). Headline: AI is an amplifier of an organisation's existing strengths and dysfunctions, and AI adoption is now linked to higher delivery throughput (reversing 2024). Companion 'AI Capabilities Model' names seven foundational capabilities, one being a clear, communicated AI stance. Sources: [dora.dev/research/ai](https://www.dora.dev/research/ai), [Google blog](https://blog.google/technology/developers/dora-report-2025/), [AI Capabilities Model report](https://cloud.google.com/resources/content/2025-dora-ai-capabilities-model-report). Published 2025; exact day not confirmed and it is slightly over a year old, so it moves to Standards next session. We could not retrieve the full list of the seven capabilities.
- No newer DORA research release (2026) could be confirmed; searches returned only the unrelated EU financial-sector DORA regulation.

_Web access note: the session could open no resource sites directly (fetch blocked); findings come from web search only, and items a search could not confirm are left out._

## Lessons from our projects
- xo-online (Nov 2026): the Release workflow deployed correctly but its final 'report delivery' step failed on a shell heredoc syntax error; the independent reviewer reproduced and fixed it. Lesson: test the release automation itself on a dry run before relying on it, and check the delivery report actually arrived.
- xo-online: the live two-device check (F-01) was deferred until after deploy by COO decision. Lesson: when deferring a check, record owner, deadline and what happens if it fails, in release.json.
- Both reviews ended 'Go with conditions'. Track condition closure explicitly in the next status update; open Low findings were still open a day later (stale PROJECT.md status).

## Watch list
- Read the full DORA AI Capabilities Model and map the seven capabilities to our own pipeline.
- Check Atlassian Team Playbook and Shape Up for updates (searches found nothing authoritative).
- Whether a DORA 2026 research report is published.
