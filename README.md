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
| `index.html` | the whole app (views, routing, rendering) |
| `sw.js` | service worker — network-first HTML, cache-first assets, skips cross-origin API |
| `manifest.json` + `icon-*` | PWA install metadata |
| `route-geometry.json`, `map-base.*` | pre-baked map + road-following route polylines |
| `stop-coords.json` | frozen stop coordinates (stops don't move; snapshot from the dev server's live accumulation) |
| `CNAME` | `nusisb.ahlab.org` |

## Deploy

Push to `main`; GitHub Pages serves the root. DNS: `nusisb` CNAME → `augmented-human-lab.github.io`.

If live data stops loading, open the **Diagnostics** tab — it shows the backend
health, masked token, and a live FMS validity check. A rotated token is fixed in
the backend (see `nusisb-ahlab-appscript`), not here.

## Source / dev

Active development happens in `sclab/nus-isb-web` (Node dev server + mitmproxy
token-capture tooling + docs). This repo is the deployable production frontend.
