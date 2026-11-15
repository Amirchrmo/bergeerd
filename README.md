# Bergeerd — multi-branch menu, admin panel & API

The public menu site (bergeerd.ir), its admin panel and the REST API behind
them. Every **branch** (restaurant location) has its own menu, prices, design
and page address, all managed from one admin panel and served by one
deployment.

| URL | Shows |
| --- | --- |
| `bergeerd.ir/` | the **default branch** (Ardabil): what the printed QR codes open |
| `bergeerd.ir/<slug>` | any other active branch, e.g. `bergeerd.ir/tehran` |
| `bergeerd.ir/admin/` | admin panel |
| `bergeerd.ir/api/…` | REST API |

```
 bergeerd_menu (React)            bergeerd_admin (React)
 /, /<slug>                       /admin/
   │ GET /api/branches/<slug>/menu   │ /api/admin/* (JWT)
   └──────────────┬──────────────────┘
                  ▼
           bergeerd_api (Go, Gin)
             │            │
         MongoDB        MinIO (photos)
       db: bergeerd     bucket: bergeerd
```

## Repository layout

| Folder | What it is |
| --- | --- |
| `bergeerd_api/` | Go (Gin) REST API: branches, categories, items, auth, image upload |
| `bergeerd_admin/` | Admin panel (React + Vite + Tailwind) |
| `bergeerd_menu/` | Public website (React + Vite + Tailwind): shared data core + one *theme* per design |
| `deploy/` | Deploy/rollback scripts and copies of the server's compose and nginx config |

## How branches work

**Data.** `branches` holds each location: `slug` (its URL), `name`, `theme`
(which website design it uses), contact details (address, phone, hours, map
links, Instagram), `is_active`, and `is_default` (exactly one: the branch at
the site root). `categories` and `menu_items` carry a `branch_id`, so names,
photos and prices are fully independent per branch. Category slugs are unique
per branch, so every branch can have its own `burgers`.

**Opening a new location.** In the admin panel, *Branches → Add branch*, pick
"copy the menu of …" and a design. The new branch starts as a copy of that
menu; then change its prices and items. Copies share photo files; a photo is
only deleted from storage once no item in any branch uses it.

**Rules.** The default branch cannot be deleted or deactivated (it is what the
QR codes show). Deleting another branch deletes its categories and items.
Deactivating a branch hides its page (404) without losing data. Slugs that the
server routes elsewhere (`admin`, `api`, `assets`, `health`,
`bergeerd-minio`, `default`) are rejected.

**Upgrading an existing database.** On every start the API runs an idempotent
migration (`repository.MigrateToBranches`): it creates the default branch
(Ardabil, with the contact details the site showed) if there is none, attaches
all categories and items without a branch to it, and replaces the old indexes.
The existing menu keeps being served at `/` unchanged.

## Website designs (themes)

`bergeerd_menu/src/themes/` holds one folder per design. Each branch picks one
with its `theme` key, and each design is a separate chunk, so a visitor only
downloads the design of the branch they open.

| Key | Design | Used by |
| --- | --- | --- |
| `ember` | the original dark, cinematic, motion-heavy design | Ardabil (`/`) |
| `paper` | light printed-menu design: awning masthead, receipt-style list, dish sheet | Tehran |

Everything that is not design lives in `src/core/` and is shared: loading a
branch (`useBranchMenu`), URL → branch resolution, the offline fallback, types
and formatting. A theme is just a component that receives `{ branch, sections }`.
The site root also renders a static copy of the Ardabil menu
(`core/fallback.ts`) instantly while the API loads, and keeps showing it if the
API is unreachable, so a scanned QR code always opens a menu.

**Adding a design:** create `src/themes/<key>/index.tsx` (default export taking
`ThemeProps`), register it in `src/themes/index.ts`, add the key to `THEMES` in
`bergeerd_admin/src/types.ts`, deploy, then select it for a branch. Theme
colours override the default tokens under `html[data-theme="<key>"]` (see
`themes/paper/paper.css`).

## API

Public (no auth, never cached):

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/health` | `{"status":"ok"}` |
| GET | `/api/branches/:slug/menu` | `{"data":{"branch":{…},"sections":[…]}}`; `:slug` = `default` for the root branch; 404 for unknown/inactive |
| GET | `/api/menu` | the default branch's `sections` (the original response shape, kept for old clients) |

A section is `{ "category", "title", "order", "items": [ … ] }`: active
categories in order, each with its active items in order.

Admin (`Authorization: Bearer <jwt>` from `POST /api/auth/login`):

| Method | Path | Notes |
| --- | --- | --- |
| GET, POST | `/api/admin/branches` | POST accepts `copy_from: "<branch id>"` |
| GET, PUT, DELETE | `/api/admin/branches/:id` | default branch: no DELETE (409), no deactivation |
| GET, POST | `/api/admin/menu` | `?branch_id=` / body `branch_id`; omitted = default branch |
| GET, PUT, DELETE | `/api/admin/menu/:id` | |
| GET, POST | `/api/admin/categories` | `?branch_id=` / body `branch_id`; omitted = default branch |
| GET, PUT, DELETE | `/api/admin/categories/:id` | |
| POST | `/api/admin/upload` | multipart field `image`, max 10 MB, returns `{url,…}` |

Invalid input returns `400 {"error":"validation failed","fields":{…}}`.

## Local development

Prerequisites: Go 1.22+, Node 18+, and MongoDB + MinIO on `localhost:27017` /
`localhost:9000` (`dev-up.sh` expects the Docker containers `sansyar-mongo`
and `sansyar-minio`).

```bash
cp bergeerd_api/.env.example bergeerd_api/.env       # set JWT_SECRET (openssl rand -base64 48)
cp bergeerd_admin/.env.example bergeerd_admin/.env
cp bergeerd_menu/.env.example bergeerd_menu/.env
(cd bergeerd_admin && npm ci) && (cd bergeerd_menu && npm ci)
./dev-up.sh      # API :8080, admin :5173, website :3000 (./dev-down.sh stops them)
```

On an empty database the API seeds the default branch, its categories, an
admin user (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) and, with `SEED_MENU=true`,
the menu (photos uploaded from `SEED_IMAGES_DIR`, which `dev-up.sh` points at
`bergeerd_menu/src/assets`). Create a second branch in the admin panel and
open `http://localhost:3000/<slug>`.

Checks:

```bash
cd bergeerd_api && go vet ./... && go test ./...
#   integration tests (throwaway database):
#   BERGEERD_TEST_MONGO_URI=mongodb://localhost:27017 go test ./...
cd bergeerd_admin && npm run build
cd bergeerd_menu && npm run typecheck && npm run lint && npm run build
```

## Production

Server: Arisan-Srv (`arisan@109.122.254.194`), stack in `/opt/bergeerd`
(`deploy/docker-compose.yml`): `bergeerd-api` and `bergeerd-nginx`, on the
shared `data-net` (MongoDB `mongo`, MinIO `minio` from `/opt/infra`) and
`proxy-net` (the `edge` proxy, behind the ParsPack CDN). `bergeerd-nginx`
(`deploy/nginx/default.conf`) serves the website from `web/`, the admin panel
from `web/admin/`, proxies `/api/` and the photos at `/bergeerd-minio/`.
Branch pages need no nginx change: any unknown path falls back to the
website's `index.html`, which reads the branch from the URL.

```bash
deploy/deploy.sh api      # 1st: Go binary → /opt/bergeerd/api, rebuild container, health check
deploy/deploy.sh admin    # 2nd: admin panel → web/admin/
deploy/deploy.sh menu     # 3rd: website → web/ (snapshots the live site first)
deploy/rollback.sh        # restore the previous website snapshot (--list to choose)
```

Order matters when a change spans the API and the frontends: the new API
keeps serving the previous admin panel and website, not the other way round.

Rolling back the **API** (`cp bergeerd-api.prev bergeerd-api && docker compose
up -d --build api` in `/opt/bergeerd/api`) is safe only until a second branch
has categories: the pre-branch API recreates the global unique category-slug
index and refuses to start once two branches share a slug, and it would show
all branches' items at `/`.

Production API environment (`/opt/bergeerd/api.env`): `APP_ENV=production`,
`JWT_SECRET`, `ADMIN_USERNAME`/`ADMIN_PASSWORD`, `SEED_MENU=false`,
`MONGO_URI=mongodb://mongo:27017`, `MONGO_DATABASE=bergeerd`,
`MINIO_ENDPOINT=minio:9000`, MinIO credentials, `MINIO_BUCKET=bergeerd`,
`MINIO_PUBLIC_URL=https://bergeerd.ir/bergeerd-minio`,
`CORS_ORIGINS=https://bergeerd.ir,https://www.bergeerd.ir`.

## Security notes

- Use a strong `JWT_SECRET` and change the default admin password.
- MongoDB runs without auth and is reachable only on the internal `data-net`.
- The MinIO bucket allows anonymous reads (the website loads photos directly);
  writes need the credentials in `/opt/infra/.env`.
- Map embeds and links must be `https://` URLs (validated by the API).
