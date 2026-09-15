# Production Security & Release Review

**Branch audited:** `yuki`  
**Date:** September 15, 2026  
**Scope:** SQL injection, auth/access control, XSS, CSRF, SSRF, secrets, debug flags, rate limiting, deployment readiness

---

## Executive Summary

The codebase is **generally well-structured** from a security perspective:

- **No SQL injection vulnerabilities** — All database access uses the Supabase client library with parameterized queries; no raw SQL string concatenation was found.
- **No XSS via dangerouslySetInnerHTML** — React's default escaping is used throughout; `dangerouslySetInnerHTML` is not present.
- **Proper admin authorization** — Admin routes check `admin_users` table membership before privileged operations.
- **Signed tokens** for email confirmation/cancel links use HMAC-SHA256 with timing-safe comparison.
- **RLS enabled** on sensitive tables (`admin_users`, `events`, `jobs`, `mailing_list_subscribers`).

**However, several issues require attention before production launch:**

| Severity | Count | Summary |
|----------|-------|---------|
| Critical | 0 | — |
| High | 2 | Open redirect in auth callback; missing rate limiting on sensitive endpoints |
| Medium | 4 | CRON_SECRET validation weakness; missing env validation at startup; email XSS in mailing list; hardcoded Supabase URL in hero component |
| Low | 3 | Console.error may leak internal details; no CSRF tokens (mitigated by SameSite cookies); test script in repo |
| Info | 2 | Missing indexes (acceptable); scripts directory in .gitignore but still tracked |

---

## Prioritized Findings

### Finding 1: Open Redirect in Auth Confirm Route
**Severity:** High  
**File:** `src/app/auth/confirm/route.ts` (lines 10-18)

**Description:**  
The `next` query parameter is used directly in a redirect without validation. An attacker could craft a malicious link like:
```
/auth/confirm?token_hash=...&type=signup&next=https://evil.com/phishing
```
After the user confirms their email, they would be redirected to an attacker-controlled site.

**Current Code:**
```typescript
const next = searchParams.get('next') ?? '/passport';
// ... later ...
redirect(next);
```

**Impact:** Phishing attacks via email confirmation links sent to users.

**Fix:** Validate that `next` is a relative path or belongs to the same origin.

```typescript
function safeNextPath(next: string | null): string {
  if (!next) return '/passport';
  // Only allow relative paths starting with /
  if (next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return '/passport';
}
```

---

### Finding 2: Missing Rate Limiting on Sensitive Endpoints
**Severity:** High  
**Files:**  
- `src/app/api/career-applications/route.ts`
- `src/app/events/actions.ts` (registerGuest)
- `src/app/mailing-list/actions.ts` (subscribeGuest)
- `src/app/login/actions.ts`

**Description:**  
No rate limiting is implemented on:
1. **Career applications** — Anyone can spam job applications
2. **Guest RSVP** — Can flood the event_guests table and trigger email spam
3. **Mailing list signup** — Can trigger unlimited verification emails
4. **Login attempts** — No brute-force protection (Supabase has some, but app-level is missing)

**Impact:**  
- Denial of service via database/email flooding
- Email reputation damage (spam complaints)
- Potential brute-force attacks on login

**Fix:** Implement rate limiting using Vercel's built-in rate limiting, Upstash Redis, or similar. Minimum recommended limits:
- Career applications: 3/hour per IP
- Guest RSVP: 5/hour per email
- Mailing list: 3/hour per IP
- Login: 5 failed attempts per 15 minutes per IP/email

---

### Finding 3: CRON_SECRET Validation Uses Simple String Comparison
**Severity:** Medium  
**File:** `src/app/api/cron/event-reminders/route.ts` (lines 10-13)

**Description:**  
The cron endpoint uses direct string comparison for secret validation:
```typescript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response(null, { status: 401 });
}
```

While this works, it's vulnerable to timing attacks. The `CRON_SECRET` is also used as a fallback for signing email tokens (`src/lib/guestCancelToken.ts` line 19-22), which could allow an attacker to use timing information to recover the secret and forge email action tokens.

**Fix:** Use timing-safe comparison:
```typescript
import { timingSafeEqual } from 'crypto';

const expected = `Bearer ${process.env.CRON_SECRET}`;
if (!authHeader || 
    authHeader.length !== expected.length || 
    !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
  return new Response(null, { status: 401 });
}
```

---

### Finding 4: Missing Environment Variable Validation at Startup
**Severity:** Medium  
**Files:** Various (runtime checks scattered throughout)

**Description:**  
Required environment variables are only validated at runtime when the specific feature is accessed. Missing variables cause runtime errors rather than startup failures.

Critical variables that should be validated at build/startup:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin features)
- `RESEND_API_KEY` (for email features)
- `CRON_SECRET` (for cron endpoint protection)

**Impact:** Production could start with missing configuration, causing user-facing errors.

**Fix:** Add a validation script or use a library like `zod` to validate env vars at startup. Example in `src/lib/env.ts`:
```typescript
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}
// ... etc
```

---

### Finding 5: Potential XSS in Mailing List Verification Email
**Severity:** Medium  
**File:** `src/app/mailing-list/actions.ts` (lines 48-56)

**Description:**  
The user's name is partially sanitized but not fully escaped in HTML email:
```typescript
const html = `
  <p style="...">Hi ${name.replace(/</g, '')}, click the link below...</p>
`;
```

The `replace(/</g, '')` only removes `<` characters, but doesn't handle other HTML entities or attribute injection. While the risk is limited (displayed in email clients, not browsers), it's still a defense-in-depth issue.

**Current code only strips `<`:**
```typescript
name.replace(/</g, '')
```

**Fix:** Use proper HTML escaping:
```typescript
function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

---

### Finding 6: Hardcoded Supabase Storage URL in HeroCanvas
**Severity:** Medium  
**File:** `src/components/landing/HeroCanvas.tsx` (lines 7-8)

**Description:**  
A Supabase storage URL is hardcoded in the component:
```typescript
const CLIP_SRC =
  'https://efkbzaxczglgyfsaynjw.supabase.co/storage/v1/object/public/hero/Adobe%20Express%20-%20CS_CLUB_Recap.mp4';
```

This should use the environment variable `NEXT_PUBLIC_HERO_RECAP_URL` defined in `.env.example`.

**Impact:**  
- Won't work if Supabase project changes
- Breaks the configuration pattern established elsewhere
- Production may reference wrong/old video

**Fix:** Use the environment variable:
```typescript
const CLIP_SRC = process.env.NEXT_PUBLIC_HERO_RECAP_URL || '/hero/clips/recap.mp4';
```

---

### Finding 7: Console.error May Leak Internal Details
**Severity:** Low  
**Files:** Multiple (see grep results for `console.error`)

**Description:**  
Several API routes and server actions log full error objects to `console.error`. In production, these logs may be accessible in Vercel's logging dashboard, potentially exposing:
- Database schema details via Supabase error messages
- Internal paths and stack traces

Examples:
- `src/app/api/admin/events/route.ts:60` — logs full error object
- `src/app/api/admin/attendance/route.ts:105` — logs full error object

**Impact:** Information disclosure to anyone with log access.

**Fix:** Log only sanitized error codes/messages, not full error objects. Consider using a structured logger that redacts sensitive fields.

---

### Finding 8: No Explicit CSRF Protection
**Severity:** Low  
**Files:** All form-handling routes

**Description:**  
The application doesn't implement explicit CSRF tokens. However, this is largely mitigated by:
1. Supabase auth cookies using `SameSite=Lax` by default
2. Server Actions in Next.js 15 include built-in origin checking
3. API routes require authentication tokens

**Impact:** Low due to existing mitigations, but defense-in-depth is reduced.

**Recommendation:** For highest security, consider adding explicit CSRF tokens for state-changing operations, especially for the newsletter send functionality which has significant impact.

---

### Finding 9: Test Script Contains Hardcoded Test Password
**Severity:** Low  
**File:** `scripts/test-auth.mjs` (line 39)

**Description:**  
The test script contains a hardcoded test password:
```javascript
const testPassword = 'test-password-123';
```

While the scripts directory is in `.gitignore`, the file was committed before the gitignore rule and remains tracked.

**Impact:** Minor — only used for ephemeral test accounts that are deleted after the test.

**Fix:** The `scripts/` directory should be removed from git tracking:
```bash
git rm -r --cached scripts/
```

---

### Finding 10: Missing Database Indexes (Informational)
**Severity:** Info  
**Files:** `supabase/migrations/*.sql`

**Description:**  
No explicit indexes are defined beyond primary keys and unique constraints. For current scale this is acceptable, but under high load these queries may become slow:
- `event_rsvps` lookups by `event_id`
- `passport_stamps` lookups by `event_id` and `user_id`
- `profiles` lookups by `email` (used in attendance check-in)

**Recommendation:** Monitor query performance post-launch and add indexes as needed.

---

## Pre-Launch Checklist

### Must Fix Before Production

- [ ] **Fix open redirect** in `/auth/confirm` — validate `next` parameter
- [ ] **Add rate limiting** to career applications, guest RSVP, mailing list signup, and login
- [ ] **Use timing-safe comparison** for CRON_SECRET validation

### Should Fix (First Sprint Post-Launch)

- [ ] Add environment variable validation at startup
- [ ] Fix HTML escaping in mailing list verification email
- [ ] Move hardcoded hero video URL to environment variable
- [ ] Remove scripts directory from git tracking

### Good Practices to Add

- [ ] Set up structured logging that sanitizes error output
- [ ] Consider adding explicit CSRF tokens for high-impact actions
- [ ] Document required vs optional environment variables
- [ ] Add monitoring/alerting for failed login attempts

---

## Positive Security Observations

1. **Supabase RLS is properly configured** — Tables have appropriate policies, admin checks use `is_admin()` function with `SECURITY DEFINER`
2. **No raw SQL** — All queries use parameterized Supabase client methods
3. **Proper password handling** — Delegated to Supabase Auth, no custom password storage
4. **Email tokens are properly signed** — HMAC-SHA256 with timing-safe verification and expiration
5. **Input validation present** — Form inputs have length limits and format validation
6. **Admin routes double-check authorization** — Both middleware and route-level checks
7. **Secrets not committed** — `.gitignore` properly excludes `.env` files

---

## Files Reviewed

| Category | Files |
|----------|-------|
| Auth & Login | `src/app/login/actions.ts`, `src/app/login/page.tsx`, `src/app/auth/confirm/route.ts`, `src/middleware.ts` |
| Admin | `src/app/admin/actions.ts`, `src/app/admin/page.tsx`, `src/lib/admin.ts` |
| API Routes | `src/app/api/admin/events/route.ts`, `src/app/api/admin/attendance/route.ts`, `src/app/api/cron/event-reminders/route.ts`, `src/app/api/career-applications/route.ts`, `src/app/api/events/route.ts` |
| Events/RSVP | `src/app/events/actions.ts`, `src/app/events/guest-confirm/page.tsx`, `src/app/events/guest-cancel/page.tsx` |
| Mailing List | `src/app/mailing-list/actions.ts`, `src/app/mailing-list/confirm/page.tsx` |
| Passport | `src/app/passport/actions.ts`, `src/app/passport/page.tsx` |
| Supabase | `src/lib/supabase/admin.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/config.ts` |
| Email | `src/lib/email.ts`, `src/lib/guestCancelToken.ts` |
| Database | `supabase/migrations/*.sql` |
| Config | `.env.example`, `.gitignore`, `vercel.json`, `package.json` |
