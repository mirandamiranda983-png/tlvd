// ============================================================
// HIMNARIO TLVD — auth.js
// Login, logout, recuperación de contraseña, observador de sesión.
// NO existe registro público: las cuentas las crea el administrador
// (ver users.js).
// ============================================================

import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/**
 * Inicia sesión con correo y contraseña.
 * @returns {Promise<import("firebase/auth").User>}
 */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** Cierra la sesión actual. */
export function logout() {
  return signOut(auth);
}

/** Envía correo de recuperación de contraseña. */
export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Lee el documento users/{uid} del usuario autenticado.
 * Devuelve null si no existe el documento (cuenta no aprovisionada)
 * o si el usuario está desactivado.
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}

/**
 * Suscribe un callback al estado de autenticación + perfil de Firestore.
 * callback recibe { user, profile } o { user: null, profile: null }.
 * Devuelve la función de desuscripción.
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ user: null, profile: null });
      return;
    }
    try {
      const profile = await getUserProfile(user.uid);
      if (!profile || profile.activo === false) {
        // Cuenta sin documento de perfil o desactivada: no debe
        // considerarse una sesión válida dentro de la app.
        await signOut(auth);
        callback({ user: null, profile: null, disabled: !!profile });
        return;
      }
      callback({ user, profile });
    } catch (err) {
      console.error("Error leyendo el perfil de usuario:", err);
      callback({ user: null, profile: null, error: err });
    }
  });
}

/** Traduce códigos de error de Firebase Auth a mensajes en español. */
export function authErrorMessage(error) {
  const map = {
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "Correo o contraseña incorrectos.",
    "auth/too-many-requests":
      "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
    "auth/user-disabled": "Esta cuenta ha sido desactivada.",
  };
  return map[error?.code] || "Ocurrió un error. Inténtalo de nuevo.";
}
