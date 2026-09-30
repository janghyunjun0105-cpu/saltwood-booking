# Saltwood Kitchen — Build Plan

Restaurant table-booking demo. Next.js (App Router) + TypeScript strict + Tailwind, all data in
`localStorage` behind a swappable repository. No backend, no API keys.

## Key decisions

- **Scaffold** with `create-next-app@latest` (TypeScript, Tailwind, ESLint, App Router, no `src/`).
- **Tailwind v4** keeps its config in CSS: tokens live in an `@theme` block in `app/globals.css`, which
  also exposes them as CSS variables (`--color-primary`, …). No separate `tailwind.config` file.
- **Time zone**: every "now" and "today" is computed in `America/Chicago` with one cached `Intl.DateTimeFormat`
  (`@date-fns/tz` was tried first, then dropped as slower and unnecessary). Dates are stored as `YYYY-MM-DD` and
  times as `HH:mm`. They are only converted for display (`Fri, Oct 9`, `6:30 PM`) and for the `.ics` file (UTC).
- **Pure business logic**: `lib/availability.ts` takes `settings`, `bookings` and `now` as arguments, so
  tests can pin any date and time.
- **Repository**: `BookingRepository` is an async interface (Promise-based) covering bookings,
  settings and reset. The localStorage implementation re-checks capacity inside `create` /
  `reschedule` and throws `SlotUnavailableError`, which is the same contract a Supabase RPC would keep.
  Swapping databases means replacing one export in `lib/storage/index.ts`.
- **Storage driver**: localStorage with an in-memory fallback if the browser blocks it or runs out of space. Every read is validated with zod.
  Corrupt data is re-seeded. Both cases show a small notice. A `storage` event listener keeps open tabs in sync.
- **Performance**: the repository (with zod and the seed) loads lazily through `lib/storage/lazy.ts`, labels live in a
  zod-free `lib/constants.ts`, the step-3 form is code-split, and the illustrations are static SVG files in
  `public/art/` served through `next/image`.
- **Hydration**: pages are server components that export metadata. Anything that reads localStorage
  is a client component using `useSyncExternalStore`. The server snapshot shows default settings or a skeleton, so the
  server and client markup match.
- **Dialogs** use the native `<dialog>` + `showModal()`, which provides an inert background, Esc to close, and
  focus return. Focus is placed on the first control when a dialog opens.
- **Time slots** are native radio inputs styled as chips. Arrow keys work on the grid, and full or past
  slots are `disabled` and skipped automatically.
- **Admin auth**: passcode `2468`, session flag in `sessionStorage`. Labeled as demo-only, not real
  security, in code and README.
- **Booking code**: `SW-` + 4 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0/O/1/I/L), checked
  for uniqueness.

## File tree

```
saltwood-booking/
├─ app/
│  ├─ layout.tsx                  # fonts, viewport-fit=cover, demo banner, storage notice
│  ├─ globals.css                 # @theme tokens, focus ring, reduced-motion rules
│  ├─ error.tsx · not-found.tsx
│  ├─ favicon.ico · icon.svg · apple-icon.tsx · opengraph-image.tsx · robots.ts · sitemap.ts
│  ├─ (site)/                     # public pages share the site header and footer
│  │  ├─ layout.tsx · page.tsx    # home
│  │  ├─ book/page.tsx · book/confirmation/[code]/page.tsx
│  │  └─ manage/page.tsx
│  └─ admin/
│     ├─ layout.tsx               # noindex metadata
│     ├─ login/page.tsx
│     └─ (protected)/             # route group guarded by AdminShell
│        ├─ layout.tsx · page.tsx (dashboard) · settings/page.tsx
├─ components/
│  ├─ ui/        Button, Dialog, ConfirmDialog, Field, Notice, Skeleton, StatusChip, icons
│  ├─ layout/    SiteHeader, SiteFooter, NavLink, Wordmark, DemoBanner, StorageNotice, StickyBottomBar
│  ├─ home/      HoursCard, LocationCard
│  ├─ booking/   BookingFlow, StepIndicator, PartySizePicker, DatePicker (strip / month grid),
│  │             TimeSlotGrid, GuestForm, ActionBar, BookingDetails, BookingActions, ConfirmationView
│  ├─ manage/    ManageView, LookupForm, RescheduleForm
│  └─ admin/     AdminShell, LoginForm, Dashboard, DateSwitcher, BookingList, StatusActions, SettingsForm
├─ lib/
│  ├─ restaurant.ts · settings.ts · constants.ts · schemas.ts
│  ├─ time.ts · hours.ts · availability.ts · bookingCode.ts · ics.ts · seed.ts · random.ts · adminSession.ts
│  ├─ storage/   kvStore.ts, bookingRepo.ts, errors.ts, notices.ts, index.ts (swap point), lazy.ts
│  └─ hooks/     useRepoQuery, useSettings, useRestaurantNow, useAdminSession
├─ public/art/                    # SVG illustrations, placeholders for real photos
├─ tests/                         # Vitest: availability, bookingCode, bookingRepo, seed, hours, ics, time
├─ e2e/                           # Playwright: flow, layout sweep, screenshots
├─ playwright.config.ts · vitest.config.mts
├─ screenshots/
└─ README.md · PLAN.md
```

Scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (Vitest), `screenshots`
(Playwright), plus `test:e2e` for the flow and layout checks.

## Phases

Each phase ends with `lint` → `typecheck` → `test` → `build`, and every error is fixed before the next phase starts.

1. **Scaffold & shell**: create-next-app, deps (react-hook-form, zod, @hookform/resolvers, date-fns,
   vitest, playwright), design tokens, fonts, header/footer, demo banner with
   reset dialog, error/not-found pages, `time.ts` + first tests.
2. **Data & rules**: zod schemas, kvStore fallback, repository, booking code, seed, `availability.ts`,
   full unit tests for all required cases.
3. **Home**: hero with SVG art, hours (read from settings), location + directions, 3 signature dishes,
   about, footer, mobile sticky "Book a table" bar.
4. **Booking**: step indicator, party size (9+ → call us), date picker (strip / month grid), grouped
   time slots with "N tables left", guest form with inline validation, submit-time re-check with
   return to step 2, confirmation page, `.ics` download, directions link.
5. **Manage**: lookup by code + email, not-found state, reschedule (same pickers and rules, own slot
   excluded), cancel with confirm dialog.
6. **Admin**: login, guard, dashboard (date switcher, summary cards, search, status filter, table /
   cards, status actions), settings (hours per weekday, interval, tables, max party, blackouts),
   plus metadata, OG image, favicon, robots, sitemap.
7. **QA**: Playwright layout sweep at all six widths, touch targets, 16px inputs, keyboard and
   screen-reader pass, contrast check, reduced motion, Lighthouse mobile run (via the Playwright
   Chromium) and fixes.
8. **Ship**: README, screenshots script and PNGs, final full build and flow test.
