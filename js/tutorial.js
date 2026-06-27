class WalkthroughTutorial {
  constructor() {
    this.currentStepIndex = 0;
    this.isActive = false;
    this.steps = [
      {
        id: 'step-catalog',
        targetSelector: '.cat-pill:nth-child(2)',
        text: '¡Hola! Te enseñaré a recargar paso a paso. 👇 Aquí tienes las categorías de nuestro catálogo.',
        handPos: 'bottom',
      },
      {
        id: 'step-game',
        targetSelector: '.game-card', 
        text: 'Primero debes elegir el juego o servicio. Toca "Siguiente" para simular que elegimos este.',
        handPos: 'bottom',
        onNext: () => {
          const firstCard = document.querySelector('.game-card');
          if (firstCard) firstCard.click();
        }
      },
      {
        id: 'step-package',
        targetSelector: '.package-card', 
        text: 'Luego, selecciona la cantidad de diamantes o saldo que quieras comprar.',
        handPos: 'top',
        onNext: () => {
          const firstPkg = document.querySelector('.package-card');
          if (firstPkg) firstPkg.click();
        }
      },
      {
        id: 'step-uid',
        targetSelector: '#game-uid',
        text: '¡Excelente! Ahora debes ingresar tu ID de Jugador aquí. Escríbelo con cuidado.',
        handPos: 'bottom',
        onNext: () => {
          const input = document.getElementById('game-uid');
          if (input) input.value = "123456789"; // demo input
        }
      },
      {
        id: 'step-payment-methods',
        targetSelector: '.payment-option',
        text: 'Elige cómo quieres pagar (Pago Móvil, Binance, etc). Aquí simulamos elegir Pago Móvil.',
        handPos: 'bottom',
        onShow: () => {
          setTimeout(() => {
            const firstMethod = document.querySelector('.payment-option');
            if (firstMethod) firstMethod.click();
          }, 300);
        }
      },
      {
        id: 'step-confirm',
        targetSelector: '#btn-submit',
        text: 'Por último, adjunta la captura de tu recibo y dale a "Confirmar Pedido". ¡Y listo!',
        handPos: 'top'
      }
    ];

    this.createElements();
    this.bindEvents();
  }

  createElements() {
    if (document.getElementById('tutorial-overlay')) return;

    this.blocker = document.createElement('div');
    this.blocker.id = 'tutorial-blocker';
    this.blocker.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: 99997; cursor: not-allowed;
      display: none;
    `;

    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorial-overlay';
    this.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 0; height: 0;
      pointer-events: none; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85);
      z-index: 99998; border-radius: 12px; border: 3px solid var(--accent, #0ea5e9);
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      opacity: 0; display: none;
    `;

    this.tooltip = document.createElement('div');
    this.tooltip.id = 'tutorial-tooltip';
    this.tooltip.style.cssText = `
      position: fixed; z-index: 99999;
      background: var(--bg-surface, #1e293b); color: var(--text-primary, #ffffff);
      padding: 20px; border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.6);
      border: 1px solid var(--accent, #0ea5e9); max-width: 320px;
      font-size: 1rem; text-align: center;
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      opacity: 0; display: none; pointer-events: auto;
    `;

    this.tooltip.innerHTML = `
      <div id="tutorial-text" style="margin-bottom: 20px; font-weight: 600; line-height: 1.5; font-size: 1.05rem;"></div>
      <div id="tutorial-hand" style="font-size: 3rem; position: absolute; text-shadow: 0 5px 15px rgba(0,0,0,0.5); z-index: 100000; pointer-events: none;">👇</div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
        <span id="tutorial-progress" style="font-size: 0.85rem; color: var(--text-secondary); font-weight: bold;"></span>
        <div>
          <button id="tutorial-skip" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; font-weight: bold; margin-right: 15px; padding: 8px;">Saltar</button>
          <button id="tutorial-next" style="background: var(--accent); border: none; color: white; cursor: pointer; font-size: 0.95rem; font-weight: bold; padding: 10px 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(14,165,233,0.3); transition: transform 0.2s;">Siguiente ➔</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes bounceHandUp { 0% { transform: translate(-50%, 0); } 100% { transform: translate(-50%, -15px); } }
      @keyframes bounceHandDown { 0% { transform: translate(-50%, 0); } 100% { transform: translate(-50%, 15px); } }
      #tutorial-next:active { transform: scale(0.95); }
      .tutorial-highlight-element { position: relative !important; z-index: 99997 !important; background: white !important; color: black !important; border-radius: 8px !important; }
    `;
    document.head.appendChild(style);

    document.body.appendChild(this.blocker);
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.tooltip);

    document.getElementById('tutorial-skip').addEventListener('click', () => this.end());
    document.getElementById('tutorial-next').addEventListener('click', () => this.next());
  }

  bindEvents() {
    window.addEventListener('resize', () => { if (this.isActive) this.updatePosition(); });
    window.addEventListener('scroll', () => { if (this.isActive) this.updatePosition(); });
  }

  start() {
    if (typeof navigateTo === 'function') navigateTo('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.currentStepIndex = 0;
    this.isActive = true;
    this.blocker.style.display = 'block';
    this.overlay.style.display = 'block';
    this.tooltip.style.display = 'block';
    
    setTimeout(() => {
      this.overlay.style.opacity = '1';
      this.tooltip.style.opacity = '1';
      this.showStep();
    }, 100);
  }

  end() {
    this.isActive = false;
    this.overlay.style.opacity = '0';
    this.tooltip.style.opacity = '0';
    
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    if (this.currentTarget) this.currentTarget.classList.remove('tutorial-highlight-element');

    setTimeout(() => {
      this.blocker.style.display = 'none';
      this.overlay.style.display = 'none';
      this.tooltip.style.display = 'none';
      if (typeof navigateTo === 'function') navigateTo('home');
    }, 400);

    localStorage.setItem('tutorialCompleted', 'true');
  }

  speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX'; // Preferimos acento latino si está disponible
    
    const voices = window.speechSynthesis.getVoices();
    
    // Buscar la voz más natural posible
    let bestVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('es')) || 
                    voices.find(v => v.lang.includes('es') && (v.name.includes('Sabina') || v.name.includes('Mia') || v.name.includes('Dalia') || v.name.includes('Paulina'))) ||
                    voices.find(v => v.lang.includes('es'));

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0; // Lo mantenemos en 1.0 para evitar que suene distorsionado o robótico
    window.speechSynthesis.speak(utterance);
  }

  next(stepId) {
    if (!this.isActive) return;
    
    const nextBtn = document.getElementById('tutorial-next');
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.innerText = 'Cargando...';
    }

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const currentStep = this.steps[this.currentStepIndex];
    if (currentStep && currentStep.onNext) currentStep.onNext();

    if (stepId) {
      this.currentStepIndex = this.steps.findIndex(s => s.id === stepId);
    } else {
      this.currentStepIndex++;
    }

    if (this.currentStepIndex >= this.steps.length) {
      this.end();
      this.speak("¡Tutorial completado! Ya estás listo para hacer tu primera recarga. Recuerda ser paciente, a veces los pedidos pueden demorar algunos minutos en procesarse.");
      this.showSuccessModal();
    } else {
      setTimeout(() => this.showStep(), 150);
    }
  }

  showSuccessModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
      display: flex; align-items: center; justify-content: center;
      z-index: 100000; opacity: 0; transition: opacity 0.4s;
    `;
    modal.innerHTML = `
      <div style="background: var(--bg-surface, #1e293b); border: 2px solid var(--accent, #0ea5e9); padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; transform: scale(0.8); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 20px 50px rgba(0,0,0,0.5); width: 90%;">
        <div style="font-size: 5rem; margin-bottom: 20px; animation: bounceHandDown 1s infinite alternate; text-shadow: 0 0 20px rgba(14,165,233,0.5);">🎉</div>
        <h2 style="color: var(--text-primary, #fff); margin-bottom: 15px; font-size: 1.8rem;">¡Tutorial Completado!</h2>
        <p style="color: var(--text-secondary, #cbd5e1); margin-bottom: 15px; font-size: 1.1rem; line-height: 1.5;">Ya estás listo para hacer tu primera recarga de forma rápida y segura.</p>
        <div style="background: rgba(14, 165, 233, 0.1); border-left: 4px solid var(--accent, #0ea5e9); padding: 12px; margin-bottom: 25px; text-align: left; font-size: 0.95rem; color: #e2e8f0; border-radius: 0 8px 8px 0; line-height: 1.4;">
          ⏳ <strong>Nota importante:</strong><br> Por favor sé paciente al realizar tus pedidos, en ocasiones las recargas pueden demorar algunos minutos en procesarse.
        </div>
        <button id="btn-tutorial-finish" style="background: var(--accent, #0ea5e9); color: white; border: none; padding: 14px 30px; border-radius: 12px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(14,165,233,0.4); width: 100%; transition: transform 0.2s;">¡Ir a recargar!</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.children[0].style.transform = 'scale(1)';
    }, 10);

    document.getElementById('btn-tutorial-finish').addEventListener('click', () => {
      modal.style.opacity = '0';
      modal.children[0].style.transform = 'scale(0.8)';
      setTimeout(() => modal.remove(), 400);
    });
  }

  showStep() {
    if (!this.isActive) return;
    const step = this.steps[this.currentStepIndex];

    this.waitForElement(step.targetSelector).then(target => {
      if (!this.isActive) return;
      this.currentTarget = target;
      
      this.tooltip.querySelector('#tutorial-text').innerText = step.text;
      this.tooltip.querySelector('#tutorial-progress').innerText = `Paso ${this.currentStepIndex + 1} / ${this.steps.length}`;

      const nextBtn = document.getElementById('tutorial-next');
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.innerHTML = 'Siguiente ➔';
      }

      if (step.onShow) step.onShow();
      
      this.speak(step.text);
      
      this.overlay.style.opacity = '1';
      this.tooltip.style.opacity = '1';
      
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        if (this.isActive) this.updatePosition();
      }, 350);
    });
  }

  waitForElement(selector) {
    return new Promise(resolve => {
      let attempts = 0;
      const check = () => {
        let el = null;
        if (selector === '.game-card') el = document.querySelectorAll('.game-card')[0];
        else if (selector === '.package-card') el = document.querySelectorAll('.package-card')[0];
        else if (selector === '.payment-option') el = document.querySelectorAll('.payment-option')[0];
        else el = document.querySelector(selector);
        
        if (el && el.offsetHeight > 0) {
          resolve(el);
        } else {
          attempts++;
          if (attempts < 20) setTimeout(check, 200);
          else console.warn('Tutorial: Element not found ' + selector);
        }
      };
      check();
    });
  }

  updatePosition() {
    if (!this.currentTarget || !this.isActive) return;

    const rect = this.currentTarget.getBoundingClientRect();
    const padding = 12;
    
    this.overlay.style.top = (rect.top - padding) + 'px';
    this.overlay.style.left = (rect.left - padding) + 'px';
    this.overlay.style.width = (rect.width + padding * 2) + 'px';
    this.overlay.style.height = (rect.height + padding * 2) + 'px';

    const step = this.steps[this.currentStepIndex];
    const hand = document.getElementById('tutorial-hand');
    const tooltipRect = this.tooltip.getBoundingClientRect();
    
    let tooltipTop, tooltipLeft;
    let handMode = step.handPos || 'bottom';

    // Decide if we need to flip the tooltip to fit on screen
    if (handMode === 'bottom') {
      tooltipTop = rect.top - tooltipRect.height - padding - 45;
      if (tooltipTop < 15) { // Too high, flip to below
        tooltipTop = rect.bottom + padding + 45;
        handMode = 'top';
      }
    } else {
      tooltipTop = rect.bottom + padding + 45;
      if (tooltipTop + tooltipRect.height > window.innerHeight - 15) { // Too low, flip to above
        tooltipTop = rect.top - tooltipRect.height - padding - 45;
        handMode = 'bottom';
      }
    }

    tooltipLeft = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    
    // Constrain tooltip horizontally
    if (tooltipLeft < 15) tooltipLeft = 15;
    if (tooltipLeft + tooltipRect.width > window.innerWidth - 15) tooltipLeft = window.innerWidth - tooltipRect.width - 15;

    this.tooltip.style.top = tooltipTop + 'px';
    this.tooltip.style.left = tooltipLeft + 'px';

    // Position hand relative to tooltip
    hand.style.left = '50%';
    if (handMode === 'bottom') {
      hand.style.top = '100%';
      hand.style.bottom = 'auto';
      hand.innerText = '👇';
      hand.style.animation = 'bounceHandDown 1s infinite alternate';
    } else {
      hand.style.top = 'auto';
      hand.style.bottom = '100%';
      hand.innerText = '👆';
      hand.style.animation = 'bounceHandUp 1s infinite alternate';
    }
  }
}

window.Tutorial = new WalkthroughTutorial();

window.addEventListener('load', () => {
  setTimeout(() => {
    if (!localStorage.getItem('tutorialCompleted') && (window.location.pathname === '/' || window.location.pathname.includes('index'))) {
      window.Tutorial.start();
    }
  }, 2500); 
});
