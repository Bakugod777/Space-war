# Space War · v2.2 — cambios

## Look
- Chau degradados: no queda ni uno, ni en el CSS ni en el canvas. Ahora todo es color plano, papel y píxel.
- En escritorio el juego se agranda al mayor múltiplo entero que entra en pantalla (en 1366×768 se ve al doble), así los píxeles quedan nítidos.

## HUD
- La vida ahora es una gema (×N) arriba a la derecha y el botiquín es la semilla del laberinto.
- La barra del jefe es finita (12 px), aparece una sola vez y se coloca debajo de la gema, así nunca la tapa.
- El nivel que muestra la tarjeta de mejora es el mismo del HUD, y el fondo queda al 85 %.
- Los avisos salen por encima de los controles y ya no se pisan con nada en iPhone SE, 14 y Pro Max, Android, horizontal y escritorio.
- MAGIA es un botón de 72×72 px, bien separado de DISPARAR (50 px en vertical y 37 px en horizontal).
- Arreglado: la barra de Magia y la gema eran invisibles en la v2.1, y el botón MAGIA no aparecía en escritorio.

## Ritmo y dificultad
- La partida va más tranquila, pensada para durar unos 10 minutos: los primeros niveles piden tiempo mínimo y los enemigos aparecen poco a poco durante los primeros 3 minutos.
- Los niveles después del 3 piden más tiempo: el jefe llega cerca del minuto 7:30.
- Kamikazes desde el nivel 4 y abanicos desde el 6; al principio sus balas van más lentas.
- Escudo de novato: durante los primeros 2:30 se recarga cada 15 s.
- La vida del jefe se ajusta a tu daño por segundo y al nivel, así la pelea no se acaba en un suspiro.
- El jefe sigue siendo peligroso, pero ya no es un muro: tira dos meteoros en vez de cuatro (y más chicos), sus balas van más lentas, la espiral es menos densa y después de cada golpe tienes 2 s de respiro.
- Arreglado: el golpe de Magia contra el jefe recargaba la Magia al instante y lo derretía en segundos.

## Estabilidad
- Todos los ajustes guardados (volumen, récord, contadores) se validan y se limitan a valores razonables. Un volumen roto ya no tumba la partida.

## Pruebas
- El bot de simulación juega como una persona y tiene tres niveles: `?sim=1&skill=good|medio|casual`.
