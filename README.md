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
`DIRECT_DATABASE_URL` is the direct PostgreSQL connection for Prisma CLI
operations and explicitly invoked production seed operations. Production
commands do not require `.env.test.local`. Direct `next build` or
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
across application instances. Configure `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` in each deployed or local runtime that serves these
routes. Protected routes fail closed with `503` if the shared limiter is not
configured or unavailable; requests over a policy receive `429` with a
`Retry-After` header. IP-scoped policies prefer `x-real-ip` and fall back to the
first `x-forwarded-for` value, so deployments must only accept those headers
from a trusted proxy.

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
