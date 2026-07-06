# AGENTS.md

## Cursor Cloud specific instructions

This is a single, static client-side React SPA (Vite 7 + React 19 + TypeScript + Chakra UI) — a wedding "Save the Date" site. There is no backend, database, or environment variables/secrets. npm is the package manager (`package-lock.json`).

Standard commands live in `package.json` scripts:

- Dev server: `npm run dev` (Vite, serves at `http://localhost:5173/`). This is the primary dev workflow. Use `npm run dev-host` to expose on the network.
- Lint: `npm run lint`
- Build: `npm run build`
- Preview built output: `npm run preview`

Non-obvious caveats:

- `npm run dev` does NOT run `tsc`, so type errors do not block the dev server. `npm run build` runs `tsc -b` first, so type errors will fail the build even though the app runs fine in dev.
- As of this writing, `npm run build` fails on a pre-existing TypeScript error in `src/pages/VenueSelectedPage.tsx` (the `<iframe>` has duplicate/raw HTML attributes like `allowfullscreen` alongside the JSX `allowFullScreen`). This is a code bug, not an environment issue; `npm run dev` and `npm run lint` are unaffected.
