# AUTH-R.8 UNAUTHENTICATED Redirect Evidence

Required external checks:
- Open Clerk dashboard > Users.
- Find fixture account auth-remediation-reviewer+clerk@laneshadow.test.
- Verify the latest iOS/Android session is present after sign-in.
- Revoke the active session or token.
- Return to the app and verify Convex UNAUTHENTICATED redirects to AuthScreen.

Convex commands:
- pnpm --dir server convex dev --once
- pnpm --dir server run convex:dev -- --once
- pnpm server:codegen

Expected output:
- Convex reports or logs an UNAUTHENTICATED response for the revoked/expired fixture session.
- iOS redirects to auth.signIn.root.
- Android redirects to AuthScreen or records MANUAL/BLOCKED with physical device artifact instructions.
