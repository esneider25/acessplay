// ── Roulette Feature ──

function showRouletteModal(orderId) {
  const actualOrderId = typeof orderId === 'object' ? orderId.id : orderId;
  const orders = typeof getOrders === 'function' ? getOrders() : (typeof ORDERS !== 'undefined' ? ORDERS : []);
  const order = typeof orderId === 'object' ? orderId : orders.find(o => o.id === actualOrderId);
  if (!order) return;

  const products = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
  const product = products.find(p => p.id === order.productId);
  if (!product) return;

  // 2% chance
  const isWinner = Math.random() < 0.02;

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
      <button class="roulette-btn" id="roulette-btn" onclick="spinRoulette(${isWinner}, '${order.id}', '${product.id}')">GIRAR AHORA</button>
      <button class="roulette-close-btn" onclick="document.getElementById('roulette-modal').remove()">✖</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function spinRoulette(isWinner, orderId, productId) {
  const btn = document.getElementById('roulette-btn');
  const wheel = document.getElementById('roulette-wheel');
  const resultDiv = document.getElementById('roulette-result');
  const closeBtn = document.querySelector('.roulette-close-btn');
  
  // Audios
  const winSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); // Win arcade
  const loseSound = new Audio('https://www.myinstants.com/media/sounds/sadtrombone.mp3'); // Classic sad horn/trombone
  
  btn.style.display = 'none';
  if (closeBtn) closeBtn.style.display = 'none';
  
  // Start spin sound (Synthetic Roulette Ticks)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTick() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    // Use a square wave with a low frequency drop to simulate a heavy plastic flapper hitting a peg
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

  let delay = 15; // start extremely fast (15ms)
  function triggerTick() {
    playTick();
    delay = delay * 1.10; // increase delay by 10% each tick (slows down perfectly over ~11.8 seconds)
    if (delay < 1200) { // Keep ticking until the delay between ticks reaches 1.2 seconds
      setTimeout(triggerTick, delay);
    }
  }
  triggerTick();

  // Mark as played securely in database
  const orders = typeof getOrders === 'function' ? getOrders() : [];
  const order = orders.find(o => o.id === orderId);
  if (order && typeof saveOrderToDb === 'function') {
    order.roulettePlayed = true;
    saveOrderToDb(order);
    
    // Also re-render tracking so the button disappears in background
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
  }
  
  const baseSpins = 360 * 15; // 15 vueltas para muchísimo más suspenso
  let finalDegree;
  if (isWinner) {
    // Winner is sec-5 at CSS angle 240deg. Top is 270deg.
    finalDegree = baseSpins + 30; 
  } else {
    const losingAngles = [0, 60, 120, 180, 300]; 
    const randomLosingAngle = losingAngles[Math.floor(Math.random() * losingAngles.length)];
    finalDegree = baseSpins + (270 - randomLosingAngle);
  }

  // 12 segundos de animación, empieza rápido, pero tiene una caída larga y tensa
  wheel.style.transition = `transform 12s cubic-bezier(0.15, 0.8, 0.1, 1)`;
  wheel.style.transform = `rotate(${finalDegree}deg)`;
  
  setTimeout(() => {
    if (isWinner) {
      winSound.play().catch(e => console.log('Audio autoplay blocked'));
      resultDiv.innerHTML = "🎉 ¡FELICIDADES! ¡GANASTE UN PREMIO! 🎉";
      resultDiv.style.color = "var(--accent)";
      if (typeof createConfetti === 'function') createConfetti();
      processRoulettePrize(orderId, productId);
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
  }, 12000); // 12 segundos para coincidir con la transición
}

function processRoulettePrize(originalOrderId, productId) {
  const products = typeof getProducts === 'function' ? getProducts() : PRODUCTS;
  const product = products.find(p => p.id === productId);
  if (!product || !product.packages || product.packages.length === 0) return;
  
  const cheapestPackage = [...product.packages].sort((a,b) => a.priceUsd - b.priceUsd)[0];
  const orders = typeof getOrders === 'function' ? getOrders() : ORDERS;
  const originalOrder = orders.find(o => o.id === originalOrderId);
  if (!originalOrder) return;
  
  const freeOrderData = {
    userId: originalOrder.userId,
    userName: originalOrder.userName,
    productId: product.id,
    productName: product.name,
    productType: product.type,
    packageLabel: cheapestPackage.name,
    apiProductId: cheapestPackage.apiProductId,
    apiProvider: product.apiProvider,
    priceUsd: 0,
    priceBs: 0,
    costUsd: cheapestPackage.costUsd || 0,
    paymentMethodId: 'roulette',
    paymentMethodName: 'Premio Ruleta',
    customerContact: originalOrder.customerContact,
    gameId: originalOrder.gameId,
    playerName: originalOrder.playerName,
    accountEmail: originalOrder.accountEmail,
    accountPassword: originalOrder.accountPassword,
    imageHash: 'PREMIO_RULETA',
    discountCode: null,
    discountValue: 0,
    discountType: null
  };
  
  if (typeof createOrder === 'function') {
    const freeOrder = createOrder(freeOrderData);
    freeOrder.adminNote = "🎁 PREMIO RULETA (Ganado de la orden " + originalOrderId + ")";
    if (!freeOrder.statusHistory) freeOrder.statusHistory = [];
    freeOrder.statusHistory.push({
      status: 'pending',
      timestamp: new Date().toISOString(),
      note: "Generado automáticamente por premio de ruleta."
    });
    if (typeof saveOrderToDb === 'function') {
      saveOrderToDb(freeOrder);
    }
  }
}
