# RALLY / TENNIS — HERO en Astro

## Instalación

Descomprime en tu carpeta CODIGO y conserva esta estructura:

```text
CODIGO/
  IMG/ESCENA-1-WebP/ezgif-frame-001.webp
  IMG/ESCENA-1-WebP/…
  IMG/ESCENA-1-WebP/ezgif-frame-094.webp
  src/components/HeroSaque.astro
  src/pages/index.astro
  src/scripts/hero-saque.js
  src/styles/hero-saque.css
  astro.config.mjs
  package.json
```

El ZIP no contiene los fotogramas: solo recibimos su listado.
Si los tienes directamente dentro de CODIGO/IMG, crea ESCENA-1-WebP y muévelos ahí.
El listado original indicaba CLUB TENNIS/IMG/ESCENA-1-WebP: si siguen allí, copia esa
carpeta dentro de CODIGO/IMG. Respeta las mayúsculas y minúsculas.

Astro usa IMG como directorio público gracias a `publicDir: './IMG'`.
No necesitas mover las imágenes a public. Su primera URL será
`/ESCENA-1-WebP/ezgif-frame-001.webp`.

Abre CODIGO en VS Code, abre una terminal en esa carpeta y ejecuta:

```sh
npm install
npm run dev
```

Usa Node.js 22.12+ o Node.js 24. Abre la URL indicada por Astro, habitualmente
http://localhost:4321. No abras el .astro con doble clic ni uses Live Server.
Para producción: `npm run build` y después `npm run preview`.

## Ajusta el impacto

1. Abre http://localhost:4321/?debug=1.
2. Arrastra Fotograma hasta ver el contacto entre cuerdas y pelota.
3. Introduce ese número en Impacto para probar la aparición.
4. Guarda ese número en `impactFrame`, en src/components/HeroSaque.astro.
5. Abre la URL sin ?debug=1 para ocultar el panel.

El valor inicial 55 es PROVISIONAL: no se ha confirmado el impacto porque no
recibimos las imágenes. El panel no guarda los cambios automáticamente.
`revealFrames: 7` hace aparecer texto y CTA desde el impacto durante siete imágenes.
Pon 1 para aparición inmediata. El scroll inverso deshace la aparición.

## Archivos y ajustes

- HTML y configuración: src/components/HeroSaque.astro.
- CSS: src/styles/hero-saque.css.
- JS: src/scripts/hero-saque.js.
- Página de prueba: src/pages/index.astro.
- Recorrido: `.serve { height: 400svh; }`. Aumenta el valor para avanzar más despacio.
- El último 12% del recorrido conserva la última imagen para leer el mensaje.
- El CTA abre un diálogo de prueba; conecta su acción con el destino real después.

Se utiliza contain para no cortar el cuerpo del jugador. Puede quedar espacio
oscuro alrededor según la proporción de la pantalla. En móvil vertical, imagen
arriba y texto abajo. Comprueba la composición con los fotogramas reales.
La fuente usa Impact/Arial Narrow locales; no incluye una tipografía comercial.

## Funcionamiento y límites

Solo HERO, sin más secciones. Canvas, scroll nativo y sticky. Sin React ni GSAP.
Máximo tres cargas simultáneas y 18 imágenes decodificadas en memoria; el navegador
puede aprovechar su caché HTTP para las demás. No se cargan las 94 decodificadas a la vez.
En desplazamientos rápidos puede mostrar brevemente la imagen disponible más cercana.
El texto sigue a la imagen realmente dibujada. No bloquea el scroll durante la carga.
La preferencia de movimiento reducido muestra una imagen y el texto estáticos.
Sin JavaScript también se muestran el primer fotograma y el mensaje, sin interacción.

Comprobaciones: compilación de Astro y sintaxis JS. La validación visual del saque
requiere añadir los 94 WebP originales, ausentes del adjunto.
