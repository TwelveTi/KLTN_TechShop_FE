# App Layer

Contains app-level composition such as providers, root routing, and global layout setup.

`App.tsx` currently switches between `HomePage`, `AuthPage`, `AdminPage`, and `ProfilePage` with a lightweight `window.history.pushState` flow instead of a router dependency.

It also owns top-level auth/session behavior:

- Restores cached auth from local storage.
- Attempts refresh-session flow on app start.
- Updates stored user data after `GET /users/me`.
- Coordinates sign in, sign out, admin navigation, and profile navigation.

When a router package is added later, this is where the router and shared providers should be mounted.
