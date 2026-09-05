# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for Team Scrambler.

## What is an ADR?

An ADR is a lightweight document that captures an important architectural decision made in the project. Each ADR should include:

- **Title**: Brief description of the decision
- **Status**: Proposed, Accepted, Deprecated, Superseded
- **Context**: The forces at play, including the problem being solved
- **Decision**: The chosen solution
- **Consequences**: Trade-offs and outcomes of the decision
- **Alternatives Considered**: Other options that were evaluated

## ADR Format

All ADRs follow this naming convention: `NNNN-title-in-kebab-case.md` where NNNN is a sequential number.

## List of ADRs

| Number                                        | Title                         | Status   | Date       |
| --------------------------------------------- | ----------------------------- | -------- | ---------- |
| [0001](0001-use-react-for-ui.md)              | Use React for UI              | Accepted | 2025-02-21 |
| [0002](0002-use-deno-as-runtime.md)           | Use Deno as Runtime           | Accepted | 2025-02-21 |
| [0003](0003-use-vite-for-building.md)         | Use Vite for Building         | Accepted | 2025-02-21 |
| [0004](0004-client-side-only-architecture.md) | Client-Side Only Architecture | Accepted | 2025-02-21 |
| [0005](0005-use-tailwind-css-for-styling.md)  | Use Tailwind CSS for Styling  | Accepted | 2025-02-21 |
| [0006](0006-in-memory-data-processing.md)     | In-Memory Data Processing     | Accepted | 2025-02-21 |

## How to Add a New ADR

1. Create a new file with the next sequential number: `NNNN-title-in-kebab-case.md`
2. Copy the template below into the file
3. Fill in the sections
4. Submit a PR for review

## ADR Template

```markdown
# NNNN: Title

- **Status**: Proposed / Accepted / Deprecated / Superseded
- **Date**: YYYY-MM-DD

## Context

[Describe the problem, forces, and constraints]

## Decision

[Describe the chosen solution]

## Consequences

### Positive

- [Benefits of this decision]

### Negative

- [Trade-offs and drawbacks]

## Alternatives Considered

1. **Alternative 1**: [Description and why it was rejected]
2. **Alternative 2**: [Description and why it was rejected]
```
