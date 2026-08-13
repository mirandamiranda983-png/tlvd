/* ═══════════════════════════════════════════════════════════════════
   METADATOS DE LA RADIO EN LA NOTIFICACIÓN / PANTALLA DE BLOQUEO
   (Tabernáculo La Voz de Dios)
   ───────────────────────────────────────────────────────────────────
   Qué hace:
   Cuando alguien da play a la radio desde el celular, el sistema
   operativo (Android/iOS) muestra una notificación de "reproductor"
   con controles de play/pausa. Sin este script, esa notificación solo
   muestra el nombre del sitio (tlvd.org) y el título de la pestaña.
   Con este script, se usa la Media Session API del navegador para que
   esa notificación muestre el nombre real de la emisora y, si está
   disponible, la canción o programa que está sonando en ese momento
   -tal como lo muestra el reproductor flotante de la página-, además
   del logo como imagen del reproductor.

   Cómo funciona (sin tocar radio.js):
   No necesita saber cómo está hecho el reproductor de radio. Solo
   "observa" el texto que ya se muestra en el pill flotante
   (#floatRadioTitle) y, cada vez que ese texto cambia (por ejemplo,
   cuando cambia la canción), actualiza los metadatos de la
   notificación automáticamente.

   CÓMO AGREGARLO A OTRA PÁGINA:
   1) Sube este archivo (media-session.js) a la misma carpeta del sitio
      donde ya está radio.js.
   2) En cada página que tenga el reproductor flotante (el mismo botón
      redondo con "Radio La Voz de Dios"), agrega esta línea justo
      DESPUÉS de <script src="radio.js"></script>, antes de </body>:

         <script src="media-session.js"></script>

   Eso es todo. No hay que llamar ninguna función a mano: se activa
   solo cuando la página carga.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
    // Si el navegador no soporta la Media Session API, no hacemos nada
    // (no rompe nada, simplemente esa notificación se ve como antes).
    if (!('mediaSession' in navigator)) return;

    const NOMBRE_EMISORA = 'Tabernáculo La Voz de Dios';
    const LOGO = 'https://raw.githubusercontent.com/mirandamiranda983-png/tlvd/main/web.png';

    function actualizarMetadatos() {
        const tituloEl = document.getElementById('floatRadioTitle');
        const cancionActual = (tituloEl && tituloEl.textContent.trim()) || NOMBRE_EMISORA;

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: cancionActual,
                artist: NOMBRE_EMISORA,
                album: 'Radio en vivo',
                artwork: [
                    { src: LOGO, sizes: '96x96', type: 'image/png' },
                    { src: LOGO, sizes: '192x192', type: 'image/png' },
                    { src: LOGO, sizes: '512x512', type: 'image/png' }
                ]
            });
        } catch (e) {
            console.warn('No se pudieron actualizar los metadatos de la radio:', e);
        }
    }

    function conectarControles() {
        // Conecta los botones de play/pausa que salen en la notificación
        // del celular con la función que ya usa el pill flotante.
        try {
            if (typeof window.floatTogglePlay === 'function') {
                navigator.mediaSession.setActionHandler('play', window.floatTogglePlay);
                navigator.mediaSession.setActionHandler('pause', window.floatTogglePlay);
            }
        } catch (e) {
            // Algunos navegadores viejos no soportan setActionHandler; no pasa nada.
        }
    }

    function iniciar() {
        const tituloEl = document.getElementById('floatRadioTitle');
        actualizarMetadatos();
        conectarControles();

        if (tituloEl) {
            // Cada vez que cambie el texto de la canción/emisora, refrescamos
            // los metadatos de la notificación automáticamente.
            const observer = new MutationObserver(actualizarMetadatos);
            observer.observe(tituloEl, { childList: true, characterData: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
