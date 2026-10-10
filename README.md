This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database targets

Local development and QA builds use only the isolated TEST database configured
with `DATABASE_URL_TEST` and `DIRECT_DATABASE_URL_TEST` in `.env.test.local`.
The integration suite uses the same isolated TEST configuration. The current
application runtime prefers `DIRECT_DATABASE_URL_TEST` and falls back to
`DATABASE_URL_TEST`; Prisma CLI TEST configuration also uses
`DIRECT_DATABASE_URL_TEST`. Local commands fail if TEST configuration is
missing or points to the same database as a configured non-TEST URL.

Production deployments must explicitly use:

```bash
npm run build:production
npm run start:production
```

Provide both `DATABASE_URL` and `DIRECT_DATABASE_URL` through the deployment
environment. `DATABASE_URL` is the application/runtime PostgreSQL connection;
`DIRECT_DATABASE_URL` is the direct PostgreSQL connection for explicitly
invoked production seed operations and as the default Prisma CLI connection.
`MIGRATION_DATABASE_URL` optionally overrides it for Prisma CLI operations,
including production migrations. When it is unset, a Supabase pooler URL in
`DATABASE_URL` is automatically changed to session mode (port 5432) for CLI
operations; this supports Vercel builds that cannot reach Supabase's IPv6-only
direct endpoint. An explicitly supplied migration URL should use Supabase's
Session Pooler (port 5432), not the Transaction Pooler (port 6543).
`npm run build:production` applies pending Prisma migrations before generating
the client and building the application. Production commands do not require
`.env.test.local`. Direct `next build` or
production-runtime commands without an explicit database target fail closed.
Do not set `PRIMEZORA_DATABASE_TARGET=production` for local development.

Admin credentials, including password changes, are managed through deployment
configuration. Password recovery through the application is disabled; contact
an authorized deployment operator to rotate the configured credentials.

Build artifacts are tagged with their database target. Use the matching
`start` command for the build target; startup fails if the marker is missing
or does not match the requested target.

## Application rate limiting

API rate limits use shared Upstash Redis storage so counters remain consistent
across application instances. When `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` are configured, protected routes enforce limits and
requests over a policy receive `429` with a `Retry-After` header. If the shared
limiter becomes unavailable, customer and admin authentication routes use
bounded per-instance limits so sign-in and registration remain available;
other protected routes fail closed with `503`. Per-instance fallback limits do
not synchronize across application instances, so the shared Redis configuration
should still be restored promptly.

For local development and lightweight environments without Upstash configured,
requests continue without rate limiting so login and registration remain usable
while the shared protection is absent. IP-scoped policies prefer `x-real-ip` and
fall back to the first `x-forwarded-for` value, so deployments must only accept
those headers from a trusted proxy.

## Customer email verification and transactional email

Customer credentials remain managed by Supabase Auth. Primezora stores its own
customer verification state and only a SHA-256 hash of each short-lived,
single-use verification token. Verification does not sign the customer in;
they must sign in after confirming their email. Admin authentication is separate.

Configure these server-side environment variables:

- `PUBLIC_SITE_URL`: the canonical application origin used in verification
  links. Use `http://localhost:3000` for local development and the exact HTTPS
  production origin in deployment (no path, query string, or fragment).
- `RESEND_API_KEY`: a server-only Resend API key. Never expose it with a
  `NEXT_PUBLIC_` prefix.
- `EMAIL_FROM`: a sender such as `Primezora <noreply@primezora.com>`. The sender
  domain must be verified with Resend. Customer verification uses
  `Primezora <onboarding@resend.dev>` as its local/testing fallback when this
  variable is unset; production requires `EMAIL_FROM` to be explicitly set.

For production, add the domain in Resend and publish the SPF/DKIM DNS records it
provides. Wait for the domain to show as verified, then add all three variables
to Vercel's **Production** environment and redeploy. `EMAIL_FROM` must use that
verified domain, and `PUBLIC_SITE_URL` must be the site's HTTPS origin.
Without a configured Resend provider, verification sends fail rather than
showing a false “email sent” state. Local development may use a Resend test
domain/key and an allowed recipient configured in Resend; no live delivery is
claimed until the provider accepts a send request. If a send fails, inspect the
Vercel function logs for `CUSTOMER_EMAIL_VERIFICATION_CONFIGURATION_INVALID`,
`CUSTOMER_EMAIL_VERIFICATION_PROVIDER_REJECTED`, or
`CUSTOMER_EMAIL_VERIFICATION_PROVIDER_REQUEST_FAILED`. Rejection logs include
only the provider name, allowlisted error category/code, and HTTP status; they
never include API credentials, recipient addresses, tokens, or verification
links.

For local testing, put `RESEND_API_KEY`, `TEST_EMAIL_TO`, and
`CONFIRM_EMAIL_SEND=1` in `.env.local`, then run `npm run test:email-delivery`.
The one-off test refuses to run in production and only reports sanitized
provider diagnostics; it never prints the API key or recipient address. With
`EMAIL_FROM` unset, it sends from `Primezora <onboarding@resend.dev>`, which
Resend permits only for recipients allowed by its onboarding restrictions
(typically the Resend account owner's address). For other recipients, verify
your own domain in Resend and set `EMAIL_FROM` to an address on that domain.
The focused automated checks run with `npm run test:email-verification`; these
mock provider responses and do not send real email.

Production deployment applies pending Prisma migrations through
`npm run build:production`. The migration
`20261010220000_hash_customer_verification_tokens` replaces the previous
plaintext-token columns with a token table that stores hashes only; applying it
invalidates all outstanding links created by the old implementation. Review and
apply that migration as part of the normal deployment process. No production
database migration or live email test is run from local development.

## Security response headers

The Next.js Proxy adds a Content Security Policy, `nosniff`, frame protection,
Referrer-Policy, and Permissions-Policy to application pages and API responses.
The CSP allows the app's inline Next.js runtime/styles, same-origin resources,
and Supabase-hosted images; `unsafe-eval` is limited to development. HSTS is
added only to production requests received over HTTPS.

No hosting-platform response-header rules are configured in this repository.
Before deployment, verify the hosting platform does not replace or duplicate
the application's CSP, and confirm HTTPS is forwarded to Next.js correctly so
production HSTS is applied only to secure requests.

Database seeding also requires an explicit target:

```bash
PRIMEZORA_DATABASE_TARGET=test npm run db:seed
PRIMEZORA_DATABASE_TARGET=production npm run db:seed
```

The TEST target uses only the TEST URL family from `.env.test.local`. The
production target uses `DIRECT_DATABASE_URL` from the production runtime
environment. Running `npm run db:seed` without a target fails closed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
