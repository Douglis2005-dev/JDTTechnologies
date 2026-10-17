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

const app = initializeApp(firebaseConfig, "metrics-app");
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "default");

document.addEventListener('DOMContentLoaded', async () => {
    const elProyectos = document.getElementById("metric-proyectos"); // Total
    const elClientes = document.getElementById("metric-clientes");   // Porcentaje

    if (!elProyectos || !elClientes) return;

    try {
        const contactosRef = collection(db, "Contactos");

        // 1. Obtener el Total de contactos
        const snapTotal = await getCountFromServer(contactosRef);
        const total = snapTotal.data().count;

        // 2. Obtener los Atendidos
        const qAtendidas = query(contactosRef, where("estado", "==", "atendida"));
        const snapAtendidas = await getCountFromServer(qAtendidas);
        const atendidas = snapAtendidas.data().count;

        // 3. CALCULAR EL PORCENTAJE
        // Evitamos dividir por cero si la base de datos está vacía
        let porcentaje = 0;
        if (total > 0) {
            porcentaje = Math.round((atendidas / total) * 100);
        }

        // 4. Inyectar los datos en el HTML
        // Para el primer número (Proyectos solicitados)
        elProyectos.setAttribute('data-target', total);
        if (total === 0) elProyectos.textContent = "0";

        // Para el segundo número (Tasa de éxito %)
        elClientes.setAttribute('data-target', porcentaje);
        if (porcentaje === 0) elClientes.textContent = "0";

        // 5. Disparar la animación de conteo
        if (window.updateCounters) {
            window.updateCounters();
        }

    } catch (err) {
        console.error("[Metrics] Error:", err);
        // Fallback visual si falla Firebase
        elProyectos.textContent = "0";
        elClientes.textContent = "0";
    }
});