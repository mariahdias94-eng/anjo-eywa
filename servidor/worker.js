// Servidor de lembretes do ANJO (Cloudflare Worker + banco D1).
//
// O que guarda: um código aleatório por aparelho, o endereço de entrega de avisos do navegador
// e os horários dos lembretes (em UTC). NÃO guarda nome, e-mail, plano, práticas nem dados de saúde.
// O que faz: a cada minuto, manda um aviso vazio para os aparelhos com lembrete naquele horário.
// O próprio aparelho decide o texto do aviso, a partir do plano guardado nele.
//
// As chaves de assinatura dos avisos (VAPID) são criadas pelo próprio servidor na primeira vez
// e ficam só no banco dele. Ninguém precisa copiar ou colar chave nenhuma.

const PUSH_HOSTS = [/\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /\.notify\.windows\.com$/];
const KINDS = new Set(["pausa", "convite", "ck"]);
const ID = /^[a-f0-9]{32}$/;
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uStr = (s) => b64u(enc.encode(s));

let schemaReady = false;
async function schema(env) {
  if (schemaReady) return;
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS config (k TEXT PRIMARY KEY, v TEXT NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS subs (id TEXT PRIMARY KEY, sub TEXT NOT NULL, tz INTEGER NOT NULL, updated INTEGER NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS times (id TEXT NOT NULL, hhmm TEXT NOT NULL, kind TEXT NOT NULL, skip TEXT, PRIMARY KEY (id, hhmm, kind))"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS times_hhmm ON times (hhmm)"),
  ]);
  schemaReady = true;
}

let keyCache = null;
async function vapid(env) {
  if (keyCache) return keyCache;
  await schema(env);
  let row = await env.DB.prepare("SELECT v FROM config WHERE k = 'vapid'").first();
  if (!row) {
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const priv = await crypto.subtle.exportKey("jwk", kp.privateKey);
    const pub = b64u(await crypto.subtle.exportKey("raw", kp.publicKey));
    await env.DB.prepare("INSERT OR IGNORE INTO config (k, v) VALUES ('vapid', ?)").bind(JSON.stringify({ priv, pub })).run();
    row = await env.DB.prepare("SELECT v FROM config WHERE k = 'vapid'").first();
  }
  const { priv, pub } = JSON.parse(row.v);
  const key = await crypto.subtle.importKey("jwk", priv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  keyCache = { key, pub };
  return keyCache;
}

async function vapidHeader(env, endpoint) {
  const { key, pub } = await vapid(env);
  const head = b64uStr(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const body = b64uStr(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: env.VAPID_SUB || "https://mariahdias94-eng.github.io/anjo-eywa/",
  }));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + body));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${pub}`;
}

function corsHeaders(env, req) {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] || "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
const json = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...h } });

async function removeDevice(env, id) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM times WHERE id = ?").bind(id),
    env.DB.prepare("DELETE FROM subs WHERE id = ?").bind(id),
  ]);
}

export default {
  async fetch(req, env) {
    const h = corsHeaders(env, req);
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    const url = new URL(req.url);
    try {
      // chave pública para o navegador se inscrever
      if (url.pathname === "/chave" && req.method === "GET") {
        const { pub } = await vapid(env);
        return json({ publicKey: pub }, 200, h);
      }
      // inscrever ou atualizar os horários de um aparelho
      if (url.pathname === "/inscrever" && req.method === "POST") {
        const b = await req.json();
        if (!ID.test(b.id || "")) return json({ erro: "id" }, 400, h);
        const s = b.subscription || {};
        let host = "";
        try { host = new URL(s.endpoint).hostname; } catch (e) {}
        if (!s.endpoint || !s.endpoint.startsWith("https://") || !PUSH_HOSTS.some((r) => r.test(host))) return json({ erro: "endpoint" }, 400, h);
        const tz = Number.isInteger(b.tz) && Math.abs(b.tz) <= 840 ? b.tz : 0;
        const times = (Array.isArray(b.times) ? b.times : []).slice(0, 40).filter((t) => t && /^\d\d:\d\d$/.test(t.h) && KINDS.has(t.k));
        await schema(env);
        const st = [
          env.DB.prepare("INSERT INTO subs (id, sub, tz, updated) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET sub = excluded.sub, tz = excluded.tz, updated = excluded.updated")
            .bind(b.id, JSON.stringify({ endpoint: s.endpoint }), tz, Date.now()),
          env.DB.prepare("DELETE FROM times WHERE id = ?").bind(b.id),
        ];
        for (const t of times) {
          st.push(env.DB.prepare("INSERT OR IGNORE INTO times (id, hhmm, kind, skip) VALUES (?, ?, ?, ?)")
            .bind(b.id, t.h, t.k, /^\d{4}-\d\d-\d\d$/.test(t.skip || "") ? t.skip : null));
        }
        await env.DB.batch(st);
        return json({ ok: true, lembretes: times.length }, 200, h);
      }
      // apagar tudo de um aparelho
      if (url.pathname === "/cancelar" && req.method === "POST") {
        const b = await req.json();
        if (!ID.test(b.id || "")) return json({ erro: "id" }, 400, h);
        await schema(env);
        await removeDevice(env, b.id);
        return json({ ok: true }, 200, h);
      }
      if (url.pathname === "/" && req.method === "GET") return json({ servico: "lembretes do ANJO", ok: true }, 200, h);
      return json({ erro: "rota" }, 404, h);
    } catch (e) {
      return json({ erro: "servidor" }, 500, h);
    }
  },

  // roda a cada minuto (configurado em wrangler.toml)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDue(env, new Date(event.scheduledTime)));
  },
};

async function sendDue(env, now) {
  await schema(env);
  const hhmm = String(now.getUTCHours()).padStart(2, "0") + ":" + String(now.getUTCMinutes()).padStart(2, "0");
  const { results } = await env.DB.prepare("SELECT s.id, s.sub, s.tz, t.skip FROM times t JOIN subs s ON s.id = t.id WHERE t.hhmm = ?").bind(hhmm).all();
  const sent = new Set();
  for (const r of results || []) {
    if (sent.has(r.id)) continue;
    const localDate = new Date(now.getTime() - r.tz * 60000).toISOString().slice(0, 10);
    if (r.skip === localDate) continue;
    sent.add(r.id);
    try {
      const { endpoint } = JSON.parse(r.sub);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { TTL: "600", Urgency: "high", Authorization: await vapidHeader(env, endpoint), "Content-Length": "0" },
      });
      // aparelho desinstalou ou recusou: apaga tudo dele
      if (res.status === 404 || res.status === 410) await removeDevice(env, r.id);
    } catch (e) {}
  }
}
