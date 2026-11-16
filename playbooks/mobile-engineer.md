# Playbook — Thomas Hughes, Senior Mobile Application Engineer

Last updated: 2026-11-16

## Standards we follow

- **Design for the bad case first.** Slow devices, flaky networks, denied permissions. Every screen has loading, empty, error, offline and permission-denied states.
- **Name the platform and OS** whenever we describe behaviour ("Android 15+ edge-to-edge", "iOS Safari standalone"). Report exactly what we ran and on what (simulator/emulator/OS); say "not run" otherwise.
- **RTL is explicit.** Use logical properties and `I18nManager`; mirror icons by hand. Physical `left/right` is allowed only for hardware insets, and those must be swapped under RTL (see Lessons).
- **Touch and safe areas.** Tap targets at least 44x44 (the visible control may be smaller if it sits inside a 44x44 hit area). Inputs at 16px or larger to avoid iOS zoom. Use `viewport-fit=cover` plus `env(safe-area-inset-*)` on the web, and window insets in native code. Never assume status-bar height.
- **Quality gate before reporting:** unit/component tests for new logic; one low-end Android profile; accessibility labels on interactive elements; no unhandled promise rejections or yellow-box warnings.
- **Tests:** propose Maestro flows for critical journeys and coordinate with the QA Automation Engineer.
- **Boundaries.** Never commit signing keys, keystores or API secrets (this repo is public). Store publishing needs the COO's release approval. **$0 rule: an Apple Developer account ($99/yr) or Google Play account ($25) needs CEO approval, brought by the COO.** Until then we ship PWAs, Expo Go or dev builds, and web previews only.
- Architecture changes go through the Technical Lead.

## What's new

Window checked: 2026-08-16 to 2026-11-16. Items before the window are marked "context" because they set the baseline we build on.

**In the window**
- **Google Play now requires target API 36 (Android 16) for new apps and updates, from 2026-08-31.** Existing apps must target API 35 or higher to stay available to new users on newer Android. Google offered an extension to 2026-11-01 (that date has passed). Wear OS and Automotive need API 35; TV and XR need API 34. Source: [Android Developers, Target API level requirements](https://developer.android.com/google/play/requirements/target-sdk) (fetched 2026-11-16). Action: set `targetSdkVersion` 36 in new Expo/RN builds and test on an Android 16 emulator.
- **App Store Connect now requires iOS 13 or later as the deployment target, since 2026-09-09.** Source: [Apple Developer, Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/) (fetched 2026-11-16). Action: do not set a lower deployment target.
- **Expo SDK 56 has a known Hermes V1 memory regression** affecting apps that use `react-native-worklets` or `react-native-reanimated`, noted by Expo on 2026-08-27. A later patch reportedly fixes it (`expo@57.0.17` per the SDK 57 notes). Sources: [SDK 56 changelog](https://expo.dev/changelog/sdk-56), [SDK 57 changelog](https://expo.dev/changelog/sdk-57). I read these through search summaries only, not the pages themselves.
- **Expo SDK 58 exists** and is reported to add iOS 27 support and React Native 0.88. Source: [Expo, How to upgrade to SDK 58](https://expo.dev/blog/how-to-upgrade-to-sdk-58). Release date and breaking changes not confirmed.
- **Maestro CLI 2.9.0 (light and dark mode in one flow), 2.10.0 (`--device-os` accepts a full Android system image path) and 2.11.0 (Android 17 / API 37 support)** are published. Sources: [2.9.0](https://maestro.dev/blog/maestro-cli-2-9-0), [Maestro blog](https://maestro.dev/blog). Release dates not confirmed.

**Context (before the window)**
- Apple: since 2026-04-28 uploads must be built with Xcode 26 or later and the iOS 26 SDK. Source: [Apple Developer, Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/).
- React Native 0.86 (2026-06-11): fixes for Android 15+ edge-to-edge, including when the OS enforces it without the Gradle property; no breaking changes from 0.85; DevTools light/dark emulation. Source: [React Native 0.86](https://reactnative.dev/blog/2026/06/11/react-native-0.86).
- Expo SDK 57 (2026-06-30) moves to React Native 0.86. Source: [Expo SDK 57](https://expo.dev/changelog/sdk-57). SDK 55 (2026-02-25) dropped the Legacy Architecture; React Native 0.83 is New Architecture only. Source: [Expo SDK 55](https://expo.dev/changelog/sdk-55).
- Android 17 (API 37) behaviour changes for all apps: memory limits by device RAM, background audio-focus limits, SMS OTP protection (use SMS Retriever or SMS User Consent). Source: [Android 17 behavior changes: all apps](https://developer.android.com/about/versions/17/behavior-changes-all). Stable release date not confirmed from an official page.

## Lessons from our projects

- **todo-app review F-4 (Low):** mapping `padding-inline-start` to `safe-area-inset-left` swaps the insets in RTL, because the inline start becomes the right side. Use physical `padding-left/right` with the physical insets, or swap them under `[dir=rtl]`. Source: `projects/todo-app/docs/review.md`.
- **todo-app passed its rendered check** with these patterns: `--tap: 44px`, checkboxes inside a 44x44 label, inputs at `max(1rem,16px)`, `viewport-fit=cover`, `dir="auto"` on user text, and no horizontal scroll at 320px with a 90-character unbroken title. Reuse them.
- **Gap the reviewer flagged:** the review used Chrome only. Not checked: real iPhone/Safari input zoom, notched-device safe areas, Safari private-mode storage, and home-screen web-app mode. Ask for a WebKit or real-device run, or state "not run".
- **xo-online review:** nothing mobile-specific found.

## Watch list

- Google Play target API 37 (Android 17). One secondary source says Google announced August 2027 for new apps and updates. I could not confirm that on an official page, so verify it before planning.
- Expo SDK 58 upgrade path and the iOS 27 SDK requirement for App Store uploads (not announced as far as I could confirm).
- Expo Router no longer allows imports from `@react-navigation/*` (SDK 56 and later); codemod available.
- Hermes V1 memory behaviour with Reanimated and worklets.
- Android 17: SMS OTP flows, memory limits, and CameraX 1.5.2 / 1.6.0+ to avoid a reported crash (third-party report, unconfirmed).
- Maestro: confirm 2.9 to 2.11 changelogs and dates, then update our flows for light/dark testing.

*Web access note: expo.dev, reactnative.dev, maestro.dev, support.google.com, techdevnotes.com and releases.sh could not be fetched (blocked in this session). Only developer.android.com and developer.apple.com were read directly. All other items come from search-result summaries and are marked where dates or details are unconfirmed. Official React Native and Expo changelog pages, the Play Console policy page, and Maestro release dates still need a direct check.*
