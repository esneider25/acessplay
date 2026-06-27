// ── Roulette Feature ──

function tryTriggerRoulette(orderId) {
  const orders = typeof getOrders === 'function' ? getOrders() : [];
  const order = orders.find(o => o.id === orderId);
  
  if (!order) return;
  
  // SOLO CUANDO SEA APROBADO
  if (order.status !== 'completed') return;
  
  // SOLO PARA CLIENTE E INFLUENCER, NO REVENDEDOR
  const profile = typeof userProfile !== 'undefined' ? userProfile : null;
  if (profile && profile.role === 'revendedor') return;

  // NO REPETIR POR ORDEN
  if (localStorage.getItem('roulette_played_' + orderId)) return;

  const products = typeof getProducts === 'function' ? getProducts() : [];
  const product = products.find(p => p.id === order.productId);
  if (!product) return;

  // SOLO PARA JUEGOS
  const isGame = (product.category && product.category.toLowerCase() === 'juegos') || product.type === 'game-id';
  if (!isGame) return;

  // Marcar como jugada
  localStorage.setItem('roulette_played_' + orderId, 'true');

  setTimeout(() => {
    showRouletteModal(order, product);
  }, 1000); // 1 sec delay after entering tracking screen
}

function showRouletteModal(order, product) {
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
          <div class="sec sec-5"><span>PREMIO</span></div>
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
  
  btn.style.display = 'none';
  if (closeBtn) closeBtn.style.display = 'none';
  
  // Sections: 6 sections (60deg each). 
  // sec-0 = 0-60, sec-1 = 60-120... sec-5 = 300-360
  // Winner is sec-5 (PREMIO)
  // Final degree to apply to the wheel
  const baseSpins = 360 * 5; 
  let finalDegree;
  if (isWinner) {
    // Winner is sec-5 at CSS angle 330deg. Top is 270deg.
    // finalDegree = 270 - 330 = -60 + baseSpins
    finalDegree = baseSpins - 60; 
  } else {
    // Losing angles: centers of sec 0, 1, 2, 3, 4 (30, 90, 150, 210, 270)
    const losingAngles = [30, 90, 150, 210, 270]; 
    const randomLosingAngle = losingAngles[Math.floor(Math.random() * losingAngles.length)];
    finalDegree = baseSpins + (270 - randomLosingAngle);
  }

  wheel.style.transition = `transform 6s cubic-bezier(0.15, 0.9, 0.15, 1)`;
  wheel.style.transform = `rotate(${finalDegree}deg)`;
  
  setTimeout(() => {
    if (isWinner) {
      resultDiv.innerHTML = "🎉 ¡FELICIDADES! ¡GANASTE UN PREMIO! 🎉";
      resultDiv.style.color = "var(--accent)";
      if (typeof createConfetti === 'function') createConfetti();
      processRoulettePrize(orderId, productId);
    } else {
      resultDiv.innerHTML = "😔 Sigue participando. ¡Suerte a la próxima!";
      resultDiv.style.color = "#f87171";
    }
    
    btn.innerText = "CERRAR";
    btn.style.display = 'block';
    btn.onclick = () => {
      document.getElementById('roulette-modal').remove();
    };
  }, 6000);
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
