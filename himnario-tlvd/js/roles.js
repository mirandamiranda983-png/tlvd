// ============================================================
// HIMNARIO TLVD — roles.js
// Constantes de rol y helpers de permisos para la INTERFAZ.
// IMPORTANTE: esto solo controla qué se muestra. La autoridad real
// de qué se puede escribir vive en firestore.rules — nunca confiar
// solamente en este archivo para proteger datos.
// ============================================================

export const ROLES = {
  ADMIN: "admin",
  CANTOR: "cantor",
  MUSICO: "musico",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Administrador",
  [ROLES.CANTOR]: "Cantor",
  [ROLES.MUSICO]: "Músico",
};

export function isAdmin(profile) {
  return profile?.rol === ROLES.ADMIN;
}

export function isCantor(profile) {
  return profile?.rol === ROLES.CANTOR;
}

export function isMusico(profile) {
  return profile?.rol === ROLES.MUSICO;
}

/** Menú de navegación por rol: [{ label, href, icon }]. */
export function navForRole(rol) {
  const common = [{ label: "Canciones", href: "#/canciones", icon: "music" }];

  if (rol === ROLES.ADMIN) {
    return [
      { label: "Inicio", href: "#/inicio", icon: "home" },
      ...common,
      { label: "Usuarios", href: "#/usuarios", icon: "users" },
      { label: "Servicios", href: "#/servicios", icon: "calendar" },
      { label: "Configuración", href: "#/configuracion", icon: "settings" },
    ];
  }

  if (rol === ROLES.CANTOR) {
    return [
      { label: "Inicio", href: "#/inicio", icon: "home" },
      { label: "Mi servicio", href: "#/mi-servicio", icon: "list" },
      ...common,
      { label: "Favoritos", href: "#/favoritos", icon: "star" },
      { label: "Mi cuenta", href: "#/cuenta", icon: "user" },
    ];
  }

  if (rol === ROLES.MUSICO) {
    return [
      { label: "Inicio", href: "#/inicio", icon: "home" },
      { label: "Cantores", href: "#/cantores", icon: "mic" },
      { label: "Servicios", href: "#/servicios", icon: "calendar" },
      ...common,
      { label: "Favoritos", href: "#/favoritos", icon: "star" },
      { label: "Mi cuenta", href: "#/cuenta", icon: "user" },
    ];
  }

  return [];
}
