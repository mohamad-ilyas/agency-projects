# todo-app (web)

Single-page to-do list (Arabic RTL + English, light/dark, iPhone-first). Tasks are stored only in this browser's
localStorage (`todo-app:v1:*`). No server, no analytics, no third-party requests. Spec: `../docs/spec.md`.

```sh
npm install
npm run dev            # local dev server
npm test               # vitest (jsdom)
npm run lint           # oxlint
npm run build:preview  # tsc -b && vite build; set BASE_PATH=/agency-projects/todo-app/ for the preview site
```

Pure logic lives in `src/lib/` (tasks reducer/filters, storage, i18n/plural, theme); components in `src/components/`.
