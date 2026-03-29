// signature.js

window.startGame = function(mode) {
  document.getElementById('startMenu').style.display = 'none';
  if (mode === 'hand' && window.initHandTracking) {
    window.initHandTracking();
  }
  
  game.status = "playing";
};

// Handle game clicks - previously an inline function in game.js
window.handleMenuClick = function(event) {
  if (game.status === "waitingReplay"){
    resetGame();
    hideReplay();
    game.status = "playing";
  }
};

window.showGameOverScreen = function() {
  document.getElementById('gameOverScreen').style.display = 'flex';
  const dist = document.getElementById('distValue').innerText;
  const level = document.getElementById('levelValue').innerText;
  document.getElementById('finalScoreDisplay').innerText = `Distance: ${dist} | Level: ${level}`;
};

window.submitScore = function() {
  const name = document.getElementById('playerName').value;
  if(!name) {
    alert("Please enter your name!");
    return;
  }
  
  // Hide game over screen
  document.getElementById('gameOverScreen').style.display = 'none';
  
  // Clear signature pad
  const canvas = document.getElementById('signaturePad');
  if(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  document.getElementById('playerName').value = '';
  
  // Reset game state and unpause
  resetGame();
  hideReplay();
  
  // Show start menu again or start directly
  document.getElementById('startMenu').style.display = 'flex';
  game.status = "waitingStart";
};

document.addEventListener("DOMContentLoaded", function() {
  const canvas = document.getElementById('signaturePad');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Set drawing styles
  ctx.strokeStyle = '#59332e';
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let drawing = false;

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if(e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function startPosition(e) {
    drawing = true;
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    draw(e);
  }

  function endPosition() {
    drawing = false;
    ctx.beginPath();
  }

  function draw(e) {
    if(!drawing) return;
    if(e.type === 'touchmove' && e.cancelable) e.preventDefault(); 
    
    const pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  // Mouse events
  canvas.addEventListener('mousedown', startPosition);
  canvas.addEventListener('mouseup', endPosition);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseout', endPosition);

  // Touch events
  canvas.addEventListener('touchstart', startPosition, { passive: false });
  canvas.addEventListener('touchend', endPosition);
  canvas.addEventListener('touchmove', draw, { passive: false });
});
