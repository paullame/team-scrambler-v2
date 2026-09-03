# 0003: Use Vite for Building

- **Status**: Accepted
- **Date**: 2025-02-21

## Context

Team Scrambler needs a build tool that:

- Bundles TypeScript and React code for production
- Provides fast development server with Hot Module Replacement (HMR)
- Supports modern ES features (ESM, JSX, TypeScript)
- Works well with Deno runtime
- Optimizes production builds (minification, tree-shaking)
- Supports CSS preprocessing (Tailwind)

The project requires a build process that can handle:

- React component compilation (JSX)
- TypeScript transpilation
- CSS bundling with Tailwind
- Development server for local testing
- Production build for deployment

## Decision

Use **Vite 8** as the build tool.

## Consequences

### Positive

- **Blazing fast**: Native ES module support provides instant server start and HMR
- **Out-of-the-box support**: TypeScript, JSX, CSS, and JSON imports work without configuration
- **Plugin ecosystem**: Rich ecosystem including `@vitejs/plugin-react`, `@tailwindcss/vite`, and `@deno/vite-plugin`
- **Optimized builds**: Automatic code splitting, minification, and tree-shaking
- **Developer experience**: Simple configuration, clear error messages, fast iteration
- **Deno integration**: Works seamlessly with Deno via `@deno/vite-plugin`

### Negative

- **Configuration complexity**: Some advanced features require plugin configuration
- **Relatively new**: Less battle-tested than Webpack for edge cases
- **Memory usage**: Development server can consume significant memory for large projects

## Alternatives Considered

1. **Webpack**: Mature, highly configurable. Rejected due to slower builds, more complex configuration, and worse developer experience.

2. **esbuild**: Extremely fast. Rejected because it's a lower-level tool and lacks React-specific optimizations and plugin ecosystem.

3. **Parcel**: Zero-configuration. Rejected due to slower builds and less flexibility.

4. **Rollup**: Great for libraries. Rejected because Vite uses Rollup internally and provides a better developer experience.

5. **Next.js**: Full-stack React framework. Rejected as overkill for a simple SPA without SSR needs.
