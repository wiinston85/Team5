# PRP 11 - Authentication with WebAuthn

## Feature Overview
Implement passwordless authentication with passkeys using WebAuthn, session management, and protected routes.

## User Stories
- As a user, I can register an account with a passkey.
- As a user, I can sign in using my passkey.
- As a user, I can log out and end my session.

## User Flow
1. User enters username and starts registration.
2. Client receives register options and completes WebAuthn ceremony.
3. User returns to app authenticated.
4. User logs in later through login options and verify flow.
5. User logs out and protected routes require re-authentication.

## Technical Requirements
- Data model tables: users, authenticators.
- API routes:
  - POST /api/auth/register-options
  - POST /api/auth/register-verify
  - POST /api/auth/login-options
  - POST /api/auth/login-verify
  - POST /api/auth/logout
  - GET /api/auth/me
- Session management utility for create, read, and delete session state.
- Middleware to guard protected routes.
- Session cookie: HTTP-only, secure in production, bounded expiration.

## UI Components
- Login and registration screen
- Username input and passkey action buttons
- Logout action in app header or settings

## Edge Cases
- Browser without WebAuthn support should show clear fallback guidance.
- Invalid or replayed challenge responses must fail securely.
- Session expiration should redirect to login cleanly.
- Authenticated users visiting login route should be redirected appropriately.

## Acceptance Criteria
- Registration with passkey succeeds.
- Login with passkey succeeds.
- Logout clears active session.
- Protected routes require valid session.

## Testing Requirements
- E2E: register with virtual authenticator
- E2E: login with virtual authenticator
- E2E: logout and verify route protection
- E2E: unauthorized user redirected from protected routes
- Unit: token or session validation helpers

## Out of Scope
- OAuth social login providers
- Multi-factor combinations beyond passkeys

## Success Metrics
- Auth route success and error paths fully covered by tests.
- Zero unauthorized access to protected todo pages in E2E tests.
- Login and register ceremony completion latency within acceptable UX thresholds.
