# Team Scrambler

The **Team Scrambler** is a tool designed to distribute individuals into teams based on configurable parameters such as team size, number of teams, and
balancing criteria (e.g., gender, entity affiliation, and management committee membership). It supports flexible configurations and provides detailed metrics
for the resulting teams.

## Overview

- React with TypeScript on the frontend
- tailwindcss daisyui for styling
- Vite for the development server
- deno for typescript runtime

## Getting Started

### Install the dependencies

To install the dependencies, run the following command:

```sh
deno install
```

### Run the dev server with vite

The app uses a Vite dev server to run in development mode. To start the dev server, run the following command:

```sh
deno run dev
```

### Build the app

To build the app for production, run the following command:

```sh
deno run build
```

### Running Tests

To run the tests, use the following command:

```sh
deno test -A
```

## Features

### CSV Import

- Drag-and-drop or click-to-upload a CSV file in the sidebar
- Automatically detects name columns (`firstName`/`lastName`, `displayName`, `fullName`, `email`) and treats all other columns as balance criteria
- Loads `example.csv` on first open so the tool is immediately usable
- Parse error messages are displayed inline

### Individuals Table

- Displays all imported people in a sortable table
- Inline row editing: add, edit, and delete rows directly in the table
- Column headers are derived from the CSV — no configuration needed
- Datalist hints suggest known values when editing a criterion cell

### Scrambler Settings

- Choose between **number of teams** mode or **team size** mode, with a live preview of the derived value
- Checkbox list of balance criteria, auto-populated from the CSV headers — select which ones the algorithm should optimise for

### Scrambling Algorithm

Greedy assignment with a cost function — $O(n \cdot T \cdot k)$:

1. Shuffle all people randomly
2. For each person, assign them to the team with the lowest cost, where cost = team size (size balance) + over-representation penalties per criterion (value
   balance)
3. Each criterion is optimised independently, so adding more criteria does not degrade balance on others

See [ALGORITHM.md](ALGORITHM.md) for the full technical specification.

### Team Cards

- Results displayed as a responsive card grid, one card per team
- Each card lists its members and shows per-criterion ratio badges (with raw count tooltip), sorted by proportion
- Click a team name to rename it inline
- Click the emoji to cycle through 20 animal / nature icons
- Drag a member chip onto another team's card to move them; metrics update immediately

### Balance Quality Report

Shown after each scramble, above the team cards:

- **Overall score** (0–100%) — mean of per-criterion scores
- **Per-criterion score** with a colour-coded progress bar (green / yellow / red)
- Scoring mode is selected automatically by cardinality:
  - **Ratio mode** (few distinct values, e.g. gender) — measures whether each team reflects global proportions
  - **Diversity mode** (many distinct values, e.g. entity, department) — measures what fraction of all distinct values appear in each team
- Scores are normalised to the _best achievable_ result given integer constraints, not to a theoretical perfect — 100% means the algorithm did as well as
  mathematically possible
- A ⚠️ flag with tooltip highlights criteria where perfect balance is impossible (e.g. not enough representatives to place one in every team)

### Export

- **Export CSV** — one row per person with a `team` column appended; downloaded as a `.csv` file
- **Export PNG** — snapshot of the team cards grid, downloaded as a `.png` image
- Both buttons are disabled until teams have been generated

### Look & Feel

- Scrambled-eggs-inspired colour palette: warm yellows and off-whites for light mode, deep yolk-amber accent
- Light / dark theme toggle, preference persisted in `localStorage`
- Viewport-filling no-scroll layout: sidebar panel + scrollable main area
- Responsive: sidebar collapses into a slide-in drawer on narrow screens (RTL/LTR-aware via `dir="auto"`)
- Team cards fade and slide in on first appearance
