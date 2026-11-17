// Armazenamento dos dados da pessoa NESTE aparelho.
// Sem PIN: os dados ficam no armazenamento do navegador, como texto.
// Com PIN: os dados ficam criptografados (AES-GCM de 256 bits). A chave sai do PIN (PBKDF2, SHA-256,
// 210 mil repetições) e só existe na memória enquanto o app está destravado. O PIN nunca é guardado.
//
// Esta é a solução do MVP, não a definitiva. Na versão com contas, este módulo é trocado por um que
// fala com o servidor, mantendo a mesma interface (load, save, hasPin, unlock, lock, setPin, removePin, wipe).

const enc = new TextEncoder();
const dec = new TextDecoder();
const ITER = 210000;
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(pin, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * @param {string} ns  prefixo das chaves (o site oficial e a prévia usam prefixos diferentes)
 * @param {object} opts legacyKeys: chaves antigas a migrar; deleteLegacyOnPin: apagar as cópias antigas em texto ao criar o PIN
 */
export function createStore(ns, { legacyKeys = [], deleteLegacyOnPin = false } = {}) {
  const KEY = ns + ":dados";
  const TRIES = ns + ":tentativas";
  let key = null;
  let salt = null;

  const read = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const del = (k) => { try { localStorage.removeItem(k); } catch (e) {} };
  const record = () => { try { return JSON.parse(read(KEY) || "null"); } catch (e) { return null; } };

  async function writeEncrypted(state) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(state)));
    return write(KEY, JSON.stringify({ v: 2, enc: true, salt: b64(salt), iv: b64(iv), data: b64(ct) }));
  }

  return {
    available: !!(window.crypto && crypto.subtle),
    hasPin() { const r = record(); return !!(r && r.enc); },
    isLocked() { return this.hasPin() && !key; },

    /** Lê os dados. Na primeira vez, copia os dados da versão anterior do app. */
    async load() {
      let r = record();
      if (!r) {
        for (const lk of legacyKeys) {
          const old = read(lk);
          if (old) { try { write(KEY, JSON.stringify({ v: 2, enc: false, data: JSON.parse(old) })); } catch (e) {} break; }
        }
        r = record();
      }
      if (!r) return null;
      if (!r.enc) return r.data;
      if (!key) throw new Error("bloqueado");
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(r.iv) }, key, unb64(r.data));
      return JSON.parse(dec.decode(pt));
    },

    /** Salva. Com PIN e app travado, não salva (não há chave na memória). */
    async save(state) {
      if (this.hasPin()) { if (!key) return false; return writeEncrypted(state); }
      return write(KEY, JSON.stringify({ v: 2, enc: false, data: state }));
    },

    /** Espera obrigatória depois de erros seguidos (30 s, dobrando a cada 5 erros). */
    waitSeconds() {
      try { const t = JSON.parse(read(TRIES) || "{}"); return t.until && t.until > Date.now() ? Math.ceil((t.until - Date.now()) / 1000) : 0; } catch (e) { return 0; }
    },

    async unlock(pin) {
      if (this.waitSeconds() > 0) return false;
      const r = record();
      if (!r || !r.enc) return true;
      const s = unb64(r.salt);
      const k = await deriveKey(pin, s);
      try {
        await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(r.iv) }, k, unb64(r.data));
        key = k; salt = s; del(TRIES); return true;
      } catch (e) {
        let t = {}; try { t = JSON.parse(read(TRIES) || "{}"); } catch (_) {}
        t.n = (t.n || 0) + 1;
        if (t.n % 5 === 0) t.until = Date.now() + 30000 * Math.pow(2, t.n / 5 - 1);
        write(TRIES, JSON.stringify(t));
        return false;
      }
    },

    lock() { key = null; },

    /** Cria ou troca o PIN e regrava tudo criptografado. */
    async setPin(pin, state) {
      salt = crypto.getRandomValues(new Uint8Array(16));
      key = await deriveKey(pin, salt);
      const ok = await writeEncrypted(state);
      if (ok && deleteLegacyOnPin) legacyKeys.forEach(del);
      return ok;
    },

    /** Tira o PIN: os dados voltam a ficar em texto neste aparelho. */
    async removePin(state) {
      key = null; salt = null;
      return write(KEY, JSON.stringify({ v: 2, enc: false, data: state }));
    },

    /** Apaga tudo deste aparelho. Não há como desfazer. */
    wipe() { del(KEY); del(TRIES); if (deleteLegacyOnPin) legacyKeys.forEach(del); key = null; salt = null; },
  };
}
