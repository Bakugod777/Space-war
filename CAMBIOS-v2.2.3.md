# Space War · v2.2.3 — cambios

## Jefe
- La cortina ahora es más rala: menos columnas, huecos más anchos, más lenta y con más tiempo entre oleadas. La flor también se suavizó (8 pétalos en vez de 12, un poco más lentos).
- La ráfaga de dos balas sale cada 8 s en vez de cada 6.
- La vida del jefe ahora sí depende de tu daño y del nivel: se calcula en relación con tu daño base (cadencia, abanico y daño de tus cartas) y suma un 5 % por nivel desde el 10.
- Si le ganas: +3 gemas (sin pasar del máximo), aviso "¡le ganaste! +3 gemas · respira" y 10 s sin enemigos. Después, durante un minuto, el nivel 11 entra suave.

## Escritorio
- Campo vertical: en pantallas horizontales sin táctil el juego usa un campo de al menos 390×700, centrado y siempre a escala entera (en 1366×768 queda de 430×768 a ×1).
- A los costados se ve el laberinto lejano atenuado al 50 %, con una línea de 2 px #1B2440 en el borde. Nada de barras negras planas.
- El HUD (nivel, puntaje, gema, MAGIA, pausa y ajustes) queda dentro del campo.
- En el celular no cambia nada.

## Técnico
- La vibración solo se pide después del primer toque o tecla, así ya no sale el aviso en la consola.
- Caché offline v2.2.3.
- Simulación: con `?sim=1&simvw=1366&simvh=768` se prueba el campo de escritorio.
