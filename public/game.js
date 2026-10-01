const joinBtn = document.getElementById('join-btn');
const joinScreen = document.getElementById('join-screen');
const gameScreen = document.getElementById('game-screen');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score-display');
const p1Info = document.getElementById('p1-info');
const p2Info = document.getElementById('p2-info');
const p1ServeBadge = document.getElementById('p1-serve-badge');
const p2ServeBadge = document.getElementById('p2-serve-badge');
const serveBtn = document.getElementById('serve-btn');

let myRole = null;
let gameState = null;
let myY = 160;
let selectedChar = '👱‍♂️';

const charNames = {
  '👱‍♂️': 'Ace 👱‍♂️',
  '👩‍🦰': 'Smash 👩‍🦰',
  '👴': 'Dink 👴',
  '👩🏾‍🦱': 'Spin 👩🏾‍🦱',
  '🧑🏻‍🦱': 'Volley 🧑🏻‍🦱'
};

const WIDTH = 800;
const HEIGHT = 400;
const PADDLE_H = 80;
const PADDLE_W = 10;
const BALL_R = 10;

document.querySelectorAll('.char-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.char-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    selectedChar = el.getAttribute('data-char');
  });
});

async function fetchState() {
  try {
    const res = await fetch('/api/state');
    gameState = await res.json();
    updateUI();
  } catch (e) {
    console.error("Failed to fetch state:", e);
  }
}

async function sendAction(action = {}) {
  if (!myRole || myRole === 'spectator') return;
  try {
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: myRole, y: myY, ...action })
    });
  } catch (e) {}
}

joinBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ char: selectedChar })
    });
    const data = await res.json();
    myRole = data.role;
    
    joinScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    
    setInterval(fetchState, 30); 
    setInterval(() => sendAction(), 30);
    
    requestAnimationFrame(render);
  } catch (e) {
    alert("Failed to join game. Make sure server is running.");
  }
});

function handleServe() {
  if (gameState && gameState.status === 'gameover') {
    sendAction({ reset: true });
  } else if (gameState && gameState.server === myRole && gameState.ball.status === 'held') {
    sendAction({ serve: true });
  }
}

serveBtn.addEventListener('click', (e) => { e.stopPropagation(); handleServe(); });
serveBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handleServe(); }, { passive: false });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') handleServe();
});

window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('/api/hard_reset');
});

function updateUI() {
  if (!gameState) return;
  
  if (myRole && myRole !== 'spectator' && gameState[myRole] && gameState[myRole].connected === false) {
    // The server was hard reset by someone refreshing
    window.location.reload();
  }
  
  if (gameState.status === 'gameover') {
    scoreDisplay.innerText = `GAME OVER!`;
  } else {
    scoreDisplay.innerText = `${gameState.p1.score} - ${gameState.p2.score}`;
  }
  
  const p1Name = charNames[gameState.p1.char] || gameState.p1.char;
  const p2Name = charNames[gameState.p2.char] || gameState.p2.char;
  
  p1Info.innerText = p1Name;
  p2Info.innerText = p2Name;
  
  p1ServeBadge.style.display = gameState.server === 'p1' ? 'inline-block' : 'none';
  p2ServeBadge.style.display = gameState.server === 'p2' ? 'inline-block' : 'none';
  
  if (gameState.status === 'gameover') {
    serveBtn.innerText = 'PLAY AGAIN';
    serveBtn.style.display = 'block';
  } else if (gameState.server === myRole && gameState.ball.status === 'held' && gameState.status === 'playing') {
    serveBtn.innerText = 'SERVE NOW';
    serveBtn.style.display = 'block';
  } else {
    serveBtn.style.display = 'none';
  }
}

function drawCourt() {
  ctx.fillStyle = '#2b7a2b';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = '#295b99';
  ctx.fillRect(50, 20, WIDTH - 100, HEIGHT - 40);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(50, 20, WIDTH - 100, HEIGHT - 40);

  ctx.beginPath();
  ctx.setLineDash([10, 10]);
  ctx.moveTo(WIDTH / 2, 10);
  ctx.lineTo(WIDTH / 2, HEIGHT - 10);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 120, 20);
  ctx.lineTo(WIDTH / 2 - 120, HEIGHT - 20);
  ctx.moveTo(WIDTH / 2 + 120, 20);
  ctx.lineTo(WIDTH / 2 + 120, HEIGHT - 20);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(50, HEIGHT / 2);
  ctx.lineTo(WIDTH / 2 - 120, HEIGHT / 2);
  ctx.moveTo(WIDTH / 2 + 120, HEIGHT / 2);
  ctx.lineTo(WIDTH - 50, HEIGHT / 2);
  ctx.stroke();
}

function render() {
  drawCourt();
  
  if (gameState) {
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // P1
    ctx.fillStyle = '#ff4d4d';
    const p1DrawY = myRole === 'p1' ? myY : gameState.p1.y;
    ctx.fillRect(20, p1DrawY, PADDLE_W, PADDLE_H);
    ctx.fillText(gameState.p1.char, 25, p1DrawY - 20);
    
    // P2
    ctx.fillStyle = '#4da6ff';
    const p2DrawY = myRole === 'p2' ? myY : gameState.p2.y;
    ctx.fillRect(WIDTH - 30, p2DrawY, PADDLE_W, PADDLE_H);
    ctx.fillText(gameState.p2.char, WIDTH - 25, p2DrawY - 20);
    
    // Ball
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    
    if (gameState.status === 'gameover') {
      const winnerChar = gameState.p1.score >= 5 ? gameState.p1.char : gameState.p2.char;
      const winnerName = charNames[winnerChar] || winnerChar;
      
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,WIDTH,HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '40px Roboto';
      ctx.fillText(`${winnerName} WINS!`, WIDTH/2, HEIGHT/2);
    } else if (gameState.status === 'waiting') {
      ctx.fillStyle = 'white';
      ctx.font = '24px Roboto';
      ctx.fillText('Waiting for opponent...', WIDTH/2, 50);
    }
  }
  
  requestAnimationFrame(render);
}

function updatePaddlePosition(clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  const y = (clientY - rect.top) * scaleY - (PADDLE_H / 2);
  myY = Math.max(0, Math.min(y, HEIGHT - PADDLE_H));
}

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length > 0) updatePaddlePosition(e.touches[0].clientY);
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (e.touches.length > 0) updatePaddlePosition(e.touches[0].clientY);
}, { passive: false });

canvas.addEventListener('mousemove', (e) => {
  updatePaddlePosition(e.clientY);
});

window.addEventListener('keydown', (e) => {
  const SPEED = 20;
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') myY = Math.max(0, myY - SPEED);
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') myY = Math.min(HEIGHT - PADDLE_H, myY + SPEED);
});
