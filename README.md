# Save The Date

Next.js app for Adeola and Joshua's wedding site.

## Local Setup

Copy `.env.example` to `.env.local` and fill in your Railway Postgres connection string:

```txt
DATABASE_URL=
AUTH_COOKIE_SECRET=
MAILEROO_API_KEY=
MAILEROO_FROM_EMAIL=
MAILEROO_FROM_NAME=
```

Install dependencies and run the app:

```sh
npm install
npm run dev
```

Run database migrations against the configured Railway Postgres database:

```sh
npm run db:migrate
```

The migrations create:

- `hall_passes` for unique QR-backed hall passes
- `redeem_hall_pass(pass_token, scanner_name)` for atomic first-scan redemption

## Auth

The admin and bouncer flows use database-backed users with bcrypt password hashes:

- `AUTH_COOKIE_SECRET` signs the HTTP-only session cookie
- `app_users` stores user emails, bcrypt password hashes, and roles

Generate a long random cookie secret before deploying.

Create or update users with:

```sh
npm run user:create
```

The script prompts for an email, password, and role. Use `admin` for full admin access
or `security_admin` for scanner/security access. You can also pass everything inline:

```sh
npm run user:create -- admin@example.com "strong-password" admin
npm run user:create -- security@example.com "strong-password" security_admin
```

## Hall pass dependencies

The hall pass flow uses:

- Railway Postgres for persistent hall pass state
- `pg` for server-side database access from Next.js routes
- `qrcode` for QR code generation
- `pdf-lib` for server-generated PDF ticket attachments
- Maileroo Email API for optional PDF ticket delivery
- `html5-qrcode` for camera-based QR scanning

Keep real Railway credentials in `.env.local`; do not commit them. `DATABASE_URL` is server-only and should never be exposed with a `NEXT_PUBLIC_` prefix.
`MAILEROO_FROM_EMAIL` must be an address on a verified Maileroo domain.
