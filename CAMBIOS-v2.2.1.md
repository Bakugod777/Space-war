# Space War · v2.2.1 — cambios

## Arte y HUD
- Ya no asoma un corazón rojo detrás de la gema de vida.
- Las dos barras de encima de los botones ya no son iguales: la de Magia sigue rosa y la de recarga del disparo ahora es cian (#3FE0F0).
- La barra del jefe es violeta plano (#9B6BFF), sin degradado ni brillo, y el jefe aparece debajo de ella, así su nombre nunca le tapa el sprite.
- Avisos de fase más cortos ("fase 1 ¡ojo!", "fase 2: pétalos", "fase 3 ¡última!"), que ya no se cortan en 375. Salen arriba, debajo de la barra del jefe, y nunca encima de la nave.
- Meteoros nuevos en píxel: grandes de 32 px y chicos de 16 px, a escala entera y sin suavizado. Giran cambiando de cuadro cada 150 ms (el canvas no se rota) y al romperse sueltan de 3 a 5 escombros.

## Jefe
- Más vida (sigue ajustada a tu daño por segundo) y 2,5 s de respiro después de cada golpe durante la pelea.

## Técnico
- Caché offline v2.2.1, que incluye la hoja de meteoros.
- Las capturas de mejora ahora muestran la tarjeta abierta de verdad.
