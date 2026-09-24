/**
 * Dice Party - UI Controller & Event Handling
 */

document.addEventListener('DOMContentLoaded', () => {
  const game = new window.DiceGame();
  const dice3d = new window.Dice3DSystem();
  const sound = window.soundSystem;

  // DOM Elements
  const elCoins = document.getElementById('coin-value');
  const elTickets = document.getElementById('ticket-value');
  const elMilestoneBar = document.getElementById('milestone-bar');
  const elMilestoneText = document.getElementById('milestone-text');
  const elSystemScore = document.getElementById('system-score');
  const elPlayerScore = document.getElementById('player-score');
  const btnRoll = document.getElementById('btn-roll');
  const btnRollText = document.getElementById('btn-roll-text');
  const btnRollSub = document.getElementById('btn-roll-sub');
  const elResultBanner = document.getElementById('result-splash-banner');
  const elResultBadge = document.getElementById('result-badge');
  const elResultSub = document.getElementById('result-subtext');
  const mascotSystem = document.getElementById('mascot-system-img');
  const mascotPlayer = document.getElementById('mascot-player-img');

  // Milestone Rewards Pass Elements
  const milestoneWidget = document.getElementById('milestone-widget');
  const milestoneClaimDot = document.getElementById('milestone-claim-dot');
  const modalMilestoneRewards = document.getElementById('modal-milestone-rewards');
  const passCoinVal = document.getElementById('pass-coin-val');
  const passTicketVal = document.getElementById('pass-ticket-val');
  const passProgressText = document.getElementById('pass-progress-text');
  const passProgressFill = document.getElementById('pass-progress-fill');
  const passProgressMascot = document.getElementById('pass-progress-mascot');
  const passUnifiedScroller = document.getElementById('pass-unified-scroller');
  const premiumTrackSlots = document.getElementById('premium-track-slots');
  const freeTrackSlots = document.getElementById('free-track-slots');
  const premiumLockedOverlay = document.getElementById('premium-locked-overlay');
  const btnUnlockPremium = document.getElementById('btn-unlock-premium');
  const btnUnlockText = document.getElementById('btn-unlock-text');
  const btnPassPrev = document.getElementById('btn-pass-prev');
  const btnPassNext = document.getElementById('btn-pass-next');
  const btnPassAddTicket = document.getElementById('btn-pass-add-ticket');

  // Modals
  const modalShop = document.getElementById('modal-shop');
  const modalHistory = document.getElementById('modal-history');
  const modalHelp = document.getElementById('modal-help');
  const modalHome = document.getElementById('modal-home');
  const modalLastChancePromo = document.getElementById('modal-last-chance-promo');
  const historyTableBody = document.getElementById('history-table-body');
  const devPanel = document.getElementById('dev-panel');
  const toastMsg = document.getElementById('toast-msg');

  // Last-Chance Promo Elements
  const btnPromoLastChance = document.getElementById('btn-promo-lastchance');
  const saleBadgeTimer = document.getElementById('sale-badge-timer');
  const promoTimerCountdown = document.getElementById('promo-timer-countdown');
  const promoStatusText = document.getElementById('promo-status-text');
  const promoOriginalStrike = document.getElementById('promo-original-strike');
  const btnPromoBuyDeal = document.getElementById('btn-promo-buy-deal');
  const promoBuyDealText = document.getElementById('promo-buy-deal-text');
  const promoDetailNote = document.getElementById('promo-detail-note');

  let isRolling = false;

  // ==========================================
  // UI Render Functions
  // ==========================================
  function updateUI() {
    elCoins.textContent = game.state.coins.toLocaleString();
    elTickets.textContent = game.state.tickets.toLocaleString();

    // Milestone Progress
    const wins = game.state.milestoneWins;
    const target = game.state.milestoneTarget;
    const pct = Math.min(100, Math.round((wins / target) * 100));
    elMilestoneBar.style.width = `${pct}%`;
    elMilestoneText.textContent = `${Math.min(target, wins)} / ${target}`;

    // Notification Dot on Milestone Rewards button if there are unclaimed rewards
    if (game.hasUnclaimedMilestone()) {
      milestoneClaimDot.style.display = 'flex';
    } else {
      milestoneClaimDot.style.display = 'none';
    }

    // Roll button mode (always uses the classic orange-gold frame)
    if (game.state.freeRollActive) {
      btnRollText.textContent = 'ทอยฟรี';
      btnRollSub.textContent = 'ไม่ต้องใช้ทิกเก็ต';
    } else {
      btnRollText.textContent = 'ทอย';
      btnRollSub.textContent = 'ใช้ 1 ทิกเก็ต';
    }

    // Update modal if currently visible
    if (modalMilestoneRewards && modalMilestoneRewards.classList.contains('active')) {
      renderMilestoneRewards();
    }
    if (modalLastChancePromo && modalLastChancePromo.classList.contains('active')) {
      renderLastChanceModal();
    }
  }

  // Live Event Countdown Timer (starts at 71:59:59)
  let promoSecondsLeft = 71 * 3600 + 59 * 60 + 59;
  function updatePromoTimer() {
    if (promoSecondsLeft > 0) {
      promoSecondsLeft--;
    }
    const h = Math.floor(promoSecondsLeft / 3600);
    const m = Math.floor((promoSecondsLeft % 3600) / 60);
    const s = promoSecondsLeft % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (saleBadgeTimer) saleBadgeTimer.textContent = timeStr;
    if (promoTimerCountdown) promoTimerCountdown.textContent = timeStr;
  }
  setInterval(updatePromoTimer, 1000);
  updatePromoTimer();

  function renderLastChanceModal() {
    const priceInfo = game.calculateLastChancePrice();
    const remaining = priceInfo.remainingSteps;

    if (game.state.milestoneWins >= 50) {
      promoStatusText.innerHTML = `“ยินดีด้วย! คุณปลดล็อกครบ 50 ขั้นแล้ว เข้าไปกดรับรางวัลใน Milestone Reward ได้เลย”`;
      promoOriginalStrike.style.display = 'none';
      btnPromoBuyDeal.disabled = true;
      btnPromoBuyDeal.classList.remove('require-premium');
      btnPromoBuyDeal.classList.add('purchased-state');
      promoBuyDealText.textContent = 'ปลดล็อกครบ 50 ขั้นแล้ว ✓';
      promoDetailNote.textContent = 'เข้าไปกดรับของรางวัลทั้งหมดในหน้าต่าง Milestone Reward ได้ทันที!';
    } else if (!game.state.isPremiumUnlocked) {
      // Must unlock Premium 369 THB first!
      promoStatusText.innerHTML = `“คุณยังขาดอีก <span id="promo-missing-count" class="promo-highlight-count">${remaining}</span> ขั้นเพื่อรับกรอบโปรไฟล์ถาวร”`;
      promoOriginalStrike.style.display = 'inline-block';
      promoOriginalStrike.textContent = `${priceInfo.originalPrice} บาท`;
      btnPromoBuyDeal.disabled = false;
      btnPromoBuyDeal.classList.remove('purchased-state');
      btnPromoBuyDeal.classList.add('require-premium');
      promoBuyDealText.innerHTML = '🔒 ปลดล็อก Premium 369 THB ก่อน ✨';
      promoDetailNote.innerHTML = '<span style="color: #be185d; font-weight: bold;">⚠️ เฉพาะผู้ที่ปลดล็อก Premium 369 THB จึงจะสามารถเหมาได้</span>';
    } else {
      // Premium unlocked, can buy bundle!
      promoStatusText.innerHTML = `“คุณยังขาดอีก <span id="promo-missing-count" class="promo-highlight-count">${remaining}</span> ขั้นเพื่อรับกรอบโปรไฟล์ถาวร”`;
      promoOriginalStrike.style.display = 'inline-block';
      promoOriginalStrike.textContent = `${priceInfo.originalPrice} บาท`;
      btnPromoBuyDeal.disabled = false;
      btnPromoBuyDeal.classList.remove('purchased-state');
      btnPromoBuyDeal.classList.remove('require-premium');
      promoBuyDealText.textContent = `เหมาเลย ${priceInfo.promoPrice} บาท`;
      promoDetailNote.textContent = 'เหมาของรางวัลทั้งหมดที่เหลือจนถึงขั้นที่ 50 ทันที!';
    }
  }

  function showToast(text, durationMs = 2200) {
    toastMsg.textContent = text;
    toastMsg.classList.add('show');
    setTimeout(() => {
      toastMsg.classList.remove('show');
    }, durationMs);
  }

  function openModal(modal) {
    sound.playClick();
    modal.classList.add('active');
  }

  function closeModal(modal) {
    sound.playClick();
    modal.classList.remove('active');
  }

  // ==========================================
  // Number Flicker Animation (Suspense)
  // ==========================================
  function animateScoreFlicker(element, targetScore, durationMs = 800) {
    return new Promise((resolve) => {
      element.classList.add('rolling');
      const startTime = performance.now();
      const interval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        if (elapsed < durationMs) {
          element.textContent = Math.floor(Math.random() * 12) + 1;
        } else {
          clearInterval(interval);
          element.textContent = targetScore;
          element.classList.remove('rolling');
          resolve();
        }
      }, 70);
    });
  }

  // ==========================================
  // Core Roll Duel Execution
  // ==========================================
  async function handleRoll() {
    if (isRolling) return;

    // Check Ticket
    if (!game.canRoll()) {
      showToast('⚠️ ตั๋วหมดแล้ว! กรุณาซื้อตั๋วเพิ่มในร้านค้า');
      sound.playLose();
      openModal(modalShop);
      return;
    }

    isRolling = true;
    btnRoll.disabled = true;
    sound.playClick();

    // Hide previous result banner
    elResultBanner.classList.remove('show');

    // Execute duel logic
    const duel = game.executeDuel();
    // Only update ticket display immediately; keep button text until animation finishes!
    elTickets.textContent = game.state.tickets.toLocaleString();

    // Animate Mascots
    mascotSystem.classList.add('active-cheer');
    mascotPlayer.classList.add('active-cheer');

    // Partition Player's score for 3D visual dice
    const playerDice = Dice3DSystem.partitionScore(duel.playerScore);

    // Step 1: System, Player score flickers, and 3D Dice all roll simultaneously and stop together!
    const ROLL_DURATION = 1000;
    await Promise.all([
      animateScoreFlicker(elSystemScore, duel.systemScore, ROLL_DURATION),
      animateScoreFlicker(elPlayerScore, duel.playerScore, ROLL_DURATION),
      dice3d.rollDice(playerDice.d1, playerDice.d2, ROLL_DURATION)
    ]);

    mascotSystem.classList.remove('active-cheer');
    mascotPlayer.classList.remove('active-cheer');

    // Brief 250ms pause so the player sees the locked numbers before the result banner appears
    await new Promise(r => setTimeout(r, 250));

    // Step 3: Present Resolution
    if (duel.result === 'WIN') {
      sound.playWin();
      dice3d.spawnConfetti(90);
      elResultBadge.className = 'result-badge win';
      elResultBadge.textContent = 'ชนะ';
      if (duel.wasPityWin) {
        elResultSub.textContent = 'แต้มสูงกว่าเผือก Milestone +1';
        showToast('🛡️ บังคับชนะเมื่อแพ้ติดกันครบ 4 ครั้ง!');
      } else {
        elResultSub.textContent = 'แต้มสูงกว่าเผือก Milestone +1';
      }
      elResultBanner.classList.add('show');
    } else if (duel.result === 'LOSE') {
      sound.playLose();
      elResultBadge.className = 'result-badge lose';
      elResultBadge.textContent = 'แพ้';
      if (duel.consecutiveLosses >= 4) {
        elResultSub.textContent = 'แพ้ติดกัน 4 ครั้งแล้ว! ครั้งถัดไปการันตีชนะแน่นอน 🎲';
        showToast('🛡️ แพ้ติดกันครบ 4 ครั้งแล้ว! ครั้งถัดไปจะบังคับชนะทันที');
      } else if (duel.consecutiveLosses > 1) {
        elResultSub.textContent = `แต้มน้อยกว่าเผือก ลองใหม่อีกครั้ง`;
      } else {
        elResultSub.textContent = 'แต้มน้อยกว่าเผือก ลองใหม่อีกครั้ง';
      }
      elResultBanner.classList.add('show');
    } else {
      // DRAW -> Free Roll!
      sound.playDraw();
      elResultBadge.className = 'result-badge draw';
      elResultBadge.textContent = 'เสมอ';
      elResultSub.textContent = 'แต้มเท่ากับเผือก ทอยฟรี 1 ครั้ง';
      elResultBanner.classList.add('show');
    }

    updateUI();

    isRolling = false;
    btnRoll.disabled = false;
  }

  // ==========================================
  // Milestone Rewards Dual-Track Pass Rendering
  // ==========================================
  function renderMilestoneRewards() {
    passCoinVal.textContent = game.state.coins.toLocaleString();
    passTicketVal.textContent = game.state.tickets.toLocaleString();

    const wins = Math.min(50, game.state.milestoneWins);
    passProgressText.textContent = `MILESTONE PROGRESS: ${wins} / 50`;
    const pct = Math.min(100, Math.round((wins / 50) * 100));
    passProgressFill.style.width = `${pct}%`;
    passProgressMascot.style.left = `calc(${Math.max(2, Math.min(96, pct))}% - 12px)`;

    // Handle Premium lock status
    if (game.state.isPremiumUnlocked) {
      premiumLockedOverlay.classList.add('unlocked');
      btnUnlockPremium.classList.add('unlocked-state');
      btnUnlockText.textContent = 'ปลดล็อกแล้ว (ACTIVE) ✓';
    } else {
      premiumLockedOverlay.classList.remove('unlocked');
      btnUnlockPremium.classList.remove('unlocked-state');
      btnUnlockText.textContent = 'ปลดล็อก Premium 369 THB';
    }

    // Helper for reliable cross-platform reward icons (renders beautiful SVG chips on any OS)
    const getRewardIcon = (item) => {
      if (item.type === 'chips') {
        return `<svg class="chip-stack-icon" viewBox="0 0 32 32">
          <ellipse cx="16" cy="23" rx="13" ry="4.5" fill="#7f1d1d"/>
          <ellipse cx="16" cy="21" rx="13" ry="4.5" fill="#dc2626"/>
          <ellipse cx="16" cy="21" rx="10" ry="3" fill="none" stroke="#fca5a5" stroke-dasharray="3,2.5" stroke-width="1.2"/>
          
          <ellipse cx="16" cy="17" rx="13" ry="4.5" fill="#991b1b"/>
          <ellipse cx="16" cy="15" rx="13" ry="4.5" fill="#ef4444"/>
          <ellipse cx="16" cy="15" rx="10" ry="3" fill="none" stroke="#fecaca" stroke-dasharray="3,2.5" stroke-width="1.2"/>
          
          <ellipse cx="16" cy="11" rx="13" ry="4.5" fill="#b91c1c"/>
          <ellipse cx="16" cy="9" rx="13" ry="4.5" fill="#f87171"/>
          <ellipse cx="16" cy="9" rx="10" ry="3" fill="none" stroke="#ffffff" stroke-dasharray="3,2.5" stroke-width="1.4"/>
          <ellipse cx="16" cy="9" rx="5" ry="1.8" fill="#dc2626"/>
        </svg>`;
      }
      if (item.icon === '🪙') {
        return `<img src="assets/images/icon_coin.png" alt="Coin" class="slot-coin-img">`;
      }
      return item.icon;
    };

    // Render Premium Track Slots (10 Milestones)
    premiumTrackSlots.innerHTML = DiceGame.MILESTONES.map(m => {
      const reached = game.state.milestoneWins >= m.wins;
      const claimed = game.isMilestoneClaimed('premium', m.wins);
      const canClaim = game.canClaimMilestone('premium', m.wins);
      const isBonus = m.premium.name.includes('โบนัส');
      const bonusMatch = m.premium.name.match(/\+(\d+[%kKmM]+)/);
      const bonusText = bonusMatch ? `+${bonusMatch[1]}` : (isBonus ? '+โบนัส' : '');

      let statusHtml = '';
      if (claimed) {
        statusHtml = `<span class="slot-status-badge claimed">✓ รับแล้ว</span>`;
      } else if (canClaim) {
        statusHtml = `<button class="btn-claim-slot" data-track="premium" data-wins="${m.wins}">กดรับ</button>`;
      } else if (!game.state.isPremiumUnlocked) {
        statusHtml = `<span class="slot-status-badge locked">🔒 ล็อค</span>`;
      } else {
        statusHtml = `<span class="slot-status-badge locked">🔒 ${m.wins} ชนะ</span>`;
      }

      return `
        <div class="pass-slot-card premium-slot ${canClaim ? 'is-current' : ''}">
          <div class="slot-icon">${getRewardIcon(m.premium)}</div>
          <div class="slot-label" title="${m.premium.name}">${m.premium.label}</div>
          ${bonusText ? `<div class="slot-bonus-tag">${bonusText}</div>` : ''}
          ${statusHtml}
        </div>
      `;
    }).join('');

    // Render Free Track Slots (10 Milestones)
    freeTrackSlots.innerHTML = DiceGame.MILESTONES.map(m => {
      const reached = game.state.milestoneWins >= m.wins;
      const claimed = game.isMilestoneClaimed('free', m.wins);
      const canClaim = game.canClaimMilestone('free', m.wins);

      let statusHtml = '';
      if (claimed) {
        statusHtml = `<span class="slot-status-badge claimed">✓ รับแล้ว</span>`;
      } else if (canClaim) {
        statusHtml = `<button class="btn-claim-slot" data-track="free" data-wins="${m.wins}">กดรับ</button>`;
      } else if (m.free.timed) {
        statusHtml = `<span class="slot-status-badge timed">${m.free.timed}</span>`;
      } else {
        statusHtml = `<span class="slot-status-badge locked">🔒 ${m.wins} ชนะ</span>`;
      }

      return `
        <div class="pass-slot-card free-slot ${canClaim ? 'is-current' : ''}">
          <div class="slot-milestone-marker">${m.wins}</div>
          <div class="slot-icon">${getRewardIcon(m.free)}</div>
          <div class="slot-label" title="${m.free.name}">${m.free.label}</div>
          ${statusHtml}
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // History Rendering
  // ==========================================
  function renderHistory() {
    if (!game.state.history.length) {
      historyTableBody.innerHTML = `<tr><td colspan="4" class="empty-history">ยังไม่มีประวัติการดวล กดทอยเต๋าเพื่อเริ่มเล่น!</td></tr>`;
      return;
    }

    historyTableBody.innerHTML = game.state.history.map(item => {
      let badgeClass = item.result === 'WIN' ? 'win' : (item.result === 'LOSE' ? 'lose' : 'draw');
      let resultText = item.result === 'WIN' ? 'ชนะ' : (item.result === 'LOSE' ? 'แพ้' : 'เสมอ (Free Roll)');
      return `
        <tr>
          <td>#${item.round}</td>
          <td><strong style="color: #ffda79;">${item.systemScore}</strong></td>
          <td><strong style="color: #ffccd5;">${item.playerScore}</strong></td>
          <td><span class="history-result-badge ${badgeClass}">${resultText}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================
  // Event Listeners
  // ==========================================
  btnRoll.addEventListener('click', handleRoll);

  // Top Bar buttons
  document.getElementById('btn-add-ticket').addEventListener('click', () => openModal(modalShop));
  btnPassAddTicket.addEventListener('click', () => openModal(modalShop));

  document.getElementById('btn-sound-toggle').addEventListener('click', (e) => {
    const isAudioOn = sound.toggle();
    e.currentTarget.textContent = isAudioOn ? '🔊' : '🔇';
    showToast(isAudioOn ? 'เปิดเสียงแล้ว' : 'ปิดเสียงแล้ว');
  });
  document.getElementById('btn-home').addEventListener('click', () => openModal(modalHome));

  // Milestone Widget (Click to open Milestone Rewards & Battle Pass modal)
  milestoneWidget.addEventListener('click', () => {
    sound.playClick();
    renderMilestoneRewards();
    openModal(modalMilestoneRewards);
  });

  document.getElementById('btn-history').addEventListener('click', () => {
    renderHistory();
    openModal(modalHistory);
  });

  document.getElementById('btn-help').addEventListener('click', () => openModal(modalHelp));

  // Modal Close Buttons
  document.querySelectorAll('.btn-modal-close, .modal-close-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) closeModal(modal);
    });
  });

  // Shop Buys
  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      const tickets = parseInt(btn.dataset.tickets, 10);
      const cost = parseInt(btn.dataset.cost, 10);
      const res = game.buyTickets(tickets, cost);
      if (res.success) {
        sound.playCoin();
        updateUI();
        showToast(`🎉 ซื้อตั๋วสำเร็จ +${tickets} ใบ!`);
      } else {
        sound.playLose();
        showToast(`❌ ${res.message}`);
      }
    });
  });

  document.getElementById('btn-free-refill').addEventListener('click', () => {
    sound.playCoin();
    game.refillFree(5);
    updateUI();
    showToast('🎁 เติมตั๋วฟรีสำหรับทดสอบ +5 ใบเรียบร้อย!');
  });

  // Claim Milestone Reward Slot
  document.addEventListener('click', (e) => {
    const claimBtn = e.target.closest('.btn-claim-slot');
    if (!claimBtn) return;

    const track = claimBtn.dataset.track;
    const wins = parseInt(claimBtn.dataset.wins, 10);

    const reward = game.claimMilestone(track, wins);
    if (reward) {
      sound.playCoin();
      dice3d.spawnConfetti(70);
      showToast(`🎉 ได้รับรางวัล: ${reward.name}!`);
      updateUI();
      renderMilestoneRewards();
    }
  });

  // Unlock Premium Button (369 THB)
  btnUnlockPremium.addEventListener('click', () => {
    if (game.state.isPremiumUnlocked) {
      sound.playClick();
      showToast('🌟 คุณปลดล็อกสิทธิ์ Premium Track เรียบร้อยแล้ว!');
      return;
    }

    sound.playSpecialPack();
    dice3d.spawnConfetti(140);
    game.unlockPremium();
    updateUI();
    renderMilestoneRewards();
    showToast('👑 ปลดล็อก Premium Pass สำเร็จ! (369 THB) โซ่และแม่กุญแจถูกปลดออกแล้ว!');
  });

  // ==========================================
  // Ultra-Smooth Pass Scroller (Wheel, Drag & Buttons)
  // ==========================================
  btnPassPrev.addEventListener('click', () => {
    sound.playClick();
    passUnifiedScroller.scrollBy({ left: -240, behavior: 'smooth' });
  });

  btnPassNext.addEventListener('click', () => {
    sound.playClick();
    passUnifiedScroller.scrollBy({ left: 240, behavior: 'smooth' });
  });

  // Smooth Mouse Wheel -> Horizontal Scroll
  passUnifiedScroller.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      passUnifiedScroller.scrollLeft += e.deltaY * 0.9;
    }
  }, { passive: false });

  // Native-feel Drag to Scroll (Mouse & Pointer)
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;

  passUnifiedScroller.addEventListener('mousedown', (e) => {
    // Avoid interfering with claim button clicks
    if (e.target.closest('.btn-claim-slot, button')) return;
    isDragging = true;
    dragStartX = e.pageX - passUnifiedScroller.offsetLeft;
    dragStartScrollLeft = passUnifiedScroller.scrollLeft;
    passUnifiedScroller.style.scrollBehavior = 'auto'; // Instant during manual drag
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      passUnifiedScroller.style.scrollBehavior = 'smooth';
    }
  });

  passUnifiedScroller.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - passUnifiedScroller.offsetLeft;
    const walk = (x - dragStartX) * 1.3;
    passUnifiedScroller.scrollLeft = dragStartScrollLeft - walk;
  });

  // Reset Game Button (In Home modal)
  document.getElementById('btn-reset-game').addEventListener('click', () => {
    sound.playClick();
    if (confirm('คุณต้องการรีเซ็ตข้อมูลและคะแนนทั้งหมดของเกมหรือไม่?')) {
      game.resetAll();
      elSystemScore.textContent = '0';
      elPlayerScore.textContent = '0';
      elResultBanner.classList.remove('show');
      updateUI();
      closeModal(modalHome);
      showToast('🔄 รีเซ็ตข้อมูลเกมกลับสู่ค่าเริ่มต้นแล้ว');
    }
  });

  // Dev Tools Toggle & Actions
  const devToggleBtn = document.getElementById('btn-dev-toggle');
  devToggleBtn.addEventListener('click', () => {
    devPanel.classList.toggle('open');
  });

  document.getElementById('dev-toggle-premium').addEventListener('click', () => {
    game.state.isPremiumUnlocked = !game.state.isPremiumUnlocked;
    game.saveState();
    updateUI();
    renderMilestoneRewards();
    showToast(`👑 Dev: Premium status is now -> ${game.state.isPremiumUnlocked ? 'UNLOCKED' : 'LOCKED'}`);
  });

  document.getElementById('dev-reset-milestone-wins').addEventListener('click', () => {
    game.state.milestoneWins = 0;
    game.state.claimedFreeMilestones = [];
    game.state.claimedPremiumMilestones = [];
    game.saveState();
    updateUI();
    renderMilestoneRewards();
    showToast('🔄 Dev: Reset milestone wins to 0 and cleared claims!');
  });

  document.getElementById('dev-add-10wins').addEventListener('click', () => {
    game.state.milestoneWins += 10;
    game.saveState();
    updateUI();
    showToast('⚙️ Dev: +10 Wins Milestone Added!');
  });

  document.getElementById('dev-set-49wins').addEventListener('click', () => {
    game.state.milestoneWins = 49;
    game.saveState();
    updateUI();
    showToast('⚙️ Dev: Milestone set to 49! ทอยชนะอีก 1 ครั้งเพื่อครบ 50 ชนะ!');
  });

  document.getElementById('dev-force-win').addEventListener('click', () => {
    game.state.forcedOutcome = 'win';
    showToast('⚙️ Dev: สั่งล็อคผลตาถัดไปให้ -> WIN');
  });

  document.getElementById('dev-force-draw').addEventListener('click', () => {
    game.state.forcedOutcome = 'draw';
    showToast('⚙️ Dev: สั่งล็อคผลตาถัดไปให้ -> DRAW (เสมอเพื่อ Free Roll)');
  });

  document.getElementById('dev-force-lose').addEventListener('click', () => {
    game.state.forcedOutcome = 'lose';
    showToast('⚙️ Dev: สั่งล็อคผลตาถัดไปให้ -> LOSE');
  });

  const devSim4Losses = document.getElementById('dev-sim-4losses');
  if (devSim4Losses) {
    devSim4Losses.addEventListener('click', () => {
      game.state.consecutiveLosses = 4;
      game.saveState();
      showToast('🛡️ Dev: จำลองแพ้ติดกัน 4 ครั้งแล้ว! กดทอยครั้งถัดไปจะบังคับชนะทันที');
    });
  }

  document.getElementById('dev-add-tickets').addEventListener('click', () => {
    game.state.tickets += 10;
    game.saveState();
    updateUI();
    showToast('⚙️ Dev: +10 Tickets Added');
  });

  document.getElementById('dev-add-coins').addEventListener('click', () => {
    game.addCoins(5000);
    updateUI();
    showToast('⚙️ Dev: +5,000 Coins Added');
  });

  document.getElementById('dev-close').addEventListener('click', () => {
    devPanel.classList.remove('open');
  });

  // Last-Chance Promo Button (Sale Badge)
  if (btnPromoLastChance) {
    btnPromoLastChance.addEventListener('click', () => {
      sound.playClick();
      renderLastChanceModal();
      openModal(modalLastChancePromo);
    });
  }

  // Last-Chance Promo Buy Button
  if (btnPromoBuyDeal) {
    btnPromoBuyDeal.addEventListener('click', () => {
      if (game.state.milestoneWins >= 50) {
        showToast('🌟 คุณสะสมของรางวัลครบ 50 ขั้นเรียบร้อยแล้ว!');
        return;
      }

      // Must have unlocked Premium 369 THB first!
      if (!game.state.isPremiumUnlocked) {
        sound.playLose();
        showToast('🔒 ต้องปลดล็อก Premium 369 THB ก่อน จึงจะสามารถใช้สิทธิ์เหมา 199 บาทได้!');
        closeModal(modalLastChancePromo);
        setTimeout(() => {
          renderMilestoneRewards();
          openModal(modalMilestoneRewards);
        }, 280);
        return;
      }

      sound.playSpecialPack();
      dice3d.spawnConfetti(160);
      const res = game.purchaseLastChanceBundle();
      if (res.success) {
        updateUI();
        renderLastChanceModal();
        showToast(`🎉 เหมาสำเร็จ! (${res.price} บาท) ปลดล็อกครบ 50 ขั้นแล้ว เข้าไปกดรับรางวัลใน Milestone Reward ได้เลย!`, 3500);
        closeModal(modalLastChancePromo);
        setTimeout(() => {
          renderMilestoneRewards();
          openModal(modalMilestoneRewards);
        }, 320);
      }
    });
  }

  // Dev Tools: Last-Chance Simulation Tools
  const devOpenLastChance = document.getElementById('dev-open-lastchance');
  if (devOpenLastChance) {
    devOpenLastChance.addEventListener('click', () => {
      renderLastChanceModal();
      openModal(modalLastChancePromo);
      showToast('🎁 Dev: เปิด Pop-up ข้อเสนอโค้งสุดท้าย');
    });
  }

  const devSimMissing8 = document.getElementById('dev-sim-missing-8');
  if (devSimMissing8) {
    devSimMissing8.addEventListener('click', () => {
      game.state.isPremiumUnlocked = true;
      game.state.milestoneWins = 3; // 8 steps remaining (5, 10, 15, 20, 25, 30, 40, 50)
      game.state.claimedFreeMilestones = [1, 3];
      game.state.claimedPremiumMilestones = [1, 3];
      game.saveState();
      updateUI();
      renderLastChanceModal();
      openModal(modalLastChancePromo);
      showToast('✨ Dev: จำลอง Premium + ขาด 8 ขั้น (Wins=3, เหมา 199.-)');
    });
  }

  const devSimMissing10 = document.getElementById('dev-sim-missing-10');
  if (devSimMissing10) {
    devSimMissing10.addEventListener('click', () => {
      game.state.isPremiumUnlocked = true;
      game.state.milestoneWins = 0; // 10 steps remaining
      game.state.claimedFreeMilestones = [];
      game.state.claimedPremiumMilestones = [];
      game.saveState();
      updateUI();
      renderLastChanceModal();
      openModal(modalLastChancePromo);
      showToast('✨ Dev: จำลอง Premium + ขาด 10 ขั้น (Wins=0, เหมา 199.-)');
    });
  }

  const devSimCompleted = document.getElementById('dev-sim-completed');
  if (devSimCompleted) {
    devSimCompleted.addEventListener('click', () => {
      game.state.isPremiumUnlocked = true;
      game.state.milestoneWins = 50;
      game.saveState();
      updateUI();
      renderLastChanceModal();
      openModal(modalLastChancePromo);
      showToast('🏁 Dev: จำลอง ผู้เล่นครบ 50 ขั้นแล้ว');
    });
  }

  // Auto-popup for eligible players (Premium 369 bought, within 3 days, milestone < 50)
  if (game.isLastChanceEligible() && !sessionStorage.getItem('last_chance_promo_popup_shown')) {
    setTimeout(() => {
      sessionStorage.setItem('last_chance_promo_popup_shown', 'true');
      renderLastChanceModal();
      openModal(modalLastChancePromo);
    }, 1200);
  }

  // Initial render
  updateUI();
});
