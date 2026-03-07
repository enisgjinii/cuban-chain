---
description: "Use when editing the Cuban chain customizer app in Next.js, React, TypeScript, React Three Fiber, or MUI. Enforces mandatory project conventions for component boundaries, typing, imports, and safe UI changes."
name: "Cuban Chain Next TypeScript Conventions"
applyTo:
  - "app/**/*.{ts,tsx}"
  - "components/**/*.{ts,tsx}"
  - "lib/**/*.ts"
---
# Cuban Chain Project Conventions

- Keep TypeScript strict-friendly. Use explicit types for public helpers and avoid `any` unless no practical alternative exists.
- Use the `@/*` import alias for workspace-local imports when paths would otherwise be long or fragile.
- Follow Next.js App Router boundaries:
  - Prefer Server Components by default.
  - Add `"use client"` only for components that need browser APIs, hooks, or interactive state.
- Keep business logic and geometry/calculation helpers in `lib/` and keep UI components in `components/`.
- In React Three Fiber and geometry-heavy code paths, keep expensive calculations out of render paths. Memoize or precompute stable values when possible.
- Preserve existing technology choices in touched files (MUI, React Three Fiber, Drei, and current styling patterns) instead of mixing in new UI frameworks.
- Keep changes focused. Do not introduce broad refactors in unrelated files when implementing a feature or bug fix.
- Maintain lint-friendly code style:
  - Prefer `const` over `let` when values are not reassigned.
  - Do not introduce `var`.
  - Do not add new `console` statements unless they are temporary and clearly needed for debugging.
- For UI changes, keep desktop and mobile behavior functional and avoid layout regressions in panel-heavy views.
