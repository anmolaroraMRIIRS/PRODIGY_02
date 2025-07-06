// Game State
let gameState = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    isGameOver: false,
    isDraw: false,
    gameMode: 'pvp', // 'pvp' or 'ai'
    aiDifficulty: 'medium',
    scores: { X: 0, O: 0, draws: 0 },
    gameHistory: [],
    soundEnabled: true,
    currentTheme: 'classic',
    animationSpeed: 1
};

// Winning combinations
const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// DOM Elements
const gameBoard = document.getElementById('gameBoard');
const statusText = document.getElementById('statusText');
const gameStatus = document.getElementById('gameStatus');
const newGameBtn = document.getElementById('newGameBtn');
const resetScoreBtn = document.getElementById('resetScoreBtn');
const soundBtn = document.getElementById('soundBtn');
const themeBtn = document.getElementById('themeBtn');
const playerX = document.getElementById('playerX');
const playerO = document.getElementById('playerO');
const celebration = document.getElementById('celebration');
const drawMessage = document.getElementById('drawMessage');
const celebrationText = document.getElementById('celebrationText');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreDraw = document.getElementById('scoreDraw');
const gameHistory = document.getElementById('gameHistory');
const historyList = document.getElementById('historyList');
const difficultySelector = document.getElementById('difficultySelector');
const difficultySelect = document.getElementById('difficultySelect');
const settingsModal = document.getElementById('settingsModal');
const closeModal = document.getElementById('closeModal');
const animationSpeedSlider = document.getElementById('animationSpeed');
const boardThemeSelect = document.getElementById('boardTheme');

// Sound Effects (using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    if (!gameState.soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Sound effects
const sounds = {
    move: () => playSound(800, 0.1),
    win: () => {
        playSound(523, 0.2);
        setTimeout(() => playSound(659, 0.2), 100);
        setTimeout(() => playSound(784, 0.3), 200);
    },
    draw: () => playSound(400, 0.5),
    click: () => playSound(1000, 0.05)
};

// Initialize game
function initGame() {
    loadGameState();
    createBoard();
    updateDisplay();
    addEventListeners();
    updateScoreboard();
    updateGameHistory();
    applyTheme();
}

// Create game board
function createBoard() {
    const squares = gameBoard.querySelectorAll('.square');
    squares.forEach((square, index) => {
        square.addEventListener('click', () => handleSquareClick(index));
    });
}

// Handle square click
function handleSquareClick(index) {
    if (gameState.board[index] || gameState.isGameOver) return;

    makeMove(index, gameState.currentPlayer);
    
    // AI move in AI mode
    if (gameState.gameMode === 'ai' && !gameState.isGameOver && gameState.currentPlayer === 'O') {
        setTimeout(() => {
            const aiMove = getAIMove();
            if (aiMove !== -1) {
                makeMove(aiMove, 'O');
            }
        }, 500);
    }
}

// Make a move
function makeMove(index, player) {
    gameState.board[index] = player;
    
    // Update square display
    const square = gameBoard.children[index];
    square.textContent = player;
    square.classList.add(player.toLowerCase());
    square.classList.add('disabled');
    
    // Play sound
    sounds.move();

    // Check for winner
    const winner = checkWinner(gameState.board);
    if (winner) {
        gameState.winner = winner;
        gameState.isGameOver = true;
        gameState.scores[winner]++;
        highlightWinningSquares();
        showCelebration();
        sounds.win();
        addToHistory(`Player ${winner} wins!`);
    } else if (checkDraw(gameState.board)) {
        gameState.isDraw = true;
        gameState.isGameOver = true;
        gameState.scores.draws++;
        showDrawMessage();
        sounds.draw();
        addToHistory("Game ended in a draw");
    } else {
        // Switch player
        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    }

    updateDisplay();
    updateScoreboard();
    saveGameState();
}

// AI Move Logic
function getAIMove() {
    const difficulty = gameState.aiDifficulty;
    const availableMoves = gameState.board
        .map((cell, index) => cell === null ? index : null)
        .filter(val => val !== null);

    if (availableMoves.length === 0) return -1;

    switch (difficulty) {
        case 'easy':
            return getRandomMove(availableMoves);
        case 'medium':
            return Math.random() < 0.7 ? getBestMove() : getRandomMove(availableMoves);
        case 'hard':
            return Math.random() < 0.9 ? getBestMove() : getRandomMove(availableMoves);
        case 'impossible':
            return getBestMove();
        default:
            return getRandomMove(availableMoves);
    }
}

function getRandomMove(availableMoves) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function getBestMove() {
    // Minimax algorithm implementation
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === null) {
            gameState.board[i] = 'O';
            let score = minimax(gameState.board, 0, false);
            gameState.board[i] = null;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    const winner = checkWinner(board);
    
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (checkDraw(board)) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Check for winner
function checkWinner(board) {
    for (const combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Check for draw
function checkDraw(board) {
    return board.every(square => square !== null);
}

// Highlight winning squares
function highlightWinningSquares() {
    for (const combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (gameState.board[a] && 
            gameState.board[a] === gameState.board[b] && 
            gameState.board[a] === gameState.board[c]) {
            
            gameBoard.children[a].classList.add('winning');
            gameBoard.children[b].classList.add('winning');
            gameBoard.children[c].classList.add('winning');
            break;
        }
    }
}

// Show celebration
function showCelebration() {
    const playerName = gameState.gameMode === 'ai' && gameState.winner === 'O' ? 'AI' : `Player ${gameState.winner}`;
    celebrationText.textContent = `Congratulations ${playerName}!`;
    celebration.classList.remove('hidden');
    
    // Add trophy icon to status
    const statusContent = gameStatus.querySelector('.status-content');
    if (!statusContent.querySelector('.trophy-icon')) {
        const trophyIcon = document.createElement('svg');
        trophyIcon.className = 'trophy-icon';
        trophyIcon.setAttribute('viewBox', '0 0 24 24');
        trophyIcon.setAttribute('fill', 'none');
        trophyIcon.setAttribute('stroke', 'currentColor');
        trophyIcon.setAttribute('stroke-width', '2');
        trophyIcon.innerHTML = '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55.47.98.97 1.21C12.04 18.75 13 20.24 13 22"/><path d="M14 14.66V17c0 .55-.47.98-.97 1.21C11.96 18.75 11 20.24 11 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>';
        statusContent.insertBefore(trophyIcon, statusContent.firstChild);
    }
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        celebration.classList.add('hidden');
    }, 3000);
}

// Show draw message
function showDrawMessage() {
    drawMessage.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        drawMessage.classList.add('hidden');
    }, 3000);
}

// Update display
function updateDisplay() {
    // Update status text and styling
    if (gameState.winner) {
        const playerName = gameState.gameMode === 'ai' && gameState.winner === 'O' ? 'AI' : `Player ${gameState.winner}`;
        statusText.textContent = `${playerName} Wins!`;
        gameStatus.className = 'game-status status-winner';
    } else if (gameState.isDraw) {
        statusText.textContent = "It's a Draw!";
        gameStatus.className = 'game-status status-draw';
    } else {
        const playerName = gameState.gameMode === 'ai' && gameState.currentPlayer === 'O' ? 'AI' : `Player ${gameState.currentPlayer}`;
        statusText.textContent = `${playerName}'s Turn`;
        gameStatus.className = `game-status status-${gameState.currentPlayer.toLowerCase()}`;
    }

    // Update player indicators
    updatePlayerIndicators();

    // Disable all squares if game is over
    if (gameState.isGameOver) {
        const squares = gameBoard.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.add('disabled');
        });
    }
}

// Update player indicators
function updatePlayerIndicators() {
    const playerXStatus = playerX.querySelector('.player-status');
    const playerOStatus = playerO.querySelector('.player-status');
    
    if (gameState.isGameOver) {
        playerX.classList.remove('active');
        playerO.classList.remove('active');
        playerXStatus.textContent = 'Game Over';
        playerOStatus.textContent = 'Game Over';
    } else {
        if (gameState.currentPlayer === 'X') {
            playerX.classList.add('active');
            playerO.classList.remove('active');
            playerXStatus.textContent = 'Your Turn';
            playerOStatus.textContent = 'Waiting';
        } else {
            playerO.classList.add('active');
            playerX.classList.remove('active');
            playerXStatus.textContent = 'Waiting';
            playerOStatus.textContent = gameState.gameMode === 'ai' ? 'AI Thinking...' : 'Your Turn';
        }
    }
    
    // Update player labels for AI mode
    const playerOLabel = playerO.querySelector('.player-label');
    playerOLabel.textContent = gameState.gameMode === 'ai' ? 'AI Player' : 'Player O';
}

// Update scoreboard
function updateScoreboard() {
    scoreX.textContent = gameState.scores.X;
    scoreO.textContent = gameState.scores.O;
    scoreDraw.textContent = gameState.scores.draws;
}

// Add to game history
function addToHistory(message) {
    const timestamp = new Date().toLocaleTimeString();
    gameState.gameHistory.unshift(`${timestamp}: ${message}`);
    
    // Keep only last 10 games
    if (gameState.gameHistory.length > 10) {
        gameState.gameHistory = gameState.gameHistory.slice(0, 10);
    }
    
    updateGameHistory();
}

// Update game history display
function updateGameHistory() {
    historyList.innerHTML = '';
    
    if (gameState.gameHistory.length === 0) {
        historyList.innerHTML = '<div class="history-item">No games played yet</div>';
        return;
    }
    
    gameState.gameHistory.forEach(entry => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = entry;
        historyList.appendChild(historyItem);
    });
}

// Reset game
function resetGame() {
    // Reset game state
    gameState.board = Array(9).fill(null);
    gameState.currentPlayer = 'X';
    gameState.winner = null;
    gameState.isGameOver = false;
    gameState.isDraw = false;

    // Clear board display
    const squares = gameBoard.querySelectorAll('.square');
    squares.forEach(square => {
        square.textContent = '';
        square.className = 'square';
    });

    // Hide messages
    celebration.classList.add('hidden');
    drawMessage.classList.add('hidden');

    // Remove trophy icon
    const trophyIcon = gameStatus.querySelector('.trophy-icon');
    if (trophyIcon) {
        trophyIcon.remove();
    }

    // Update display
    updateDisplay();
    saveGameState();
    
    sounds.click();
}

// Reset scores
function resetScores() {
    gameState.scores = { X: 0, O: 0, draws: 0 };
    gameState.gameHistory = [];
    updateScoreboard();
    updateGameHistory();
    saveGameState();
    sounds.click();
}

// Toggle sound
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundBtn.classList.toggle('muted', !gameState.soundEnabled);
    saveGameState();
    sounds.click();
}

// Cycle through themes
function cycleTheme() {
    const themes = ['classic', 'neon', 'minimal', 'dark'];
    const currentIndex = themes.indexOf(gameState.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    gameState.currentTheme = themes[nextIndex];
    
    applyTheme();
    saveGameState();
    sounds.click();
}

// Apply theme
function applyTheme() {
    document.body.setAttribute('data-theme', gameState.currentTheme);
    if (boardThemeSelect) {
        boardThemeSelect.value = gameState.currentTheme;
    }
}

// Game mode selection
function setGameMode(mode) {
    gameState.gameMode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Show/hide difficulty selector
    if (mode === 'ai') {
        difficultySelector.classList.remove('hidden');
    } else {
        difficultySelector.classList.add('hidden');
    }
    
    resetGame();
    sounds.click();
}

// Set AI difficulty
function setAIDifficulty(difficulty) {
    gameState.aiDifficulty = difficulty;
    saveGameState();
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('ticTacToeState', JSON.stringify({
        scores: gameState.scores,
        gameHistory: gameState.gameHistory,
        gameMode: gameState.gameMode,
        aiDifficulty: gameState.aiDifficulty,
        soundEnabled: gameState.soundEnabled,
        currentTheme: gameState.currentTheme,
        animationSpeed: gameState.animationSpeed
    }));
}

// Load game state from localStorage
function loadGameState() {
    const saved = localStorage.getItem('ticTacToeState');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.scores = data.scores || { X: 0, O: 0, draws: 0 };
        gameState.gameHistory = data.gameHistory || [];
        gameState.gameMode = data.gameMode || 'pvp';
        gameState.aiDifficulty = data.aiDifficulty || 'medium';
        gameState.soundEnabled = data.soundEnabled !== false;
        gameState.currentTheme = data.currentTheme || 'classic';
        gameState.animationSpeed = data.animationSpeed || 1;
        
        // Update UI elements
        if (difficultySelect) {
            difficultySelect.value = gameState.aiDifficulty;
        }
        
        if (!gameState.soundEnabled) {
            soundBtn.classList.add('muted');
        }
        
        // Set animation speed
        document.documentElement.style.setProperty('--animation-speed', gameState.animationSpeed);
    }
}

// Add event listeners
function addEventListeners() {
    // Game controls
    newGameBtn.addEventListener('click', resetGame);
    resetScoreBtn.addEventListener('click', resetScores);
    soundBtn.addEventListener('click', toggleSound);
    themeBtn.addEventListener('click', cycleTheme);
    
    // Game mode selection
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => setGameMode(btn.dataset.mode));
    });
    
    // Difficulty selection
    if (difficultySelect) {
        difficultySelect.addEventListener('change', (e) => setAIDifficulty(e.target.value));
    }
    
    // Settings modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    }
    
    // Animation speed
    if (animationSpeedSlider) {
        animationSpeedSlider.addEventListener('input', (e) => {
            gameState.animationSpeed = parseFloat(e.target.value);
            document.documentElement.style.setProperty('--animation-speed', gameState.animationSpeed);
            saveGameState();
        });
        animationSpeedSlider.value = gameState.animationSpeed;
    }
    
    // Board theme
    if (boardThemeSelect) {
        boardThemeSelect.addEventListener('change', (e) => {
            gameState.currentTheme = e.target.value;
            applyTheme();
            saveGameState();
        });
    }
    
    // Click outside celebration to close
    celebration.addEventListener('click', (e) => {
        if (e.target === celebration) {
            celebration.classList.add('hidden');
        }
    });
    
    drawMessage.addEventListener('click', (e) => {
        if (e.target === drawMessage) {
            drawMessage.classList.add('hidden');
        }
    });
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // Set initial game mode
    setGameMode(gameState.gameMode);
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
    }
    
    if (e.key === 's' || e.key === 'S') {
        toggleSound();
    }
    
    if (e.key === 't' || e.key === 'T') {
        cycleTheme();
    }
    
    // Number keys 1-9 for square selection
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
        handleSquareClick(num - 1);
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        celebration.classList.add('hidden');
        drawMessage.classList.add('hidden');
        settingsModal.classList.add('hidden');
    }
});

// Touch support for mobile
let touchStartTime = 0;
gameBoard.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
});

gameBoard.addEventListener('touchend', (e) => {
    const touchDuration = Date.now() - touchStartTime;
    if (touchDuration < 200) { // Quick tap
        e.preventDefault();
    }
});

// Prevent zoom on double tap for mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Performance optimization: Debounce resize events
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Handle resize if needed
    }, 250);
});

// Add smooth transitions for dynamic content
function addSmoothTransitions() {
    const style = document.createElement('style');
    style.textContent = `
        .square {
            transition: all calc(0.2s / var(--animation-speed)) ease;
        }
        .game-status {
            transition: all calc(0.3s / var(--animation-speed)) ease;
        }
        .player-indicator {
            transition: all calc(0.3s / var(--animation-speed)) ease;
        }
        .control-btn {
            transition: all calc(0.3s / var(--animation-speed)) ease;
        }
    `;
    document.head.appendChild(style);
}

// Initialize smooth transitions
document.addEventListener('DOMContentLoaded', addSmoothTransitions);
