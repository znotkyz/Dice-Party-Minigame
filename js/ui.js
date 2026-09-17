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

  // Modals
  const modalShop = document.getElementById('modal-shop');
  const modalSpecialPack = document.getElementById('modal-special-pack');
  const modalHistory = document.getElementById('modal-history');
  const modalHelp = document.getElementById('modal-help');
  const modalHome = document.getElementById('modal-home');
  const historyTableBody = document.getElementById('history-table-body');
  const devPanel = document.getElementById('dev-panel');
  const toastMsg = document.getElementById('toast-msg');

  let isRolling = false;

  // ==========================================
  // UI Render Functions
  // ==========================================
  function updateUI() {
    elCoins.textContent = game.state.coins.toLocaleString();
    elTickets.textContent = game.state.tickets;

    // Milestone Progress
    const wins = game.state.milestoneWins;
    const target = game.state.milestoneTarget;
    const pct = Math.min(100, Math.round((wins / target) * 100));
    elMilestoneBar.style.width = `${pct}%`;
    elMilestoneText.textContent = `${wins} / ${target}`;

    // Roll button mode (always uses the classic orange-gold frame)
    if (game.state.freeRollActive) {
      btnRollText.textContent = 'ทอยฟรี';
      btnRollSub.textContent = 'ไม่ต้องใช้ทิกเก็ต';
    } else {
      btnRollText.textContent = 'ทอย';
      btnRollSub.textContent = 'ใช้ 1 ทิกเก็ต';
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
    elTickets.textContent = game.state.tickets;

    // Animate Mascots
    mascotSystem.classList.add('active-cheer');
    mascotPlayer.classList.add('active-cheer');

    // Partition Player's score for 3D visual dice
    const playerDice = Dice3DSystem.partitionScore(duel.playerScore);

    // Step 1: System, Player score flickers, and 3D Dice all roll simultaneously and stop together!
    const ROLL_DURATION = 1200;
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
      elResultSub.textContent = 'แต้มสูงกว่าเผือก Milestone +1';
      elResultBanner.classList.add('show');
    } else if (duel.result === 'LOSE') {
      sound.playLose();
      elResultBadge.className = 'result-badge lose';
      elResultBadge.textContent = 'แพ้';
      elResultSub.textContent = 'แต้มน้อยกว่าเผือก ลองใหม่อีกครั้ง';
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

    // Step 4: Check Milestone 50 trigger
    if (duel.unlockedSpecialPack) {
      setTimeout(() => {
        sound.playSpecialPack();
        dice3d.spawnConfetti(150);
        openModal(modalSpecialPack);
      }, 900);
    }

    isRolling = false;
    btnRoll.disabled = false;
  }

  // ==========================================
  // History Rendering
  // ==========================================
  function renderHistory() {
    if (!game.state.history.length) {
      historyTableBody.innerHTML = `<tr><td colspan="5" class="empty-history">ยังไม่มีประวัติการดวล กดทอยเต๋าเพื่อเริ่มเล่น!</td></tr>`;
      return;
    }

    historyTableBody.innerHTML = game.state.history.map(item => {
      let badgeClass = item.result === 'WIN' ? 'win' : (item.result === 'LOSE' ? 'lose' : 'draw');
      let resultText = item.result === 'WIN' ? 'ชนะ' : (item.result === 'LOSE' ? 'แพ้' : 'เสมอ (Free Roll)');
      let rewardText = item.result === 'WIN' ? 'Milestone +1' : (item.result === 'DRAW' ? 'Free Roll' : '-');
      return `
        <tr>
          <td>#${item.round}</td>
          <td><strong style="color: #ffda79;">${item.systemScore}</strong></td>
          <td><strong style="color: #ffccd5;">${item.playerScore}</strong></td>
          <td><span class="history-result-badge ${badgeClass}">${resultText}</span></td>
          <td>${rewardText}</td>
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
  document.getElementById('btn-sound-toggle').addEventListener('click', (e) => {
    const isAudioOn = sound.toggle();
    e.currentTarget.textContent = isAudioOn ? '🔊' : '🔇';
    showToast(isAudioOn ? 'เปิดเสียงแล้ว' : 'ปิดเสียงแล้ว');
  });
  document.getElementById('btn-home').addEventListener('click', () => openModal(modalHome));

  // Bottom Bar buttons
  document.getElementById('milestone-widget').addEventListener('click', () => {
    sound.playClick();
    if (game.state.milestoneWins >= game.state.milestoneTarget) {
      openModal(modalSpecialPack);
    } else {
      showToast(`🎯 ชนะสะสม ${game.state.milestoneWins}/${game.state.milestoneTarget} ครั้ง เพื่อเปิด Special Pack!`);
    }
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

  // Claim Special Pack
  document.getElementById('btn-claim-pack').addEventListener('click', () => {
    sound.playCoin();
    const claim = game.claimSpecialPack();
    updateUI();
    closeModal(modalSpecialPack);
    showToast(`🏆 รับรางวัล Special Pack: +${claim.coinsAdded.toLocaleString()} Coins และ +${claim.ticketsAdded} Tickets สำเร็จ!`);
  });

  // Reset Game Button (In Home modal)
  document.getElementById('btn-reset-game').addEventListener('click', () => {
    sound.playClick();
    if (confirm('คุณต้องการรีเซ็ตข้อมูลและคะแนนทั้งหมดของเกมหรือไม่?')) {
      game.resetAll();
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
    showToast('⚙️ Dev: Milestone set to 49! ทอยชนะอีก 1 ครั้งเพื่อเปิด Special Pack!');
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

  // Initial render
  updateUI();
});
