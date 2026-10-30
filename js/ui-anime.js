/**
 * Space War — Anime.js UI layer
 * Menú, modales, HUD y notificaciones. El combate canvas sigue en VFX/fx.js.
 */
(function (global) {
  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready() {
    return typeof anime !== "undefined" && !reduced;
  }

  function clearInline(el, props) {
    if (!el) return;
    props.forEach((p) => {
      el.style[p] = "";
    });
  }

  const UIAnime = {
    boot() {
      if (!ready()) {
        document.body.classList.add("anime-ready");
        return;
      }
      UIAnime.menuIntro();
      UIAnime.bindChromeButtons();
      UIAnime.bindFloatingChrome();
      document.body.classList.add("anime-ready");
    },

    menuIntro() {
      if (!ready()) return;
      const brand = document.querySelector(".menu-brand");
      const panel = document.querySelector(".menu-panel");
      const scores = document.getElementById("highScores");
      const titleParts = document.querySelectorAll(
        ".menu-title .title-space, .menu-title .title-war"
      );
      const menuBits = [brand, panel, scores].filter(Boolean);

      const ensureVisible = () => {
        menuBits.forEach((el) => {
          el.style.opacity = "1";
        });
        titleParts.forEach((el) => {
          el.style.opacity = "1";
        });
      };

      // Solo transform en el título (gradients + opacity se ven mal)
      anime({
        targets: titleParts,
        scale: [0.88, 1],
        translateY: [22, 0],
        delay: anime.stagger(100),
        duration: 780,
        easing: "easeOutExpo",
      });

      anime({
        targets: menuBits,
        translateY: [32, 0],
        delay: anime.stagger(80, { start: 80 }),
        duration: 720,
        easing: "easeOutExpo",
        complete: ensureVisible,
      });

      // Red de seguridad: nunca dejar el menú invisible
      setTimeout(ensureVisible, 900);

      const scoreItems = document.querySelectorAll("#scoresList li");
      if (scoreItems.length) {
        anime({
          targets: scoreItems,
          translateX: [-16, 0],
          delay: anime.stagger(60, { start: 360 }),
          duration: 480,
          easing: "easeOutCubic",
        });
      }

      if (brand) {
        anime({
          targets: brand,
          translateY: [0, -5],
          direction: "alternate",
          loop: true,
          easing: "easeInOutSine",
          duration: 2800,
          delay: 1000,
        });
      }
    },

    bindChromeButtons() {
      if (!ready()) return;
      const buttons = document.querySelectorAll(
        ".moai-btn, .achievements-btn, .shop-btn, .audio-btn, .start-btn"
      );
      buttons.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          anime.remove(btn);
          anime({
            targets: btn,
            scale: 1.08,
            duration: 220,
            easing: "easeOutBack",
          });
        });
        btn.addEventListener("mouseleave", () => {
          anime.remove(btn);
          anime({
            targets: btn,
            scale: 1,
            duration: 280,
            easing: "easeOutElastic(1, .6)",
          });
        });
        btn.addEventListener("mousedown", () => {
          anime({
            targets: btn,
            scale: 0.94,
            duration: 120,
            easing: "easeOutQuad",
          });
        });
        btn.addEventListener("mouseup", () => {
          anime({
            targets: btn,
            scale: 1.06,
            duration: 220,
            easing: "easeOutBack",
          });
        });
      });
    },

    bindFloatingChrome() {
      // CSS orbIdle already handles subtle motion — avoid competing transforms
      if (!ready()) return;
    },

    openModal(modal) {
      if (!modal) return;
      // flex: centra el panel en cualquier viewport / safe-area
      modal.style.display = "flex";
      modal.style.opacity = "0";

      const content =
        modal.querySelector(
          ".achievements-modal-content, .shop-modal-content, .moai-modal-content, .item-content-modal-content, .update-popup-content, .custom-alert-content, .title-selector-content"
        ) || modal.firstElementChild;

      if (!ready()) {
        modal.style.opacity = "1";
        return;
      }

      anime.remove([modal, content].filter(Boolean));
      anime({
        targets: modal,
        opacity: [0, 1],
        duration: 260,
        easing: "easeOutQuad",
      });
      if (content) {
        anime({
          targets: content,
          opacity: [0, 1],
          scale: [0.88, 1],
          translateY: [28, 0],
          duration: 520,
          easing: "easeOutExpo",
        });
      }
    },

    closeModal(modal, hideDisplay) {
      if (!modal) return;
      const finish = () => {
        modal.style.display = hideDisplay === false ? modal.style.display : "none";
        modal.classList.remove("mobile-modal");
        clearInline(modal, ["opacity"]);
        const content =
          modal.querySelector(
            ".achievements-modal-content, .shop-modal-content, .moai-modal-content, .item-content-modal-content, .update-popup-content, .custom-alert-content, .title-selector-content"
          ) || modal.firstElementChild;
        if (content) {
          clearInline(content, ["opacity", "transform"]);
        }
      };
      if (!ready()) {
        finish();
        return;
      }
      const content =
        modal.querySelector(
          ".achievements-modal-content, .shop-modal-content, .moai-modal-content, .item-content-modal-content, .update-popup-content, .custom-alert-content"
        ) || modal.firstElementChild;
      anime({
        targets: content || modal,
        opacity: 0,
        scale: 0.92,
        translateY: -12,
        duration: 240,
        easing: "easeInQuad",
        complete: finish,
      });
    },

    notifyAchievement(notification) {
      if (!notification) return;
      notification.classList.add("show");
      if (!ready()) return;
      anime.remove(notification);
      anime({
        targets: notification,
        translateX: [120, 0],
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 560,
        easing: "easeOutElastic(1, .7)",
      });
      const icon = notification.querySelector(".notification-icon");
      if (icon) {
        anime({
          targets: icon,
          rotate: ["-20deg", "12deg", "0deg"],
          scale: [0.6, 1.25, 1],
          duration: 700,
          easing: "easeOutExpo",
        });
      }
    },

    hideAchievement(notification) {
      if (!notification) return;
      if (!ready()) {
        notification.classList.remove("show");
        return;
      }
      anime({
        targets: notification,
        translateX: 120,
        opacity: 0,
        duration: 280,
        easing: "easeInQuad",
        complete() {
          notification.classList.remove("show");
          clearInline(notification, ["opacity", "transform"]);
        },
      });
    },

    startTransition(menu, canvas, done) {
      if (!ready()) {
        if (menu) menu.style.display = "none";
        if (canvas) canvas.style.display = "block";
        if (done) done();
        return;
      }
      const pieces = menu
        ? menu.querySelectorAll(".menu-brand, .menu-panel, #highScores")
        : [];
      anime({
        targets: pieces,
        opacity: 0,
        translateY: -30,
        scale: 0.96,
        delay: anime.stagger(60),
        duration: 360,
        easing: "easeInQuad",
        complete() {
          if (menu) menu.style.display = "none";
          if (canvas) {
            canvas.style.display = "block";
            anime({
              targets: canvas,
              opacity: [0, 1],
              duration: 420,
              easing: "easeOutQuad",
            });
          }
          UIAnime.hudIntro();
          if (done) done();
        },
      });
    },

    hudIntro() {
      if (!ready()) return;
      const isTouch = document.body.classList.contains("touch-ui");
      const hud = [
        "#scoreBoard",
        "#levelDisplay",
        "#heartsDisplay",
        isTouch ? "#shootCooldownBarMobile" : "#shootCooldownBar",
      ].filter((sel) => document.querySelector(sel));
      anime.set(hud, { opacity: 0, translateY: -14 });
      anime({
        targets: hud,
        opacity: 1,
        translateY: 0,
        delay: anime.stagger(80),
        duration: 480,
        easing: "easeOutExpo",
      });
      if (isTouch) {
        const clusters = document.querySelectorAll(
          "#touchControls .touch-cluster"
        );
        if (clusters.length) {
          anime.set(clusters, { opacity: 0, translateY: 28 });
          anime({
            targets: clusters,
            opacity: 1,
            translateY: 0,
            delay: anime.stagger(90, { start: 120 }),
            duration: 520,
            easing: "easeOutBack",
          });
        }
      }
    },

    scorePulse(el) {
      if (!ready() || !el) return;
      anime.remove(el);
      anime({
        targets: el,
        scale: [1, 1.35, 1],
        duration: 380,
        easing: "easeOutElastic(1, .6)",
      });
    },

    comboPop(el) {
      if (!ready() || !el) return;
      anime.remove(el);
      anime({
        targets: el,
        scale: [0.7, 1.12, 1],
        duration: 420,
        easing: "easeOutBack",
      });
    },

    gameOver(el) {
      if (!el) return;
      el.hidden = false;
      el.style.display = "flex";
      const card = el.querySelector(".go-card") || el;
      if (!ready()) {
        card.style.opacity = "1";
        return;
      }
      anime.remove(card);
      anime.remove(el);
      el.style.opacity = "1";
      anime({
        targets: card,
        opacity: [0, 1],
        translateY: [28, 0],
        scale: [0.92, 1],
        duration: 560,
        easing: "easeOutCubic",
      });
      const btn = el.querySelector("#restartBtn");
      if (btn) {
        anime({
          targets: btn,
          translateY: [16, 0],
          opacity: [0, 1],
          delay: 180,
          duration: 420,
          easing: "easeOutExpo",
        });
      }
    },

    killFeedItem(el) {
      if (!ready() || !el) return;
      anime({
        targets: el,
        translateX: [40, 0],
        opacity: [0, 1],
        duration: 360,
        easing: "easeOutCubic",
      });
    },

    staggerList(selector) {
      if (!ready()) return;
      const items = document.querySelectorAll(selector);
      if (!items.length) return;
      anime.set(items, { opacity: 0, translateY: 16 });
      anime({
        targets: items,
        opacity: 1,
        translateY: 0,
        delay: anime.stagger(45),
        duration: 420,
        easing: "easeOutCubic",
      });
    },
  };

  global.UIAnime = UIAnime;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => UIAnime.boot());
  } else {
    UIAnime.boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
