// Temporary loopback-only credential capture for the approved staging tests.
// No secrets are logged, passed through shell history, or committed.
import http from "node:http";
import { randomBytes } from "node:crypto";
import { writeFile, readFile } from "node:fs/promises";
const ref = "cjtrnnpqwkorxwqhtjeq",
  origin = "http://127.0.0.1:24681";
const nonce = randomBytes(24).toString("hex");
const file = new URL("../.env.staging-acceptance.local", import.meta.url);
const server = http.createServer(async (req, res) => {
  const headers = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "content-security-policy":
      "default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
  };
  if (req.headers.host !== "127.0.0.1:24681") {
    res.writeHead(403, headers).end("Forbidden");
    return;
  }
  if (req.method === "GET" && req.url === "/") {
    res
      .writeHead(200, headers)
      .end(
        `<h1>Tifawave staging acceptance setup</h1><p>Only project ${ref}. Stored in an ignored owner-readable local file; never logged.</p><form method="post" action="/capture/${nonce}"><label>Staging Supabase server key <input type="password" name="service_key" autocomplete="off" required></label><button>Save staging test access</button></form>`,
      );
    return;
  }
  if (
    req.method !== "POST" ||
    req.url !== "/capture/" + nonce ||
    req.headers.origin !== origin
  ) {
    res.writeHead(403, headers).end("Forbidden");
    return;
  }
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 8192) {
      res.writeHead(413, headers).end("Too large");
      return;
    }
  }
  const value = new URLSearchParams(body).get("service_key") || "";
  if (!/^(sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_.-]+)$/.test(value)) {
    res.writeHead(400, headers).end("Use the staging server key.");
    return;
  }
  try {
    const check = await fetch(
      `https://${ref}.supabase.co/auth/v1/admin/users?page=1&per_page=1`,
      {
        headers: { apikey: value, authorization: "Bearer " + value },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!check.ok) throw Error("Wrong project or key");
    await check.body?.cancel();
    const pub = JSON.parse(
      await readFile(
        new URL("../work/staging-public.json", import.meta.url),
        "utf8",
      ),
    );
    await writeFile(
      file,
      `TIFAWAVE_ENV=staging\nTIFAWAVE_STAGING_PROJECT_REF=${ref}\nTIFAWAVE_PRODUCTION_PROJECT_REF=tuzefzcosvvhzffbxhpm\nNEXT_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${pub.key}\nSUPABASE_SERVICE_ROLE_KEY=${value}\n`,
      { mode: 0o600 },
    );
    res
      .writeHead(200, headers)
      .end(
        "<h1>Staging test access saved</h1><p>The key was verified against the isolated staging project. No secret is shown.</p>",
      );
  } catch {
    res
      .writeHead(400, headers)
      .end("Staging verification failed. Nothing was logged.");
  }
});
server.listen(24681, "127.0.0.1", () =>
  console.log("Staging credential form ready at " + origin),
);
