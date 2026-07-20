# Shared Layer

Contains code reused across multiple features:

- `components`: reusable UI components.
- `hooks`: reusable hooks that do not belong to one business feature.
- `types`: shared TypeScript types, such as API response shapes.
- `utils`: pure helpers, formatters, and validators.

Business-specific logic should stay inside its feature module instead of being moved here too early.
