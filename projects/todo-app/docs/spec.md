# todo-app — Specification (todo-app/spec)

Author: EMP-002 Oliver · Reviewer: EMP-003 Sarah · Status: draft, defaults A-1..A-5 pending CEO confirmation.

This is a single-page web app the internal team uses to track to-do tasks. Tasks are stored only in this browser (localStorage). There is no login and no server. The UI is in Arabic (RTL) and English, has light and dark themes, and is built mobile-first for iPhone. The repo is public, so no personal data goes in code, fixtures, or screenshots.

## User stories and acceptance criteria

**US-1 Add a task.** As a team member, I want to add a task with a title and an optional due date so that I can track it.
- AC-1.1 Given the input has "  Buy milk  ", When I submit (button or Enter), Then a task titled "Buy milk" (trimmed) appears as active, and the input is cleared and keeps focus.
- AC-1.2 Given the title is empty or whitespace only, When I submit, Then no task is created and the add control is disabled or an error is announced.
- AC-1.3 Given I pick a due date, When I submit, Then the task shows that date. Given I pick none, Then the task shows no date.

**US-2 Complete a task.** As a team member, I want to mark a task done or undone so that I can see what is finished.
- AC-2.1 Given an active task, When I tick its checkbox, Then it is shown as done (strikethrough or muted) and the remaining count goes down by 1.
- AC-2.2 Given a done task, When I untick it, Then it is active again and the count goes up by 1.

**US-3 Edit a task.** As a team member, I want to change a task's title and due date so that I can fix mistakes.
- AC-3.1 Given a task, When I choose Edit, change the title and/or date, and Save (or press Enter), Then the changes are shown and saved.
- AC-3.2 Given edit mode, When I Cancel (or press Escape), Then the original values are kept.
- AC-3.3 Given edit mode, When I save an empty or whitespace-only title, Then the save is refused and the original title is kept. Clearing the due date is allowed.

**US-4 Delete a task.** As a team member, I want to delete a task so that the list stays relevant.
- AC-4.1 Given a task, When I choose Delete, Then it is removed from the list and from storage, and the count updates.

**US-5 Filter tasks.** As a team member, I want to filter by All, Active, or Done so that I can focus.
- AC-5.1 Given a mix of tasks, When I pick All, Active, or Done, Then only the matching tasks are shown and the selected filter is visibly marked (and exposed with `aria-pressed` or `aria-current`).
- AC-5.2 Given a filter that matches no tasks, Then an empty-state message is shown in the current language.

**US-6 Tasks-left count.** As a team member, I want to see how many tasks are left so that I know my workload.
- AC-6.1 Given N active tasks (the count ignores the current filter), Then the footer shows N with the correct plural form. English: "1 task left", "0 tasks left", "2 tasks left".
- AC-6.2 Given the language is Arabic, Then the plural form is chosen by the CLDR Arabic plural rules (all six categories, as returned by `Intl.PluralRules('ar')`): zero (n = 0), one (n = 1), two (n = 2), few (n % 100 in 3–10), many (n % 100 in 11–99), other (everything else, e.g. 100–102). Examples: 0 → zero, 1 → one, 2 → two, 3 → few, 11 → many, 100 → other, 103 → few, 111 → many. Example text: "مهمة واحدة متبقية", "مهمتان متبقيتان", "3 مهام متبقية", "11 مهمة متبقية".

**US-7 Language.** As a team member, I want to switch between Arabic and English so that I can use my preferred language.
- AC-7.1 Given the switch, When I select Arabic, Then all UI text is in Arabic and `<html lang="ar" dir="rtl">` is set. When I select English, Then `<html lang="en" dir="ltr">` is set.
- AC-7.2 Given I chose a language, When I reload, Then the same language is used.
- AC-7.3 Given a first visit with no saved choice, Then the default from A-1 applies.

**US-8 Theme.** As a team member, I want light or dark mode so that the app is comfortable to read.
- AC-8.1 Given a first visit with no saved choice, Then the theme follows the system `prefers-color-scheme`.
- AC-8.2 Given the toggle, When I switch the theme, Then it applies immediately and is still applied after a reload.

**US-9 Persistence.** As a team member, I want my tasks kept after I reload so that I do not lose them.
- AC-9.1 Given tasks were added, edited, toggled, or deleted, When I reload, Then exactly the same tasks (title, due date, done state) are restored.
- AC-9.2 Given localStorage is empty, corrupt, or unavailable, Then the app loads an empty list without crashing. If storage is unavailable, it shows a non-blocking notice that tasks will not be saved.

## Non-functional requirements

- NFR-1 RTL: Use logical CSS (start/end), not left/right. Icons and layout mirror in Arabic. Task titles use `dir="auto"` so mixed-language text displays correctly.
- NFR-2 Accessibility: Meets WCAG 2.1 AA contrast in both themes. Every control can be reached and used by keyboard (Tab, Enter, Space, Escape) and has a visible focus ring. Every control has an accessible label in the current language. Count changes are announced through `aria-live="polite"`. Motion respects `prefers-reduced-motion`.
- NFR-3 iPhone: The layout works from 320px wide with no horizontal scroll. Touch targets are at least 44×44px. Inputs use a font size of at least 16px so iOS does not zoom. The viewport uses `viewport-fit=cover`, and padding includes `env(safe-area-inset-*)`.
- NFR-4 Persistence: Data is stored in localStorage under versioned keys (for example `todo-app:v1:tasks`, `:lang`, `:theme`). Every change is saved immediately. No data leaves the device. No analytics and no third-party requests.
- NFR-5 Performance: First load is usable within about 2 s on a mid-range phone over 4G. Interactions respond within 100 ms with 500 tasks.

## Assumptions (pending CEO confirmation; open questions 1–5 in PROJECT.md)

- A-1 (Q1) First-visit language follows the browser: Arabic if `navigator.language` starts with "ar", otherwise English.
- A-2 (Q2) Default theme follows the system setting, as in US-8.
- A-3 (Q3) Dates use the Gregorian calendar with Western digits (0–9) in both languages. Month names are localised. Counts also use Western digits.
- A-4 (Q4) The list is ordered newest first by creation time. The order does not change when a task is toggled.
- A-5 (Q5) An active task whose due date is before today (device local time) is highlighted as overdue by colour plus a text or icon label, not colour alone. Done tasks are never shown as overdue.
- A-6 Due date is a date only (no time). Deleting needs no confirmation dialog.

## Out of scope

Accounts or login, sync across devices or users, a server or backend, notifications or reminders, recurring tasks, priorities, tags, search, drag-to-reorder, import or export.
