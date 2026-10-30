/* ============================================
   JDT TECHNOLOGICS — Prospectos
   ============================================ */
import {
    collection, getDocs, doc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const COLLECTION = "Prospectos";

export async function initProspectosModule({
    db, currentUser, $, setMsg, withTimeout, perms
}) {
    const ctx = { db, currentUser, $, setMsg, withTimeout, perms, all: [], current: null };

    ctx.canEdit = !!perms.prospectos_editar;

    await loadProspectos(ctx);

    wireFilters(ctx);
    wireRefresh(ctx);
    wireCsv(ctx);
    wireDialog(ctx);

    return { reload: () => loadProspectos(ctx), perms: ctx.perms };
}

/* ---------- Carga ---------- */
async function loadProspectos(ctx) {
    const msg = ctx.$("prospectosMsg");
    ctx.setMsg(msg, "Cargando prospectos…");
    ctx.$("refreshProspectosBtn").disabled = true;
    try {
        const snap = await ctx.withTimeout(getDocs(collection(ctx.db, COLLECTION)));
        ctx.all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        ctx.setMsg(msg, "");
        render(ctx);
    } catch (err) {
        console.error("[prospectos] load:", err);
        ctx.setMsg(msg, "No se pudieron cargar: " + (err.code || err.message), "error");
    } finally {
        ctx.$("refreshProspectosBtn").disabled = false;
    }
}

/* ---------- Filtros ---------- */
function filtered(ctx) {
    const q = ctx.$("fProspectoSearch").value.trim().toLowerCase();
    const fuente = ctx.$("fProspectoFuente").value;
    const estado = ctx.$("fProspectoEstado").value;

    return ctx.all.filter(p => {
        if (fuente && p.fuente !== fuente) return false;
        if (estado && p.estado !== estado) return false;
        if (q && !(`${p.nombre || ""} ${p.telefono || ""} ${p.barrio || ""}`).toLowerCase().includes(q)) return false;
        return true;
    });
}

/* ---------- Render ---------- */
function render(ctx) {
    ctx.$("statProspectosTotal").textContent = ctx.all.length;
    ctx.$("statProspectosListos").textContent = ctx.all.filter(p => p.estado === "borrador_listo").length;
    ctx.$("statProspectosContactados").textContent = ctx.all.filter(p => p.estado === "enviado").length;
    ctx.$("statProspectosRespondieron").textContent = ctx.all.filter(p => p.estado === "respondio").length;

    const rows = filtered(ctx).sort((a, b) => (b.score || 0) - (a.score || 0));
    const body = ctx.$("prospectosBody");
    body.replaceChildren();

    const canEdit = ctx.canEdit;

    rows.forEach(p => {
        const tr = document.createElement("tr");
        tr.tabIndex = 0;

        tr.append(
            cell(p.nombre || "—", "Nombre"),
            cell(p.telefono || "—", "Teléfono"),
            cell(p.rating ? `${p.rating} ⭐ (${p.numResenas || 0})` : "—", "Rating")
        );
        const st = document.createElement("td");
        st.dataset.label = "Estado";
        const badge = document.createElement("span");
        badge.className = "adm-badge " + estadoBadgeClass(p.estado);
        badge.textContent = estadoLabel(p.estado);
        st.append(badge);
        tr.append(st);

        const tdAcc = document.createElement("td");
        tdAcc.dataset.label = "";
        const wrap = document.createElement("div");
        wrap.className = "adm-row-actions";

        const view = document.createElement("button");
        view.className = "adm-icon-action";
        view.title = "Ver detalle";
        view.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
        view.addEventListener("click", () => openProspecto(ctx, p.id));
        wrap.appendChild(view);

        if (canEdit && p.telefono) {
            const wa = document.createElement("a");
            wa.className = "adm-icon-action";
            wa.title = "Enviar WhatsApp";
            wa.href = buildWhatsAppLink(p.telefono, p.mensajeBorrador);
            wa.target = "_blank";
            wa.rel = "noopener";
            wa.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:15px;height:15px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
            wa.addEventListener("click", () => markAsSent(ctx, p));
            wrap.appendChild(wa);
        }

        tdAcc.appendChild(wrap);
        tr.appendChild(tdAcc);

        const open = () => openProspecto(ctx, p.id);
        tr.addEventListener("click", (e) => {
            if (!e.target.closest("a,button")) open();
        });
        tr.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });

        body.appendChild(tr);
    });

    ctx.$("prospectosEmpty").hidden = rows.length > 0;
}

/* ---------- Helpers ---------- */
function cell(text, label) {
    const td = document.createElement("td");
    td.dataset.label = label;
    td.textContent = text;
    return td;
}
function estadoLabel(e) {
    switch (e) {
        case "borrador_listo": return "Borrador listo";
        case "enviado": return "Enviado";
        case "respondio": return "Respondió";
        case "descartado": return "Descartado";
        default: return "—";
    }
}
function estadoBadgeClass(e) {
    switch (e) {
        case "borrador_listo": return "nuevo";
        case "enviado": return "nuevo";
        case "respondio": return "atendida";
        default: return "";
    }
}

function buildWhatsAppLink(telefono, mensaje) {
    const digits = (telefono || "").replace(/\D/g, "");
    if (!digits) return "#";
    // Si el número viene sin código de país y es de 10 dígitos (Colombia), prepende 57
    const withCountry = digits.length === 10 ? "57" + digits : digits;
    return `https://wa.me/${withCountry}?text=${encodeURIComponent(mensaje || "")}`;
}

/* ---------- Detalle ---------- */
function openProspecto(ctx, id) {
    ctx.current = ctx.all.find(p => p.id === id);
    if (!ctx.current) return;

    const p = ctx.current;
    ctx.$("pNombre").textContent = p.nombre || "Sin nombre";
    ctx.$("pTelefono").textContent = p.telefono || "—";
    ctx.$("pDireccion").textContent = p.direccion || "—";
    ctx.$("pBarrio").textContent = p.barrio || "—";
    ctx.$("pRating").textContent = p.rating != null ? p.rating : "—";
    ctx.$("pResenas").textContent = p.numResenas != null ? p.numResenas : "—";
    ctx.$("pScore").textContent = p.score != null ? p.score : "—";
    ctx.$("pFuente").textContent = p.fuente || "—";
    ctx.$("pWeb").textContent = p.web || "—";
    ctx.$("pMotivo").textContent = p.motivoScore || "—";
    ctx.$("pEstado").textContent = estadoLabel(p.estado);
    ctx.$("pMensaje").textContent = p.mensajeBorrador || "(sin mensaje borrador)";

    ctx.$("pEstadoSelect").value = p.estado || "borrador_listo";

    // WhatsApp
    const wa = ctx.$("pWhatsApp");
    wa.href = buildWhatsAppLink(p.telefono, p.mensajeBorrador);
    wa.hidden = !ctx.canEdit;

    ctx.setMsg(ctx.$("pMsg"), "");
    ctx.$("prospectoDialog").showModal();
}

function wireDialog(ctx) {
    const dlg = ctx.$("prospectoDialog");
    const close = () => dlg.close();
    ctx.$("pClose").addEventListener("click", close);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });

    ctx.$("pUpdateState").addEventListener("click", async () => {
        if (!ctx.current) return;
        const next = ctx.$("pEstadoSelect").value;
        const btn = ctx.$("pUpdateState");
        btn.disabled = true;
        ctx.setMsg(ctx.$("pMsg"), "Guardando…");
        try {
            await ctx.withTimeout(updateDoc(doc(ctx.db, COLLECTION, ctx.current.id), {
                estado: next,
                actualizadoEn: serverTimestamp()
            }));
            ctx.current.estado = next;
            ctx.setMsg(ctx.$("pMsg"), "Estado actualizado.", "success");
            render(ctx);
        } catch (err) {
            console.error("[prospectos] update:", err);
            ctx.setMsg(ctx.$("pMsg"), "No se pudo actualizar: " + (err.code || err.message), "error");
        } finally {
            btn.disabled = false;
        }
    });

    ctx.$("pWhatsApp").addEventListener("click", () => {
        if (ctx.current && ctx.current.estado === "borrador_listo") {
            markAsSent(ctx, ctx.current);
        }
    });
}

async function markAsSent(ctx, p) {
    try {
        await updateDoc(doc(ctx.db, COLLECTION, p.id), {
            estado: "enviado",
            enviadoEn: serverTimestamp()
        });
        p.estado = "enviado";
        render(ctx);
    } catch (err) {
        console.warn("[prospectos] no se pudo actualizar estado:", err);
    }
}

/* ---------- Filtros, botones, CSV ---------- */
function wireFilters(ctx) {
    ["fProspectoSearch", "fProspectoFuente", "fProspectoEstado"].forEach(id => {
        ctx.$(id).addEventListener("input", () => render(ctx));
    });
}
function wireRefresh(ctx) {
    ctx.$("refreshProspectosBtn").addEventListener("click", () => loadProspectos(ctx));
}
function wireCsv(ctx) {
    ctx.$("exportCsvProspectosBtn").addEventListener("click", () => {
        const esc = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
        const rows = filtered(ctx);
        const head = ["Nombre", "Teléfono", "Barrio", "Dirección", "Rating", "Reseñas", "Score", "Estado", "Mensaje"];
        const lines = rows.map(p => [
            p.nombre, p.telefono, p.barrio, p.direccion, p.rating, p.numResenas, p.score,
            estadoLabel(p.estado), p.mensajeBorrador
        ].map(esc).join(","));
        const blob = new Blob(["\uFEFF" + [head.map(esc).join(","), ...lines].join("\r\n")],
            { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "prospectos-jdt.csv";
        a.click();
        URL.revokeObjectURL(a.href);
    });
}