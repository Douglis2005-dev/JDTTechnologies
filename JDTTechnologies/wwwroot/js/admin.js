/* ============================================
   JDT TECHNOLOGICS - Panel de administración
   Archivo: wwwroot/js/admin.js  (se carga como type="module")
   Login con Firebase Auth + lectura de Contactos en Firestore
   ============================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
    initializeFirestore, collection, getDocs, query, limit, doc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { initUsersModule } from "./admin-users.js";
import { initSettingsModule } from "./admin-settings.js";

/* ============================================
   CONFIGURACIÓN
   ============================================ */
const firebaseConfig = {
    apiKey: "AIzaSyBDEPIl9Mfot7LHMSz75wZUJfMzFM2eMXI",
    authDomain: "jdttechnologics.firebaseapp.com",
    projectId: "jdttechnologics",
    storageBucket: "jdttechnologics.firebasestorage.app",
    messagingSenderId: "460315228051",
    appId: "1:460315228051:web:eb210912f827136c765a66"
};

const COLLECTION = "Contactos";
const ADMINS = "Admins";
const MAX_DOCS = 500;
const TIMEOUT_MS = 15000;

const SERVICIOS = {
    medida: "Desarrollo a medida",
    web: "Desarrollo web",
    movil: "Desarrollo móvil",
    automatizacion: "Automatizaciones",
    otro: "Otro"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "default");

/* ============================================
   UTILIDADES GLOBALES
   ============================================ */
const $ = (id) => document.getElementById(id);
const views = { boot: $("bootView"), login: $("loginView"), denied: $("deniedView"), panel: $("panelView") };

let all = [];        // todas las solicitudes cargadas
let current = null;  // solicitud abierta en el detalle

function withTimeout(p, ms = TIMEOUT_MS) {
    return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

function showView(name) {
    Object.entries(views).forEach(([k, el]) => (el.hidden = k !== name));
    $("userBox").hidden = !(name === "panel" || name === "denied");
    document.body.classList.toggle("is-login", name === "login" || name === "boot");
    $("admNav").hidden = name !== "panel";
    $("navToggle").hidden = name !== "panel";
    closeMenus();
}

function closeMenus() {
    $("userMenu").hidden = true;
    $("userMenuBtn").setAttribute("aria-expanded", "false");
    $("topbar").classList.remove("is-open");
    $("navToggle").setAttribute("aria-expanded", "false");
}

function setMsg(el, text, type) {
    if (!el) return;
    el.textContent = text || "";
    el.className = "adm-msg" + (type ? " " + type : "");
}

function toMillis(ts) {
    return ts && typeof ts.toMillis === "function" ? ts.toMillis() : 0;
}

function fmtDate(ts) {
    const ms = toMillis(ts);
    return ms ? new Date(ms).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "—";
}

function estadoOf(c) { return c.estado === "atendida" ? "atendida" : "nuevo"; }
function servicioLabel(v) { return SERVICIOS[v] || "Sin especificar"; }

function authError(err) {
    switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found": return "Correo o contraseña incorrectos.";
        case "auth/invalid-email": return "Escribe un correo válido.";
        case "auth/too-many-requests": return "Demasiados intentos. Espera unos minutos.";
        case "auth/network-request-failed": return "Sin conexión. Revisa tu internet.";
        case "auth/operation-not-allowed": return "El acceso con correo y contraseña no está habilitado en Firebase.";
        default: return "No se pudo iniciar sesión (" + (err.code || err.message) + ").";
    }
}

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function relativeTime(ms) {
    if (!ms) return "—";
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return "hace un momento";
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `hace ${d} d`;
    return new Date(ms).toLocaleDateString("es-ES");
}

/* ============================================
   BUSCADOR GLOBAL + AVATAR
   ============================================ */
const globalSearch = $("globalSearch");
if (globalSearch) {
    globalSearch.addEventListener("input", () => {
        const f = $("fSearch");
        if (f) { f.value = globalSearch.value; render(); }
        if (!$("tabResumen").hidden) showTab("solicitudes");
    });
    document.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            globalSearch.focus();
            globalSearch.select();
        }
    });
}

function syncUserUI(user) {
    const letter = (user.email || "?").charAt(0).toUpperCase();
    $("userInitial").textContent = letter;
    const i2 = $("userInitial2");
    if (i2) i2.textContent = letter;
}

/* ============================================
   MENÚ SUPERIOR
   ============================================ */
$("userMenuBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = $("userMenu").hidden;
    closeMenus();
    $("userMenu").hidden = !willOpen;
    $("userMenuBtn").setAttribute("aria-expanded", String(willOpen));
});
$("navToggle").addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = !$("topbar").classList.contains("is-open");
    closeMenus();
    $("topbar").classList.toggle("is-open", willOpen);
    $("navToggle").setAttribute("aria-expanded", String(willOpen));
});
document.addEventListener("click", (e) => {
    if (!e.target.closest("#userBox")) $("userMenu").hidden = true;
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenus();
});

/* ============================================
   NAVEGACIÓN ENTRE PESTAÑAS
   ============================================ */
document.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => showTab(b.dataset.view))
);

function showTab(name) {
    if (!["solicitudes", "resumen", "usuarios", "roles", "ajustes"].includes(name)) {
        name = "solicitudes";
    }
    $("tabSolicitudes").hidden = name !== "solicitudes";
    $("tabResumen").hidden = name !== "resumen";
    $("tabUsuarios").hidden = name !== "usuarios";
    $("tabRoles").hidden = name !== "roles";
    $("tabAjustes").hidden = name !== "ajustes";

    document.querySelectorAll("[data-view]").forEach((b) => {
        const on = b.dataset.view === name;
        b.classList.toggle("is-active", on);
        if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });

    if (name === "resumen") renderSummary();

    history.replaceState(null, "",
        name === "solicitudes" ? location.pathname + location.search : "#" + name);

    closeMenus();
    window.scrollTo(0, 0);
}

/* ============================================
   PERMISOS
   ============================================ */
function applyPermissions(perms) {
    document.querySelectorAll("[data-perm]").forEach(el => {
        const ok = !!perms?.[el.dataset.perm];
        el.hidden = !ok;
        el.disabled = !ok && el.tagName === "BUTTON";
    });
    const active = document.querySelector("[data-view].is-active");
    if (active && active.hidden) showTab("solicitudes");
}

/* ============================================
   SESIÓN
   ============================================ */
onAuthStateChanged(auth, async (user) => {
    console.log("[auth] user:", user?.email || "sin sesión");
    if (!user) { showView("login"); return; }

    $("userEmail").textContent = user.email || "";
    syncUserUI(user);
    showView("boot");

    try {
        const snap = await withTimeout(getDoc(doc(db, ADMINS, user.uid)));
        console.log("[auth] admin doc existe:", snap.exists());
        if (snap.exists()) {
            showView("panel");

            window.__jdt = await initUsersModule({
    db, auth, firebaseConfig,
    currentUser: user,
    showView: showTab,
    $, setMsg, withTimeout
});
console.log("[auth] perms:", window.__jdt.perms);
applyPermissions(window.__jdt.perms);

// ➕ Inicializar ajustes
window.__settings = await initSettingsModule({
    db,
    currentUser: user,
    $, setMsg, withTimeout,
    perms: window.__jdt.perms
});

            const hash = location.hash.replace("#", "");
            const startTab = ["solicitudes", "resumen", "usuarios", "roles"].includes(hash) ? hash : "solicitudes";
            showTab(startTab);

            await loadContacts();
            console.log("[auth] contactos cargados:", all.length);

            if (!$("tabResumen").hidden) renderSummary();
        } else {
            showView("denied");
        }
    } catch (err) {
        console.error("[auth] error:", err);
        showView("denied");
    }
});

/* ============================================
   LOGIN / LOGOUT
   ============================================ */
$("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("loginEmail").value.trim();
    const pass = $("loginPassword").value;
    const msg = $("loginMsg");
    if (!email || !pass) return setMsg(msg, "Escribe tu correo y contraseña.", "error");

    const btn = $("loginBtn");
    btn.disabled = true; setMsg(msg, "");
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        $("loginPassword").value = "";
    } catch (err) {
        setMsg(msg, authError(err), "error");
    } finally {
        btn.disabled = false;
    }
});

$("togglePass").addEventListener("click", () => {
    const input = $("loginPassword");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    $("togglePass").classList.toggle("is-on", show);
    $("togglePass").setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
});

$("resetBtn").addEventListener("click", async () => {
    const email = $("loginEmail").value.trim();
    const msg = $("loginMsg");
    if (!email) return setMsg(msg, "Escribe tu correo arriba y pulsa de nuevo.", "error");
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (err) {
        if (err.code === "auth/invalid-email") return setMsg(msg, "Escribe un correo válido.", "error");
        console.error(err);
    }
    setMsg(msg, "Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.", "success");
});

const logout = () => signOut(auth);
$("logoutBtn").addEventListener("click", logout);
$("deniedLogout").addEventListener("click", logout);

/* ============================================
   CARGA DE CONTACTOS
   ============================================ */
async function loadContacts() {
    const msg = $("panelMsg");
    setMsg(msg, "Cargando solicitudes…");
    $("refreshBtn").disabled = true;
    try {
        const snap = await withTimeout(getDocs(query(collection(db, COLLECTION), limit(MAX_DOCS))));
        all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        all.sort((a, b) => toMillis(b.creadoEn) - toMillis(a.creadoEn));
        setMsg(msg, "");
        render();
    } catch (err) {
        console.error("[loadContacts] error:", err);
        setMsg(msg, err.message === "timeout"
            ? "No hubo respuesta del servidor. Inténtalo de nuevo."
            : "No se pudieron cargar las solicitudes (" + (err.code || err.message) + ").", "error");
    } finally {
        $("refreshBtn").disabled = false;
    }
}

/* ============================================
   FILTROS + RENDER PRINCIPAL
   ============================================ */
function filtered() {
    const q = $("fSearch").value.trim().toLowerCase();
    const s = $("fService").value;
    const e = $("fEstado").value;
    return all.filter((c) => {
        if (s === "__none" ? SERVICIOS[c.servicio] : (s && c.servicio !== s)) return false;
        if (e && estadoOf(c) !== e) return false;
        if (q && !`${c.nombre} ${c.email} ${c.telefono} ${c.mensaje}`.toLowerCase().includes(q)) return false;
        return true;
    });
}

function cell(text, label, cls) {
    const td = document.createElement("td");
    td.dataset.label = label;
    td.textContent = text;
    if (cls) td.className = cls;
    return td;
}

function render() {
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;

    $("statTotal").textContent = all.length;
    const nuevas = all.filter((c) => estadoOf(c) === "nuevo").length;
    $("statNew").textContent = nuevas;
    $("navCount").textContent = nuevas;
    $("navCount").hidden = nuevas === 0;
    $("statDone").textContent = all.filter((c) => estadoOf(c) === "atendida").length;
    $("statWeek").textContent = all.filter((c) => toMillis(c.creadoEn) >= weekAgo).length;

    const rows = filtered();
    const body = $("listBody");
    body.replaceChildren();

    rows.forEach((c) => {
        const tr = document.createElement("tr");
        if (estadoOf(c) === "nuevo") tr.classList.add("is-new");
        tr.tabIndex = 0;
        tr.append(
            cell(fmtDate(c.creadoEn), "Fecha"),
            cell(c.nombre || "—", "Nombre"),
            cell(c.email || "—", "Correo"),
            cell(servicioLabel(c.servicio), "Servicio")
        );
        const st = document.createElement("td");
        st.dataset.label = "Estado";
        const badge = document.createElement("span");
        badge.className = "adm-badge " + estadoOf(c);
        badge.textContent = estadoOf(c) === "atendida" ? "Atendida" : "Nueva";
        st.append(badge);
        tr.append(st);

        const open = () => openDetail(c.id);
        tr.addEventListener("click", open);
        tr.addEventListener("keydown", (ev) => { if (ev.key === "Enter") open(); });
        body.append(tr);
    });

    $("emptyMsg").hidden = rows.length > 0;

    // Repintar resumen si está visible
    if (!$("tabResumen").hidden) renderSummary();
}

["fSearch", "fService", "fEstado"].forEach((id) => $(id).addEventListener("input", render));
$("refreshBtn").addEventListener("click", loadContacts);

/* ============================================
   RESUMEN
   ============================================ */
let summaryRangeDays = 14;

function renderSummary() {
    const days = summaryRangeDays;
    const since = days > 0 ? Date.now() - days * 86400000 : 0;
    const scoped = days > 0
        ? all.filter(c => toMillis(c.creadoEn) >= since)
        : all.slice();

    const total = scoped.length;
    const done = scoped.filter(c => estadoOf(c) === "atendida").length;
    const nuevas = scoped.filter(c => estadoOf(c) === "nuevo").length;
    const rate = total ? Math.round((done / total) * 100) : 0;

    setText("kpiTotal", total);
    setText("kpiNew", nuevas);
    setText("kpiDone", done);
    setText("kpiRate", rate + "%");

    setText("chartRangeLabel",
        days === 0 ? "Todo el histórico" : `Últimos ${days} días`);

    // Tendencias vs periodo anterior
    if (days > 0) {
        const prevSince = since - days * 86400000;
        const prev = all.filter(c => {
            const t = toMillis(c.creadoEn);
            return t >= prevSince && t < since;
        });
        const prevTotal = prev.length;
        const prevDone = prev.filter(c => estadoOf(c) === "atendida").length;
        const prevNew = prev.filter(c => estadoOf(c) === "nuevo").length;
        const prevRate = prevTotal ? Math.round((prevDone / prevTotal) * 100) : 0;

        setTrend("kpiTotalTrend", total, prevTotal);
        setTrend("kpiNewTrend", nuevas, prevNew);
        setTrend("kpiDoneTrend", done, prevDone);
        setTrend("kpiRateTrend", rate, prevRate, "%");
    } else {
        ["kpiTotalTrend", "kpiNewTrend", "kpiDoneTrend", "kpiRateTrend"].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent = "Histórico completo"; el.className = "adm-kpi-foot"; }
        });
    }

    // Series diarias
    const nDays = days > 0 ? days : 30;
    const series = buildDailySeries(nDays);

    drawSpark("sparkTotal", series.map(d => d.total), "#60a5fa");
    drawSpark("sparkNew", series.map(d => d.nuevas), "#FACC15");
    drawSpark("sparkDone", series.map(d => d.atendidas), "#34d399");
    drawSpark("sparkRate",
        series.map(d => d.total ? Math.round(d.atendidas / d.total * 100) : 0),
        "#a78bfa");

    drawDonut(total, done, nuevas, rate);
    drawArea(series);
    renderServiceBars(scoped);
    renderRecentActivity(scoped);
    renderFunnel(scoped, done);
}

/* Helpers del resumen */
function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
}

function setTrend(id, current, prev, suffix = "%") {
    const el = document.getElementById(id);
    if (!el) return;
    if (prev === 0 && current === 0) {
        el.textContent = "Sin cambios";
        el.className = "adm-kpi-foot";
        return;
    }
    if (prev === 0) {
        el.textContent = "▲ Nuevo vs. anterior";
        el.className = "adm-kpi-foot is-up";
        return;
    }
    const pct = Math.round(((current - prev) / prev) * 100);
    const up = pct >= 0;
    el.textContent = `${up ? "▲" : "▼"} ${Math.abs(pct)}${suffix} vs. anterior`;
    el.className = "adm-kpi-foot " + (up ? "is-up" : "is-down");
}

function buildDailySeries(nDays) {
    const out = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = nDays - 1; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const start = d.getTime(), end = start + 86400000;
        const bucket = all.filter(c => {
            const t = toMillis(c.creadoEn);
            return t >= start && t < end;
        });
        out.push({
            date: d,
            total: bucket.length,
            nuevas: bucket.filter(c => estadoOf(c) === "nuevo").length,
            atendidas: bucket.filter(c => estadoOf(c) === "atendida").length
        });
    }
    return out;
}

function drawSpark(svgId, values, color) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const W = 100, H = 32;
    const max = Math.max(1, ...values);
    const step = values.length > 1 ? W / (values.length - 1) : W;
    const pts = values.map((v, i) => [i * step, H - (v / max) * (H - 6) - 3]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ");
    const area = line + ` L ${W} ${H} L 0 ${H} Z`;

    svg.innerHTML = `
        <defs>
            <linearGradient id="g-${svgId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="${color}" stop-opacity=".35"/>
                <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <path d="${area}" fill="url(#g-${svgId})"/>
        <path d="${line}" fill="none" stroke="${color}" stroke-width="1.6"
              stroke-linejoin="round" stroke-linecap="round"/>
    `;
}

function drawDonut(total, done, nuevas, rate) {
    const C = 2 * Math.PI * 40; // circunferencia ≈ 251.33

    // Proporción de cada estado
    const pDone = total ? (done / total) : 0;
    const pNew = total ? (nuevas / total) : 0;

    const lenDone = C * pDone;
    const lenNew = C * pNew;

    // Amarillo (nuevas) empieza en -90° (arriba)
    // Verde (atendidas) empieza después del amarillo
    const startNew = -90;
    const startDone = -90 + (lenNew / C) * 360;

    const dNew = document.getElementById("donutNew");
    const dDone = document.getElementById("donutDone");

    if (dNew) {
        dNew.setAttribute("stroke-dasharray", `${lenNew} ${C - lenNew}`);
        dNew.setAttribute("transform", `rotate(${startNew} 50 50)`);
    }
    if (dDone) {
        dDone.setAttribute("stroke-dasharray", `${lenDone} ${C - lenDone}`);
        dDone.setAttribute("transform", `rotate(${startDone} 50 50)`);
    }

    // Texto central: % atendidas
    setText("donutRate", rate + "%");
    setText("legendDone", done);
    setText("legendNew", nuevas);
}

function drawArea(series) {
    const svg = document.getElementById("areaChart");
    const grid = document.getElementById("areaGrid");
    const path = document.getElementById("areaPath");
    const dots = document.getElementById("areaPoints");
    const xAxis = document.getElementById("areaX");
    if (!svg || !path || !grid) return;

    const W = 600, H = 220, padTop = 10, padBottom = 20;
    const innerH = H - padTop - padBottom;

    grid.replaceChildren();
    if (dots) dots.replaceChildren();
    if (xAxis) xAxis.replaceChildren();

    if (!series.length) { path.setAttribute("d", ""); return; }

    const max = Math.max(1, ...series.map(d => d.total));
    const step = series.length > 1 ? W / (series.length - 1) : W;

    for (let i = 0; i <= 4; i++) {
        const y = padTop + (innerH / 4) * i;
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", "0"); l.setAttribute("x2", W);
        l.setAttribute("y1", y); l.setAttribute("y2", y);
        grid.appendChild(l);
    }

    const coords = series.map((d, i) => ({
        x: i * step,
        y: padTop + innerH - (d.total / max) * innerH,
        d
    }));

    // Curva Catmull-Rom → Bézier
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i - 1] || coords[i];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[i + 2] || p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    const area = d + ` L ${W} ${H} L 0 ${H} Z`;
    path.setAttribute("d", area);

    if (dots) coords.forEach(({ x, y, d }) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 4);
        const t = document.createElementNS("http://www.w3.org/2000/svg", "title");
        t.textContent = `${d.date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}: ${d.total}`;
        c.appendChild(t);
        dots.appendChild(c);
    });

    if (xAxis) {
        const labelStep = Math.ceil(series.length / 8);
        series.forEach((d, i) => {
            if (i % labelStep !== 0 && i !== series.length - 1) return;
            const span = document.createElement("span");
            span.textContent = d.date.getDate();
            xAxis.appendChild(span);
        });
    }
}

function renderServiceBars(scoped) {
    const counts = {};
    scoped.forEach(c => {
        const k = servicioLabel(c.servicio);
        counts[k] = (counts[k] || 0) + 1;
    });
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = rows.length ? rows[0][1] : 1;
    const box = document.getElementById("chartServicio");
    if (!box) return;

    box.replaceChildren();
    if (!rows.length) {
        box.textContent = "Sin datos todavía.";
        box.className = "adm-bars adm-muted";
        return;
    }
    box.className = "adm-bars";
    rows.forEach(([name, n]) => {
        const row = document.createElement("div"); row.className = "adm-bar-row";
        const label = document.createElement("span");
        label.className = "adm-bar-label"; label.textContent = name; label.title = name;
        const track = document.createElement("div"); track.className = "adm-bar-track";
        const fill = document.createElement("div");
        fill.style.width = Math.max(4, (n / max) * 100) + "%";
        track.append(fill);
        const val = document.createElement("b"); val.textContent = n;
        row.append(label, track, val);
        box.append(row);
    });
}

function renderRecentActivity(scoped) {
    const ul = document.getElementById("recentActivity");
    if (!ul) return;
    ul.replaceChildren();

    const items = scoped.slice()
        .sort((a, b) => toMillis(b.creadoEn) - toMillis(a.creadoEn))
        .slice(0, 6);

    const empty = document.getElementById("activityEmpty");
    if (empty) empty.hidden = items.length > 0;

    items.forEach(c => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="adm-act-avatar">${escapeHtml((c.nombre || c.email || "?").charAt(0).toUpperCase())}</span>
            <span class="adm-act-main">
                <strong>${escapeHtml(c.nombre || "Sin nombre")}</strong>
                <small>${escapeHtml(servicioLabel(c.servicio))} · ${escapeHtml(c.email || "")}</small>
            </span>
            <span class="adm-act-time">${relativeTime(toMillis(c.creadoEn))}</span>`;
        li.addEventListener("click", () => openDetail(c.id));
        ul.appendChild(li);
    });
}

function renderFunnel(scoped, done) {
    const box = document.getElementById("funnel");
    if (!box) return;
    box.replaceChildren();

    const total = scoped.length;
    const steps = [
        { label: "Recibidas", value: total, cls: "f1" },
        { label: "Atendidas", value: done, cls: "f3" }
    ];
    const max = Math.max(1, ...steps.map(s => s.value));

    steps.forEach(s => {
        const row = document.createElement("div"); row.className = "adm-funnel-row";
        const lbl = document.createElement("span");
        lbl.className = "adm-funnel-label"; lbl.textContent = s.label;
        const bar = document.createElement("div"); bar.className = "adm-funnel-bar " + s.cls;
        const fill = document.createElement("div");
        fill.style.width = Math.max(6, (s.value / max) * 100) + "%";
        fill.textContent = s.value;
        bar.append(fill);
        const val = document.createElement("span");
        val.className = "adm-funnel-value"; val.textContent = s.value;
        row.append(lbl, bar, val);
        box.append(row);
    });
}

/* Conectar controles del resumen */
const rangoSel = document.getElementById("rangoDias");
if (rangoSel) {
    rangoSel.value = String(summaryRangeDays);
    rangoSel.addEventListener("change", () => {
        summaryRangeDays = Number(rangoSel.value) || 0;
        renderSummary();
    });
}
document.getElementById("refreshSummary")?.addEventListener("click", () => loadContacts());
document.getElementById("goSolicitudes")?.addEventListener("click", () => showTab("solicitudes"));

/* ============================================
   DETALLE
   ============================================ */
const dlg = $("detailDialog");

function link(el, href, text) {
    el.replaceChildren();
    if (!text) { el.textContent = "—"; return; }
    const a = document.createElement("a");
    a.href = href; a.textContent = text;
    el.append(a);
}

function openDetail(id) {
    current = all.find((c) => c.id === id);
    if (!current) return;
    $("dName").textContent = current.nombre || "Sin nombre";
    $("dDate").textContent = fmtDate(current.creadoEn);
    link($("dEmail"), "mailto:" + encodeURIComponent(current.email || ""), current.email);
    link($("dPhone"), "tel:" + (current.telefono || "").replace(/[^\d+]/g, ""), current.telefono);
    $("dService").textContent = servicioLabel(current.servicio);
    $("dMessage").textContent = current.mensaje || "";
    setMsg($("dMsg"), "");
    paintEstado();
    $("dReply").href = "mailto:" + encodeURIComponent(current.email || "")
        + "?subject=" + encodeURIComponent("Re: tu consulta a JDT TECHNOLOGICS");
    dlg.showModal();
}

function paintEstado() {
    const done = estadoOf(current) === "atendida";
    $("dEstado").textContent = done ? "Atendida" : "Nueva";
    $("dToggle").textContent = done ? "Reabrir" : "Marcar como atendida";
}

$("dClose").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

$("dToggle").addEventListener("click", async () => {
    if (!current) return;
    const btn = $("dToggle");
    const next = estadoOf(current) === "atendida" ? "nuevo" : "atendida";
    btn.disabled = true; setMsg($("dMsg"), "");
    try {
        await withTimeout(updateDoc(doc(db, COLLECTION, current.id), {
            estado: next,
            atendidoEn: next === "atendida" ? serverTimestamp() : null
        }));
        current.estado = next;
        paintEstado();
        render();
    } catch (err) {
        console.error("update:", err);
        setMsg($("dMsg"), "No se pudo actualizar (" + (err.code || err.message) + ").", "error");
    } finally {
        btn.disabled = false;
    }
});

/* ============================================
   EXPORTAR CSV
   ============================================ */
$("csvBtn").addEventListener("click", () => {
    const esc = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const head = ["Fecha", "Nombre", "Correo", "Teléfono", "Servicio", "Estado", "Mensaje"];
    const lines = filtered().map((c) => [
        fmtDate(c.creadoEn), c.nombre, c.email, c.telefono, servicioLabel(c.servicio),
        estadoOf(c) === "atendida" ? "Atendida" : "Nueva", c.mensaje
    ].map(esc).join(","));
    const blob = new Blob(["\uFEFF" + [head.map(esc).join(","), ...lines].join("\r\n")],
        { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "solicitudes-jdt.csv";
    a.click();
    URL.revokeObjectURL(a.href);
});