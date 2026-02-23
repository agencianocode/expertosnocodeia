# Logo en la página de checkout

Para que tu logo aparezca en la página de checkout (arriba a la izquierda, como en la referencia):

1. Guarda tu imagen de logo como **`logo.png`** en esta misma carpeta:  
   `client/public/logo.png`

2. Tamaño recomendado: cuadrado, por ejemplo **128×128 px** o **256×256 px** (se mostrará a 40×40 px en la página).

3. Si usas otro nombre o formato, edita en `client/src/pages/checkout.tsx` la línea que tiene `src="/logo.png"` y cámbiala por tu archivo (ej: `src="/mi-logo.svg"`).

Si no hay `logo.png`, la imagen no se muestra y solo se ve el texto "Expertos NoCode IA".
