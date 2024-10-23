const canvas = document.getElementById('tetris'); 
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const playButton = document.getElementById('playButton');
const retryButton = document.getElementById('retryButton');
const imageUrlInput = document.getElementById('imageUrl');
const addImageButton = document.getElementById('addImage');

const ROWS = 20; 
const COLS = 10;
const BLOCK_SIZE = 30;

let grid, images, currentPiece, currentPos, dropInterval, lastDropTime;
let gameActive = false; // Track if the game is active

const shapes = [
    [[1, 0], [0, 0], [0, 1], [1, 1]], // Square
    [[0, 1], [1, 1], [2, 1], [1, 0]], // T
    [[0, 0], [1, 0], [2, 0], [2, 1]], // L
    [[0, 1], [1, 1], [2, 1], [2, 0]], // J
    [[0, 0], [1, 0], [1, 1], [2, 1]], // Z
    [[0, 1], [1, 1], [1, 0], [2, 0]], // S
    [[0, 1], [1, 1], [2, 1], [1, 2]], // T
    [[0, 0], [1, 0], [2, 0], [3, 0]], // Line (4 blocks long)
];

const colors = [
    null,        // No color for index 0
    'yellow',    // Square
    'purple',    // T
    'blue',      // L
    'orange',    // J
    'green',     // Z
    'red',       // S
    'cyan',      // T
    'magenta',   // Line (4 blocks long)
];

function initGame() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    images = [];
    currentPiece = null;
    currentPos = { x: 4, y: 0 };
    dropInterval = 1000;
    lastDropTime = 0;
    overlay.style.display = 'none'; 
    gameActive = true; // Game starts
    spawnPiece();
    startGameLoop();
}

function addImage() {
    const url = imageUrlInput.value.trim();
    if (url) {
        const img = new Image();
        img.src = url;
        images.push(img);
        imageUrlInput.value = '';
    }
}

addImageButton.addEventListener('click', addImage);

function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] !== null) {
                if (images[grid[r][c] - 1]) {
                    ctx.drawImage(images[grid[r][c] - 1], c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                } else {
                    ctx.fillStyle = colors[grid[r][c]];
                    ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2; // Outline thickness
                    ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }
}

function drawPiece() {
    if (!currentPiece) return;
    currentPiece.shape.forEach(([x, y]) => {
        const drawX = (currentPos.x + x) * BLOCK_SIZE;
        const drawY = (currentPos.y + y) * BLOCK_SIZE;

        if (images[currentPiece.imageIndex]) {
            ctx.drawImage(images[currentPiece.imageIndex], drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
        } else {
            ctx.fillStyle = currentPiece.color; // Use assigned color
            ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2; // Outline thickness
            ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
        }
    });
}

function drawBorder() {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5; // Border thickness for the game window
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function rotate(piece) {
    const rotatedShape = piece.shape.map(([x, y]) => [-y, x]);
    return { ...piece, shape: rotatedShape };
}

function isValidPosition(piece, offsetX, offsetY) {
    return piece.shape.every(([x, y]) => {
        const newX = currentPos.x + x + offsetX;
        const newY = currentPos.y + y + offsetY;

        if (newX < 0 || newX >= COLS) return false; 
        if (newY >= ROWS) return false; 

        return newY < 0 || (newY < ROWS && (grid[newY] === undefined || grid[newY][newX] === null));
    });
}

function placePiece() {
    currentPiece.shape.forEach(([x, y]) => {
        const newX = currentPos.x + x;
        const newY = currentPos.y + y;

        if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
            // Use the assigned color of the piece
            grid[newY][newX] = currentPiece.colorIndex;
        }
    });
}

function clearLines() {
    let linesToClear;

    do {
        linesToClear = [];

        for (let r = 0; r < ROWS; r++) {
            if (grid[r].every(cell => cell !== null)) {
                linesToClear.push(r);
            }
        }

        linesToClear.forEach(line => {
            grid.splice(line, 1);
            grid.unshift(Array(COLS).fill(null));
        });

    } while (linesToClear.length > 0);
}

function spawnPiece() {
    const randomIndex = Math.floor(Math.random() * shapes.length);
    const imageIndex = images.length > 0 ? Math.floor(Math.random() * images.length) : null;
    const colorIndex = randomIndex + 1; // Assign a color based on shape index

    currentPiece = { shape: shapes[randomIndex], imageIndex: imageIndex, color: colors[colorIndex], colorIndex: colorIndex };
    currentPos = { x: 4, y: 0 };

    if (!isValidPosition(currentPiece, 0, 0)) {
        gameOver();
    }
}

function startGameLoop() {
    if (!gameActive) return; // Stop the loop if the game is not active

    const now = Date.now();
    const deltaTime = now - lastDropTime;

    if (deltaTime > dropInterval) {
        if (isValidPosition(currentPiece, 0, 1)) {
            currentPos.y += 1; // Move down if valid
        } else {
            placePiece(); // Place piece in grid if no longer valid
            clearLines(); // Clear completed lines
            spawnPiece(); // Spawn a new piece
        }
        lastDropTime = now; // Update last drop time
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPiece();
    drawBorder(); // Draw the border around the game window

    requestAnimationFrame(startGameLoop);
}

function gameOver() {
    gameActive = false; // Stop spawning new pieces
    overlay.style.display = 'flex';
    retryButton.style.display = 'block';
    playButton.style.display = 'none';
}

document.addEventListener('keydown', (e) => {
    if (!currentPiece) return;

    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
            if (isValidPosition(currentPiece, -1, 0)) {
                currentPos.x -= 1;
            }
            break;
        case 'ArrowRight':
        case 'd':
            if (isValidPosition(currentPiece, 1, 0)) {
                currentPos.x += 1;
            }
            break;
        case 'ArrowDown':
        case 's':
            if (isValidPosition(currentPiece, 0, 1)) {
                currentPos.y += 1;
            }
            break;
        case 'q':
        case 'e':
            const rotatedPiece = rotate(currentPiece);
            if (isValidPosition(rotatedPiece, 0, 0)) {
                currentPiece = rotatedPiece;
            }
            break;
    }
});

playButton.addEventListener('click', initGame);

retryButton.addEventListener('click', () => {
    overlay.style.display = 'none';
    retryButton.style.display = 'none';
    initGame();
});
