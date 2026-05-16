# Cue PRD

## Summary

Cue is a music-based dating application. Users sign in with a Cue account, optionally using Google, connect a music-data provider, share their current listening state, and are matched when they are listening to the same track at the same time, even if their playback timestamps differ.

The current deployed Cloudflare Pages app is a static browser prototype. It demonstrates login, profile, recommendation, and reveal flows, but it does not yet perform real multi-user matching because there is no central backend, shared database, or realtime presence service.

## Product Goals

- Make music taste the first matching signal.
- Create low-pressure interactions through song recommendations before revealing social IDs.
- Keep user identity protected until there is repeated reciprocal interest.
- Build around real-time listening, not static profile browsing.

## Core User Journey

1. User lands on a retro cassette-styled login page.
2. User logs in with Cue user ID/password or Google.
3. User reaches the main deck.
4. User connects Spotify so Cue can read playback.
5. The main deck shows current playback and recent listening.
6. The system checks other active users listening to the same Spotify track ID.
7. Matching ignores playback progress, so two users on the same track count as matched even with different timestamps.
8. Matched users appear in the right-side match list.
9. User recommends a song to a matched person.
10. Receiver accepts or rejects within 24 hours.
11. Rejection removes the matched person.
12. After five accepted recommendations between the pair, the app unlocks the selected personal social ID.

## MVP Scope

- Cue account login with email/user ID and password.
- Google OAuth login.
- Music provider connection. Spotify remains the preferred provider, but free MVP testing should support a fallback provider because Spotify Web API access requires Premium for the app owner.
- Current playback polling from Spotify or a fallback now-playing provider.
- Recent listening display.
- Active listening heartbeat stored by backend.
- Real-time match list based on `spotify_track_id`.
- Song recommendation send, accept, reject, and expiry.
- Song recommendation search across provider tracks, albums, and artists.
- Five-accept unlock rule for one chosen social ID.
- Profile page for editing Instagram ID and opting into sharing it with five-accept matches.
- Basic abuse controls: block, report, rate limits, and match removal.

## Non-Goals For MVP

- Full dating profile swiping.
- In-app chat before the five-accept unlock.
- Spotify playback control.
- Deep cross-provider feature parity. The MVP can use one fallback provider for free testing.
- Algorithmic taste compatibility beyond same-track matching.

## Match Rules

- A match is created when two active users report the same normalized provider track ID.
- Track progress does not need to match.
- The listening heartbeat should be considered active for a short window, recommended 60-120 seconds.
- The same pair and track should not create duplicate active matches.
- A user cannot match with blocked users or previously rejected active matches.

## Recommendation Rules

- Either matched user can send one song recommendation at a time per pair.
- Sender can search tracks directly, open an album to pick a track, or open an artist to pick from top tracks.
- Receiver has 24 hours to accept or reject.
- Every pending recommendation must show an exact due date/time and remaining time.
- Accept increments the pair acceptance count.
- Reject deletes the match and closes pending recommendations.
- At five accepted recommendations, reveal each user's selected social ID to the other user.
- Instagram reveal is opt-in. A user can edit the Instagram ID and check whether it should be sent to unlocked matches.

## Key Screens

- Login: Cue account authentication with email/password and Google, cassette tape visual identity.
- Spotify connection: connect or disconnect Spotify from the Cue account.
- Main deck: current playback, recent listening log, active match list.
- Match detail: person alias, shared track, send recommendation action, pending recommendation status.
- Recommendation inbox: accept or reject pending songs.
- Social ID setup: Instagram, Facebook, X/Twitter, or Threads handle.
- Profile: edit Instagram ID, enable/disable automatic sharing to unlocked matches, and see which unlocked matches can view it.

## Success Metrics

- Cue login completion rate.
- Spotify connection completion rate.
- Percentage of active listeners who receive at least one match.
- Recommendation send rate per match.
- Recommendation acceptance rate.
- Five-accept unlock conversion rate.
- Block/report rate after unlock.

## Risks

- A static frontend cannot verify that many users are listening to the same song. Production requires a central server to collect listening heartbeats, compare active users, create matches, and expire stale presence.
- Spotify Web API now requires Premium for the owner of the developer app. Free MVP testing needs Last.fm, Deezer, local demo data, or another provider fallback.
- Spotify polling limits and endpoint availability may affect real-time matching.
- Current playback requires users to be actively listening on the connected provider.
- Matching on globally popular songs may create noisy matches.
- Identity reveal needs safety controls and clear consent.

## Spotify Notes

Spotify is not the primary Cue user identity. Spotify is a connected music provider used after Cue login. Spotify Web API access currently requires an active Premium subscription for the owner of the developer app, so the free MVP should not depend exclusively on Spotify. For a static browser prototype, use Authorization Code with PKCE because a client secret cannot be safely stored in the browser. For the production backend, server-side Authorization Code flow is also viable because the backend can keep the client secret private. Required scopes for the Spotify path include `user-read-currently-playing`, `user-read-playback-state`, `user-read-recently-played`, `user-read-private`, and `user-read-email`.

## Free Deployment Plan

- Deploy the static prototype to a free static host first: Cloudflare Pages, Netlify, Vercel, or GitHub Pages.
- Use the provider's free subdomain for early testing, such as `cue-match.pages.dev`, `cue-match.netlify.app`, or `cue-match.vercel.app`.
- Buy a custom domain only after choosing the final product name. The deployment can remain free even if the domain itself is paid.
- Keep secrets out of static frontend code. Production Spotify, Google, and fallback music provider secrets should live in backend/serverless functions.

## Naming Direction

`q.com` is not a viable product domain. Candidate names should stay close to Cue/Q, music, and matching while being easier to search and register:

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

References:

- [Spotify Authorization](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [Spotify Authorization Code Flow](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
- [Spotify Authorization Code with PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
