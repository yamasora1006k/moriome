/** @format */

document.addEventListener("DOMContentLoaded", () => {
  const gameBoard = document.getElementById("gameBoard");
  const resetButton = document.getElementById("resetGame");
  const difficultySelector = document.getElementById("difficulty");
  const customSettings = document.getElementById("customSettings");
  const customWidthInput = document.getElementById("customWidth");
  const customHeightInput = document.getElementById("customHeight");
  const customMinesInput = document.getElementById("customMines");
  const applyCustomButton = document.getElementById("applyCustomButton");
  const stopwatchElement = document.getElementById("stopwatch");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const congratsMessage = document.getElementById("congratsMessage");
  const congratsButton = document.getElementById("congratsButton");

  let difficulty = "easy";
  let boardSize = { width: 9, height: 9 };
  let mineCount = 10;
  let mines = [];
  let board = [];
  let cellElements = [];
  let firstClick = true;
  let stopwatchInterval;
  let elapsedTime = 0; 
  let particles = [];
  let explosionInProgress = false;
  let flagCount = 0;

  const numberImages = {}; 
  const flagImage = './image/hata.png'; 
  const bombImage = './image/bomb.png'; 

  const updateCanvasSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  applyCustomButton.addEventListener("click", () => {
    difficulty = "custom";
    initializeGame();
  });

  const startStopwatch = () => {
    elapsedTime = 0;
    updateStopwatchDisplay();
    stopwatchInterval = setInterval(() => {
      elapsedTime += 100; 
      updateStopwatchDisplay();
    }, 100);
  };

  const stopStopwatch = () => {
    clearInterval(stopwatchInterval);
  };

  const updateStopwatchDisplay = () => {
    const milliseconds = Math.floor((elapsedTime % 1000) / 100); 
    const seconds = Math.floor(elapsedTime / 1000) % 60;
    const minutes = Math.floor(elapsedTime / (1000 * 60));
    stopwatchElement.textContent = `${padZero(minutes)}:${padZero(
      seconds
    )}.${milliseconds}`;
  };

  const padZero = (num) => num.toString().padStart(2, "0"); 

  const initializeGame = () => {
    gameBoard.innerHTML = "";
    cellElements = [];
    setBoardSize();
    resetBoard();
    createBoard();
    firstClick = true;
    explosionInProgress = false;
    document.getElementById("mineCountDisplay").textContent = mineCount;
    document.getElementById("flagCountDisplay").textContent = flagCount; 
    stopStopwatch();
    assignRandomImages(); // 数字画像をランダムに
    updateCanvasSize();
    congratsMessage.style.display = "none"; 
  };

  const assignRandomImages = () => {
    const imageFiles = ['./image/1.png', './image/2.png', './image/3.png', './image/4.png', './image/5.png', './image/6.png', './image/7.png', './image/8.png'];
    const shuffledImages = imageFiles.sort(() => Math.random() - 0.5);
    for (let i = 1; i <= 8; i++) {
      numberImages[i] = shuffledImages[i - 1];
    }
  };

  const setBoardSize = () => {
    if (difficulty === "custom") {
      const width = parseInt(customWidthInput.value, 10) || 9;
      const height = parseInt(customHeightInput.value, 10) || 9;
      const mines = parseInt(customMinesInput.value, 10) || 10;
      boardSize = { width, height };
      mineCount = Math.min(mines, width * height - 1);
    } else if (difficulty === "easy") {
      boardSize = { width: 9, height: 9 };
      mineCount = 10;
    } else if (difficulty === "normal") {
      boardSize = { width: 16, height: 16 };
      mineCount = 40;
    }
    document.getElementById("mineCountDisplay").textContent = mineCount;
    gameBoard.style.gridTemplateColumns = `repeat(${boardSize.width}, 1fr)`;
    gameBoard.style.width = `${boardSize.width * 40}px`;
    customSettings.style.display = difficulty === "custom" ? "block" : "none";
  };

  const resetBoard = () => {
    mines = [];
    board = Array(boardSize.width * boardSize.height).fill(0);
  };

  const createBoard = () => {
    for (let i = 0; i < boardSize.width * boardSize.height; i++) {
      const cell = document.createElement("div");
      cell.dataset.index = i;
      cell.dataset.opened = "false";
      cellElements.push(cell);
      cell.addEventListener("click", handleCellClick);
      cell.addEventListener("contextmenu", handleCellRightClick);
      gameBoard.appendChild(cell);
    }
  };

  const placeMines = (firstCellIndex) => {
    let minesPlaced = 0;
    const exclude = getSurroundingCells(
      firstCellIndex % boardSize.width,
      Math.floor(firstCellIndex / boardSize.width)
    ).map((cell) => cell.x + cell.y * boardSize.width);
    exclude.push(firstCellIndex); 

    while (minesPlaced < mineCount) {
      const index = Math.floor(Math.random() * board.length);
      if (board[index] !== "M" && !exclude.includes(index)) {
        board[index] = "M";
        mines.push(index);
        minesPlaced++;
      }
    }
  };

  const handleCellClick = (e) => {
    const index = parseInt(e.target.dataset.index, 10);
    if (firstClick) {
      placeMines(index); 
      firstClick = false;
      startStopwatch(); 
    }
    if (board[index] === "M") {
      e.target.classList.add("mine"); 
      showMines();
      createExplosionSequence(index); //爆破アニメーション
      stopStopwatch(); 
    } else {
      openCell(index);
      checkVictory();
    }
  };

  const resetStopwatch = () => {
    elapsedTime = 0; 
    updateStopwatchDisplay(); 
  };

  const handleCellRightClick = (e) => {
    e.preventDefault();
    const cell = e.target;
    if (cell.dataset.opened === "false") {
      if (cell.classList.toggle("flag")) {
        cell.style.backgroundImage = `url(${flagImage})`;
        cell.style.backgroundSize = 'cover';
        flagCount++;
      } else {
        cell.style.backgroundImage = '';
        flagCount--;
      }
      document.getElementById("flagCountDisplay").textContent = flagCount; //旗
    }
  };

  const openCell = (index) => {
    if (cellElements[index].dataset.opened === "true") {
      return;
    }
    cellElements[index].dataset.opened = "true";
    cellElements[index].classList.add("opened"); 

    const surroundingMines = getSurroundingMineCount(index);
    if (surroundingMines === 0) {
      const x = index % boardSize.width;
      const y = Math.floor(index / boardSize.width);
      setTimeout(() => {
        getSurroundingCells(x, y).forEach((n) => {
          openCell(n.x + n.y * boardSize.width);
        });
      }, 10);
    } else {
      const img = document.createElement("img");
      img.src = numberImages[surroundingMines];
      img.style.width = "100%";
      img.style.height = "100%";
      cellElements[index].appendChild(img);
    }
  };

  const getSurroundingCells = (x, y) => {
    const cells = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx,
          ny = y + dy;
        if (
          nx >= 0 &&
          nx < boardSize.width &&
          ny >= 0 &&
          ny < boardSize.height
        ) {
          cells.push({ x: nx, y: ny });
        }
      }
    }
    return cells;
  };

  const getSurroundingMineCount = (index) => {
    const x = index % boardSize.width;
    const y = Math.floor(index / boardSize.width);
    return getSurroundingCells(x, y).reduce(
      (count, cell) =>
        count + (board[cell.x + cell.y * boardSize.width] === "M" ? 1 : 0),
      0
    );
  };

  const showMines = () => {
    mines.forEach((index) => {
      if (!cellElements[index].classList.contains("opened")) {
        cellElements[index].classList.add("mine"); 
      }
      const img = document.createElement("img");
      img.src = bombImage;
      img.style.width = "100%";
      img.style.height = "100%";
      cellElements[index].appendChild(img);
    });
  };

  const checkVictory = () => {
    const openedCells = cellElements.filter(
      (cell) => cell.dataset.opened === "true"
    ).length;
    const nonMineCells = boardSize.width * boardSize.height - mineCount;
    if (openedCells === nonMineCells) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      showMines();
      stopStopwatch(); // タイマーを停止
      congratsMessage.style.display = "block";
    }
  };

  resetButton.addEventListener("click", () => {
    location.reload(); 
  });

  congratsButton.addEventListener("click", () => {
    location.reload();
  });

  difficultySelector.addEventListener("change", (e) => {
    difficulty = e.target.value;
    initializeGame();
  });

  initializeGame();

 //爆発アニメーション
  const config = {
    particleNumber: 800,
    maxParticleSize: 10,
    maxSpeed: 40,
    colorVariation: 50
  };

  const colorPalette = {
    bg: { r: 12, g: 9, b: 29, a: 0 }, 
    matter: [
      { r: 36, g: 18, b: 42 }, 
      { r: 78, g: 36, b: 42 }, 
      { r: 252, g: 178, b: 96 },
      { r: 253, g: 238, b: 152 } 
    ]
  };

  const drawBg = (ctx, color) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const Particle = function (x, y) {
    this.x = x || Math.round(Math.random() * canvas.width);
    this.y = y || Math.round(Math.random() * canvas.height);
    this.r = Math.ceil(Math.random() * config.maxParticleSize);
    this.c = colorVariation(colorPalette.matter[Math.floor(Math.random() * colorPalette.matter.length)], true);
    this.s = Math.pow(Math.ceil(Math.random() * config.maxSpeed), .7);
    this.d = Math.round(Math.random() * 360);
  };

  const colorVariation = (color, returnString) => {
    const r = Math.round(((Math.random() * config.colorVariation) - (config.colorVariation / 2)) + color.r);
    const g = Math.round(((Math.random() * config.colorVariation) - (config.colorVariation / 2)) + color.g);
    const b = Math.round(((Math.random() * config.colorVariation) - (config.colorVariation / 2)) + color.b);
    const a = Math.random() + .5;
    if (returnString) {
      return `rgba(${r},${g},${b},${a})`;
    } else {
      return { r, g, b, a };
    }
  };

  const updateParticleModel = (p) => {
    const a = 180 - (p.d + 90);
    p.d > 0 && p.d < 180 ? p.x += p.s * Math.sin(p.d) / Math.sin(p.s) : p.x -= p.s * Math.sin(p.d) / Math.sin(p.s);
    p.d > 90 && p.d < 270 ? p.y += p.s * Math.sin(a) / Math.sin(p.s) : p.y -= p.s * Math.sin(a) / Math.sin(p.s);
    return p;
  };

  const drawParticle = (x, y, r, c) => {
    ctx.beginPath();
    ctx.fillStyle = c;
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
  };

  const cleanUpArray = () => {
    particles = particles.filter((p) => {
      return (p.x > -100 && p.y > -100);
    });
  };

  const initParticles = (numParticles, x, y) => {
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle(x, y));
    }
    particles.forEach((p) => {
      drawParticle(p.x, p.y, p.r, p.c);
    });
  };

  window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  const frame = () => {
    drawBg(ctx, colorPalette.bg);
    particles.map((p) => {
      return updateParticleModel(p);
    });
    particles.forEach((p) => {
      drawParticle(p.x, p.y, p.r, p.c);
    });
    window.requestAnimFrame(frame);
  };

  const createExplosion = (x, y) => {
    cleanUpArray();
    initParticles(config.particleNumber, x, y);
  };

  const createExplosionSequence = (index) => {
    explosionInProgress = true;

    const rect = cellElements[index].getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const explosionLocations = [
      { x: x, y: y },
      { x: x - 100, y: y - 100 },
      { x: x + 100, y: y + 100 },
      { x: x - 100, y: y + 100 },
      { x: x + 100, y: y - 100 }
    ];

    explosionLocations.forEach((loc, index) => {
      setTimeout(() => {
        createExplosion(loc.x, loc.y);
        if (index === explosionLocations.length - 1) {
          setTimeout(() => {
            explosionInProgress = false;
            const userConfirmed = confirm("Game Over!");
            if (userConfirmed) {
              location.reload(); 
            }
          }, 2500); 
        }
      }, index * 100);
    });
  };

  frame();
});
