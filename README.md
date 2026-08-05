# MangaKai

A manga platform built on MangaDex as its content source.

MangaDex owns manga, chapters, covers, authors and tags — those are fetched
live and never copied into our database. MangaKai owns everything else: users,
reading progress, banners, staff picks, and the rest of the platform layer.

## Architecture

```
apps/web  (Next.js) ─┐
                     ├─→ apps/api (Hono) ─→ MangaDex
apps/mobile (Expo) ──┘
```

Clients never call MangaDex directly. The API is the only thing that does, so
it can validate, cache, merge sources, and add MangaKai's own data behind one
consistent contract. If MangaDex changes, only `apps/api` and
`packages/mangadex` need touching.

| Package             | Responsibility                                     |
| ------------------- | -------------------------------------------------- |
| `packages/mangadex` | MangaDex wire format and HTTP calls                |
| `packages/shared`   | MangaKai's API contract, shared by API and clients |
| `packages/db`       | Drizzle schema and Postgres client                 |

## Getting started

```bash
pnpm install

# Postgres for MangaKai-owned data
docker run -d --name mangakai-postgres \
  -e POSTGRES_USER=mangakai -e POSTGRES_PASSWORD=mangakai -e POSTGRES_DB=mangakai \
  -p 5432:5432 postgres:17-alpine

cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env

pnpm --filter @mangakai/db db:migrate

pnpm dev
```

The API listens on `http://localhost:8787`, the site on
`http://localhost:3000`. The site proxies `/api/*` to the API via a rewrite in
`apps/web/next.config.ts`.

Changing the schema:

```bash
pnpm --filter @mangakai/db db:generate   # write a migration from schema.ts
pnpm --filter @mangakai/db db:migrate    # apply it
pnpm --filter @mangakai/db db:studio     # browse the data
```

## Admin API

Admin routes are gated by `ADMIN_TOKEN` from `apps/api/.env`. This is a
placeholder until real user accounts and roles land — the middleware in
`apps/api/src/middleware/admin.ts` is the only place that needs to change.

```bash
TOKEN="Bearer dev-admin-token"
```

### Banners

Creating a banner pushes it to every open browser tab over SSE, so it appears
without a refresh.

#### Every option

| Field       | Type                                  | Required | Default | Notes                                                          |
| ----------- | ------------------------------------- | -------- | ------- | -------------------------------------------------------------- |
| `title`     | string, 1–120 chars                   | **yes**  | —       | Trimmed. Empty or >120 is a 400.                               |
| `body`      | string \| null                        | no       | `null`  | The paragraph under the title. Trimmed, no empty string.       |
| `imageUrl`  | URL \| null                           | no       | `null`  | Shown as a banner image above the title. Must be a valid URL.  |
| `linkUrl`   | URL \| null                           | no       | `null`  | Turns the call-to-action button on. Must be a valid URL.       |
| `linkLabel` | string \| null                        | no       | `null`  | Button text. Falls back to `Learn more` when `linkUrl` is set. |
| `variant`   | `info` \| `announcement` \| `warning` | no       | `info`  | Controls colour and the pill label.                            |
| `active`    | boolean                               | no       | `true`  | Set `false` to retire a banner without deleting it.            |
| `startsAt`  | ISO 8601 datetime \| null             | no       | `null`  | Hidden until this moment. `null` means "already started".      |
| `endsAt`    | ISO 8601 datetime \| null             | no       | `null`  | Hidden after this moment. `null` means "never expires".        |

The response adds `id`, `createdAt` and `updatedAt`.

How each `variant` renders in the popup:

| `variant`      | Pill label   | Colour |
| -------------- | ------------ | ------ |
| `info`         | Notice       | Sky    |
| `announcement` | Announcement | Violet |
| `warning`      | Heads up     | Amber  |

A banner is live when **all** of these hold:

```
active === true
AND (startsAt is null OR startsAt <= now)
AND (endsAt   is null OR endsAt   >= now)
```

`GET /api/banners` returns only live banners, newest first. The site pops up
the newest one the visitor has not dismissed; dismissals are stored per browser
in `localStorage` under `mangakai:dismissed-banners`.

> **Dates must be ISO 8601 strings, not epoch numbers.** A bare number is read
> as milliseconds, so `1767225600` becomes 1970-01-21 and the banner goes live
> instantly instead of in 2026. Use `"2026-01-01T00:00:00Z"`.

#### Create

Minimal — every other field takes its default:

```bash
curl -X POST localhost:8787/admin/banners \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{"title": "Welcome to MangaKai"}'
```

Typical announcement with a button:

```bash
curl -X POST localhost:8787/admin/banners \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{
    "title": "Reading lists are here",
    "body": "Save what you are reading and pick it back up on mobile.",
    "variant": "announcement",
    "linkUrl": "https://mangakai.example/blog/reading-lists",
    "linkLabel": "Read the post"
  }'
```

Every option at once, scheduled for a future window:

```bash
curl -X POST localhost:8787/admin/banners \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{
    "title": "Scheduled maintenance",
    "body": "MangaKai will be read-only while we migrate the database.",
    "imageUrl": "https://mangakai.example/img/maintenance.png",
    "linkUrl": "https://status.mangakai.example",
    "linkLabel": "Status page",
    "variant": "warning",
    "active": true,
    "startsAt": "2026-09-01T22:00:00Z",
    "endsAt": "2026-09-02T02:00:00Z"
  }'
```

Draft one now, publish it later by flipping `active`:

```bash
curl -X POST localhost:8787/admin/banners \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{"title": "Not live yet", "active": false}'
```

#### List

```bash
# Live banners only — no auth needed, this is what visitors get
curl localhost:8787/api/banners

# Everything, including drafts, scheduled and expired
curl localhost:8787/admin/banners -H "authorization: $TOKEN"
```

The admin list is ordered live banners first, newest first within each group,
so `[0]` is the most recent live banner and drafts sit at the bottom.

#### Update

`PATCH` takes any subset of the create fields. An empty `{}` is rejected.

```bash
# Retire without deleting
curl -X PATCH localhost:8787/admin/banners/<id> \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{"active": false}'

# Publish a draft
curl -X PATCH localhost:8787/admin/banners/<id> \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{"active": true}'

# Reword and change severity together
curl -X PATCH localhost:8787/admin/banners/<id> \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{"title": "Maintenance finished", "variant": "info"}'

# Clear an optional field by sending null
curl -X PATCH localhost:8787/admin/banners/<id> \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{"linkUrl": null, "linkLabel": null}'

# Extend a scheduling window
curl -X PATCH localhost:8787/admin/banners/<id> \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{"endsAt": "2026-09-03T02:00:00Z"}'
```

#### Delete

```bash
curl -X DELETE localhost:8787/admin/banners/<id> -H "authorization: $TOKEN"
```

#### Grabbing an id

```bash
# Newest banner's id
curl -s localhost:8787/admin/banners -H "authorization: $TOKEN" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["id"])'
```

#### Responses

| Code  | When                                                |
| ----- | --------------------------------------------------- |
| `201` | Created. Body is the banner.                        |
| `200` | Updated or listed.                                  |
| `204` | Deleted. No body.                                   |
| `400` | Validation failed, or `PATCH` with an empty object. |
| `401` | Missing or wrong `Authorization` header.            |
| `404` | No banner with that id.                             |
| `503` | `ADMIN_TOKEN` is not set on the server.             |

Errors are always `{"error": "..."}`:

```json
{ "error": "title: Too big: expected string to have <=120 characters" }
{ "error": "variant: Invalid option: expected one of \"info\"|\"announcement\"|\"warning\"" }
{ "error": "Provide at least one field to update." }
```

#### Watching the live stream

Useful for confirming a POST really pushed. Leave this open in one terminal and
post from another:

```bash
curl -N localhost:8787/api/banners/stream
```

You get the full live set on connect, again on every change, and a `ping` every
25 seconds to hold the connection open.

### Staff picks

Stores a MangaDex manga id plus MangaKai's own note. The manga is fetched from
MangaDex at read time.

```bash
curl -X POST localhost:8787/admin/staff-picks \
  -H "authorization: $TOKEN" -H 'content-type: application/json' \
  -d '{
    "mangaId": "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0",
    "note": "The one that got everyone reading manhwa.",
    "position": 0
  }'

curl -X DELETE localhost:8787/admin/staff-picks/<mangaId> -H "authorization: $TOKEN"
```

## Public API

| Endpoint                   | Returns                                         |
| -------------------------- | ----------------------------------------------- |
| `GET /api/home`            | Banners, hero, staff picks and three manga rows |
| `GET /api/manga/search?q=` | Paginated search (`limit`, `offset`)            |
| `GET /api/manga/:id`       | Full manga detail                               |
| `GET /api/banners`         | Currently live banners                          |
| `GET /api/banners/stream`  | SSE feed of banner changes                      |
