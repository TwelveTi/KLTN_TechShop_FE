# Feature Modules

This folder is organized by business domain so the project can grow cleanly:

- `auth`: sign in, register, token/session, and auth-related profile state.
- `admin`: admin dashboard, revenue analytics, and management CRUD screens.
- `home`: public marketplace home page, search entry, category strip, and featured product sections.
- `catalog`: categories, brands, product listing, product detail, search, filters, sorting, and pagination.
- `cart`: cart items, quantity updates, and cart totals.
- `checkout`: order creation, shipping address, and payments.
- `profile`: account information, addresses, and order history.
- `recommendations`: product recommendations, behavior tracking, and personalized home sections.
- `ai-assistant`: shopping assistant chat, product advice, comparisons, and recommendation explanations.

Each feature can contain `api`, `components`, `hooks`, `pages`, `types`, and `utils` as needed.
