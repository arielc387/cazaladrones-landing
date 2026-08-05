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
   - Si el user agent contiene `Instagram`, se muestra un aviso indicando cómo abrir en el navegador externo (menú `···` → "Abrir en el navegador").
   - Se incluye el Smart App Banner `<meta name="apple-itunes-app" content="app-id=6790215107">`.
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

- El WebView interno de Instagram (basado en un motor restringido) a veces bloquea o ignora redirecciones a esquemas personalizados (`itms-apps://`) e incluso a enlaces HTTPS directos al App Store, dependiendo de la versión de la app y del sistema operativo.
- Por eso se muestra siempre el enlace HTTPS visible como alternativa manual, y un aviso que indica al usuario abrir la página en el navegador externo mediante el menú `···` cuando se detecta Instagram por user agent.
- No es posible detectar de forma fiable, solo con JavaScript, si el intento de apertura de `itms-apps://` fue bloqueado silenciosamente por el WebView (a diferencia de que el usuario simplemente no tenga la app instalada); el fallback de 900 ms es una heurística, no una garantía.
