/* ============================================
   JDT TECHNOLOGICS - Formulario de contacto -> Firebase Firestore
   Archivo: wwwroot/js/firebase-contact.js
   Se carga como módulo (type="module") en Index.cshtml
   ============================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    initializeFirestore, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// 1) Pega aquí tu configuración (Firebase Console > Configuración del proyecto > Tus apps > Web).
//    Estos valores NO son secretos; la seguridad real la dan las reglas de Firestore.
const firebaseConfig = {
    apiKey: "AIzaSyBDEPIl9Mfot7LHMSz75wZUJfMzFM2eMXI",
    authDomain: "jdttechnologics.firebaseapp.com",
    projectId: "jdttechnologics",
    storageBucket: "jdttechnologics.firebasestorage.app",
    messagingSenderId: "460315228051",
    appId: "1:460315228051:web:eb210912f827136c765a66",
    measurementId: "G-D5YQB0V12T"
};

const MIN_SECONDS_BETWEEN_SENDS = 30; // freno básico anti-spam desde el navegador

const app = initializeApp(firebaseConfig);
// Tu base se llama "default" (sin paréntesis), no "(default)": hay que indicarlo como tercer argumento.
// Long polling: evita que el envío se quede colgado cuando una red, proxy, antivirus
// o extensión interfiere con la conexión WebChannel por defecto de Firestore.
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "default");

// Si Firestore no confirma en este tiempo, mostramos error en vez de quedarnos en "Enviando..."
const SEND_TIMEOUT_MS = 15000;
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
    ]);
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    const msg = document.getElementById("formMessage");
    if (!form || !msg) return;

    const btn = form.querySelector('button[type="submit"]');
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function show(text, type) {
        msg.textContent = text;
        msg.className = "form-message " + type; // "success" | "error"
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Honeypot: si un bot rellena este campo oculto, se ignora en silencio
        if (form.website && form.website.value) return;

        const nombre = form.nombre.value.trim();
        const email = form.email.value.trim();
        const telefono = form.telefono.value.trim();
        const servicio = form.servicio.value;
        const mensaje = form.mensaje.value.trim();

        if (!nombre || !email || !mensaje) {
            return show("Completa los campos obligatorios (*).", "error");
        }
        if (!emailRe.test(email)) {
            return show("Escribe un correo válido.", "error");
        }

        const last = Number(localStorage.getItem("jdt_last_send") || 0);
        if (Date.now() - last < MIN_SECONDS_BETWEEN_SENDS * 1000) {
            return show("Espera unos segundos antes de enviar otro mensaje.", "error");
        }

        btn.disabled = true;
        const original = btn.textContent;
        btn.textContent = "Enviando...";
        show("", "");

        try {
            await withTimeout(addDoc(collection(db, "Contactos"), {
                nombre: nombre.slice(0, 100),
                email: email.slice(0, 150),
                telefono: telefono.slice(0, 30),
                servicio: servicio,
                mensaje: mensaje.slice(0, 2000),
                creadoEn: serverTimestamp(),
                origen: "web-jdt"
            }), SEND_TIMEOUT_MS);
            try { localStorage.setItem("jdt_last_send", String(Date.now())); } catch { }
            form.reset();
            show("¡Mensaje enviado! Te responderemos en menos de 24 horas.", "success");
        } catch (err) {
            console.error("Firestore:", err);
            show(err.message === "timeout"
                ? "No hubo respuesta del servidor. Revisa tu conexión o que Firestore esté creado y vuelve a intentarlo."
                : "No pudimos enviar tu mensaje (" + (err.code || err.message) + "). Inténtalo de nuevo o escríbenos por correo.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = original;
        }
    });
});