# Cue Agent Plan

## Agent 1: Product And UX

- Own PRD detail, user stories, safety flows, and acceptance criteria.
- Define cassette-retro design system: colors, typography, layout, empty states, and mobile behavior.
- Produce screen specs for login, main deck, match list, recommendation inbox, and social ID unlock.

## Agent 2: Music Provider Integration

- Implement Spotify OAuth with PKCE for the static prototype and server-side Authorization Code flow for production.
- Document that Spotify Web API access requires Premium for the app owner.
- Evaluate free-friendly fallback providers such as Last.fm for now playing/history and Deezer or MusicBrainz for catalog search.
- Fetch current playback and recent tracks from the active provider.
- Normalize provider track, artist, album art, duration, and playback progress into one internal shape.
- Handle token refresh, expired sessions, provider no-playback states, rate limits, and Premium-gated Spotify errors.

## Agent 3: Matching Backend

- Design user, active listening, match, recommendation, and social identity models.
- Implement listening heartbeat ingestion.
- Match users by same `spotify_track_id` inside the active heartbeat window.
- Prevent duplicate matches, self matches, blocked-user matches, and rejected-pair rematches.
- Own the production gap between the static prototype and real multi-user matching: central heartbeat store, Redis TTLs, PostgreSQL match records, and realtime updates.

## Agent 4: Recommendation Workflow

- Implement send, accept, reject, and 24-hour expiry.
- Ensure the UI and API expose exact recommendation due date/time and remaining time.
- Track accepted recommendation count per pair.
- Unlock social IDs after five accepts.
- Add notification hooks for pending recommendations.

## Agent 5: Safety And Trust

- Add block, report, remove match, and social ID visibility controls.
- Review privacy copy and consent moments.
- Define abuse rate limits for recommendations and repeated matching.
- Create moderation event logs.

## Agent 6: QA And Release

- Build test plans for OAuth, matching, recommendation expiry, rejection deletion, and five-accept unlock.
- Add contract tests for backend state transitions.
- Add browser smoke tests for login and main page.
- Prepare free static deployment checklist, staging launch checklist, and observability dashboards.

## Agent 7: Naming And Deployment

- Shortlist Cue/Q/music/date brand names and check obvious conflicts before launch.
- Reserve a free hosting subdomain for testing.
- Deploy the static prototype to Cloudflare Pages, Netlify, Vercel, or GitHub Pages.
- Prepare custom domain setup steps for the final name.
- Keep production secrets in backend/serverless environment variables, not static frontend files.

## Suggested Milestones

1. Prototype: static login and main deck, music-provider connection, current playback display, recommendation search, and accept/reject flow.
2. Free Web Deploy: publish to a free static host under a temporary subdomain.
3. Provider Strategy: decide whether to pay for Spotify Premium on the app-owner account or use a free-friendly fallback provider for MVP testing.
4. MVP Backend: user session, listening heartbeat, same-track matching, match list API.
5. Recommendation Loop: send/accept/reject, 24-hour expiry worker, five-accept unlock.
6. Safety Beta: block/report, privacy settings, rate limits, audit logs.
7. Private Launch: telemetry, onboarding polish, bug fixes, initial user cohort.
