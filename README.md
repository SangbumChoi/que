# Cue

Music-based matching application.

Live prototype: https://cuemix.pages.dev/

## Prototype

This repo currently contains a static Cue-login prototype:

- `index.html`: app shell
- `styles.css`: retro cassette visual system
- `app.js`: Cue demo login, Google demo login, Spotify connection, callback handling, current playback, recent tracks, match recommendation search, and accept/reject pipeline
- `server.js`: local zero-dependency backend/API server
- `backend.html`: local backend console for API health, toggle, heartbeat tests, and match inspection
- `backend.js`: backend console interactions
- `docs/PRD.md`: product requirements draft
- `docs/AGENT_PLAN.md`: agent/workstream plan
- `docs/API_ARCHITECTURE.md`: backend and API draft
- `docs/DEPLOYMENT.md`: free deployment, naming, and domain notes

## Run Locally

For frontend-only testing, serve the folder from a local HTTP server:

```bash
python3 -m http.server 5173
```

For frontend plus local API testing, run the local backend server:

```bash
node server.js
```

Then open:

```text
http://127.0.0.1:5173/
http://127.0.0.1:5173/backend.html
```

The backend button is hidden for normal users. Developers can enable it in the app with:

```text
http://127.0.0.1:5173/?dev=1
```

Run the test suite with:

```bash
npm test
```

In the Spotify Developer Dashboard, add the local URL as a redirect URI, for example:

```text
http://127.0.0.1:5173/
```

For the deployed Cloudflare site, also add:

```text
https://cuemix.pages.dev/
```

Log in with any demo user ID/password, or use the Google demo button. The supplied Spotify Client ID is already set in `SPOTIFY_CLIENT_ID` inside `app.js`. You can also override it once with:

```text
http://127.0.0.1:5173/?client_id=YOUR_SPOTIFY_CLIENT_ID
```

Then use the Connect Spotify button from the main deck.
