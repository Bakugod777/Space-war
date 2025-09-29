const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playerNameInput = document.getElementById("playerName");
const startGameBtn = document.getElementById("startGame");
const scoreDisplay = document.getElementById("score");
const menu = document.getElementById("menu");
const levelDisplay = document.createElement("div");
const heartsDisplay = document.createElement("div");
const gameOverDisplay = document.createElement("div");

levelDisplay.id = "levelDisplay";
levelDisplay.style.position = "absolute";
levelDisplay.style.top = "10px";
levelDisplay.style.left = "20px";
levelDisplay.style.fontSize = "20px";
levelDisplay.style.background = "rgba(0, 0, 0, 0.5)";
levelDisplay.style.padding = "10px";
levelDisplay.style.borderRadius = "5px";
levelDisplay.style.color = "white";
levelDisplay.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
document.getElementById("game-container").appendChild(levelDisplay);

heartsDisplay.id = "heartsDisplay";
heartsDisplay.style.position = "absolute";
heartsDisplay.style.top = "50px"; 
heartsDisplay.style.right = "20px";
heartsDisplay.style.fontSize = "20px";
heartsDisplay.style.background = "rgba(0, 0, 0, 0.5)";
heartsDisplay.style.padding = "10px";
heartsDisplay.style.borderRadius = "5px";
heartsDisplay.style.color = "white";
heartsDisplay.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
document.getElementById("game-container").appendChild(heartsDisplay);

gameOverDisplay.id = "gameOverDisplay";
gameOverDisplay.style.position = "absolute";
gameOverDisplay.style.top = "50%";
gameOverDisplay.style.left = "50%";
gameOverDisplay.style.transform = "translate(-50%, -50%)";
gameOverDisplay.style.fontSize = "50px";
gameOverDisplay.style.color = "white";
gameOverDisplay.style.display = "none";
gameOverDisplay.style.zIndex = "1000";
gameOverDisplay.style.textAlign = "center";
gameOverDisplay.innerHTML = "Game Over<br><button id='restartBtn'>Restart</button>";
document.getElementById("game-container").appendChild(gameOverDisplay);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
    
    // Actualizar clases de responsive para elementos activos
    const notification = document.getElementById('achievementNotification');
    const modal = document.getElementById('achievementModal');
    
    if (notification && notification.classList.contains('show')) {
        if (isMobileDevice()) {
            notification.classList.add('mobile-notification');
        } else {
            notification.classList.remove('mobile-notification');
        }
    }
    
    // Ajustar modal si está abierto
    if (modal && modal.style.display === 'flex') {
        if (isMobileDevice()) {
            modal.classList.add('mobile-modal');
        } else {
            modal.classList.remove('mobile-modal');
        }
    }
});

// Variables del jugador
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 10,
    image: new Image(),
    movingLeft: false,
    movingRight: false,
    movingUp: false,
    movingDown: false,
    shooting: false,
    canShoot: true, // Variable para controlar la cadencia de disparo
    hearts: 3, // Corazones del jugador
};
player.image.src = "assets/player.png";

let bullets = []; // Balas del jugador
let enemies = []; // Enemigos
let kits = []; // Kits de salud
let meteors = [];   // Meteoritos
let enemyBullets = []; // Balas enemigas
let xiaos = []; // Array para los kits especiales xiao
let arlees = []; // Array para los power-ups de velocidad de disparo
let cynos = []; // Array para los power-ups de invulnerabilidad
let flins = []; // Array para los power-ups de puntos dobles
let hasFireRateBoost = false; // Control del power-up activo
let normalFireRate = 500; // Cadencia normal de disparo (500ms)
let boostedFireRate = 150; // Cadencia mejorada de disparo (150ms)
let hasDoublePoints = false; // Control del power-up de puntos dobles
let doublePointsTimer = null;
let doublePointsTimeLeft = 30; // 30 segundos de puntos dobles
let maxHearts = 3; // Corazones base máximos
let hasExtraHeart = false; // Controla si el jugador tiene el corazón extra
let isInvulnerable = false; // Control de invulnerabilidad
let invulnerabilityTimer = null;
let invulnerabilityTimeLeft = 10; // 10 segundos de invulnerabilidad
let score = 0;
let level = 1;
let gameRunning = false;
let playerName = "";
let powerUpTimer = null;
let powerUpTimeLeft = 30;
let isFireRateReduced = false;
let fireRateDebuffTimer = null;
let boss = null;

// Funciones temporales para evitar errores (se redefinen más abajo)
function updateStatsOnShoot() {}
function updateStatsOnScore() {}
function updateStatsOnDamage() {}
function updateStatsOnGameStart() {}
function updateStatsOnGameEnd() {}
function updateStatsOnKill() {}
function updateStatsOnBossKill() {}
function updateStatsOnPowerUpCollected() {}
function checkAchievements() {}
let bossActive = false;
let bossHealth = 5;
const bossName = "Astraeus, Señor del Vacío";
let fireRateDebuffTimeLeft = 10; // segundos
const powerUpTimerDisplay = document.getElementById('powerUpTimer');
const timerSpan = document.getElementById('timer');


let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let maxJoystickDistance = 45; // Reducir de 50 a 40 para un control más preciso
const deadzone = 7; // Reducir de 10 a 7 para mejor respuesta a movimientos pequeños

const shootButton = document.getElementById("shootButton");

shootButton.addEventListener("touchstart", (e) => {
    e.preventDefault();
    player.shooting = true;
});

shootButton.addEventListener("touchend", (e) => {
    e.preventDefault();
    player.shooting = false;
});

shootButton.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    player.shooting = false;
});

startGameBtn.addEventListener("click", () => {
    playerName = playerNameInput.value || "Jugador";
    menu.style.display = "none";
    canvas.style.display = "block";
    
    // Añadir clase para indicar que el juego está corriendo
    document.body.classList.add('game-running');
    
    gameRunning = true;
    startGame();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") player.movingLeft = true;
    if (e.key === "ArrowRight") player.movingRight = true;
    if (e.key === "ArrowUp") player.movingUp = true;
    if (e.key === "ArrowDown") player.movingDown = true;
    if (e.key === " ") player.shooting = true;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") player.movingLeft = false;
    if (e.key === "ArrowRight") player.movingRight = false;
    if (e.key === "ArrowUp") player.movingUp = false;
    if (e.key === "ArrowDown") player.movingDown = false;
    if (e.key === " ") player.shooting = false;
});

const shootSound = new Audio("assets/shoot.mp3");



// Partículas al disparar (efecto inicial)
function createBulletParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'bullet-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        // Dirección aleatoria
        const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
        const distance = 18 + Math.random() * 8;
        const finalX = x + Math.cos(angle) * distance;
        const finalY = y + Math.sin(angle) * distance;
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${finalX - x}px, ${finalY - y}px) scale(0.2)`, opacity: 0 }
        ], {
            duration: 350,
            easing: 'ease-out',
            fill: 'forwards'
        });
        document.getElementById('game-container').appendChild(particle);
        setTimeout(() => particle.remove(), 350);
    }
}

// Partículas de estela/trail para balas en movimiento
function createBulletTrailParticles(x, y) {
    for (let i = 0; i < 2; i++) {
        const particle = document.createElement('div');
        particle.className = 'bullet-trail-particle';
        particle.style.left = (x + (Math.random() - 0.5) * 6) + 'px';
        particle.style.top = (y + 8 + Math.random() * 6) + 'px';
        particle.style.opacity = 0.7;
        particle.animate([
            { transform: 'scale(1)', opacity: 0.7 },
            { transform: 'scale(0.2)', opacity: 0 }
        ], {
            duration: 220,
            easing: 'ease-out',
            fill: 'forwards'
        });
        document.getElementById('game-container').appendChild(particle);
        setTimeout(() => particle.remove(), 220);
    }
}

const cooldownBar = document.getElementById("shootCooldownFill");

function shoot() {
    if (player.canShoot) {
        const bulletX = player.x + 20;
        const bulletY = player.y;
        bullets.push({ x: bulletX, y: bulletY, speed: 10 });
        shootSound.play();
        player.canShoot = false;

        // Efecto de partículas al disparar
        createBulletParticles(bulletX + 2, bulletY);

        // Actualizar estadísticas de disparos
        updateStatsOnShoot();

        // Cadencia según si tiene boost o no
        const cooldown = hasFireRateBoost ? boostedFireRate : normalFireRate;

        // Inicia la animación de la barra
        cooldownBar.style.transition = 'none';
        cooldownBar.style.width = '0%';
        void cooldownBar.offsetWidth; // Reinicia la transición
        cooldownBar.style.transition = `width ${cooldown}ms linear`;
        cooldownBar.style.width = '100%';

        setTimeout(() => {
            player.canShoot = true;
        }, cooldown);
    }
}


function spawnEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: Math.random() * 2 + 1,
        health: 1,
        image: new Image(),
        canShoot: false,
        lastShot: 0
    };

    // Determinar el tipo de enemigo basado en el nivel
    if (level >= 30 && Math.random() > 0.9) {
        // Enemigo tipo 4 (artillero)
        enemy.health = 2;
        enemy.speed = 0.5; // Muy lento
        enemy.canShoot = true; // Puede disparar
        enemy.image.src = "assets/enemy4.png";
    } else if (level >= 20 && Math.random() > 0.85) {
        // Enemigo tipo 3 (muy rápido)
        enemy.health = 2;
        enemy.speed = Math.random() * 4 + 5; // Velocidad entre 7 y 13
        enemy.image.src = "assets/enemy3.png";
    } else if (level >= 10 && Math.random() > 0.8) {
        // Enemigo tipo 2 (resistente)
        enemy.health = 3;
        enemy.speed = Math.random() * 2 + 1; // Velocidad entre 1 y 3
        enemy.image.src = "assets/enemy2.png";
    } else {
        // Enemigo tipo 1 (normal)
        enemy.health = 1;
        enemy.speed = Math.random() * 2 + 1; // Velocidad entre 1 y 3
        enemy.image.src = "assets/enemy1.png";
    }
    if (Math.random() < 0.1) {
        enemy.health = 1;
        enemy.speedX = 2.5;
        enemy.speedY = 3.5;
        enemy.image.src = "assets/xiao_weapon.png";
        enemies.push(enemy);
        return;
    } 
    if (Math.random() < 0.06) { // 6% de probabilidad
        spawnIfa();
    }

    enemies.push(enemy);
}

// función para que el enemigo dispare
function enemyShoot(enemy) {
    const currentTime = Date.now();
    if (currentTime - enemy.lastShot > 3000) { // Dispara cada 3 segundos
        enemyBullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            speed: 5,
            width: 3,
            height: 8
        });
        enemy.lastShot = currentTime;
    }
}

function spawnKit() {
    const kit = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50, // Aumentar el tamaño del kit
        height: 50, // Aumentar el tamaño del kit
        speed: 2,
        image: new Image(),
    };
    kit.image.src = "assets/kit.png";
    kits.push(kit);
}

function spawnMeteor() {
    const meteor = {
        x: Math.random() * (canvas.width - 70),
        y: -70,
        width: 70,  // Aumentar el tamaño del meteorito
        height: 70, // Aumentar el tamaño del meteorito
        speed: 3,
        image: new Image(),
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        health: 2  // salud del meteorito
    };
    meteor.image.src = "assets/meteor.png";
    meteors.push(meteor);
}

// la función para crear el kit especial xiao
function spawnXiao() {
    const xiao = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: 1.5, // Más lento que el kit normal
        image: new Image(),
    };
    xiao.image.src = "assets/xiao.png"; // Necesitarás una imagen especial para este kit
    xiaos.push(xiao);
}

// la función para crear el power-up arlee
function spawnArlee() {
    const arlee = {
        x: Math.random() * (canvas.width - 50),
        y: -60,
        width: 60,
        height: 60,
        speed: 2,
        image: new Image(),
    };
    arlee.image.src = "assets/arlee.png";
    arlees.push(arlee);
}

// la función para crear el power-up cyno
function spawnCyno() {
    const cyno = {
        x: Math.random() * (canvas.width - 50),
        y: -60,
        width: 60,
        height: 60,
        speed: 2,
        image: new Image(),
    };
    cyno.image.src = "assets/cyno.png";
    cynos.push(cyno);
}

function spawnXiaoWeapon() {
    const xiaoWeapon = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speedX: 2.5, // velocidad horizontal
        speedY: 3.5, // velocidad vertical
        health: 2,
        image: new Image(),
    };
    xiaoWeapon.image.src = "assets/xiao_weapon.png";
    enemies.push(xiaoWeapon);
}
function spawnIfa() {
    const ifa = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: 1.5,
        image: new Image(),
        health: 1
    };
    ifa.image.src = "assets/ifa.png";
    enemies.push(ifa);
}

// la función para crear el power-up flins (puntos dobles)
function spawnFlins() {
    const flin = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: 2,
        image: new Image(),
    };
    flin.image.src = "assets/flins.png";
    flins.push(flin);
}


function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (player.movingLeft && player.x > 0) player.x -= player.speed;
    if (player.movingRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (player.movingUp && player.y > 0) player.y -= player.speed;
    if (player.movingDown && player.y < canvas.height - player.height) player.y += player.speed;
    if (player.shooting) shoot();

    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    
    // Elimina los disparos DOM previos
    document.querySelectorAll('.bullet').forEach(el => el.remove());
    bullets.forEach((bullet, i) => {
        bullet.y -= bullet.speed;
        // Renderiza disparo como elemento DOM épico
        let bulletDiv = document.createElement('div');
        bulletDiv.className = 'bullet';
        bulletDiv.style.left = (bullet.x - 3) + 'px';
        bulletDiv.style.top = (bullet.y - 14) + 'px';
        document.getElementById('game-container').appendChild(bulletDiv);

        // Efecto de partículas en movimiento (trail)
        createBulletTrailParticles(bullet.x + 2, bullet.y);

        // ...colisiones y lógica original...
        enemies.forEach((enemy, j) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 10 > enemy.y) {
                enemy.health--;
                bullets.splice(i, 1);
                if (enemy.health <= 0) {
                    createExplosion(
                        enemy.x + enemy.width/2,
                        enemy.y + enemy.height/2
                    );
                    
                    // Determinar tipo de enemigo para estadísticas
                    let enemyType = 'type1'; // Por defecto
                    if (enemy.image.src.includes('enemy2.png')) enemyType = 'type2';
                    else if (enemy.image.src.includes('enemy3.png')) enemyType = 'type3';
                    else if (enemy.image.src.includes('enemy4.png')) enemyType = 'type4';
                    else if (enemy.image.src.includes('ifa.png')) enemyType = 'ifa';
                    else if (enemy.image.src.includes('xiao_weapon.png')) enemyType = 'xiao_weapon';
                    
                    // Actualizar estadísticas de muertes
                    updateStatsOnKill(enemyType);
                    
                    enemies.splice(j, 1);
                    addPoints(10);
                    
                    const explosionSound = new Audio("assets/explosion.wav");
                    explosionSound.play();
                    if (score % 100 === 0) {
                        level++;
                        levelDisplay.textContent = `Nivel: ${level}`;
                        if (level % 10 === 0) {
                            enemies = [];
                        }
                    }
                }
            }
        });
        meteors.forEach((meteor, j) => {
            if (bullet.x < meteor.x + meteor.width &&
                bullet.x + 5 > meteor.x &&
                bullet.y < meteor.y + meteor.height &&
                bullet.y + 10 > meteor.y) {
                meteor.health--;
                bullets.splice(i, 1);
                if (meteor.health <= 0) {
                    meteors.splice(j, 1);
                    addPoints(20);
                    const explosionSound = new Audio("assets/explosion.wav");
                    explosionSound.play();
                    createExplosion(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2);
                } else {
                    const impactSound = new Audio("assets/impact.wav");
                    impactSound.play();
                }
            }
        });
        if (bullet.y < 0) {
            bullets.splice(i, 1);
        }
    });
// Partículas al disparar (efecto inicial)
function createBulletParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'bullet-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        // Dirección aleatoria
        const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
        const distance = 18 + Math.random() * 8;
        const finalX = x + Math.cos(angle) * distance;
        const finalY = y + Math.sin(angle) * distance;
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${finalX - x}px, ${finalY - y}px) scale(0.2)`, opacity: 0 }
        ], {
            duration: 350,
            easing: 'ease-out',
            fill: 'forwards'
        });
        document.getElementById('game-container').appendChild(particle);
        setTimeout(() => particle.remove(), 350);
    }
}

// Partículas de estela/trail para balas en movimiento
function createBulletTrailParticles(x, y) {
    for (let i = 0; i < 2; i++) {
        const particle = document.createElement('div');
        particle.className = 'bullet-trail-particle';
        particle.style.left = (x + (Math.random() - 0.5) * 6) + 'px';
        particle.style.top = (y + 8 + Math.random() * 6) + 'px';
        particle.style.opacity = 0.7;
        particle.animate([
            { transform: 'scale(1)', opacity: 0.7 },
            { transform: 'scale(0.2)', opacity: 0 }
        ], {
            duration: 220,
            easing: 'ease-out',
            fill: 'forwards'
        });
        document.getElementById('game-container').appendChild(particle);
        setTimeout(() => particle.remove(), 220);
    }
}

    // Elimina los disparos del boss previos
    document.querySelectorAll('.boss-bullet').forEach(el => el.remove());
    enemyBullets.forEach((bullet, i) => {
        bullet.y += bullet.speed;
        // Renderiza disparo del boss como elemento DOM épico
        let bossBulletDiv = document.createElement('div');
        bossBulletDiv.className = 'boss-bullet';
        bossBulletDiv.style.left = (bullet.x - 4) + 'px';
        bossBulletDiv.style.top = (bullet.y - 18) + 'px';
        document.getElementById('game-container').appendChild(bossBulletDiv);

        // Colisión con el jugador
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            enemyBullets.splice(i, 1);
            handlePlayerDamage();
        }
        if (bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    });

    // Actualizar y dibujar balas enemigas
    enemyBullets.forEach((bullet, i) => {
        bullet.y += bullet.speed;
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Colisión con el jugador
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            enemyBullets.splice(i, 1);
            handlePlayerDamage();
        }

        // Eliminar balas que salen de la pantalla
        if (bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    });

    enemies.forEach((enemy, i) => {
        enemy.y += enemy.speed;
        ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
        if (enemy.y > canvas.height) enemies.splice(i, 1);

        // Colisión con el jugador
        if (enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y) {
         if (enemy.image.src.includes("ifa.png")) {
            applyFireRateDebuff();
         }
            enemies.splice(i, 1);
            handlePlayerDamage();
        }

        // Hacer que el enemigo dispare si puede
        if (enemy.canShoot) {
            enemyShoot(enemy);
        }
    });
        enemies.forEach((enemy, i) => {
            // Movimiento especial si tiene speedX (es el xiao_weapon)
            if (enemy.speedX !== undefined) {
                enemy.x += enemy.speedX;
                enemy.y += enemy.speedY;

                // Rebote horizontal
                if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                    enemy.speedX *= -1;
                }
            } else {
                enemy.y += enemy.speed;
            }

            ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);

            if (enemy.y > canvas.height) enemies.splice(i, 1);

            // Colisión con el jugador
            if (enemy.x < player.x + player.width &&
                enemy.x + enemy.width > player.x &&
                enemy.y < player.y + player.height &&
                enemy.y + enemy.height > player.y) {
                enemies.splice(i, 1);
                handlePlayerDamage();
            }

            // Hacer que el enemigo dispare si puede
            if (enemy.canShoot) {
                enemyShoot(enemy);
            }
        });

    kits.forEach((kit, i) => {
        kit.y += kit.speed;
        ctx.drawImage(kit.image, kit.x, kit.y, kit.width, kit.height);
        if (kit.y > canvas.height) kits.splice(i, 1);

        // Colisión con el jugador para recoger el kit
        if (kit.x < player.x + player.width &&
            kit.x + kit.width > player.x &&
            kit.y < player.y + player.height &&
            kit.y + kit.height > player.y) {
            kits.splice(i, 1);
            
            // Actualizar estadísticas de power-up recolectado
            updateStatsOnPowerUpCollected('kit');
            
            if (player.hearts < maxHearts) {
                player.hearts++;
                updateHeartsDisplay();
                
                // Efecto de sonido
                const healSound = new Audio("assets/heal.wav");
                healSound.play();
                
                // Efecto visual en el jugador
                player.image.classList.add('healing');
                setTimeout(() => {
                    player.image.classList.remove('healing');
                }, 500);
                
                // Efecto de partículas de curación
                createHealEffect(player.x + player.width/2, player.y + player.height/2);
            }
        }
    });

    meteors.forEach((meteor, i) => {
        meteor.y += meteor.speed;
        meteor.rotation += meteor.rotationSpeed;
        
        // Guardar el estado actual del contexto
        ctx.save();
        
        // Trasladar al centro del meteorito
        ctx.translate(meteor.x + meteor.width/2, meteor.y + meteor.height/2);
        
        // Rotar
        ctx.rotate(meteor.rotation);
        
        // Dibujar el meteorito
        ctx.drawImage(
            meteor.image, 
            -meteor.width/2, 
            -meteor.height/2, 
            meteor.width, 
            meteor.height
        );
        
        // Restaurar el estado del contexto
        ctx.restore();

        if (meteor.y > canvas.height) {
            meteors.splice(i, 1);
        }

        // Colisión con el jugador
        if (meteor.x < player.x + player.width &&
            meteor.x + meteor.width > player.x &&
            meteor.y < player.y + player.height &&
            meteor.y + meteor.height > player.y) {
            meteors.splice(i, 1);
            handlePlayerDamage();
            
            // Efecto visual y sonoro
            const explosionSound = new Audio("assets/explosion.wav");
            explosionSound.play();
            
            createExplosion(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2);
        }
    });

    xiaos.forEach((xiao, i) => {
        xiao.y += xiao.speed;
        ctx.drawImage(xiao.image, xiao.x, xiao.y, xiao.width, xiao.height);
        
        if (xiao.y > canvas.height) {
            xiaos.splice(i, 1);
        }

        // Colisión con el jugador
        if (xiao.x < player.x + player.width &&
            xiao.x + xiao.width > player.x &&
            xiao.y < player.y + player.height &&
            xiao.y + xiao.height > player.y) {
            xiaos.splice(i, 1);
            
            // Actualizar estadísticas de power-up recolectado
            updateStatsOnPowerUpCollected('xiao');
            
            if (player.hearts === maxHearts && !hasExtraHeart) {
                player.hearts++;
                hasExtraHeart = true;
                updateHeartsDisplay();
                
                // Efecto visual y sonoro especial
                const xiaoSound = new Audio("assets/xiao.wav");
                xiaoSound.play();
                
                // Efecto visual especial
                heartsDisplay.style.animation = "glow 1s ease-in-out";
                setTimeout(() => {
                    heartsDisplay.style.animation = "";
                }, 1000);
            }
        }
    });

    arlees.forEach((arlee, i) => {
        arlee.y += arlee.speed;
        ctx.drawImage(arlee.image, arlee.x, arlee.y, arlee.width, arlee.height);
        
        if (arlee.y > canvas.height) {
            arlees.splice(i, 1);
        }

        // Colisión con el jugador
        if (arlee.x < player.x + player.width &&
            arlee.x + arlee.width > player.x &&
            arlee.y < player.y + player.height &&
            arlee.y + arlee.height > player.y) {
            arlees.splice(i, 1);
            
            // Actualizar estadísticas de power-up recolectado
            updateStatsOnPowerUpCollected('arlee');
            
            // Si ya hay un power-up activo, solo reinicia el tiempo
            if (hasFireRateBoost) {
                powerUpTimeLeft = 30;
            } else {
                // Activar power-up por primera vez
                hasFireRateBoost = true;
                powerUpTimeLeft = 30;
                powerUpTimerDisplay.style.display = 'block';
                
                // Iniciar el contador
                startPowerUpTimer();
            }
            
            // Efecto visual y sonoro
            const powerUpSound = new Audio("assets/powerup.wav");
            powerUpSound.play();
            
            // Efecto visual en el jugador
            player.image.style.filter = "hue-rotate(90deg)";
        }
    });

    cynos.forEach((cyno, i) => {
        cyno.y += cyno.speed;
        ctx.drawImage(cyno.image, cyno.x, cyno.y, cyno.width, cyno.height);
        
        if (cyno.y > canvas.height) {
            cynos.splice(i, 1);
        }

        // Colisión con el jugador
        if (cyno.x < player.x + player.width &&
            cyno.x + cyno.width > player.x &&
            cyno.y < player.y + player.height &&
            cyno.y + cyno.height > player.y) {
            cynos.splice(i, 1);
            
            // Actualizar estadísticas de power-up recolectado
            updateStatsOnPowerUpCollected('cyno');
            
            // Si ya es invulnerable, solo reinicia el tiempo
            if (isInvulnerable) {
                invulnerabilityTimeLeft = 10;
            } else {
                // Activar invulnerabilidad por primera vez
                isInvulnerable = true;
                invulnerabilityTimeLeft = 10;
                startInvulnerabilityTimer();
            }
            
            // Efecto visual y sonoro
            const powerUpSound = new Audio("assets/shield.wav");
            powerUpSound.play();
            
            // Efecto visual en el jugador
            player.image.style.filter = "hue-rotate(180deg) brightness(1.5)";
        }
    });

    flins.forEach((flin, i) => {
        flin.y += flin.speed;
        
        // Efecto visual especial para flins - brillo dorado
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.drawImage(flin.image, flin.x, flin.y, flin.width, flin.height);
        ctx.restore();
        
        if (flin.y > canvas.height) {
            flins.splice(i, 1);
        }

        // Colisión con el jugador
        if (flin.x < player.x + player.width &&
            flin.x + flin.width > player.x &&
            flin.y < player.y + player.height &&
            flin.y + flin.height > player.y) {
            flins.splice(i, 1);
            
            // Actualizar estadísticas de power-up recolectado
            updateStatsOnPowerUpCollected('flins');
            
            // Si ya tiene puntos dobles, solo reinicia el tiempo
            if (hasDoublePoints) {
                doublePointsTimeLeft = 30;
            } else {
                // Activar puntos dobles por primera vez
                hasDoublePoints = true;
                doublePointsTimeLeft = 30;
                startDoublePointsTimer();
            }
            
            // Efecto visual y sonoro épico
            createDoublePointsEffect(player.x + player.width/2, player.y + player.height/2);
            const powerUpSound = new Audio("assets/coin.wav");
            powerUpSound.volume = 0.7;
            powerUpSound.play().catch(() => {});
        }
    });

    // Boss logic
    if (bossActive && boss) {
        animateBoss(ctx); // animación y dibujo del boss
        bossAttack();

        // Colisión con balas del jugador
        bullets.forEach((bullet, i) => {
            if (boss) {
                if (
                    bullet.x < boss.x + boss.width &&
                    bullet.x + 5 > boss.x &&
                    bullet.y < boss.y + boss.height &&
                    bullet.y + 10 > boss.y
                ) {
                    bullets.splice(i, 1);
                    handleBossHit();
                }
            }
        });

        // Colisión con el jugador
        if (boss) {
            if (
                boss.x < player.x + player.width &&
                boss.x + boss.width > player.x &&
                boss.y < player.y + boss.height &&
                boss.y + boss.height > player.y
            ) {
                handlePlayerDamage();
            }
        }
    }

    // Boss aparece en nivel 10
    if (level === 10  && !bossActive && !boss) {
        spawnBoss();
    }

    if (gameRunning) requestAnimationFrame(updateGame);
}

function updateHeartsDisplay() {
    heartsDisplay.innerHTML = "";
    for (let i = 0; i < player.hearts; i++) {
        const heart = document.createElement("img");
        heart.src = i < maxHearts ? "assets/heart.png" : "assets/xiao_heart.png";
        heart.style.width = "20px";
        heart.style.margin = "0 5px";
        if (i >= maxHearts) {
            heart.style.filter = "hue-rotate(90deg)"; // Da un color diferente al corazón extra
        }
        heartsDisplay.appendChild(heart);
    }
}

function gameOver() {
    gameOverDisplay.style.display = "block";
    canvas.style.filter = "grayscale(100%)";
    
    // Remover clase cuando el juego termina
    document.body.classList.remove('game-running');
    
    // Actualizar estadísticas de fin de partida
    updateStatsOnGameEnd();
    
    saveScore();
}

function saveScore() {
    let scores = JSON.parse(localStorage.getItem("scores")) || [];
    scores.push({ name: playerName, score: score });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10); // Mantener solo los mejores 10 puntajes en la tabla
    localStorage.setItem("scores", JSON.stringify(scores));
    displayScores(scores);
}

function displayScores(scores) {
    const scoresList = document.getElementById("scoresList");
    scoresList.innerHTML = "";
    scores.forEach(score => {
        const li = document.createElement("li");
        li.textContent = `${score.name}: ${score.score}`;
        scoresList.appendChild(li);
    });
}

document.getElementById("restartBtn").addEventListener("click", () => {
    // Remover clase antes de recargar
    document.body.classList.remove('game-running');
    window.location.reload();
});


function startGame() {
    level = 1;
    score = 0;
    player.hearts = maxHearts;
    levelDisplay.textContent = `Nivel: ${level}`;
    scoreDisplay.textContent = score;
    updateHeartsDisplay();
    enemies = [];
    bullets = [];
    kits = [];
    meteors = []; 
    enemyBullets = []; // Limpiar las balas enemigas
    xiaos = [];
    arlees = []; // Limpiar los power-ups de velocidad de disparo
    cynos = [];
    flins = []; // Limpiar los power-ups de puntos dobles
    isInvulnerable = false;
    if (invulnerabilityTimer) {
        clearInterval(invulnerabilityTimer);
        invulnerabilityTimer = null;
    }
    invulnerabilityTimeLeft = 10;
    document.getElementById('invulnerabilityTimer').style.display = 'none';
    hasExtraHeart = false;
    if (powerUpTimer) {
        clearInterval(powerUpTimer);
        powerUpTimer = null;
    }
    hasFireRateBoost = false;
    powerUpTimeLeft = 30;
    powerUpTimerDisplay.style.display = 'none';
    
    // Limpiar timer de puntos dobles
    hasDoublePoints = false;
    if (doublePointsTimer) {
        clearInterval(doublePointsTimer);
        doublePointsTimer = null;
    }
    doublePointsTimeLeft = 30;
    document.getElementById('doublePointsTimer').style.display = 'none';
    
    player.image.style.filter = "none";
    gameRunning = true;
    gameOverDisplay.style.display = "none";
    canvas.style.filter = "none";
    
    // Actualizar estadísticas de inicio de partida
    updateStatsOnGameStart();
    
    spawnEnemies();
    updateGame();
    initJoystick();
}

function handlePlayerDamage() {
    if (isInvulnerable) return; // Si es invulnerable, no recibe daño
    
    player.hearts--;
    if (player.hearts === maxHearts) {
        hasExtraHeart = false;
    }
    updateHeartsDisplay();

    // Actualizar estadísticas de daño
    updateStatsOnDamage();

    // Efecto visual en el jugador
    player.image.classList.add('damage');
    setTimeout(() => {
        player.image.classList.remove('damage');
    }, 500);

    // Efecto de partículas de daño
    createDamageEffect(player.x + player.width/2, player.y + player.height/2);

    // Sonido de daño
    const damageSound = new Audio("assets/damage.wav");
    damageSound.play();

    // Efecto en el contador de corazones
    heartsDisplay.classList.add("pulse");
    setTimeout(() => {
        heartsDisplay.classList.remove("pulse");
    }, 1000);

    if (player.hearts <= 0) {
        gameRunning = false;
        gameOver();
    }
}

function createDamageEffect(x, y) {
    // Crear partículas de daño
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'damage-particle';
        
        // Posición inicial
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        // Dirección aleatoria
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 50;
        const finalX = x + Math.cos(angle) * distance;
        const finalY = y + Math.sin(angle) * distance;
        
        // Animación
        particle.animate([
            { 
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            { 
                transform: `translate(${finalX - x}px, ${finalY - y}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: 500,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        document.getElementById('game-container').appendChild(particle);
        
        // Eliminar la partícula después de la animación
        setTimeout(() => particle.remove(), 500);
    }
}

function spawnEnemies() {
    setInterval(() => {
        if (bossActive) return; // No generar enemigos si el boss está activo

        let enemiesToSpawn = level % 10 === 0 ? 1 : level % 10;
        for (let i = 0; i < enemiesToSpawn; i++) {
            spawnEnemy();
        }
        if (Math.random() < 0.1) { // 10% de probabilidad de que aparezca un kit
            spawnKit();
        }
        if (Math.random() < 0.05) { // 5% de probabilidad de que aparezca un meteorito
            spawnMeteor();
        }
        // Spawn xiao con % de probabilidad solo si el jugador tiene exactamente 3 corazones
        if (Math.random() < 0.03 && player.hearts === maxHearts && !hasExtraHeart) {
            spawnXiao();
        }
        // Spawn arlee con 7% de probabilidad solo si el jugador no tiene el boost activo
        if (Math.random() < 0.07) { // 7% de probabilidad de que aparezca arlee
            spawnArlee();
        }
        // Spawn cyno con 4% de probabilidad
        if (Math.random() < 0.04) {
            spawnCyno();
        }
        // Spawn flins solo en el nivel 1 con 8% de probabilidad
        if (level === 1 && Math.random() < 0.08) {
            spawnFlins();
        }
         // 6% probabilidad de que aparezca el enemigo xiao_weapon
        if (Math.random() < 0.10) {
            spawnXiaoWeapon();
        }

    }, 2000);
}

function startPowerUpTimer() {
    // Limpiar timer existente si hay uno
    if (powerUpTimer) {
        clearInterval(powerUpTimer);
    }
    
    powerUpTimer = setInterval(() => {
        powerUpTimeLeft--;
        timerSpan.textContent = powerUpTimeLeft;
        
        if (powerUpTimeLeft <= 0) {
            // Desactivar power-up
            hasFireRateBoost = false;
            player.image.style.filter = "none";
            powerUpTimerDisplay.style.display = 'none';
            clearInterval(powerUpTimer);
            powerUpTimer = null;
        }
    }, 1000);
}

function startInvulnerabilityTimer() {
    if (invulnerabilityTimer) {
        clearInterval(invulnerabilityTimer);
    }
    
    const invTimerDisplay = document.getElementById('invulnerabilityTimer');
    const invTimerSpan = document.getElementById('invTimer');
    invTimerDisplay.style.display = 'block';
    
    invulnerabilityTimer = setInterval(() => {
        invulnerabilityTimeLeft--;
        invTimerSpan.textContent = invulnerabilityTimeLeft;
        
        if (invulnerabilityTimeLeft <= 0) {
            isInvulnerable = false;
            player.image.style.filter = "none";
            invTimerDisplay.style.display = 'none';
            clearInterval(invulnerabilityTimer);
            invulnerabilityTimer = null;
        }
    }, 1000);
}

function startDoublePointsTimer() {
    if (doublePointsTimer) {
        clearInterval(doublePointsTimer);
    }
    
    const doublePointsDisplay = document.getElementById('doublePointsTimer');
    const doublePointsSpan = document.getElementById('doublePointsTime');
    doublePointsDisplay.style.display = 'block';
    
    doublePointsTimer = setInterval(() => {
        doublePointsTimeLeft--;
        doublePointsSpan.textContent = doublePointsTimeLeft;
        
        if (doublePointsTimeLeft <= 0) {
            hasDoublePoints = false;
            doublePointsDisplay.style.display = 'none';
            clearInterval(doublePointsTimer);
            doublePointsTimer = null;
        }
    }, 1000);
}

const bgMusic = new Audio("assets/background.mp3");
bgMusic.loop = true;
bgMusic.play();

// Controles táctiles para dispositivos móviles y botones en pantalla
canvas.addEventListener("touchstart", handleTouchStart, false);
canvas.addEventListener("touchmove", handleTouchMove, false);
canvas.addEventListener("touchend", handleTouchEnd, false);

let touchX, touchY;

// Añadir eventos táctiles para los botones
function handleTouchStart(e) {
    const touch = e.touches[0];
    touchX = touch.clientX;
    touchY = touch.clientY;
    if (touchY < canvas.height / 2) {
        player.shooting = true;
    }
}

function handleTouchMove(e) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchX;
    const deltaY = touch.clientY - touchY;
    touchX = touch.clientX;
    touchY = touch.clientY;

    if (deltaX < 0) player.movingLeft = true;
    if (deltaX > 0) player.movingRight = true;
    if (deltaY < 0) player.movingUp = true;
    if (deltaY > 0) player.movingDown = true;
}

function handleTouchEnd(e) {
    player.movingLeft = false;
    player.movingRight = false;
    player.movingUp = false;
    player.movingDown = false;
    player.shooting = false;
}

// Añade esta nueva función para crear el efecto de curación
function createHealEffect(x, y) {
    const effect = document.createElement('div');
    effect.className = 'heal-effect';
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    document.getElementById('game-container').appendChild(effect);
    
    // Remover el elemento después de la animación
    setTimeout(() => {
        effect.remove();
    }, 500);
    
    // Crear múltiples anillos de curación
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const ring = document.createElement('div');
            ring.className = 'heal-effect';
            ring.style.left = x + 'px';
            ring.style.top = y + 'px';
            document.getElementById('game-container').appendChild(ring);
            setTimeout(() => {
                ring.remove();
            }, 500);
        }, i * 100);
    }
}

// Función para crear el efecto visual de puntos dobles
function createDoublePointsEffect(x, y) {
    // Crear efecto principal de monedas doradas
    const mainEffect = document.createElement('div');
    mainEffect.className = 'double-points-effect';
    mainEffect.style.left = (x - 25) + 'px';
    mainEffect.style.top = (y - 25) + 'px';
    mainEffect.innerHTML = '✨ x2 PUNTOS ✨';
    document.getElementById('game-container').appendChild(mainEffect);
    
    // Remover después de la animación
    setTimeout(() => {
        mainEffect.remove();
    }, 2000);
    
    // Crear partículas doradas flotantes
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'gold-particle';
            particle.style.left = (x + Math.random() * 60 - 30) + 'px';
            particle.style.top = (y + Math.random() * 60 - 30) + 'px';
            particle.innerHTML = ['💰', '💎', '⭐', '✨'][Math.floor(Math.random() * 4)];
            document.getElementById('game-container').appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1500);
        }, i * 100);
    }
}

// Función para añadir puntos considerando el multiplicador
function addPoints(basePoints, showFloatingText = true) {
    const finalPoints = hasDoublePoints ? basePoints * 2 : basePoints;
    score += finalPoints;
    scoreDisplay.textContent = score;
    
    // Actualizar estadísticas de puntuación en tiempo real
    updateStatsOnScore(finalPoints);
    
    // Mostrar texto flotante de puntos si se requiere
    if (showFloatingText && hasDoublePoints) {
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-points';
        floatingText.style.left = (player.x + player.width/2) + 'px';
        floatingText.style.top = (player.y - 20) + 'px';
        floatingText.innerHTML = `+${finalPoints}`;
        document.getElementById('game-container').appendChild(floatingText);
        
        setTimeout(() => {
            floatingText.remove();
        }, 1000);
    }
    
    return finalPoints;
}

// Añade esta nueva función para crear el efecto de explosión
function createExplosion(x, y) {
    // Crear múltiples partículas de explosión
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';
        
        // Tamaño aleatorio para cada partícula
        const size = Math.random() * 20 + 10;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Posición inicial
        particle.style.left = (x - size/2) + 'px';
        particle.style.top = (y - size/2) + 'px';
        
        // Animación
        particle.style.animation = 'explosion 0.5s ease-out forwards';
        
        // Dirección aleatoria
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 30;
        const finalX = x + Math.cos(angle) * distance;
        const finalY = y + Math.sin(angle) * distance;
        
        particle.animate([
            { transform: `translate(0, 0)` },
            { transform: `translate(${finalX - x}px, ${finalY - y}px)` }
        ], {
            duration: 500,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        document.getElementById('game-container').appendChild(particle);
        
        // Eliminar la partícula después de la animación
        setTimeout(() => particle.remove(), 500);
    }
}

// Añade estas funciones para el joystick
function initJoystick() {
    const joystickArea = document.getElementById('joystickArea');
    const joystick = document.getElementById('joystick');
    
    joystickArea.addEventListener('touchstart', handleJoystickStart);
    joystickArea.addEventListener('touchmove', handleJoystickMove);
    joystickArea.addEventListener('touchend', handleJoystickEnd);
    
    // Obtener posición inicial del joystick
    const rect = joystickArea.getBoundingClientRect();
    joystickCenter.x = rect.left + rect.width / 2;
    joystickCenter.y = rect.top + rect.height / 2;
}

function handleJoystickStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    joystickActive = true;
    document.getElementById('joystick').classList.add('active');
    updateJoystickPosition(touch);
}

function handleJoystickMove(e) {
    e.preventDefault();
    if (!joystickActive) return;
    
    const touch = e.touches[0];
    updateJoystickPosition(touch);
}

function handleJoystickEnd(e) {
    e.preventDefault();
    joystickActive = false;
    const joystick = document.getElementById('joystick');
    joystick.style.transform = 'translate(-50%, -50%)';
    joystick.classList.remove('active');
    
    // Detener movimiento del jugador
    player.movingLeft = false;
    player.movingRight = false;
    player.movingUp = false;
    player.movingDown = false;
}

function updateJoystickPosition(touch) {
    const joystick = document.getElementById('joystick');
    const area = document.getElementById('joystickArea');
    const rect = area.getBoundingClientRect();
    
    // Calcular la distancia desde el centro
    let deltaX = touch.clientX - (rect.left + rect.width / 2);
    let deltaY = touch.clientY - (rect.top + rect.height / 2);
    
    // Limitar la distancia máxima
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > maxJoystickDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * maxJoystickDistance;
        deltaY = Math.sin(angle) * maxJoystickDistance;
    }
    
    // Mover el joystick
    joystick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    
    player.movingLeft = deltaX < -deadzone;
    player.movingRight = deltaX > deadzone;
    player.movingUp = deltaY < -deadzone;
    player.movingDown = deltaY > deadzone;
    
    // Ajustar la velocidad según la distancia con una curva de aceleración suave
    const speedMultiplier = Math.pow(Math.min(distance / maxJoystickDistance, 1), 1.5);
    player.speed = 7 * speedMultiplier; // Cambio de 10 a 7
}
function applyFireRateDebuff() {
    if (isFireRateReduced) {
        fireRateDebuffTimeLeft = 10;
        return;
    }

    isFireRateReduced = true;
    normalFireRate = 800; // más lento
    fireRateDebuffTimeLeft = 10;

    const fireRateDebuffDisplay = document.getElementById('fireRateDebuff');
    const debuffTimerSpan = document.getElementById('debuffTimer');
    fireRateDebuffDisplay.style.display = 'block';
    debuffTimerSpan.textContent = fireRateDebuffTimeLeft;

    fireRateDebuffTimer = setInterval(() => {
        fireRateDebuffTimeLeft--;
        debuffTimerSpan.textContent = fireRateDebuffTimeLeft;

        if (fireRateDebuffTimeLeft <= 0) {
            isFireRateReduced = false;
            normalFireRate = 500; // volver al normal
            fireRateDebuffDisplay.style.display = 'none';
            clearInterval(fireRateDebuffTimer);
            fireRateDebuffTimer = null;
        }
    }, 1000);
}


// Elementos para la barra de vida y nombre del boss
const bossBar = document.createElement("div");
bossBar.id = "bossBar";
bossBar.style.position = "absolute";
bossBar.style.top = "60px";
bossBar.style.left = "50%";
bossBar.style.transform = "translateX(-50%)";
bossBar.style.width = "400px";
bossBar.style.height = "30px";
bossBar.style.background = "rgba(0,0,0,0.7)";
bossBar.style.border = "2px solid #fff";
bossBar.style.borderRadius = "10px";
bossBar.style.display = "none";
bossBar.style.zIndex = "1002";
bossBar.innerHTML = `
    <div id="bossName" style="text-align:center;font-size:22px;color:#ffeb3b;font-weight:bold;margin-bottom:2px;">${bossName}</div>
    <div id="bossHealthBar" style="width:100%;height:14px;background:#222;border-radius:7px;overflow:hidden;">
        <div id="bossHealthFill" style="width:100%;height:100%;background:linear-gradient(90deg,#ff1744,#ffeb3b);transition:width 0.3s;"></div>
    </div>
`;
document.getElementById("game-container").appendChild(bossBar);

function spawnBoss() {
    boss = {
        x: canvas.width / 2 - 180,
        y: 40,
        width: 360,
        height: 180,
        health: bossHealth,
        image: new Image(),
        attackTimer: 0,
        meteorTimer: 0,
        appearing: true,
        appearAnim: 0,
        dying: false,
        damageAnim: 0
    };
    boss.image.src = "assets/Boss.png";
    bossActive = true;
    bossBar.style.display = "block";
    updateBossBar();

    // Animación de aparición
    boss.appearing = true;
    boss.appearAnim = 0;

    // Bloquear enemigos normales
    enemies = [];
}

function animateBoss(ctx) {
    if (!boss) return;
    ctx.save();

    // Movimiento lateral simple
    if (!boss.dying && !boss.appearing) {
        boss.x += Math.sin(Date.now() / 600) * 2; // Oscila suavemente
        // Rebote en los bordes
        if (boss.x < 0) boss.x = 0;
        if (boss.x + boss.width > canvas.width) boss.x = canvas.width - boss.width;
    }

    // Animación de aparición
    let scale = 1;
    let opacity = 1;
    if (boss.appearing) {
        boss.appearAnim += 0.04;
        scale = Math.min(1, boss.appearAnim);
        opacity = Math.min(1, boss.appearAnim);
        if (scale >= 1) boss.appearing = false;
    }

    // Animación de daño
    if (boss.damageAnim > 0) {
        opacity = 0.5 + 0.5 * Math.sin(boss.damageAnim * 20);
        boss.damageAnim -= 0.08;
        if (boss.damageAnim < 0) boss.damageAnim = 0;
    }

    // Animación de muerte
    if (boss.dying) {
        scale = 1 + boss.dying * 0.5;
        opacity = 1 - boss.dying;
        boss.dying += 0.04;
        if (boss.dying > 1) {
            bossActive = false;
            bossBar.style.display = "none";
            boss = null;
        }
    }

    ctx.globalAlpha = opacity;
    ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);
    ctx.scale(scale, scale);
    ctx.drawImage(boss.image, -boss.width / 2, -boss.height / 2, boss.width, boss.height);
    ctx.restore();
    ctx.globalAlpha = 1;
}

function bossAttack() {
    if (!boss || boss.appearing || boss.dying) return;
    // Ataque especial: disparo múltiple cada 2 segundos
    if (Date.now() - boss.attackTimer > 2000) {
        for (let i = -2; i <= 2; i++) {
            enemyBullets.push({
                x: boss.x + boss.width / 2 + i * 40,
                y: boss.y + boss.height,
                speed: 7,
                width: 8,
                height: 18
            });
        }
        boss.attackTimer = Date.now();
    }
    // Ataque especial: lluvia de meteoritos cada 5 segundos
    if (Date.now() - boss.meteorTimer > 5000) {
        for (let i = 0; i < 4; i++) {
            meteors.push({
                x: Math.random() * (canvas.width - 70),
                y: boss.y + boss.height,
                width: 70,
                height: 70,
                speed: 4 + Math.random() * 2,
                image: (() => { let img = new Image(); img.src = "assets/meteor.png"; return img; })(),
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                health: 2
            });
        }
        boss.meteorTimer = Date.now();
    }
}

function handleBossHit() {
    if (!boss || boss.dying) return;
    boss.health--;
    boss.damageAnim = 1; // Inicia animación de daño
    bossBar.classList.add("boss-bar-damage");
    setTimeout(() => bossBar.classList.remove("boss-bar-damage"), 300);
    updateBossBar();
    if (boss.health <= 0) {
        // Guarda la posición antes de eliminar el boss
        const bossX = boss.x;
        const bossY = boss.y;
        const bossWidth = boss.width;
        const bossHeight = boss.height;

        // Actualizar estadísticas de muerte de boss
        updateStatsOnBossKill();

        // Explosión épica
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                createExplosion(
                    bossX + bossWidth / 2 + Math.cos((Math.PI * 2 * i) / 12) * 80,
                    bossY + bossHeight / 2 + Math.sin((Math.PI * 2 * i) / 12) * 60
                );
            }, i * 80);
        }
        score += 100; // Suficiente para pasar de nivel
        scoreDisplay.textContent = score;
        
        // Actualizar estadísticas de puntuación en tiempo real
        updateStatsOnScore(100);
        
        // Sonido de victoria
        const victorySound = new Audio("assets/explosion.wav");
        victorySound.play();
        // Eliminar boss inmediatamente
        bossActive = false;
        bossBar.style.display = "none";
        boss = null;
        // Sube de nivel y limpia enemigos
        level++;
        levelDisplay.textContent = `Nivel: ${level}`;
        enemies = [];
        // Permitir que vuelvan a aparecer enemigos normales
        if (typeof enemySpawnInterval !== 'undefined') clearInterval(enemySpawnInterval);
        spawnEnemies();
    }
}

function updateBossBar() {
    if (!boss) return;
    const percent = (boss.health / bossHealth) * 100;
    document.getElementById("bossHealthFill").style.width = percent + "%";
}

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
    enemyTypesKilled: { type1: 0, type2: 0, type3: 0, type4: 0, ifa: 0, xiao_weapon: 0 },
    sessionStartTime: 0
};

// Definición de todos los logros épicos
const achievements = [
    // COMBATE ⚔️
    {
        id: 'first_blood',
        name: '🗡️ Primera Sangre',
        description: 'Destruye tu primer enemigo',
        category: 'combat',
        rarity: 'common',
        points: 10,
        icon: '⚔️',
        condition: () => playerStats.totalKills >= 1,
        unlocked: false
    },
    {
        id: 'newbie_killer',
        name: '🔪 Asesino Novato',
        description: 'Destruye 5 enemigos',
        category: 'combat',
        rarity: 'common',
        points: 15,
        icon: '🔪',
        condition: () => playerStats.totalKills >= 5,
        unlocked: false
    },
    {
        id: 'marksman',
        name: '🎯 Tirador Experto',
        description: 'Dispara 100 veces',
        category: 'combat',
        rarity: 'common',
        points: 15,
        icon: '🎯',
        condition: () => playerStats.totalShots >= 100,
        unlocked: false
    },
    {
        id: 'trigger_happy',
        name: '💥 Gatillo Alegre',
        description: 'Dispara 25 veces',
        category: 'combat',
        rarity: 'common',
        points: 10,
        icon: '💥',
        condition: () => playerStats.totalShots >= 25,
        unlocked: false
    },
    {
        id: 'slayer',
        name: '💀 Exterminador',
        description: 'Destruye 50 enemigos',
        category: 'combat',
        rarity: 'rare',
        points: 25,
        icon: '💀',
        condition: () => playerStats.totalKills >= 50,
        unlocked: false
    },
    {
        id: 'genocide',
        name: '☠️ Genocidio Espacial',
        description: 'Destruye 500 enemigos',
        category: 'combat',
        rarity: 'epic',
        points: 50,
        icon: '☠️',
        condition: () => playerStats.totalKills >= 500,
        unlocked: false
    },
    {
        id: 'killing_spree',
        name: '🔥 Masacre Espacial',
        description: 'Mata 10 enemigos consecutivos sin recibir daño',
        category: 'combat',
        rarity: 'rare',
        points: 30,
        icon: '🔥',
        condition: () => playerStats.maxConsecutiveKills >= 10,
        unlocked: false
    },
    {
        id: 'unstoppable',
        name: '⚡ Imparable',
        description: 'Mata 25 enemigos consecutivos sin recibir daño',
        category: 'combat',
        rarity: 'epic',
        points: 75,
        icon: '⚡',
        condition: () => playerStats.maxConsecutiveKills >= 25,
        unlocked: false
    },
    {
        id: 'boss_slayer',
        name: '👑 Matador de Jefes',
        description: 'Derrota tu primer boss',
        category: 'combat',
        rarity: 'epic',
        points: 100,
        icon: '👑',
        condition: () => playerStats.bossesKilled >= 1,
        unlocked: false
    },
    {
        id: 'boss_destroyer',
        name: '🐉 Destructor de Titanes',
        description: 'Derrota 5 bosses',
        category: 'combat',
        rarity: 'legendary',
        points: 200,
        icon: '🐉',
        condition: () => playerStats.bossesKilled >= 5,
        unlocked: false
    },
    {
        id: 'meteor_master',
        name: '☄️ Maestro de Meteoritos',
        description: 'Destruye 20 meteoritos',
        category: 'combat',
        rarity: 'rare',
        points: 40,
        icon: '☄️',
        condition: () => playerStats.meteorsDestroyed >= 20,
        unlocked: false
    },
    {
        id: 'diversified_killer',
        name: '🎭 Exterminador Diverso',
        description: 'Mata al menos 10 enemigos de cada tipo',
        category: 'combat',
        rarity: 'epic',
        points: 60,
        icon: '🎭',
        condition: () => {
            const types = playerStats.enemyTypesKilled;
            return types.type1 >= 10 && types.type2 >= 10 && types.type3 >= 10 && types.type4 >= 10;
        },
        unlocked: false
    },

    // SUPERVIVENCIA 🛡️
    {
        id: 'survivor',
        name: '🛡️ Superviviente',
        description: 'Sobrevive 5 minutos en una partida',
        category: 'survival',
        rarity: 'common',
        points: 20,
        icon: '🛡️',
        condition: () => playerStats.totalGameTime >= 300000, // 5 minutos en ms
        unlocked: false
    },
    {
        id: 'marathon_runner',
        name: '🏃 Corredor de Maratón',
        description: 'Juega por un total de 1 hora',
        category: 'survival',
        rarity: 'rare',
        points: 50,
        icon: '🏃',
        condition: () => playerStats.totalGameTime >= 3600000, // 1 hora en ms
        unlocked: false
    },
    {
        id: 'level_master',
        name: '🌟 Maestro de Niveles',
        description: 'Alcanza el nivel 20',
        category: 'survival',
        rarity: 'epic',
        points: 80,
        icon: '🌟',
        condition: () => playerStats.maxLevel >= 20,
        unlocked: false
    },
    {
        id: 'level_god',
        name: '⭐ Dios de los Niveles',
        description: 'Alcanza el nivel 50',
        category: 'survival',
        rarity: 'legendary',
        points: 150,
        icon: '⭐',
        condition: () => playerStats.maxLevel >= 50,
        unlocked: false
    },
    {
        id: 'untouchable',
        name: '👻 Intocable',
        description: 'Sobrevive 2 minutos sin recibir daño',
        category: 'survival',
        rarity: 'epic',
        points: 70,
        icon: '👻',
        condition: () => playerStats.maxTimeWithoutDamage >= 120000, // 2 minutos
        unlocked: false
    },
    {
        id: 'iron_will',
        name: '🔨 Voluntad de Hierro',
        description: 'Completa un nivel sin recibir daño',
        category: 'survival',
        rarity: 'rare',
        points: 35,
        icon: '🔨',
        condition: () => playerStats.perfectLevels >= 1,
        unlocked: false
    },
    {
        id: 'perfectionist',
        name: '💎 Perfeccionista',
        description: 'Completa 5 niveles sin recibir daño',
        category: 'survival',
        rarity: 'epic',
        points: 100,
        icon: '💎',
        condition: () => playerStats.perfectLevels >= 5,
        unlocked: false
    },
    {
        id: 'heart_collector',
        name: '❤️ Coleccionista de Corazones',
        description: 'Alcanza 6 corazones de vida',
        category: 'survival',
        rarity: 'rare',
        points: 40,
        icon: '❤️',
        condition: () => playerStats.maxHearts >= 6,
        unlocked: false
    },

    // COLECCIÓN 💎
    {
        id: 'first_powerup',
        name: '🎁 Primer Power-Up',
        description: 'Recolecta tu primer power-up',
        category: 'collection',
        rarity: 'common',
        points: 10,
        icon: '🎁',
        condition: () => playerStats.powerUpsCollected >= 1,
        unlocked: false
    },
    {
        id: 'powerup_addict',
        name: '💊 Adicto a los Power-Ups',
        description: 'Recolecta 50 power-ups',
        category: 'collection',
        rarity: 'rare',
        points: 30,
        icon: '💊',
        condition: () => playerStats.powerUpsCollected >= 50,
        unlocked: false
    },
    {
        id: 'xiao_fan',
        name: '🍃 Fan de Xiao',
        description: 'Recolecta 10 power-ups de Xiao',
        category: 'collection',
        rarity: 'rare',
        points: 25,
        icon: '🍃',
        condition: () => playerStats.xiaosCollected >= 10,
        unlocked: false
    },
    {
        id: 'arlee_enthusiast',
        name: '🏹 Entusiasta de Arlee',
        description: 'Recolecta 10 power-ups de Arlee',
        category: 'collection',
        rarity: 'rare',
        points: 25,
        icon: '🏹',
        condition: () => playerStats.arleesCollected >= 10,
        unlocked: false
    },
    {
        id: 'cyno_devotee',
        name: '⚡ Devoto de Cyno',
        description: 'Recolecta 10 power-ups de Cyno',
        category: 'collection',
        rarity: 'rare',
        points: 25,
        icon: '⚡',
        condition: () => playerStats.cynosCollected >= 10,
        unlocked: false
    },
    {
        id: 'flins_fortune',
        name: '💰 Fortuna de Flins',
        description: 'Recolecta 5 power-ups de Flins para duplicar puntos',
        category: 'collection',
        rarity: 'epic',
        points: 40,
        icon: '💰',
        condition: () => playerStats.flinsCollected >= 5,
        unlocked: false
    },
    {
        id: 'genshin_collector',
        name: '🌸 Coleccionista de Genshin',
        description: 'Recolecta al menos 3 de cada power-up especial',
        category: 'collection',
        rarity: 'epic',
        points: 75,
        icon: '🌸',
        condition: () => playerStats.xiaosCollected >= 3 && playerStats.arleesCollected >= 3 && playerStats.cynosCollected >= 3 && playerStats.flinsCollected >= 3,
        unlocked: false
    },
    {
        id: 'medic',
        name: '🏥 Médico Espacial',
        description: 'Recolecta 25 kits de salud',
        category: 'collection',
        rarity: 'common',
        points: 20,
        icon: '🏥',
        condition: () => playerStats.kitsCollected >= 25,
        unlocked: false
    },

    // MAESTRÍA 👑
    {
        id: 'first_points',
        name: '🎯 Primeros Puntos',
        description: 'Acumula 1,000 puntos totales',
        category: 'mastery',
        rarity: 'common',
        points: 10,
        icon: '🎯',
        condition: () => playerStats.cumulativeScore >= 1000,
        unlocked: false
    },
    {
        id: 'point_collector',
        name: '💰 Coleccionista de Puntos',
        description: 'Acumula 5,000 puntos totales',
        category: 'mastery',
        rarity: 'common',
        points: 20,
        icon: '💰',
        condition: () => playerStats.cumulativeScore >= 5000,
        unlocked: false
    },
    {
        id: 'high_scorer',
        name: '📊 Puntuador Alto',
        description: 'Acumula 10,000 puntos totales',
        category: 'mastery',
        rarity: 'rare',
        points: 40,
        icon: '📊',
        condition: () => playerStats.cumulativeScore >= 10000,
        unlocked: false
    },
    {
        id: 'score_enthusiast',
        name: '🎪 Entusiasta de la Puntuación',
        description: 'Acumula 25,000 puntos totales',
        category: 'mastery',
        rarity: 'rare',
        points: 60,
        icon: '🎪',
        condition: () => playerStats.cumulativeScore >= 25000,
        unlocked: false
    },
    {
        id: 'score_master',
        name: '🏆 Maestro de Puntuación',
        description: 'Acumula 50,000 puntos totales',
        category: 'mastery',
        rarity: 'epic',
        points: 100,
        icon: '🏆',
        condition: () => playerStats.cumulativeScore >= 50000,
        unlocked: false
    },
    {
        id: 'score_legend',
        name: '🌟 Leyenda de la Puntuación',
        description: 'Acumula 100,000 puntos totales',
        category: 'mastery',
        rarity: 'legendary',
        points: 200,
        icon: '🌟',
        condition: () => playerStats.cumulativeScore >= 100000,
        unlocked: false
    },
    {
        id: 'score_god',
        name: '⭐ Dios de la Puntuación',
        description: 'Acumula 500,000 puntos totales',
        category: 'mastery',
        rarity: 'mythic',
        points: 500,
        icon: '⭐',
        condition: () => playerStats.cumulativeScore >= 500000,
        unlocked: false
    },
    {
        id: 'score_transcendent',
        name: '🌌 Trascendente de la Puntuación',
        description: 'Acumula 1,000,000 puntos totales',
        category: 'mastery',
        rarity: 'mythic',
        points: 1000,
        icon: '🌌',
        condition: () => playerStats.cumulativeScore >= 1000000,
        unlocked: false
    },
    {
        id: 'veteran',
        name: '🎖️ Veterano',
        description: 'Juega 50 partidas',
        category: 'mastery',
        rarity: 'rare',
        points: 30,
        icon: '🎖️',
        condition: () => playerStats.gamesPlayed >= 50,
        unlocked: false
    },
    {
        id: 'dedicated_player',
        name: '🏅 Jugador Dedicado',
        description: 'Juega 100 partidas',
        category: 'mastery',
        rarity: 'epic',
        points: 60,
        icon: '🏅',
        condition: () => playerStats.gamesPlayed >= 100,
        unlocked: false
    },

    // SECRETOS 🌟
    {
        id: 'ifa_victim',
        name: '🔮 Víctima de Ifa',
        description: 'Sé afectado por el debuff de Ifa',
        category: 'secret',
        rarity: 'rare',
        points: 25,
        icon: '🔮',
        condition: () => playerStats.enemyTypesKilled.ifa >= 1,
        unlocked: false
    },
    {
        id: 'xiao_weapon_hunter',
        name: '🗡️ Cazador de Armas Xiao',
        description: 'Destruye 5 enemigos tipo Xiao Weapon',
        category: 'secret',
        rarity: 'epic',
        points: 50,
        icon: '🗡️',
        condition: () => playerStats.enemyTypesKilled.xiao_weapon >= 5,
        unlocked: false
    },
    {
        id: 'moai_friend',
        name: '🗿 Amigo del Moai',
        description: 'Haz clic en el Moai 10 veces',
        category: 'secret',
        rarity: 'common',
        points: 15,
        icon: '🗿',
        condition: () => parseInt(localStorage.getItem('moaiClicks') || '0') >= 10,
        unlocked: false
    },
    {
        id: 'achievement_hunter',
        name: '🏆 Cazador de Logros',
        description: 'Abre el panel de logros por primera vez',
        category: 'secret',
        rarity: 'common',
        points: 5,
        icon: '🏆',
        condition: () => parseInt(localStorage.getItem('achievementsOpened') || '0') >= 1,
        unlocked: false
    },
    {
        id: 'completionist',
        name: '💯 Completista',
        description: 'Desbloquea el 80% de todos los logros',
        category: 'secret',
        rarity: 'mythic',
        points: 500,
        icon: '💯',
        condition: () => {
            const unlockedCount = achievements.filter(a => a.unlocked).length;
            const totalCount = achievements.length;
            return (unlockedCount / totalCount) >= 0.8;
        },
        unlocked: false
    },
    {
        id: 'legend',
        name: '🌟 Leyenda Viviente',
        description: 'Desbloquea TODOS los logros',
        category: 'secret',
        rarity: 'mythic',
        points: 1000,
        icon: '🌟',
        condition: () => {
            const unlockedCount = achievements.filter(a => a.id !== 'legend' && a.unlocked).length;
            const totalCount = achievements.length - 1; // Excluir este mismo logro
            return unlockedCount === totalCount;
        },
        unlocked: false
    }
];

// Cargar estadísticas y logros desde localStorage
function loadPlayerStats() {
    const savedStats = localStorage.getItem('playerStats');
    if (savedStats) {
        playerStats = { ...playerStats, ...JSON.parse(savedStats) };
    }
    
    const savedAchievements = localStorage.getItem('achievements');
    if (savedAchievements) {
        const saved = JSON.parse(savedAchievements);
        achievements.forEach(achievement => {
            const savedAchievement = saved.find(a => a.id === achievement.id);
            if (savedAchievement) {
                achievement.unlocked = savedAchievement.unlocked;
            }
        });
    }
}

// Guardar estadísticas y logros
function savePlayerStats() {
    localStorage.setItem('playerStats', JSON.stringify(playerStats));
    localStorage.setItem('achievements', JSON.stringify(achievements.map(a => ({ id: a.id, unlocked: a.unlocked }))));
}

// Verificar logros
function checkAchievements() {
    achievements.forEach(achievement => {
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
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function showAchievementNotification(achievement) {
    const notification = document.getElementById('achievementNotification');
    const nameEl = document.getElementById('notificationName');
    const descEl = document.getElementById('notificationDescription');
    const pointsEl = document.getElementById('notificationPoints');
    
    nameEl.textContent = achievement.name;
    descEl.textContent = achievement.description;
    pointsEl.textContent = `+${achievement.points} puntos`;
    
    // Añadir clase específica para móviles
    if (isMobileDevice()) {
        notification.classList.add('mobile-notification');
    } else {
        notification.classList.remove('mobile-notification');
    }
    
    notification.classList.add('show');
    
    // Reproducir sonido de logro (si existe) - volumen más bajo en móviles
    try {
        const achievementSound = new Audio('assets/achievement.mp3');
        achievementSound.volume = isMobileDevice() ? 0.3 : 0.5;
        achievementSound.play().catch(() => {}); // Ignorar errores de audio
    } catch(e) {}
    
    // Tiempo de display más corto en móviles para ser menos intrusivo
    const displayTime = isMobileDevice() ? 3000 : 5000;
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.classList.remove('mobile-notification');
        }, 300); // Limpiar clase después de la animación
    }, displayTime);
}

// Inicializar sistema de logros
function initAchievementSystem() {
    loadPlayerStats();
    
    const achievementsBtn = document.getElementById('achievementsButton');
    const achievementsModal = document.getElementById('achievementsModal');
    const achievementsClose = document.querySelector('.achievements-close');
    
    // Abrir modal de logros
    achievementsBtn.addEventListener('click', () => {
        achievementsModal.style.display = 'block';
        
        // Agregar clase móvil si es necesario
        if (isMobileDevice()) {
            achievementsModal.classList.add('mobile-modal');
        } else {
            achievementsModal.classList.remove('mobile-modal');
        }
        
        renderAchievements();
        updateAchievementStats();
        
        // Logro secreto por abrir el panel
        let achievementsOpened = parseInt(localStorage.getItem('achievementsOpened') || '0');
        achievementsOpened++;
        localStorage.setItem('achievementsOpened', achievementsOpened.toString());
        checkAchievements();
    });
    
    // Cerrar modal
    achievementsClose.addEventListener('click', () => {
        achievementsModal.style.display = 'none';
        achievementsModal.classList.remove('mobile-modal');
    });
    
    // Cerrar con clic fuera del modal
    window.addEventListener('click', (e) => {
        if (e.target === achievementsModal) {
            achievementsModal.style.display = 'none';
            achievementsModal.classList.remove('mobile-modal');
        }
    });
    
    // Tabs de categorías
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAchievements(btn.dataset.category);
        });
    });
    
    // Tracking de clics en Moai para logro secreto
    const moaiBtn = document.getElementById('moaiButton');
    moaiBtn.addEventListener('click', () => {
        let moaiClicks = parseInt(localStorage.getItem('moaiClicks') || '0');
        moaiClicks++;
        localStorage.setItem('moaiClicks', moaiClicks.toString());
        checkAchievements();
    });
}

// Renderizar logros
function renderAchievements(category = 'all') {
    const achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = '';
    
    const filteredAchievements = category === 'all' 
        ? achievements 
        : achievements.filter(a => a.category === category);
    
    filteredAchievements.forEach(achievement => {
        const achievementEl = document.createElement('div');
        achievementEl.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        
        const progress = getAchievementProgress(achievement);
        
        achievementEl.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
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
    if (achievement.unlocked) return '✅ Desbloqueado';
    
    // Progreso específico para cada logro
    switch(achievement.id) {
        case 'first_blood':
            return `${Math.min(playerStats.totalKills, 1)}/1 enemigos`;
        case 'newbie_killer':
            return `${Math.min(playerStats.totalKills, 5)}/5 enemigos`;
        case 'trigger_happy':
            return `${Math.min(playerStats.totalShots, 25)}/25 disparos`;
        case 'marksman':
            return `${Math.min(playerStats.totalShots, 100)}/100 disparos`;
        case 'slayer':
            return `${Math.min(playerStats.totalKills, 50)}/50 enemigos`;
        case 'genocide':
            return `${Math.min(playerStats.totalKills, 500)}/500 enemigos`;
        case 'killing_spree':
            return `${Math.min(playerStats.maxConsecutiveKills, 10)}/10 consecutivos`;
        case 'unstoppable':
            return `${Math.min(playerStats.maxConsecutiveKills, 25)}/25 consecutivos`;
        case 'boss_slayer':
            return `${Math.min(playerStats.bossesKilled, 1)}/1 boss`;
        case 'boss_destroyer':
            return `${Math.min(playerStats.bossesKilled, 5)}/5 bosses`;
        case 'meteor_master':
            return `${Math.min(playerStats.meteorsDestroyed, 20)}/20 meteoritos`;
        case 'survivor':
            return `${Math.floor(Math.min(playerStats.totalGameTime, 300000) / 60000)}/5 minutos`;
        case 'level_master':
            return `${Math.min(playerStats.maxLevel, 20)}/20 nivel`;
        case 'level_god':
            return `${Math.min(playerStats.maxLevel, 50)}/50 nivel`;
        case 'heart_collector':
            return `${Math.min(playerStats.maxHearts, 6)}/6 corazones`;
        case 'powerup_addict':
            return `${Math.min(playerStats.powerUpsCollected, 50)}/50 power-ups`;
        case 'first_points':
            return `${Math.min(playerStats.cumulativeScore, 1000).toLocaleString()}/1,000 puntos`;
        case 'point_collector':
            return `${Math.min(playerStats.cumulativeScore, 5000).toLocaleString()}/5,000 puntos`;
        case 'high_scorer':
            return `${Math.min(playerStats.cumulativeScore, 10000).toLocaleString()}/10,000 puntos`;
        case 'score_enthusiast':
            return `${Math.min(playerStats.cumulativeScore, 25000).toLocaleString()}/25,000 puntos`;
        case 'score_master':
            return `${Math.min(playerStats.cumulativeScore, 50000).toLocaleString()}/50,000 puntos`;
        case 'score_legend':
            return `${Math.min(playerStats.cumulativeScore, 100000).toLocaleString()}/100,000 puntos`;
        case 'score_god':
            return `${Math.min(playerStats.cumulativeScore, 500000).toLocaleString()}/500,000 puntos`;
        case 'score_transcendent':
            return `${Math.min(playerStats.cumulativeScore, 1000000).toLocaleString()}/1,000,000 puntos`;
        case 'veteran':
            return `${Math.min(playerStats.gamesPlayed, 50)}/50 partidas`;
        case 'dedicated_player':
            return `${Math.min(playerStats.gamesPlayed, 100)}/100 partidas`;
        case 'moai_friend':
            return `${Math.min(parseInt(localStorage.getItem('moaiClicks') || '0'), 10)}/10 clics`;
        default:
            return 'En progreso...';
    }
}

// Actualizar estadísticas de logros
function updateAchievementStats() {
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
    const completionPercent = Math.round((unlockedCount / totalCount) * 100);
    
    document.getElementById('totalAchievements').textContent = `${unlockedCount}/${totalCount}`;
    document.getElementById('achievementPoints').textContent = totalPoints;
    document.getElementById('completionPercent').textContent = `${completionPercent}%`;
}

// Funciones para actualizar estadísticas durante el juego
function updateStatsOnKill(enemyType) {
    playerStats.totalKills++;
    playerStats.consecutiveKills++;
    playerStats.maxConsecutiveKills = Math.max(playerStats.maxConsecutiveKills, playerStats.consecutiveKills);
    
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
    
    switch(type) {
        case 'xiao': playerStats.xiaosCollected++; break;
        case 'arlee': playerStats.arleesCollected++; break;
        case 'cyno': playerStats.cynosCollected++; break;
        case 'kit': playerStats.kitsCollected++; break;
        case 'flins': playerStats.flinsCollected++; break;
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
document.addEventListener('DOMContentLoaded', () => {
    initAchievementSystem();
});
