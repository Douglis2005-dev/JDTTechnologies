/* ============================================
   JDT TECHNOLOGICS — Usuarios y roles
   Se importa desde admin.js
   ============================================ */
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth, createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
    collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
    serverTimestamp, query, where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ---------- Constantes compartidas ---------- */
export const PERMISOS = [
    { id: "solicitudes_ver", label: "Ver solicitudes", grupo: "Solicitudes" },
    { id: "solicitudes_editar", label: "Editar solicitudes", grupo: "Solicitudes" },
    { id: "solicitudes_exportar", label: "Exportar solicitudes", grupo: "Solicitudes" },
    { id: "usuarios_ver", label: "Ver usuarios", grupo: "Usuarios" },
    { id: "usuarios_crear", label: "Crear usuarios", grupo: "Usuarios" },
    { id: "usuarios_editar", label: "Editar usuarios", grupo: "Usuarios" },
    { id: "usuarios_eliminar", label: "Eliminar usuarios", grupo: "Usuarios" },
    { id: "roles_ver", label: "Ver roles", grupo: "Roles" },
    { id: "roles_editar", label: "Editar roles", grupo: "Roles" },
    { id: "ajustes_ver", label: "Ver ajustes", grupo: "Ajustes" },
    { id: "ajustes_editar", label: "Editar ajustes", grupo: "Ajustes" },
    { id: "prospectos_ver", label: "Ver prospectos", grupo: "Prospectos" },
    { id: "prospectos_editar", label: "Editar prospectos", grupo: "Prospectos" }
];

/* ============================================
   API PÚBLICA
   ============================================ */
export async function initUsersModule({ db, auth, firebaseConfig, currentUser, showView, $, setMsg, withTimeout }) {
    const ctx = { db, auth, firebaseConfig, currentUser, showView, $, setMsg, withTimeout };

    // 1) Permisos (defensivo)
    try {
        ctx.perms = await loadMyPermissions(ctx);
    } catch (err) {
        console.error("[users] No se pudieron cargar permisos:", err);
        ctx.perms = {};
    }

    // 2) Datos solo si hay permiso
    ctx.roles = {};
    ctx.users = [];
    if (ctx.perms.usuarios_ver || ctx.perms.roles_ver) {
        try {
            ctx.roles = await loadRoles(ctx);
            ctx.users = await loadUsers(ctx);
        } catch (err) {
            console.error("[users] No se pudieron cargar usuarios/roles:", err);
        }
    }

    // 3) Render defensivo (un fallo no tumba el resto)
    safe(() => renderPermsOnNav(ctx));
    safe(() => fillRoleSelects(ctx));
    safe(() => renderUsersTable(ctx));
    safe(() => renderRolesGrid(ctx));
    safe(() => wireUserDialog(ctx));
    safe(() => wireRoleDialog(ctx));
    safe(() => wireFilters(ctx));
    safe(() => wireRefresh(ctx));

    return {
        reload: async () => {
            try {
                ctx.roles = await loadRoles(ctx);
                ctx.users = await loadUsers(ctx);
                safe(() => fillRoleSelects(ctx));
                safe(() => renderUsersTable(ctx));
                safe(() => renderRolesGrid(ctx));
            } catch (err) { console.error(err); }
        },
        perms: ctx.perms,
        roles: ctx.roles
    };
}

function safe(fn) {
    try { fn(); } catch (err) { console.error("[users] render:", err); }
}

/* ============================================
   CARGA DE DATOS
   ============================================ */
async function loadMyPermissions(ctx) {
    const snap = await ctx.withTimeout(getDoc(doc(ctx.db, "Admins", ctx.currentUser.uid)));
    const data = snap.exists() ? snap.data() : {};
    const rolId = data.rol || "lector";

    let permisos = {};
    try {
        const rSnap = await ctx.withTimeout(getDoc(doc(ctx.db, "Roles", rolId)));
        if (rSnap.exists()) permisos = rSnap.data().permisos || {};
    } catch { /* sin rol: sin permisos */ }

    if (rolId === "superadmin") {
        permisos = Object.fromEntries(PERMISOS.map(p => [p.id, true]));
    }
    return { rolId, ...permisos };
}

async function loadRoles(ctx) {
    const snap = await ctx.withTimeout(getDocs(collection(ctx.db, "Roles")));
    const out = {};
    snap.forEach(d => (out[d.id] = { id: d.id, ...d.data() }));
    return out;
}

async function loadUsers(ctx) {
    const snap = await ctx.withTimeout(getDocs(collection(ctx.db, "Admins")));
    const out = [];
    snap.forEach(d => out.push({ id: d.id, ...d.data() }));
    return out;
}

/* ============================================
   NAV: ocultar sin permiso
   ============================================ */
function renderPermsOnNav(ctx) {
    document.querySelectorAll("[data-perm]").forEach(el => {
        el.hidden = !ctx.perms[el.dataset.perm];
    });
    const current = document.querySelector("[data-view].is-active")?.dataset.view || "solicitudes";
    const nav = document.querySelector(`[data-view="${current}"]`);
    if (nav && nav.hidden) ctx.showView?.("solicitudes");
}

/* ============================================
   USUARIOS: tabla
   ============================================ */
function renderUsersTable(ctx) {
    const body = ctx.$("usersBody");
    if (!body) return;
    const sSearch = ctx.$("fUserSearch");
    const sRol = ctx.$("fUserRol");
    const sEstado = ctx.$("fUserEstado");
    if (!sSearch || !sRol || !sEstado) return;

    const q = sSearch.value.trim().toLowerCase();
    const rol = sRol.value;
    const estado = sEstado.value;

    const rows = ctx.users.filter(u => {
        if (rol && u.rol !== rol) return false;
        if (estado === "activo" && u.activo === false) return false;
        if (estado === "inactivo" && u.activo !== false) return false;
        if (q && !`${u.nombre} ${u.email}`.toLowerCase().includes(q)) return false;
        return true;
    }).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

    body.replaceChildren();
    const puedeEditar = !!ctx.perms.usuarios_editar;
    const puedeBorrar = !!ctx.perms.usuarios_eliminar;

    rows.forEach(u => {
        const tr = document.createElement("tr");

        const tdUser = document.createElement("td");
        tdUser.dataset.label = "Usuario";
        tdUser.innerHTML = `
            <div class="adm-user-cell">
                <span class="adm-avatar adm-avatar-sm"><b>${(u.nombre || u.email || "?").charAt(0).toUpperCase()}</b></span>
                <span>${escapeHtml(u.nombre || "—")}</span>
            </div>`;
        tr.appendChild(tdUser);

        tr.appendChild(cellHtml(escapeHtml(u.email || "—"), "Correo"));
        tr.appendChild(cellHtml(renderRoleBadge(ctx, u.rol), "Rol", true));
        tr.appendChild(cellHtml(
            u.activo === false
                ? `<span class="adm-state is-off">Inactivo</span>`
                : `<span class="adm-state is-on">Activo</span>`,
            "Estado", true
        ));
        tr.appendChild(cellHtml(fmtShortDate(u.creadoEn), "Creado"));

        const tdAcc = document.createElement("td");
        tdAcc.dataset.label = "";
        const wrap = document.createElement("div");
        wrap.className = "adm-row-actions";

        if (puedeEditar) {
            const edit = document.createElement("button");
            edit.className = "adm-icon-action";
            edit.title = "Editar";
            edit.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
            edit.addEventListener("click", () => openUserDialog(ctx, u));
            wrap.appendChild(edit);
        }
        if (puedeBorrar && u.id !== ctx.currentUser.uid) {
            const del = document.createElement("button");
            del.className = "adm-icon-action is-danger";
            del.title = "Eliminar";
            del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>`;
            del.addEventListener("click", () => deleteUser(ctx, u));
            wrap.appendChild(del);
        }
        tdAcc.appendChild(wrap);
        tr.appendChild(tdAcc);
        body.appendChild(tr);
    });

    const empty = ctx.$("usersEmpty");
    if (empty) empty.hidden = rows.length > 0;
}

function renderRoleBadge(ctx, rolId) {
    const rol = ctx.roles[rolId];
    if (!rol) return `<span class="adm-role-badge" style="--role-color:#94a3b8">${escapeHtml(rolId || "—")}</span>`;
    return `<span class="adm-role-badge" style="--role-color:${rol.color || "#94a3b8"}">${escapeHtml(rol.nombre)}</span>`;
}

/* ============================================
   ROLES: grid
   ============================================ */
function renderRolesGrid(ctx) {
    const grid = ctx.$("rolesGrid");
    if (!grid) return;

    grid.replaceChildren();
    const puedeEditar = !!ctx.perms.roles_editar;

    Object.values(ctx.roles)
        .sort((a, b) => (b.sistema ? 1 : 0) - (a.sistema ? 1 : 0))
        .forEach(r => {
            const card = document.createElement("article");
            card.className = "adm-role-card";
            card.style.setProperty("--role-color", r.color || "#FACC15");

            const nUsers = ctx.users.filter(u => u.rol === r.id).length;
            const permsOn = PERMISOS.filter(p => r.permisos?.[p.id]);

            card.innerHTML = `
                <div class="adm-role-card-head">
                    <h3>${escapeHtml(r.nombre)}</h3>
                    <span class="adm-role-dot"></span>
                </div>
                <p>${escapeHtml(r.descripcion || "Sin descripción.")}</p>
                <div class="adm-perms-list">
                    ${permsOn.slice(0, 6).map(p => `<span class="adm-role-perm is-on">${escapeHtml(p.label)}</span>`).join("")}
                    ${permsOn.length > 6 ? `<span class="adm-role-perm">+${permsOn.length - 6}</span>` : ""}
                    ${permsOn.length === 0 ? `<span class="adm-role-perm">Sin permisos</span>` : ""}
                </div>
                <div class="adm-role-card-foot">
                    <span class="adm-role-users"><b>${nUsers}</b> usuario${nUsers === 1 ? "" : "s"}</span>
                    ${puedeEditar ? `
                        <div class="adm-row-actions">
                            <button class="adm-icon-action" data-edit title="Editar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                            ${!r.sistema ? `
                            <button class="adm-icon-action is-danger" data-del title="Eliminar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                            </button>` : ""}
                        </div>
                    ` : ""}
                </div>
            `;
            card.querySelector("[data-edit]")?.addEventListener("click", () => openRoleDialog(ctx, r));
            card.querySelector("[data-del]")?.addEventListener("click", () => deleteRole(ctx, r));
            grid.appendChild(card);
        });
}

/* ============================================
   MODAL USUARIO
   ============================================ */
let editingUserId = null;

function openUserDialog(ctx, u = null) {
    const dlg = ctx.$("userDialog");
    if (!dlg) return;

    editingUserId = u?.id || null;
    ctx.$("uTitle").textContent = u ? "Editar usuario" : "Nuevo usuario";
    ctx.$("uNombre").value = u?.nombre || "";
    ctx.$("uEmail").value = u?.email || "";
    ctx.$("uEmail").readOnly = !!u;
    ctx.$("uRol").value = u?.rol || "lector";
    ctx.$("uActivo").checked = u ? u.activo !== false : true;
    ctx.$("uPassWrap").hidden = !!u;
    ctx.$("uPass").value = generatePassword();
    ctx.setMsg(ctx.$("uMsg"), "");
    dlg.showModal();
}

function wireUserDialog(ctx) {
    const dlg = ctx.$("userDialog");
    if (!dlg) return;
    const close = () => dlg.close();
    ctx.$("uClose")?.addEventListener("click", close);
    ctx.$("uCancel")?.addEventListener("click", close);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });

    ctx.$("userForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = ctx.$("uSave");
        if (btn) btn.disabled = true;
        ctx.setMsg(ctx.$("uMsg"), "");
        try {
            if (editingUserId) await updateExistingUser(ctx, editingUserId);
            else await createNewUser(ctx);
            dlg.close();
        } catch (err) {
            console.error(err);
            ctx.setMsg(ctx.$("uMsg"), friendlyError(err), "error");
        } finally {
            if (btn) btn.disabled = false;
        }
    });
}

async function createNewUser(ctx) {
    const nombre = ctx.$("uNombre").value.trim();
    const email = ctx.$("uEmail").value.trim();
    const pass = ctx.$("uPass").value;
    const rol = ctx.$("uRol").value;
    const activo = ctx.$("uActivo").checked;

    if (!nombre || !email || !pass) throw new Error("Completa todos los campos.");
    if (pass.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");

    // App secundaria para no cerrar la sesión actual
    const secondary = initializeApp(ctx.firebaseConfig, "secondary-" + Date.now());
    try {
        const secAuth = getAuth(secondary);
        const cred = await createUserWithEmailAndPassword(secAuth, email, pass);
        const uid = cred.user.uid;
        await setDoc(doc(ctx.db, "Admins", uid), {
            email, nombre, rol, activo,
            creadoEn: serverTimestamp(),
            creadoPor: ctx.currentUser.uid
        });
        await secAuth.signOut();
    } finally {
        await deleteApp(secondary);
    }
    await refresh(ctx);
}

async function updateExistingUser(ctx, uid) {
    const nombre = ctx.$("uNombre").value.trim();
    const rol = ctx.$("uRol").value;
    const activo = ctx.$("uActivo").checked;
    await updateDoc(doc(ctx.db, "Admins", uid), { nombre, rol, activo });
    await refresh(ctx);
}

async function deleteUser(ctx, u) {
    if (!confirm(`¿Eliminar a ${u.nombre || u.email}?\n\nEsto revoca su acceso al panel.`)) return;
    try {
        await deleteDoc(doc(ctx.db, "Admins", u.id));
        await refresh(ctx);
    } catch (err) {
        console.error(err);
        ctx.setMsg(ctx.$("usersMsg"), "No se pudo eliminar: " + (err.code || err.message), "error");
    }
}

/* ============================================
   MODAL ROL
   ============================================ */
let editingRoleId = null;

function openRoleDialog(ctx, r = null) {
    const dlg = ctx.$("roleDialog");
    if (!dlg) return;

    editingRoleId = r?.id || null;
    ctx.$("rTitle").textContent = r ? "Editar rol" : "Nuevo rol";
    ctx.$("rNombre").value = r?.nombre || "";
    ctx.$("rColor").value = r?.color || "#60a5fa";
    ctx.$("rDesc").value = r?.descripcion || "";
    renderPermsCheckboxes(ctx, r?.permisos || {});
    ctx.setMsg(ctx.$("rMsg"), "");
    dlg.showModal();
}

function renderPermsCheckboxes(ctx, permisos) {
    const box = ctx.$("rPerms");
    if (!box) return;
    box.replaceChildren();
    PERMISOS.forEach(p => {
        const label = document.createElement("label");
        label.className = "adm-perm" + (permisos[p.id] ? " is-on" : "");
        label.innerHTML = `
            <input type="checkbox" data-perm-id="${p.id}" ${permisos[p.id] ? "checked" : ""}>
            <span>${p.label}</span>
        `;
        const input = label.querySelector("input");
        input.addEventListener("change", () => {
            label.classList.toggle("is-on", input.checked);
        });
        box.appendChild(label);
    });
}

function wireRoleDialog(ctx) {
    const dlg = ctx.$("roleDialog");
    if (!dlg) return;
    const close = () => dlg.close();
    ctx.$("rClose")?.addEventListener("click", close);
    ctx.$("rCancel")?.addEventListener("click", close);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });

    ctx.$("roleForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = ctx.$("rSave");
        if (btn) btn.disabled = true;
        ctx.setMsg(ctx.$("rMsg"), "");
        try {
            const nombre = ctx.$("rNombre").value.trim();
            if (!nombre) throw new Error("Ponle un nombre al rol.");

            const permisos = {};
            ctx.$("rPerms").querySelectorAll("input[data-perm-id]").forEach(i => {
                permisos[i.dataset.permId] = i.checked;
            });

            const data = {
                nombre,
                descripcion: ctx.$("rDesc").value.trim(),
                color: ctx.$("rColor").value,
                permisos
            };

            if (editingRoleId) {
                if (ctx.roles[editingRoleId]?.sistema && editingRoleId === "superadmin") {
                    data.permisos = Object.fromEntries(PERMISOS.map(p => [p.id, true]));
                }
                await updateDoc(doc(ctx.db, "Roles", editingRoleId), data);
            } else {
                const id = slugify(nombre);
                const exists = await getDoc(doc(ctx.db, "Roles", id));
                if (exists.exists()) throw new Error("Ya existe un rol con ese nombre.");
                await setDoc(doc(ctx.db, "Roles", id), { ...data, sistema: false, creadoEn: serverTimestamp() });
            }
            dlg.close();
            await refresh(ctx);
        } catch (err) {
            console.error(err);
            ctx.setMsg(ctx.$("rMsg"), err.message, "error");
        } finally {
            if (btn) btn.disabled = false;
        }
    });
}

async function deleteRole(ctx, r) {
    if (r.sistema) return;
    const enUso = ctx.users.filter(u => u.rol === r.id).length;
    const extra = enUso ? `\n\n⚠️ ${enUso} usuario(s) usan este rol y se quedarán sin permisos.` : "";
    if (!confirm(`¿Eliminar el rol "${r.nombre}"?${extra}`)) return;
    try {
        await deleteDoc(doc(ctx.db, "Roles", r.id));
        await refresh(ctx);
    } catch (err) {
        console.error(err);
        ctx.setMsg(ctx.$("rolesMsg"), "No se pudo eliminar: " + (err.code || err.message), "error");
    }
}

/* ============================================
   FILTROS Y REFRESH
   ============================================ */
function wireFilters(ctx) {
    ["fUserSearch", "fUserRol", "fUserEstado"].forEach(id => {
        const el = ctx.$(id);
        if (el) el.addEventListener("input", () => renderUsersTable(ctx));
    });
}

function wireRefresh(ctx) {
    const r = ctx.$("refreshUsersBtn");
    const n = ctx.$("btnNuevoUsuario");
    const nr = ctx.$("btnNuevoRol");
    if (r) r.addEventListener("click", () => refresh(ctx));
    if (n) n.addEventListener("click", () => openUserDialog(ctx));
    if (nr) nr.addEventListener("click", () => openRoleDialog(ctx));
}

async function refresh(ctx) {
    ctx.roles = await loadRoles(ctx);
    ctx.users = await loadUsers(ctx);
    safe(() => fillRoleSelects(ctx));
    safe(() => renderUsersTable(ctx));
    safe(() => renderRolesGrid(ctx));
}

function fillRoleSelects(ctx) {
    const roles = Object.values(ctx.roles).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const opts = roles.map(r => `<option value="${r.id}">${escapeHtml(r.nombre)}</option>`).join("");

    const uRol = ctx.$("uRol");
    if (uRol) uRol.innerHTML = opts;

    const filtro = ctx.$("fUserRol");
    if (filtro) filtro.innerHTML = `<option value="">Todos los roles</option>` + opts;
}

/* ============================================
   UTILIDADES
   ============================================ */
function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}
function cellHtml(html, label, isHtml = false) {
    const td = document.createElement("td");
    td.dataset.label = label;
    if (isHtml) td.innerHTML = html; else td.textContent = html;
    return td;
}
function fmtShortDate(ts) {
    const ms = ts && typeof ts.toMillis === "function" ? ts.toMillis() : 0;
    return ms ? new Date(ms).toLocaleDateString("es-ES") : "—";
}
function slugify(s) {
    return s.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let p = "";
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p;
}
function friendlyError(err) {
    const code = err?.code || "";
    if (code === "auth/email-already-in-use") return "Ese correo ya está registrado.";
    if (code === "auth/invalid-email") return "Correo inválido.";
    if (code === "auth/weak-password") return "Contraseña demasiado débil.";
    if (code === "permission-denied") return "No tienes permisos para esta acción.";
    return err.message || "Algo salió mal.";
}