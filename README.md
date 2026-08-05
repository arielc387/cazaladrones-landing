# Cazaladrones — Landing page

Landing page estática, sin frameworks, para reemplazar el Deepview de Branch al compartir el enlace de **Cazaladrones: Detective** en Instagram y otras redes.

- App Store: https://apps.apple.com/mx/app/cazaladrones-detective/id6790215107
- Sin analítica, cookies ni rastreadores.
- Sin dependencia de Branch (`*.app.link` / `*-alternate.app.link`).

## Cómo funciona

1. **Detección de plataforma** (`app.js`): distingue iOS, Android y escritorio a partir de `navigator.userAgent` / `navigator.platform`.
2. **Idioma**: se detecta con `navigator.language`. Si empieza con `en`, se usa inglés; en cualquier otro caso (incluido "no disponible"), el fallback es español.
3. **iOS**:
   - Al tocar el botón, en el mismo gesto del usuario se intenta abrir `itms-apps://itunes.apple.com/mx/app/cazaladrones-detective/id6790215107`.
   - Si la página sigue visible ~900 ms después (la app no se abrió), se redirige a `https://apps.apple.com/mx/app/cazaladrones-detective/id6790215107`.
   - Los eventos `visibilitychange`, `pagehide` y `blur` cancelan el fallback si el App Store (o la app) se abrió.
   - Se muestra además un enlace HTTPS visible "Abrir página web del App Store".
   - Si el user agent contiene `Instagram`, se omite por completo el intento con `itms-apps://` (Instagram lo bloquea en silencio y consume el gesto del usuario sin efecto). En su lugar, el botón navega directamente con un `<a href>` real al enlace HTTPS del App Store (mejor oportunidad de que iOS intercepte el Universal Link), se muestra de forma prominente el aviso "toca ··· y selecciona Abrir en el navegador", y aparece un botón **"Copiar enlace"** (Clipboard API con fallback a `execCommand`) para que el usuario pueda pegarlo manualmente en Safari — el único método 100% confiable dentro del WebView de Instagram.
   - Se incluye el Smart App Banner `<meta name="apple-itunes-app" content="app-id=6790215107">` (solo tiene efecto en Safari real, no dentro del WebView de Instagram).
4. **Android**: se muestra un mensaje indicando que la app está disponible actualmente solo para iPhone y iPad. No se intenta abrir Google Play.
5. **Escritorio**: se muestra el enlace al App Store y un código QR generado 100% en el cliente (sin servicios externos) que apunta a la URL publicada de esta página, usando la librería vendorizada `qrcode.min.js` ([qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), MIT, Kazuhiko Arase).
6. **Parámetros de campaña**: si la URL de la landing incluye `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `ct`, `pt` o `mt`, se reenvían tal cual al enlace del App Store.

## Estructura

```
index.html          # Markup, meta tags, Smart App Banner
app.js               # Detección de plataforma/idioma, lógica de apertura iOS, QR
qrcode.min.js        # Librería QR vendorizada (MIT) — sin llamadas de red
.nojekyll            # Evita el procesamiento Jekyll de GitHub Pages
.github/workflows/pages.yml  # Despliegue automático a GitHub Pages
```

## Publicar / actualizar

El workflow `.github/workflows/pages.yml` despliega automáticamente a GitHub Pages en cada push a `main`, usando `actions/deploy-pages`.

Requisito único (una sola vez, vía UI o `gh api`): en **Settings → Pages** del repositorio, el "Source" debe estar configurado como **GitHub Actions** (no "Deploy from a branch").

```bash
gh api -X PUT repos/<owner>/cazaladrones-landing/pages \
  -f build_type=workflow
```

## Pruebas realizadas

- Simulación de user agents de iOS Safari, iOS + Instagram, Android Chrome y escritorio (Chrome/Firefox) para validar la rama de detección correcta.
- Verificación visual responsive en anchos de 320px–1440px.
- Verificación de que `navigator.language` en `en-US`, `en-GB`, `es-MX`, `es-ES` y `fr-FR` (fallback a español) selecciona el idioma correcto.
- Búsqueda en todo el repositorio de referencias a `branch`, `app.link` o `alternate.app.link`: ninguna encontrada.
- Verificación de que todos los recursos (icono, librería QR, script) se cargan por HTTPS o son locales al repositorio.
- Generación de QR local confirmada por inspección del canvas renderizado (sin peticiones de red salientes).

## Limitaciones conocidas del WebView de Instagram

- El WebView interno de Instagram (WKWebView restringido) bloquea en silencio los esquemas personalizados como `itms-apps://`, y también intercepta/bloquea activamente los trucos habituales para "escapar" (`window.open`, `target="_blank"`, `location.href` a otro dominio), a diferencia de Safari o Chrome iOS. Esto está documentado ampliamente y no depende de nuestro código — es una restricción del lado de Instagram.
- Por eso, cuando se detecta Instagram, la landing **no** intenta `itms-apps://` (perdería el gesto del usuario sin efecto). En su lugar prioriza: 1) un `<a href>` real hacia el enlace HTTPS del App Store (para darle a iOS la mejor oportunidad de interceptar el Universal Link), 2) un aviso visible antes del tap indicando usar el menú `···` → "Abrir en el navegador", y 3) un botón "Copiar enlace" como alternativa 100% confiable.
- El Smart App Banner (`apple-itunes-app`) solo lo renderiza Safari real; no aparece dentro del WebView de Instagram.
- No hay forma, solo con JavaScript, de forzar a Instagram a entregar la navegación a Safari — Apple no ofrece una API pública equivalente al esquema `intent://` de Android. La combinación de enlace real + copiar enlace + instrucción manual es, según la documentación pública disponible en 2026, el método más confiable sin depender de servicios de terceros.
