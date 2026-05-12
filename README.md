# ruleta spinner official

Aplicación estática en HTML, CSS y JavaScript para hacer sorteos visuales con una ruleta de apariencia equitativa.

## Archivos

- `index.html`: estructura de la interfaz.
- `styles.css`: tema oscuro, layout y estilos visuales.
- `app.js`: estado, dibujo del canvas, selección de ganador y animación.
- `render.yaml`: configuración base para desplegarlo como Static Site en Render.

## Uso local

No requiere instalación ni build.

1. Abre `index.html` en un navegador moderno.
2. Añade nombres con Enter o con el botón `Agregar`.
3. Pulsa `Girar` para seleccionar un ganador y eliminarlo de la ruleta.

## Despliegue en Render

### Opción 1: con `render.yaml`

1. Sube esta carpeta a un repositorio propio.
2. En Render, crea un nuevo servicio desde el repositorio.
3. Render detectará `render.yaml` y propondrá el despliegue estático.
4. Al terminar, obtendrás una URL pública `onrender.com`.

### Opción 2: configuración manual

Si prefieres configurarlo desde el panel:

- Tipo de servicio: `Static Site`
- Build Command: dejar vacío
- Publish Directory: `.`

## Notas

- La ruleta usa sectores visualmente iguales.
- Cuando solo queda un participante, el canvas se dibuja como un círculo sólido sin separadores.
- El giro usa una curva de salida suave durante aproximadamente 4 segundos.
