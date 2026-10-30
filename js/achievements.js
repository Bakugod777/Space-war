/**
 * Space War — logros y estadísticas de jugador.
 * Expone playerStats, checkAchievements, updateStatsOn*.
 */
// =================== SISTEMA DE LOGROS ÉPICO ===================

// Estadísticas del jugador para logros
let playerStats = {
  totalScore: 0,
  cumulativeScore: 0, // Nueva estadística para puntuación acumulativa
  totalKills: 0,
  totalShots: 0,
  totalGameTime: 0,
  maxLevel: 0,
  maxHearts: 0,
  powerUpsCollected: 0,
  bossesKilled: 0,
  meteorsDestroyed: 0,
  gamesPlayed: 0,
  totalDamageReceived: 0,
  consecutiveKills: 0,
  maxConsecutiveKills: 0,
  xiaosCollected: 0,
  arleesCollected: 0,
  cynosCollected: 0,
  kitsCollected: 0,
  flinsCollected: 0,
  timeWithoutDamage: 0,
  maxTimeWithoutDamage: 0,
  perfectLevels: 0,
  enemyTypesKilled: {
    type1: 0,
    type2: 0,
    type3: 0,
    type4: 0,
    fast: 0,
    tank: 0,
    kamikaze: 0,
    fan: 0,
    splitter: 0,
    familiar: 0,
    ribbon: 0,
    grief: 0,
    witch: 0,
    sniper: 0,
    orbiter: 0,
    shield: 0,
    bomber: 0,
    phantom: 0,
    crystal: 0,
    huntress: 0,
    weaver: 0,
    drone: 0,
    hex: 0,
    ifa: 0,
    xiao_weapon: 0,
  },
  miniBossesKilled: 0,
  sessionStartTime: 0,
};

// Definición de todos los logros épicos
const achievements = [
  {
    id: "first_blood",
    name: "Primera señal",
    description: "Destruye tu primer enemigo en combate.",
    category: "combat",
    rarity: "common",
    points: 10,
    icon: "sword",
    condition: () => playerStats.totalKills >= 1,
    unlocked: false,
  },
  {
    id: "newbie_killer",
    name: "Cadete de combate",
    description: "Elimina 5 enemigos.",
    category: "combat",
    rarity: "common",
    points: 15,
    icon: "sword",
    condition: () => playerStats.totalKills >= 5,
    unlocked: false,
  },
  {
    id: "marksman",
    name: "Puntería firme",
    description: "Dispara 100 veces.",
    category: "combat",
    rarity: "common",
    points: 15,
    icon: "target",
    condition: () => playerStats.totalShots >= 100,
    unlocked: false,
  },
  {
    id: "trigger_happy",
    name: "Ráfaga inicial",
    description: "Dispara 25 veces.",
    category: "combat",
    rarity: "common",
    points: 10,
    icon: "blast",
    condition: () => playerStats.totalShots >= 25,
    unlocked: false,
  },
  {
    id: "slayer",
    name: "Cazadora orbital",
    description: "Destruye 50 enemigos.",
    category: "combat",
    rarity: "rare",
    points: 25,
    icon: "skull",
    condition: () => playerStats.totalKills >= 50,
    unlocked: false,
  },
  {
    id: "genocide",
    name: "Tormenta del vacío",
    description: "Destruye 500 enemigos.",
    category: "combat",
    rarity: "epic",
    points: 50,
    icon: "skull",
    condition: () => playerStats.totalKills >= 500,
    unlocked: false,
  },
  {
    id: "killing_spree",
    name: "Racha encendida",
    description: "Elimina 10 enemigos seguidos sin recibir daño.",
    category: "combat",
    rarity: "rare",
    points: 30,
    icon: "fire",
    condition: () => playerStats.maxConsecutiveKills >= 10,
    unlocked: false,
  },
  {
    id: "unstoppable",
    name: "Imparable",
    description: "Elimina 25 enemigos seguidos sin recibir daño.",
    category: "combat",
    rarity: "epic",
    points: 75,
    icon: "bolt",
    condition: () => playerStats.maxConsecutiveKills >= 25,
    unlocked: false,
  },
  {
    id: "boss_slayer",
    name: "Cazadora de jefes",
    description: "Derrota a tu primer jefe.",
    category: "combat",
    rarity: "epic",
    points: 100,
    icon: "crown",
    condition: () => playerStats.bossesKilled >= 1,
    unlocked: false,
  },
  {
    id: "boss_destroyer",
    name: "Rompetitanes",
    description: "Derrota 5 jefes.",
    category: "combat",
    rarity: "legendary",
    points: 200,
    icon: "dragon",
    condition: () => playerStats.bossesKilled >= 5,
    unlocked: false,
  },
  {
    id: "meteor_master",
    name: "Rompecometas",
    description: "Destruye 20 meteoritos.",
    category: "combat",
    rarity: "rare",
    points: 40,
    icon: "meteor",
    condition: () => playerStats.meteorsDestroyed >= 20,
    unlocked: false,
  },
  {
    id: "diversified_killer",
    name: "Arsenal completo",
    description: "Elimina al menos 10 enemigos de cada tipo principal.",
    category: "combat",
    rarity: "epic",
    points: 60,
    icon: "mask",
    condition: () => {
      const types = playerStats.enemyTypesKilled;
      return (
        types.type1 >= 10 &&
        types.type2 >= 10 &&
        types.type3 >= 10 &&
        types.type4 >= 10
      );
    },
    unlocked: false,
  },
  {
    id: "survivor",
    name: "Superviviente",
    description: "Acumula 5 minutos de vuelo en total.",
    category: "survival",
    rarity: "common",
    points: 20,
    icon: "shield",
    condition: () => playerStats.totalGameTime >= 300000,
    unlocked: false,
  },
  {
    id: "marathon_runner",
    name: "Órbita larga",
    description: "Juega durante 1 hora en total.",
    category: "survival",
    rarity: "rare",
    points: 50,
    icon: "run",
    condition: () => playerStats.totalGameTime >= 3600000,
    unlocked: false,
  },
  {
    id: "level_master",
    name: "Maestra de niveles",
    description: "Alcanza el nivel 20.",
    category: "survival",
    rarity: "epic",
    points: 80,
    icon: "star",
    condition: () => playerStats.maxLevel >= 20,
    unlocked: false,
  },
  {
    id: "level_god",
    name: "Cima estelar",
    description: "Alcanza el nivel 50.",
    category: "survival",
    rarity: "legendary",
    points: 150,
    icon: "spark",
    condition: () => playerStats.maxLevel >= 50,
    unlocked: false,
  },
  {
    id: "untouchable",
    name: "Intocable",
    description: "Mantente 2 minutos sin recibir daño.",
    category: "survival",
    rarity: "epic",
    points: 70,
    icon: "ghost",
    condition: () => playerStats.maxTimeWithoutDamage >= 120000,
    unlocked: false,
  },
  {
    id: "iron_will",
    name: "Voluntad de hierro",
    description: "Completa un nivel sin recibir daño.",
    category: "survival",
    rarity: "rare",
    points: 35,
    icon: "hammer",
    condition: () => playerStats.perfectLevels >= 1,
    unlocked: false,
  },
  {
    id: "perfectionist",
    name: "Perfección orbital",
    description: "Completa 5 niveles sin recibir daño.",
    category: "survival",
    rarity: "epic",
    points: 100,
    icon: "gem",
    condition: () => playerStats.perfectLevels >= 5,
    unlocked: false,
  },
  {
    id: "heart_collector",
    name: "Reserva vital",
    description: "Alcanza 6 gemas de vida.",
    category: "survival",
    rarity: "rare",
    points: 40,
    icon: "heart",
    condition: () => playerStats.maxHearts >= 6,
    unlocked: false,
  },
  {
    id: "first_powerup",
    name: "Primera mejora",
    description: "Recolecta tu primer power-up.",
    category: "collection",
    rarity: "common",
    points: 10,
    icon: "gift",
    condition: () => playerStats.powerUpsCollected >= 1,
    unlocked: false,
  },
  {
    id: "powerup_addict",
    name: "Ingeniera de suministros",
    description: "Recolecta 50 power-ups.",
    category: "collection",
    rarity: "rare",
    points: 30,
    icon: "capsule",
    condition: () => playerStats.powerUpsCollected >= 50,
    unlocked: false,
  },
  {
    id: "xiao_fan",
    name: "Aliada de Xiao",
    description: "Recolecta 10 power-ups de Xiao.",
    category: "collection",
    rarity: "rare",
    points: 25,
    icon: "leaf",
    condition: () => playerStats.xiaosCollected >= 10,
    unlocked: false,
  },
  {
    id: "arlee_enthusiast",
    name: "Ritmo de Arlee",
    description: "Recolecta 10 power-ups de Arlee.",
    category: "collection",
    rarity: "rare",
    points: 25,
    icon: "bow",
    condition: () => playerStats.arleesCollected >= 10,
    unlocked: false,
  },
  {
    id: "cyno_devotee",
    name: "Pacto de Cyno",
    description: "Recolecta 10 power-ups de Cyno.",
    category: "collection",
    rarity: "rare",
    points: 25,
    icon: "bolt",
    condition: () => playerStats.cynosCollected >= 10,
    unlocked: false,
  },
  {
    id: "flins_fortune",
    name: "Fortuna de Flins",
    description: "Recolecta 5 power-ups de Flins.",
    category: "collection",
    rarity: "epic",
    points: 40,
    icon: "coin",
    condition: () => playerStats.flinsCollected >= 5,
    unlocked: false,
  },
  {
    id: "genshin_collector",
    name: "Colección especial",
    description: "Consigue al menos 3 de cada power-up especial.",
    category: "collection",
    rarity: "epic",
    points: 75,
    icon: "blossom",
    condition: () =>
      playerStats.xiaosCollected >= 3 &&
      playerStats.arleesCollected >= 3 &&
      playerStats.cynosCollected >= 3 &&
      playerStats.flinsCollected >= 3,
    unlocked: false,
  },
  {
    id: "medic",
    name: "Médica de flota",
    description: "Recolecta 25 kits de salud.",
    category: "collection",
    rarity: "common",
    points: 20,
    icon: "medkit",
    condition: () => playerStats.kitsCollected >= 25,
    unlocked: false,
  },
  {
    id: "first_points",
    name: "Primeros puntos",
    description: "Acumula 1.000 puntos en total.",
    category: "mastery",
    rarity: "common",
    points: 10,
    icon: "target",
    condition: () => playerStats.cumulativeScore >= 1000,
    unlocked: false,
  },
  {
    id: "point_collector",
    name: "Contadora de estrellas",
    description: "Acumula 5.000 puntos en total.",
    category: "mastery",
    rarity: "common",
    points: 20,
    icon: "coin",
    condition: () => playerStats.cumulativeScore >= 5000,
    unlocked: false,
  },
  {
    id: "high_scorer",
    name: "Puntuación alta",
    description: "Acumula 10.000 puntos en total.",
    category: "mastery",
    rarity: "rare",
    points: 40,
    icon: "chart",
    condition: () => playerStats.cumulativeScore >= 10000,
    unlocked: false,
  },
  {
    id: "score_enthusiast",
    name: "Sed de marcas",
    description: "Acumula 25.000 puntos en total.",
    category: "mastery",
    rarity: "rare",
    points: 60,
    icon: "spark",
    condition: () => playerStats.cumulativeScore >= 25000,
    unlocked: false,
  },
  {
    id: "score_master",
    name: "Maestra del marcador",
    description: "Acumula 50.000 puntos en total.",
    category: "mastery",
    rarity: "epic",
    points: 100,
    icon: "trophy",
    condition: () => playerStats.cumulativeScore >= 50000,
    unlocked: false,
  },
  {
    id: "score_legend",
    name: "Leyenda del marcador",
    description: "Acumula 100.000 puntos en total.",
    category: "mastery",
    rarity: "legendary",
    points: 200,
    icon: "star",
    condition: () => playerStats.cumulativeScore >= 100000,
    unlocked: false,
  },
  {
    id: "score_god",
    name: "Soberana del marcador",
    description: "Acumula 500.000 puntos en total.",
    category: "mastery",
    rarity: "mythic",
    points: 500,
    icon: "spark",
    condition: () => playerStats.cumulativeScore >= 500000,
    unlocked: false,
  },
  {
    id: "score_transcendent",
    name: "Trascendencia",
    description: "Acumula 1.000.000 puntos en total.",
    category: "mastery",
    rarity: "mythic",
    points: 1000,
    icon: "galaxy",
    condition: () => playerStats.cumulativeScore >= 1000000,
    unlocked: false,
  },
  {
    id: "veteran",
    name: "Veterana",
    description: "Juega 50 partidas.",
    category: "mastery",
    rarity: "rare",
    points: 30,
    icon: "medal",
    condition: () => playerStats.gamesPlayed >= 50,
    unlocked: false,
  },
  {
    id: "dedicated_player",
    name: "Piloto dedicado",
    description: "Juega 100 partidas.",
    category: "mastery",
    rarity: "epic",
    points: 60,
    icon: "medal",
    condition: () => playerStats.gamesPlayed >= 100,
    unlocked: false,
  },
  {
    id: "ifa_victim",
    name: "Eco de Ifa",
    description: "Sufre el efecto de ralentización de Ifa.",
    category: "secret",
    rarity: "rare",
    points: 25,
    icon: "crystal",
    condition: () => playerStats.enemyTypesKilled.ifa >= 1,
    unlocked: false,
  },
  {
    id: "xiao_weapon_hunter",
    name: "Cazadora de armas Xiao",
    description: "Destruye 5 enemigos tipo Xiao Weapon.",
    category: "secret",
    rarity: "epic",
    points: 50,
    icon: "sword",
    condition: () => playerStats.enemyTypesKilled.xiao_weapon >= 5,
    unlocked: false,
  },
  {
    id: "familiar_tamer",
    name: "Domadora de ecos",
    description: "Disuelve 20 familiares rosa.",
    category: "combat",
    rarity: "common",
    points: 20,
    icon: "spark",
    condition: () => playerStats.enemyTypesKilled.familiar >= 20,
    unlocked: false,
  },
  {
    id: "witch_hunter",
    name: "Cazadora de brujitas",
    description: "Derriba 3 brujitas menores.",
    category: "combat",
    rarity: "rare",
    points: 35,
    icon: "skull",
    condition: () => playerStats.enemyTypesKilled.witch >= 3,
    unlocked: false,
  },
  {
    id: "sniper_break",
    name: "Rompefrancotiradoras",
    description: "Elimina 5 francotiradoras del laberinto.",
    category: "combat",
    rarity: "rare",
    points: 30,
    icon: "target",
    condition: () => playerStats.enemyTypesKilled.sniper >= 5,
    unlocked: false,
  },
  {
    id: "mini_hunter",
    name: "Cazadora de umbrales",
    description: "Derrota 3 mini-jefes en total.",
    category: "combat",
    rarity: "rare",
    points: 40,
    icon: "skull",
    condition: () => (playerStats.miniBossesKilled || 0) >= 3,
    unlocked: false,
  },
  {
    id: "phantom_bane",
    name: "Exorcista",
    description: "Elimina 5 fantasmas del laberinto.",
    category: "combat",
    rarity: "rare",
    points: 30,
    icon: "skull",
    condition: () => (playerStats.enemyTypesKilled.phantom || 0) >= 5,
    unlocked: false,
  },
  {
    id: "hex_breaker",
    name: "Rompehexágonos",
    description: "Destruye 3 torretas hex.",
    category: "combat",
    rarity: "epic",
    points: 45,
    icon: "gem",
    condition: () => (playerStats.enemyTypesKilled.hex || 0) >= 3,
    unlocked: false,
  },
  {
    id: "walpurgia_fall",
    name: "Fin del carnaval",
    description: "Derrota al jefe del nivel 20.",
    category: "mastery",
    rarity: "epic",
    points: 80,
    icon: "crown",
    condition: () => playerStats.bossesKilled >= 2 || playerStats.maxLevel >= 21,
    unlocked: false,
  },
  {
    id: "moai_friend",
    name: "Confidente del Moai",
    description: "Consulta al Moai 10 veces.",
    category: "secret",
    rarity: "common",
    points: 15,
    icon: "moai",
    condition: () => SafeStore.num("moaiClicks", 0, 0, 1e9) >= 10,
    unlocked: false,
  },
  {
    id: "achievement_hunter",
    name: "Archivera de hazañas",
    description: "Abre el panel de logros por primera vez.",
    category: "secret",
    rarity: "common",
    points: 5,
    icon: "trophy",
    condition: () =>
      SafeStore.num("achievementsOpened", 0, 0, 1e9) >= 1,
    unlocked: false,
  },
  {
    id: "completionist",
    name: "Casi completa",
    description: "Desbloquea el 80% de todos los logros.",
    category: "secret",
    rarity: "mythic",
    points: 500,
    icon: "check",
    condition: () => {
      const unlockedCount = achievements.filter((a) => a.unlocked).length;
      const totalCount = achievements.length;
      return unlockedCount / totalCount >= 0.8;
    },
    unlocked: false,
  },
  {
    id: "legend",
    name: "Leyenda viviente",
    description: "Desbloquea todos los logros.",
    category: "secret",
    rarity: "mythic",
    points: 1000,
    icon: "star",
    condition: () => {
      const unlockedCount = achievements.filter(
        (a) => a.id !== "legend" && a.unlocked
      ).length;
      const totalCount = achievements.length - 1;
      return unlockedCount === totalCount;
    },
    unlocked: false,
  },
];

// Cargar estadísticas y logros desde localStorage
function loadPlayerStats() {
  const savedStats = SafeStore.getObject("playerStats");
  for (const k in savedStats) {
    if (k in playerStats && typeof savedStats[k] === typeof playerStats[k]) playerStats[k] = savedStats[k];
  }

  const saved = SafeStore.getArray("achievements", (a) => a && typeof a.id === "string");
  if (saved.length) {
    achievements.forEach((achievement) => {
      const savedAchievement = saved.find((a) => a.id === achievement.id);
      if (savedAchievement) {
        achievement.unlocked = savedAchievement.unlocked;
      }
    });
  }
}

// Guardar estadísticas y logros
function savePlayerStats() {
  localStorage.setItem("playerStats", JSON.stringify(playerStats));
  localStorage.setItem(
    "achievements",
    JSON.stringify(
      achievements.map((a) => ({ id: a.id, unlocked: a.unlocked }))
    )
  );
}

// Verificar logros
function checkAchievements() {
  achievements.forEach((achievement) => {
    if (!achievement.unlocked && achievement.condition()) {
      unlockAchievement(achievement);
    }
  });
}

// Desbloquear logro
function unlockAchievement(achievement) {
  achievement.unlocked = true;
  showAchievementNotification(achievement);
  savePlayerStats();
  updateAchievementStats();
}

// Mostrar notificación de logro
function isMobileDevice() {
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}

function showAchievementNotification(achievement) {
  if (!gameRunning) return; // no mostrar avisos en la carga ni en el menú
  if (window.showMiniToast) { showMiniToast(`logro: ${achievement.name}  +${achievement.points}`, 2400); try { SFX.play("achievement", 0.4); } catch (e) {} return; }
  const notification = document.getElementById("achievementNotification");
  const nameEl = document.getElementById("notificationName");
  const descEl = document.getElementById("notificationDescription");
  const pointsEl = document.getElementById("notificationPoints");

  nameEl.textContent = achievement.name;
  descEl.textContent = achievement.description;
  pointsEl.textContent = `+${achievement.points} puntos`;

  const notifIcon = notification.querySelector(".notification-icon");
  if (notifIcon && typeof swIcon === "function") {
    notifIcon.innerHTML = swIcon(achievement.icon || "trophy", "sw-icon-lg");
  }

  // Añadir clase específica para móviles
  if (isMobileDevice()) {
    notification.classList.add("mobile-notification");
  } else {
    notification.classList.remove("mobile-notification");
  }

  if (typeof UIAnime !== "undefined") {
    UIAnime.notifyAchievement(notification);
  } else {
    notification.classList.add("show");
  }

  // Reproducir sonido de logro (si existe) - volumen más bajo en móviles
  try {
    const achievementSound = SFX.audio("achievement");
    achievementSound.volume = isMobileDevice() ? 0.3 : 0.5;
    achievementSound.play().catch(() => {}); // Ignorar errores de audio
  } catch (e) {}

  // Tiempo de display más corto en móviles para ser menos intrusivo
  const displayTime = isMobileDevice() ? 3000 : 5000;
  setTimeout(() => {
    if (typeof UIAnime !== "undefined") {
      UIAnime.hideAchievement(notification);
    } else {
      notification.classList.remove("show");
    }
    setTimeout(() => {
      notification.classList.remove("mobile-notification");
    }, 300); // Limpiar clase después de la animación
  }, displayTime);
}

// Inicializar sistema de logros
function initAchievementSystem() {
  loadPlayerStats();

  const achievementsBtn = document.getElementById("achievementsButton");
  const achievementsModal = document.getElementById("achievementsModal");
  const achievementsClose = document.querySelector(".achievements-close");

  // Abrir modal de logros
  achievementsBtn.addEventListener("click", () => {
    if (isMobileDevice()) {
      achievementsModal.classList.add("mobile-modal");
    } else {
      achievementsModal.classList.remove("mobile-modal");
    }

    if (typeof UIAnime !== "undefined") {
      UIAnime.openModal(achievementsModal);
    } else {
      achievementsModal.style.display = "block";
    }

    renderAchievements();
    updateAchievementStats();
    if (typeof UIAnime !== "undefined") {
      setTimeout(() => UIAnime.staggerList(".achievement-item"), 40);
    }

    // Logro secreto por abrir el panel
    let achievementsOpened = SafeStore.num("achievementsOpened", 0, 0, 1e9);
    achievementsOpened++;
    localStorage.setItem("achievementsOpened", achievementsOpened.toString());
    checkAchievements();
  });

  // Cerrar modal
  achievementsClose.addEventListener("click", () => {
    if (typeof UIAnime !== "undefined") {
      UIAnime.closeModal(achievementsModal);
    } else {
      achievementsModal.style.display = "none";
      achievementsModal.classList.remove("mobile-modal");
    }
  });

  // Cerrar con clic fuera del modal
  window.addEventListener("click", (e) => {
    if (e.target === achievementsModal) {
      if (typeof UIAnime !== "undefined") {
        UIAnime.closeModal(achievementsModal);
      } else {
        achievementsModal.style.display = "none";
        achievementsModal.classList.remove("mobile-modal");
      }
    }
  });

  // Tabs de categorías
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderAchievements(btn.dataset.category);
    });
  });

  // Tracking de clics en Moai para logro secreto
  const moaiBtn = document.getElementById("moaiButton");
  moaiBtn.addEventListener("click", () => {
    let moaiClicks = SafeStore.num("moaiClicks", 0, 0, 1e9);
    moaiClicks++;
    localStorage.setItem("moaiClicks", moaiClicks.toString());
    checkAchievements();
  });
}

// Renderizar logros
function renderAchievements(category = "all") {
  const achievementsList = document.getElementById("achievementsList");
  achievementsList.innerHTML = "";

  const filteredAchievements =
    category === "all"
      ? achievements
      : achievements.filter((a) => a.category === category);

  filteredAchievements.forEach((achievement) => {
    const achievementEl = document.createElement("div");
    achievementEl.className = `achievement-item ${
      achievement.unlocked ? "unlocked" : "locked"
    }`;

    const progress = getAchievementProgress(achievement);

    const iconHtml =
      typeof swIcon === "function"
        ? swIcon(achievement.icon, "sw-icon-lg")
        : "";
    achievementEl.innerHTML = `
            <div class="achievement-icon">${iconHtml}</div>
            <div class="achievement-details">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-progress">${progress}</div>
            </div>
            <div class="achievement-points">+${achievement.points}</div>
            <div class="achievement-rarity rarity-${achievement.rarity}">${achievement.rarity}</div>
        `;

    achievementsList.appendChild(achievementEl);
  });
}

// Obtener progreso del logro
function getAchievementProgress(achievement) {
  if (achievement.unlocked) return "Desbloqueado";

  // Progreso específico para cada logro
  switch (achievement.id) {
    case "first_blood":
      return `${Math.min(playerStats.totalKills, 1)}/1 enemigos`;
    case "newbie_killer":
      return `${Math.min(playerStats.totalKills, 5)}/5 enemigos`;
    case "trigger_happy":
      return `${Math.min(playerStats.totalShots, 25)}/25 disparos`;
    case "marksman":
      return `${Math.min(playerStats.totalShots, 100)}/100 disparos`;
    case "slayer":
      return `${Math.min(playerStats.totalKills, 50)}/50 enemigos`;
    case "genocide":
      return `${Math.min(playerStats.totalKills, 500)}/500 enemigos`;
    case "killing_spree":
      return `${Math.min(playerStats.maxConsecutiveKills, 10)}/10 consecutivos`;
    case "unstoppable":
      return `${Math.min(playerStats.maxConsecutiveKills, 25)}/25 consecutivos`;
    case "boss_slayer":
      return `${Math.min(playerStats.bossesKilled, 1)}/1 boss`;
    case "boss_destroyer":
      return `${Math.min(playerStats.bossesKilled, 5)}/5 bosses`;
    case "meteor_master":
      return `${Math.min(playerStats.meteorsDestroyed, 20)}/20 meteoritos`;
    case "survivor":
      return `${Math.floor(
        Math.min(playerStats.totalGameTime, 300000) / 60000
      )}/5 minutos`;
    case "level_master":
      return `${Math.min(playerStats.maxLevel, 20)}/20 nivel`;
    case "level_god":
      return `${Math.min(playerStats.maxLevel, 50)}/50 nivel`;
    case "heart_collector":
      return `${Math.min(playerStats.maxHearts, 6)}/6 gemas`;
    case "powerup_addict":
      return `${Math.min(playerStats.powerUpsCollected, 50)}/50 power-ups`;
    case "first_points":
      return `${Math.min(
        playerStats.cumulativeScore,
        1000
      ).toLocaleString()}/1,000 puntos`;
    case "point_collector":
      return `${Math.min(
        playerStats.cumulativeScore,
        5000
      ).toLocaleString()}/5,000 puntos`;
    case "high_scorer":
      return `${Math.min(
        playerStats.cumulativeScore,
        10000
      ).toLocaleString()}/10,000 puntos`;
    case "score_enthusiast":
      return `${Math.min(
        playerStats.cumulativeScore,
        25000
      ).toLocaleString()}/25,000 puntos`;
    case "score_master":
      return `${Math.min(
        playerStats.cumulativeScore,
        50000
      ).toLocaleString()}/50,000 puntos`;
    case "score_legend":
      return `${Math.min(
        playerStats.cumulativeScore,
        100000
      ).toLocaleString()}/100,000 puntos`;
    case "score_god":
      return `${Math.min(
        playerStats.cumulativeScore,
        500000
      ).toLocaleString()}/500,000 puntos`;
    case "score_transcendent":
      return `${Math.min(
        playerStats.cumulativeScore,
        1000000
      ).toLocaleString()}/1,000,000 puntos`;
    case "veteran":
      return `${Math.min(playerStats.gamesPlayed, 50)}/50 partidas`;
    case "dedicated_player":
      return `${Math.min(playerStats.gamesPlayed, 100)}/100 partidas`;
    case "moai_friend":
      return `${Math.min(
        SafeStore.num("moaiClicks", 0, 0, 1e9),
        10
      )}/10 clics`;
    default:
      return "En progreso...";
  }
}

// Actualizar estadísticas de logros
function updateAchievementStats() {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

  document.getElementById(
    "totalAchievements"
  ).textContent = `${unlockedCount}/${totalCount}`;
  document.getElementById("achievementPoints").textContent = totalPoints;
  document.getElementById(
    "completionPercent"
  ).textContent = `${completionPercent}%`;
}

// Funciones para actualizar estadísticas durante el juego
function updateStatsOnKill(enemyType) {
  playerStats.totalKills++;
  playerStats.consecutiveKills++;
  playerStats.maxConsecutiveKills = Math.max(
    playerStats.maxConsecutiveKills,
    playerStats.consecutiveKills
  );

  if (playerStats.enemyTypesKilled[enemyType] !== undefined) {
    playerStats.enemyTypesKilled[enemyType]++;
  }

  savePlayerStats();
  checkAchievements();
}

function updateStatsOnShoot() {
  playerStats.totalShots++;
  checkAchievements();
}

function updateStatsOnScore(points) {
  // Actualizar puntuación acumulativa en tiempo real
  playerStats.cumulativeScore += points;
  checkAchievements();
}

function updateStatsOnDamage() {
  playerStats.totalDamageReceived++;
  playerStats.consecutiveKills = 0; // Reset consecutive kills
  playerStats.timeWithoutDamage = 0; // Reset time without damage
  checkAchievements();
}

function updateStatsOnBossKill() {
  playerStats.bossesKilled++;
  savePlayerStats();
  checkAchievements();
}

function updateStatsOnPowerUpCollected(type) {
  playerStats.powerUpsCollected++;

  switch (type) {
    case "xiao":
      playerStats.xiaosCollected++;
      break;
    case "arlee":
      playerStats.arleesCollected++;
      break;
    case "cyno":
      playerStats.cynosCollected++;
      break;
    case "kit":
      playerStats.kitsCollected++;
      break;
    case "flins":
      playerStats.flinsCollected++;
      break;
    case "rerir":
      playerStats.rerirsCollected = (playerStats.rerirsCollected || 0) + 1;
      break;
  }

  savePlayerStats();
  checkAchievements();
}

function updateStatsOnGameStart() {
  playerStats.gamesPlayed++;
  playerStats.sessionStartTime = Date.now();
  savePlayerStats();
  checkAchievements();
}

function updateStatsOnGameEnd() {
  if (playerStats.sessionStartTime > 0) {
    const sessionTime = Date.now() - playerStats.sessionStartTime;
    playerStats.totalGameTime += sessionTime;
    playerStats.sessionStartTime = 0;
  }

  // Actualizar puntuación máxima por partida
  playerStats.totalScore = Math.max(playerStats.totalScore, score);

  // Añadir puntuación actual a la puntuación acumulativa
  playerStats.cumulativeScore += score;

  playerStats.maxLevel = Math.max(playerStats.maxLevel, level);
  playerStats.maxHearts = Math.max(playerStats.maxHearts, player.hearts);

  savePlayerStats();
  checkAchievements();
}

// Inicializar el sistema cuando se carga la página
