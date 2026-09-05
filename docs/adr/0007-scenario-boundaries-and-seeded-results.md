# ADR 0007: Scenario Boundaries and Seeded Results

- Status: Accepted
- Date: 2026-09-03

## Context

Balanced teams are one grouping problem. Future use cases may return directed assignments or other result shapes, so a universal `Team[]` abstraction would
couple unrelated solvers and interfaces. Random output also made failures difficult to reproduce.

## Decision

Each scenario implements a typed definition with validation and generation and is exposed through a central registry. Scenario results use a versioned,
discriminated envelope containing the scenario kind, configuration snapshot, participant revision, and random seed. Team-specific types and logic live under
`src/scenarios/team-balancing/`; shared participant, criterion, CSV, and constraint primitives do not assume that every result contains teams.

Generated results are snapshots. Participant or configuration changes invalidate the current result, preventing stale display or export. A seeded shuffle makes
identical inputs, configuration, and seed deterministic.

## Consequences

- New scenarios can define result types that are not teams.
- Results can be reproduced and diagnosed from their seed.
- Scenario-specific rendering and export remain separate.
- The compatibility module under `src/core/scramble.ts` remains temporarily for existing tests and imports.
