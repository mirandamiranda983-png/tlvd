// ============================================================
// HIMNARIO TLVD — songs.js
// Fase 1: CRUD básico de la biblioteca de canciones (número,
// título, autor, tonalidad original, BPM, categoría, estado).
// El contenido de letra/acordes/secciones se agrega en Fase 2
// (song-editor.js) sin romper este módulo.
// ============================================================

import { db } from "./firebase.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const songsCol = collection(db, "songs");

export const TONALIDADES = [
  "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
];

/** Devuelve todas las canciones ordenadas por número. */
export async function listSongs() {
  const q = query(songsCol, orderBy("numero", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getSong(id) {
  const snap = await getDoc(doc(db, "songs", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Crea una canción nueva con los campos básicos de biblioteca.
 * secciones se inicializa vacío; se llenará desde el editor visual (Fase 2).
 */
export async function createSong(data) {
  const payload = {
    numero: Number(data.numero) || 0,
    titulo: data.titulo?.trim() || "",
    autor: data.autor?.trim() || "",
    tonalidadOriginal: data.tonalidadOriginal || "C",
    bpm: Number(data.bpm) || null,
    categoria: data.categoria?.trim() || "",
    activa: true,
    secciones: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(songsCol, payload);
  return ref.id;
}

export async function updateSong(id, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  delete payload.id;
  await updateDoc(doc(db, "songs", id), payload);
}

export function setSongActive(id, activa) {
  return updateDoc(doc(db, "songs", id), {
    activa,
    updatedAt: serverTimestamp(),
  });
}

/** Filtra en memoria por número, título, autor o categoría (biblioteca típica es pequeña). */
export function filterSongs(songs, term) {
  if (!term) return songs;
  const t = term.toLowerCase();
  return songs.filter(
    (s) =>
      String(s.numero).includes(t) ||
      s.titulo?.toLowerCase().includes(t) ||
      s.autor?.toLowerCase().includes(t) ||
      s.categoria?.toLowerCase().includes(t)
  );
}
