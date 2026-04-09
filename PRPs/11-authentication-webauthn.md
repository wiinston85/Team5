# PRP 11: Authentication with WebAuthn

## Feature Overview
Implement passwordless authentication with passkeys and JWT session cookies.

## Technical Requirements
- Tables: users, authenticators.
- APIs:
  - POST /api/auth/register-options
  - POST /api/auth/register-verify
  - POST /api/auth/login-options
  - POST /api/auth/login-verify
  - POST /api/auth/logout
  - GET /api/auth/me
- Middleware protects root and calendar routes.
- Session cookie is HTTP-only and 7-day expiry.
- Authenticator counter uses null-safe fallback with ?? 0.

## UI Requirements
- Login page with register and login actions.
- Redirect authenticated users to app.

## Acceptance Criteria
- Registration and login with passkey works.
- Protected routes redirect unauthenticated users.
- Logout clears session.

## Testing Requirements
- E2E with virtual authenticators for register/login/logout.
