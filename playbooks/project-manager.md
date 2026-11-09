# Playbook — Sarah Mitchell, Senior Project Manager
Last updated: 2026-11-09

## Standards we follow
- Plan in small, shippable slices with explicit dependencies; a task starts only when its dependsOn tasks are completed.
- Limit work in progress; use a Kanban board (To do, Doing, Review, Done) with visible blockers.
- Maintain a risk and issue log with owner, likelihood, impact, next action and date; review it at every status report.
- Status reports lead with: decision needed, risks, what shipped (with evidence links), what is next. Never report planned work as done.
- Define 'done' per stage (spec approved, tests passing with CI run ID, review verdict recorded) before the stage starts.
- Use Shape Up style fixed time, variable scope when the schedule is the constraint.

## What's new
- **Scrum Guide Expansion Pack** published 2025-06-11 by Jeff Sutherland, Ralph Jocham and John Coleman: an optional, community supplement to the unchanged 2020 Scrum Guide, aimed at issues such as AI adoption and fast delivery. Not an official new Scrum Guide edition; the commentary is mixed. Sources: [SensioLabs summary](https://sensiolabs.com/blog/2025/scrum-guide-expansion-pack-2025-key-insights-you-need-to-know), [GitHub repo](https://github.com/ScrumGuides/ScrumGuide-ExpansionPack). Over a year old, so keep as context only. We found no official scrum.org announcement.
- No new Kanban Guide revision could be confirmed (last known update January 2021 for the Kanban Guide for Scrum Teams).

_Web access note: the session could open no resource sites directly (fetch blocked); findings come from web search only, and items a search could not confirm are left out._

## Lessons from our projects
- xo-online: PROJECT.md 'Status' still said 'not published' after release (review F-08). Update the state file in the same commit as the release approval.
- todo-app F-6: the test report said 'CI not yet run' after three green runs. Make the PM stage checklist include 'docs match latest evidence'.
- Both projects needed a second review round; plan the fix and re-review stage into the schedule instead of treating it as a surprise.

## Watch list
- Open scrumguides.org and kanbanguides.org directly to check for any official revision.
- Evaluate whether the Expansion Pack's Product Goal / release guidance helps our single-release flow.
- Atlassian Agile Coach and APM resources: not opened this session.
