# Space War v2.1 — magia

- Gema del alma: se oscurece cada vez que te pegan (5 estados). Los enemigos a veces sueltan semillas, que la limpian. Con la gema negra la Magia casi no carga.
- Barra Magia (marco 9-slice): carga con golpes, bajas y combos. Cuando se llena aparece el botón MAGIA del lado del disparo (también la tecla X): corte con la chibi que recogiste último, flash, la pantalla queda limpia y el jefe recibe un buen golpe.
- Combo de equipo: junta 3 aliadas distintas en 12 s y ganas +50 de Magia, la gema se limpia un poco y te dan un escudo.
- Laberinto de la bruja: el jefe pelea en 3 fases (espiral, flor que gira, cortina + tiro dirigido), con fondo propio por fase y 1 s de aviso antes de cada fase. Al vencerla: "la bruja cayó".
- Nave nueva en pixel art cian de 32 px. Todo el mundo se escala por un entero (las naves ya no se estiran). El jefe se queda en 256×128.
- Botones planos rosa (Iniciar, Disparar con la estrella), barra de recarga con el relleno Magia, la carta Carga en dorado y el fondo de los modales al 85 %.
- Los avisos de logros ahora son una tira de 32 px abajo al centro: no tapan vidas ni botones y no salen al cargar.
- Textos nuevos en español con voz propia ("¿lista para otra ronda?", "se acabó la ronda / otra vez", "¡auch!", "1 enemigo más"). Ya no queda la pantalla de Game Over en inglés.
- Teclado por defecto: flechas + Shift derecho o Enter; alternativa WASD + J; X = Magia; P = pausa. Todas las teclas se pueden cambiar.
- Partida con semilla de verdad: un RNG propio para spawns, oleadas, cartas y drops (los efectos siguen usando Math.random). La misma semilla da exactamente la misma partida en ?sim=1.
- Modo simulación: ?sim=1&runs=N&seed=S&maxmin=M. Un bot juega partidas completas y escribe en consola el nivel, la vida y el tiempo de cada una.
- localStorage blindado (store.js): try/catch, validación y versión de esquema. Si algo está corrupto vuelve a valores limpios y repara la clave.
- Arreglos: la subida de nivel podía quedarse trabada (bug que también está en v2.0); al reiniciar se podía quedar sin disparar; curva de niveles geométrica.
- Caché offline: space-war-v2.1.0 (borra las anteriores).
