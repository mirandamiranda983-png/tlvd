// ============================================================
// HIMNARIO TLVD — users.js
// Administración de usuarios (solo ADMIN).
//
// IMPORTANTE SOBRE CREACIÓN DE USUARIOS (plan Spark / gratuito):
// No hay Cloud Functions disponibles, así que no se puede usar un
// backend con Firebase Admin SDK. En su lugar, la cuenta se crea
// desde el cliente pero en una INSTANCIA SECUNDARIA e independiente
// de Firebase Auth (ver "secondaryAuth" en firebase.js). Así:
//
//   1. Se crea el usuario en secondaryAuth (esto NO toca la sesión
//      principal, que sigue siendo la del administrador).
//   2. Se escribe su documento en Firestore (users/{uid}) usando la
//      conexión principal, autenticada como el admin.
//   3. Se cierra la sesión de secondaryAuth para dejarla limpia.
//
// Firestore Security Rules siguen siendo la autoridad real: solo
// un admin activo puede crear/editar documentos en users/.
// ============================================================

import { db, secondaryAuth } from "./firebase.js";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const usersCol = collection(db, "users");

export async function listUsers() {
  const q = query(usersCol, orderBy("nombre", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

/**
 * Crea un usuario nuevo (cuenta de Auth + documento en Firestore)
 * sin afectar la sesión del administrador. Genera una contraseña
 * temporal aleatoria que se le debe compartir al usuario para que
 * la cambie con "Olvidé mi contraseña" en el primer ingreso.
 */
export async function createUser({ nombre, email, rol }) {
  if (!nombre || !email || !rol) {
    throw new Error("Nombre, correo y rol son obligatorios.");
  }

  const tempPassword = generateTempPassword();

  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      tempPassword
    );
    uid = cred.user.uid;
  } catch (err) {
    throw new Error(mapCreateError(err));
  } finally {
    // Siempre cerrar la sesión secundaria, haya funcionado o no,
    // para no dejar una sesión "fantasma" abierta en ese slot.
    await signOut(secondaryAuth).catch(() => {});
  }

  try {
    await setDoc(doc(db, "users", uid), {
      nombre,
      email,
      rol,
      activo: true,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // La cuenta de Auth ya se creó pero el documento de Firestore
    // falló (por ejemplo, reglas). Se informa claramente para que
    // el admin sepa que debe revisar esa cuenta manualmente.
    throw new Error(
      "La cuenta se creó en Authentication pero no se pudo guardar su perfil: " +
        err.message
    );
  }

  return { uid, tempPassword };
}

export function setUserActive(uid, activo) {
  return updateDoc(doc(db, "users", uid), { activo });
}

/**
 * Cambia el rol de un usuario. No permite que un usuario se
 * modifique a sí mismo (la interfaz debe impedir seleccionarse;
 * esta función es la última línea de defensa en el cliente —
 * la regla real está en firestore.rules).
 */
export function setUserRole(uid, rol, currentUid) {
  if (uid === currentUid) {
    return Promise.reject(
      new Error("No puedes cambiar tu propio rol desde aquí.")
    );
  }
  return updateDoc(doc(db, "users", uid), { rol });
}

function generateTempPassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

function mapCreateError(err) {
  const map = {
    "auth/email-already-in-use": "Ya existe un usuario con ese correo.",
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/weak-password": "La contraseña generada fue rechazada, intenta de nuevo.",
    "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
  };
  return map[err?.code] || "No se pudo crear la cuenta: " + err.message;
}
