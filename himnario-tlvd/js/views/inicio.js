import { ROLE_LABELS } from "../roles.js";

export function viewInicio(container, profile) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Hola, ${firstName(profile.nombre)}</h1>
    </div>
    <div class="card">
      <p style="margin-bottom:0;">
        Sesión iniciada como <strong>${ROLE_LABELS[profile.rol] || profile.rol}</strong>.
        Usa el menú lateral para navegar por las canciones${
          profile.rol === "admin" ? ", usuarios" : ""
        } del himnario.
      </p>
    </div>
  `;
}

function firstName(nombre = "") {
  return nombre.split(" ")[0] || nombre;
}
