# Himnario TLVD

Aplicación web interna para administrar el himnario de la iglesia. Este entregable corresponde a la **Fase 1**.

## ✅ Qué incluye esta fase

- Conexión real al proyecto Firebase `tlvd-6cf32`.
- Login / logout / recuperación de contraseña (sin registro público).
- Tres roles (`admin`, `cantor`, `musico`) con interfaz y menú distintos por rol.
- Firestore Security Rules que protegen los datos independientemente del frontend.
- Administración de usuarios (solo admin): crear, activar/desactivar, cambiar rol. **Funciona 100% con el plan gratuito (Spark)** — no usa Cloud Functions.
- Biblioteca de canciones: crear, editar, buscar, activar/desactivar.
- Modo claro/oscuro con persistencia local.
- Diseño responsive (PC, tablet, teléfono).

**Lo que NO incluye todavía** (fases siguientes, según lo planificado): editor visual de acordes, importador `[Acorde]texto`, transposición, servicios/listas de cantor, vista de músico, favoritos. La biblioteca de canciones ya guarda los campos base y un arreglo `secciones` vacío listo para que la Fase 2 lo llene sin cambiar el modelo de datos.

## 📁 Estructura

```
index.html          Redirige a login.html o app.html según sesión
login.html
app.html             Shell de la app (sidebar + router)

css/
  base.css           Tokens de diseño, tema claro/oscuro
  layout.css         Sidebar, header
  login.css
  songs.css          Tablas de canciones/usuarios

js/
  firebase.js        Inicialización de Firebase (app principal + instancia secundaria)
  auth.js
  roles.js
  router.js
  ui.js
  songs.js
  users.js            Creación de usuarios sin Cloud Functions (ver más abajo)
  views/
    inicio.js
    canciones.js
    usuarios.js

firestore.rules
firebase.json
.firebaserc
```

## 🔑 Cómo se crean usuarios sin plan de pago

Este proyecto usa el **plan gratuito (Spark)** de Firebase, que no incluye Cloud Functions. El problema a resolver: `createUserWithEmailAndPassword()` autentica automáticamente al navegador como el usuario recién creado — si el admin lo ejecutara directamente, **se cerraría su propia sesión**.

La solución (ya implementada en `js/firebase.js` y `js/users.js`): se abre una **segunda instancia independiente de Firebase Auth**, solo para el momento de crear la cuenta. Esa instancia secundaria nunca se muestra en la interfaz ni afecta la sesión principal del administrador. El documento del nuevo usuario en Firestore se guarda desde la sesión principal (la del admin), amparado por las reglas de seguridad.

No requiere ningún costo ni configuración adicional — funciona igual en el plan Spark.

## 🚀 Despliegue

### 1. Frontend (GitHub Pages)

Sube esta carpeta a un repositorio de GitHub y activa GitHub Pages apuntando a la raíz (o a `/docs` si prefieres mover los archivos ahí). No requiere build: son archivos estáticos con ES Modules.

### 2. Reglas de Firestore

Con [Firebase CLI](https://firebase.google.com/docs/cli) instalado y sesión iniciada (`firebase login`) — esto es gratuito, no requiere plan Blaze:

```bash
firebase deploy --only firestore:rules
```

### 3. Autorizar el dominio de GitHub Pages en Firebase Auth

En la consola de Firebase → Authentication → Settings → Authorized domains, agrega el dominio de tu GitHub Pages (ej. `tuusuario.github.io`), o Auth rechazará el login desde ahí.

### 4. Crear el primer administrador

La app exige que quien crea usuarios ya sea admin — así que el primer admin debe darse de alta manualmente una vez:

1. Crea la cuenta en **Authentication → Users → Add user** en la consola de Firebase.
2. Crea a mano el documento `users/{uid}` (con el UID generado) en **Firestore Database**:
   ```json
   { "nombre": "Tu nombre", "email": "tu@correo.com", "rol": "admin", "activo": true }
   ```

Desde ahí, ese administrador ya puede crear a los demás usuarios (cantores, músicos, otros admins) desde la propia app, sin volver a tocar la consola.

## 🎨 Diseño

Paleta café/blanco con modo oscuro, tipografía `Newsreader` (títulos) + `Work Sans` (interfaz). Los tokens de color y espaciado están centralizados en `css/base.css` — cualquier ajuste de marca se hace ahí.

## Próximo paso sugerido

Fase 2: editor visual de acordes (colocar, arrastrar, secciones) sobre el modelo `songs.secciones` ya definido.
