# Save The Date app behavior

This app is Adeola and Joshua’s wedding website and entry-pass management system. Guests can read wedding announcements and browse photos and films. Administrators can issue hall passes, download or email tickets, manage the ticket limit, and upload photographs. Security staff can scan or manually enter a pass code to admit a guest once.

This describes the implementation in the repository as of 11 October 2026. External media availability, deployed configuration, database contents, and actual email delivery depend on the running environment; the behavior below is based on the source code rather than a live deployment check.

## Application structure

The app uses Next.js App Router with React and TypeScript. Route files live in `app/`, most page interfaces live in `src/views/` and `src/components/`, and server integrations live in `src/lib/`. It runs as a Next.js server because authentication, PostgreSQL access, upload authorization, and email delivery require server execution.

Chakra UI supplies the shared component system and wedding theme. Framer Motion supplies animations on the homepage and update pages. The gallery uses its own CSS module and Next.js image component. PostgreSQL stores users, hall passes, scan attempts, and ticket settings. Cloudinary stores gallery photos, Cloudflare R2 stores gallery videos, and Maileroo sends ticket emails.

The package declares Next.js `^16.2.6`, React `^19.2.0`, and Chakra UI `^3.30.0`. These are dependency ranges, not a statement about the deployed runtime.

## Routes and audiences

| Route | Audience | Current function |
| --- | --- | --- |
| `/` | Public | Wedding save-the-date landing page |
| `/updates` | Public | Automatically advancing announcement stories |
| `/updates/venue-selected` | Public | Ceremony and reception information with maps |
| `/updates/engagement-video` | Public | Engagement film embedded from Google Drive |
| `/updates/official-colors` | Public | Outfit colors, swatches, and jersey images |
| `/updates/gifting` | Public | Gifting guidance and personal message |
| `/updates/vendors` | Public | Placeholder displaying `VendorsPage` |
| `/media` | Public | Six photo collections and four video sections |
| `/admin/login` | Signed-out staff | Email and password login |
| `/admin/passes` | Administrators | Pass generation, browsing, delivery, and invalidation |
| `/admin/media/images` | Administrators | Folder-based image processing and upload |
| `/scanner` | Administrators and security | Camera or manual pass redemption |

Public routes do not require guest accounts or invitation codes. Private pages check the signed session on the server and redirect unauthorized visitors to login. Private API routes independently check the session and allowed role.

## Public wedding site

### Homepage

The landing page displays “Adeola & Joshua,” “are getting married,” and the fixed date **1 August 2026**. It also displays “Formal Invitation to Follow” and a message anticipating the celebration. Buttons open Updates and Media.

The page fills the viewport, uses `/7V2A8743.jpg` as its background, and layers a cream overlay, vignette, decorative frame, animated entrances, and continuously floating petal shapes. Typography and spacing adapt at responsive breakpoints.

The date and copy are static. There is no countdown, date-dependent transition, RSVP form, calendar export, or post-wedding state. Even after the displayed wedding date, the homepage continues to show the same save-the-date message.

Sources: `src/views/HomePage.tsx`, `app/page.tsx`.

### Update stories

Updates appear as full-screen stories over background photographs. The current story shows its date, title, summary, and a View Details button. Progress bars represent completed, current, and upcoming stories.

Each story advances after five seconds. The left portion of the screen moves backward, the right portion moves forward, and the close button returns home. Moving beyond the final story also returns home. Holding the mouse or touching the story pauses it; releasing starts a new five-second timer rather than resuming an exact remaining duration. The progress animation is separate from the timer.

There are four active stories, in their array order:

| Story | Displayed date | Detail page |
| --- | --- | --- |
| Reception Venue Selected! | 1 February 2026 | `/updates/venue-selected` |
| Engagement Video | 13 January 2024 | `/updates/engagement-video` |
| Official Colors Revealed | 1 February 2026 | `/updates/official-colors` |
| Gifting | 1 February 2026 | `/updates/gifting` |

They are not sorted by date. Content is maintained in `src/data/updates.ts` and the individual views; there is no announcements editor in the admin area. A vendor announcement is commented out and does not appear in the sequence.

Sources: `src/views/UpdatesPage.tsx`, `src/data/updates.ts`.

### Announcement detail pages

The four active detail pages share a sticky navigation bar with Back to Updates and a link home, a title/summary/date header, media, article text, and decorative tags. The content is hardcoded. Pages that cannot match their pathname to an update display Update not found with a button back to Updates.

**Venue:** The reception is described as Nelo’s Place, Ikeja, Lagos, and the ceremony as CAC Olurunsogo, Mushin, Lagos. Separate Google Maps embeds show the ceremony and reception locations. The venue article mentions parking and the choice of venue; it does not provide a schedule or booking workflow.

**Engagement film:** A fixed Google Drive file is converted into a `/preview` iframe. The accompanying story describes an evening at Black Pepper, Lagos and suggests watching in 1080p. Playback depends on Google Drive access and its embedded player. The reusable `HeroVideo` component also understands YouTube and Vimeo links and falls back to a native video element for direct files, but this page currently uses Drive.

**Colors:** The engagement guidance lists burgundy for the couple, pink for the bride’s friends, and white agbada with dusky pink caps for the groom’s friends. Ceremony guidance lists a white bridal dress, a light blue groom’s suit, pink bridal-train dresses, and navy blue groomsmen’s suits. Six labeled swatches and two local jersey images accompany the text. The swatch labeled Light Blue uses `#4169e1`.

**Gifting:** Guests are asked to reach out for account details. Additional copy jokes about friends contributing money. There is no embedded payment flow, account-details form, gift registry, or contact submission mechanism on this page.

**Vendors:** The route exists, but the component only renders the text `VendorsPage`. It is not a working vendor directory.

`src/views/UpdateDetailsPage.tsx` also contains a generic detail view that looks up an update by ID, but no current `app/` route mounts it.

Sources: `src/views/VenueSelectedPage.tsx`, `EngagementVideoPage.tsx`, `OfficialColorsPage.tsx`, `GiftingPage.tsx`, `VendorsPage.tsx`, and `src/components/HeroVideo.tsx`.

## Public media gallery

### Collections and browsing

The gallery has its own Home, Updates, and Media navigation, a photographic hero, and six fixed collections:

| Collection slug | Display name | Photos | Video section |
| --- | --- | --- | --- |
| `engagement` | Engagement | Yes | Yes |
| `pre-wedding` | Pre-Wedding | Yes | No |
| `traditional-marriage` | Traditional Marriage | Yes | Yes |
| `civil-wedding` | Civil Wedding | Yes | No |
| `church-wedding` | Church Wedding | Yes | Yes |
| `wedding-reception` | Wedding Reception | Yes | Yes |

All six collections render even when empty. Populated collections show item counts. Empty photo and video sections show coming-soon messages. Photos and videos have separate horizontal carousels. Arrow controls appear when the rail overflows and are disabled at its ends. Visitors can also scroll the rails directly.

Selecting a photo or video opens a modal. Previous and next controls navigate within that collection’s photo sequence or video sequence; they do not cross into another collection and do not wrap at the ends. Escape closes the viewer, arrow keys navigate, and the backdrop and close button dismiss it. Body scrolling is disabled while the viewer is open.

Photos are enlarged in the viewer. Videos use native controls, inline playback, metadata preloading, and request autoplay when opened. Video cards use an icon backdrop rather than generated film thumbnails. There is no explicit gallery search, download button, guest upload, comment, or favorite function.

### Featured photographs

The hero uses up to six Cloudinary images tagged `featured`, newest uploads first. Its query is global to the configured Cloudinary account; it is not restricted to wedding collection folders. If no featured images are returned, it uses the first photo in the first nonempty collection. If there are no gallery photos, it uses the local homepage photograph.

With multiple hero images, the page advances every 6.5 seconds and provides selection dots and a pause/resume button. Automatic advancement skips hidden browser tabs and is disabled when reduced motion is requested. A View featured photo button opens the active gallery photograph. The local fallback has no featured-view button.

The hero’s “2025–2026” label is fixed copy. Individual item years come from Cloudinary creation timestamps or R2 last-modified timestamps, so they represent upload/storage metadata rather than a recorded event date.

### Photo and video sources

Photos are searched by Cloudinary asset folder:

```text
wedding/media/<collection-slug>/photos
```

The server follows Cloudinary result cursors, requesting up to 500 resources per page and ordering them newest first. Image titles are derived from display names, filenames, or public IDs. Image orientation is inferred from stored dimensions. Cloudinary transformations supply automatically formatted/compressed images up to 2400 pixels wide, cropped thumbnails at 900 × 560, and featured hero images at 2400 × 1400.

Videos are listed from R2 through the S3-compatible API under:

```text
media/<collection-slug>/videos/
```

Only the four categories configured for video are listed. The code accepts nonempty MP4 and MOV objects directly under each prefix and ignores nested subfolders. Listing follows continuation tokens and sorts the resulting videos alphabetically by title. Public playback URLs encode the object key and append a last-modified version parameter. Videos are marked landscape in the app data regardless of their actual dimensions.

### Cache and failure behavior

Cloudinary collections, featured images, and R2 video collections use persistent Next.js caches with no configured time-based expiry. Admin synchronization expires the `cloudinary-media` and `r2-media` cache tags and revalidates `/media` so subsequent page loads fetch fresh lists. It does not push new assets into an already-open visitor’s gallery.

Missing Cloudinary configuration produces empty photo collections and no featured photos. Missing R2 configuration produces empty video lists. Individual collection-loading errors are logged and converted to empty lists. The public gallery consequently shows coming-soon states rather than distinguishing an empty collection from an integration failure. Those empty results can remain cached until synchronization.

Sources: `app/media/page.tsx`, `src/views/MediaPage.tsx`, `src/data/mediaCategories.ts`, `src/lib/cloudinaryMedia.ts`, `src/lib/r2.ts`, `app/api/media/revalidate/route.ts`.

## Staff authentication and permissions

Staff log in with an email and password. The server looks up the email case-insensitively in PostgreSQL and verifies the bcrypt password hash. Invalid credentials return an error. There is no self-registration, password-reset page, or user management interface.

The implementation recognizes two stored roles:

| Capability | `super_admin` | `bouncer` |
| --- | --- | --- |
| Scan and redeem passes | Yes | Yes |
| Browse and generate passes | Yes | No |
| Change ticket capacity | Yes | No |
| Email and invalidate passes | Yes | No |
| Upload photos and synchronize media | Yes | No |

Successful login sets `hall_pass_session`, an HTTP-only cookie with SameSite Lax, a 12-hour lifetime, and the Secure flag in production. Its payload contains user ID, email, role, and issue time, authenticated with an HMAC-SHA256 signature using `AUTH_COOKIE_SECRET`. The payload is encoded, not encrypted.

Authenticated administrators normally land on `/admin/passes`; bouncers land on `/scanner`. Login can honor a local `next` path; paths beginning with `//` or lacking an initial slash are rejected. Media and scanner redirects preserve their destination this way. Logout expires the cookie and returns to login.

The private header shows the signed-in email and role label. Administrators see Passes, Media, and Scanner links; security users see Scanner.

Authorization uses the role embedded in the cookie. Protected requests do not reload the user record, so changing a database role or password does not immediately update or revoke an existing session. There is no server-side session registry, explicit revocation, login rate limiter, or multifactor flow implemented in this repository.

Sources: `src/lib/auth.ts`, `src/lib/users.ts`, `app/api/auth/`, `app/admin/login/page.tsx`, `src/components/admin/LoginForm.tsx`, `src/components/auth/AuthHeader.tsx`.

## Hall-pass administration

### Creating passes

The dashboard supports a single pass or a batch of up to **100 passes**. It initially selects bulk generation, a count of five, and email delivery. Names are optional: blank names are stored as null and displayed as Guest. Bulk names can be separated by commas or newlines. The batch size is the larger of the entered count and the number of supplied names, using those names in order and blank names for remaining positions. For example, entering five passes with two names creates five passes, while entering five with seven names creates seven.

The administrator must choose who the invitation is from. Current UI choices are Adeola, Joshua, Adeola’s dad, Adeola’s mum, Anu, Ayo, and David. Stored values for the first four are `Ade`, `Joshua`, `dad`, and `mum`. The API requires a nonempty inviter string but does not enforce that it comes from this list.

Every pass receives a UUID, a unique sequence-generated ticket number, and a random code in the shape `HP-XXXX-XXXX`. The code uses uppercase letters and digits while omitting visually ambiguous characters. Ticket numbers are displayed with at least three digits, such as Ticket #001. Database sequences can have gaps; invalidation does not reuse ticket numbers.

Creation records the administrator’s email and creation time. Batches run in a database transaction: either the requested passes are committed together or creation rolls back. Token collisions are retried up to five times for each pass.

After creation, the first pass appears in the preview, the list refreshes to the active first page, and the creation form returns to its defaults. Other passes in the batch are accessible through the table.

### Ticket limit

Administrators can set a total ticket limit to a non-negative integer or leave it blank for unlimited issuance. The dashboard displays the configured limit and remaining availability.

Capacity counts every pass whose `invalidated_at` is null, including passes already used at entry. Redemption therefore does not free issuance capacity. Invalidating a pass does free capacity. With a finite limit, a batch larger than the remaining allowance is rejected in full with HTTP 409.

During creation, the database locks the singleton settings row before counting active passes and inserting the batch. This coordinates concurrent issuance against the configured cap. A zero limit blocks issuance. Reducing a limit below the existing active count leaves existing passes intact and clamps remaining availability to zero.

### Listing and statistics

The server supplies the first 50 active passes when the page loads. Administrators can switch between Active and Invalidated tabs, search guest names case-insensitively, and filter active passes to unused, used, or all statuses. Search updates after a debounce. Page-size choices are 25, 50, 100, and 200, and records are ordered newest first.

“Active” means not invalidated; an active pass can already be used. The dashboard displays total active and invalidated counts, pagination controls, and invitation-source totals. Source totals count all non-invalidated passes, including used passes, and group missing sources as Unassigned. They are not totals limited to the current search results.

Rows expose ticket/guest information, status, email status, and actions to view, email, and individually invalidate eligible passes. Preview details include the QR token, inviter, delivery information, and invalidation information when applicable.

### Preview, download, and print

The ticket preview combines `/invitation.jpg`, wedding branding, guest name, the fixed wedding date, ticket number, status, readable token, and QR code. The QR contains the raw token, not a web verification URL.

Download creates a PNG in the browser using canvas. Print opens a separate browser window containing the ticket image. These operations do not redeem the ticket. The generated image includes an invalidation watermark when appropriate. If the invitation image cannot be loaded, rendering has a fallback background.

The email workflow separately generates a one-page PDF on the server with `pdf-lib` and `qrcode`. Email PDFs are 850 × 400 points and use standard embedded fonts, invitation artwork when available, and the token’s QR code. The on-screen download is PNG; there is no separate public PDF-download endpoint.

### Email delivery

Administrators can choose Generate only or Generate and email. Email delivery requires one valid recipient address and allows a custom message. Every pass in a batch goes to that same address; the app does not pair guest names with separate email addresses.

The server creates a separate PDF attachment for each pass and sends batches of up to **10 attachments per email**. Thus a 100-pass request can send ten emails to one recipient. Emails contain plain text and HTML, guest names, ticket numbers, and tokens; custom text is escaped for HTML. Maileroo tracking is disabled.

Pass creation commits before email delivery begins. An email failure does not delete or invalidate the new tickets. Each completed or failed email batch updates the affected passes’ recipient, status, and error fields, and the dashboard can report partial failure. Administrators can send or resend one existing pass from its row or preview, changing the recipient and message. The endpoint falls back to the previously stored recipient when none is supplied.

Delivery state is `not_sent`, `sent`, or `failed`. “Sent” reflects a successful Maileroo API response, not proof of inbox receipt, opening, or attachment download. There is no delivery webhook, background queue, automatic retry, or per-attempt email history. A failed resend preserves the previous successful send timestamp while changing the status to failed. The email endpoint does not reject a used or invalidated pass solely because of its pass status.

### Invalidation

Individual invalidation requires an administrator confirmation in the interface. It records the invalidation timestamp and administrator email without deleting the pass. Repeated invalidation preserves the original values. Future scans return invalid, and the pass moves into the Invalidated tab. There is no restore, un-redeem, or pass deletion workflow.

Bulk invalidation is **disabled in the dashboard**: its handler only closes the dialog and performs no API call. However, `POST /api/passes/invalidate-all` remains implemented and authorized for administrators. That endpoint invalidates all currently non-invalidated passes, including used passes, and returns the affected records and updated availability. The interface’s disabled behavior does not disable the server capability.

Sources: `src/components/admin/PassDashboard.tsx`, `src/lib/hallPasses.ts`, `src/lib/hallPassPaging.ts`, `src/lib/passPdf.ts`, `src/lib/passEmail.ts`, `src/lib/maileroo.ts`, `app/api/passes/`, `app/api/ticket-settings/route.ts`.

## Entry scanning and redemption

Security staff open `/scanner` and choose Scan QR to start the camera. The app requests the rear-facing camera, scans at ten frames per second, and uses a 250 × 250 QR scan box. It loads the scanner library only when needed. Camera use needs browser permission and a secure context; the interface directs users to HTTPS or manual entry when camera startup fails.

Once a code is decoded, the camera stops and the token is submitted. A guard prevents repeated callbacks for that camera session. The result panel displays ticket number, guest name, and use time when available, with a large status indicator:

| Result | Meaning | Database effect |
| --- | --- | --- |
| `valid` | First successful use of a non-invalidated pass | Records `used_at` and the scanner’s email |
| `used` | The pass has already been redeemed | Preserves the first redemption |
| `invalid` | Unknown or invalidated pass | Does not admit or redeem it |

**Verification consumes an unused pass immediately.** Both camera scans and the manual Verify Pass button call the redemption API; there is no read-only validity check or second confirmation before marking it used.

Manual entry provides three structured fields for the prefix and two four-character code sections. Fields normalize to uppercase alphanumeric characters and support pasting a complete token. A toggle allows entering a raw QR value instead. The API also extracts tokens from URLs containing `/verify/<token>` or from the last slash-separated segment. This parsing support does not create a public `/verify` page.

The PostgreSQL `redeem_hall_pass` function atomically updates an unused, non-invalidated row. Concurrent scans cannot both successfully redeem the same pass. An invalidated pass returns invalid even if it was previously used. Every completed API redemption result is subsequently logged to `scan_attempts`, including unknown codes; empty submissions to the API are logged with token `EMPTY`.

The logging insert happens after redemption and is not in the same transaction. If logging fails after a successful redemption, the pass can already be used even though the request fails. The repository includes a recent-scan query helper but does not expose a scan-history page or reporting API.

Scan Next clears the result and reopens the camera. Cancel Scan stops the camera and clears the result/input state. Camera cleanup also runs when the component unmounts. There is no offline redemption or synchronization mode; checking a ticket requires the server and database.

Sources: `src/components/scanner/HallPassScanner.tsx`, `app/scanner/page.tsx`, `app/api/passes/redeem/route.ts`, `src/lib/hallPasses.ts`, `db/migrations/008_add_ticket_numbers.sql`.

## Media administration

Administrators choose a collection and a local folder on `/admin/media/images`. The default category is Traditional Marriage. The browser accepts JPEG, PNG, and WebP files; unsupported files are excluded from the queue. Folder selection depends on the browser’s directory-picker support.

For each selected image, the browser preserves its orientation, scales it to fit within 3200 × 3200 without enlarging it, flattens transparency onto white, and exports JPEG. It starts at quality 0.9 and can lower quality through 0.85, 0.8, and 0.75 to keep output at or below 18 MiB. Files still above the limit fail individually. Originals on the user’s device are not modified.

The app obtains a server-generated Cloudinary signature for the selected folder. The browser receives the cloud name, API key, signature, and signed parameters, but not the API secret. It then uploads the processed images directly to Cloudinary, one at a time. Original basenames become JPEG filenames; Cloudinary is asked to use filenames and generate unique names.

The queue tracks queued, processing, uploading, complete, and error states, upload progress, output size, and individual errors. An error on one file does not stop the remaining files. Running upload again skips completed queue items and attempts the others again. There is no persisted queue across reloads or cancellation control during the batch.

After any successful uploads, the app requests public-gallery cache invalidation. Sync public gallery also lets an administrator invalidate the cache manually, which is needed after external edits or uploads. The interface does not manage asset tags, captions, deletion, or existing files.

Videos are uploaded outside the app through the R2 dashboard into the expected prefixes, then made visible through synchronization. The repository contains video filename/size helpers, but no implemented browser video-upload page or R2 upload API. Featured photo tags likewise need to be edited outside this interface.

Sources: `src/components/admin/CloudinaryImageUploader.tsx`, `app/api/media/cloudinary-signature/route.ts`, `app/api/media/revalidate/route.ts`, `README.md`.

## API reference

All API paths are relative to the site origin. Unauthorized protected calls generally return HTTP 401, including calls from authenticated users whose role is not allowed.

| Method and path | Access | Purpose and principal inputs |
| --- | --- | --- |
| `POST /api/auth/login` | Public | Accepts `email`, `password`; sets session cookie |
| `POST /api/auth/logout` | Public | Expires session cookie |
| `GET /api/auth/session` | Public | Returns authenticated flag, email, and role |
| `GET /api/passes` | Admin | Query: `page`, `limit`, `tab`, `status`, `search`; returns passes, pagination, counts, availability, and inviter totals |
| `POST /api/passes` | Admin | Accepts `guestName` or `guestNames`, `inviteFrom`, and optional `delivery` with `sendEmail`, `recipientEmail`, `message` |
| `POST /api/passes/[id]/email` | Admin | Sends a PDF for an existing pass; accepts `recipientEmail` and `message` |
| `POST /api/passes/[id]/invalidate` | Admin | Invalidates one pass and returns updated availability |
| `POST /api/passes/invalidate-all` | Admin | Invalidates all non-invalidated passes; dashboard does not invoke it |
| `POST /api/passes/redeem` | Admin or security | Accepts `value`; redeems the parsed token and logs the result |
| `GET /api/ticket-settings` | Admin | Returns ticket limit, active issued count, and remaining count |
| `PUT /api/ticket-settings` | Admin | Accepts `ticketLimit`, a non-negative integer or null for unlimited |
| `POST /api/media/cloudinary-signature` | Admin | Accepts photo `category`; returns signed Cloudinary upload parameters |
| `POST /api/media/revalidate` | Admin | Invalidates photo/video caches and the gallery path |

Creation returns the first `pass`, the complete `passes` array, its raw `qrValue`, ticket availability, and optional email-delivery results. Capacity failures return 409; email resend failures return 502 with the updated failed-delivery pass; unknown pass IDs return 404 on the email and individual-invalidation routes. Error handling varies by endpoint, and some database or malformed-input errors fall through to Next.js server errors rather than a tailored JSON response.

## Persistent data

| Table | Stored information |
| --- | --- |
| `app_users` | UUID, email, bcrypt password hash, role, created and updated timestamps |
| `hall_passes` | UUID, unique ticket number and token, guest name, inviter, creator/time, redeemer/time, invalidator/time, and latest email-delivery state |
| `scan_attempts` | UUID, optional pass reference, scanned token, scanner email, result, scan time |
| `ticket_settings` | A single row holding the nullable ticket limit, updater, and update time |
| `schema_migrations` | Applied SQL filenames and timestamps |

Pass creation, use, and invalidation actors are stored as email text rather than foreign keys to user records. Scan attempts reference pass UUIDs with `ON DELETE SET NULL`. Tokens and ticket numbers have uniqueness constraints; email status and scan result have constrained values. PostgreSQL stores event timestamps with time zones.

Ten ordered SQL migration files build the schema and evolve redemption, invalidation, capacity, inviter, ticket-number, and email support. Earlier files contain older versions of database functions; the migration sequence defines the final schema. Current batch creation uses TypeScript transactions and inserts rather than the legacy `create_hall_pass_if_available` function still defined by migrations.

There is no database table for announcement content, gallery captions, collection definitions, RSVPs, gifts, or payments. Those features are either static in code, external media metadata, or absent.

Sources: `db/migrations/`, `src/lib/hallPasses.ts`, `src/lib/users.ts`, `scripts/migrate.mjs`.

## Configuration and maintenance commands

| Environment variable | Used for |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection for users, passes, scans, and settings |
| `AUTH_COOKIE_SECRET` | Signing and verifying staff sessions |
| `PGSSLMODE` | Optional `require` setting for database SSL |
| `MAILEROO_API_KEY` | Email API authorization |
| `MAILEROO_FROM_EMAIL` | Sender address; README specifies a verified Maileroo domain |
| `MAILEROO_FROM_NAME` | Optional sender name, defaulting to Adeola & Joshua |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account |
| `CLOUDINARY_API_KEY` | Photo search and upload authorization |
| `CLOUDINARY_API_SECRET` | Server-only search credentials and upload signature secret |
| `R2_ACCOUNT_ID` | R2 S3 endpoint account |
| `R2_ACCESS_KEY_ID` | R2 listing credentials |
| `R2_SECRET_ACCESS_KEY` | R2 listing credentials |
| `R2_BUCKET_NAME` | Video bucket |
| `R2_PUBLIC_URL` | Public video-serving domain or bucket URL |

The database pool is reused through a global variable. SSL is enabled when the connection string includes `sslmode=require` or `PGSSLMODE=require`; this configuration disables certificate verification. Gallery credentials and database access execute on the server. Browser uploads use signed parameters.

| Command | Current behavior |
| --- | --- |
| `npm run dev` | Starts Next.js development with webpack |
| `npm run dev-host` | Starts development on `0.0.0.0` |
| `npm run build` | Builds Next.js with webpack |
| `npm run preview` | Starts the production server from a build |
| `npm run lint` | Runs ESLint over the repository |
| `npm run db:migrate` | Applies unapplied SQL files in filename order in one transaction |
| `npm run user:create` | Prompts for staff credentials and role, then creates or updates the user |
| `npm run media:process-images` | Creates optimized local JPEG copies for later upload |

The user-creation script lowercases email addresses, hashes passwords with bcrypt cost 12, and updates the password and role when that email already exists. Role aliases such as `admin` map to `super_admin`; `security_admin` and `security` map to `bouncer`. These README-facing aliases are not additional stored roles.

The image-processing script recursively reads `~/Documents/wedding/trad` by default and writes to the sibling `trad-optimized` directory, retaining relative subfolders. It supports JPEG, PNG, WebP, and HEIC inputs, subject to installed decoder support. Three workers rotate, resize, flatten, convert to sRGB, and produce progressive JPEGs at up to 3200 × 3200 and 18 MiB. Existing outputs are skipped unless `--force` is supplied. A custom input path is supported. The script prepares files; it does not upload them.

The repository has no test script or automated test suite. Its Next.js configuration allows a specific development origin, `192.168.0.8`, and permits Cloudinary remote images. There is no deployment configuration proving which hosting environment currently runs the app.

Sources: `package.json`, `.env.example`, `next.config.ts`, `src/lib/db.ts`, `scripts/`, `README.md`.

## Presentation and current limitations

The shared theme uses burgundy, rose, cream, champagne, and brown tones, with Great Vibes headings, Cormorant subheadings, and Lora body text loaded from Google Fonts. The gallery has separate responsive styling and reduced-motion handling. Comparable reduced-motion handling is not implemented for the homepage’s repeating petal animation or update-story motion.

The date helper formats dates and times in **Europe/London**, regardless of a visitor’s location or the wedding’s Lagos location. This affects displayed creation, use, delivery, and invalidation times. The gallery’s item-year extraction uses JavaScript date handling rather than this helper.

The current product boundaries are:

- Guests can browse public content, but cannot RSVP, purchase tickets, request a hall pass, register, or contribute media through the app.
- Administrators issue passes; guests receive printable images or emailed PDFs. There is no guest ticket wallet or public verification page.
- Passes support one successful admission. There is no re-entry, expiry date, guest-count entitlement, seat assignment, or check-out state.
- Announcements, wedding details, collection definitions, and invitation-source options require code edits. Media files and featured tags are managed partly through external services.
- Pass browsing is refreshed through requests and mutations, with no live subscription to another scanner’s activity. Scan logs exist in the database but have no current UI.
- Email delivery is synchronous and records only the latest delivery state. Media upload progress and queue state exist only in the current browser session.
- The vendor route is a placeholder, the generic update-by-ID view is unmounted, and bulk invalidation remains available only through its implemented API rather than its dashboard handler.

These boundaries describe the present implementation, rather than proposed features.
