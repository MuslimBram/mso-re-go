import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "crypto";

const REDIRECT_URI = "https://rrogozhina-guide.com/api/public/gsv-oauth-callback";

function page(title: string, body: string) {
  return new Response(
    `<!doctype html><html lang="sq"><head><meta charset="utf-8"/>
<title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
 body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#0f172a;background:#f8fafc}
 h1{font-size:20px;margin:0 0 8px} h2{font-size:15px;margin:24px 0 6px}
 .card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:14px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
 code,input{font-family:ui-monospace,monospace;font-size:13px}
 input{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:6px;background:#f1f5f9}
 button{padding:8px 12px;border:0;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;font-size:13px;margin-top:8px}
 button:hover{background:#1d4ed8}
 .err{background:#fef2f2;border-color:#fecaca;color:#991b1b}
 .ok{background:#ecfdf5;border-color:#bbf7d0;color:#065f46}
 ol{padding-left:20px;line-height:1.6;font-size:14px}
 .muted{color:#64748b;font-size:12px;margin-top:6px}
</style></head><body>${body}
<script>
function copy(id){const el=document.getElementById(id);el.select();document.execCommand('copy');event.target.textContent='Kopjuar ✓';setTimeout(()=>event.target.textContent='Kopjo',1500)}
</script>
</body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export const Route = createFileRoute("/api/public/gsv-oauth-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const start = url.searchParams.get("start");

        const clientId = process.env.GOOGLE_GSV_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_GSV_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          return page("OAuth — config mungon", `<div class="card err"><h1>Mungojnë sekretet</h1>
<p>GOOGLE_GSV_CLIENT_ID ose GOOGLE_GSV_CLIENT_SECRET nuk janë konfiguruar në Lovable Cloud.</p></div>`);
        }

        // Step 1: kick off the flow → redirect to Google.
        if (start === "1" && !code) {
          const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          auth.searchParams.set("client_id", clientId);
          auth.searchParams.set("redirect_uri", REDIRECT_URI);
          auth.searchParams.set("response_type", "code");
          auth.searchParams.set("access_type", "offline");
          auth.searchParams.set("prompt", "consent");
          auth.searchParams.set("include_granted_scopes", "true");
          auth.searchParams.set("scope", "https://www.googleapis.com/auth/streetviewpublish");
          return Response.redirect(auth.toString(), 302);
        }

        if (error) {
          return page("OAuth gabim", `<div class="card err"><h1>Google ktheu gabim</h1><p><code>${error}</code></p></div>`);
        }

        if (!code) {
          return page("OAuth — Connect Street View", `
<div class="card"><h1>Lidh Google Street View</h1>
<p>Kliko butonin më poshtë për të autorizuar këtë aplikacion të publikojë panorama në llogarinë tënde Google Street View.</p>
<p class="muted">Redirect URI: <code>${REDIRECT_URI}</code></p>
<a href="?start=1"><button>Vazhdo me Google →</button></a></div>`);
        }

        // Step 2: exchange code → refresh_token.
        const body = new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        });
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const json = (await res.json()) as {
          refresh_token?: string;
          access_token?: string;
          error?: string;
          error_description?: string;
        };

        if (!res.ok || !json.refresh_token) {
          return page("OAuth — dështoi shkëmbimi", `<div class="card err">
<h1>Nuk u mor refresh_token</h1>
<p><code>${json.error ?? "unknown"}: ${json.error_description ?? ""}</code></p>
<p class="muted">Nëse pe vetëm access_token, kliko Connect përsëri — duhet "prompt=consent" + "access_type=offline" (të dyja janë vendosur këtu, por Google e dërgon refresh_token vetëm herën e parë ose pas "prompt=consent").</p>
</div>`);
        }

        const workerToken = randomBytes(32).toString("hex");

        return page("OAuth — Sukses", `
<div class="card ok"><h1>✓ Lidhja u krye me sukses</h1>
<p>Tani ruaj këto dy vlera si <b>secrets</b> në Lovable Cloud. Asnjëra nuk ruhet në databazë.</p></div>

<div class="card"><h2>1. GOOGLE_GSV_REFRESH_TOKEN</h2>
<input id="rt" type="password" readonly value="${json.refresh_token.replace(/"/g, "&quot;")}"/>
<button onclick="copy('rt')">Kopjo</button>
<p class="muted">Shkruaj në chat-in e Lovable: "Ruaje GOOGLE_GSV_REFRESH_TOKEN" dhe ngjite vlerën në formën e sigurt që do të shfaqet.</p></div>

<div class="card"><h2>2. GSV_WORKER_TOKEN <span class="muted">(u gjenerua tani, 32 bytes)</span></h2>
<input id="wt" type="password" readonly value="${workerToken}"/>
<button onclick="copy('wt')">Kopjo</button>
<p class="muted">Po ashtu shkruaj: "Ruaje GSV_WORKER_TOKEN" dhe ngjite këtë vlerë.</p></div>

<div class="card"><h2>Pas ruajtjes</h2>
<ol>
<li>Mbylle këtë faqe — vlerat nuk shfaqen më kurrë.</li>
<li>Worker-i te <code>/api/public/gsv-worker</code> do të aktivizohet automatikisht.</li>
<li>Refresh-token rinovon access-token-in vetë çdo orë — pa ri-autorizim.</li>
</ol></div>`);
      },
    },
  },
});