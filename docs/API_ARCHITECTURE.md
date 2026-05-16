# Cue API Architecture Draft

## Recommended Stack

- Frontend: React or Next.js after the prototype stabilizes.
- Backend: Node.js with Fastify or NestJS.
- Database: PostgreSQL.
- Realtime: WebSocket or Server-Sent Events for match list updates.
- Jobs: queue-backed worker for recommendation expiry and stale heartbeat cleanup.
- Cache: Redis for active listening presence and fast same-track lookup.

## Prototype Limitation

The current Cloudflare Pages deployment is static. It cannot truly match many users because each browser only has local state. Real same-song matching requires a backend that receives every user's listening heartbeat, stores active presence centrally, compares users by normalized track key, and publishes match updates back to clients.

This repo now includes a local proof-of-concept backend in `server.js`. It serves the static app, exposes `/api/health`, `/api/toggle`, `/api/listening/heartbeat`, `/api/matches`, and `/api/recommendations`, and provides a browser console at `/backend.html`. It is in-memory only and intended for local testing, not production.

## Data Model

### users

- `id`
- `email`
- `display_name`
- `avatar_url`
- `password_hash`
- `auth_provider`: `password`, `google`
- `instagram_id`
- `share_instagram_on_unlock`
- `created_at`

### spotify_connections

- `id`
- `user_id`
- `spotify_user_id`
- `access_token_encrypted`
- `refresh_token_encrypted`
- `expires_at`
- `created_at`
- `updated_at`

### music_provider_connections

- `id`
- `user_id`
- `provider`: `spotify`, `lastfm`, `deezer`, `musicbrainz`
- `provider_user_id`
- `access_token_encrypted`
- `refresh_token_encrypted`
- `expires_at`
- `created_at`
- `updated_at`

### social_identities

- `id`
- `user_id`
- `provider`: `instagram`, `facebook`, `twitter`, `threads`
- `handle`
- `is_selected_for_reveal`

### listening_heartbeats

- `user_id`
- `provider`
- `provider_track_id`
- `normalized_track_key`
- `track_name`
- `artist_names`
- `album_art_url`
- `progress_ms`
- `duration_ms`
- `reported_at`
- `expires_at`

### matches

- `id`
- `user_a_id`
- `user_b_id`
- `provider`
- `provider_track_id`
- `normalized_track_key`
- `status`: `active`, `rejected`, `unlocked`, `blocked`
- `accepted_recommendation_count`
- `created_at`
- `updated_at`

### recommendations

- `id`
- `match_id`
- `sender_id`
- `receiver_id`
- `provider`
- `provider_track_id`
- `normalized_track_key`
- `track_name`
- `artist_names`
- `status`: `pending`, `accepted`, `rejected`, `expired`
- `expires_at`
- `created_at`
- `responded_at`

## API Endpoints

- `POST /auth/register`: create Cue account with email/user ID and password.
- `POST /auth/login`: log in with Cue account password.
- `GET /auth/google/start`: start Google OAuth login.
- `GET /auth/google/callback`: complete Google OAuth login.
- `GET /auth/spotify/start`: start Spotify connection for an authenticated Cue user.
- `POST /auth/spotify/callback`: exchange Spotify code and attach tokens to the Cue user.
- `DELETE /auth/spotify`: disconnect Spotify from Cue user.
- `GET /auth/music/:provider/start`: start connection for a supported music provider.
- `POST /auth/music/:provider/callback`: complete connection for a supported music provider.
- `DELETE /auth/music/:provider`: disconnect a music provider.
- `GET /me`: current Cue profile.
- `PATCH /me/profile`: update display name, Instagram ID, and reveal opt-in settings.
- `PUT /me/social-identity`: set reveal handle.
- `POST /listening/heartbeat`: report current Spotify playback.
- `GET /matches`: list active and unlocked matches.
- `GET /music/search?q=&type=track,album,artist&provider=`: search provider catalog for recommendations.
- `GET /music/albums/:providerAlbumId/tracks?provider=`: choose a track from an album result.
- `GET /music/artists/:providerArtistId/top-tracks?provider=`: choose a track from an artist result.
- `POST /matches/:matchId/recommendations`: send a Spotify track recommendation.
- `POST /recommendations/:id/accept`: accept recommendation.
- `POST /recommendations/:id/reject`: reject recommendation and delete match.
- `POST /matches/:matchId/block`: block and hide user.
- `POST /matches/:matchId/report`: report matched user.

## Matching Algorithm

1. User client reports a heartbeat with the current provider track ID.
2. Backend stores the heartbeat with a short expiry.
3. Backend normalizes the track into `normalized_track_key`, for example lowercased artist plus track name or provider-specific canonical ID.
4. Backend looks up other active users with the same normalized track key.
5. Backend filters out self, blocked users, rejected pairs, and existing active matches.
6. Backend creates or refreshes an active match.
7. Frontend receives updated matches by polling, SSE, or WebSocket.

## Realtime Matching Requirements

- Client sends `POST /listening/heartbeat` every 30-60 seconds while the user is active.
- Backend stores active listening state in Redis with a 60-120 second TTL.
- Backend writes durable match records to PostgreSQL when a same-track pair is found.
- Backend pushes match changes to the frontend by WebSocket or Server-Sent Events.
- A cleanup worker expires stale heartbeats and pending recommendations.
- The frontend should never decide cross-user matches by itself.

## Provider Strategy

- Spotify is preferred for first-class playback detection, but it requires Premium for the owner of the Spotify developer app.
- Free MVP testing should support one fallback path:
  - Last.fm for now-playing and recent listening if the user scrobbles from Spotify or another player.
  - Deezer for catalog search and track metadata.
  - MusicBrainz for open metadata and normalization.
- The backend should expose provider-neutral endpoints so the frontend does not care whether the track came from Spotify, Last.fm, Deezer, or MusicBrainz.

## Expiry Logic

- Listening heartbeats expire after 60-120 seconds.
- Pending recommendations expire after 24 hours.
- Pending recommendations must expose `expires_at` so the UI can show exact due date/time and remaining time.
- Expired recommendations do not increment the unlock count.
- Rejected recommendations immediately mark the match as rejected and remove it from both active lists.

## Open Questions

- Should users match on exact Spotify track ID only, or also linked/alternate versions?
- Should very popular tracks cap match volume?
- Should both users need to opt into revealing the same type of social ID?
- Should a rejected match be permanent or cool down for a fixed period?
