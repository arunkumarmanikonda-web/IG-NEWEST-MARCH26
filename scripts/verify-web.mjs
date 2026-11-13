import fs from "node:fs";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
const origin = "http://127.0.0.1:3100";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Test server did not start")),
      20000,
    );
    server.stdout.on("data", (d) => {
      if (d.toString().includes("Ready in")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("error", reject);
    server.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("Test server exited " + code));
    });
  });
  await Promise.all(
    [
      "/login",
      "/register",
      "/privacy",
      "/data-usage",
      "/opportunities",
      "/insights",
    ].map(async (path) => {
      const r = await fetch(origin + path);
      assert.equal(r.status, 200);
      console.log("PASS route " + path);
    }),
  );
  const post = (path, p, headers = {}) =>
    fetch(origin + path, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(p),
    });
  assert.equal(
    (await post("/api/portal/action", {}, { Origin: "https://evil.example" }))
      .status,
    403,
  );
  console.log("PASS website cross-origin mutation denied");
  const anonymous = await fetch(origin + "/admin", { redirect: "manual" });
  assert.equal(anonymous.status, 307);
  assert.ok(anonymous.headers.get("location").includes("/login"));
  console.log("PASS anonymous admin redirects to login");
  const fixture = JSON.parse(
    fs.readFileSync(process.env.IG_QA_FIXTURES, "utf8"),
  ).find((x) => x.role === "client");
  const r = await post("/api/portal/auth", {
    action: "signin",
    email: fixture.email,
    password: fixture.password,
  });
  assert.equal(r.status, 200, r.status === 200 ? "" : await r.text());
  const cookies = r.headers.getSetCookie();
  assert.ok(cookies.length);
  const cookie = cookies.map((c) => c.split(";")[0]).join("; ");
  const page = await fetch(origin + "/account", {
    headers: { Cookie: cookie },
  });
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes("Your account."));
  console.log("PASS real sign-in creates SSR cookies and renders account");
  assert.equal(
    (
      await post(
        "/api/portal/action",
        {
          module: "users",
          payload: {
            action: "invite",
            email: "blocked@example.invalid",
            roles: ["owner"],
          },
        },
        { Cookie: cookie },
      )
    ).status,
    403,
  );
  console.log("PASS client cannot mutate users through website API");
  assert.equal(
    (await post("/api/portal/auth", { action: "signout" }, { Cookie: cookie }))
      .status,
    200,
  );
  console.log("PASS website logout");
  const p = {
    name: "Temporary website test",
    email: "qa-web@example.invalid",
    organisation: "Disposable QA",
    phone: "",
    practice: "QA verification",
    message: "Temporary website integration test; remove after verification.",
    request_id: crypto.randomUUID(),
    privacy: true,
  };
  const first = await post("/api/enquiries", p);
  assert.equal(first.status, 200);
  const saved = await first.json();
  assert.equal(saved.saved, true);
  assert.equal(saved.email_status, "awaiting_provider");
  const repeat = await post("/api/enquiries", p);
  assert.equal((await repeat.json()).id, saved.id);
  console.log(
    "PASS website enquiry persists once and reports pending delivery",
  );
  console.log("Verified 12 website checks. No customer emails sent.");
} finally {
  server.kill("SIGTERM");
}
