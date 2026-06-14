# 0004: Client-Side Only Architecture

- **Status**: Accepted
- **Date**: 2025-02-21

## Context

Team Scrambler's core functionality is:
- Upload and parse CSV files
- Configure team distribution parameters
- Run team scrambling algorithm
- Display and interact with results
- Export results as CSV or PNG

All of these operations can be performed entirely in the browser:
- CSV parsing: `@std/csv` runs in browser-compatible JavaScript
- Algorithm: Greedy assignment is computationally feasible client-side
- Data storage: In-memory state is sufficient (no need for persistence)
- Export: Browser APIs can download files

The application does not require:
- Server-side data processing
- User authentication
- Database persistence
- Multi-user collaboration
- Large dataset processing beyond browser capabilities

## Decision

Implement a **purely client-side Single-Page Application (SPA)** with no backend server logic. The Deno server only serves static files.

## Consequences

### Positive
- **Simplicity**: No backend code to maintain, no API design, no database schema
- **Portability**: Can be deployed anywhere that serves static files (GitHub Pages, Netlify, Vercel, Deno Deploy, any web server)
- **Offline capability**: Once loaded, the app works completely offline
- **Scalability**: No server resources needed - scales infinitely with static hosting
- **Development**: Only need to run a local dev server, no backend services to start
- **Cost**: Zero hosting costs for static hosting providers
- **Latency**: All operations are instantaneous (client-side)
- **Privacy**: User data never leaves their browser

### Negative
- **No persistence**: Data is lost when page is refreshed (except theme preference in localStorage)
- **Browser limits**: Limited by browser memory and performance (though sufficient for typical use cases)
- **No sharing**: Cannot share configurations or results via URL (without additional work)
- **CSV size limits**: Very large CSV files may hit browser memory limits
- **No collaboration**: Multiple users cannot work on the same data simultaneously

## Alternatives Considered

1. **Full-stack with backend API**: Server handles CSV processing and algorithm. Rejected as unnecessary complexity - the client is fully capable.

2. **Hybrid (client + server)**: Some processing on server. Rejected because it adds complexity without clear benefits for this use case.

3. **Server-side rendering (SSR)**: Render pages on server. Rejected because Team Scrambler is a highly interactive app where SSR provides minimal SEO benefit.

4. **Progressive Web App (PWA)**: Add service worker for offline caching. Rejected as the app already works offline once loaded; full PWA features (install prompt, etc.) add complexity for marginal benefit.
