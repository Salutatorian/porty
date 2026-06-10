import http from "http";

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:3000${path}`, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, body })
        );
      })
      .on("error", reject);
  });
}

const tests = [];

function assert(name, ok, detail) {
  tests.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const home = await get("/");
assert("home returns 200", home.status === 200, `status ${home.status}`);
assert(
  "experience section present",
  home.body.includes('id="experience"') && home.body.includes("afterquery")
);
assert(
  "experience copy present",
  home.body.includes("Software Engineering") &&
    home.body.includes("Project S")
);
assert("home-projects.js loaded", home.body.includes("home-projects.js"));
assert("writing link removed from home", !home.body.includes('href="/writing"'));

const admin = await get("/admin");
assert("admin returns 200", admin.status === 200, `status ${admin.status}`);
assert("home project form in admin", admin.body.includes('id="home-project-form"'));
assert("admin uses home-projects API", admin.body.includes("/api/home-projects"));
assert("settings form fixed", admin.body.includes('id="studio-settings-form"'));
assert(
  "writing tab removed",
  !admin.body.includes('data-studio-pane="writing"')
);

const hp = await get("/api/home-projects");
assert(
  "home-projects API JSON",
  hp.status === 200 && hp.body.includes('"items"'),
  `status ${hp.status}`
);

let projects = [];
try {
  projects = JSON.parse(hp.body).items || [];
} catch (e) {
  assert("home-projects parse", false, e.message);
}
assert("home-projects has seed", projects.length >= 1, `count ${projects.length}`);

// Browser-side checks via minimal DOM parse (no jsdom — string checks on admin script)
assert(
  "admin defines loadHomeProjectsForManage",
  admin.body.includes("function loadHomeProjectsForManage")
);
assert(
  "admin openDashboard calls home projects",
  admin.body.includes("loadHomeProjectsForManage()")
);

const failed = tests.filter((t) => !t.ok).length;
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
