/**
 * Dice Party - 3D Dice Renderer & Visual Effects
 */

class Dice3DSystem {
  constructor() {
    this.die1 = document.getElementById('die-1');
    this.die2 = document.getElementById('die-2');
    this.canvas = document.getElementById('particle-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animFrame = null;

    // Face rotation map (X, Y) degrees
    this.faceRotations = {
      1: { x: 0,   y: 0 },     // Front
      2: { x: -90, y: 0 },     // Top
      3: { x: 0,   y: -90 },   // Right
      4: { x: 0,   y: 90 },    // Left
      5: { x: 90,  y: 0 },     // Bottom
      6: { x: 0,   y: 180 }    // Back
    };

    this.initCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  initCanvas() {
    if (!this.canvas) return;
    this.resizeCanvas();
    this.loopParticles();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /**
   * Rolls the two 3D dice to land on numbers v1 and v2 (each 1-6)
   * @param {number} v1 - First die value (1-6)
   * @param {number} v2 - Second die value (1-6)
   * @param {number} durationMs - How long the tumble lasts
   * @returns {Promise} Resolves when dice have settled
   */
  rollDice(v1, v2, durationMs = 1200) {
    return new Promise((resolve) => {
      if (!this.die1 || !this.die2) {
        setTimeout(resolve, durationMs);
        return;
      }

      // Remove idle and previous settle styles
      this.die1.classList.remove('idle');
      this.die2.classList.remove('idle');
      this.die1.classList.add('rolling-1');
      this.die2.classList.add('rolling-2');

      // Play tick sounds periodically during rolling
      const interval = setInterval(() => {
        window.soundSystem?.playRollTick();
      }, 140);

      setTimeout(() => {
        clearInterval(interval);

        // Remove wild spin classes
        this.die1.classList.remove('rolling-1');
        this.die2.classList.remove('rolling-2');

        // Apply final 3D angles with multiple full 360 loops for natural physics look
        const rot1 = this.faceRotations[v1] || this.faceRotations[1];
        const rot2 = this.faceRotations[v2] || this.faceRotations[1];

        // Add 720/1080 deg so it rotates smoothly into position
        const finalX1 = rot1.x + 720;
        const finalY1 = rot1.y + 720;
        const finalX2 = rot2.x + 1080;
        const finalY2 = rot2.y - 720;

        this.die1.style.transform = `rotateX(${finalX1}deg) rotateY(${finalY1}deg) translateY(0px)`;
        this.die2.style.transform = `rotateX(${finalX2}deg) rotateY(${finalY2}deg) translateY(0px)`;

        window.soundSystem?.playScoreLock();

        // Allow settle animation to finish
        setTimeout(() => {
          resolve();
        }, 350);
      }, durationMs - 350);
    });
  }

  /**
   * Partition a 1-12 score into two dice values (1-6 each)
   * If score is 1, return [1, 0] or special
   */
  static partitionScore(score) {
    if (score <= 1) {
      return { d1: 1, d2: 1 }; // Visual presentation for minimum roll
    }
    // Pick two random dice that sum to the score
    const minD1 = Math.max(1, score - 6);
    const maxD1 = Math.min(6, score - 1);
    const d1 = Math.floor(Math.random() * (maxD1 - minD1 + 1)) + minD1;
    const d2 = score - d1;
    return { d1, d2 };
  }

  /**
   * Confetti celebration burst
   */
  spawnConfetti(count = 80) {
    if (!this.canvas || !this.ctx) return;
    const colors = ['#ffcc00', '#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ffffff', '#e056fd'];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() * 80 - 40),
        y: this.canvas.height / 2 - 20,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        alpha: 1,
        life: 0
      });
    }
  }

  loopParticles() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.rotation += p.vRot;
      p.life++;

      if (p.life > 60) {
        p.alpha -= 0.02;
      }

      if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    }

    this.animFrame = requestAnimationFrame(() => this.loopParticles());
  }
}

window.Dice3DSystem = Dice3DSystem;
