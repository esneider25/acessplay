// ── Roulette Feature ──
function showRouletteModal(order, product) {
  // Check if product belongs to category "juegos" or if it is "game-id"
  const isGame = (product.category === 'juegos' || product.type === 'game-id');
  if (!isGame) {
    // If not a game, go directly to tracking
    goToTracking(order.id);
    return;
  }

  // 2% chance
  const isWinner = Math.random() < 0.02;

  // Create UI
  const modal = document.createElement('div');
  modal.className = 'roulette-modal';
  modal.id = 'roulette-modal';
  
  modal.innerHTML = `
    <h2 class="roulette-title">🎰 Ruleta de la Suerte</h2>
    <p class="roulette-subtitle">¡Gira la ruleta y gana un premio sorpresa por tu recarga!</p>
    <div class="roulette-container">
      <div class="roulette-pointer"></div>
      <div class="roulette-wheel" id="roulette-wheel">
        <div class="sec" style="transform: rotate(0deg) skewY(-30deg);">
          <span style="transform: skewY(30deg) rotate(30deg); display: block; margin-top: 40px; margin-left: 20px;">NADA</span>
        </div>
        <div class="sec" style="transform: rotate(60deg) skewY(-30deg);">
          <span style="transform: skewY(30deg) rotate(30deg); display: block; margin-top: 40px; margin-left: 20px;">CASI</span>
        </div>
        <div class="sec" style="transform: rotate(120deg) skewY(-30deg);">
          <span style="transform: skewY(30deg) rotate(30deg); display: block; margin-top: 40px; margin-left: 20px;">OTRA VEZ</span>
        </div>
        <div class="sec" style="transform: rotate(180deg) skewY(-30deg);">
          <span style="transform: skewY(30deg) rotate(30deg); display: block; margin-top: 40px; margin-left: 20px;">NADA</span>
        </div>
        <div class="sec" style="transform: rotate(240deg) skewY(-30deg);">
          <span style="transform: skewY(30deg) rotate(30deg); display: block; margin-top: 40px; margin-left: 20px;">SUERTE</span>
        </div>
        <div class="sec" style="transform: rotate(300deg) skewY(-30deg);">
          <span style="transform: skewY(30deg) rotate(30deg); display: block; margin-top: 40px; margin-left: 20px; color: #000; font-size: 1.1rem;">PREMIO</span>
        </div>
      </div>
    </div>
    <div class="roulette-result" id="roulette-result"></div>
    <button class="roulette-btn" id="roulette-btn" onclick="spinRoulette(${isWinner}, '${order.id}', '${product.id}')">GIRAR AHORA</button>
  `;
  document.body.appendChild(modal);
}

function spinRoulette(isWinner, orderId, productId) {
  const btn = document.getElementById('roulette-btn');
  const wheel = document.getElementById('roulette-wheel');
  const resultDiv = document.getElementById('roulette-result');
  
  btn.disabled = true;
  btn.innerText = "GIRANDO...";
  
  const baseSpins = 360 * 5; 
  let finalDegree;
  if (isWinner) {
    finalDegree = baseSpins + 30; // lands on 300-360 section
  } else {
    const losingAngles = [90, 150, 210, 270, 330]; 
    const randomLosingAngle = losingAngles[Math.floor(Math.random() * losingAngles.length)];
    finalDegree = baseSpins + randomLosingAngle;
  }

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
    
    btn.innerText = "CONTINUAR";
    btn.disabled = false;
    btn.onclick = () => {
      document.getElementById('roulette-modal').remove();
      goToTracking(orderId);
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
