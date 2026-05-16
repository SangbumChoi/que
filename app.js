const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const SPOTIFY_CLIENT_ID = "85b5beb4fc294879ac30181e8fcb25c4";
const APP_USER_KEY = "cue.app.user";
const CLIENT_ID_KEY = "cue.spotify.client_id";
const DEV_MODE_KEY = "cue.dev.enabled";
const MATCHES_KEY = "cue.matches";
const TOKEN_KEY = "cue.spotify.token";
const VERIFIER_KEY = "cue.pkce.verifier";
const STATE_KEY = "cue.oauth.state";
const SCOPE = [
  "user-read-private",
  "user-read-email",
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-recently-played",
  "user-top-read",
].join(" ");

const app = document.querySelector("#app");

let currentUser = null;
let currentSpotifyToken = null;
let searchState = null;

const initialMatches = [
  {
    id: "mira",
    name: "mira_analog",
    track: "Sweet Disposition",
    artist: "The Temper Trap",
    acceptCount: 2,
    handle: "Hidden until five accepts",
  },
  {
    id: "june",
    name: "june.sideb",
    track: "Lovers Rock",
    artist: "TV Girl",
    acceptCount: 4,
    handle: "Pending",
    recommendation: {
      id: "rec-june-1",
      direction: "incoming",
      status: "pending",
      trackName: "Space Song",
      artistName: "Beach House",
      albumName: "Depression Cherry",
      expiresAt: Date.now() + 18 * 60 * 60 * 1000,
    },
  },
  {
    id: "seoul",
    name: "seoul.static",
    track: "A-Punk",
    artist: "Vampire Weekend",
    acceptCount: 0,
    handle: "Locked",
  },
];

const demoCatalog = [
  {
    id: "demo-track-1",
    type: "track",
    name: "Digital Love",
    artistName: "Daft Punk",
    albumName: "Discovery",
  },
  {
    id: "demo-track-2",
    type: "track",
    name: "Just Like Heaven",
    artistName: "The Cure",
    albumName: "Kiss Me, Kiss Me, Kiss Me",
  },
  {
    id: "demo-track-3",
    type: "track",
    name: "Lovers Rock",
    artistName: "TV Girl",
    albumName: "French Exit",
  },
  {
    id: "demo-album-1",
    type: "album",
    name: "Discovery",
    artistName: "Daft Punk",
    albumName: "Discovery",
    tracks: [
      { id: "demo-album-track-1", type: "track", name: "Digital Love", artistName: "Daft Punk", albumName: "Discovery" },
      { id: "demo-album-track-2", type: "track", name: "Something About Us", artistName: "Daft Punk", albumName: "Discovery" },
    ],
  },
  {
    id: "demo-artist-1",
    type: "artist",
    name: "The Cure",
    artistName: "The Cure",
    albumName: "Artist top tracks",
    tracks: [
      { id: "demo-artist-track-1", type: "track", name: "Friday I'm in Love", artistName: "The Cure", albumName: "Wish" },
      { id: "demo-artist-track-2", type: "track", name: "Boys Don't Cry", artistName: "The Cure", albumName: "Three Imaginary Boys" },
    ],
  },
];

const demoHistory = [
  ["Just Like Heaven", "The Cure", "03:12"],
  ["Friday I'm in Love", "The Cure", "03:35"],
  ["Digital Love", "Daft Punk", "04:58"],
  ["There Is a Light", "The Smiths", "04:04"],
  ["Sweet Disposition", "The Temper Trap", "04:11"],
  ["Lovers Rock", "TV Girl", "04:18"],
  ["Space Song", "Beach House", "04:45"],
  ["A-Punk", "Vampire Weekend", "02:17"],
  ["Instant Crush", "Daft Punk", "05:37"],
  ["Dreams", "Fleetwood Mac", "04:14"],
  ["Kiss Me", "Sixpence None The Richer", "03:28"],
  ["Bad Habit", "Steve Lacy", "03:52"],
  ["Hype Boy", "NewJeans", "02:59"],
  ["Dynamite", "BTS", "03:19"],
  ["Spring Day", "BTS", "04:34"],
  ["Ditto", "NewJeans", "03:05"],
  ["No Surprises", "Radiohead", "03:49"],
  ["Everybody Wants To Rule The World", "Tears For Fears", "04:11"],
  ["Pink + White", "Frank Ocean", "03:04"],
  ["Super Shy", "NewJeans", "02:35"],
  ["Seven", "Jung Kook", "03:04"],
  ["As It Was", "Harry Styles", "02:47"],
  ["Cruel Summer", "Taylor Swift", "02:58"],
  ["Blinding Lights", "The Weeknd", "03:20"],
];

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const devModeFromUrl = params.get("dev");
  if (devModeFromUrl === "1") {
    localStorage.setItem(DEV_MODE_KEY, "true");
    params.delete("dev");
    const cleanQuery = params.toString();
    const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  const clientIdFromUrl = params.get("client_id");
  if (clientIdFromUrl) {
    localStorage.setItem(CLIENT_ID_KEY, clientIdFromUrl);
    params.delete("client_id");
    const cleanQuery = params.toString();
    const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  if (params.has("code")) {
    await handleSpotifyCallback(params);
    return;
  }

  const user = getStoredUser();
  if (!user) {
    renderLogin();
    return;
  }

  renderMain(user, getStoredToken());
}

function renderLogin(errorMessage = "") {
  app.innerHTML = `
    <section class="login-stage">
      <div class="cassette" aria-hidden="true">
        <div class="cassette-label">
          <span>CUE MIX 01</span>
          <strong>LISTENING FOR A MATCH</strong>
        </div>
        <div class="reels">
          <div class="reel"><span></span></div>
          <div class="tape-window"></div>
          <div class="reel"><span></span></div>
        </div>
        <div class="cassette-footer">
          <span>SYNC</span>
          <span>90 MIN</span>
          <span>STEREO</span>
        </div>
      </div>

      <section class="login-panel">
        <p class="eyebrow">Cue account</p>
        <h1>Cue</h1>
        <p class="lede">Sign in as an individual user first. Spotify connects later so Cue can read the song you are hearing.</p>
        <form class="auth-form" id="cue-login-form">
          <label for="user-id">User ID or email</label>
          <input id="user-id" name="user-id" autocomplete="username" placeholder="you@example.com" required />
          <label for="password">Password</label>
          <input id="password" name="password" autocomplete="current-password" type="password" placeholder="Demo password" required />
          ${errorMessage ? `<p class="error">${escapeHtml(errorMessage)}</p>` : ""}
          <button class="primary-button" type="submit">
            <span class="play-dot"></span>
            Log in
          </button>
        </form>
        <div class="divider"><span>or</span></div>
        <button class="secondary-button" id="google-login-button" type="button">Continue with Google</button>
      </section>
    </section>
  `;

  document.querySelector("#cue-login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const userId = document.querySelector("#user-id").value.trim();
    const password = document.querySelector("#password").value;
    if (!userId || !password) {
      renderLogin("Enter a user ID and password.");
      return;
    }
    storeUser({
      id: slugify(userId),
      displayName: userId.includes("@") ? userId.split("@")[0] : userId,
      authProvider: "password",
      instagramId: "",
      shareInstagramOnUnlock: false,
    });
    renderMain(getStoredUser(), getStoredToken());
  });

  document.querySelector("#google-login-button").addEventListener("click", () => {
    storeUser({
      id: "google-demo-user",
      displayName: "Google Demo User",
      authProvider: "google",
      instagramId: "",
      shareInstagramOnUnlock: false,
    });
    renderMain(getStoredUser(), getStoredToken());
  });
}

async function renderMain(user, token) {
  const isSpotifyConnected = Boolean(token);
  currentUser = ensureUserDefaults(user);
  currentSpotifyToken = token;

  app.innerHTML = `
    <section class="deck">
      <header class="topbar">
        <div>
          <p class="eyebrow">Cue live deck</p>
          <h1>Now matching by song</h1>
        </div>
        <div class="top-actions">
          <span class="account-pill">${escapeHtml(currentUser.displayName)}</span>
          ${isDeveloperMode() ? `<a class="ghost-link" href="./backend.html">Backend</a>` : ""}
          <button class="ghost-button" id="profile-button">Profile</button>
          ${
            isSpotifyConnected
              ? `<button class="ghost-button" id="disconnect-spotify-button">Disconnect Spotify</button>`
              : `<button class="primary-button compact" id="connect-spotify-button">Connect Spotify</button>`
          }
          <button class="ghost-button" id="logout-button">Log out</button>
        </div>
      </header>

      <section class="main-grid">
        <article class="player-board">
          <div class="meter">
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div id="now-playing" class="now-playing">
            <p class="eyebrow">Current playback</p>
            <h2>${isSpotifyConnected ? "Checking Spotify..." : "Spotify not connected"}</h2>
            ${
              isSpotifyConnected
                ? ""
                : `<p>Connect Spotify to make your current track matchable. Your Cue account stays separate from Spotify.</p>`
            }
          </div>
          <div class="transport" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
        </article>

        <article class="history-board">
          <div class="section-heading">
            <p class="eyebrow">Listening log</p>
            <h2>${isSpotifyConnected ? "Recently played" : "Demo listening log"}</h2>
          </div>
          <div id="history-list" class="track-list"></div>
        </article>

        <aside class="match-board">
          <div class="section-heading">
            <p class="eyebrow">Matched people</p>
            <h2>Same song, same moment</h2>
          </div>
          <div class="match-list" id="match-list">
            ${getMatches().map((match) => renderMatchCard(match, isSpotifyConnected)).join("")}
          </div>
        </aside>
      </section>
    </section>
  `;

  document.querySelector("#logout-button").addEventListener("click", () => {
    localStorage.removeItem(APP_USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    renderLogin();
  });

  document.querySelector("#profile-button").addEventListener("click", () => {
    renderProfilePage(getStoredUser(), getStoredToken());
  });

  const connectButton = document.querySelector("#connect-spotify-button");
  if (connectButton) {
    connectButton.addEventListener("click", async () => {
      const clientId = getSpotifyClientId();
      if (!clientId) {
        document.querySelector("#now-playing").innerHTML = `
          <p class="eyebrow">Spotify setup</p>
          <h2>Client ID needed</h2>
          <p>Add your Spotify Client ID to <code>SPOTIFY_CLIENT_ID</code> in <code>app.js</code>, or open this page once with <code>?client_id=YOUR_ID</code>.</p>
        `;
        return;
      }
      localStorage.setItem(CLIENT_ID_KEY, clientId);
      await redirectToSpotify(clientId);
    });
  }

  const disconnectButton = document.querySelector("#disconnect-spotify-button");
  if (disconnectButton) {
    disconnectButton.addEventListener("click", () => {
      sessionStorage.removeItem(TOKEN_KEY);
      renderMain(getStoredUser(), null);
    });
  }

  if (isSpotifyConnected) {
    await Promise.all([loadNowPlaying(token), loadRecentTracks(token)]);
  } else {
    document.querySelector("#history-list").innerHTML = demoHistory.map(renderTrackRow).join("");
  }

  bindMatchActions();
}

function renderMatchCard(match, isSpotifyConnected) {
  const isUnlocked = match.acceptCount >= 5;
  const recommendation = match.recommendation;
  const activeSearch = searchState?.matchId === match.id;

  return `
    <article class="match-card">
      <div>
        <strong>${escapeHtml(match.name)}</strong>
        <p>${escapeHtml(match.track)} - ${escapeHtml(match.artist)}</p>
      </div>
      <span>${isUnlocked ? "Social ID unlocked" : `Recommendation ${match.acceptCount}/5`}</span>
      ${renderSocialReveal(match, isUnlocked)}
      ${recommendation ? renderRecommendation(match) : ""}
      ${!recommendation ? renderRecommendationComposer(match, activeSearch, isSpotifyConnected) : ""}
      <small class="handle-line">${escapeHtml(isUnlocked ? "Instagram reveal available" : match.handle)}</small>
    </article>
  `;
}

function renderSocialReveal(match, isUnlocked) {
  const user = getStoredUser();
  if (!isUnlocked) {
    return `
      <div class="unlock-strip">
        <strong>${5 - match.acceptCount} accepts left</strong>
        <p>Instagram sharing unlocks after five accepted recommendations.</p>
      </div>
    `;
  }

  if (!user?.instagramId) {
    return `
      <div class="unlock-strip">
        <strong>Instagram ready</strong>
        <p>Add your Instagram ID in Profile before sending it to ${escapeHtml(match.name)}.</p>
      </div>
    `;
  }

  if (!user.shareInstagramOnUnlock) {
    return `
      <div class="unlock-strip">
        <strong>Instagram locked by you</strong>
        <p>Turn on the profile checkmark to send @${escapeHtml(user.instagramId)} to unlocked matches.</p>
      </div>
    `;
  }

  return `
    <div class="unlock-strip sent">
      <strong>Sent Instagram</strong>
      <p>@${escapeHtml(user.instagramId)} is visible to ${escapeHtml(match.name)}.</p>
    </div>
  `;
}

function renderProfilePage(user, token, message = "") {
  currentUser = ensureUserDefaults(user);
  currentSpotifyToken = token;

  app.innerHTML = `
    <section class="deck">
      <header class="topbar">
        <div>
          <p class="eyebrow">Cue profile</p>
          <h1>Your reveal settings</h1>
        </div>
        <div class="top-actions">
          <button class="ghost-button" id="back-to-main-button">Back</button>
          <button class="ghost-button" id="logout-button">Log out</button>
        </div>
      </header>

      <section class="profile-layout">
        <article class="profile-board">
          <div class="section-heading">
            <p class="eyebrow">Instagram ID</p>
            <h2>Share only after five accepts</h2>
          </div>
          <form class="profile-form" id="profile-form">
            <label for="instagram-id">Instagram ID</label>
            <input
              id="instagram-id"
              name="instagram-id"
              placeholder="your.instagram"
              value="${escapeHtml(currentUser.instagramId || "")}"
            />
            <label class="check-row">
              <input
                id="share-instagram"
                name="share-instagram"
                type="checkbox"
                ${currentUser.shareInstagramOnUnlock ? "checked" : ""}
              />
              <span>Send my Instagram ID to matched people after five accepted recommendations</span>
            </label>
            <button class="primary-button" type="submit">Save profile</button>
            ${message ? `<p class="success-message" role="status">${escapeHtml(message)}</p>` : ""}
          </form>
        </article>

        <aside class="profile-board">
          <div class="section-heading">
            <p class="eyebrow">Unlocked matches</p>
            <h2>Who can see it</h2>
          </div>
          <div class="profile-match-list">
            ${renderProfileMatchList()}
          </div>
        </aside>
      </section>
    </section>
  `;

  document.querySelector("#back-to-main-button").addEventListener("click", () => {
    renderMain(getStoredUser(), getStoredToken());
  });

  document.querySelector("#logout-button").addEventListener("click", () => {
    localStorage.removeItem(APP_USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    renderLogin();
  });

  document.querySelector("#profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const instagramId = normalizeInstagramId(document.querySelector("#instagram-id").value);
    const shareInstagramOnUnlock = document.querySelector("#share-instagram").checked;
    const nextUser = {
      ...getStoredUser(),
      instagramId,
      shareInstagramOnUnlock,
    };
    storeUser(nextUser);
    renderProfilePage(nextUser, getStoredToken(), "Instagram ID saved.");
  });
}

function renderProfileMatchList() {
  const user = getStoredUser();
  const unlockedMatches = getMatches().filter((match) => match.acceptCount >= 5);

  if (!unlockedMatches.length) {
    return `
      <div class="profile-match-card">
        <strong>No unlocked matches yet</strong>
        <p>Accept five recommendations with someone before Instagram sharing becomes available.</p>
      </div>
    `;
  }

  return unlockedMatches.map((match) => {
    const canShare = Boolean(user?.instagramId && user?.shareInstagramOnUnlock);
    return `
      <div class="profile-match-card">
        <strong>${escapeHtml(match.name)}</strong>
        <p>${canShare ? `Sent @${escapeHtml(user.instagramId)}` : "Instagram not sent yet"}</p>
      </div>
    `;
  }).join("");
}

function renderRecommendation(match) {
  const recommendation = match.recommendation;
  const timeLeft = getTimeLeft(recommendation.expiresAt);

  if (recommendation.direction === "incoming") {
    return `
      <div class="recommendation-box">
        <p class="eyebrow">Received song</p>
        <strong>${escapeHtml(recommendation.trackName)}</strong>
        <p>${escapeHtml(recommendation.artistName)} - ${escapeHtml(recommendation.albumName)}</p>
        <div class="due-card">
          <span>Due ${escapeHtml(formatDueDate(recommendation.expiresAt))}</span>
          <strong>${timeLeft} left</strong>
        </div>
        <div class="pipeline-actions">
          <button type="button" data-accept-reco="${escapeHtml(match.id)}">Accept</button>
          <button type="button" data-reject-reco="${escapeHtml(match.id)}">Reject</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="recommendation-box">
      <p class="eyebrow">Sent song</p>
      <strong>${escapeHtml(recommendation.trackName)}</strong>
      <p>${escapeHtml(recommendation.artistName)} - ${escapeHtml(recommendation.albumName)}</p>
      <div class="due-card">
        <span>Due ${escapeHtml(formatDueDate(recommendation.expiresAt))}</span>
        <strong>Waiting - ${timeLeft} left</strong>
      </div>
      <div class="pipeline-actions">
        <button type="button" data-sim-accept="${escapeHtml(match.id)}">Simulate accept</button>
        <button type="button" data-sim-reject="${escapeHtml(match.id)}">Simulate reject</button>
      </div>
    </div>
  `;
}

function renderRecommendationComposer(match, activeSearch, isSpotifyConnected) {
  if (!activeSearch) {
    return `
      <div class="recommend-row">
        <button type="button" data-open-search="${escapeHtml(match.id)}">Send song</button>
        <small>${isSpotifyConnected ? "Search Spotify catalog" : "Demo catalog until Spotify connects"}</small>
      </div>
    `;
  }

  return `
    <form class="song-search" data-search-form="${escapeHtml(match.id)}">
      <label for="song-search-${escapeHtml(match.id)}">Search song, album, or artist</label>
      <div class="search-row">
        <input
          id="song-search-${escapeHtml(match.id)}"
          value="${escapeHtml(searchState.query)}"
          placeholder="Try Digital Love or The Cure"
        />
        <button type="submit">Search</button>
      </div>
      <small>${isSpotifyConnected ? "Uses Spotify Search across tracks, albums, and artists." : "Demo mode: connect Spotify for live catalog search."}</small>
      ${searchState.message ? `<p class="hint">${escapeHtml(searchState.message)}</p>` : ""}
      <div class="search-results">
        ${searchState.results.map((item) => renderSearchResult(match.id, item)).join("")}
      </div>
      <button class="text-button" type="button" data-cancel-search="${escapeHtml(match.id)}">Cancel</button>
    </form>
  `;
}

function renderSearchResult(matchId, item) {
  const canSend = item.type === "track";
  const label = item.type === "track" ? "Send" : "Show songs";

  return `
    <div class="search-result">
      <div>
        <span>${escapeHtml(item.type)}</span>
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(item.artistName)} - ${escapeHtml(item.albumName || "Spotify catalog")}</p>
      </div>
      <button
        type="button"
        data-send-song="${escapeHtml(matchId)}"
        data-result-id="${escapeHtml(item.id)}"
        data-result-action="${canSend ? "send" : "expand"}"
      >${label}</button>
    </div>
  `;
}

function bindMatchActions() {
  document.querySelectorAll("[data-open-search]").forEach((button) => {
    button.addEventListener("click", () => {
      const isSpotifyConnected = Boolean(currentSpotifyToken);
      searchState = {
        matchId: button.dataset.openSearch,
        query: "",
        results: isSpotifyConnected ? [] : demoCatalog.slice(0, 4),
        message: isSpotifyConnected
          ? "Type a song, album, or artist to search Spotify."
          : "Demo mode: connect Spotify for live catalog search.",
      };
      rerenderMatches();
    });
  });

  document.querySelectorAll("[data-cancel-search]").forEach((button) => {
    button.addEventListener("click", () => {
      searchState = null;
      rerenderMatches();
    });
  });

  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const query = form.querySelector("input").value.trim();
      searchState = {
        ...searchState,
        query,
        message: "Searching...",
      };
      rerenderMatches();
      try {
        const results = await searchCatalog(query, currentSpotifyToken);
        searchState = {
          ...searchState,
          query,
          results,
          message: results.length ? "Choose a track to send, or open an album/artist." : "No results found.",
        };
      } catch (error) {
        searchState = {
          ...searchState,
          query,
          results: [],
          message: `Spotify search failed: ${error.message}`,
        };
      }
      rerenderMatches();
    });
  });

  document.querySelectorAll("[data-send-song]").forEach((button) => {
    button.addEventListener("click", async () => {
      const matchId = button.dataset.sendSong;
      const item = searchState?.results.find((result) => result.id === button.dataset.resultId);
      if (!item) return;

      if (button.dataset.resultAction === "expand") {
        try {
          const tracks = await expandCatalogItem(item, currentSpotifyToken);
          searchState = {
            ...searchState,
            results: tracks,
            message: tracks.length ? `Choose a song from ${item.name}.` : `No songs found for ${item.name}.`,
          };
        } catch (error) {
          searchState = {
            ...searchState,
            results: [],
            message: `Spotify lookup failed: ${error.message}`,
          };
        }
        rerenderMatches();
        return;
      }

      sendRecommendation(matchId, item);
    });
  });

  document.querySelectorAll("[data-accept-reco], [data-sim-accept]").forEach((button) => {
    button.addEventListener("click", () => acceptRecommendation(button.dataset.acceptReco || button.dataset.simAccept));
  });

  document.querySelectorAll("[data-reject-reco], [data-sim-reject]").forEach((button) => {
    button.addEventListener("click", () => rejectRecommendation(button.dataset.rejectReco || button.dataset.simReject));
  });
}

function rerenderMatches() {
  const matchList = document.querySelector("#match-list");
  if (!matchList) return;
  matchList.innerHTML = getMatches().map((match) => renderMatchCard(match, Boolean(currentSpotifyToken))).join("");
  bindMatchActions();
}

async function searchCatalog(query, token) {
  if (!query) return token ? [] : demoCatalog.slice(0, 4);

  if (!token) {
    const normalizedQuery = query.toLowerCase();
    return demoCatalog.filter((item) => {
      return [item.name, item.artistName, item.albumName].some((field) => field.toLowerCase().includes(normalizedQuery));
    });
  }

  try {
    const params = new URLSearchParams({
      q: query,
      type: "track,album,artist",
      limit: "5",
    });
    const response = await spotifyFetch(`/search?${params}`);
    if (!response.ok) throw await makeSpotifyError(response, "Spotify search failed.");

    const data = await response.json();
    return [
      ...data.tracks.items.map(mapSpotifyTrack),
      ...data.albums.items.map(mapSpotifyAlbum),
      ...data.artists.items.map(mapSpotifyArtist),
    ].slice(0, 8);
  } catch (error) {
    throw error;
  }
}

async function expandCatalogItem(item, token) {
  if (item.tracks) return item.tracks;
  if (!token) return demoCatalog.find((demoItem) => demoItem.id === item.id)?.tracks || [];

  try {
    if (item.type === "album") {
      const response = await spotifyFetch(`/albums/${item.spotifyId}/tracks?limit=8`);
      if (!response.ok) throw await makeSpotifyError(response, "Spotify album tracks failed.");
      const data = await response.json();
      return data.items.map((track) => ({
        id: track.id,
        spotifyId: track.id,
        type: "track",
        name: track.name,
        artistName: track.artists.map((artist) => artist.name).join(", "),
        albumName: item.name,
      }));
    }

    if (item.type === "artist") {
      const response = await spotifyFetch(`/artists/${item.spotifyId}/top-tracks?market=US`);
      if (!response.ok) throw await makeSpotifyError(response, "Spotify artist tracks failed.");
      const data = await response.json();
      return data.tracks.slice(0, 8).map(mapSpotifyTrack);
    }
  } catch (error) {
    throw error;
  }

  return [];
}

function sendRecommendation(matchId, track) {
  const matches = getMatches();
  const nextMatches = matches.map((match) => {
    if (match.id !== matchId) return match;
    return {
      ...match,
      recommendation: {
        id: `rec-${matchId}-${Date.now()}`,
        direction: "outgoing",
        status: "pending",
        trackName: track.name,
        artistName: track.artistName,
        albumName: track.albumName || "Spotify catalog",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      },
    };
  });
  saveMatches(nextMatches);
  searchState = null;
  rerenderMatches();
}

function acceptRecommendation(matchId) {
  const matches = getMatches();
  const nextMatches = matches.map((match) => {
    if (match.id !== matchId) return match;
    return {
      ...match,
      acceptCount: Math.min(5, match.acceptCount + 1),
      handle: match.acceptCount + 1 >= 5 ? "Instagram ID unlocked" : match.handle,
      recommendation: null,
    };
  });
  saveMatches(nextMatches);
  rerenderMatches();
}

function rejectRecommendation(matchId) {
  const nextMatches = getMatches().filter((match) => match.id !== matchId);
  saveMatches(nextMatches);
  searchState = null;
  rerenderMatches();
}

function getMatches() {
  const rawMatches = localStorage.getItem(MATCHES_KEY);
  const matches = rawMatches ? JSON.parse(rawMatches) : structuredClone(initialMatches);
  const activeMatches = matches
    .map((match) => {
      if (match.recommendation?.expiresAt < Date.now()) {
        return { ...match, recommendation: null };
      }
      return match;
    })
    .filter(Boolean);

  if (!rawMatches || JSON.stringify(activeMatches) !== JSON.stringify(matches)) {
    saveMatches(activeMatches);
  }

  return activeMatches;
}

function saveMatches(matches) {
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

function mapSpotifyTrack(track) {
  return {
    id: track.id,
    spotifyId: track.id,
    type: "track",
    name: track.name,
    artistName: track.artists.map((artist) => artist.name).join(", "),
    albumName: track.album?.name || "Spotify catalog",
  };
}

function mapSpotifyAlbum(album) {
  return {
    id: `album-${album.id}`,
    spotifyId: album.id,
    type: "album",
    name: album.name,
    artistName: album.artists.map((artist) => artist.name).join(", "),
    albumName: `${album.total_tracks} tracks`,
  };
}

function mapSpotifyArtist(artist) {
  return {
    id: `artist-${artist.id}`,
    spotifyId: artist.id,
    type: "artist",
    name: artist.name,
    artistName: artist.name,
    albumName: "Top tracks",
  };
}

function getTimeLeft(expiresAt) {
  const ms = Math.max(0, expiresAt - Date.now());
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours >= 24) return "1 day";
  if (hours <= 1) return "1 hour";
  return `${hours} hours`;
}

function formatDueDate(expiresAt) {
  return new Date(expiresAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadNowPlaying(token) {
  const target = document.querySelector("#now-playing");
  try {
    const response = await spotifyFetch("/me/player/currently-playing?market=from_token");

    if (response.status === 204) {
      target.innerHTML = `
        <p class="eyebrow">Current playback</p>
        <h2>No active playback</h2>
        <p>Spotify says there is no active playback for this account. Make sure the iOS Spotify app is playing from the same account you connected to Cue, then refresh.</p>
      `;
      return;
    }

    if (!response.ok) throw await makeSpotifyError(response, "Could not read Spotify playback.");

    const data = await response.json();
    const item = data.item;
    if (!item) {
      target.innerHTML = `
        <p class="eyebrow">Current playback</p>
        <h2>No track returned</h2>
        <p>Spotify returned playback data, but no playable track. Podcasts, local files, private sessions, or inactive devices may not appear here.</p>
      `;
      return;
    }

    target.innerHTML = `
      <p class="eyebrow">Current playback</p>
      <h2>${escapeHtml(item.name)}</h2>
      <p>${escapeHtml(item.artists.map((artist) => artist.name).join(", "))}</p>
      <small>${data.is_playing ? "Playing now" : "Paused"} - ${escapeHtml(data.currently_playing_type || "track")}</small>
      <div class="progress">
        <span style="width: ${Math.min(100, (data.progress_ms / item.duration_ms) * 100)}%"></span>
      </div>
    `;
  } catch (error) {
    target.innerHTML = `
      <p class="eyebrow">Current playback</p>
      <h2>Spotify playback unavailable</h2>
      <p>${escapeHtml(error.message)}</p>
      <p class="hint">Try disconnecting and reconnecting Spotify, confirm the Spotify account matches your iOS app, and turn off Spotify private session if it is enabled.</p>
    `;
  }
}

async function loadRecentTracks(token) {
  const target = document.querySelector("#history-list");
  try {
    const response = await spotifyFetch("/me/player/recently-played?limit=20");

    if (!response.ok) throw await makeSpotifyError(response, "Could not read Spotify history.");

    const data = await response.json();
    const tracks = data.items.map(({ track, played_at }) => [
      track.name,
      track.artists.map((artist) => artist.name).join(", "),
      new Date(played_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ]);
    target.innerHTML = tracks.map(renderTrackRow).join("");
  } catch (error) {
    target.innerHTML = `
      <div class="track-row">
        <span>API</span>
        <div>
          <strong>Spotify listening log unavailable</strong>
          <p>${escapeHtml(error.message)}</p>
        </div>
      </div>
    `;
  }
}

function renderTrackRow([title, artist, time]) {
  return `
    <div class="track-row">
      <span>${escapeHtml(time)}</span>
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(artist)}</p>
      </div>
    </div>
  `;
}

async function spotifyFetch(path, options = {}) {
  let token = await ensureFreshSpotifyToken();
  let response = await fetch(`${SPOTIFY_API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  if (response.status === 401 && token.refresh_token) {
    token = await refreshSpotifyToken(token);
    response = await fetch(`${SPOTIFY_API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token.access_token}`,
      },
    });
  }

  return response;
}

async function ensureFreshSpotifyToken() {
  const token = currentSpotifyToken || getStoredToken();
  if (!token) throw new Error("Spotify is not connected.");

  if (token.expires_at && Date.now() > token.expires_at - 60_000) {
    if (!token.refresh_token) {
      sessionStorage.removeItem(TOKEN_KEY);
      currentSpotifyToken = null;
      throw new Error("Spotify session expired. Disconnect and connect Spotify again.");
    }
    return refreshSpotifyToken(token);
  }

  return token;
}

async function refreshSpotifyToken(token) {
  const refreshToken = token.refresh_token;
  const clientId = getSpotifyClientId();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) throw await makeSpotifyError(response, "Spotify token refresh failed.");

  const nextToken = normalizeToken(await response.json(), token);
  storeSpotifyToken(nextToken);
  currentSpotifyToken = nextToken;
  return nextToken;
}

function normalizeToken(token, previousToken = {}) {
  return {
    ...previousToken,
    ...token,
    refresh_token: token.refresh_token || previousToken.refresh_token,
    expires_at: Date.now() + token.expires_in * 1000,
  };
}

function storeSpotifyToken(token) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  currentSpotifyToken = token;
}

async function makeSpotifyError(response, fallbackMessage) {
  let detail = "";
  try {
    const body = await response.clone().json();
    detail = body.error?.message || body.error_description || body.error || "";
  } catch (error) {
    detail = await response.text();
  }

  return new Error(`${fallbackMessage} (${response.status}${detail ? `: ${detail}` : ""})`);
}

async function redirectToSpotify(clientId) {
  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateRandomString(24);

  localStorage.setItem(VERIFIER_KEY, verifier);
  localStorage.setItem(STATE_KEY, state);

  const authUrl = new URL(SPOTIFY_AUTHORIZE_URL);
  authUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPE,
    redirect_uri: getRedirectUri(),
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
  }).toString();

  window.location.assign(authUrl.toString());
}

async function handleSpotifyCallback(params) {
  const user = getStoredUser();
  const spotifyError = params.get("error");
  if (spotifyError) {
    window.history.replaceState({}, document.title, window.location.pathname);
    if (!user) {
      renderLogin(`Spotify did not connect: ${spotifyError}`);
      return;
    }
    renderMain(user, null);
    const target = document.querySelector("#now-playing");
    if (target) {
      target.innerHTML = `
        <p class="eyebrow">Spotify authorization</p>
        <h2>Spotify did not connect</h2>
        <p>${escapeHtml(spotifyError)}</p>
      `;
    }
    return;
  }

  if (!user) {
    window.history.replaceState({}, document.title, window.location.pathname);
    renderLogin("Log in to Cue before connecting Spotify.");
    return;
  }

  const expectedState = localStorage.getItem(STATE_KEY);
  if (params.get("state") !== expectedState) {
    window.history.replaceState({}, document.title, window.location.pathname);
    renderMain(user, getStoredToken());
    return;
  }

  const clientId = localStorage.getItem(CLIENT_ID_KEY);
  const verifier = localStorage.getItem(VERIFIER_KEY);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.get("code"),
    redirect_uri: getRedirectUri(),
    client_id: clientId,
    code_verifier: verifier,
  });

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) throw await makeSpotifyError(response, "Token exchange failed.");

    const token = normalizeToken(await response.json());
    storeSpotifyToken(token);
    window.history.replaceState({}, document.title, window.location.pathname);
    renderMain(user, token);
  } catch (error) {
    window.history.replaceState({}, document.title, window.location.pathname);
    renderMain(user, null);
    const target = document.querySelector("#now-playing");
    if (target) {
      target.innerHTML = `
        <p class="eyebrow">Spotify authorization</p>
        <h2>Spotify token exchange failed</h2>
        <p>${escapeHtml(error.message)}</p>
        <p class="hint">Check that the redirect URI in Spotify Dashboard exactly matches <code>${escapeHtml(getRedirectUri())}</code>.</p>
      `;
    }
  }
}

function storeUser(user) {
  localStorage.setItem(APP_USER_KEY, JSON.stringify(ensureUserDefaults(user)));
}

function getStoredUser() {
  const rawUser = localStorage.getItem(APP_USER_KEY);
  if (!rawUser) return null;
  const user = ensureUserDefaults(JSON.parse(rawUser));
  localStorage.setItem(APP_USER_KEY, JSON.stringify(user));
  return user;
}

function ensureUserDefaults(user) {
  if (!user) return null;
  return {
    instagramId: "",
    shareInstagramOnUnlock: false,
    ...user,
  };
}

function normalizeInstagramId(value) {
  return value.trim().replace(/^@+/, "");
}

function getStoredToken() {
  const rawToken = sessionStorage.getItem(TOKEN_KEY);
  if (!rawToken) return null;
  const token = JSON.parse(rawToken);
  if (Date.now() > token.expires_at && !token.refresh_token) {
    sessionStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

function getRedirectUri() {
  return `${window.location.origin}/`;
}

function getSpotifyClientId() {
  return SPOTIFY_CLIENT_ID || localStorage.getItem(CLIENT_ID_KEY) || "";
}

function isDeveloperMode() {
  return localStorage.getItem(DEV_MODE_KEY) === "true";
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generateRandomString(length) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, value) => acc + possible[value % possible.length], "");
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
