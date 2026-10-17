import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    initializeFirestore, collection, getCountFromServer, query, where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBDEPIl9Mfot7LHMSz75wZUJfMzFM2eMXI",
    authDomain: "jdttechnologics.firebaseapp.com",
    projectId: "jdttechnologics",
    storageBucket: "jdttechnologics.firebasestorage.app",
    messagingSenderId: "460315228051",
    appId: "1:460315228051:web:eb210912f827136c765a66"
};

// Inicializamos con un nombre distinto para no chocar con firebase-contact.js
const app = initializeApp(firebaseConfig, "metrics-app");
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "default");

document.addEventListener('DOMContentLoaded', async () => {
    const elProyectos = document.getElementById("metric-proyectos");
    const elClientes = document.getElementById("metric-clientes");

    if (!elProyectos || !elClientes) return;

    try {
        const contactosRef = collection(db, "Contactos");

        // 1. Proyectos solicitados (Total de contactos reales)
        const snapTotal = await getCountFromServer(contactosRef);
        const total = snapTotal.data().count;

        if (total > 0) {
            elProyectos.setAttribute('data-target', total);
            // Si ya usaste initCounters() de Home.js, esto se animará solo.
            // Si no, lo mostramos directo:
            elProyectos.textContent = total;
        } else {
            elProyectos.textContent = "0";
        }

        // 2. Clientes satisfechos (Contactos con estado "atendida")
        const qAtendidas = query(contactosRef, where("estado", "==", "atendida"));
        const snapAtendidas = await getCountFromServer(qAtendidas);
        const atendidas = snapAtendidas.data().count;

        if (atendidas > 0) {
            elClientes.setAttribute('data-target', atendidas);
            elClientes.textContent = atendidas;
        } else {
            elClientes.textContent = "0";
        }

        // Si Home.js ya cargó los contadores antes de que Firebase responda, 
        // forzamos una actualización:
        if (window.updateCounters) {
            window.updateCounters();
        }

    } catch (err) {
        console.error("[Metrics] Error al obtener métricas de Firebase:", err);
        // Fallback: si falla Firebase o hay un error de permisos, 
        // dejamos los números estáticos para no romper la vista.
        elProyectos.textContent = "150";
        elClientes.textContent = "98";
    }
});