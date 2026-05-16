const test = require("node:test");
const assert = require("node:assert/strict");
const { createCueServer, normalizeTrack } = require("../server");

test("normalizes track names for matching", () => {
  assert.equal(normalizeTrack("Dynamite", ["BTS"]), "bts dynamite");
  assert.equal(normalizeTrack("  Sweet   Disposition!! ", ["The Temper Trap"]), "the temper trap sweet disposition");
});

test("health endpoint starts enabled", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const health = await getJson(`${baseUrl}/api/health`);
    assert.equal(health.enabled, true);
    assert.equal(health.activeHeartbeats, 0);
    assert.equal(health.activeMatches, 0);
  } finally {
    await close();
  }
});

test("toggle disables and enables API writes", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const disabled = await postJson(`${baseUrl}/api/toggle`, { enabled: false });
    assert.equal(disabled.enabled, false);

    const response = await fetch(`${baseUrl}/api/listening/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "alice", trackName: "Dynamite", artistNames: ["BTS"] }),
    });
    assert.equal(response.status, 503);

    const enabled = await postJson(`${baseUrl}/api/toggle`, { enabled: true });
    assert.equal(enabled.enabled, true);
  } finally {
    await close();
  }
});

test("same-song heartbeats create a match", async () => {
  const { baseUrl, close } = await startServer();
  try {
    const first = await postJson(`${baseUrl}/api/listening/heartbeat`, {
      userId: "alice",
      trackName: "Dynamite",
      artistNames: ["BTS"],
    });
    assert.equal(first.matches.length, 0);

    const second = await postJson(`${baseUrl}/api/listening/heartbeat`, {
      userId: "bob",
      trackName: "Dynamite",
      artistNames: ["BTS"],
    });
    assert.equal(second.matches.length, 1);
    assert.deepEqual(second.matches[0].userIds, ["alice", "bob"]);
    assert.equal(second.matches[0].normalizedTrackKey, "bts dynamite");

    const matches = await getJson(`${baseUrl}/api/matches`);
    assert.equal(matches.matches.length, 1);
  } finally {
    await close();
  }
});

test("recommendations include an expiry", async () => {
  const { baseUrl, close } = await startServer();
  try {
    await postJson(`${baseUrl}/api/listening/heartbeat`, {
      userId: "alice",
      trackName: "Dynamite",
      artistNames: ["BTS"],
    });
    await postJson(`${baseUrl}/api/listening/heartbeat`, {
      userId: "bob",
      trackName: "Dynamite",
      artistNames: ["BTS"],
    });
    const matches = await getJson(`${baseUrl}/api/matches`);
    const recommendation = await postJson(`${baseUrl}/api/recommendations`, {
      matchId: matches.matches[0].id,
      senderId: "alice",
      trackName: "Spring Day",
      artistNames: ["BTS"],
    });

    assert.equal(recommendation.match.recommendation.status, "pending");
    assert.ok(Date.parse(recommendation.match.recommendation.expiresAt));
  } finally {
    await close();
  }
});

function startServer() {
  const server = createCueServer();
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

async function getJson(url) {
  const response = await fetch(url);
  assert.ok(response.ok, `${url} returned ${response.status}`);
  return response.json();
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.ok(response.ok, `${url} returned ${response.status}`);
  return response.json();
}
