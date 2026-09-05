# 0002: Use Deno as Runtime

- **Status**: Accepted
- **Date**: 2025-02-21

## Context

Team Scrambler needs a JavaScript/TypeScript runtime that:

- Supports modern ES modules natively
- Has built-in TypeScript support (no separate compilation step)
- Provides a simple API for serving static files
- Works well with Vite for frontend development
- Has secure defaults (permissions model)
- Supports npm packages seamlessly

The project started as a simple static site but needed a runtime for:

- Local development server
- Production file serving
- Running tests
- Potential future backend needs

## Decision

Use **Deno 2.x** as the JavaScript/TypeScript runtime.

## Consequences

### Positive

- **Built-in TypeScript**: No need for tsconfig, tsc, or babel - Deno natively executes TypeScript
- **ES Modules by default**: Modern import/export syntax without configuration
- **Secure by default**: Permission model requires explicit access grants (--allow-net, --allow-read, etc.)
- **npm compatibility**: Seamless integration with npm packages via `npm:` specifiers
- **Single binary**: Easy installation and consistent behavior across platforms
- **Vite integration**: Works well with Vite via `@deno/vite-plugin`
- **Testing**: Built-in test runner with good TypeScript support
- **Deployment**: Can deploy to Deno Deploy or use static hosting

### Negative

- **Younger ecosystem**: Smaller community and fewer native Deno libraries compared to Node.js
- **Permission flags**: Requires `-A` (all permissions) flag for development, which reduces security benefits
- **Compatibility**: Some npm packages may have issues running in Deno's environment
- **Tooling**: Not all Node.js tools work with Deno (though this is improving)

## Alternatives Considered

1. **Node.js**: Mature ecosystem, vast npm library support. Rejected because Deno provides a more modern developer experience with built-in TypeScript and ES
   modules.

2. **Bun**: Fast runtime, npm compatibility. Rejected due to immaturity and stability concerns at the time of decision.

3. **Browser-only (CDN)**: No runtime, just serve static files. Rejected because we need a development server and test runner.

4. **Static site generators (Next.js, Astro)**: Overkill for a simple SPA that doesn't need SSR or complex routing.
