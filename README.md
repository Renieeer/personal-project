# Portfolio

A personal portfolio with a public site and an admin panel.

- **client/**: React (Vite) + React Router, plain CSS
- **server/**: Node.js + Express API
- **api/**: runs the Express API as a Vercel function
- **supabase/**: Postgres schema, Row Level Security, Storage buckets and seed data

It deploys to Vercel as one project (site and API together). See [Deploy to Vercel](#deploy-to-vercel).

All content (including section headings) lives in Supabase and starts as sample content for a fictional developer. Replace it from the admin panel at `/admin`.

## How it fits together

| Action | Path |
| --- | --- |
| Public pages read content | Browser → Supabase directly, with the **anon key**. RLS returns only visible rows. |
| Contact form | Browser → `POST /api/contact` → Supabase (`messages` table) |
| Admin sign-in | Browser → Supabase Auth (email + password) |
| Admin reads and writes | Browser → `/api/admin/*` with the user's JWT → Express verifies it → Supabase with the **service role key** |
| Admin uploads | Browser asks the API for a one-time upload URL → uploads the file straight to the private `uploads` bucket → the API checks it and moves it into place |

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
  app.js               App setup, CORS, error handling
  index.js             Runs app.js as a server (local, Render, ...)
  routes/              public, admin, generic CRUD, sections, messages, stats, account
  middleware/          auth (JWT + admin email), upload (type/size/magic bytes), rateLimit
  lib/supabase.js      Service-role Supabase client
api/index.js           Runs server/app.js as a Vercel function
vercel.json            Vercel build, /api routing and page fallback
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

1. Paste the contents of `supabase/migrations.sql` and click **Run**. This creates all tables, RLS policies and the storage buckets: four public ones (`avatars`, `projects`, `certificates`, `documents`) and the private `uploads` bucket that admin uploads pass through. It is safe to run again.
2. Open a new query, paste `supabase/seed.sql` and click **Run**. This fills every table with sample content.

> `seed.sql` empties the content tables (including messages) before inserting. Run it only on a fresh project.

**Already set up?** After updating the code, run `supabase/migrations.sql` again (it is safe to re-run and keeps your content). It adds:

- the `ui_text` table that stores your button and label texts. Until then the site shows the default texts and the live editor says they can't be edited yet.
- the private `uploads` bucket. Until then, uploading a photo, CV or favicon says the bucket is missing.

Do not re-run `seed.sql`: it replaces your content with the sample content.

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

Files don't pass through the API itself, because hosts like Vercel reject requests over 4.5 MB. Instead:

1. The browser asks `POST /api/admin/uploads` (admin only) for a one-time upload URL in the private `uploads` bucket.
2. It uploads the file there directly.
3. It sends the API the file's path. The API downloads it, checks it, copies it to the right public bucket and deletes the staged copy. Staged files nobody used are deleted after a day.

Every file is checked on the server:

| Kind | Types | Max size | Bucket |
| --- | --- | --- | --- |
| Images (photos, thumbnails, gallery, certificates) | JPG, PNG, WebP, GIF | 5 MB | `avatars`, `projects`, `certificates` |
| CV | PDF | 10 MB | `documents` |
| Favicon | PNG, ICO | 1 MB | `documents` |

The server checks the file type, size and the file's actual bytes, and saves each file under a unique name (`<table>/<timestamp>-<uuid>.<ext>`). When a file is replaced or its record is deleted, the old file is removed from storage. Deleting a project also removes its gallery images.

## Security model

- RLS is enabled on every table.
  - `anon` and `authenticated` can `SELECT` only rows where `is_visible = true`. Skills and gallery images also require a visible parent. `profile`, `settings` and `ui_text` are readable.
  - They can `INSERT` into `messages` only, and cannot read messages.
  - No other policies exist, so every other write is denied unless it uses the service role (the API).
- The four content buckets are public for reading. There are no write policies, so only the API can upload or delete. The `uploads` bucket is private: the browser can only put a file at a path the API signed for the signed-in admin.
- Every `/api/admin/*` request verifies the Supabase JWT with `auth.getUser()` and requires the email to match `ADMIN_EMAIL`.
- The contact form is validated server-side, rate limited to 5 messages per 10 minutes per IP, and has a honeypot field.

## Deploy to Vercel

One Vercel project serves the site and runs the API as a function (`api/index.js`). `vercel.json` sets the build and sends `/api/*` to the function and every other path to the site, so links like `/admin` and `/projects/...` work when opened directly.

1. Run `supabase/migrations.sql` first (see [step 2](#2-run-the-sql)). Admin uploads need its `uploads` bucket.
2. On <https://vercel.com/new>, import the GitHub repository.
3. **Root Directory**: leave it as the repository root (`./`). Don't pick `client`, or the API won't be deployed. **Framework Preset**: Other. Leave the build, output and install settings alone; `vercel.json` sets them.
4. **Environment Variables**: add these five. They are the same values as in your two `.env` files.

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `ADMIN_EMAIL` | Email of your admin user |
   | `VITE_SUPABASE_URL` | Project URL (same as `SUPABASE_URL`) |
   | `VITE_SUPABASE_ANON_KEY` | anon public key |

   Leave out `VITE_API_URL`, `CLIENT_ORIGIN`, `SERVE_CLIENT`, `TRUST_PROXY` and `PORT`. The site and API share one domain, so they aren't needed.
5. Click **Deploy**.
6. Open `https://<your-project>.vercel.app/api/health`. It should show `{"ok":true}`. If you see the site or an error instead, check the Root Directory and the environment variables.
7. In Supabase, set **Authentication → URL Configuration → Site URL** to your Vercel URL.
8. Optional, for faster saving: in Vercel, open **Settings → Functions → Function Region** and pick the region closest to your Supabase project's region (Supabase: **Project Settings → General**). Each save in the admin makes several calls from the function to Supabase.

Every push to `main` redeploys. After changing an environment variable, redeploy (**Deployments → ⋯ → Redeploy**). The `VITE_*` values are built into the site.

On Vercel's free plan, the contact form's rate limit (kept in memory) is per function instance, so it is a soft limit there.

### Other hosts

- **One Node service** (Render, Railway, Fly.io): build `npm run install:all && npm run build`, start `npm start`. Set every variable from both `.env` files, plus `SERVE_CLIENT=true` and `TRUST_PROXY=true`, and leave `VITE_API_URL` empty. The API then serves the site.
- **Static client + separate API**: build the client from `client/` (output `dist`) with `VITE_API_URL=https://your-api.example.com`. Run the API from `server/` (`npm start`) with `CLIENT_ORIGIN=https://your-site.example.com` and `TRUST_PROXY=true`. The client needs a fallback that serves `index.html` for unknown paths (`client/public/_redirects` covers Netlify).

### After deploying

- Sign in at `/admin`, then replace the sample content, upload your photos and CV, and set your accent color and favicon.
- The seed images come from `picsum.photos` and the seed CV is a public sample PDF. Replace them by uploading your own files.
