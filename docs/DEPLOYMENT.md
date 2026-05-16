# Cue Deployment Notes

## Current App Type

The deployed Cloudflare Pages prototype is a static browser app:

- `index.html`
- `styles.css`
- `app.js`

That means it can be deployed for free without a server.

The repo also includes a local backend server for development:

```bash
node server.js
```

That opens:

```text
http://127.0.0.1:5173/
http://127.0.0.1:5173/backend.html
```

Cloudflare Pages does not run this Node server. For production API hosting, move the backend to Cloudflare Workers, a separate Node host, or serverless functions.

## Current Deployment

The current Cloudflare Pages deployment is:

```text
https://cuemix.pages.dev/
```

Add this exact URL as an allowed redirect URI in Spotify, Google, or any other OAuth provider dashboard used by the deployed app.

## Recommended Free Hosts

### Cloudflare Pages

- Good default choice for a free static prototype.
- Gives a free `PROJECT.pages.dev` subdomain.
- Supports custom domains.
- Strong edge/CDN performance.

### Netlify

- Very easy drag-and-drop or Git-based deploy.
- Gives a free `PROJECT.netlify.app` subdomain.
- Supports custom domains.
- Good for quick demos and previews.

### Vercel

- Good if the project later becomes a React or Next.js app.
- Gives a free `PROJECT.vercel.app` subdomain.
- Supports custom domains.

### GitHub Pages

- Good if the repo is already on GitHub.
- Gives a free `USERNAME.github.io/REPO` or `PROJECT.github.io` URL.
- Supports custom domains.

## Fastest Deployment Method

Netlify drag-and-drop is the fastest no-build path:

1. Make sure `index.html`, `styles.css`, and `app.js` are in the deploy folder root.
2. Open Netlify and create a new site by manual deploy.
3. Drop the project folder or a zip of the static files.
4. Rename the generated site subdomain if the desired name is available.
5. Update Spotify redirect URI if using Spotify:

```text
https://YOUR-SITE.netlify.app/
```

Cloudflare Pages is the recommended long-term free path:

1. Push the repo to GitHub.
2. Create a Cloudflare Pages project from the repo.
3. Use no build command.
4. Set the output directory to `/` for this static prototype.
5. Deploy.
6. Update provider redirect URIs to the deployed URL.

## Domain And Naming

`q.com` is already taken and is too broad for this product. Use a temporary free hosting subdomain first, then buy a custom domain when the name is stable.

Candidate project names:

- CueMix
- CueDate
- CueSync
- SongCue
- TuneCue
- MatchCue
- QueueHearts
- CassetteCue
- SpinCue
- VibeCue
- SideBCue
- NeedleCue

Potential free-hosting subdomain patterns:

- `cuemix.pages.dev`
- `cuedate.pages.dev`
- `cuesync.pages.dev`
- `songcue.netlify.app`
- `matchcue.vercel.app`

Subdomain availability changes constantly, so confirm inside the hosting dashboard before committing to the name.

## Important OAuth Redirect Rule

Every deployment URL must be added as an allowed redirect URI in the provider dashboard.

For local development:

```text
http://127.0.0.1:5173/
```

For production:

```text
https://YOUR-DEPLOYED-SUBDOMAIN/
```

The scheme, hostname, and trailing slash must match exactly.

## Secrets Warning

The static prototype currently exposes client-side configuration. This is acceptable only for browser-safe public IDs and demos.

For production:

- Keep Spotify client secret on a backend or serverless function.
- Keep Google OAuth secret on a backend or serverless function.
- Store music provider access tokens encrypted.
- Do not ship private keys in `app.js`.
