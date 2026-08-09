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
| `packages/cli`      | `pnpm banner` — the admin CLI                      |

## Getting started

```bash
pnpm install

cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env

pnpm db:up      # Postgres for MangaKai-owned data; creates the container first time
pnpm db:migrate

pnpm dev
```

`pnpm dev` and `pnpm dev:api` run `db:up` themselves, so you rarely need it
directly. It is worth knowing it exists because Codespaces stops containers
when it suspends: come back to a paused Codespace and the database is down, and
the API reports it as a failed Drizzle query with `ECONNREFUSED` buried at the
bottom of the stack.

| Command           | Does                                             |
| ----------------- | ------------------------------------------------ |
| `pnpm db:up`      | Start Postgres, waiting until it accepts queries |
| `pnpm db:down`    | Stop it; the data volume is kept                 |
| `pnpm db:migrate` | Apply pending migrations                         |
| `pnpm db:studio`  | Drizzle Studio                                   |

The API listens on `http://localhost:8787`, the site on
`http://localhost:3000`. The site proxies `/api/*` to the API via a rewrite in
`apps/web/next.config.ts`.

Changing the schema:

```bash
pnpm --filter @mangakai/db db:generate   # write a migration from schema.ts
pnpm --filter @mangakai/db db:migrate    # apply it
pnpm --filter @mangakai/db db:studio     # browse the data
```

## Mobile app

```bash
pnpm dev:mobile
```

Scan the QR code with **Expo Go**. No custom dev build is needed — nothing in
`apps/mobile/src` imports a native module that Expo Go does not already ship.

The app is pinned to **Expo SDK 54** (React Native 0.81, React 19.1) because
that is the SDK the App Store build of Expo Go supports. Expo Go ships one SDK
runtime per build, so this pin tracks the store app — moving the SDK ahead of
Expo Go stops the project opening on a real phone. Do not bump it just because
a newer SDK exists. Run `npx expo install --check` after touching dependencies
to confirm they still line up.

### Running it from a Codespace

`pnpm dev:mobile` detects Codespaces and handles this for you, but it is worth
knowing what it does, because the obvious approaches both fail:

- **LAN mode** (Expo's default) advertises the container's private IP. Your
  phone has no route to it.
- **`expo start --tunnel`** fails. It hardcodes Expo's _own_ ngrok account and
  their `exp.direct` domain (see `NGROK_CONFIG` in the CLI's `AsyncNgrok.js`),
  and that shared account is saturated: `ERR_NGROK_108`, "limited to 5000
  simultaneous ngrok agent sessions". Having your own ngrok account does not
  help here — `--tunnel` will never use it.

So we hand Expo a public URL ourselves via `EXPO_PACKAGER_PROXY_URL`, which
rewrites every URL Expo advertises — manifest, JS bundle, assets and the HMR
websocket — to that host instead of a LAN IP.
`apps/mobile/scripts/start-expo.sh` finds one, in this order:

1. `EXPO_PACKAGER_PROXY_URL` already exported — used as-is.
2. **A running ngrok agent** forwarding port `8081`. Found automatically by
   querying ngrok's local API on `127.0.0.1:4040`, so there is no URL to
   copy-paste. **Preferred:** port `8081` stays private.
3. **Codespaces port forwarding.** The fallback when no tunnel is running. This
   flips port `8081` to **public**, because Expo Go sends no GitHub credentials
   and a private forward answers it with a login page instead of the manifest.

Either way the script prints the URL in text as well, for **Enter URL manually**
in Expo Go if the QR will not scan.

### The ngrok route

Install the agent (no sudo needed — `~/.local/bin` is already on `PATH`):

```bash
curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | tar xz -C ~/.local/bin
ngrok config add-authtoken <your-token>
```

Then run the tunnel in its own terminal and start Metro normally:

```bash
ngrok http 8081 --url=https://<your-static-domain>.ngrok-free.dev   # terminal 1
pnpm dev:mobile                                                     # terminal 2
```

A free ngrok static domain keeps the URL stable across restarts. The agent
binary does not survive a Codespace rebuild (re-run the curl), but the
authtoken does — `~/.config` is persisted.

ngrok's free tier serves a browser-warning interstitial on requests that look
like a browser. Verified that this does **not** affect Expo Go: the manifest
comes back as `application/expo+json` and the full bundle downloads. If you ever
do hit it, the bypass is an `ngrok-skip-browser-warning` header, which Expo Go
does not send.

### Live banners

The mobile banner bar subscribes to `/api/banners/stream`, so `pnpm banner new`
shows up on the phone without a refresh — same as the web app.

React Native has no `EventSource`, and the built-in `fetch` buffers the whole
response, so it never resolves on an endpoint that stays open. `expo/fetch` is
the WinterCG fetch that exposes `response.body` as a `ReadableStream`, so
`src/hooks/use-live-banners.ts` reads the stream and parses the frames itself.
No extra dependency.

Unlike the web app there is no proxy in the way, so nothing here needs the
`compress: false` workaround that `apps/web` does. GitHub's port forwarding
passes the stream through unbuffered — verified with timestamped frames.

### Things to expect in a Codespace

- `An unknown error occurred while installing React Native DevTools`
  (`libgtk-3.so.0` missing) on every start. Harmless. That is the desktop
  debugger GUI, which cannot run in a headless container either way. Only the
  `j` shortcut is affected.
- If you fall back to the Codespaces route, port `8081` is **public** — anyone
  with the URL can load your dev bundle while the server runs. Stop Metro when
  you are done, or set the port back to private in the **Ports** panel.

### Reaching the API from your phone

`localhost` means the phone itself, so the app needs a public API URL. The
tunnel cannot carry it — a free ngrok account gets one domain, and that one is
already serving Metro. So the API goes over Codespaces port forwarding instead,
and port `8787` has to be **public**.

`scripts/start-expo.sh` does this for you. It is not a one-time setting, which
is the trap: `gh` can only change a port that is currently forwarded, and
Codespaces forwards a port fresh — private — whenever something starts
listening on it. So the API reverts to private every time you restart it, and
the app then receives GitHub's sign-in page instead of JSON:

```
Could not load MangaKai
JSON Parse error: Unexpected character: <
```

That `<` is the first character of `<!doctype html>`. If you see it, the API is
private (or not running). To fix it by hand:

```bash
gh codespace ports visibility 8787:public --codespace "$CODESPACE_NAME"
```

`scripts/start-expo.sh` also exports the matching URL:

```
EXPO_PUBLIC_API_URL=https://<codespace-name>-8787.app.github.dev
```

`src/lib/api.ts` reads it. Expo inlines `EXPO_PUBLIC_*` at build time, so
**changing it requires restarting Metro** — reloading the app is not enough.
Override it in `apps/mobile/.env` when you are not in a Codespace.

Note this exposes `/admin/*` to the internet, guarded only by `ADMIN_TOKEN`.
Use a real secret in `apps/api/.env` before doing it.

## Accounts

MangaKai owns its users outright — there is no third-party identity provider.
Email and password, hashed with scrypt from `node:crypto`, and sessions stored
in Postgres.

| Endpoint                  | Does                          |
| ------------------------- | ----------------------------- |
| `POST /api/auth/register` | Create an account and sign in |
| `POST /api/auth/login`    | Sign in                       |
| `POST /api/auth/logout`   | Revoke the current session    |
| `GET /api/auth/me`        | The signed-in user, or 401    |

They live under `/api/auth`, not `/auth`, because the web app reaches the API
through a rewrite that only forwards `/api/*`. Outside it the browser would be
making a cross-origin request and the session cookie would never be sent.

### Two clients, one set of routes

`register` and `login` set an httpOnly cookie **and** return the token in the
body. Each client uses the half it needs:

- **Web** keeps the cookie. Page JavaScript cannot read it, so an XSS bug
  cannot steal the session, and server components can read it during SSR — the
  header renders signed-in in the initial HTML rather than flipping after
  hydration.
- **Mobile** stores the token in `expo-secure-store` (iOS keychain / Android
  keystore) and sends `Authorization: Bearer`.

`apps/api/src/lib/session-cookie.ts` reads either, so no route needs
per-client handling.

### Sessions are rows, not signed tokens

A `sessions` row holds a **SHA-256 of the token**, never the token, so a leaked
database dump contains nothing that grants access. Deleting the row logs that
device out immediately — the reason for not using JWTs, which stay valid until
they expire no matter what the server thinks.

Sessions last 30 days. Expired rows are pruned on that user's next login, which
is the one moment their id is already at hand.

### Things that are deliberate

- **Login never says which half was wrong.** "Invalid email or password" covers
  both, and the no-such-user path still runs a real scrypt verify against a
  decoy hash — otherwise the response time reveals which addresses are
  registered. Measured: 39ms versus 36ms.
- **Emails are lowercased and trimmed before storage**, so `Ernie@x.com` and
  `ernie@x.com` cannot become two accounts. Registration relies on the unique
  index rather than a pre-check, which two simultaneous requests can both pass.
- **`?next=` only accepts same-site paths.** Without that check the login page
  is an open redirect, and `//evil.com` is a URL, so testing for a leading `/`
  alone is not enough.
- **scrypt parameters are stored inside each hash.** Raising the work factor
  later keeps every existing password working.

`ADMIN_TOKEN` still guards `/admin/*`; roles are not built yet.

## Banner CLI

The easiest way to manage banners. It reads `ADMIN_TOKEN` from `apps/api/.env`
automatically, so there is nothing to configure.

```bash
pnpm banner              # interactive create
pnpm banner list         # every banner with its status
pnpm banner edit         # change fields on an existing banner
pnpm banner switch       # retire one banner and publish another
pnpm banner publish      # pick a draft and make it live
pnpm banner unpublish    # hide one without deleting it
pnpm banner delete       # pick one and delete it
pnpm banner --help
```

Every write — create, edit, publish, unpublish, delete — is pushed to open
browsers over SSE, so the bar updates without anyone reloading.

> **If live updates ever stop working, check `compress: false` in
> `apps/web/next.config.ts`.** Next gzips proxied responses, and compressing an
> event stream buffers it — the browser connects and then receives nothing.
> `curl` will not reproduce it, because it sends no `Accept-Encoding` by
> default and so gets an uncompressed stream. Test with a real browser.

`pnpm banner` walks you through title, body, style, an optional link button, an
optional image, optional scheduling, and whether to publish now — then shows a
review before anything is sent.

```
┌  MangaKai · new banner
│
◆  Title
│  Server maintenance tonight
│
◆  Style
│  ● Info          sky · shown as "Notice"
│  ○ Announcement  violet · for launches and news
│  ○ Warning       amber · shown as "Heads up"
└
```

### Editing

`pnpm banner edit` shows the banner's current values, lets you tick only the
fields you want to touch, pre-fills each prompt with what is there today, and
reviews the change as `from → to` before saving. Leaving a text field blank
clears it.

```
│  Current values 99e327b3-dd75-432b-919b-ae8224ef620d
│
│  Title        Edit me
│  Body         original body
│  Style        info
│  Link URL     —
│  Published    yes
│
◆  What do you want to change?
│  ◼ Title   ◻ Body   ◼ Style   ◻ Link URL   ◻ Published
│
│  Changes
│
│  Title        Edit me → Edit me v2
│  Style        info → warning
│
◆  Apply these changes?  ● Yes / ○ No
│
◇  Saved and pushed to every open tab
```

Fields you do not tick are left untouched — it sends a partial `PATCH`, not a
whole replacement.

`edit`, `publish`, `unpublish` and `delete` show a picker when you leave the id
off. A short id prefix works too — `pnpm banner edit 4117c72a`.

`list` labels each banner **live**, **draft**, **scheduled** or **expired**:

```
  live      4117c72a  Welcome to MangaKai
            info
  scheduled 9733c07c  Scheduled maintenance
            warning · from 2030-09-01 22:00 until 2030-09-02 02:00
  draft     d8493678  Not live yet
            info
```

### Scripting it

Passing `--title` skips every prompt, which is what you want in a deploy script:

```bash
pnpm banner new --title "Maintenance" --variant warning \
  --body "Read-only from 22:00 UTC." --starts 2026-09-01T22:00:00Z

pnpm banner new --title "Draft for later" --draft
pnpm banner list --json
```

| Flag        | Notes                                     |
| ----------- | ----------------------------------------- |
| `--title`   | Required. 1–120 characters.               |
| `--body`    | The text after the title.                 |
| `--variant` | `info`, `announcement` or `warning`.      |
| `--link`    | URL for the button.                       |
| `--label`   | Button text. Needs `--link`.              |
| `--image`   | Small image shown at the left of the bar. |
| `--starts`  | ISO 8601. Bare numbers are rejected.      |
| `--ends`    | ISO 8601.                                 |
| `--draft`   | Save without publishing.                  |
| `--json`    | With `list`, print raw JSON.              |

## Staff picks CLI

The Staff Picks row on the homepage. Ids are **MangaDex manga ids**, not
staff-pick row ids, and a short prefix works anywhere a full id does.

```bash
pnpm picks                  # every pick, live and draft
pnpm picks active           # only what the homepage is showing
pnpm picks add              # search MangaDex by title, then add
pnpm picks edit      [id]   # change the editorial note
pnpm picks publish   [id]   # put a draft on the homepage
pnpm picks unpublish [id]   # hide without deleting
pnpm picks switch [from] [to]  # swap the manga in a slot
pnpm picks move   [id] [n]     # reorder; 0 is first
pnpm picks delete    [id]   # remove permanently
```

Leave the id off and you get a picker.

`add` searches MangaDex by title so you never have to hunt down a UUID:

```
┌  MangaKai · add staff pick
│
◇  Search MangaDex for a title
│  berserk
│
◇  Which one?
│  Berserk  (1989 · completed)
│
◇  Editorial note
│  Miura's masterpiece. Nothing else looks like it.
│
◇  Publish it to the homepage now?  Yes
│
└  Berserk is live on the homepage.
```

`switch` replaces the manga in a slot, keeping its position and published
state. **The old note is not carried over** — a note written about one series
is wrong about another, so it asks for a new one.

`move` renumbers every pick so positions stay contiguous from zero, and prints
the resulting order. Positions past the end clamp, so `pnpm picks move <id> 99`
means "put it last".

## Admin API

The CLI is a thin wrapper over these routes — reach for them directly when you
want raw HTTP.

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
| `imageUrl`  | URL \| null                           | no       | `null`  | Small image at the left of the bar. Must be a valid URL.       |
| `linkUrl`   | URL \| null                           | no       | `null`  | Turns the call-to-action button on. Must be a valid URL.       |
| `linkLabel` | string \| null                        | no       | `null`  | Button text. Falls back to `Learn more` when `linkUrl` is set. |
| `variant`   | `info` \| `announcement` \| `warning` | no       | `info`  | Controls colour and the pill label.                            |
| `active`    | boolean                               | no       | `true`  | Set `false` to retire a banner without deleting it.            |
| `startsAt`  | ISO 8601 datetime \| null             | no       | `null`  | Hidden until this moment. `null` means "already started".      |
| `endsAt`    | ISO 8601 datetime \| null             | no       | `null`  | Hidden after this moment. `null` means "never expires".        |

The response adds `id`, `createdAt` and `updatedAt`.

How each `variant` renders in the bar:

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

`GET /api/banners` returns only live banners, newest first. They render as a
sticky bar across the top of every page — several at once stack vertically,
newest on top.

Dismissals are stored in the `mangakai_dismissed_banners` cookie rather than
`localStorage`, so the server can filter them during SSR and the bar is present
in the initial HTML instead of appearing after hydration and pushing the page
down. The cookie keeps the 20 most recent ids.

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
MangaDex at read time. Picks have an `active` flag like banners, so one can be
staged before it goes live; only active picks reach the homepage.

| Endpoint                                | Does                                    |
| --------------------------------------- | --------------------------------------- |
| `GET /admin/staff-picks`                | Every pick, drafts included             |
| `POST /admin/staff-picks`               | Add or upsert by `mangaId`              |
| `PATCH /admin/staff-picks/:mangaId`     | `note`, `position`, `active`            |
| `POST /admin/staff-picks/switch`        | Swap the manga in a slot (`from`, `to`) |
| `POST /admin/staff-picks/:mangaId/move` | Reorder, renumbering the rest           |
| `DELETE /admin/staff-picks/:mangaId`    | Remove permanently                      |

Unlike the public list, the admin list keeps picks whose manga MangaDex no
longer returns — you need to see a broken pick in order to fix it, where a
visitor should never meet one. Those show a null `title`.

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

## The reader

Page images are loaded with a plain `<img src>` pointed straight at the
MangaDex@Home node — **not** fetched first.

MangaDex@Home hotlink-protects its nodes. A request that looks like a browser
_and_ carries an `Origin` header from a domain it does not allowlist gets a
`404`, and a 404 has no CORS headers, so the browser reports it as:

```
Access to fetch at 'https://….mangadex.network/data/…'
has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Which sends you looking for a CORS bug that is not there. Measured against one
node:

| Request                               | Result |
| ------------------------------------- | ------ |
| Chrome UA + `Origin: localhost:3000`  | `200`  |
| Chrome UA + `Origin: <anything-else>` | `404`  |
| Chrome UA + no `Origin` header        | `200`  |
| curl UA + `Origin: <anything-else>`   | `200`  |

`localhost` is allowlisted, so this works perfectly in local development and
fails the moment the site is served from any real domain — including a
Codespaces forwarded port. `fetch()` always sends `Origin`; `<img src>` sends
none.

**Consequence:** neither client reports retrievals to MangaDex@Home any more.
Reporting needs the byte count and duration of the fetch, and only code that
performs the fetch can measure those. Expo never could (`expo-image` exposes no
metrics), and the web app now cannot either. The alternative is proxying every
page image through the API, which would put a manga site's entire image
bandwidth through one server. `POST /api/chapters/report` still exists and
still works, unused, if that trade is ever worth making.

An `<img>` error carries no status code, so an expired host and a broken page
look identical. Both readers treat a failure as "ask for a fresh host" and cap
it at `MAX_REFRESHES = 2`, or the two would feed each other forever.

## Titles

MangaDex's `title` is the work's **main** title, which is usually the romanised
original rather than a translation:

```
{"zh-ro": "Qǐng Qīfu Wǒ ba, Èyì Xiǎojiě!"}   ← attributes.title
{"en":    "Please Bully Me, Miss Villainess!"} ← buried in attributes.altTitles
```

So `pickTitle` in `apps/api/src/services/manga.ts` looks for a real English
title first — `title.en`, then `altTitles` — and only falls back to the
romanised original when no English title exists anywhere. Across 120 manga from
the homepage rows this changed **81** of them.

It is easy to miss, because Japanese romanisations are frequently the name
English readers already use — "Berserk", "One Piece" — so the bug hides until a
Chinese or Korean series appears. It was also hiding plainer cases: "Sono
Bisque Doll wa Koi o Suru" is "My Dress-Up Darling".

The romanised original is not discarded; it moves into `altTitles`, since it is
a name someone may well search for. Search is unaffected either way — MangaDex
matches alt titles server-side, so both names find the series.

## Public API

| Endpoint                   | Returns                                         |
| -------------------------- | ----------------------------------------------- |
| `GET /api/home`            | Banners, hero, staff picks and three manga rows |
| `GET /api/manga/search?q=` | Paginated search (`limit`, `offset`)            |
| `GET /api/manga/:id`       | Full manga detail                               |
| `GET /api/banners`         | Currently live banners                          |
| `GET /api/banners/stream`  | SSE feed of banner changes                      |

# Test

**Links:**

- Official English Translation [<Pocket Comics>](https://www.pocketcomics.com/comic/320)
