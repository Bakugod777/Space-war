# Space War · v2.2.2 — cambios

## Jefe
- Arreglado: la Magia se recargaba con cada impacto, así que contra el jefe estaba lista casi todo el tiempo y cada golpe le quitaba un 15 % de su vida máxima. La pelea duraba siempre lo mismo, sin importar cuánta vida tuviera. Ahora, contra el jefe, la Magia se carga sola con el tiempo (una vez cada 15 s) y su golpe quita un 12 %.
- La vida del jefe tiene un piso firme (650) y escala con tu daño por segundo y el nivel. La idea es que la pelea dure entre 30 y 60 s.
- Ataques más justos:
  - La ráfaga son dos balas a los lados, cada 6 s y más lentas, así el centro queda libre para disparar.
  - La espiral es menos densa y la flor tiene huecos más amplios.
  - En la fase 3, la cortina va más espaciada y el tiro dirigido sale una vez sí y otra no.
- Después de cada golpe en la pelea tienes 3,5 s de respiro.
- Chau el cartel "¡cuidado! / entras al laberinto": tapaba al jefe y salía junto a "fase 1 ¡ojo!". Ahora queda solo el aviso de fase.

## Ritmo
- Después del minuto 2 la presión sube más despacio y llega a su máximo recién en el minuto 8.

## Textos
- "Casco reforzado" ahora dice "+1 gema y te cura". La vida también se nombra como gema en los demás textos: gema extra, gema temporal y el logro "Alcanza 6 gemas de vida".

## Simulación (para pruebas)
- Cada golpe registra qué ataque o enemigo lo dio.
- El campo de juego es fijo (390×844), así el resultado ya no depende del tamaño de la ventana. Antes, en una ventana de escritorio, el campo quedaba muy bajo y el bot moría casi siempre.
- Comando: `python3 -m http.server 8769` en la carpeta del juego y abrir
  `http://localhost:8769/index.html?sim=1&runs=30&seed=900&maxmin=13&skill=medio`
  (`skill` puede ser `good`, `medio` o `casual`; `simvw`/`simvh` cambian el campo). El resumen sale en la consola con las líneas `[sim]`.
