# GeoReporte — PWA de geolocalización consciente

Práctica de PWA en JavaScript Vanilla que encapsula la Geolocation API en
promesas reutilizables, solicita consentimiento contextual y ofrece una zona
manual cuando no hay permiso, señal o tiempo suficiente.

## Funcionalidad

- `geo-helper.js` normaliza las coordenadas y traduce los errores nativos.
- La ubicación nunca se solicita al cargar la página.
- El diálogo nativo se dispara desde un botón, compatible con WebKit/iOS.
- Una precisión menor a 30 m se presenta como **Precisión GPS Alta**.
- Una precisión de 30 m o más se presenta como **Ubicación Aproximada
  (Wi-Fi / IP)**.
- Ante permiso denegado, posición no disponible o `TIMEOUT`, se activa el
  selector manual.
- El App Shell está disponible sin conexión mediante un Service Worker.
- No usa librerías, `async` ni `await`.

## Probar localmente

La geolocalización requiere un contexto seguro. Los navegadores consideran
`localhost` seguro para desarrollo:

```bash
python3 -m http.server 8080
```

Después abre `http://localhost:8080`. No abras `index.html` directamente con
`file://`, porque el Service Worker no se registrará.

## Publicar en GitHub Pages

1. Crea un repositorio vacío en GitHub.
2. Desde esta carpeta ejecuta:

   ```bash
   git init
   git add .
   git commit -m "Completa práctica PWA de geolocalización"
   git branch -M main
   git remote add origin URL_DE_TU_REPOSITORIO
   git push -u origin main
   ```

3. En GitHub abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Elige la rama `main`, la carpeta `/ (root)` y guarda.

Las rutas son relativas, por lo que la aplicación funciona dentro de la ruta
de proyecto que asigna GitHub Pages.

## Probar en iPhone

1. Abre la URL HTTPS de GitHub Pages en Safari.
2. Pulsa **Compartir → Agregar a pantalla de inicio**.
3. Prueba el permiso una vez en Safari y otra desde la PWA instalada: iOS los
   administra por separado.
4. Si el permiso quedó bloqueado, revísalo en **Ajustes → Privacidad y
   seguridad → Localización**.

Para volver a probar cambios del Service Worker, recarga la página; si iOS
mantiene una versión anterior, elimina la PWA de inicio y agrégala nuevamente.
