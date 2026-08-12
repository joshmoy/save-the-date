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

## Image preparation

Prepare the traditional-marriage photos for Cloudinary with:

```sh
npm run media:process-images
```

By default, the command reads `~/Documents/wedding/trad` recursively and writes optimized JPEG
copies to `~/Documents/wedding/trad-optimized`. Originals are never modified. Existing output
files are skipped; pass `--force` to regenerate them:

```sh
npm run media:process-images -- --force
```

To process the same folder at a different location, pass its path:

```sh
npm run media:process-images -- "/path/to/Documents/wedding/trad"
```

Administrators can instead process and upload a local folder entirely in the browser at
`/admin/media/images`. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` to the deployed environment. The browser resizes each supported image and
uploads it directly to the selected `wedding/media/<category>/photos` Cloudinary folder; the API
secret is only used by the server to authorize the upload.

Upload browser-ready MP4 videos directly through the Cloudflare R2 dashboard using these object
prefixes:

```txt
wedding/media/engagement/videos/
wedding/media/traditional-marriage/videos/
wedding/media/church-wedding/videos/
wedding/media/wedding-reception/videos/
```

Configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and
`R2_PUBLIC_URL`. The public URL should be an R2 custom domain or public bucket URL. After uploading
videos in R2, use **Sync public gallery** on `/admin/media/images`; this invalidates the otherwise
permanent media cache so the next `/media` page load lists the new files.

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
