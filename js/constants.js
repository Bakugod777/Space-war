/**
 * Space War — constantes de balance y configuración.
 * Un solo sitio para tunear sin cazar magic numbers.
 */
(function (global) {
  const CONFIG = {
    PLAYER: {
      MAX_HEARTS: 3,
      NORMAL_FIRE_MS: 500,
      BOOSTED_FIRE_MS: 150,
      IFRAME_MS: 650,
      IFRAME_BOSS_MS: 2200,
      INVULN_SECS: 6,
    },
    SPAWN: {
      TOUCH_PAUSE_MS: 3000,
      TOUCH_GRACE_MS: 2500,
      POST_BOSS_BREATHER_MS: 10000,
    },
    BOSS: {
      LEVELS: [10, 20, 30],
      MINI_LEVELS: [4, 7, 13, 16, 22, 25],
    },
    LOOT: {
      PICKUP_SIZE: 48,
      FALL_SPEED: 1.6,
    },
    COLORS: {
      TEAL: "#4EDAD2",
      PINK: "#FF8AD8",
      GOLD: "#FFD54F",
      DANGER: "#FF4D7A",
    },
  };
  global.CONFIG = CONFIG;
})(window);
