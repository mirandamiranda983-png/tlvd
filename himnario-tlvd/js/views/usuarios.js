import { listUsers, createUser, setUserActive, setUserRole } from "../users.js";
import { ROLES, ROLE_LABELS } from "../roles.js";
import { escapeHtml, toast } from "../ui.js";

export async function viewUsuarios(container, profile) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Usuarios</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-nuevo-usuario">+ Nuevo usuario</button>
      </div>
    </div>
    <div id="form-nuevo" class="card" style="margin-bottom:24px;display:none;max-width:480px;">
      <h3 style="margin-top:0;">Nuevo usuario</h3>
      <div id="nuevo-error" class="login-error" role="alert"></div>
      <form id="form-crear-usuario">
        <div class="field">
          <label for="u-nombre">Nombre</label>
          <input type="text" id="u-nombre" required />
        </div>
        <div class="field">
          <label for="u-email">Correo electrónico</label>
          <input type="email" id="u-email" required />
        </div>
        <div class="field">
          <label for="u-rol">Rol</label>
          <select id="u-rol">
            <option value="${ROLES.CANTOR}">${ROLE_LABELS[ROLES.CANTOR]}</option>
            <option value="${ROLES.MUSICO}">${ROLE_LABELS[ROLES.MUSICO]}</option>
            <option value="${ROLES.ADMIN}">${ROLE_LABELS[ROLES.ADMIN]}</option>
          </select>
        </div>
        <div class="page-header-actions">
          <button type="submit" class="btn btn-primary" id="btn-crear">Crear usuario</button>
          <button type="button" class="btn btn-secondary" id="btn-cancelar-nuevo">Cancelar</button>
        </div>
      </form>
    </div>

    <div id="tabla-wrap" class="card" style="padding:0;">
      <p class="text-muted" style="padding:24px;">Cargando usuarios…</p>
    </div>
  `;

  const formCard = container.querySelector("#form-nuevo");
  container.querySelector("#btn-nuevo-usuario").addEventListener("click", () => {
    formCard.style.display = formCard.style.display === "none" ? "block" : "none";
  });
  container.querySelector("#btn-cancelar-nuevo").addEventListener("click", () => {
    formCard.style.display = "none";
  });

  container.querySelector("#form-crear-usuario").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errBox = document.getElementById("nuevo-error");
    errBox.classList.remove("show");
    const btn = document.getElementById("btn-crear");
    btn.disabled = true;
    btn.textContent = "Creando…";

    try {
      const result = await createUser({
        nombre: document.getElementById("u-nombre").value.trim(),
        email: document.getElementById("u-email").value.trim(),
        rol: document.getElementById("u-rol").value,
      });
      toast(`Usuario creado. Contraseña temporal: ${result.tempPassword}`, "success");
      formCard.style.display = "none";
      e.target.reset();
      await reload();
    } catch (err) {
      errBox.textContent = "No se pudo crear el usuario: " + err.message;
      errBox.classList.add("show");
    } finally {
      btn.disabled = false;
      btn.textContent = "Crear usuario";
    }
  });

  const wrap = container.querySelector("#tabla-wrap");

  async function reload() {
    try {
      const users = await listUsers();
      renderTable(wrap, users, profile.uid);
    } catch (err) {
      wrap.innerHTML = `<p style="padding:24px;color:var(--danger);">No se pudieron cargar los usuarios: ${escapeHtml(err.message)}</p>`;
    }
  }

  wrap.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, uid } = btn.dataset;

    if (action === "toggle-activo") {
      const activo = btn.dataset.activo === "true";
      btn.disabled = true;
      try {
        await setUserActive(uid, !activo);
        toast(!activo ? "Usuario activado." : "Usuario desactivado.", "success");
        await reload();
      } catch (err) {
        toast("Error: " + err.message, "error");
        btn.disabled = false;
      }
    }
  });

  wrap.addEventListener("change", async (e) => {
    const select = e.target.closest("select[data-action='cambiar-rol']");
    if (!select) return;
    const uid = select.dataset.uid;
    try {
      await setUserRole(uid, select.value, profile.uid);
      toast("Rol actualizado.", "success");
    } catch (err) {
      toast("Error: " + err.message, "error");
      await reload();
    }
  });

  await reload();
}

function renderTable(wrap, users, currentUid) {
  if (users.length === 0) {
    wrap.innerHTML = `<p class="text-muted" style="padding:24px;">No hay usuarios registrados todavía.</p>`;
    return;
  }

  wrap.innerHTML = `
    <table class="songs-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Rol</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${users.map((u) => rowHtml(u, currentUid)).join("")}
      </tbody>
    </table>
  `;
}

function rowHtml(u, currentUid) {
  const isSelf = u.uid === currentUid;
  return `
    <tr>
      <td>${escapeHtml(u.nombre)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>
        ${
          isSelf
            ? ROLE_LABELS[u.rol]
            : `<select data-action="cambiar-rol" data-uid="${u.uid}">
                 ${Object.values(ROLES)
                   .map((r) => `<option value="${r}" ${r === u.rol ? "selected" : ""}>${ROLE_LABELS[r]}</option>`)
                   .join("")}
               </select>`
        }
      </td>
      <td><span class="badge ${u.activo ? "active" : "inactive"}">${u.activo ? "Activo" : "Inactivo"}</span></td>
      <td class="row-actions">
        ${
          isSelf
            ? `<span class="text-muted" style="font-size:12px;">Tu cuenta</span>`
            : `<button class="btn btn-ghost" data-action="toggle-activo" data-uid="${u.uid}" data-activo="${u.activo}">
                 ${u.activo ? "Desactivar" : "Activar"}
               </button>`
        }
      </td>
    </tr>
  `;
}
