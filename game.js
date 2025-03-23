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
heartsDisplay.style.top = "50px"; // Cambiado para evitar superposición
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

let bullets = [];
let enemies = [];
let kits = [];
let score = 0;
let level = 1;
let gameRunning = false;
let playerName = "";
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

const shootSound = new Audio("assets/shoot.wav");

function shoot() {
    if (player.canShoot) {
        bullets.push({ x: player.x + 20, y: player.y, speed: 10 });
        shootSound.play();
        player.canShoot = false;
        setTimeout(() => {
            player.canShoot = true;
        }, 500); // Cadencia de disparo de 500ms
    }
}

function spawnEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: Math.random() * 2 + 1,
        health: level >= 10 && Math.random() > 0.8 ? 3 : 1, // Enemigo 2 tiene más vida y aparece menos
        image: new Image(),
    };
    enemy.image.src = enemy.health > 1 ? "assets/enemy2.png" : "assets/enemy1.png";
    enemies.push(enemy);
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
                    enemies.splice(j, 1);
                    score += 10; // Aquí es donde se suman los 10 puntos
                    scoreDisplay.textContent = score;
                    
                    const explosionSound = new Audio("assets/explosion.wav");
                    explosionSound.play();
                    
                    // Incrementar nivel cada 100 puntos
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
            player.hearts--;
            updateHeartsDisplay();
            if (player.hearts <= 0) {
                gameRunning = false;
                gameOver();
            } else {
                // Efecto de pérdida de vida
                heartsDisplay.classList.add("pulse");
                setTimeout(() => {
                    heartsDisplay.classList.remove("pulse");
                }, 1000);
            }
        }
    });

    kits.forEach((kit, i) => {
        kit.y += kit.speed;
        ctx.drawImage(kit.image, kit.x, kit.y, kit.width, kit.height);
        if (kit.y > canvas.height) kits.splice(i, 1);

        // Colisión con el jugador
        if (kit.x < player.x + player.width &&
            kit.x + kit.width > player.x &&
            kit.y < player.y + player.height &&
            kit.y + kit.height > player.y) {
            kits.splice(i, 1);
            if (player.hearts < 3) {
                player.hearts++;
                updateHeartsDisplay();
            }
        }
    });

    if (gameRunning) requestAnimationFrame(updateGame);
}

function updateHeartsDisplay() {
    heartsDisplay.innerHTML = "";
    for (let i = 0; i < player.hearts; i++) {
        const heart = document.createElement("img");
        heart.src = "assets/heart.png";
        heart.style.width = "20px";
        heart.style.margin = "0 5px";
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
    scores = scores.slice(0, 10); // Mantener solo los mejores 10 puntajes
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
    player.hearts = 3;
    levelDisplay.textContent = `Nivel: ${level}`;
    scoreDisplay.textContent = score;
    updateHeartsDisplay();
    enemies = [];
    bullets = [];
    kits = [];
    gameRunning = true;
    gameOverDisplay.style.display = "none";
    canvas.style.filter = "none";
    spawnEnemies();
    updateGame();
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
    }, 2000);
}

const bgMusic = new Audio("assets/background.mp3");
bgMusic.loop = true;
bgMusic.play();

// Controles táctiles para dispositivos móviles
canvas.addEventListener("touchstart", handleTouchStart, false);
canvas.addEventListener("touchmove", handleTouchMove, false);
canvas.addEventListener("touchend", handleTouchEnd, false);

let touchX, touchY;

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

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");
const shootButton = document.getElementById("shootButton");

leftButton.addEventListener("touchstart", (e) => { e.preventDefault(); player.movingLeft = true; });
leftButton.addEventListener("touchend", (e) => { e.preventDefault(); player.movingLeft = false; });
leftButton.addEventListener("touchcancel", (e) => { e.preventDefault(); player.movingLeft = false; });

rightButton.addEventListener("touchstart", (e) => { e.preventDefault(); player.movingRight = true; });
rightButton.addEventListener("touchend", (e) => { e.preventDefault(); player.movingRight = false; });
rightButton.addEventListener("touchcancel", (e) => { e.preventDefault(); player.movingRight = false; });

upButton.addEventListener("touchstart", (e) => { e.preventDefault(); player.movingUp = true; });
upButton.addEventListener("touchend", (e) => { e.preventDefault(); player.movingUp = false; });
upButton.addEventListener("touchcancel", (e) => { e.preventDefault(); player.movingUp = false; });

downButton.addEventListener("touchstart", (e) => { e.preventDefault(); player.movingDown = true; });
downButton.addEventListener("touchend", (e) => { e.preventDefault(); player.movingDown = false; });
downButton.addEventListener("touchcancel", (e) => { e.preventDefault(); player.movingDown = false; });

shootButton.addEventListener("touchstart", (e) => { e.preventDefault(); player.shooting = true; });
shootButton.addEventListener("touchend", (e) => { e.preventDefault(); player.shooting = false; });
shootButton.addEventListener("touchcancel", (e) => { e.preventDefault(); player.shooting = false; });
