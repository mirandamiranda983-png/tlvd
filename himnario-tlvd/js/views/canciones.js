import {
  listSongs,
  getSong,
  createSong,
  updateSong,
  setSongActive,
  filterSongs,
  TONALIDADES,
} from "../songs.js";
import { isAdmin } from "../roles.js";
import { escapeHtml, toast } from "../ui.js";
import { navigate } from "../router.js";

export async function viewCanciones(container, profile) {
  const admin = isAdmin(profile);

  container.innerHTML = `
    <div class="page-header">
      <h1>Himnario TLVD</h1>
      ${
        admin
          ? `<div class="page-header-actions">
               <a href="#/canciones/nueva" class="btn btn-primary">+ Nueva canción</a>
             </div>`
          : ""
      }
    </div>

    <div class="field" style="max-width:360px;">
      <input type="search" id="buscador" placeholder="Buscar por número, título, autor o categoría" />
    </div>

    <div id="tabla-wrap" class="card" style="padding:0;">
      <p class="text-muted" style="padding:24px;">Cargando canciones…</p>
    </div>
  `;

  const wrap = container.querySelector("#tabla-wrap");
  let songs = [];

  try {
    songs = await listSongs();
  } catch (err) {
    wrap.innerHTML = `<p style="padding:24px;color:var(--danger);">No se pudieron cargar las canciones: ${escapeHtml(err.message)}</p>`;
    return;
  }

  renderTable(wrap, songs, admin);

  container.querySelector("#buscador").addEventListener("input", (e) => {
    renderTable(wrap, filterSongs(songs, e.target.value), admin);
  });

  wrap.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "toggle") {
      const activa = btn.dataset.activa === "true";
      btn.disabled = true;
      try {
        await setSongActive(id, !activa);
        toast(!activa ? "Canción activada." : "Canción desactivada.", "success");
        songs = await listSongs();
        renderTable(wrap, songs, admin);
      } catch (err) {
        toast("No se pudo actualizar: " + err.message, "error");
        btn.disabled = false;
      }
    }
  });
}

function renderTable(wrap, songs, admin) {
  if (songs.length === 0) {
    wrap.innerHTML = `<p class="text-muted" style="padding:24px;">No hay canciones que coincidan con la búsqueda.</p>`;
    return;
  }

  wrap.innerHTML = `
    <table class="songs-table">
      <thead>
        <tr>
          <th>N.º</th>
          <th>Título</th>
          <th>Tono</th>
          <th>BPM</th>
          <th>Estado</th>
          ${admin ? "<th></th>" : ""}
        </tr>
      </thead>
      <tbody>
        ${songs.map((s) => rowHtml(s, admin)).join("")}
      </tbody>
    </table>
  `;
}

function rowHtml(s, admin) {
  return `
    <tr>
      <td>${s.numero ?? "—"}</td>
      <td>
        <strong>${escapeHtml(s.titulo)}</strong>
        ${s.autor ? `<div class="text-muted" style="font-size:12px;">${escapeHtml(s.autor)}</div>` : ""}
      </td>
      <td>${escapeHtml(s.tonalidadOriginal || "—")}</td>
      <td>${s.bpm ?? "—"}</td>
      <td><span class="badge ${s.activa ? "active" : "inactive"}">${s.activa ? "Activa" : "Inactiva"}</span></td>
      ${
        admin
          ? `<td class="row-actions">
               <a href="#/canciones/${s.id}/editar" class="btn btn-ghost">Editar</a>
               <button class="btn btn-ghost" data-action="toggle" data-id="${s.id}" data-activa="${s.activa}">
                 ${s.activa ? "Desactivar" : "Activar"}
               </button>
             </td>`
          : ""
      }
    </tr>
  `;
}

export async function viewCancionForm(container, profile, songId) {
  const editing = !!songId;
  let song = { numero: "", titulo: "", autor: "", tonalidadOriginal: "C", bpm: "", categoria: "" };

  if (editing) {
    container.innerHTML = `<p class="text-muted">Cargando canción…</p>`;
    const found = await getSong(songId);
    if (!found) {
      container.innerHTML = `<p style="color:var(--danger);">Canción no encontrada.</p>`;
      return;
    }
    song = found;
  }

  container.innerHTML = `
    <div class="page-header">
      <h1>${editing ? "Editar canción" : "Nueva canción"}</h1>
    </div>
    <form id="form-song" class="card" style="max-width:520px;">
      <div class="field">
        <label for="f-numero">Número</label>
        <input type="number" id="f-numero" value="${song.numero ?? ""}" required />
      </div>
      <div class="field">
        <label for="f-titulo">Título</label>
        <input type="text" id="f-titulo" value="${escapeHtml(song.titulo)}" required />
      </div>
      <div class="field">
        <label for="f-autor">Autor</label>
        <input type="text" id="f-autor" value="${escapeHtml(song.autor || "")}" />
      </div>
      <div class="field">
        <label for="f-tono">Tonalidad original</label>
        <select id="f-tono">
          ${TONALIDADES.map(
            (t) => `<option value="${t}" ${t === song.tonalidadOriginal ? "selected" : ""}>${t}</option>`
          ).join("")}
        </select>
      </div>
      <div class="field">
        <label for="f-bpm">BPM</label>
        <input type="number" id="f-bpm" value="${song.bpm ?? ""}" />
      </div>
      <div class="field">
        <label for="f-categoria">Categoría</label>
        <input type="text" id="f-categoria" value="${escapeHtml(song.categoria || "")}" placeholder="Ej. Alabanza, Adoración" />
      </div>
      <div class="page-header-actions">
        <button type="submit" class="btn btn-primary" id="btn-guardar">Guardar</button>
        <a href="#/canciones" class="btn btn-secondary">Cancelar</a>
      </div>
      <p class="text-muted" style="margin-top:16px;font-size:13px;">
        La letra, los acordes y las secciones se agregan desde el editor visual (próxima fase).
      </p>
    </form>
  `;

  container.querySelector("#form-song").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-guardar");
    btn.disabled = true;
    btn.textContent = "Guardando…";

    const data = {
      numero: document.getElementById("f-numero").value,
      titulo: document.getElementById("f-titulo").value,
      autor: document.getElementById("f-autor").value,
      tonalidadOriginal: document.getElementById("f-tono").value,
      bpm: document.getElementById("f-bpm").value,
      categoria: document.getElementById("f-categoria").value,
    };

    try {
      if (editing) {
        await updateSong(songId, data);
        toast("Canción actualizada.", "success");
      } else {
        await createSong(data);
        toast("Canción creada.", "success");
      }
      navigate("#/canciones");
    } catch (err) {
      toast("No se pudo guardar: " + err.message, "error");
      btn.disabled = false;
      btn.textContent = "Guardar";
    }
  });
}
