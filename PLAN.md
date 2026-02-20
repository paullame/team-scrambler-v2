# Plan (to be updated along the way)

## Phase 1 — Data Model & CSV Parsing [COMPLETE]

**Goal**: establish the shared data contracts and parsing logic everything depends on.

Define Person type with dynamic criteria fields (src/types.ts) CSV parser: reads headers, infers column names as criteria keys, supports
firstName/lastName/displayName name variants Load example data (example.csv) by default on startup

## Phase 2 — CSV Import UI [COMPLETE]

**Goal**: let users get their own data in.

Drag-and-drop / click-to-upload zone (src/components/CsvDropZone.tsx) Parse the uploaded CSV and update app state Basic error handling (bad format, missing name
column)

## Phase 3 — Individuals Table [COMPLETE]

**Goal**: show and edit the imported data before scrambling.

Sortable table rendering each Person row (src/components/PeopleTable.tsx) Inline add / edit / delete rows Column headers derived from the CSV criteria keys

## Phase 4 — Scrambler Settings [COMPLETE]

**Goal**: configure how teams are built.

Toggle: "number of teams" vs. "team size" mode Checkbox list of criteria columns to balance on (auto-populated from CSV headers) Settings panel component
(src/components/ScramblerSettings.tsx)

## Phase 5 — Core Scrambling Algorithm [COMPLETE]

**Goal**: produce balanced teams.

Pure function scramble(people, config) → Team[] in src/core/scramble.ts Stratified random assignment: sort by combined criteria scores to minimize imbalance
Diversity metrics per team (counts/percentages per criterium) Unit-testable with deno test

## Phase 6 — Team Cards Display

**Goal**: show the results clearly.

One card per team: name, member list, per-criteria diversity bar/badges (src/components/TeamCard.tsx) Big "Scramble" button triggers the algorithm and animates
into results view Member swap between teams for manual adjustment

---

Suggested order of work: 1 → 2 → 3 → 5 → 4 → 6 (get a testable core loop running after Phase 3, then wire settings in Phase 4 before building the display in
Phase 6).
