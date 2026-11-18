// Lembretes com o app fechado (Web Push).
// Para o servidor vão só: um código aleatório deste aparelho, o endereço de entrega do navegador
// e os horários (em UTC). Os nomes das práticas ficam só aqui, numa "agenda" que o service worker lê
// para escrever o texto do aviso.

// Endereço do servidor de lembretes (Cloudflare). Vazio = recurso desligado.
export const PUSH_URL = "https://anjo-lembretes.anjo-eywa.workers.dev";

const b64uToU8 = (s) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

/** Por que os lembretes com o app fechado não estão disponíveis (ou "" se estão). */
export function pushBlocker() {
  if (!PUSH_URL) return "em-configuracao";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return isIOS() && !standalone() ? "instalar-ios" : "navegador";
  if (location.protocol !== "https:") return "navegador";
  return "";
}

/** Guarda neste aparelho a agenda que o service worker usa para escrever o aviso. */
export async function saveAgenda(items) {
  try {
    const c = await caches.open("anjo-agenda");
    await c.put(new URL("agenda.json", location.href).href, new Response(JSON.stringify({ items, salvo: Date.now() }), { headers: { "Content-Type": "application/json" } }));
  } catch (e) {}
}

/** Inscreve este aparelho (se preciso) e envia os horários ao servidor. */
export async function syncPush(id, times) {
  if (pushBlocker()) return { ok: false, motivo: pushBlocker() };
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const r = await fetch(PUSH_URL + "/chave");
    const { publicKey } = await r.json();
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToU8(publicKey) });
  }
  const res = await fetch(PUSH_URL + "/inscrever", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, subscription: { endpoint: sub.endpoint }, tz: new Date().getTimezoneOffset(), times }),
  });
  return { ok: res.ok };
}

/** Desliga: cancela a inscrição no navegador e apaga tudo deste aparelho no servidor. */
export async function stopPush(id) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch (e) {}
  try { if (PUSH_URL) await fetch(PUSH_URL + "/cancelar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); } catch (e) {}
}
