const TERRAIN_WIDTH = 100;
const TERRAIN_HEIGHT = 50;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 550;
const GRAVITY = 0.5;
const COLUMN_WIDTH = CANVAS_WIDTH / TERRAIN_WIDTH;
const COLUMN_HEIGHT = CANVAS_HEIGHT / TERRAIN_HEIGHT;

const NUM_CLOUDS = 5;
const CLOUD_MIN_PARTS = 3;
const CLOUD_MAX_PARTS = 6;
const CLOUD_MIN_WIDTH = 40;
const CLOUD_MAX_WIDTH = 70;
const CLOUD_MIN_HEIGHT = 20;
const CLOUD_MAX_HEIGHT = 40;

const DAY_DURATION = 10000;
let timePassed = 0;

let seed = 0;
let showClouds = false;
let showSky = false;
let changeLevel = false;

let character = {
  x: 39,
  y: 0,
  isJumping: false,
  jumpHeight: 5,
  jumpCounter: 0,
  velocityY: 0,
  velocityX: 0,
};

document
  .getElementById("toggleLevel")
  .addEventListener("change", function (event) {
    changeLevel = event.target.checked;
  });

document
  .getElementById("toggleClouds")
  .addEventListener("change", function (event) {
    showClouds = event.target.checked;
  });

document
  .getElementById("toggleSky")
  .addEventListener("change", function (event) {
    showSky = event.target.checked;
  });

document.addEventListener("keydown", function (event) {
  switch (event.keyCode) {
    case 37:
      character.velocityX = -1;
      break;
    case 39:
      character.velocityX = 1;
      break;
    case 32:
      jumpCharacter();
      break;
  }
});

function moveCharacter(direction) {
  character.velocityX = direction;
  character.x = Math.min(Math.max(character.x, 0), TERRAIN_WIDTH - 1);
  renderTerrainOnCanvas(terrain);
}

function jumpCharacter() {
  if (!character.isJumping) {
    character.isJumping = true;
    character.velocityY = character.jumpHeight;
  }
}

function updateCharacterY() {
  character.y += character.velocityY;
  character.velocityY -= GRAVITY;
  if (character.y < terrain[character.x]) {
    character.y = terrain[character.x];
    character.velocityY = 0;
    character.isJumping = false;
  } else if (character.y > terrain[character.x] && !character.isJumping) {
    character.y = terrain[character.x];
  }
}

function seededRandom() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function randomBetween(min, max) {
  return seededRandom() * (max - min) + min;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

let terrain = [];
function generateTerrain() {
  terrain = new Array(TERRAIN_WIDTH).fill(0);
  let leftHeight = randomBetween(0, TERRAIN_HEIGHT);
  let rightHeight = randomBetween(0, TERRAIN_HEIGHT);

  for (let i = 0; i < TERRAIN_WIDTH; i++) {
    terrain[i] = Math.round(lerp(leftHeight, rightHeight, i / TERRAIN_WIDTH));
    if (i % 10 === 9) {
      leftHeight = rightHeight;
      rightHeight = randomBetween(0, TERRAIN_HEIGHT);
    }
  }

  let smoothFactor = 3;
  for (let i = 0; i < TERRAIN_WIDTH; i++) {
    let smoothedHeight = 0;
    let count = 0;
    for (let j = -smoothFactor; j <= smoothFactor; j++) {
      if (i + j >= 0 && i + j < TERRAIN_WIDTH) {
        smoothedHeight += terrain[i + j];
        count++;
      }
    }
    terrain[i] = Math.round(smoothedHeight / count);
  }

  return terrain;
}

function getSkyColor(timePassed) {
  const progression = timePassed / DAY_DURATION;
  const colors = [
    { r: 135, g: 206, b: 235 },
    { r: 25, g: 25, b: 112 },
  ];
  const r = lerp(colors[0].r, colors[1].r, progression);
  const g = lerp(colors[0].g, colors[1].g, progression);
  const b = lerp(colors[0].b, colors[1].b, progression);
  return `rgb(${r},${g},${b})`;
}

let clouds = [];

function generateClouds() {
  clouds = [];
  for (let i = 0; i < NUM_CLOUDS; i++) {
    const numOfParts = Math.floor(
      randomBetween(CLOUD_MIN_PARTS, CLOUD_MAX_PARTS)
    );
    let parts = [];

    for (let j = 0; j < numOfParts; j++) {
      parts.push({
        x: randomBetween(-CANVAS_WIDTH / 2, CANVAS_WIDTH * 1.5),
        y: randomBetween(0, CANVAS_HEIGHT / 3),
        width: randomBetween(CLOUD_MIN_WIDTH, CLOUD_MAX_WIDTH),
        height: randomBetween(CLOUD_MIN_HEIGHT, CLOUD_MAX_HEIGHT),
      });
    }
    clouds.push(parts);
  }
}

function renderCloudsOnCanvas(ctx) {
  ctx.fillStyle = "rgba(134, 163, 222, 0.8)";
  clouds.forEach((cloudParts) => {
    cloudParts.forEach((part) => {
      ctx.beginPath();
      ctx.ellipse(part.x, part.y, part.width, part.height, 0, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
}

function updateClouds() {
  clouds.forEach((cloudParts) => {
    cloudParts.forEach((part) => {
      part.x -= 0.5;
      if (part.x + part.width < 0) {
        part.x = CANVAS_WIDTH;
      }
    });
  });
}

function renderTerrainOnCanvas(terrain) {
  const canvas = document.getElementById("terrainCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (showSky) {
    ctx.fillStyle = getSkyColor(timePassed);
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  if (showClouds) {
    renderCloudsOnCanvas(ctx);
  }

  for (let i = 0; i < terrain.length; i++) {
    let height = COLUMN_HEIGHT * terrain[i];
    ctx.fillStyle = "#228B22";
    ctx.fillRect(
      i * COLUMN_WIDTH,
      CANVAS_HEIGHT - height,
      COLUMN_WIDTH,
      height
    );
  }

  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(
    character.x * COLUMN_WIDTH + COLUMN_WIDTH / 2,
    CANVAS_HEIGHT - character.y * COLUMN_HEIGHT - 10,
    10,
    0,
    2 * Math.PI
  );
  ctx.fill();
}

function regenerateTerrain() {
  seed = document.getElementById("seedInput").value;
  generateTerrain();
  generateClouds();
}

let timePasseDirection = 16;
function gameLoop() {
  if (timePassed > DAY_DURATION || timePassed < 0) {
    timePasseDirection = timePasseDirection * -1;
  }
  timePassed += timePasseDirection;

  let nextX = character.x + character.velocityX;
  nextX = Math.min(Math.max(nextX, 0), TERRAIN_WIDTH - 1);
  let heightDifference = terrain[nextX] - terrain[character.x];

  if (heightDifference <= character.jumpHeight || character.velocityY > 0) {
    character.x = nextX;
  } else if (heightDifference > character.jumpHeight) {
  }

  if (character.x >= TERRAIN_WIDTH - 1) {
    seed = Math.floor(Math.random() * 10000);
    if (changeLevel) {
      document.getElementById("seedInput").value = seed;
      regenerateTerrain();
    }
    character.x = 0;
  }

  character.y += character.velocityY;
  character.velocityY -= GRAVITY;

  if (character.y < terrain[character.x]) {
    character.y = terrain[character.x];
    character.velocityY = 0;
    character.isJumping = false;
    character.velocityX = 0;
  } else if (character.y > terrain[character.x] && !character.isJumping) {
    character.y = terrain[character.x];
  }

  updateClouds();
  renderTerrainOnCanvas(terrain);
  requestAnimationFrame(gameLoop);
}

regenerateTerrain();
gameLoop();
