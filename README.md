# TechShop Frontend

Frontend for the AI TechShop graduation project, built with React, TypeScript, and Vite.

The frontend is planned around the main e-commerce workflows:

- JWT-based authentication and authorization.
- Products, categories, brands, search, filters, sorting, and pagination.
- Cart, checkout, orders, and payments.
- User profile, shipping addresses, and wishlist.
- Recommendation system and AI shopping assistant.

## Run Locally

```bash
npm install
npm run dev
```

By default, the frontend calls the backend through:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

If the backend port, domain, or API prefix changes, update `.env.development` for local development and `.env.example` as the shared template.

## Folder Structure

```text
src/
  app/                  # Root app composition, providers, router setup later
  assets/               # Static images, icons, and media
  config/               # Frontend environment and runtime config
  features/
    auth/               # Sign in, register, token/session
    admin/              # Dashboard, analytics, admin CRUD
    home/               # Public marketplace home and shared shop header
    catalog/            # Products, categories, brands, search/filter/sort
    cart/               # Shopping cart
    checkout/           # Orders and payments
    profile/            # Account, avatar, addresses, order history
    recommendations/    # Personalized product recommendations
    ai-assistant/       # AI shopping chat and product comparison
  layouts/              # Shared layouts: customer, admin, auth
  routes/               # Route declarations when routing is added
  shared/
    components/         # Reusable UI components
    hooks/              # Shared hooks
    types/              # Shared TypeScript types
    utils/              # Shared helpers, formatters, validators
```

## Conventions

- Business logic lives in `features/<feature-name>`.
- Feature API calls live in `features/<feature-name>/api`.
- Feature-specific types live in `features/<feature-name>/types.ts`.
- Only truly reusable code should go into `shared`.
- Do not hardcode the backend URL in components; use `src/config/env.ts`.

## Current Navigation

The app currently uses a lightweight path-based navigation layer in `src/app/App.tsx` instead of a router package.

Supported paths:

```text
/               # Public home
/auth           # Sign in/register
/admin          # Admin console
/profile        # Customer profile
/profile/orders # Customer orders tab
```

`src/shared/api/apiClient.ts` centralizes API calls, attaches access tokens for authenticated requests, sends credentials for cookie refresh flows, and attempts access-token refresh on `401` responses.

## Checks

```bash
npm run lint
npm run build
```
