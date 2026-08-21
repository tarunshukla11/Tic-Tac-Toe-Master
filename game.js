const cells = Array.from(document.querySelectorAll(".cell"));
const menu = document.getElementById("menu");
const difficultyScreen = document.getElementById("difficultyScreen");
const turnScreen = document.getElementById("turnScreen");
const gameScreen = document.getElementById("gameScreen");
const statusText = document.getElementById("status");
const modeText = document.getElementById("modeText");
const popup = document.getElementById("popup");
const popupText = document.getElementById("popupText");
const popupIcon = document.getElementById("popupIcon");
const popupButtons = document.getElementById("popupButtons");
const xScoreElement = document.getElementById("xScore");
const oScoreElement = document.getElementById("oScore");
const turnTitle = document.getElementById("turnTitle");
const turnSubtitle = document.getElementById("turnSubtitle");
const turnButtons = document.getElementById("turnButtons");
const turnLogo = document.getElementById("turnLogo");
const connectionStatus = document.getElementById("connectionStatus");
const statusDot = document.querySelector(".status-dot");
const statusTextLabel = document.getElementById("statusText");
const playerInfo = document.getElementById("playerInfo");
const player1Name = document.getElementById("player1Name");
const player2Name = document.getElementById("player2Name");
const rematchPopup = document.getElementById("rematchPopup");
const rematchText = document.getElementById("rematchText");

if (cells.length !== 9) {
  throw new Error(`Expected 9 elements with class ".cell", but found ${cells.length}.`);
}

cells.forEach((cell, index) => {
  cell.dataset.index = String(index);
  cell.addEventListener("click", handleClick);
});

const EMPTY = "";
const PLAYER_X = "X";
const PLAYER_O = "O";

const winPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

let board = Array(9).fill(EMPTY);
let currentPlayer = PLAYER_X;
let running = false;
let gameMode = "offline";

let botDifficulty = "easy";
let humanPlayer = PLAYER_X;
let botPlayer = PLAYER_O;
let botTimerId = null;

let playerOneSymbol = PLAYER_X;
let playerTwoSymbol = PLAYER_O;

let peer = null;
let conn = null;
let mySymbol = null;
let isHost = false;
let isOnlineMode = false;
let rematchRequested = false;
let rematchAccepted = false;
let gameStarter = null;
let waitingForRematchResponse = false;
let connectTimeoutId = null;

let xScore = 0;
let oScore = 0;
updateScoreDisplay();

// Public STUN + free TURN relay servers. TURN is required because mobile
// carriers (CGNAT / symmetric NAT) frequently block the direct peer-to-peer
// connection that STUN alone relies on -- without a TURN relay, the
// connection just hangs on "connecting..." forever with no error.
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
};

function showOnlyScreen(screen) {
  [menu, difficultyScreen, turnScreen, gameScreen].forEach(element => {
    element.classList.add("hidden");
  });
  screen.classList.remove("hidden");
}

function cancelBotTimer() {
  if (botTimerId !== null) {
    clearTimeout(botTimerId);
    botTimerId = null;
  }
}

function scheduleBotMove() {
  cancelBotTimer();
  botTimerId = setTimeout(() => {
    botTimerId = null;
    botMove();
  }, 500);
}

function updateConnectionStatus(connected) {
  connectionStatus.classList.remove("hidden");
  if (connected) {
    statusDot.classList.add("connected");
    statusDot.classList.remove("disconnected");
    statusTextLabel.textContent = "Connected";
  } else {
    statusDot.classList.add("disconnected");
    statusDot.classList.remove("connected");
    statusTextLabel.textContent = "Disconnected";
  }
}

function showPlayerInfo() {
  playerInfo.classList.remove("hidden");
  if (isHost) {
    player1Name.textContent = `You`;
    player2Name.textContent = `Opponent`;
  } else {
    player1Name.textContent = `Opponent`;
    player2Name.textContent = `You`;
  }
}

function startOfflineSetup() {
  cancelBotTimer();
  gameMode = "offline";
  // Random who is Player 1 (X goes first always in offline)
  if (Math.random() < 0.5) {
    playerOneSymbol = PLAYER_X;
    playerTwoSymbol = PLAYER_O;
  } else {
    playerOneSymbol = PLAYER_O;
    playerTwoSymbol = PLAYER_X;
  }
  startOfflineMatch();
}

function showDifficulty() {
  cancelBotTimer();
  gameMode = "bot";
  showOnlyScreen(difficultyScreen);
}

// Generate a short 6-character room code (easy to share)
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function startOnline() {
  isOnlineMode = true;

  turnLogo.textContent = "🌐";
  turnTitle.textContent = "Online 1v1";
  turnSubtitle.textContent = "Host or join a game";
  turnButtons.innerHTML = `
    <button class="btn-host" onclick="hostGame()">🏠 Host Game</button>
    <button class="btn-join" onclick="showJoinGame()">🔗 Join Game</button>
    <button class="btn-back" onclick="backToMenu()">← Back</button>
  `;

  showOnlyScreen(turnScreen);
}

function hostGame() {
  const roomCode = generateRoomCode();

  peer = new Peer(roomCode, { config: ICE_SERVERS });

  turnSubtitle.textContent = "Share this code with your friend";
  turnButtons.innerHTML = `
    <div class="room-code-display" id="roomCodeDisplay">${roomCode}</div>
    <button class="btn-copy" onclick="copyPeerId()">📋 Copy Code</button>
    <button class="btn-cancel" onclick="cancelOnline()">❌ Cancel</button>
  `;

  peer.on('open', (id) => {
    console.log('Room code:', id);
    const display = document.getElementById("roomCodeDisplay");
    if (display) display.textContent = id;
  });

  peer.on('connection', (connection) => {
    if (conn) {
      connection.close();
      return;
    }
    conn = connection;
    isHost = true;
    mySymbol = 'X';
    setupPeerConnection();
  });

  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    if (err && err.type === 'unavailable-id') {
      hostGame();
      return;
    }
    showPopup("Connection error! " + (err && err.type ? err.type : ""), "❌");
    cancelOnline();
  });

  peer.on('disconnected', () => {
    console.warn('Peer disconnected from signaling server.');
  });
}

function showJoinGame() {
  turnSubtitle.textContent = "Enter host's 6-character code";
  turnButtons.innerHTML = `
    <div class="room-input-wrap">
      <input type="text" id="joinCodeInput" class="room-input" maxlength="6" placeholder="e.g. K7P2M9" autocomplete="off" autocapitalize="characters" />
      <button class="btn-join" onclick="joinWithCode()">🔗 Join</button>
      <button class="btn-cancel" onclick="cancelOnline()">← Back</button>
    </div>
  `;

  // Focus input after render
  setTimeout(() => {
    const input = document.getElementById("joinCodeInput");
    if (input) {
      input.focus();
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") joinWithCode();
      });
    }
  }, 50);
}

function joinWithCode() {
  const input = document.getElementById("joinCodeInput");
  if (!input) return;

  const cleanId = input.value.trim().toUpperCase();
  if (cleanId.length < 4) {
    showPopup("Enter a valid room code", "⚠️");
    return;
  }

  turnSubtitle.textContent = "Connecting...";
  turnButtons.innerHTML = `<button class="btn-cancel" onclick="cancelOnline()">❌ Cancel</button>`;

  peer = new Peer(undefined, { config: ICE_SERVERS });

  peer.on('open', () => {
    conn = peer.connect(cleanId, { reliable: true });
    isHost = false;
    mySymbol = 'O';

    connectTimeoutId = setTimeout(() => {
      if (!conn || !conn.open) {
        showPopup("Couldn't connect. Check the code, or try Wi-Fi.", "⏱️");
        cancelOnline();
      }
    }, 20000);

    conn.on('open', () => {
      clearTimeout(connectTimeoutId);
      connectTimeoutId = null;
      setupPeerConnection();
    });

    conn.on('error', (err) => {
      clearTimeout(connectTimeoutId);
      connectTimeoutId = null;
      console.error('Connection error:', err);
      showPopup("Failed to connect! Wrong code?", "❌");
      cancelOnline();
    });
  });

  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    showPopup("Connection error!", "❌");
    cancelOnline();
  });
}

function setupPeerConnection() {
  conn.on('data', (data) => {
    handlePeerData(data);
  });

  conn.on('close', () => {
    showPopup("Opponent disconnected!", "❌");
    cancelOnline();
  });

  updateConnectionStatus(true);
  showPlayerInfo();
  startOnlineMatch();
}

function handlePeerData(data) {
  switch (data.type) {
    case 'move':
      const { index, symbol } = data;
      board[index] = symbol;
      cells[index].textContent = symbol;
      cells[index].classList.add(symbol.toLowerCase());
      cells[index].classList.add('animate-pop');

      if (!checkWinner()) {
        currentPlayer = mySymbol;
        statusText.textContent = "Your Turn!";
        statusText.classList.add('your-turn');
      }
      break;

    case 'restart':
      // Legacy / ignore forced mid-game restarts from peer
      break;

    case 'rematchRequest':
      // Opponent only: never show accept UI to the person who requested
      if (!waitingForRematchResponse) {
        showRematchPopup();
      }
      break;

    case 'rematchAccept':
      // Requester receives this — both sides restart
      rematchPopup.classList.add("hidden");
      rematchAccepted = true;
      waitingForRematchResponse = false;
      rematchRequested = false;
      restartGame();
      break;

    case 'rematchDecline':
      rematchPopup.classList.add("hidden");
      waitingForRematchResponse = false;
      rematchRequested = false;
      showPopup("Opponent declined rematch", "😔");
      // Restore online end-game buttons if still connected
      if (isOnlineMode && conn && conn.open) {
        popupButtons.innerHTML = `
          <button class="btn-rematch" onclick="requestRematchOnline()">🔄 Request Rematch</button>
          <button class="btn-secondary" onclick="backToMenu()">Main Menu</button>
        `;
      }
      break;

    case 'gameStarter':
      gameStarter = data.starter;
      currentPlayer = gameStarter;
      if (gameStarter === mySymbol) {
        statusText.textContent = "Your Turn!";
        statusText.classList.add('your-turn');
      } else {
        statusText.textContent = "Opponent's Turn...";
        statusText.classList.remove('your-turn');
      }
      break;
  }
}

function makeOnlineMove(index) {
  if (!conn || !conn.open) return;
  conn.send({ type: 'move', index, symbol: mySymbol });
}

function sendRestart() {
  if (!conn || !conn.open) return;
  conn.send({ type: 'restart' });
}

function requestRematch() {
  if (!conn || !conn.open) return;
  conn.send({ type: 'rematchRequest' });
  waitingForRematchResponse = true;
}

function acceptRematchSend() {
  if (!conn || !conn.open) return;
  conn.send({ type: 'rematchAccept' });
}

function declineRematchSend() {
  if (!conn || !conn.open) return;
  conn.send({ type: 'rematchDecline' });
}

function copyPeerId() {
  const peerId = peer.id;
  navigator.clipboard.writeText(peerId).then(() => {
    alert("Code copied! Share it with your friend.");
  }).catch(() => {
    // Fallback if clipboard API fails
    prompt("Copy this code:", peerId);
  });
}

function cancelOnline() {
  if (connectTimeoutId) {
    clearTimeout(connectTimeoutId);
    connectTimeoutId = null;
  }
  if (peer) {
    peer.destroy();
    peer = null;
  }
  if (conn) {
    conn.close();
    conn = null;
  }
  isOnlineMode = false;
  rematchRequested = false;
  rematchAccepted = false;
  waitingForRematchResponse = false;
  updateConnectionStatus(false);
  playerInfo.classList.add("hidden");
  backToMenu();
}

function startOnlineMatch() {
  modeText.textContent = `🌐 Online - You: ${mySymbol}`;
  showOnlyScreen(gameScreen);

  gameStarter = Math.random() < 0.5 ? PLAYER_X : PLAYER_O;

  if (isHost) {
    conn.send({ type: 'gameStarter', starter: gameStarter });
  }

  restartGame();
}

function showRematchPopup() {
  // Opponent only — show Accept / Decline
  rematchText.textContent = "Opponent wants a rematch!";
  const subtitle = rematchPopup.querySelector(".rematch-subtitle");
  if (subtitle) subtitle.textContent = "Do you accept?";
  const btns = rematchPopup.querySelector(".popup-buttons");
  if (btns) {
    btns.innerHTML = `
      <button class="btn-accept" onclick="acceptRematch()">Accept</button>
      <button class="btn-decline" onclick="declineRematch()">Decline</button>
    `;
  }
  rematchPopup.classList.remove("hidden");
}

function showWaitingRematchPopup() {
  // Requester only — waiting, no Accept button
  rematchText.textContent = "Waiting for opponent...";
  const subtitle = rematchPopup.querySelector(".rematch-subtitle");
  if (subtitle) subtitle.textContent = "They need to accept the rematch";
  const btns = rematchPopup.querySelector(".popup-buttons");
  if (btns) {
    btns.innerHTML = `
      <button class="btn-secondary" onclick="cancelRematchWait()">Cancel</button>
    `;
  }
  rematchPopup.classList.remove("hidden");
}

function cancelRematchWait() {
  rematchPopup.classList.add("hidden");
  waitingForRematchResponse = false;
  rematchRequested = false;
  // Return to the end-game popup so they can request again or leave
  if (isOnlineMode) {
    popup.classList.remove("hidden");
  }
}

function acceptRematch() {
  // Only the opponent (who received the request) should call this
  if (waitingForRematchResponse) return; // safety: requester must not accept

  rematchPopup.classList.add("hidden");
  rematchAccepted = true;
  acceptRematchSend();
  restartGame();
}

function declineRematch() {
  if (waitingForRematchResponse) return; // safety

  rematchPopup.classList.add("hidden");
  rematchRequested = false;
  declineRematchSend();
  backToMenu();
}

function selectBotDifficulty(difficulty) {
  const validDifficulties = ["easy", "medium", "hard"];
  if (!validDifficulties.includes(difficulty)) {
    console.error(`Invalid bot difficulty: ${difficulty}`);
    return;
  }
  gameMode = "bot";
  botDifficulty = difficulty;
  // Random: human is X (goes first) or O (bot goes first)
  if (Math.random() < 0.5) {
    humanPlayer = PLAYER_X;
    botPlayer = PLAYER_O;
  } else {
    humanPlayer = PLAYER_O;
    botPlayer = PLAYER_X;
  }
  startBotMatch();
}

function startOfflineMatch() {
  modeText.textContent = "👥 Offline 1v1";
  playerInfo.classList.add("hidden");
  showOnlyScreen(gameScreen);
  restartGame();
}

function startBotMatch() {
  modeText.textContent = `🤖 vs Bot (${capitalize(botDifficulty)})`;
  playerInfo.classList.add("hidden");
  showOnlyScreen(gameScreen);
  restartGame();
}

function handleClick(event) {
  const index = Number(event.currentTarget.dataset.index);

  if (!running || !Number.isInteger(index) || index < 0 || index >= board.length || board[index] !== EMPTY) {
    return;
  }

  if (isOnlineMode && conn && conn.open) {
    if (currentPlayer !== mySymbol) return;

    makeMove(index, currentPlayer);
    makeOnlineMove(index);

    if (checkWinner()) return;

    currentPlayer = mySymbol === 'X' ? 'O' : 'X';
    statusText.textContent = "Opponent's Turn...";
    statusText.classList.remove('your-turn');
    return;
  }

  if (gameMode === "bot" && currentPlayer !== humanPlayer) {
    return;
  }

  makeMove(index, currentPlayer);

  if (checkWinner()) {
    return;
  }

  if (gameMode === "bot") {
    currentPlayer = botPlayer;
    statusText.textContent = "Bot's Turn...";
    scheduleBotMove();
    return;
  }

  switchOfflinePlayer();
}

function makeMove(index, player) {
  if (!running || board[index] !== EMPTY || (player !== PLAYER_X && player !== PLAYER_O)) {
    return false;
  }

  board[index] = player;
  cells[index].textContent = player;
  cells[index].classList.remove("x", "o");
  cells[index].classList.add(player.toLowerCase());
  cells[index].classList.add('animate-pop');
  vibrateLight();

  return true;
}

function switchOfflinePlayer() {
  currentPlayer = currentPlayer === playerOneSymbol ? playerTwoSymbol : playerOneSymbol;
  updateOfflineStatus();
}

function updateOfflineStatus() {
  const playerNumber = currentPlayer === playerOneSymbol ? "1" : "2";
  statusText.textContent = `Player ${playerNumber}'s Turn (${currentPlayer})`;
}

function botMove() {
  if (!running || gameMode !== "bot" || currentPlayer !== botPlayer) {
    return;
  }

  let move;
  switch (botDifficulty) {
    case "easy": move = getRandomMove(); break;
    case "medium": move = getMediumMove(); break;
    case "hard": move = getBestMove(); break;
    default: move = getRandomMove();
  }

  if (move === null) {
    checkWinner();
    return;
  }

  makeMove(move, botPlayer);

  if (checkWinner()) {
    return;
  }

  currentPlayer = humanPlayer;
  statusText.textContent = `Your Turn (${humanPlayer})`;
}

function getRandomMove() {
  const available = getAvailableMoves();
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function getMediumMove() {
  const available = getAvailableMoves();
  if (available.length === 0) return null;

  const winningMove = findWinningMove(botPlayer);
  if (winningMove !== null) return winningMove;

  const blockingMove = findWinningMove(humanPlayer);
  if (blockingMove !== null) return blockingMove;

  if (board[4] === EMPTY) return 4;

  const availableCorners = [0, 2, 6, 8].filter(index => board[index] === EMPTY);
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }

  return getRandomMove();
}

function findWinningMove(player) {
  const available = getAvailableMoves();
  for (const move of available) {
    board[move] = player;
    const wins = checkWinnerOnBoard(board, player);
    board[move] = EMPTY;
    if (wins) return move;
  }
  return null;
}

function getBestMove() {
  const available = getAvailableMoves();
  if (available.length === 0) return null;

  let bestScore = -Infinity;
  let bestMoves = [];

  for (const move of available) {
    board[move] = botPlayer;
    const score = minimax(board, 0, false);
    board[move] = EMPTY;
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function minimax(position, depth, maximizing) {
  if (checkWinnerOnBoard(position, botPlayer)) return 10 - depth;
  if (checkWinnerOnBoard(position, humanPlayer)) return depth - 10;

  const available = getAvailableMovesFromBoard(position);
  if (available.length === 0) return 0;

  if (maximizing) {
    let bestScore = -Infinity;
    for (const move of available) {
      position[move] = botPlayer;
      const score = minimax(position, depth + 1, false);
      position[move] = EMPTY;
      bestScore = Math.max(bestScore, score);
    }
    return bestScore;
  }

  let bestScore = Infinity;
  for (const move of available) {
    position[move] = humanPlayer;
    const score = minimax(position, depth + 1, true);
    position[move] = EMPTY;
    bestScore = Math.min(bestScore, score);
  }
  return bestScore;
}

function getAvailableMoves() {
  return getAvailableMovesFromBoard(board);
}

function getAvailableMovesFromBoard(position) {
  const moves = [];
  for (let index = 0; index < position.length; index++) {
    if (position[index] === EMPTY) moves.push(index);
  }
  return moves;
}

function checkWinnerOnBoard(position, player) {
  return winPatterns.some(([a, b, c]) =>
    position[a] === player && position[b] === player && position[c] === player
  );
}

function getWinningPattern(position) {
  return winPatterns.find(([a, b, c]) =>
    position[a] !== EMPTY && position[a] === position[b] && position[a] === position[c]
  ) || null;
}

function checkWinner() {
  const winningPattern = getWinningPattern(board);

  if (winningPattern !== null) {
    endWin(winningPattern);
    return true;
  }

  if (board.every(cell => cell !== EMPTY)) {
    running = false;
    cancelBotTimer();
    statusText.textContent = "It's a Tie!";

    if (isOnlineMode && conn && conn.open) {
      rematchRequested = false;
      rematchAccepted = false;
      waitingForRematchResponse = false;
      popupButtons.innerHTML = `
        <button class="btn-rematch" onclick="requestRematchOnline()">🔄 Request Rematch</button>
        <button class="btn-secondary" onclick="backToMenu()">Main Menu</button>
      `;
    } else {
      popupButtons.innerHTML = `
        <button class="btn-primary" onclick="closePopup()">Play Again</button>
        <button class="btn-secondary" onclick="backToMenu()">Main Menu</button>
      `;
    }

    showPopup("It's a Tie!", "🤝");
    return true;
  }

  return false;
}

function drawWinLine(pattern) {
  const lineEl = document.getElementById("winLine");
  const seg = document.getElementById("winLineSeg");
  if (!lineEl || !seg) return;

  // Centers of cells in a 0–100 viewBox (accounting for gap roughly)
  const centers = [
    [16.5, 16.5], [50, 16.5], [83.5, 16.5],
    [16.5, 50],   [50, 50],   [83.5, 50],
    [16.5, 83.5], [50, 83.5], [83.5, 83.5]
  ];

  const [a, , c] = pattern;
  const [x1, y1] = centers[a];
  const [x2, y2] = centers[c];

  seg.setAttribute("x1", x1);
  seg.setAttribute("y1", y1);
  seg.setAttribute("x2", x2);
  seg.setAttribute("y2", y2);

  // Restart animation
  seg.style.animation = "none";
  void seg.offsetWidth;
  seg.style.animation = "";

  lineEl.classList.remove("hidden");
}

function hideWinLine() {
  const lineEl = document.getElementById("winLine");
  if (lineEl) lineEl.classList.add("hidden");
}

function vibrateLight() {
  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
}

function endWin(winningPattern) {
  running = false;
  cancelBotTimer();

  winningPattern.forEach(index => {
    cells[index].classList.add("win");
    cells[index].classList.add('animate-win');
  });

  drawWinLine(winningPattern);

  const winner = board[winningPattern[0]];

  if (winner === PLAYER_X) xScore++;
  else oScore++;

  updateScoreDisplay();

  if (isOnlineMode && conn && conn.open) {
    const humanWon = winner === mySymbol;
    statusText.textContent = humanWon ? "You Win! 🎉" : "You Lose!";
    statusText.classList.toggle('your-turn', humanWon);

    rematchRequested = false;
    rematchAccepted = false;
    waitingForRematchResponse = false;

    popupButtons.innerHTML = `
      <button class="btn-rematch" onclick="requestRematchOnline()">🔄 Request Rematch</button>
      <button class="btn-secondary" onclick="backToMenu()">Main Menu</button>
    `;
    showPopup(humanWon ? "You Win! 🎉" : "Opponent Wins!", humanWon ? "🎉" : "😔");
    return;
  }

  // Offline & Bot: always use Play Again / Main Menu (never rematch UI)
  popupButtons.innerHTML = `
    <button class="btn-primary" onclick="closePopup()">Play Again</button>
    <button class="btn-secondary" onclick="backToMenu()">Main Menu</button>
  `;

  if (gameMode === "bot") {
    const humanWon = winner === humanPlayer;
    statusText.textContent = humanWon ? "You Win! 🎉" : "Bot Wins!";
    statusText.classList.toggle('your-turn', humanWon);
    showPopup(humanWon ? "You Win! 🎉" : "Bot Wins! 🤖", humanWon ? "🎉" : "🤖");
    return;
  }

  const playerNumber = winner === playerOneSymbol ? "1" : "2";
  statusText.textContent = `Player ${playerNumber} Wins!`;
  showPopup(`Player ${playerNumber} Wins! 🎉`, "🎉");
}

function requestRematchOnline() {
  rematchRequested = true;
  waitingForRematchResponse = true;
  requestRematch();
  popup.classList.add("hidden");
  showWaitingRematchPopup(); // requester sees Waiting only — no Accept
}

function updateScoreDisplay() {
  xScoreElement.textContent = String(xScore);
  oScoreElement.textContent = String(oScore);
}

function showPopup(message, icon = "🎉") {
  popupText.textContent = message;
  popupIcon.textContent = icon;
  popup.classList.remove("hidden");
}

function closePopup() {
  popup.classList.add("hidden");
  // Offline / bot: play again immediately
  // Online: should use rematch flow, but if somehow here, just restart locally after both agreed
  restartGame();
}

// Called by the Restart button in the UI
function safeRestart() {
  // Block mid-game restart in all modes (prevents one-sided clear)
  if (running) {
    return;
  }

  // Online: after game over, Restart should request rematch instead of clearing alone
  if (isOnlineMode && conn && conn.open) {
    requestRematchOnline();
    return;
  }

  // Offline & Bot: allowed only after game finished
  restartGame();
}

function restartGame() {
  cancelBotTimer();
  board = Array(9).fill(EMPTY);
  running = true;
  popup.classList.add("hidden");
  rematchPopup.classList.add("hidden");
  rematchRequested = false;
  rematchAccepted = false;
  waitingForRematchResponse = false;
  hideWinLine();

  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("x", "o", "win", "animate-pop", "animate-win");
  });

  if (isOnlineMode && conn && conn.open) {
    // Host decides a new random starter each game/rematch and tells the joiner
    if (isHost) {
      gameStarter = Math.random() < 0.5 ? PLAYER_X : PLAYER_O;
      if (conn && conn.open) {
        conn.send({ type: 'gameStarter', starter: gameStarter });
      }
    }
    // Joiner waits for gameStarter message; use last known until then
    currentPlayer = gameStarter || PLAYER_X;

    if (currentPlayer === mySymbol) {
      statusText.textContent = "Your Turn!";
      statusText.classList.add('your-turn');
    } else {
      statusText.textContent = "Opponent's Turn...";
      statusText.classList.remove('your-turn');
    }
    return;
  }

  if (gameMode === "bot") {
    // Fresh random who starts each new game
    if (Math.random() < 0.5) {
      humanPlayer = PLAYER_X;
      botPlayer = PLAYER_O;
    } else {
      humanPlayer = PLAYER_O;
      botPlayer = PLAYER_X;
    }
    currentPlayer = PLAYER_X;
    if (currentPlayer === botPlayer) {
      statusText.textContent = "Bot's Turn...";
      scheduleBotMove();
    } else {
      statusText.textContent = `Your Turn (${humanPlayer})`;
    }
    return;
  }

  // Offline: random who is Player 1 each new game
  if (Math.random() < 0.5) {
    playerOneSymbol = PLAYER_X;
    playerTwoSymbol = PLAYER_O;
  } else {
    playerOneSymbol = PLAYER_O;
    playerTwoSymbol = PLAYER_X;
  }
  currentPlayer = playerOneSymbol;
  updateOfflineStatus();
}

function backFromTurnSelection() {
  cancelBotTimer();
  if (gameMode === "bot") {
    showOnlyScreen(difficultyScreen);
  } else {
    showOnlyScreen(menu);
  }
}

function backToMenu() {
  running = false;
  cancelBotTimer();
  popup.classList.add("hidden");
  rematchPopup.classList.add("hidden");
  hideWinLine();

  if (isOnlineMode) {
    cancelOnline();
  }

  showOnlyScreen(menu);
}

function capitalize(text) {
  if (typeof text !== "string" || text.length === 0) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ============================
// Loading screen animation
// Plays once on page load, then is removed permanently and the
// main menu is shown. It never re-appears when navigating screens.
// ============================
function runLoadingAnimation() {
  const miniCells = document.querySelectorAll("#miniBoard .mini-cell");
  const sequence = [
    { i: 0, mark: "x" },
    { i: 2, mark: "o" },
    { i: 4, mark: "x" },
    { i: 6, mark: "o" },
    { i: 8, mark: "x" }
  ];
  const winCells = [0, 4, 8];
  let step = 0;

  function resetMini() {
    miniCells.forEach(c => { c.className = "mini-cell"; c.textContent = ""; });
    step = 0;
  }

  function tick() {
    if (step < sequence.length) {
      const { i, mark } = sequence[step];
      miniCells[i].textContent = mark === "x" ? "✕" : "○";
      miniCells[i].classList.add(mark);
      step++;
      setTimeout(tick, 750);
    } else {
      winCells.forEach(i => miniCells[i].classList.add("win"));
      setTimeout(() => { resetMini(); tick(); }, 2500);
    }
  }
  tick();
}

function hideLoadingScreen() {
  const loader = document.getElementById("loadingScreen");
  if (!loader) return;
  loader.classList.add("fade-out");
  setTimeout(() => {
    loader.remove();
    showOnlyScreen(menu);
  }, 400);
}

// Keyboard support (desktop): keys 1-9 map to board cells
document.addEventListener("keydown", (e) => {
  if (!running || gameScreen.classList.contains("hidden")) return;
  // Ignore if user is typing in an input
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  const keyMap = {
    "1": 0, "2": 1, "3": 2,
    "4": 3, "5": 4, "6": 5,
    "7": 6, "8": 7, "9": 8
  };
  const index = keyMap[e.key];
  if (index === undefined) return;

  // Simulate a click on that cell
  const cell = cells[index];
  if (cell) cell.click();
});

runLoadingAnimation();
setTimeout(hideLoadingScreen, 5000);