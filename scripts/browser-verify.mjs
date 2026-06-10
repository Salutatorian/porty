/**
 * Headless browser checks — run: node scripts/browser-verify.mjs
 * Requires: npx playwright install chromium (one-time)
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const failures = [];

function fail(msg) {
  failures.push(msg);
  console.error("FAIL", msg);
}

function pass(msg) {
  console.log("PASS", msg);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on("pageerror", (err) => consoleErrors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

// ---- Home page ----
await page.goto(BASE + "/", { waitUntil: "networkidle" });

const exp = page.locator("#experience");
if ((await exp.count()) !== 1) fail("experience section missing");
else pass("experience section in DOM");

const expText = await exp.innerText();
if (!/afterquery/i.test(expText)) fail("afterquery not visible");
else pass("afterquery visible");

if (!/Software Engineering/i.test(expText)) fail("role title not visible");
else pass("role title visible");

if (!/Project S/i.test(expText)) fail("description not visible");
else pass("description visible");

// Collapse / expand experience accordion
const details = page.locator(".home-experience-role");
if ((await details.count()) < 1) fail("experience details element missing");
else {
  await details.evaluate((el) => el.removeAttribute("open"));
  const hidden = await page.locator(".home-experience-role-body").isHidden();
  if (!hidden) fail("experience accordion collapse");
  else pass("experience accordion collapses");

  await page.locator(".home-experience-role-summary").click();
  const visible = await page.locator(".home-experience-role-body").isVisible();
  if (!visible) fail("experience accordion expand");
  else pass("experience accordion expands");
}

// Home projects API render
await page.waitForFunction(
  () => {
    const root = document.getElementById("home-projects-root");
    if (!root) return false;
    const panel = root.querySelector("#home-panel-current");
    return panel && panel.innerHTML.trim().length > 0;
  },
  { timeout: 8000 }
);
const projectCards = await page.locator(".home-project-card").count();
if (projectCards < 1) fail(`expected home project cards, got ${projectCards}`);
else pass(`home projects rendered (${projectCards} card(s))`);

// ---- Admin page (no login — static shell + script parse) ----
await page.goto(BASE + "/admin", { waitUntil: "networkidle" });

const loginShell = page.locator("#studio-login-shell");
if ((await loginShell.count()) !== 1) fail("admin login shell missing");
else pass("admin login shell present");

const homeForm = page.locator("#home-project-form");
if ((await homeForm.count()) !== 1) fail("admin home project form missing");
else pass("admin home project form in DOM");

const settingsForm = page.locator("#studio-settings-form");
if ((await settingsForm.count()) !== 1) fail("admin settings form missing");
else pass("admin settings form in DOM");

const writingTab = page.locator('[data-studio-pane="writing"]');
if ((await writingTab.count()) !== 0) fail("writing tab still in admin");
else pass("writing tab removed from admin");

// Filter console errors — ignore favicon / network noise
const critical = consoleErrors.filter(
  (e) =>
    !/favicon/i.test(e) &&
    !/Failed to load resource/i.test(e) &&
    !/404/.test(e) &&
    !/GITHUB_TOKEN/i.test(e) &&
    !/GitHub contributions/i.test(e)
);
if (critical.length) {
  critical.forEach((e) => fail(`console: ${e}`));
} else pass("no critical console errors on home + admin");

await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} browser check(s) failed`);
  process.exit(1);
}
console.log("\nAll browser checks passed");
