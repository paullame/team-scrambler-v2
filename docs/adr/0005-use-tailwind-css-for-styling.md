# 0005: Use Tailwind CSS for Styling

- **Status**: Accepted
- **Date**: 2025-02-21

## Context

Team Scrambler needs a styling solution that:
- Provides consistent, maintainable CSS
- Supports responsive design (mobile-first)
- Allows for custom styling (scrambled-eggs-inspired color palette)
- Works well with React components
- Enables rapid UI development
- Supports dark/light mode theming

The project requires styling for:
- Complex table layouts (PeopleTable)
- Card grids (TeamCards)
- Forms and inputs (ScramblerSettings, CsvDropZone)
- Responsive sidebar/main layout
- Theme toggle

## Decision

Use **Tailwind CSS 4** with **daisyUI** component library for styling.

## Consequences

### Positive
- **Utility-first**: Rapid development with pre-defined classes, no context switching between files
- **Consistency**: Enforces design system through configuration (colors, spacing, typography)
- **Responsive**: Built-in responsive prefixes make mobile-first design easy
- **Customizable**: Full control over design tokens in `tailwind.config.js`
- **daisyUI**: Pre-built accessible components (cards, tables, forms, buttons) save development time
- **No CSS files**: All styles defined in markup, eliminating CSS file management
- **Theming**: Built-in dark mode support and theme customization
- **PurgeCSS**: Production builds remove unused CSS automatically
- **Vite integration**: Official `@tailwindcss/vite` plugin available

### Negative
- **Verbose markup**: HTML can become cluttered with many class names
- **Learning curve**: Requires memorizing or frequently looking up class names
- **Custom designs**: Complex custom designs may require custom CSS or `@apply`
- **Bundle size**: Tailwind + daisyUI adds to bundle size (though purging helps)
- **Opinionated**: May not suit projects with very specific design requirements

## Alternatives Considered

1. **CSS Modules**: Scoped CSS with local class names. Rejected because it requires creating and managing separate CSS files for each component.

2. **Styled Components**: CSS-in-JS with component-scoped styles. Rejected due to runtime CSS overhead and larger bundle size.

3. **Emotion**: CSS-in-JS library. Rejected for similar reasons as Styled Components.

4. **Plain CSS**: Traditional CSS files. Rejected because it doesn't scale well for a component-based architecture and lacks built-in responsive utilities.

5. **Bootstrap**: Pre-built component library. Rejected because it's heavier and more opinionated about design, making custom theming harder.

6. **Chakra UI**: React component library. Rejected because Tailwind + daisyUI provides more flexibility for custom styling while still offering component shortcuts.
