# Portfolio

A personal portfolio with a public site and an admin panel.

- **client/**: React (Vite) + React Router, plain CSS
- **server/**: Node.js + Express API
- **supabase/**: Postgres schema, Row Level Security, Storage buckets and seed data

All content (including section headings) lives in Supabase and starts as sample content for a fictional developer. Replace it from the admin panel at `/admin`.

## How it fits together

| Action | Path |
| --- | --- |
| Public pages read content | Browser → Supabase directly, with the **anon key**. RLS returns only visible rows. |
| Contact form | Browser → `POST /api/contact` → Supabase (`messages` table) |
| Admin sign-in | Browser → Supabase Auth (email + password) |
| Admin reads and writes, uploads | Browser → `/api/admin/*` with the user's JWT → Express verifies it → Supabase with the **service role key** |

The service role key exists only in `server/.env`. The browser never sees it.

```
client/
  src/pages/           Home, ProjectDetail, NotFound
  src/components/      Header, Footer, sections/*, Reveal, Skeleton, Lightbox
  src/admin/           Admin app: auth, layout, editors, pages
  src/admin/editor/    Live editor: the real site with in-place editing
  src/lib/edit.jsx     Editing hooks used by the site components (no-ops for visitors)
  src/lib/uiText.js    Default button/label texts and the useText() hook
  src/lib/supabase.js  Anon Supabase client
  src/lib/api.js       Fetch wrapper for the Express API
  src/styles/          base.css (tokens), site.css, admin.css
server/
  index.js             App setup, CORS, error handling
  routes/              public, admin, generic CRUD, sections, messages, stats, account
  middleware/          auth (JWT + admin email), upload (type/size/magic bytes), rateLimit
  lib/supabase.js      Service-role Supabase client
supabase/
  migrations.sql       Tables, RLS policies, storage buckets
  seed.sql             Sample content for every table
```

## Requirements

- Node.js 18 or newer (20 LTS recommended)
- A free Supabase account

## 1. Create the Supabase project

1. Go to <https://supabase.com/dashboard> and create a new project. Save the database password somewhere safe.
2. Wait for the project to finish provisioning.
3. Open **Project Settings → API** and note:
   - **Project URL**
   - **anon public** key
   - **service_role** key (secret)

## 2. Run the SQL

In the dashboard, open **SQL Editor → New query**, then:

1. Paste the contents of `supabase/migrations.sql` and click **Run**. This creates all tables, RLS policies and the four storage buckets (`avatars`, `projects`, `certificates`, `documents`). It is safe to run again.
2. Open a new query, paste `supabase/seed.sql` and click **Run**. This fills every table with sample content.

> `seed.sql` empties the content tables (including messages) before inserting. Run it only on a fresh project.

**Already set up?** After updating the code, run `supabase/migrations.sql` again (it is safe to re-run). It adds the `ui_text` table that stores your button and label texts. Until then the site shows the default texts and the live editor says they can't be edited yet. Do not re-run `seed.sql`.

## 3. Create the admin user

1. Open **Authentication → Users → Add user → Create new user**.
2. Enter your email and a strong password, and tick **Auto Confirm User**.
3. Turn off public sign-ups: **Authentication → Sign In / Providers → Email** (or **Authentication → Settings** on older dashboards). Disable **Allow new users to sign up**.

The API also checks that the signed-in email matches `ADMIN_EMAIL`. Another account, even if one got created, cannot use the admin API.

## 4. Environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**server/.env**

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `ADMIN_EMAIL` | Email of the admin user from step 3 |
| `PORT` | `3001` (default) |
| `CLIENT_ORIGIN` | Origin(s) of the client, comma separated. Only needed when client and API are on different domains. |
| `SERVE_CLIENT` | `true` to serve `client/dist` from the API (single-service deploys) |
| `TRUST_PROXY` | `true` behind a reverse proxy, so rate limiting sees real IPs |

**client/.env**

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |
| `VITE_API_URL` | Leave empty locally. Set it to the API's URL when the API is on another domain. |

## 5. Run locally

```bash
npm run install:all   # installs root, server and client dependencies
npm run dev           # API on :3001, site on :5173
```

Or run each part in its own terminal:

```bash
cd server && npm run dev
cd client && npm run dev
```

- Site: <http://localhost:5173>
- Admin: <http://localhost:5173/admin>

Vite proxies `/api` to `http://localhost:3001`, so no CORS setup is needed in development.

## Using the admin panel

The site has no visible link to the admin. Either go to `/admin`, or tap the **Dark mode / Light mode** toggle in the site header **5 times quickly** (each tap within a second of the last). That opens the sign-in page and puts the theme back the way it was. The hidden entrance only keeps the link out of sight. Your password and the server's `ADMIN_EMAIL` check are what protect the admin.

### Live editor (`/admin/editor`)

Your real site with everything editable in place. Changes show on the page immediately and are saved together when you click **Save** (or press Ctrl+S).

- **Text**: click any heading, paragraph, label or button text and type. Enter or clicking away keeps the change; Escape cancels it. Long texts (bio, descriptions) open as a text box where a blank line starts a new paragraph.
- **Dates, tags, links and other details**: click them (dotted underline) or use the pencil button to open the item's side panel.
- **Images and files**: hover an image and click **Replace image**. Remove files in the side panel.
- **Items** (projects, skills, experience, …): hover an item for its toolbar: drag handle, move up/down, show/hide, details, add after, duplicate, delete. On phones, tap **•••** on the item. **Add …** buttons sit under each list.
- **Sections**: the bar above each section moves it, hides it, or edits its heading and intro (the heading is also the menu label). Hidden and empty sections stay in the editor, dimmed and labelled, so you can bring them back.
- **Project pages**: pick one in the page menu at the top to edit it and its gallery.
- **Profile, Settings, Site text**: buttons in the top bar. **Site text** holds every button label, form label and message, including the ones you can't click (404 page, "Sending…").
- **Undo/redo**: Ctrl+Z / Ctrl+Shift+Z or the arrow buttons. **Discard** drops all unsaved changes (and can be undone too).
- If something can't be saved (for example a required field is empty), it stays unsaved and is marked on the page next to the field, with a **problems** button in the top bar.
- Leaving the editor asks first. Unsaved changes are kept until you close or reload the tab.

The form pages below still work, and each has an **Edit on the live page** button that opens the editor at the same spot.

- **Dashboard**: counts of projects, messages and unread messages, plus recent messages.
- **Inbox**: read messages (opening one marks it read), mark unread, reply by email, delete.
- **Profile & links**: name, title, intro, bio, contact details, profile photo, about photo, CV (PDF), social links.
- **Sections**: show or hide each home page section, rename its heading (also the menu label), edit its intro line and drag to reorder. A visible section with no content is not rendered.
- **Skills, Experience, Education, Projects, Certificates, Testimonials**: create, edit and delete items, drag to reorder (or use the arrow buttons), and toggle visibility per item. Projects also have a gallery manager with captions, ordering and visibility.
- **Settings**: site title, meta description, accent color, footer text, favicon.
- **Password**: change the admin password (requires the current one).

### Uploads

All uploads go through the API and are checked on the server:

| Kind | Types | Max size | Bucket |
| --- | --- | --- | --- |
| Images (photos, thumbnails, gallery, certificates) | JPG, PNG, WebP, GIF | 5 MB | `avatars`, `projects`, `certificates` |
| CV | PDF | 10 MB | `documents` |
| Favicon | PNG, ICO | 1 MB | `documents` |

The server checks both the declared MIME type and the file's actual bytes, and saves each file under a unique name (`<table>/<timestamp>-<uuid>.<ext>`). When a file is replaced or its record is deleted, the old file is removed from storage. Deleting a project also removes its gallery images.

## Security model

- RLS is enabled on every table.
  - `anon` and `authenticated` can `SELECT` only rows where `is_visible = true`. Skills and gallery images also require a visible parent. `profile`, `settings` and `ui_text` are readable.
  - They can `INSERT` into `messages` only, and cannot read messages.
  - No other policies exist, so every other write is denied unless it uses the service role (the API).
- Storage buckets are public for reading. There are no write policies, so only the API can upload or delete.
- Every `/api/admin/*` request verifies the Supabase JWT with `auth.getUser()` and requires the email to match `ADMIN_EMAIL`.
- The contact form is validated server-side, rate limited to 5 messages per 10 minutes per IP, and has a honeypot field.

## Deployment

The client is static files; the API is a small Node service. Two common setups:

### Option A: one service (simplest)

Deploy the whole repo to a Node host such as Render, Railway or Fly.io:

- **Build command:** `npm run install:all && npm run build`
- **Start command:** `npm start`
- **Environment:** every variable from both `.env` files. The `VITE_*` variables must be present at build time. Also set `SERVE_CLIENT=true` and `TRUST_PROXY=true`, and leave `VITE_API_URL` empty.

The API then serves the site and handles client-side routes (`/projects/...`, `/admin/...`).

### Option B: static client + separate API

- **Client** on Vercel, Netlify or Cloudflare Pages:
  - Root directory `client`, build `npm run build`, output `dist`.
  - Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_API_URL=https://your-api.example.com`.
  - SPA fallbacks are included: `client/vercel.json` for Vercel and `client/public/_redirects` for Netlify.
- **API** on Render, Railway or Fly.io:
  - Root directory `server`, start `npm start`.
  - Set the server variables, plus `CLIENT_ORIGIN=https://your-site.example.com` and `TRUST_PROXY=true`.

### After deploying

- In Supabase, set **Authentication → URL Configuration → Site URL** to your public site URL.
- Sign in at `/admin`, then replace the sample content, upload your photos and CV, and set your accent color and favicon.
- The seed images come from `picsum.photos` and the seed CV is a public sample PDF. Replace them by uploading your own files.
- The contact rate limiter keeps counts in memory. That is fine for a single instance; use a shared store if you run several.
