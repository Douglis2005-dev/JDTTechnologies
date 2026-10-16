/* ============================================
   JDT TECHNOLOGICS - Configuración del sitio
   Archivo: wwwroot/js/site-config.js  (type="module")
   Lee Config/sitio de Firestore (base "default") y lo muestra en la página:
   contacto (correo, teléfono, ubicación), redes sociales y metadatos.
   ============================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { initializeFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBDEPIl9Mfot7LHMSz75wZUJfMzFM2eMXI",
    authDomain: "jdttechnologics.firebaseapp.com",
    projectId: "jdttechnologics",
    storageBucket: "jdttechnologics.firebasestorage.app",
    messagingSenderId: "460315228051",
    appId: "1:460315228051:web:eb210912f827136c765a66"
};

const CONFIG_COLLECTION = "Config";
const CONFIG_DOC = "sitio";
const CACHE_KEY = "jdt_site_config_v1";
const TIMEOUT_MS = 8000;

// Orden en que se muestran las redes en el pie de página (iconos de trazo, 24x24)
const REDES = [
    {
        key: "facebook", label: "Facebook",
        paths: [
            "M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3"
        ]
    },
    {
        key: "instagram", label: "Instagram",
        paths: [
            "M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z",
            "M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0",
            "M16.5 7.5v.01"
        ]
    },
    {
        key: "linkedin", label: "LinkedIn",
        paths: [
            "M8 11v5",
            "M8 8v.01",
            "M12 16v-5",
            "M16 16v-3a2 2 0 0 0 -4 0",
            "M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z"
        ]
    },
    {
        key: "x", label: "X",
        paths: [
            "M4 4l11.733 16h4.267l-11.733 -16z",
            "M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"
        ]
    },
    {
        key: "youtube", label: "YouTube",
        paths: [
            "M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8",
            "M10 9l5 3l-5 3z"
        ]
    },
    {
        key: "tiktok", label: "TikTok",
        paths: [
            "M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917"
        ]
    },
    {
        key: "github", label: "GitHub",
        paths: [
            "M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"
        ]
    },
    {
        key: "whatsapp", label: "WhatsApp",
        paths: [
            "M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9",
            "M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"
        ]
    }
];
const SVG_NS = "http://www.w3.org/2000/svg";

/* ---------- utilidades ---------- */
const str = (v) => (typeof v === "string" ? v.trim() : "");
const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

// Solo se aceptan enlaces http/https (evita javascript: y similares)
function safeUrl(u) {
    try {
        const x = new URL(u);
        return x.protocol === "https:" || x.protocol === "http:" ? x.href : "";
    } catch { return ""; }
}
function socialUrl(v) {
    let s = str(v);
    if (!s) return "";
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s.replace(/^\/+/, "");
    return safeUrl(s);
}
function whatsappUrl(v) {
    const s = str(v);
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return safeUrl(s);
    const digits = s.replace(/\D/g, "");
    return digits ? "https://wa.me/" + digits : "";
}
function withTimeout(p, ms = TIMEOUT_MS) {
    return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

/* ---------- preparar el HTML ----------
   Si el Index no trae los atributos data-config (por ejemplo, no se actualizó el .cshtml),
   se localizan los elementos por su estructura: tarjetas Correo / Teléfono / Ubicación
   y el pie de página. Así funciona con el HTML actual sin tocarlo. */
const CONTACT_LABELS = {
    correo: { path: "contacto.correo", scheme: "mailto:" },
    telefono: { path: "contacto.telefono", scheme: "tel:" },
    ubicacion: { path: "contacto.ubicacion", scheme: "" }
};
const SOCIAL_CSS = `
.social-links{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;padding:1.5rem 0 0}
.social-links:empty{display:none}
.social-links .social-title{margin-right:.35rem;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim,#64748B)}
.social-links .social-link{--brand:#FACC15;--brand-fg:#0A0E27;position:relative;display:inline-grid;place-items:center;
  width:46px;height:46px;padding:0;border-radius:14px;font-size:0;line-height:0;
  border:1px solid var(--border,rgba(255,255,255,.08));background:rgba(255,255,255,.03);
  color:var(--text-muted,#94A3B8);box-shadow:none;
  transition:transform .3s cubic-bezier(.4,0,.2,1),background .3s,border-color .3s,color .3s,box-shadow .3s;
  animation:socialIn .5s cubic-bezier(.4,0,.2,1) both;animation-delay:calc(var(--i,0) * 70ms)}
.social-links .social-link svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;
  stroke-linecap:round;stroke-linejoin:round;transition:transform .3s cubic-bezier(.4,0,.2,1)}
.social-links .social-link:hover{transform:translateY(-4px);color:var(--brand-fg);background:var(--brand);
  border-color:var(--brand);box-shadow:0 12px 26px -10px var(--brand)}
.social-links .social-link:hover svg{transform:scale(1.12)}
.social-links .social-link:focus-visible{outline:2px solid var(--accent,#FACC15);outline-offset:3px}
.social-links .social-facebook{--brand:#1877F2;--brand-fg:#fff}
.social-links .social-instagram{--brand:#DC2743;--brand-fg:#fff}
.social-links .social-instagram:hover{background:linear-gradient(45deg,#F09433,#DC2743 55%,#BC1888)}
.social-links .social-linkedin{--brand:#0A66C2;--brand-fg:#fff}
.social-links .social-x{--brand:#E7E9EA;--brand-fg:#000}
.social-links .social-youtube{--brand:#FF1F3D;--brand-fg:#fff}
.social-links .social-tiktok{--brand:#25F4EE;--brand-fg:#000}
.social-links .social-github{--brand:#F0F6FC;--brand-fg:#0D1117}
.social-links .social-whatsapp{--brand:#25D366;--brand-fg:#fff}
@keyframes socialIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){
  .social-links .social-link{animation:none;transition:none}
  .social-links .social-link:hover,.social-links .social-link:hover svg{transform:none}
}`;

function ensureMarkup() {
    document.querySelectorAll(".contact-info .info-item").forEach((item) => {
        if (item.querySelector("[data-config]")) return; // ya viene marcado en el HTML
        const label = str(item.querySelector("strong")?.textContent)
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const def = CONTACT_LABELS[label];
        const span = item.querySelector("span");
        if (!def || !span) return;
        span.dataset.config = def.path;
        item.dataset.configShow = def.path;
        if (item.tagName === "A" && def.scheme) {
            item.dataset.configHref = def.path;
            item.dataset.configScheme = def.scheme;
        }
    });

    if (!document.querySelector("[data-config-social]")) {
        const container = document.querySelector(".footer-container") || document.querySelector("footer");
        if (container) {
            const box = document.createElement("div");
            box.className = "social-links";
            box.setAttribute("data-config-social", "");
            const bottom = container.querySelector(".footer-bottom");
            if (bottom) container.insertBefore(box, bottom); else container.append(box);
        }
    }

    if (!document.getElementById("site-config-style")) {
        const st = document.createElement("style");
        st.id = "site-config-style";
        st.textContent = SOCIAL_CSS;
        document.head.append(st);
    }
}

/* ---------- aplicar la configuración a la página ---------- */
function applyTexts(cfg) {
    // Texto: <span data-config="contacto.telefono">
    document.querySelectorAll("[data-config]").forEach((el) => {
        const v = str(get(cfg, el.dataset.config));
        if (v) el.textContent = v;
    });

    // Enlaces: <a data-config-href="contacto.correo" data-config-scheme="mailto:">
    document.querySelectorAll("[data-config-href]").forEach((el) => {
        const v = str(get(cfg, el.dataset.configHref));
        if (!v) return;
        const scheme = el.dataset.configScheme || "";
        el.setAttribute("href", scheme + (scheme === "tel:" ? v.replace(/[^\d+]/g, "") : v));
    });

    // Mostrar solo si hay valor: <a data-config-show="contacto.telefono">
    document.querySelectorAll("[data-config-show]").forEach((el) => {
        const v = get(cfg, el.dataset.configShow);
        // Si el campo ni existe en la configuración, se deja como está (valor por defecto del HTML)
        if (v === undefined) return;
        el.style.display = str(v) ? "" : "none";
    });
}

function makeIcon(paths) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    paths.forEach((d) => {
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute("d", d);
        svg.appendChild(p);
    });
    return svg;
}

function applySocial(cfg) {
    const box = document.querySelector("[data-config-social]");
    if (!box || !cfg.redes) return;

    const items = REDES
        .map((r) => ({ ...r, url: r.key === "whatsapp" ? whatsappUrl(cfg.redes[r.key]) : socialUrl(cfg.redes[r.key]) }))
        .filter((r) => r.url);

    // Si no cambió nada desde el último pintado, no se vuelve a dibujar (evita parpadeos)
    const sig = JSON.stringify(items.map((r) => [r.key, r.url]));
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    box.replaceChildren();
    if (!items.length) return;

    const title = document.createElement("span");
    title.className = "social-title";
    title.textContent = "Síguenos";
    box.append(title);

    items.forEach((r, i) => {
        const a = document.createElement("a");
        a.href = r.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "social-link social-" + r.key;
        a.title = r.label;
        a.setAttribute("aria-label", r.label);
        a.style.setProperty("--i", i);
        a.append(makeIcon(r.paths));
        box.append(a);
    });
}

function setMeta(selector, value) {
    const m = document.querySelector(selector);
    if (m) m.setAttribute("content", value);
}
function applyMeta(cfg) {
    const meta = cfg.meta;
    if (!meta) return;
    const titulo = str(meta.titulo), descripcion = str(meta.descripcion), img = safeUrl(str(meta.ogImage));
    if (titulo) { document.title = titulo; setMeta('meta[property="og:title"]', titulo); }
    if (descripcion) {
        setMeta('meta[name="description"]', descripcion);
        setMeta('meta[property="og:description"]', descripcion);
    }
    if (img) setMeta('meta[property="og:image"]', img);
}

function applyAll(cfg) {
    if (!cfg) return;
    if (!document.querySelector("[data-config]")) console.warn("[site-config] No encontré en el HTML dónde mostrar los datos de contacto.");
    applyTexts(cfg);
    applySocial(cfg);
    applyMeta(cfg);
}

/* ---------- caché local: evita el "parpadeo" de los valores por defecto ---------- */
function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; }
}
function saveCache(cfg) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ contacto: cfg.contacto, redes: cfg.redes, meta: cfg.meta }));
    } catch { }
}

/* ---------- carga ---------- */
(async function init() {
    try { ensureMarkup(); } catch (err) { console.warn("[site-config] ensureMarkup:", err); }
    applyAll(readCache()); // muestra al instante lo último conocido

    try {
        // App con nombre propio para no chocar con la de firebase-contact.js
        const app = initializeApp(firebaseConfig, "site-config");
        const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "default");
        const snap = await withTimeout(getDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC)));
        if (!snap.exists()) {
            console.warn("[site-config] No existe " + CONFIG_COLLECTION + "/" + CONFIG_DOC);
            return;
        }
        const cfg = snap.data();
        applyAll(cfg);
        saveCache(cfg);
        console.info("[site-config] configuración aplicada desde " + CONFIG_COLLECTION + "/" + CONFIG_DOC, cfg.contacto);
    } catch (err) {
        // Si falla (reglas, red...), la página sigue mostrando los valores por defecto del HTML
        console.warn("[site-config]", err.code || err.message, err);
        if (err.code === "permission-denied") {
            console.warn("[site-config] Falta publicar la regla de lectura pública para Config/sitio en las reglas de Firestore (base default).");
        }
    }
})();