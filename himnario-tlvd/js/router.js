// ============================================================
// HIMNARIO TLVD — router.js
// Router de hash minimalista (sin dependencias). Cada ruta se
// registra con un patrón simple ("#/canciones", "#/canciones/:id")
// y una función de render que recibe los parámetros y un
// contenedor donde pintar la vista.
// ============================================================

const routes = [];
let notFoundHandler = () => "<p>Página no encontrada.</p>";
let container = null;
let onNavigate = null;

export function registerRoute(pattern, render) {
  const paramNames = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/:[^/]+/g, (m) => {
        paramNames.push(m.slice(1));
        return "([^/]+)";
      }) +
      "$"
  );
  routes.push({ regex, paramNames, render });
}

export function setNotFound(render) {
  notFoundHandler = render;
}

/** onNavigateCallback(hash) se llama antes de cada render, útil para marcar el link activo. */
export function initRouter(containerEl, onNavigateCallback) {
  container = containerEl;
  onNavigate = onNavigateCallback;
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

async function handleRoute() {
  const hash = window.location.hash || "#/inicio";
  if (onNavigate) onNavigate(hash);

  const path = hash.replace(/^#/, "");
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => (params[name] = match[i + 1]));
      container.innerHTML = "";
      await route.render(container, params);
      return;
    }
  }
  container.innerHTML = "";
  await notFoundHandler(container);
}

export function navigate(hash) {
  window.location.hash = hash;
}
