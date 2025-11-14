## Overview

Enhance the current registration flow to send and process email verification using Firebase Authentication, without overhauling the existing JWT-based auth. New Firebase email verification will run alongside current flows, and verified state will be reflected in user profiles and enforced by existing guards.

## Configuration

* Enable Email/Password provider in Firebase Authentication (no social logins).

* Customize verification email template in Firebase Console (branding, language).

* ActionCodeSettings:

  * `handleCodeInApp: true`

  * `url: https://<your-domain>/auth/verify-email`

  * Deep links: configure Dynamic Links domain; set `androidPackageName`, `iOSBundleId` for mobile deep linking.

* Env vars:

  * Frontend: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.

  * Backend (Admin SDK): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

## Backend Changes (Minimal)

* Initialize Firebase Admin once at server startup (no other auth changes).

* New endpoints:

  * `POST /api/auth/verification/request`:

    * Body: `{ email }`

    * Ensure a Firebase Auth user exists for the email (create if missing with random password).

    * Generate verification link via Admin `generateEmailVerificationLink(email, actionCodeSettings)`.

    * Send email  by  firebase to the user  

    * Rate-limit requests.

  * `POST /api/auth/verification/confirm`:

    * Body: `{ email }` (optional; taken from current user or query fallback).

    * Marks verified in project DB: update `User.isEmailVerified=true`, `emailVerifiedAt=now` if a matching user exists; otherwise store tracking record in Firestore (for standalone verification).

  * `GET /api/auth/verification/status?email=<email>`:

    * Returns `{ verified, verifiedAt }` from project DB or Firestore.

* Keep `requireVerified` middleware in place for gating: `alzawaj-project-backend/src/middleware/authMiddleware.ts:250-262`.

## Frontend Changes

* Firebase client initializer (`firebaseClient`) to process verification links.

* Registration flow (existing UI):

  * After successful backend registration, call `POST /api/auth/verification/request` with the user’s email.

  * Show success banner/toast: “Check your email to verify your account”.

  * Store a local pending flag and reflect in profile UI.

* Verification landing page: `/auth/verify-email`

  * Read `mode` and `oobCode` from query.

  * For `mode=verifyEmail`, call `applyActionCode(auth, oobCode)`.

  * On success: show confirmation UI, then call `POST /api/auth/verification/confirm` to persist verified status.

  * Handle errors (`invalid-action-code`, `expired-action-code`) with clear guidance and a “Resend email” button.

* UI components:

  * `VerificationStatusBanner`: shows verified/unverified state with actions (resend, refresh status).

  * `ResendVerificationButton`: triggers `POST /api/auth/verification/request` with cooldown.

## Real-Time Status & Security Measures

* Real-time update:

  * After applying action code, force Firebase `currentUser.reload()` in client, then call `confirm` endpoint to sync DB.

* Feature gating:

  * Frontend: block sensitive areas via existing `AuthProvider` redirect and show banner; backend: unchanged `requireVerified` gate.

* Resend controls:

  * Cooldown (e.g., 60s) and daily cap; surface user-friendly errors.

* Link expiration:

  * Note: Firebase controls verification link expiry and does not expose a setting for custom TTL (cannot strictly enforce 3 days). Implement resend flow and show message on expiry; optionally track `lastSentAt` and enforce project-level policies.

## Testing Strategy

* Providers: Gmail, Outlook, Yahoo — verify deliverability and link behavior.

* Expiration behavior: simulate expired `oobCode` and ensure UI shows appropriate errors and allows resend.

* Scenarios:

  * Success flow end-to-end: registration → email sent → link click → landing page success → status updates → gated features unlock.

  * Failure flows: invalid code, expired code, rate limited resend; verify clear messages.

* Backend tests: endpoint rate limiting, Admin link generation errors, DB sync of `isEmailVerified` and `emailVerifiedAt`.

## Documentation

* Describe endpoints:

  * `POST /api/auth/verification/request` — body `{ email }`, responses and rate limits.

  * `POST /api/auth/verification/confirm` — body `{ email }`, behavior and return.

  * `GET /api/auth/verification/status?email=...` — status shape.

* Developer guide: Firebase setup steps, Dynamic Links configuration, env variables, verification page flow.

* Security considerations: no secrets in logs, trusted redirect URLs, throttling.

## Rollout Plan

1. Configure Firebase (Auth + Dynamic Links), add env vars.
2. Implement Admin initializer + three endpoints.
3. Add verification page and UI components; wire into registration completion.
4. Integrate gating with existing middleware and provider.
5. Run tests across email providers; validate errors and UX; ship to staging.

