/**
 * Dice Party - Core Game Logic & State Management
 * Implements PvE Duel, Ticket consumption, Draw Free Roll, and Milestone 50 Special Pack
 */

class DiceGame {
  constructor() {
    this.STORAGE_KEY = 'dice_party_minigame_save_v2';

    // Default State (matches mockup balances with milestone starting at 0)
    this.state = {
      coins: 12580,
      tickets: 5,
      milestoneWins: 0, // Starts at 0
      milestoneTarget: 50,
      freeRollActive: false,
      totalDuels: 0,
      totalWins: 0,
      history: [],
      specialPackClaimed: false,
      forcedOutcome: null, // For Dev Tools testing ('win' | 'lose' | 'draw' | null)
      isPremiumUnlocked: false,
      claimedFreeMilestones: [],
      claimedPremiumMilestones: [],
      eventHoursRemaining: 72,
      lastChancePurchased: false
    };

    this.loadState();
  }

  loadState() {
    try {
      // Clear old v1 save if present so 15 doesn't persist
      localStorage.removeItem('dice_party_minigame_save_v1');

      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load saved game state', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save game state', e);
    }
  }

  /**
   * Check if player can start a duel
   */
  canRoll() {
    return this.state.freeRollActive || this.state.tickets > 0;
  }

  /**
   * Execute the PvE duel
   */
  executeDuel() {
    if (!this.canRoll()) {
      return { success: false, reason: 'NO_TICKETS' };
    }

    const wasFreeRoll = this.state.freeRollActive;

    // Deduct ticket or consume free roll
    if (wasFreeRoll) {
      this.state.freeRollActive = false;
    } else {
      this.state.tickets = Math.max(0, this.state.tickets - 1);
    }

    // Generate Scores (1 to 12)
    let systemScore = Math.floor(Math.random() * 12) + 1;
    let playerScore = Math.floor(Math.random() * 12) + 1;

    // Support forced outcome for Dev testing
    if (this.state.forcedOutcome === 'win') {
      systemScore = Math.floor(Math.random() * 6) + 1; // 1 to 6
      playerScore = Math.floor(Math.random() * (12 - systemScore)) + systemScore + 1; // systemScore+1 to 12
    } else if (this.state.forcedOutcome === 'lose') {
      systemScore = Math.floor(Math.random() * 6) + 7; // 7 to 12
      playerScore = Math.floor(Math.random() * (systemScore - 1)) + 1; // 1 to systemScore-1
    } else if (this.state.forcedOutcome === 'draw') {
      playerScore = systemScore;
    }
    this.state.forcedOutcome = null; // Reset forced outcome after single use

    // Determine Result
    let result = '';
    let coinsEarned = 0;
    let unlockedSpecialPack = false;

    if (playerScore > systemScore) {
      // WIN
      result = 'WIN';
      this.state.totalWins++;
      this.state.milestoneWins++;
      coinsEarned = 0; // ไม่แจกเหรียญเมื่อชนะ

      // Check for Milestone 50 trigger
      if (this.state.milestoneWins >= this.state.milestoneTarget && !this.state.specialPackClaimed) {
        unlockedSpecialPack = true;
      }
    } else if (playerScore < systemScore) {
      // LOSE
      result = 'LOSE';
      coinsEarned = 0;
    } else {
      // DRAW -> Free Roll granted!
      result = 'DRAW';
      this.state.freeRollActive = true;
      coinsEarned = 0;
    }

    this.state.totalDuels++;

    // History record
    const historyItem = {
      round: this.state.totalDuels,
      systemScore,
      playerScore,
      result,
      coinsEarned,
      wasFreeRoll,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.state.history.unshift(historyItem);
    if (this.state.history.length > 50) {
      this.state.history.pop();
    }

    this.saveState();

    return {
      success: true,
      systemScore,
      playerScore,
      result,
      coinsEarned,
      wasFreeRoll,
      freeRollGranted: result === 'DRAW',
      unlockedSpecialPack,
      milestoneWins: this.state.milestoneWins,
      milestoneTarget: this.state.milestoneTarget
    };
  }

  /**
   * Shop purchases
   */
  buyTickets(amount, cost) {
    if (this.state.coins < cost) {
      return { success: false, message: 'Not enough coins!' };
    }
    this.state.coins -= cost;
    this.state.tickets += amount;
    this.saveState();
    return { success: true, tickets: this.state.tickets, coins: this.state.coins };
  }

  /**
   * Free test refill
   */
  refillFree(amount = 5) {
    this.state.tickets += amount;
    this.saveState();
    return this.state.tickets;
  }

  /**
   * Claim Special Pack when milestone reaches 50
   */
  claimSpecialPack() {
    this.state.coins += 10000;
    this.state.tickets += 20;
    // Reset milestone progress for the next cycle of 50 wins
    this.state.milestoneWins = 0;
    this.state.specialPackClaimed = false;
    this.saveState();
    return {
      coinsAdded: 10000,
      ticketsAdded: 20
    };
  }

  /**
   * Dev Helpers
   */
  setMilestone(wins) {
    this.state.milestoneWins = wins;
    this.saveState();
  }

  addCoins(amount) {
    this.state.coins += amount;
    this.saveState();
  }

  unlockPremium() {
    this.state.isPremiumUnlocked = true;
    this.saveState();
    return true;
  }

  canClaimMilestone(track, milestoneWins) {
    if (this.state.milestoneWins < milestoneWins) return false;
    if (track === 'free') {
      return !this.state.claimedFreeMilestones.includes(milestoneWins);
    } else if (track === 'premium') {
      if (!this.state.isPremiumUnlocked) return false;
      return !this.state.claimedPremiumMilestones.includes(milestoneWins);
    }
    return false;
  }

  isMilestoneClaimed(track, milestoneWins) {
    if (track === 'free') {
      return this.state.claimedFreeMilestones.includes(milestoneWins);
    } else {
      return this.state.claimedPremiumMilestones.includes(milestoneWins);
    }
  }

  claimMilestone(track, milestoneWins) {
    if (!this.canClaimMilestone(track, milestoneWins)) return null;

    const m = DiceGame.MILESTONES.find(item => item.wins === milestoneWins);
    if (!m) return null;

    const reward = track === 'free' ? m.free : m.premium;

    if (track === 'free') {
      this.state.claimedFreeMilestones.push(milestoneWins);
    } else {
      this.state.claimedPremiumMilestones.push(milestoneWins);
    }

    if (reward.type === 'chips') {
      this.state.coins += reward.amount;
    }

    this.saveState();
    return reward;
  }

  hasUnclaimedMilestone() {
    for (const m of DiceGame.MILESTONES) {
      if (this.canClaimMilestone('free', m.wins)) return true;
      if (this.canClaimMilestone('premium', m.wins)) return true;
    }
    return false;
  }

  /**
   * Get how many milestone tiers the player is still missing (out of 10)
   */
  getRemainingMilestoneSteps() {
    return DiceGame.MILESTONES.filter(m => m.wins > this.state.milestoneWins).length;
  }

  /**
   * Calculate Last-Chance Offer dynamic bundle pricing based on missing tiers
   */
  calculateLastChancePrice() {
    const remainingSteps = this.getRemainingMilestoneSteps();
    if (remainingSteps === 0) {
      return { remainingSteps: 0, originalPrice: 0, promoPrice: 0, isMaxTier: true };
    }

    let originalPrice = 599;
    let promoPrice = 199;

    if (remainingSteps >= 9) {
      originalPrice = 599;
      promoPrice = 199;
    } else if (remainingSteps >= 7) {
      originalPrice = 499;
      promoPrice = 199;
    } else if (remainingSteps >= 5) {
      originalPrice = 399;
      promoPrice = 159;
    } else if (remainingSteps >= 3) {
      originalPrice = 299;
      promoPrice = 119;
    } else {
      originalPrice = 199;
      promoPrice = 79;
    }

    return {
      remainingSteps,
      originalPrice,
      promoPrice,
      isMaxTier: false
    };
  }

  /**
   * Check if player meets condition for Last-Chance Offer popup:
   * 1. Within last 3 days (<= 72 hours)
   * 2. Player has purchased Premium (369 THB)
   * 3. Player hasn't reached milestone 50 yet (< 50 wins)
   */
  isLastChanceEligible() {
    return this.state.isPremiumUnlocked &&
           this.state.milestoneWins < 50 &&
           this.state.eventHoursRemaining <= 72;
  }

  /**
   * Purchase Last-Chance Bundle:
   * Instantly grants all remaining rewards up to 50 wins,
   * unlocks premium, and sets milestoneWins to 50.
   */
  purchaseLastChanceBundle() {
    const priceInfo = this.calculateLastChancePrice();
    const remainingSteps = priceInfo.remainingSteps;

    this.state.isPremiumUnlocked = true;
    this.state.milestoneWins = 50;
    this.state.lastChancePurchased = true;

    let totalChipsAdded = 0;
    const itemsClaimed = [];

    // Auto-claim all free & premium milestones up to 50
    for (const m of DiceGame.MILESTONES) {
      // Claim Free
      if (!this.state.claimedFreeMilestones.includes(m.wins)) {
        this.state.claimedFreeMilestones.push(m.wins);
        if (m.free.type === 'chips') {
          totalChipsAdded += m.free.amount;
        } else {
          itemsClaimed.push(m.free.name);
        }
      }
      // Claim Premium
      if (!this.state.claimedPremiumMilestones.includes(m.wins)) {
        this.state.claimedPremiumMilestones.push(m.wins);
        if (m.premium.type === 'chips') {
          totalChipsAdded += m.premium.amount;
        } else {
          itemsClaimed.push(m.premium.name);
        }
      }
    }

    this.state.coins += totalChipsAdded;
    this.saveState();

    return {
      success: true,
      price: priceInfo.promoPrice,
      remainingSteps,
      totalChipsAdded,
      itemsClaimed
    };
  }

  resetAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.state = {
      coins: 12580,
      tickets: 5,
      milestoneWins: 0,
      milestoneTarget: 50,
      freeRollActive: false,
      totalDuels: 0,
      totalWins: 0,
      history: [],
      specialPackClaimed: false,
      forcedOutcome: null,
      isPremiumUnlocked: false,
      claimedFreeMilestones: [],
      claimedPremiumMilestones: [],
      eventHoursRemaining: 72,
      lastChancePurchased: false
    };
    this.saveState();
  }
}

// 10 Milestones (Non-linear progression: 1, 3, 5, 10, 15, 20, 25, 30, 40, 50)
DiceGame.MILESTONES = [
  {
    wins: 1,
    free: { type: 'chips', amount: 10000, name: '10,000 ชิป', icon: '🪙', label: '10k ชิป' },
    premium: { type: 'chips', amount: 120000, name: '100k ชิป + โบนัส 20%', icon: '💰', label: '100k ชิป (+20%)' }
  },
  {
    wins: 3,
    free: { type: 'chips', amount: 20000, name: '20,000 ชิป', icon: '🪙', label: '20k ชิป' },
    premium: { type: 'chips', amount: 300000, name: '200k ชิป + โบนัส 50%', icon: '💰', label: '200k ชิป (+50%)' }
  },
  {
    wins: 5,
    free: { type: 'chips', amount: 30000, name: '30,000 ชิป', icon: '🪙', label: '30k ชิป' },
    premium: { type: 'chips', amount: 1000000, name: '500k ชิป + โบนัส 100%', icon: '💰', label: '500k ชิป (+100%)' }
  },
  {
    wins: 10,
    free: { type: 'chips', amount: 50000, name: '50,000 ชิป', icon: '🪙', label: '50k ชิป' },
    premium: { type: 'chips', amount: 12500000, name: '5m ชิป + โบนัส 150%', icon: '💰', label: '5m ชิป (+150%)' }
  },
  {
    wins: 15,
    free: { type: 'chips', amount: 100000, name: '100k ชิป', icon: '🪙', label: '100k ชิป' },
    premium: { type: 'item', amount: 30, name: 'จิ๊กซอว์(สีเทา)ระดับธรรมดา 30 ชิ้น', icon: '🧩', label: 'จิ๊กซอว์เทา 30 ชิ้น' }
  },
  {
    wins: 20,
    free: { type: 'item', amount: 5, name: 'จิ๊กซอว์(สีเทา) ระดับธรรมดา 5 ชิ้น', icon: '🧩', label: 'จิ๊กซอว์เทา 5 ชิ้น' },
    premium: { type: 'chips', amount: 75000000, name: '25m ชิป + โบนัส 200%', icon: '💰', label: '25m ชิป (+200%)' }
  },
  {
    wins: 25,
    free: { type: 'chips', amount: 250000, name: '250k ชิป', icon: '🪙', label: '250k ชิป' },
    premium: { type: 'item', amount: 20, name: 'จิ๊กซอว์(สีฟ้า)ระดับหายาก 20 ชิ้น', icon: '🔷', label: 'จิ๊กซอว์ฟ้า 20 ชิ้น' }
  },
  {
    wins: 30,
    free: { type: 'item', amount: 1, name: 'สติ๊กเกอร์ จำกัดเวลา 3 วัน', icon: '🏷️', label: 'สติ๊กเกอร์', timed: '3 วัน' },
    premium: { type: 'item', amount: 1, name: 'สติ๊กเกอร์ระดับพรีเมียมแบบถาวร', icon: '🌟', label: 'สติ๊กเกอร์ถาวร' }
  },
  {
    wins: 40,
    free: { type: 'item', amount: 1, name: 'มงกุฎ(หมวก) จำกัดเวลา 7 วัน', icon: '👑', label: 'มงกุฎหมวก', timed: '7 วัน' },
    premium: { type: 'item', amount: 15, name: 'จิ๊กซอว์(สีชมพู)ระดับเลื่องชื่อ 15 ชิ้น', icon: '🌸', label: 'จิ๊กซอว์ชมพู 15 ชิ้น' }
  },
  {
    wins: 50,
    free: { type: 'item', amount: 1, name: 'กรอบโปรไฟล์ จำกัดเวลา 30 วัน', icon: '🖼️', label: 'กรอบโปรไฟล์', timed: '30 วัน' },
    premium: { type: 'item', amount: 1, name: 'เซ็ตมงกุฎ+กรอบโปรไฟล์ระดับพรีเมียมแบบถาวร แถมจิ๊กซอว์(สีทอง)ระดับตำนาน 10 ชิ้น', icon: '👑', label: 'เซ็ตถาวร + ทอง 10ชิ้น' }
  }
];

window.DiceGame = DiceGame;
