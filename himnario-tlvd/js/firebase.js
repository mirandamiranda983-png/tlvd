// ============================================================
// HIMNARIO TLVD — firebase.js
// Inicialización única de Firebase. Todos los demás módulos
// importan auth/db desde aquí — nunca vuelven a inicializar.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getAnalytics,
  isSupported as analyticsIsSupported,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCS4QGSz_ZVBIrevOLT7Ad6DXVLufKxLmk",
  authDomain: "tlvd-6cf32.firebaseapp.com",
  projectId: "tlvd-6cf32",
  storageBucket: "tlvd-6cf32.firebasestorage.app",
  messagingSenderId: "249745100905",
  appId: "1:249745100905:web:f4d0905eed777ed3f6d2f8",
  measurementId: "G-1S1NYNMLPW",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ------------------------------------------------------------
// Segunda instancia de la app, usada ÚNICAMENTE para crear
// cuentas de usuario desde el panel de administración (ver
// users.js). Esto es necesario porque el plan gratuito (Spark)
// no tiene Cloud Functions: createUserWithEmailAndPassword()
// autentica automáticamente al navegador como el usuario nuevo,
// lo que cerraría la sesión del administrador si se hiciera en
// la instancia principal. Al usar una instancia secundaria
// independiente, la sesión del admin ("auth" de arriba) nunca
// se ve afectada.
// ------------------------------------------------------------
export const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

// La sesión debe persistir entre recargas/pestañas (no solo en memoria).
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("No se pudo establecer la persistencia de sesión:", err);
});

// Analytics es opcional y puede no estar soportado (p.ej. en algunos
// navegadores con bloqueadores); no debe romper la app si falla.
analyticsIsSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {
    /* silencioso: analytics no es crítico para el funcionamiento */
  });
