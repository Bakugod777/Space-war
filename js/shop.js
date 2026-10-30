/**
 * Space War — tienda, poemas/avatares y títulos de jugador.
 */
// =================== SISTEMA DE TIENDA ÉPICA ===================

// Catálogo de items de la tienda
const shopItems = [
  {
    id: "poem_stars",
    name: "Poema: Entre las estrellas",
    description: "Un poema íntimo sobre viajes, distancia y esperanza.",
    category: "poems",
    cost: 50,
    rarity: "common",
    icon: "scroll",
    content: `Canje desbloqueado: Entre las estrellas

Toma una captura de esta ventana y envíasela a Manuel (Administrador Estelar).

A cambio recibirás un poema escrito para ti.
Guarda esta prueba: es tu llave de canje.`,
    purchased: false,
  },
  {
    id: "poem_warrior",
    name: "Poema: Guerrero del cosmos",
    description: "Versos sobre coraje, batalla y sostenerse en pie.",
    category: "poems",
    cost: 75,
    rarity: "rare",
    icon: "sword",
    content: `Canje desbloqueado: Guerrero del cosmos

Captura esta pantalla y envíasela a Manuel.

Recibirás un poema épico personalizado.
Esta ventana es tu comprobante de desbloqueo.`,
    purchased: false,
  },
  {
    id: "poem_love",
    name: "Poema: Amor cósmico",
    description: "Palabras profundas sobre querer a través de cualquier distancia.",
    category: "poems",
    cost: 100,
    rarity: "epic",
    icon: "heart",
    content: `Canje desbloqueado: Amor cósmico

Captura esta ventana y compártela con Manuel.

Este poema es el más íntimo de la colección.
Preséntalo para recibir tu pieza escrita a mano del corazón.`,
    purchased: false,
  },
  {
    id: "secret_dev",
    name: "Secreto: Nota del creador",
    description: "Un mensaje directo de quien construyó este universo.",
    category: "secrets",
    cost: 150,
    rarity: "epic",
    icon: "crystal",
    content: `Hola. Soy Manuel, quien armó Space War.

Hice este juego con cariño, pensando en alguien concreto: tú.
Cada efecto, cada detalle y cada línea buscan dejarte un respiro y una sonrisa.

Quiero que sepas que eres valiosa, fuerte y luminosa.
Los días difíciles pasan; tu luz no.

Gracias por jugar esta pequeña creación.
Con cariño,
Manuel`,
    purchased: false,
  },
  {
    id: "secret_easteregg",
    name: "Secreto: Archivo oculto",
    description: "Pistas internas del juego y de sus rincones secretos.",
    category: "secrets",
    cost: 200,
    rarity: "legendary",
    icon: "egg",
    content: `Archivo oculto de Space War

1. Disparar exactamente 777 veces en una partida puede revelar un mensaje especial.
2. Los power-ups especiales (Xiao, Arlee, Cyno, Flins) están pensados como guiños personales.
3. El Moai también lleva la cuenta de tus visitas para un logro secreto.
4. Hay ${achievements.length} logros en total; algunos exigen paciencia real.
5. Si estás leyendo esto, ya desbloqueaste uno de los canjes más raros.`,
    purchased: false,
  },
  {
    id: "secret_truth",
    name: "Secreto: Verdad universal",
    description: "Una reflexión serena sobre existir frente al cosmos.",
    category: "secrets",
    cost: 500,
    rarity: "mythic",
    icon: "galaxy",
    content: `La verdad universal

No importa cuán pequeños parezcamos frente al cosmos, ni cuántos días nublados intenten apagar la fe.
No importa cuántas veces caigamos: incluso las estrellas titilan antes de volver a arder.

Eres una constelación irrepetible: átomos y sueños tejidos por miles de millones de años.
Polvo de estrellas que aprendió a sentir, amar e imaginar.

El universo conspiró —en el sentido más literal de la física— para que existieras aquí y ahora.
Cuando dudes, recuerda: dentro de ti late la misma energía que enciende soles y guía cometas.`,
    purchased: false,
  },
  {
    id: "avatar_novice",
    name: "Título: Explorador estelar",
    description: "Multiplicador x2 de puntos. Aura blanca suave.",
    category: "avatars",
    cost: 50,
    rarity: "common",
    icon: "star",
    content: "Título activo: Explorador estelar",
    bonus: { type: "points", multiplier: 2, effect: "white-aura" },
    purchased: false,
  },
  {
    id: "avatar_galaxy",
    name: "Título: Guardián galáctico",
    description: "Multiplicador x2 de puntos. Aura verde.",
    category: "avatars",
    cost: 100,
    rarity: "rare",
    icon: "galaxy",
    content: "Título activo: Guardián galáctico",
    bonus: { type: "points", multiplier: 2, effect: "green-aura" },
    purchased: false,
  },
  {
    id: "avatar_legend",
    name: "Título: Leyenda estelar",
    description: "Multiplicador x3 de puntos. Estelas doradas.",
    category: "avatars",
    cost: 250,
    rarity: "epic",
    icon: "crown",
    content: "Título activo: Leyenda estelar",
    bonus: { type: "points", multiplier: 3, effect: "golden-stars" },
    purchased: false,
  },
  {
    id: "avatar_cosmic",
    name: "Título: Emperador cósmico",
    description: "Multiplicador x3 de puntos. Aura multicolor.",
    category: "avatars",
    cost: 500,
    rarity: "legendary",
    icon: "spark",
    content: "Título activo: Emperador cósmico",
    bonus: { type: "points", multiplier: 3, effect: "rainbow-aura" },
    purchased: false,
  },
  {
    id: "avatar_supreme",
    name: "Título: Supremo del cosmos",
    description: "Multiplicador x4 de puntos. Aura suprema.",
    category: "avatars",
    cost: 1000,
    rarity: "mythic",
    icon: "gem",
    content: "Título activo: Supremo del cosmos",
    bonus: { type: "points", multiplier: 4, effect: "supreme-aura" },
    purchased: false,
  },
  {
    id: "quote_motivation",
    name: "Frase: Coraje diario",
    description: "Una frase clara para sostenerte cuando el día pesa.",
    category: "quotes",
    cost: 50,
    rarity: "common",
    icon: "quote",
    content: `"El éxito no es el final, el fracaso no es fatal: es el coraje de continuar lo que cuenta." — Winston Churchill

Cada día es otra oportunidad de volver a intentarlo.
No mides tu valor por una caída, sino por la decisión de seguir.`,
    purchased: false,
  },
  {
    id: "quote_dreams",
    name: "Frase: Apunta alto",
    description: "Palabras para no achicar tus sueños.",
    category: "quotes",
    cost: 75,
    rarity: "rare",
    icon: "star",
    content: `"Apunta a la luna. Aunque falles, aterrizarás entre las estrellas." — Norman Vincent Peale

Tus sueños no son excesivos.
El universo es amplio; tus posibilidades también.
No entregues tu horizonte solo porque alguien no puede verlo.`,
    purchased: false,
  },
  {
    id: "fact_space",
    name: "Curiosidad: Datos del espacio",
    description: "Cinco hechos del cosmos para maravillarte un momento.",
    category: "facts",
    cost: 100,
    rarity: "rare",
    icon: "rocket",
    content: `Datos del espacio

1. Un día en Venus dura más que un año en Venus.
2. Hay más estrellas en el universo observable que granos de arena en todas las playas de la Tierra.
3. A la velocidad de la luz tardarías unos 100.000 años en cruzar la Vía Láctea.
4. En el vacío, metales limpios pueden soldarse en frío (cold welding).
5. Los átomos de tu cuerpo se forjaron en estrellas antiguas: eres, literalmente, polvo estelar.`,
    purchased: false,
  },
  {
    id: "message_special",
    name: "Mensaje: Para ti",
    description: "Una carta personal, directa y sin adornos vacíos.",
    category: "messages",
    cost: 300,
    rarity: "legendary",
    icon: "letter",
    content: `Para ti, que estás leyendo esto

Eres una presencia irrepetible.
Existir ya es improbable y, aun así, aquí estás: respirando, sintiendo, dejando huella.

Cada amanecer es permiso para reconstruirte y recordar la luz que cargas.
No dejes que las sombras ajenas te convenzan de apagarla.

Eres más fuerte de lo que imaginas, más valiosa de lo que crees y más querida de lo que sospechas.
Sigue. Brilla aunque no todos entiendan tu resplandor.
Tu luz importa.`,
    purchased: false,
  },
];

// Cargar items comprados
function loadPurchasedItems() {
  const purchases = SafeStore.getArray("shopPurchases", (x) => typeof x === "string");
  if (purchases.length) {
    shopItems.forEach((item) => {
      if (purchases.includes(item.id)) {
        item.purchased = true;
      }
    });
  }
}

// Guardar compra
function savePurchase(itemId) {
  const purchases = SafeStore.getArray("shopPurchases", (x) => typeof x === "string");
  if (!purchases.includes(itemId)) {
    purchases.push(itemId);
    localStorage.setItem("shopPurchases", JSON.stringify(purchases));
  }
}

// Obtener puntos totales de logros
function getTotalAchievementPoints() {
  return achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);
}

// Obtener puntos gastados
function getSpentPoints() {
  return shopItems
    .filter((item) => item.purchased)
    .reduce((sum, item) => sum + item.cost, 0);
}

// Obtener puntos disponibles
function getAvailablePoints() {
  return getTotalAchievementPoints() - getSpentPoints();
}

// Inicializar sistema de tienda
function initShopSystem() {
  loadPurchasedItems();

  const shopBtn = document.getElementById("shopButton");
  const shopModal = document.getElementById("shopModal");
  const shopClose = document.querySelector(".shop-close");

  // Abrir modal de tienda
  shopBtn.addEventListener("click", () => {
    if (isMobileDevice()) {
      shopModal.classList.add("mobile-modal");
    } else {
      shopModal.classList.remove("mobile-modal");
    }

    if (typeof UIAnime !== "undefined") {
      UIAnime.openModal(shopModal);
    } else {
      shopModal.style.display = "flex";
    }

    renderShopItems();
    updateShopStats();
    if (typeof UIAnime !== "undefined") {
      setTimeout(() => UIAnime.staggerList(".shop-item"), 40);
    }
  });

  // Cerrar modal
  shopClose.addEventListener("click", () => {
    if (typeof UIAnime !== "undefined") {
      UIAnime.closeModal(shopModal);
    } else {
      shopModal.style.display = "none";
      shopModal.classList.remove("mobile-modal");
    }
  });

  // Cerrar con clic fuera del modal
  window.addEventListener("click", (e) => {
    if (e.target === shopModal) {
      if (typeof UIAnime !== "undefined") {
        UIAnime.closeModal(shopModal);
      } else {
        shopModal.style.display = "none";
        shopModal.classList.remove("mobile-modal");
      }
    }
  });

  // Tabs de categorías de tienda
  const shopTabBtns = document.querySelectorAll(".shop-tab-btn");
  shopTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      shopTabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderShopItems(btn.dataset.category);
    });
  });
}

// Renderizar items de la tienda
function renderShopItems(category = "all") {
  const shopList = document.getElementById("shopItemsList");
  shopList.innerHTML = "";

  const filteredItems =
    category === "all"
      ? shopItems
      : shopItems.filter((item) => item.category === category);

  filteredItems.forEach((item) => {
    const itemEl = document.createElement("div");
    itemEl.className = `shop-item ${item.purchased ? "purchased" : ""}`;

    const canAfford = getAvailablePoints() >= item.cost;
    const buttonText = item.purchased
      ? "Canjeado"
      : `Canjear (${item.cost} pts)`;
    const buttonDisabled = item.purchased || !canAfford ? "disabled" : "";

    itemEl.innerHTML = `
            <div class="shop-item-icon">${typeof swIcon === "function" ? swIcon(item.icon, "sw-icon-lg") : ""}</div>
            <div class="shop-item-details">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-description">${item.description}</div>
                <div class="shop-item-rarity rarity-${item.rarity}">${item.rarity}</div>
            </div>
            <div class="shop-item-actions">
                <div class="shop-item-cost">${item.cost} pts</div>
                <button class="shop-buy-btn" ${buttonDisabled} onclick="purchaseItem('${item.id}')">
                    ${buttonText}
                </button>
            </div>
        `;

    // Agregar evento de clic para ver contenido si ya está comprado
    if (item.purchased) {
      itemEl.style.cursor = "pointer";
      itemEl.addEventListener("click", () => showItemContent(item));
    }

    shopList.appendChild(itemEl);
  });
}

/**
 * Confirmación temática (sustituye window.confirm del navegador).
 * opts: { title, message, confirmLabel, cancelLabel, tone, icon }
 */
function showConfirm(opts) {
  const o = opts || {};
  const el = document.getElementById("customAlert");
  if (!el) {
    return Promise.resolve(
      window.confirm(String(o.message || "").replace(/<[^>]+>/g, ""))
    );
  }
  const titleEl = document.getElementById("alertTitle");
  const msgEl = document.getElementById("alertMessage");
  const iconEl = document.getElementById("alertIcon");
  const okBtn = document.getElementById("confirmAlert");
  const cancelBtn = document.getElementById("cancelAlert");
  const tone = o.tone || "shop";

  if (titleEl) titleEl.textContent = o.title || "Confirmar";
  if (msgEl) msgEl.innerHTML = o.message || "";
  if (okBtn) okBtn.textContent = o.confirmLabel || "Aceptar";
  if (cancelBtn) cancelBtn.textContent = o.cancelLabel || "Cancelar";
  if (iconEl) {
    const name = o.icon || (tone === "shop" ? "cart" : "warning");
    iconEl.setAttribute("data-sw", name);
    if (typeof swIcon === "function") iconEl.innerHTML = swIcon(name, "sw-icon-lg");
  }

  el.classList.remove("tone-shop", "tone-warn", "tone-info");
  el.classList.add("tone-" + tone);
  el.hidden = false;
  el.classList.add("show");
  el.style.display = "flex";

  return new Promise((resolve) => {
    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      el.classList.remove("show");
      el.hidden = true;
      el.style.display = "none";
      document.removeEventListener("keydown", onKey);
      okBtn && okBtn.removeEventListener("click", onOk);
      cancelBtn && cancelBtn.removeEventListener("click", onCancel);
      el.removeEventListener("click", onBackdrop);
      resolve(val);
    };
    const onOk = () => finish(true);
    const onCancel = () => finish(false);
    const onBackdrop = (e) => { if (e.target === el) finish(false); };
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); finish(false); }
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
    };
    okBtn && okBtn.addEventListener("click", onOk);
    cancelBtn && cancelBtn.addEventListener("click", onCancel);
    el.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onKey);
    setTimeout(() => { if (okBtn) okBtn.focus(); }, 40);
  });
}
window.showConfirm = showConfirm;

// Comprar item
async function purchaseItem(itemId) {
  const item = shopItems.find((i) => i.id === itemId);
  if (!item || item.purchased) return;

  const availablePoints = getAvailablePoints();
  if (availablePoints < item.cost) {
    showNotification("No tienes suficientes puntos de logros", "error");
    return;
  }

  const ok = await showConfirm({
    title: "Canjear en la tienda",
    message:
      `¿Deseas canjear <strong>«${item.name}»</strong> por ` +
      `<span class="alert-cost">${item.cost} puntos</span>?`,
    confirmLabel: "Canjear",
    cancelLabel: "Cancelar",
    tone: "shop",
    icon: item.icon || "cart",
  });
  if (!ok) return;

  item.purchased = true;
  savePurchase(item.id);

  // ANIMACIÓN ÉPICA DE COMPRA
  createEpicPurchaseAnimation(item);

  // Mostrar contenido después de la animación
  setTimeout(() => {
    showItemContent(item);
  }, 2000);

  renderShopItems();
  updateShopStats();

  // Sonido de compra
  try {
    const purchaseSound = SFX.audio("achievement");
    purchaseSound.volume = 0.5;
    purchaseSound.play().catch(() => {});
  } catch (e) {}

  // Si es un avatar (título), actualizar el sistema de títulos
  if (item.category === "avatars") {
    updateAvailableTitles();
  }
}
window.purchaseItem = purchaseItem;

// Crear animación épica de compra
function createEpicPurchaseAnimation(item) {
  const container = document.getElementById("game-container");

  // Crear overlay de animación
  const animationOverlay = document.createElement("div");
  animationOverlay.className = "purchase-animation-overlay";
  const purchaseIcon =
    typeof swIcon === "function" ? swIcon(item.icon, "sw-icon-xl") : "";
  animationOverlay.innerHTML = `
        <div class="purchase-burst"></div>
        <div class="purchase-content">
            <div class="purchase-icon">${purchaseIcon}</div>
            <div class="purchase-name">${item.name}</div>
            <div class="purchase-category">${getCategoryIcon(
              item.category
            )} ${getCategoryName(item.category)}</div>
            <div class="purchase-success">Desbloqueado</div>
        </div>
    `;

  container.appendChild(animationOverlay);

  // Crear partículas explosivas
  for (let i = 0; i < 50; i++) {
    createPurchaseParticle(container, item.icon);
  }

  // Crear rayos de energía
  for (let i = 0; i < 8; i++) {
    createEnergyRay(container, i);
  }

  // Remover después de la animación
  setTimeout(() => {
    animationOverlay.remove();
  }, 2000);
}

// Crear partícula de compra
function createPurchaseParticle(container, icon) {
  const particle = document.createElement("div");
  particle.className = "purchase-particle";
  if (typeof swIcon === "function") {
    particle.innerHTML = swIcon(icon || "spark", "sw-icon-sm");
  } else {
    particle.textContent = "•";
  }

  const angle = Math.random() * Math.PI * 2;
  const distance = 200 + Math.random() * 300;
  const duration = 1 + Math.random() * 1;

  particle.style.setProperty("--angle", `${angle}rad`);
  particle.style.setProperty("--distance", `${distance}px`);
  particle.style.setProperty("--duration", `${duration}s`);

  container.appendChild(particle);

  setTimeout(() => particle.remove(), duration * 1000);
}

// Crear rayo de energía
function createEnergyRay(container, index) {
  const ray = document.createElement("div");
  ray.className = "purchase-energy-ray";
  ray.style.transform = `rotate(${index * 45}deg)`;

  container.appendChild(ray);

  setTimeout(() => ray.remove(), 1500);
}

// Icono SVG de categoría
function getCategoryIcon(category) {
  const icons = {
    poems: "scroll",
    secrets: "crystal",
    avatars: "mask",
    quotes: "quote",
    facts: "science",
    messages: "letter",
  };
  const key = icons[category] || "spark";
  return typeof swIcon === "function" ? swIcon(key, "sw-icon-inline") : "";
}

// Obtener nombre de categoría
function getCategoryName(category) {
  const names = {
    poems: "Poema",
    secrets: "Secreto",
    avatars: "Título",
    quotes: "Frase",
    facts: "Curiosidad",
    messages: "Mensaje",
  };
  return names[category] || "Ítem";
}

// Mostrar contenido del item
function showItemContent(item) {
  const contentModal = document.getElementById("itemContentModal");
  const contentTitle = document.getElementById("itemContentTitle");
  const contentText = document.getElementById("itemContentText");

  contentTitle.textContent = item.name;
  contentText.textContent = item.content;

  contentModal.style.display = "flex";

  // Cerrar modal de contenido
  const contentClose = document.querySelector(".item-content-close");
  contentClose.onclick = () => {
    contentModal.style.display = "none";
  };

  window.onclick = (e) => {
    if (e.target === contentModal) {
      contentModal.style.display = "none";
    }
  };
}

// Actualizar estadísticas de la tienda
function updateShopStats() {
  const totalPoints = getTotalAchievementPoints();
  const spentPoints = getSpentPoints();
  const availablePoints = getAvailablePoints();
  const purchasedCount = shopItems.filter((item) => item.purchased).length;
  const totalItems = shopItems.length;

  document.getElementById("totalShopPoints").textContent = totalPoints;
  document.getElementById("spentPoints").textContent = spentPoints;
  document.getElementById("availablePoints").textContent = availablePoints;
  document.getElementById(
    "purchasedItems"
  ).textContent = `${purchasedCount}/${totalItems}`;
}

// Mostrar notificación simple
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `simple-notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${type === "error" ? "#e74c3c" : "#2ecc71"};
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 1.2em;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// =================== SISTEMA DE TÍTULOS ===================

// Cargar título activo del jugador
function loadActiveTitle() {
  return localStorage.getItem("activePlayerTitle") || "";
}

// Guardar título activo
function saveActiveTitle(titleText) {
  localStorage.setItem("activePlayerTitle", titleText);
}

// Actualizar títulos disponibles
function updateAvailableTitles() {
  const avatarItems = shopItems.filter(
    (item) => item.category === "avatars" && item.purchased
  );

  if (avatarItems.length > 0) {
    // Crear selector de títulos si hay avatares comprados
    createTitleSelector();
  }
}

// Crear selector de títulos
function createTitleSelector() {
  // Verificar si ya existe el botón
  if (document.getElementById("titleSelectorButton")) return;

  const titleButton = document.createElement("button");
  titleButton.id = "titleSelectorButton";
  titleButton.className = "title-selector-btn";
  titleButton.title = "Seleccionar título";
  titleButton.setAttribute("aria-label", "Seleccionar título");
  titleButton.innerHTML =
    typeof swIcon === "function" ? swIcon("crown", "sw-icon-btn") : "T";

  titleButton.addEventListener("click", showTitleSelector);

  document.getElementById("game-container").appendChild(titleButton);
}

// Mostrar selector de títulos
function showTitleSelector() {
  const modal = document.createElement("div");
  modal.className = "title-selector-modal";
  const crown =
    typeof swIcon === "function" ? swIcon("crown", "sw-icon-inline") : "";
  modal.innerHTML = `
        <div class="title-selector-content">
            <span class="title-selector-close">&times;</span>
            <h2>${crown} Selecciona tu título</h2>
            <div class="title-selector-subtitle">Cada título otorga bonificaciones especiales</div>
            <div class="titles-grid" id="titlesGrid"></div>
            <button class="remove-title-btn" onclick="removeActiveTitle()">Quitar título</button>
        </div>
    `;

  document.body.appendChild(modal);

  // Llenar con títulos disponibles
  const titlesGrid = modal.querySelector("#titlesGrid");
  const avatarItems = shopItems.filter(
    (item) => item.category === "avatars" && item.purchased
  );
  const activeTitle = loadActiveTitle();

  avatarItems.forEach((item) => {
    const titleOption = document.createElement("div");
    titleOption.className = `title-option ${
      item.content === activeTitle ? "active" : ""
    }`;

    // Calcular bonificación para mostrar
    let bonusText = "";
    if (item.bonus && item.bonus.type === "points") {
      const bonusPercent = Math.round((item.bonus.multiplier - 1) * 100);
      bonusText = `<div class="title-bonus">+${bonusPercent}% Puntos</div>`;
    }

    // Mostrar efecto visual
    let effectText = "";
    if (item.bonus && item.bonus.effect) {
      const effectNames = {
        "green-aura": "Aura verde",
        "golden-stars": "Estelas doradas",
        "rainbow-aura": "Aura multicolor",
        "white-aura": "Aura blanca",
        "supreme-aura": "Aura suprema",
      };
      effectText = `<div class="title-effect">${
        effectNames[item.bonus.effect]
      }</div>`;
    }

    titleOption.innerHTML = `
            <div class="title-option-icon">${typeof swIcon === "function" ? swIcon(item.icon, "sw-icon-lg") : ""}</div>
            <div class="title-option-text">${item.content}</div>
            ${bonusText}
            ${effectText}
        `;

    titleOption.addEventListener("click", () => {
      selectTitle(item.content);
      modal.remove();
    });

    titlesGrid.appendChild(titleOption);
  });

  // Cerrar modal
  const closeBtn = modal.querySelector(".title-selector-close");
  closeBtn.addEventListener("click", () => modal.remove());

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Seleccionar título
function selectTitle(titleText) {
  saveActiveTitle(titleText);
  displayPlayerTitle();

  // Buscar el item para mostrar el bono
  const titleItem = shopItems.find(
    (item) => item.category === "avatars" && item.content === titleText
  );

  let message = "¡Título equipado!";
  if (titleItem && titleItem.bonus && titleItem.bonus.type === "points") {
    const bonusPercent = Math.round((titleItem.bonus.multiplier - 1) * 100);
    message = `¡Título equipado! Bonificación: +${bonusPercent}% puntos`;
  }

  showNotification(message, "success");
}

// Quitar título activo
function removeActiveTitle() {
  saveActiveTitle("");
  displayPlayerTitle();
  showNotification("Título removido", "info");
  document.querySelector(".title-selector-modal")?.remove();
}

// Mostrar título del jugador en pantalla
function displayPlayerTitle() {
  const titleDisplay = document.getElementById("playerTitleDisplay");
  const titleText = document.getElementById("playerTitle");
  const activeTitle = loadActiveTitle();

  if (activeTitle && activeTitle.trim()) {
    titleText.textContent = activeTitle;
    titleDisplay.style.display = "block";
  } else {
    titleDisplay.style.display = "none";
  }
}

// Aplicar efectos visuales según el título equipado
function applyTitleVisualEffects() {
  if (!gameRunning) return;

  const activeTitle = loadActiveTitle();
  if (!activeTitle) return;

  const titleItem = shopItems.find(
    (item) =>
      item.category === "avatars" &&
      item.content === activeTitle &&
      item.purchased
  );

  if (!titleItem || !titleItem.bonus) return;

  const effect = titleItem.bonus.effect;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;

  // Crear efectos con menor frecuencia para no sobrecargar
  if (Math.random() > 0.7) {
    switch (effect) {
      case "green-aura":
        createTitleParticle(centerX, centerY, "#4CAF50", "aura");
        break;
      case "golden-stars":
        createTitleParticle(centerX, centerY, "#FFD700", "star");
        break;
      case "rainbow-aura":
        const colors = [
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1",
          "#FFA07A",
          "#98D8C8",
          "#F7DC6F",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        createTitleParticle(centerX, centerY, randomColor, "rainbow");
        break;
      case "white-aura":
        createTitleParticle(centerX, centerY, "#FFFFFF", "white");
        break;
      case "supreme-aura":
        // Aura suprema con colores intensos y rotantes
        const supremeColors = ["#FF1493", "#FFD700", "#8A2BE2", "#00FFFF"];
        const supremeColor = supremeColors[Math.floor(Math.random() * supremeColors.length)];
        createTitleParticle(centerX, centerY, supremeColor, "supreme");
        break;
    }
  }
}

// Crear partícula de efecto de título
function createTitleParticle(x, y, color, type) {
  const particle = document.createElement("div");
  particle.className = `title-particle title-particle-${type}`;

  // Posición alrededor de la nave
  const angle = Math.random() * Math.PI * 2;
  const radius = 30 + Math.random() * 20;
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;

  particle.style.left = x + offsetX + "px";
  particle.style.top = y + offsetY + "px";
  particle.style.backgroundColor = color;
  particle.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;

  if (type === "star") {
    particle.style.backgroundColor = "transparent";
    particle.style.width = "0";
    particle.style.height = "0";
    particle.style.borderLeft = "6px solid transparent";
    particle.style.borderRight = "6px solid transparent";
    particle.style.borderBottom = `10px solid ${color}`;
    particle.style.boxShadow = `0 0 12px ${color}`;
  }

  document.getElementById("game-container").appendChild(particle);

  // Animación y remoción
  setTimeout(() => particle.remove(), 1500);
}

// Arranque: logros + tienda + títulos
document.addEventListener("DOMContentLoaded", () => {
  if (typeof initAchievementSystem === "function") initAchievementSystem();
  if (typeof initShopSystem === "function") initShopSystem();
  if (typeof updateAvailableTitles === "function") updateAvailableTitles();
  if (typeof displayPlayerTitle === "function") displayPlayerTitle();
});
