/* ============================================
   JDT TECHNOLOGICS — Ajustes del sitio
   Se importa desde admin.js
   ============================================ */
import {
    doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const CONFIG_DOC = "Config/sitio";

/* ---------- Campos gestionados ---------- */
const FIELDS = [
    { id: "cfgCorreo", path: "contacto.correo" },
    { id: "cfgTelefono", path: "contacto.telefono" },
    { id: "cfgUbicacion", path: "contacto.ubicacion" },

    { id: "cfgFacebook", path: "redes.facebook" },
    { id: "cfgInstagram", path: "redes.instagram" },
    { id: "cfgLinkedin", path: "redes.linkedin" },
    { id: "cfgX", path: "redes.x" },
    { id: "cfgGithub", path: "redes.github" },
    { id: "cfgYoutube", path: "redes.youtube" },
    { id: "cfgTiktok", path: "redes.tiktok" },
    { id: "cfgWhatsapp", path: "redes.whatsapp" },

    { id: "cfgMetaTitulo", path: "meta.titulo" },
    { id: "cfgMetaDesc", path: "meta.descripcion" },
    { id: "cfgMetaOgImage", path: "meta.ogImage" }
];

/* ============================================
   API pública
   ============================================ */
export async function initSettingsModule({
    db, currentUser, $, setMsg, withTimeout, perms
}) {
    const ctx = { db, currentUser, $, setMsg, withTimeout, perms, original: {} };

    // Botones solo si tiene permiso
    const canEdit = !!ctx.perms.ajustes_editar;
    document.querySelectorAll("#tabAjustes [data-perm='ajustes_editar']").forEach(el => {
        el.hidden = !canEdit;
        el.disabled = !canEdit;
    });

    // Cargar datos al entrar (o al llamar reload)
    await loadSettings(ctx);

    // Listeners de botones
    ctx.$("ajustesSave")?.addEventListener("click", () => saveSettings(ctx));
    ctx.$("ajustesReset")?.addEventListener("click", () => resetForm(ctx));

    // Detectar cambios no guardados (para avisar al salir de la pestaña)
    FIELDS.forEach(f => {
        ctx.$(f.id)?.addEventListener("input", () => markDirty(ctx, true));
    });

    return { reload: () => loadSettings(ctx) };
}

/* ============================================
   Carga
   ============================================ */
async function loadSettings(ctx) {
    const tab = ctx.$("tabAjustes");
    if (!tab) return;

    tab.classList.add("is-loading");
    ctx.setMsg(ctx.$("ajustesMsg"), "");   // ✅

    try {
        const snap = await ctx.withTimeout(getDoc(doc(ctx.db, "Config", "sitio")));
        const data = snap.exists() ? snap.data() : {};
        ctx.original = data;

        FIELDS.forEach(f => {
            const input = ctx.$(f.id);
            if (!input) return;
            input.value = getNested(data, f.path) ?? "";
        });

        markDirty(ctx, false);
    } catch (err) {
        console.error("[settings] load:", err);
        ctx.setMsg(ctx.$("ajustesMsg"),                  // ✅
            "No se pudieron cargar los ajustes (" + (err.code || err.message) + ").",
            "error");
    } finally {
        tab.classList.remove("is-loading");
    }
}
function resetForm(ctx) {
    FIELDS.forEach(f => {
        const input = ctx.$(f.id);
        if (!input) return;
        input.value = getNested(ctx.original, f.path) ?? "";
    });
    markDirty(ctx, false);
    ctx.setMsg(ctx.$("ajustesMsg"), "Cambios descartados.");   // ✅
    setTimeout(() => ctx.setMsg(ctx.$("ajustesMsg"), ""), 2000); // ✅
}

/* ============================================
   Guardar
   ============================================ */
async function saveSettings(ctx) {
    const btn = ctx.$("ajustesSave");
    if (btn) btn.disabled = true;
    ctx.setMsg(ctx.$("ajustesMsg"), "Guardando…");

    try {
        // Construye el objeto anidado solo con lo que el usuario escribió
        const payload = {};
        FIELDS.forEach(f => {
            const val = (ctx.$(f.id)?.value ?? "").trim();
            setNested(payload, f.path, val);
        });

        // Validaciones
        const correo = payload.contacto?.correo || "";
        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            throw new Error("El correo no tiene un formato válido.");
        }

        // Aseguramos un objeto base para no perder keys si algún día se amplían
        const toSave = {
            contacto: payload.contacto || {},
            redes: payload.redes || {},
            meta: payload.meta || {},
            actualizadoEn: serverTimestamp(),
            actualizadoPor: ctx.currentUser.uid
        };

        await ctx.withTimeout(setDoc(doc(ctx.db, "Config", "sitio"), toSave, { merge: true }));

        // Actualizar el "original" para que Descartar funcione tras guardar
        ctx.original = toSave;
        markDirty(ctx, false);

        // Feedback visual en el botón
        ctx.setMsg(ctx.$("ajustesMsg"), "Ajustes guardados correctamente.", "success");   // ✅
        btn?.classList.add("is-saved");
        setTimeout(() => btn?.classList.remove("is-saved"), 1500);
    } catch (err) {
        console.error("[settings] save:", err);
        ctx.setMsg(ctx.$("ajustesMsg"),                                            // ✅
            "No se pudieron guardar los ajustes: " + (err.message || err.code || "error"),
            "error");
    } finally {
        if (btn) btn.disabled = false;
    }
}

/* ============================================
   Utilidades
   ============================================ */
function getNested(obj, path) {
    return path.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

function setNested(obj, path, value) {
    const keys = path.split(".");
    let cur = obj;
    keys.forEach((k, i) => {
        if (i === keys.length - 1) cur[k] = value;
        else cur = (cur[k] ??= {});
    });
}

let dirty = false;
function markDirty(ctx, isDirty) {
    dirty = isDirty;
    const save = ctx.$("ajustesSave");
    if (save) save.classList.toggle("is-dirty", isDirty);
}

// (Opcional) avisar antes de salir si hay cambios sin guardar
window.addEventListener("beforeunload", (e) => {
    if (dirty) {
        e.preventDefault();
        e.returnValue = "";
    }
});