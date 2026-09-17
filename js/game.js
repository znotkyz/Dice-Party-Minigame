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
      forcedOutcome: null // For Dev Tools testing ('win' | 'lose' | 'draw' | null)
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
      forcedOutcome: null
    };
    this.saveState();
  }
}

window.DiceGame = DiceGame;
