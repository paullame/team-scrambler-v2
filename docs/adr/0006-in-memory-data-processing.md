# 0006: In-Memory Data Processing

- **Status**: Accepted
- **Date**: 2025-02-21

## Context

Team Scrambler processes user data (CSV files) to generate team assignments. The data flow is:

1. User uploads CSV file
2. System parses CSV into Individual objects
3. User may edit individuals in the table
4. User configures scrambling settings
5. System runs algorithm to assign teams
6. User may manually adjust teams via drag-and-drop
7. User exports results as CSV or PNG

The data needs to:

- Be quickly accessible for UI updates
- Support real-time modifications
- Be available for export
- Persist only for the duration of the browser session

## Decision

Store all application data **in-memory** using React state (useState, useReducer). Only persist theme preference in localStorage.

## Consequences

### Positive

- **Performance**: In-memory access is instantaneous - no network latency, no database queries
- **Simplicity**: No need for database design, API calls, or state synchronization
- **Real-time updates**: UI updates immediately as data changes
- **Offline support**: Full functionality without network connection
- **Privacy**: User data never leaves the browser
- **No backend dependency**: Works with pure client-side architecture (ADR-0004)

### Negative

- **No persistence**: All data is lost on page refresh or browser close (except theme preference)
- **Memory limits**: Browser memory constraints limit maximum CSV size
- **No undo**: Manual team adjustments via drag-and-drop cannot be undone (though this could be added with local state history)
- **No sharing**: Cannot share current state via URL or with other users

## Implementation Details

| Data Type        | Storage      | Location                                        |
| ---------------- | ------------ | ----------------------------------------------- |
| Individuals      | React state  | `App.tsx` (useState)                            |
| Teams            | React state  | `App.tsx` (derived from individuals + settings) |
| Settings         | React state  | `App.tsx` (useState)                            |
| Theme preference | localStorage | Persisted across sessions                       |
| CSV parse errors | React state  | `CsvDropZone.tsx`                               |

## Alternatives Considered

1. **localStorage for all data**: Persist everything in browser storage. Rejected because it adds complexity for serialization/deserialization and doesn't
   provide significant benefit for typical use cases (users don't need to return to their work later).

2. **IndexedDB**: Client-side database for larger data. Rejected as unnecessary - typical CSV files for team scrambling are small enough for in-memory storage.

3. **Server-side persistence**: Store data on server. Rejected because it contradicts the client-side only architecture and adds unnecessary complexity.

4. **URL state**: Encode state in URL hash. Rejected because it would make URLs unmanageably long for typical datasets and doesn't handle binary data (CSV
   content) well.

5. **SessionStorage**: Persist for session duration. Rejected because the benefit over in-memory is marginal (tab refresh would restore, but full browser
   restart wouldn't) and it requires serialization overhead.
