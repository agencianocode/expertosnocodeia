# Imágenes de la landing (marketing-landing)

Checklist antes de **push a Railway**: validar que todas las imágenes carguen y, si quieres mejor rendimiento, convertir a WebP.

---

## Estado actual (todas en repo y cargan)

| Ruta | Archivo | Formato | En repo |
|------|---------|---------|---------|
| `/logo-hero.png` | logo-hero.png | PNG | Sí |
| `/fundador.webp` | fundador.webp | **WebP** | Sí |
| `/sea-honesto-persona.png` | sea-honesto-persona.png | PNG | Sí |
| `/sello-garantia-15-dias.png` | sello-garantia-15-dias.png | PNG | Sí |
| `/card-comunidad-bg.jpg` | card-comunidad-bg.jpg | JPG | Sí |
| `/card-comunidad-bg-2.jpg` | card-comunidad-bg-2.jpg | JPG | **Opcional**: la 2.ª card usa ahora `card-comunidad-bg.jpg`. Para una imagen distinta, añade `card-comunidad-bg-2.jpg` y en el código cambia la 2.ª card a `url(/card-comunidad-bg-2.jpg)`. |
| `/card-comunidad-bg-3.jpg` | card-comunidad-bg-3.jpg | JPG | Sí |
| `/testimonios/carrusel-1.jpg` … `carrusel-8.jpg` | testimonios/*.jpg | JPG | Sí |
| `/que-recibire/*.png` | 9 imágenes en que-recibire/ | PNG | Sí |
| `/logos/*.avif` | logos de herramientas | AVIF | Sí |

---

## Recomendación: convertir a WebP (opcional)

Para que se vean igual de bien y carguen más rápido en móvil, convierte a **WebP** (calidad 80–85) y actualiza las rutas en el código:

| Actual | Pasar a |
|--------|--------|
| logo-hero.png | logo-hero.webp |
| sea-honesto-persona.png | sea-honesto-persona.webp |
| sello-garantia-15-dias.png | sello-garantia-15-dias.webp |
| card-comunidad-bg.jpg (y 2, 3) | card-comunidad-bg.webp, etc. |
| que-recibire/*.png | que-recibire/*.webp |
| testimonios/carrusel-*.jpg | testimonios/carrusel-*.webp (opcional) |

Los **logos** en `/logos/*.avif` ya están en formato moderno; no es necesario cambiarlos.

---

## Cómo validar antes del push

1. **En local:** `npm run dev` → abrir la landing y revisar que no haya imágenes rotas.
2. **DevTools → Network:** filtrar por "Img" y comprobar que no haya 404.
3. **Git:** asegurarse de que los archivos que añadiste estén en el commit (`git add client/public/...`).
4. Después del push, en la URL de Railway comprobar de nuevo que todas las imágenes carguen.
