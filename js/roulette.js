// ── Roulette Feature ──

function showRouletteModal(orderId) {
  const actualOrderId = typeof orderId === 'object' ? orderId.id : orderId;
  const orders = typeof getOrders === 'function' ? getOrders() : (typeof ORDERS !== 'undefined' ? ORDERS : []);
  const order = typeof orderId === 'object' ? orderId : orders.find(o => o.id === actualOrderId);
  if (!order) return;

  const products = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
  const product = products.find(p => p.id === order.productId);
  if (!product) return;

  // Create UI
  const modal = document.createElement('div');
  modal.className = 'roulette-modal';
  modal.id = 'roulette-modal';
  
  modal.innerHTML = `
    <div class="roulette-modal-content">
      <h2 class="roulette-title">🎰 Ruleta de la Suerte</h2>
      <p class="roulette-subtitle">¡Gira la ruleta y gana un premio sorpresa por tu recarga!</p>
      
      <div class="roulette-container">
        <div class="roulette-pointer"></div>
        <div class="roulette-wheel" id="roulette-wheel">
          <div class="sec sec-0"><span>NADA</span></div>
          <div class="sec sec-1"><span>CASI</span></div>
          <div class="sec sec-2"><span>INTENTA</span></div>
          <div class="sec sec-3"><span>NADA</span></div>
          <div class="sec sec-4"><span>SUERTE</span></div>
          <div class="sec sec-5"><span>🎁 PREMIO</span></div>
        </div>
      </div>
      
      <div class="roulette-result" id="roulette-result"></div>
      <button class="roulette-btn" id="roulette-btn" onclick="spinRoulette('${order.id}', '${product.id}')">GIRAR AHORA</button>
      <button class="roulette-close-btn" onclick="document.getElementById('roulette-modal').remove()">✖</button>
    </div>
  `;
  document.body.appendChild(modal);
}

async function spinRoulette(orderId, productId) {
  const btn = document.getElementById('roulette-btn');
  const wheel = document.getElementById('roulette-wheel');
  const resultDiv = document.getElementById('roulette-result');
  const closeBtn = document.querySelector('.roulette-close-btn');
  
  // Audios
  const winSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); // Win arcade
  const loseSound = new Audio('https://www.myinstants.com/media/sounds/aww-sound-effect.mp3'); // Mild aww sound
  
  btn.style.display = 'none';
  if (closeBtn) closeBtn.style.display = 'none';
  resultDiv.innerHTML = "Conectando al servidor...";
  resultDiv.style.color = "var(--text-secondary)";

  let isWinner = false;
  try {
    const res = await fetch('/api/spin-roulette', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error al conectar con la ruleta.');
      btn.style.display = 'block';
      if (closeBtn) closeBtn.style.display = 'block';
      resultDiv.innerHTML = "";
      return;
    }
    isWinner = data.isWinner === true;
  } catch (err) {
    alert('Error de red. Intenta nuevamente.');
    btn.style.display = 'block';
    if (closeBtn) closeBtn.style.display = 'block';
    resultDiv.innerHTML = "";
    return;
  }

  resultDiv.innerHTML = "¡Girando!";

  // Start spin sound (Synthetic Roulette Ticks)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTick() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.03);
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  }

  let delay = 15;
  function triggerTick() {
    playTick();
    delay = delay * 1.10;
    if (delay < 1200) {
      setTimeout(triggerTick, delay);
    }
  }
  triggerTick();

  // Mark as played locally (server already did it securely)
  const orders = typeof getOrders === 'function' ? getOrders() : [];
  const order = orders.find(o => o.id === orderId);
  if (order) order.roulettePlayed = true;
  localStorage.setItem('roulette_played_' + orderId, 'true');
  
  if (appState && appState.currentView === 'tracking') {
    setTimeout(() => {
      if (typeof renderOrderTracking === 'function') {
        const container = document.querySelector('.app-container');
        if (container) {
          container.innerHTML = renderOrderTracking(orderId) + (typeof renderFooter === 'function' ? renderFooter() : '');
        }
      }
    }, 500);
  }
  
  const baseSpins = 360 * 15; // 15 vueltas
  let finalDegree;
  if (isWinner) {
    // Winner is sec-5 at CSS angle 240deg. Top is 270deg.
    finalDegree = baseSpins + 30; 
  } else {
    const losingAngles = [0, 60, 120, 180, 300]; 
    const randomLosingAngle = losingAngles[Math.floor(Math.random() * losingAngles.length)];
    finalDegree = baseSpins + (270 - randomLosingAngle);
  }

  wheel.style.transition = `transform 12s cubic-bezier(0.15, 0.8, 0.1, 1)`;
  wheel.style.transform = `rotate(${finalDegree}deg)`;
  
  setTimeout(() => {
    if (isWinner) {
      winSound.play().catch(e => console.log('Audio autoplay blocked'));
      resultDiv.innerHTML = "🎉 ¡FELICIDADES! ¡GANASTE UN PREMIO! 🎉<br><small>Tu premio ya se ha añadido a tu cuenta.</small>";
      resultDiv.style.color = "var(--accent)";
      if (typeof createConfetti === 'function') createConfetti();
    } else {
      loseSound.play().catch(e => console.log('Audio autoplay blocked'));
      resultDiv.innerHTML = "😔 Sigue participando. ¡Suerte a la próxima!";
      resultDiv.style.color = "#f87171";
    }
    
    btn.innerText = "CERRAR";
    btn.style.display = 'block';
    btn.onclick = () => {
      document.getElementById('roulette-modal').remove();
    };
  }, 12000);
}
