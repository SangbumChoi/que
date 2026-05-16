const healthOutput = document.querySelector("#health-output");
const matchesOutput = document.querySelector("#matches-output");
const statusLight = document.querySelector("#status-light");
const refreshButton = document.querySelector("#refresh-button");
const toggleButton = document.querySelector("#toggle-button");
const heartbeatForm = document.querySelector("#heartbeat-form");

let apiEnabled = false;

if (!isDeveloperAccessAllowed()) {
  document.body.innerHTML = `
    <main class="deck backend-shell">
      <section class="profile-board">
        <p class="eyebrow">Developer only</p>
        <h1>Backend console locked</h1>
        <p class="lede">Open the main app as a normal user. Developers can use this console locally or with <code>?dev=1</code>.</p>
      </section>
    </main>
  `;
  throw new Error("Backend console requires developer access.");
}

refreshButton.addEventListener("click", refreshBackend);
toggleButton.addEventListener("click", async () => {
  await fetch("/api/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: !apiEnabled }),
  });
  await refreshBackend();
});

heartbeatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    userId: document.querySelector("#user-id").value.trim(),
    trackName: document.querySelector("#track-name").value.trim(),
    artistNames: [document.querySelector("#artist-name").value.trim()],
  };
  const response = await fetch("/api/listening/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  matchesOutput.textContent = JSON.stringify(data, null, 2);
  await refreshBackend();
});

refreshBackend();

async function refreshBackend() {
  try {
    const health = await fetchJson("/api/health");
    const matches = await fetchJson("/api/matches");
    apiEnabled = health.enabled;
    statusLight.classList.toggle("is-on", apiEnabled);
    toggleButton.textContent = apiEnabled ? "Disable API" : "Enable API";
    healthOutput.textContent = JSON.stringify(health, null, 2);
    matchesOutput.textContent = JSON.stringify(matches, null, 2);
  } catch (error) {
    apiEnabled = false;
    statusLight.classList.remove("is-on");
    toggleButton.textContent = "API unavailable";
    healthOutput.textContent = `Local API unavailable.\n\nRun:\nnode server.js\n\n${error.message}`;
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

function isDeveloperAccessAllowed() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("dev") === "1") {
    localStorage.setItem("cue.dev.enabled", "true");
    return true;
  }

  return window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost" ||
    localStorage.getItem("cue.dev.enabled") === "true";
}
