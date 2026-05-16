const http = require("http");
const fs = require("fs");
const path = require("path");

const DEFAULT_PORT = Number(process.env.PORT || 5173);
const DEFAULT_HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const HEARTBEAT_TTL_MS = 120_000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function createCueServer() {
  const state = {
    apiEnabled: true,
    heartbeats: new Map(),
    matches: new Map(),
  };

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);

      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url, state);
        return;
      }

      serveStatic(response, url.pathname);
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  });

  server.state = state;
  return server;
}

async function handleApi(request, response, url, state) {
  if (url.pathname === "/api/health" && request.method === "GET") {
    cleanupExpiredHeartbeats(state);
    sendJson(response, 200, {
      enabled: state.apiEnabled,
      now: new Date().toISOString(),
      heartbeatTtlMs: HEARTBEAT_TTL_MS,
      activeHeartbeats: state.heartbeats.size,
      activeMatches: state.matches.size,
    });
    return;
  }

  if (url.pathname === "/api/toggle" && request.method === "POST") {
    const body = await readJson(request);
    state.apiEnabled = Boolean(body.enabled);
    sendJson(response, 200, { enabled: state.apiEnabled });
    return;
  }

  if (!state.apiEnabled) {
    sendJson(response, 503, { error: "Cue local API is disabled." });
    return;
  }

  if (url.pathname === "/api/listening/heartbeat" && request.method === "POST") {
    const body = await readJson(request);
    const heartbeat = createHeartbeat(body);
    state.heartbeats.set(heartbeat.userId, heartbeat);
    createMatchesForHeartbeat(heartbeat, state);
    cleanupExpiredHeartbeats(state);
    sendJson(response, 201, {
      heartbeat,
      matches: getMatchesForUser(heartbeat.userId, state),
    });
    return;
  }

  if (url.pathname === "/api/matches" && request.method === "GET") {
    cleanupExpiredHeartbeats(state);
    const userId = url.searchParams.get("userId");
    sendJson(response, 200, {
      matches: userId ? getMatchesForUser(userId, state) : Array.from(state.matches.values()),
    });
    return;
  }

  if (url.pathname === "/api/recommendations" && request.method === "POST") {
    const body = await readJson(request);
    const match = state.matches.get(body.matchId);
    if (!match) {
      sendJson(response, 404, { error: "Match not found." });
      return;
    }
    match.recommendation = {
      id: `rec-${Date.now()}`,
      senderId: body.senderId,
      trackName: body.trackName,
      artistNames: body.artistNames || [],
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    sendJson(response, 201, { match });
    return;
  }

  sendJson(response, 404, { error: "API route not found." });
}

function createHeartbeat(body) {
  const userId = String(body.userId || "").trim();
  const trackName = String(body.trackName || "").trim();
  const artistNames = Array.isArray(body.artistNames) ? body.artistNames : [body.artistName || "Unknown Artist"];

  if (!userId || !trackName) {
    throw new Error("Heartbeat requires userId and trackName.");
  }

  const normalizedTrackKey = normalizeTrack(trackName, artistNames);
  return {
    userId,
    provider: body.provider || "demo",
    providerTrackId: body.providerTrackId || normalizedTrackKey,
    normalizedTrackKey,
    trackName,
    artistNames,
    reportedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + HEARTBEAT_TTL_MS).toISOString(),
  };
}

function createMatchesForHeartbeat(heartbeat, state) {
  for (const other of state.heartbeats.values()) {
    if (other.userId === heartbeat.userId) continue;
    if (other.normalizedTrackKey !== heartbeat.normalizedTrackKey) continue;

    const matchId = [heartbeat.userId, other.userId, heartbeat.normalizedTrackKey].sort().join(":");
    if (!state.matches.has(matchId)) {
      state.matches.set(matchId, {
        id: matchId,
        userIds: [heartbeat.userId, other.userId].sort(),
        normalizedTrackKey: heartbeat.normalizedTrackKey,
        trackName: heartbeat.trackName,
        artistNames: heartbeat.artistNames,
        status: "active",
        acceptedRecommendationCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

function getMatchesForUser(userId, state) {
  return Array.from(state.matches.values()).filter((match) => match.userIds.includes(userId));
}

function cleanupExpiredHeartbeats(state) {
  const now = Date.now();
  for (const [userId, heartbeat] of state.heartbeats.entries()) {
    if (new Date(heartbeat.expiresAt).getTime() <= now) {
      state.heartbeats.delete(userId);
    }
  }
}

function normalizeTrack(trackName, artistNames) {
  return `${artistNames.join(" ")} ${trackName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function serveStatic(response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT, requestedPath));

  if (!filePath.startsWith(ROOT)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    const type = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    response.end(data);
  });
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data, null, 2));
}

function sendText(response, status, text) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(text);
}

if (require.main === module) {
  const server = createCueServer();
  server.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
    console.log(`Cue local server running at http://${DEFAULT_HOST}:${DEFAULT_PORT}/`);
    console.log(`Backend page: http://${DEFAULT_HOST}:${DEFAULT_PORT}/backend.html`);
  });
}

module.exports = {
  createCueServer,
  normalizeTrack,
};
