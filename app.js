(function () {
  "use strict";

  var APP_STORE_ID = "6790215107";
  var ITMS_URL = "itms-apps://itunes.apple.com/mx/app/cazaladrones-detective/id" + APP_STORE_ID;
  var APP_STORE_HTTPS_BASE = "https://apps.apple.com/mx/app/cazaladrones-detective/id" + APP_STORE_ID;
  var FALLBACK_DELAY_MS = 900;

  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);
  var isInstagram = /Instagram/i.test(ua);
  var isDesktop = !isIOS && !isAndroid;

  var STRINGS = {
    es: {
      title: "Descarga Cazaladrones",
      description: "Resuelve el misterio, analiza las pistas y encuentra al culpable.",
      iosCta: "Abrir en el App Store",
      iosWebLink: "Abrir página web del App Store",
      instagramNotice: "Instagram bloquea la apertura directa del App Store. Toca ··· (arriba) y selecciona Abrir en el navegador, o copia el enlace y pégalo en Safari.",
      androidMessage: "Cazaladrones está disponible actualmente para iPhone y iPad.",
      desktopCta: "Ver en el App Store",
      qrCaption: "Escanea para abrir esta página en tu iPhone",
      copyLink: "Copiar enlace",
      copyLinkDone: "Enlace copiado",
      lang: "es"
    },
    en: {
      title: "Download Cazaladrones",
      description: "Solve the mystery, analyze the clues, and find the culprit.",
      iosCta: "Open in the App Store",
      iosWebLink: "Open App Store web page",
      instagramNotice: "Instagram blocks opening the App Store directly. Tap ··· (top) and choose Open in browser, or copy the link and paste it into Safari.",
      androidMessage: "Cazaladrones is currently available for iPhone and iPad.",
      desktopCta: "View on the App Store",
      qrCaption: "Scan to open this page on your iPhone",
      copyLink: "Copy link",
      copyLinkDone: "Link copied",
      lang: "en"
    }
  };

  function detectLocale() {
    var navLang = (navigator.language || navigator.userLanguage || "es").toLowerCase();
    if (navLang.indexOf("en") === 0) return "en";
    return "es";
  }

  function buildAppStoreUrl() {
    var params = new URLSearchParams(window.location.search);
    var passthroughKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ct", "pt", "mt"];
    var storeParams = new URLSearchParams();
    passthroughKeys.forEach(function (key) {
      var value = params.get(key);
      if (value) storeParams.set(key, value);
    });
    var qs = storeParams.toString();
    return APP_STORE_HTTPS_BASE + (qs ? "?" + qs : "");
  }

  var currentStrings = STRINGS.es;

  function applyStrings(locale) {
    var s = STRINGS[locale];
    currentStrings = s;
    document.documentElement.lang = s.lang;
    document.getElementById("title").textContent = s.title;
    document.getElementById("description").textContent = s.description;
    document.getElementById("ios-cta-label").textContent = s.iosCta;
    document.getElementById("ios-web-link").textContent = s.iosWebLink;
    document.getElementById("android-message").textContent = s.androidMessage;
    document.getElementById("desktop-cta-label").textContent = s.desktopCta;
    document.getElementById("qr-caption").textContent = s.qrCaption;
    document.getElementById("copy-link-label").textContent = s.copyLink;

    if (isInstagram) {
      var notice = document.getElementById("instagram-notice");
      notice.textContent = s.instagramNotice;
      notice.classList.remove("hidden");
    }
  }

  function setupIOS() {
    var appStoreUrl = buildAppStoreUrl();
    var block = document.getElementById("ios-block");
    var cta = document.getElementById("ios-cta");
    var webLink = document.getElementById("ios-web-link");

    webLink.href = appStoreUrl;

    if (isInstagram) {
      // Instagram's in-app WebView silently drops itms-apps:// and JS
      // redirects, and actively blocks attempts to escape to Safari, so
      // both the primary CTA and the secondary web link would fail the
      // same way. Hide the redundant secondary link and instead give the
      // copy-link fallback — the only thing that reliably works here —
      // equal visual weight to the primary CTA.
      cta.href = appStoreUrl;
      cta.removeAttribute("role");
      webLink.classList.add("hidden");
      setupCopyLink(appStoreUrl);
    } else {
      cta.href = appStoreUrl;
      cta.addEventListener("click", function (event) {
        event.preventDefault();

        var fallbackTimer = null;
        var didHide = false;

        function cancelFallback() {
          didHide = true;
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          document.removeEventListener("visibilitychange", onHide);
          window.removeEventListener("pagehide", onHide);
          window.removeEventListener("blur", onHide);
        }

        function onHide() {
          if (document.hidden || document.visibilityState === "hidden") {
            cancelFallback();
          }
        }

        document.addEventListener("visibilitychange", onHide);
        window.addEventListener("pagehide", onHide);
        window.addEventListener("blur", onHide);

        fallbackTimer = setTimeout(function () {
          if (!didHide && !document.hidden) {
            window.location.href = appStoreUrl;
          }
        }, FALLBACK_DELAY_MS);

        window.location.href = ITMS_URL;
      });
    }

    block.classList.remove("hidden");
  }

  function setupCopyLink(url) {
    var btn = document.getElementById("copy-link-btn");
    var label = document.getElementById("copy-link-label");
    btn.classList.remove("hidden");

    btn.addEventListener("click", function () {
      copyToClipboard(url).then(function () {
        label.textContent = currentStrings.copyLinkDone;
        setTimeout(function () {
          label.textContent = currentStrings.copyLink;
        }, 2000);
      });
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (e) {
        // ignore — nothing more we can do
      }
      document.body.removeChild(textarea);
      resolve();
    });
  }

  function setupAndroid() {
    document.getElementById("android-block").classList.remove("hidden");
  }

  function setupDesktop() {
    var appStoreUrl = buildAppStoreUrl();
    var block = document.getElementById("desktop-block");
    var link = document.getElementById("desktop-link");
    link.href = appStoreUrl;
    block.classList.remove("hidden");

    try {
      var canvas = document.getElementById("qr-canvas");
      var qr = qrcode(0, "M");
      qr.addData(window.location.href);
      qr.make();
      drawQrToCanvas(qr, canvas, 140);
    } catch (e) {
      document.querySelector(".qr-wrap").classList.add("hidden");
    }
  }

  function drawQrToCanvas(qr, canvas, size) {
    var count = qr.getModuleCount();
    var cellSize = Math.floor(size / count) || 1;
    var actualSize = cellSize * count;
    canvas.width = actualSize;
    canvas.height = actualSize;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, actualSize, actualSize);
    ctx.fillStyle = "#0b1f4d";
    for (var row = 0; row < count; row++) {
      for (var col = 0; col < count; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  function init() {
    var locale = detectLocale();
    applyStrings(locale);

    if (isIOS) {
      setupIOS();
    } else if (isAndroid) {
      setupAndroid();
    } else {
      setupDesktop();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
