const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("backend link is developer-gated", () => {
  const app = read("app.js");
  const backend = read("backend.js");
  assert.match(app, /DEV_MODE_KEY/);
  assert.match(app, /isDeveloperMode\(\) \? `<a class="ghost-link" href="\.\/backend\.html">Backend<\/a>` : ""/);
  assert.match(backend, /Backend console locked/);
  assert.match(backend, /params\.get\("dev"\) === "1"/);
});

test("spotify redirect URI uses site root", () => {
  const app = read("app.js");
  assert.match(app, /return `\$\{window\.location\.origin\}\/`;/);
});

test("profile save displays confirmation", () => {
  const app = read("app.js");
  const css = read("styles.css");
  assert.match(app, /Instagram ID saved\./);
  assert.match(app, /role="status"/);
  assert.match(css, /\.success-message/);
});

test("listening log supports twenty-plus scrollable rows", () => {
  const app = read("app.js");
  const css = read("styles.css");
  assert.match(app, /recently-played\?limit=20/);
  assert.match(app, /"Blinding Lights"/);
  assert.match(css, /\.track-list\s*{[\s\S]*max-height: 430px;[\s\S]*overflow-y: auto;/);
  assert.match(css, /::-webkit-scrollbar-thumb/);
});

test("major app features are present", () => {
  const app = read("app.js");
  assert.match(app, /Continue with Google/);
  assert.match(app, /Log out/);
  assert.match(app, /Connect Spotify/);
  assert.match(app, /Current playback/);
  assert.match(app, /Matched people/);
  assert.match(app, /Send song/);
  assert.match(app, /Accept/);
  assert.match(app, /Reject/);
});

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}
