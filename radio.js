/**
 * radio.js - Reproductor de Radio Compartido
 * Tabernaculo La Voz de Dios
 *
 * Inyecta el reproductor flotante, maneja el audio,
 * y usa sessionStorage para auto-reanudar la radio
 * cuando el usuario navega entre paginas.
 */

(function () {
    "use strict";

    var STREAM_URL  = "https://stream.zeno.fm/sv471at28zhvv";
    var SSE_URL     = "https://api.zeno.fm/mounts/metadata/subscribe/sv471at28zhvv";
    var SESSION_KEY = "tlvd_radio_playing";

    var audio     = null;
    var sseSource = null;
    var isLoading = false;

    var FLOAT_CSS = [
        "#floatingRadioPlayer {",
        "    position: fixed; bottom: 24px; left: 50%;",
        "    transform: translateX(-50%) translateY(120px);",
        "    z-index: 9999; opacity: 0;",
        "    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;",
        "    pointer-events: none;",
        "}",
        "#floatingRadioPlayer.visible {",
        "    transform: translateX(-50%) translateY(0);",
        "    opacity: 1; pointer-events: all;",
        "}",
        ".radio-pill {",
        "    display: flex; align-items: center; gap: 14px;",
        "    background: linear-gradient(135deg, #1a222d 0%, #0f1620 100%);",
        "    border: 1px solid rgba(194,159,109,0.35);",
        "    border-radius: 100px; padding: 10px 20px 10px 14px;",
        "    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(194,159,109,0.15) inset;",
        "    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);",
        "    min-width: 260px; max-width: 340px;",
        "}",
        ".radio-pill-btn {",
        "    width: 36px; height: 36px; border-radius: 50%;",
        "    background: #c29f6d; border: none; cursor: pointer;",
        "    display: flex; align-items: center; justify-content: center;",
        "    flex-shrink: 0; transition: background 0.25s, transform 0.2s;",
        "    color: #1a222d; font-size: 12px;",
        "}",
        ".radio-pill-btn:hover { background: #fff; transform: scale(1.1); }",
        ".radio-pill-info { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }",
        ".radio-pill-label { font-size: 9px; font-weight: 800; color: #c29f6d; letter-spacing: 0.18em; text-transform: uppercase; line-height: 1; }",
        ".radio-pill-title { font-size: 12px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; margin-top: 2px; }",
        ".radio-pill-eq { display: flex; align-items: flex-end; gap: 2px; height: 14px; }",
        ".radio-pill-eq span { display: block; width: 2.5px; background: #c29f6d; border-radius: 2px; }",
        ".radio-pill-close {",
        "    width: 22px; height: 22px; border-radius: 50%;",
        "    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);",
        "    cursor: pointer; display: flex; align-items: center; justify-content: center;",
        "    color: rgba(255,255,255,0.5); font-size: 9px; flex-shrink: 0;",
        "    transition: background 0.2s, color 0.2s;",
        "}",
        ".radio-pill-close:hover { background: rgba(220,50,50,0.25); color: #ff6b6b; }",
        "@keyframes rp-eq-bar { 0% { height: 3px; } 100% { height: 14px; } }",
        ".rp-bar-1 { animation: rp-eq-bar 0.6s ease-in-out infinite alternate; }",
        ".rp-bar-2 { animation: rp-eq-bar 0.4s ease-in-out infinite alternate 0.2s; }",
        ".rp-bar-3 { animation: rp-eq-bar 0.5s ease-in-out infinite alternate 0.1s; }",
        "@keyframes rp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }",
        ".rp-loading { animation: rp-spin 1s linear infinite; opacity: 0.6; }"
    ].join("\n");

    var FLOAT_HTML = '<div id="floatingRadioPlayer" aria-label="Reproductor de radio flotante">' +
        '<div class="radio-pill">' +
        '<button id="floatRadioBtn" class="radio-pill-btn" onclick="RadioPlayer.toggle()" aria-label="Play/Pausa radio">' +
        '<i id="floatRadioIcon" class="fa-solid fa-play"></i></button>' +
        '<div class="radio-pill-info">' +
        '<span class="radio-pill-label">&#128308; En vivo &middot; Radio</span>' +
        '<span id="floatRadioTitle" class="radio-pill-title">Radio La Voz de Dios</span>' +
        '</div>' +
        '<div id="floatRadioEq" class="radio-pill-eq" style="display:none;">' +
        '<span style="height:5px;" class="rp-bar-1"></span>' +
        '<span style="height:10px;" class="rp-bar-2"></span>' +
        '<span style="height:7px;" class="rp-bar-3"></span>' +
        '</div>' +
        '<button class="radio-pill-close" onclick="RadioPlayer.close()" aria-label="Cerrar reproductor">' +
        '<i class="fa-solid fa-xmark"></i></button>' +
        '</div></div>';

    function injectStyles() {
        if (document.getElementById("rp-styles")) return;
        var style = document.createElement("style");
        style.id = "rp-styles";
        style.textContent = FLOAT_CSS;
        document.head.appendChild(style);
    }

    function injectFloatPlayer() {
        if (document.getElementById("floatingRadioPlayer")) return;
        var wrapper = document.createElement("div");
        wrapper.innerHTML = FLOAT_HTML;
        document.body.appendChild(wrapper.firstElementChild);
    }

    function getAudio() {
        if (!audio) {
            audio = document.getElementById("radioAudio");
            if (audio) bindAudioEvents();
        }
        return audio;
    }

    function bindAudioEvents() {
        audio.addEventListener("playing", function () { setLoadingUI(false); setPlayingUI(true); });
        audio.addEventListener("pause",   function () { if (!isLoading) setPlayingUI(false); });
        audio.addEventListener("waiting", function () { setLoadingUI(true); });
        audio.addEventListener("error",   function () { setLoadingUI(false); setPlayingUI(false); });
    }

    function setPlayingUI(playing) {
        var hIcon   = document.getElementById("radioPlayIcon");
        var hEq     = document.getElementById("radioEqualizer");
        var fIcon   = document.getElementById("floatRadioIcon");
        var fEq     = document.getElementById("floatRadioEq");
        var fPlayer = document.getElementById("floatingRadioPlayer");

        if (hIcon) hIcon.className = playing ? "fa-solid fa-pause text-xs" : "fa-solid fa-play text-xs pl-0.5";
        if (hEq)   hEq.classList.toggle("hidden", !playing);
        if (fIcon) fIcon.className = playing ? "fa-solid fa-pause" : "fa-solid fa-play";
        if (fEq)   fEq.style.display = playing ? "flex" : "none";
        if (fPlayer) {
            if (playing) fPlayer.classList.add("visible");
            else         fPlayer.classList.remove("visible");
        }
    }

    function setLoadingUI(loading) {
        isLoading = loading;
        var hIcon = document.getElementById("radioPlayIcon");
        var fIcon = document.getElementById("floatRadioIcon");
        if (loading) {
            if (hIcon) hIcon.className = "fa-solid fa-circle-notch fa-spin text-xs";
            if (fIcon) fIcon.className = "fa-solid fa-circle-notch rp-loading";
        }
    }

    function updateMetadata(title) {
        var hMeta  = document.getElementById("radioMetadataText");
        var fTitle = document.getElementById("floatRadioTitle");
        if (hMeta)  hMeta.innerText  = title;
        if (fTitle) fTitle.innerText = title;
    }

    function startSSE() {
        if (sseSource) return;
        try {
            sseSource = new EventSource(SSE_URL);
            sseSource.onmessage = function (e) {
                try {
                    var data = JSON.parse(e.data);
                    updateMetadata((data && data.streamTitle) ? data.streamTitle : "Radio La Voz de Dios");
                } catch (_) {}
            };
            sseSource.onerror = function () {};
        } catch (_) {}
    }

    window.RadioPlayer = {
        toggle: function () {
            var a = getAudio();
            if (!a || isLoading) return;
            if (a.paused) {
                setLoadingUI(true);
                if (a.readyState === 0) a.src = STREAM_URL;
                a.play()
                    .then(function () {
                        sessionStorage.setItem(SESSION_KEY, "1");
                        startSSE();
                        if (typeof showToast === "function") {
                            showToast("Radio Conectada", "Sintonizando Radio La Voz de Dios...", "bg-iskDark", "fa-solid fa-radio");
                        }
                    })
                    .catch(function () {
                        setLoadingUI(false);
                        setPlayingUI(false);
                        if (typeof showToast === "function") {
                            showToast("Error de Conexion", "No se pudo iniciar la radio. Intenta de nuevo.", "bg-amber-700", "fa-solid fa-triangle-exclamation");
                        }
                    });
            } else {
                a.pause();
                sessionStorage.removeItem(SESSION_KEY);
            }
        },

        close: function () {
            var a = getAudio();
            if (a) a.pause();
            sessionStorage.removeItem(SESSION_KEY);
            setPlayingUI(false);
        },

        init: function () {
            injectStyles();
            injectFloatPlayer();
            var headerBtn = document.getElementById("radioPlayBtn");
            if (headerBtn) {
                headerBtn.onclick = function () { RadioPlayer.toggle(); };
            }
            // Auto-reanudar si estaba sonando antes de navegar
            if (sessionStorage.getItem(SESSION_KEY) === "1") {
                setTimeout(function () {
                    var a = getAudio();
                    if (a && a.paused) {
                        setLoadingUI(true);
                        if (a.readyState === 0) a.src = STREAM_URL;
                        a.play()
                            .then(function () { startSSE(); })
                            .catch(function () {
                                sessionStorage.removeItem(SESSION_KEY);
                                setPlayingUI(false);
                            });
                    }
                }, 300);
            }
            startSSE();
        }
    };

    window.toggleRadioPlay  = function () { RadioPlayer.toggle(); };
    window.floatTogglePlay  = function () { RadioPlayer.toggle(); };
    window.floatClosePlayer = function () { RadioPlayer.close();  };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { RadioPlayer.init(); });
    } else {
        RadioPlayer.init();
    }

})();