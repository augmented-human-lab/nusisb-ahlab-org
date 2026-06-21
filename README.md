# nusisb-ahlab-org

Public web app for the **NUS Internal Shuttle Bus** dashboard — live shuttle ETAs,
bus positions, a campus map, service alerts, and a diagnostics view. Served by
GitHub Pages at **<https://nusisb.ahlab.org>**.

Static single-page PWA (no build step). All live data comes from the Apps Script
backend **`nusisb-ahlab-appscript`**, which hides the ConnectX FMS token; this repo
ships no secrets.

## How it talks to the backend

`index.html` sets `window.API_BASE` to the backend's Apps Script `/exec` URL. The
frontend rewrites `/api/<Name>?<params>` → `<exec>?action=<Name>&<params>`, so the
same HTML also runs against the local Node dev server (`sclab/nus-isb-web`) when
`API_BASE` is empty.

| File | Notes |
|------|-------|
| `index.html` | the whole app (views, routing, rendering, AHL sign-in gate) |
| `sw.js` | service worker — network-first HTML, cache-first assets, skips cross-origin API |
| `manifest.json` + `icon-*` | PWA install metadata |
| `og-image.png` + `og-card.html` | 1200×630 social-share card and its HTML source |
| `route-geometry.json`, `map-base.*` | pre-baked map + road-following route polylines |
| `stop-coords.json` | frozen stop coordinates (stops don't move; snapshot from the dev server's live accumulation) |
| `CNAME` | `nusisb.ahlab.org` |

## AHL sign-in gate

The dashboard is gated to **@ahlab.org** members using the shared AHL
member-login **broker** (`ahl-site-appscript`) — the same pattern as
`new.ahlab.org`, with **no GCP OAuth client**. On load an overlay (`#authGate`)
covers the app; clicking *Sign in* navigates the whole tab to the broker, which
reads the visitor's Workspace identity server-side (`Session.getActiveUser()` —
trustworthy because the broker webapp is Workspace-gated) and redirects back to
`/auth-callback/` with the identity in the URL fragment. `auth-callback/` verifies
a single-use nonce, caches the identity in `sessionStorage`, and returns to `/`,
where `ahlGrant()` reveals the dashboard (`body.ahl-authed`) and starts polling
(`startApp()`). Non-`@ahlab.org` visitors hit the broker's "Not an AHLab member"
page and never get a session.

The `ahlAuth*` / `ahlLogin` functions live at the bottom of `index.html`'s main
`<script>`; storage keys (`ahl-auth-v1`, …) match `auth-callback/index.html`.

This is a **UI access gate, not a security boundary** — the bus-data proxy
(`nusisb-ahlab-appscript`) stays `ANYONE_ANONYMOUS` so the browser can `fetch()`
it cross-origin. (A `DOMAIN`-access Apps Script can't be fetched from another
origin; it returns Google's login HTML instead of JSON. Fully server-side gating
like `ahl-meeting-appscript` only works because that app's HTML is served *by*
Apps Script on the same origin — not the case for a static GitHub Pages site.)

**One-time setup — broker allowlist:** `https://nusisb.ahlab.org/auth-callback/`
must be listed in `ALLOWED_RETURN_URLS` in `ahl-site-appscript/Code.js` (already
added); redeploy that broker (`npm run deploy` in `ahl-site-appscript`) for it to
take effect. The broker `/exec` URL is hard-coded as `AHL_BROKER_URL` in
`index.html` — update it there if the broker is ever redeployed to a new URL.

## Social share preview (Open Graph)

`<head>` carries Open Graph + Twitter Card tags pointing at `og-image.png`. To
regenerate the card after editing `og-card.html`:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --hide-scrollbars --window-size=1200,630 \
  --screenshot="og-image.png" "file://$(pwd)/og-card.html"
```

After deploying, re-scrape the link (Facebook Sharing Debugger, or just resend in
WhatsApp) to refresh the sticky preview cache.

## Deploy

Push to `main`; GitHub Pages serves the root. DNS: `nusisb` CNAME → `augmented-human-lab.github.io`.

If live data stops loading, open the **Diagnostics** tab — it shows the backend
health, masked token, and a live FMS validity check. A rotated token is fixed in
the backend (see `nusisb-ahlab-appscript`), not here.

## Source / dev

Active development happens in `sclab/nus-isb-web` (Node dev server + mitmproxy
token-capture tooling + docs). This repo is the deployable production frontend.
