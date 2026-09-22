// ============================================================
// HIMNARIO TLVD — ui.js
// Utilidades de interfaz compartidas: tema claro/oscuro, sidebar
// móvil, toasts, render del menú por rol.
// ============================================================

import { navForRole, ROLE_LABELS } from "./roles.js";

const THEME_KEY = "tlvd-theme";

/** Aplica el tema guardado (si existe) al cargar la página. */
export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    document.documentElement.setAttribute("data-theme", saved);
  }
}

/** Alterna entre claro/oscuro y persiste la preferencia. */
export function toggleTheme() {
  const root = document.documentElement;
  const current =
    root.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  return next;
}

/** Construye el <aside> de navegación según el rol del perfil. */
export function renderSidebar(profile, currentHash) {
  const items = navForRole(profile.rol);
  const links = items
    .map((item) => {
      const active = currentHash.startsWith(item.href) ? "active" : "";
      return `<li><a href="${item.href}" class="${active}">${item.label}</a></li>`;
    })
    .join("");

  return `
    <div class="sidebar-brand">
      HIMNARIO TLVD
      <span>Iglesia TLVD</span>
    </div>
    <ul class="nav-list">${links}</ul>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <strong>${escapeHtml(profile.nombre || profile.email)}</strong>
        <small>${ROLE_LABELS[profile.rol] || profile.rol}</small>
      </div>
      <button class="btn btn-ghost" id="btn-logout" style="padding-left:0;">Cerrar sesión</button>
    </div>
  `;
}

/** Muestra un mensaje flotante temporal (éxito/error/info). */
export function toast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText =
      "position:fixed;bottom:20px;right:20px;z-index:100;display:flex;flex-direction:column;gap:8px;";
    document.body.appendChild(container);
  }

  const colors = {
    info: "var(--accent)",
    success: "var(--success)",
    error: "var(--danger)",
  };

  const el = document.createElement("div");
  el.textContent = message;
  el.style.cssText = `
    background: var(--surface);
    color: var(--text);
    border: 1px solid ${colors[type] || colors.info};
    border-left-width: 4px;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 320px;
  `;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/** Activa el botón hamburguesa para abrir/cerrar el sidebar en móvil. */
export function initMobileSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  const toggle = document.querySelector(".menu-toggle");
  if (!sidebar || !toggle) return;

  const close = () => {
    sidebar.classList.remove("open");
    backdrop?.classList.remove("open");
  };
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    backdrop?.classList.toggle("open");
  });
  backdrop?.addEventListener("click", close);
  sidebar.addEventListener("click", (e) => {
    if (e.target.tagName === "A") close();
  });
}

export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
