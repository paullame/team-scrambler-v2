# Plan (to be updated along the way)

## Phase 1 — Data Model & CSV Parsing [COMPLETE]

**Goal**: establish the shared data contracts and parsing logic everything depends on.

Define `Person` type with dynamic criteria fields (`src/types.ts`). CSV parser: reads headers, infers column names as criteria keys, supports
`firstName`/`lastName`/`displayName` name variants. Load `example.csv` by default on startup. 16 unit tests.

## Phase 2 — CSV Import UI [COMPLETE]

**Goal**: let users get their own data in.

Drag-and-drop / click-to-upload zone (`src/components/CsvDropZone.tsx`). Parse the uploaded CSV and update app state. Basic error handling (bad format, missing
name column). Compact sidebar variant with mini drop-zone style.

## Phase 3 — Individuals Table [COMPLETE]

**Goal**: show and edit the imported data before scrambling.

Sortable table rendering each `Person` row (`src/components/PeopleTable.tsx`). Inline add / edit / delete rows. Column headers derived from the CSV criteria
keys. Lucide icons (Pencil, Trash2, Plus). Datalist hints for known criterion values.

## Phase 4 — Scrambler Settings [COMPLETE]

**Goal**: configure how teams are built.

Toggle: "number of teams" vs. "team size" mode. Live preview of the derived value. Checkbox list of criteria columns to balance on (auto-populated from CSV
headers). Settings panel component (`src/components/ScramblerSettings.tsx`).

## Phase 5 — Core Scrambling Algorithm [COMPLETE]

**Goal**: produce balanced teams.

Pure function `scramble(people, config) → Team[]` in `src/core/scramble.ts`. Stratified shuffle with per-stratum rotating round-robin offset to prevent
clustering. Diversity metrics per team: raw counts + ratio 0–1 per criterion value. 21 unit tests (all passing).

## Phase 6 — Layout & Results View [COMPLETE]

**Goal**: show results without scrolling; sidebar control panel.

Viewport-filling `h-dvh` layout with no page scroll. Leading sidebar (LTR/RTL-aware via `dir="auto"`): compact CSV upload, settings, Scramble button. Scrollable
main panel: people table (`max-w-3xl`) + team cards grid. Team cards show member list and per-criteria ratio badges sorted by proportion.

---

## Phase 7 — Team Card Interactions [COMPLETE]

**Goal**: let users fine-tune results after scrambling.

- Extract `TeamCard` component (`src/components/TeamCard.tsx`) out of `App.tsx`
- Editable team name inline (click to edit)
- Emoji picker or random emoji assigned per team for visual identity
- Drag-and-drop (or swap button) to move a member from one team to another
- Re-compute metrics after any swap

## Phase 8 — Export

**Goal**: get the results out of the browser.

- **Export to CSV**: one row per member with a `team` column appended; use native `Blob` + `URL.createObjectURL`
- **Export to PNG**: use `html-to-image` or `dom-to-image-more` to snapshot the team cards grid; offer a download link
- Disable export buttons until teams have been generated

## Phase 9 — Theming & Visual Polish

**Goal**: make the tool feel distinctive and enjoyable.

- Light / dark theme toggle (DaisyUI built-in, store preference in `localStorage`)
- Scrambled-eggs-inspired colour palette: warm yellows and off-whites for light mode; deep yolk-amber accent
- Smooth CSS transition when teams first appear (fade + slide in)
- Responsive breakpoint for narrow screens: collapse sidebar into a drawer or bottom sheet

---

## Tech Debt & Refactoring Suggestions

Worth doing alongside the next phases rather than as dedicated sprints.

### 1. Extract app state into a custom hook

`App.tsx` owns too many `useState` calls and handler functions. Moving them into `src/hooks/useAppState.ts` would make the component a thin presentation shell
and make state transitions independently testable.

### 2. Split `CsvDropZone` compact variant

The `compact` boolean prop forces the component to render two completely different DOM shapes. Consider splitting into `CsvDropZone` (full card) and
`CsvUploadButton` (sidebar variant), sharing logic via a `useFileUpload` hook.

### 3. Derive ratios at render time, not in the algorithm

`CriterionDistribution.ratios` is always `count / teamSize` and can be computed where it is displayed. Removing it from `types.ts` and `scramble.ts` reduces the
data model surface and eliminates a category of tests.

### 4. Break up `PeopleTable`

The component owns sort state, edit state, add state, and all their handlers. Extracting `useTableEdit` and `useTableSort` hooks would isolate concerns and make
each piece unit-testable.

### 5. Add an error boundary

A single `ErrorBoundary` wrapper around `<main>` would prevent a render crash (e.g. a malformed `Team` object after a swap) from blanking the entire UI.

### 6. E2E / integration tests

All tests today are pure unit tests on `csvParser` and `scramble`. A Playwright smoke test that uploads a CSV, scrambles, and asserts team cards appear would
catch regressions that unit tests miss.

### 7. Accessibility audit

Basic `aria-label` attributes are in place but no systematic audit has been done. Specific gaps: colour contrast of `opacity-50` text, keyboard navigation
through team cards, and focus management after the Scramble button fires.

---

Suggested order: 7 → tech-debt #1 & #4 (while building `TeamCard`) → 8 → 9 → remaining tech debt.
