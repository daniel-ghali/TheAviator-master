// signature.js

// window.startGame is now handled in game.js to ensure all initialization is correct.

// Handle game clicks - previously an inline function in game.js
window.handleMenuClick = function(event) {
  // Disabled to prevent premature restart during signature mode.
  // Game restart is now handled exclusively by submitScore().
};

window.showGameOverScreen = function() {
  document.getElementById('gameOverScreen').style.display = 'flex';
  const dist = document.getElementById('distValue').innerText;
  const level = document.getElementById('levelValue').innerText;
  document.getElementById('finalScoreDisplay').innerText = `Distance: ${dist} | Level: ${level}`;
};

// Hand Drawing State
let lastHandPos = null;
let isHandDrawing = false;

function loopHandSignature() {
  const canvas = document.getElementById('signaturePad');
  const cursor = document.getElementById('handCursor');
  if (canvas && window.handGesture && window.handGesture.x !== undefined) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = window.handGesture.x * canvas.width;
    const y = window.handGesture.y * canvas.height;

    // Move visual cursor
    if (cursor) {
      cursor.style.display = 'block';
      cursor.style.left = (rect.left + window.handGesture.x * rect.width - 10) + 'px';
      cursor.style.top = (rect.top + window.handGesture.y * rect.height - 10) + 'px';
      if (window.handGesture.isPinching) {
        cursor.classList.add('pinching');
      } else {
        cursor.classList.remove('pinching');
      }
    }

    if (window.handGesture.isPinching) {
      if (!isHandDrawing) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        isHandDrawing = true;
      } else {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      lastHandPos = { x, y };
    } else {
      if (isHandDrawing) {
        ctx.beginPath();
        isHandDrawing = false;
      }
    }
  } else if (cursor) {
    cursor.style.display = 'none';
  }
  requestAnimationFrame(loopHandSignature);
}

window.submitScore = function() {
  const name = document.getElementById('playerName').value;
  if(!name) {
    alert("Please enter your name!");
    return;
  }
  
  // -- GENERATE PNG CERTIFICATE --
  const existingCanvas = document.getElementById('signaturePad');
  const certificate = document.createElement('canvas');
  certificate.width = 1200;
  certificate.height = 800;
  const ctx = certificate.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
  gradient.addColorStop(0, '#f7d9aa');
  gradient.addColorStop(1, '#d1b790');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 800);

  // Border
  ctx.strokeStyle = '#59332e';
  ctx.lineWidth = 20;
  ctx.strokeRect(40, 40, 1120, 720);

  // Text
  ctx.fillStyle = '#59332e';
  ctx.textAlign = 'center';
  ctx.font = 'bold 80px Playfair Display, serif';
  ctx.fillText('FLIGHT CERTIFICATE', 600, 150);
  
  ctx.font = '50px Playfair Display, serif';
  ctx.fillText(`Pilot: ${name}`, 600, 250);
  
  const dist = document.getElementById('distValue').innerText;
  const level = document.getElementById('levelValue').innerText;
  ctx.fillText(`Distance: ${dist} | Level: ${level}`, 600, 320);

  // Signature (Full Resolution)
  ctx.font = 'italic 30px Playfair Display, serif';
  ctx.fillText('Signature:', 600, 400);
  ctx.drawImage(existingCanvas, 0, 100, existingCanvas.width, existingCanvas.height - 200, 100, 420, 1000, 300);

  // Download Certificate as [PlayerName].png
  const certLink = document.createElement('a');
  certLink.download = `${name}.png`;
  certLink.href = certificate.toDataURL('image/png');
  certLink.click();
  
  // -----------------------------

  // Hide game over screen
  document.getElementById('gameOverScreen').style.display = 'none';
  
  // Clear signature pad
  if(existingCanvas) {
    const sCtx = existingCanvas.getContext('2d');
    sCtx.clearRect(0, 0, existingCanvas.width, existingCanvas.height);
  }
  
  document.getElementById('playerName').value = '';
  
  // Reset game state and unpause
  resetGame();
  hideReplay();
  
  // Show start menu again or start directly
  document.getElementById('startMenu').style.display = 'flex';
  document.getElementById('initialMenu').style.display = 'block';
  document.getElementById('handLoadingMenu').style.display = 'none';
  document.getElementById('startHandBtn').style.display = 'none';
  window.isHandTrackingReady = false;
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

  // Start hand tracking drawing loop
  loopHandSignature();
});
