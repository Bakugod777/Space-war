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
});

// Variables del jugador
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 10, // Aumentar la velocidad del jugador
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
let hasFireRateBoost = false; // Control del power-up activo
let normalFireRate = 500; // Cadencia normal de disparo (500ms)
let boostedFireRate = 150; // Cadencia mejorada de disparo (150ms)
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
const powerUpTimerDisplay = document.getElementById('powerUpTimer');
const timerSpan = document.getElementById('timer');

// Añade estas variables globales
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let maxJoystickDistance = 50;

// Añadir después de las variables globales
const shootButton = document.getElementById("shootButton");

// Añadir los event listeners del botón de disparo
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

// Modifica la función shoot para usar la cadencia mejorada
function shoot() {
    if (player.canShoot) {
        bullets.push({ x: player.x + 20, y: player.y, speed: 10 });
        shootSound.play();
        player.canShoot = false;
        setTimeout(() => {
            player.canShoot = true;
        }, hasFireRateBoost ? boostedFireRate : normalFireRate);
    }
}

// Modificar la función spawnEnemy para incluir el nuevo tipo de enemigo
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

    enemies.push(enemy);
}

// Añadir función para que el enemigo dispare
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

// Añade la función para crear el kit especial xiao
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

// Añade la función para crear el power-up arlee
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

// Añade la función para crear el power-up cyno
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

// Modificar la función updateGame para incluir las balas enemigas
function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (player.movingLeft && player.x > 0) player.x -= player.speed;
    if (player.movingRight && player.x < canvas.width - player.width) player.x += player.speed;
    if (player.movingUp && player.y > 0) player.y -= player.speed;
    if (player.movingDown && player.y < canvas.height - player.height) player.y += player.speed;
    if (player.shooting) shoot();

    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    
    bullets.forEach((bullet, i) => {
        bullet.y -= bullet.speed;
        ctx.fillStyle = "red";
        ctx.fillRect(bullet.x, bullet.y, 5, 10);
        
        enemies.forEach((enemy, j) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 10 > enemy.y) {
                
                enemy.health--;
                bullets.splice(i, 1);
                
                if (enemy.health <= 0) {
                    // Crear explosión en la posición del enemigo
                    createExplosion(
                        enemy.x + enemy.width/2,
                        enemy.y + enemy.height/2
                    );
                    
                    enemies.splice(j, 1);
                    score += 10;
                    scoreDisplay.textContent = score;
                    
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
                    score += 20; // Más puntos por destruir un meteorito
                    scoreDisplay.textContent = score;
                    
                    const explosionSound = new Audio("assets/explosion.wav");
                    explosionSound.play();
                    
                    createExplosion(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2);
                } else {
                    // Efecto visual de impacto
                    const impactSound = new Audio("assets/impact.wav");
                    impactSound.play();
                }
            }
        });

        if (bullet.y < 0) {
            bullets.splice(i, 1);
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
    player.image.style.filter = "none";
    gameRunning = true;
    gameOverDisplay.style.display = "none";
    canvas.style.filter = "none";
    spawnEnemies();
    updateGame();
    initJoystick();
}

// Modifica la función handlePlayerDamage
function handlePlayerDamage() {
    if (isInvulnerable) return; // Si es invulnerable, no recibe daño
    
    player.hearts--;
    if (player.hearts === maxHearts) {
        hasExtraHeart = false;
    }
    updateHeartsDisplay();

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

// Añade esta nueva función para crear el efecto de daño
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
    
    // Actualizar movimiento del jugador
    const deadzone = 10;
    player.movingLeft = deltaX < -deadzone;
    player.movingRight = deltaX > deadzone;
    player.movingUp = deltaY < -deadzone;
    player.movingDown = deltaY > deadzone;
    
    // Ajustar la velocidad según la distancia
    const speedMultiplier = Math.min(distance / maxJoystickDistance, 1);
    player.speed = 10 * speedMultiplier;
}
