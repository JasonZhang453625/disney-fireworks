// High Performance Canvas Fireworks Engine
const ColorPalettes = {
  disneyGold: ['#FFE066', '#FFD700', '#FFAA00', '#FFF8DB', '#FFFFFF'],
  cinderella: ['#69D2E7', '#A7DBD8', '#E0E4CC', '#FA6900', '#FE4365', '#FFFFFF'],
  frozen: ['#70D6FF', '#FF70A6', '#FF9770', '#E9FF70', '#A0C4FF', '#FFFFFF'],
  tangled: ['#C77DFF', '#E0AAFF', '#FFD166', '#FF9E00', '#FFF3B0', '#FFFFFF'],
  ariel: ['#06D6A0', '#118AB2', '#073B4C', '#FFD166', '#EF476F', '#FFFFFF'],
  belle: ['#FFD166', '#F4A261', '#E76F51', '#2A9D8F', '#E9C46A', '#FFFFFF'],
  grandRainbow: ['#FF0055', '#FF5500', '#FFCC00', '#00FF66', '#00CCFF', '#9900FF', '#FF66CC', '#FFFFFF']
};

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.alpha = 1;
    this.decay = 0.015;
    this.color = '#fff';
    this.size = 2;
    this.flicker = false;
    this.flickerSpeed = 0.2;
    this.gravity = 0.05;
    this.drag = 0.98;
    this.trail = [];
    this.trailLength = 4;
    this.isDead = true;
    this.type = 'normal';
    this.sparkle = false;
    this.hasCrossed = false;
    this.crossDelay = 0;
  }

  init(x, y, vx, vy, color, size, decay, type = 'normal', gravity = 0.06, drag = 0.975) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.decay = decay;
    this.alpha = 1;
    this.type = type;
    this.gravity = gravity;
    this.drag = drag;
    this.trail = [];
    this.trailLength = type === 'willow' ? 6 : (type === 'fairy' ? 8 : 3);
    this.flicker = type === 'strobe' || type === 'willow' || Math.random() < 0.25;
    this.sparkle = type === 'willow' || type === 'fairy';
    this.hasCrossed = false;
    this.crossDelay = 15 + Math.random() * 15;
    this.isDead = false;
  }

  update(fireworksEngine) {
    if (this.isDead) return;

    this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    this.vx *= this.drag;
    this.vy = (this.vy * this.drag) + this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    this.alpha -= this.decay;

    // Crossette split effect
    if (this.type === 'crossette' && !this.hasCrossed) {
      this.crossDelay--;
      if (this.crossDelay <= 0) {
        this.hasCrossed = true;
        fireworksEngine.splitCrossette(this.x, this.y, this.color);
      }
    }

    if (this.alpha <= 0) {
      this.isDead = true;
    }
  }

  draw(ctx) {
    if (this.isDead) return;

    let currentAlpha = this.alpha;
    if (this.flicker && Math.random() < 0.4) {
      currentAlpha *= 0.3;
    }

    // Draw motion trail
    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = currentAlpha * 0.5;
      ctx.lineWidth = this.size * 0.75;
      ctx.stroke();
    }

    // Draw particle head
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = currentAlpha;
    ctx.fill();

    // Extra fairy sparkle halo
    if (this.sparkle && Math.random() < 0.3) {
      ctx.beginPath();
      ctx.arc(this.x + (Math.random() - 0.5) * 4, this.y + (Math.random() - 0.5) * 4, this.size * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = currentAlpha * 0.8;
      ctx.fill();
    }
  }
}

class Rocket {
  constructor(startX, startY, targetX, targetY, color, shellType, size = 1) {
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.color = color;
    this.shellType = shellType;
    this.size = size;

    const angle = Math.atan2(targetY - startY, targetX - startX);
    const distance = Math.hypot(targetX - startX, targetY - startY);
    this.speed = Math.min(18, Math.max(12, distance / 32));
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;

    this.trail = [];
    this.trailLength = 8;
    this.isDead = false;
    this.distanceTraveled = 0;
    this.totalDistance = distance;
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    this.x += this.vx;
    this.y += this.vy;
    this.distanceTraveled += this.speed;

    // Gradual deceleration near peak
    if (this.distanceTraveled >= this.totalDistance * 0.75) {
      this.vx *= 0.95;
      this.vy *= 0.95;
    }

    if (this.distanceTraveled >= this.totalDistance || this.y <= this.targetY || (this.vy >= -0.5 && this.y < this.startY - 50)) {
      this.isDead = true;
    }
  }

  draw(ctx) {
    if (this.isDead) return;

    // Draw fiery comet trail
    for (let i = 0; i < this.trail.length; i++) {
      const point = this.trail[i];
      const progress = i / this.trail.length;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.2 + progress * 2, 0, Math.PI * 2);
      ctx.fillStyle = progress > 0.6 ? '#FFFFFF' : '#FFA500';
      ctx.globalAlpha = progress * 0.8;
      ctx.fill();
    }

    // Rocket tip
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 1;
    ctx.fill();
  }
}

class FireworksEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rockets = [];
    this.particlePool = [];
    this.maxParticles = 3000;
    this.flashAlpha = 0;
    this.shakeIntensity = 0;
    this.initPool();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  initPool() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(new Particle());
    }
  }

  getParticle() {
    for (let i = 0; i < this.particlePool.length; i++) {
      if (this.particlePool[i].isDead) {
        return this.particlePool[i];
      }
    }
    // Expand if full
    const newP = new Particle();
    this.particlePool.push(newP);
    return newP;
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  launch(startX, startY, targetX, targetY, shellType = 'chrysanthemum', palette = 'disneyGold', size = 1) {
    const colors = ColorPalettes[palette] || ColorPalettes.disneyGold;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const rocket = new Rocket(startX, startY, targetX, targetY, color, shellType, size);
    this.rockets.push(rocket);

    if (window.soundEngine) {
      window.soundEngine.playLaunch(0.8 + Math.random() * 0.4, 0.4 + size * 0.3);
    }
  }

  explode(x, y, shellType, baseColor, size = 1) {
    if (window.soundEngine) {
      window.soundEngine.playExplosion(size, shellType);
    }

    if (size > 1.3) {
      this.flashAlpha = Math.min(0.35, size * 0.18);
      this.shakeIntensity = Math.min(6, size * 2.5);
    }

    const paletteKeys = Object.keys(ColorPalettes);
    const randomPalette = ColorPalettes[paletteKeys[Math.floor(Math.random() * paletteKeys.length)]];

    switch (shellType) {
      case 'heart':
        this.createHeartBurst(x, y, randomPalette, size);
        break;
      case 'ring':
        this.createRingBurst(x, y, randomPalette, size);
        break;
      case 'willow':
        this.createWillowBurst(x, y, '#FFD700', size);
        break;
      case 'crossette':
        this.createCrossetteBurst(x, y, randomPalette, size);
        break;
      case 'strobe':
        this.createStrobeBurst(x, y, ['#FFFFFF', '#FFE066', '#A0C4FF'], size);
        break;
      case 'grandFinale':
        this.createGrandCrownBurst(x, y, size);
        break;
      case 'fairy':
        this.createFairyBurst(x, y, size);
        break;
      case 'peony':
      case 'chrysanthemum':
      default:
        this.createSphereBurst(x, y, randomPalette, size, shellType);
        break;
    }
  }

  createSphereBurst(x, y, palette, size, shellType) {
    const count = Math.floor((shellType === 'peony' ? 90 : 130) * size);
    const speedBase = (shellType === 'peony' ? 5.5 : 7.0) * size;
    const decay = shellType === 'peony' ? 0.012 : 0.016;

    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.8) * speedBase;
      const color = palette[Math.floor(Math.random() * palette.length)];
      p.init(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2.2,
        decay + Math.random() * 0.008,
        shellType === 'peony' ? 'peony' : 'normal',
        0.05,
        0.965
      );
    }
  }

  createWillowBurst(x, y, color, size) {
    const count = Math.floor(180 * size);
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.3 + Math.random() * 0.7) * (7.5 * size);
      p.init(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() < 0.25 ? '#FFFFFF' : '#FFD700',
        2.5,
        0.006 + Math.random() * 0.004, // Very slow decay for golden rain
        'willow',
        0.035,
        0.978
      );
    }
  }

  createHeartBurst(x, y, palette, size) {
    const count = Math.floor(100 * size);
    const scale = 0.28 * size;
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      // Parametric heart formula
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

      const p = this.getParticle();
      const speed = 0.28 * size;
      const color = Math.random() < 0.7 ? '#FF3366' : '#FF99B8';
      p.init(
        x, y,
        hx * speed + (Math.random() - 0.5) * 0.4,
        hy * speed + (Math.random() - 0.5) * 0.4,
        color,
        2.4,
        0.013,
        'normal',
        0.04,
        0.98
      );
    }
  }

  createRingBurst(x, y, palette, size) {
    const count = Math.floor(80 * size);
    const speed = 6.0 * size;
    const ringColor = palette[0];
    const centerColor = palette[1] || '#FFFFFF';

    // Ring perimeter
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = (i / count) * Math.PI * 2;
      p.init(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        ringColor,
        2.4,
        0.014,
        'normal',
        0.03,
        0.975
      );
    }

    // Inner sparkle
    for (let i = 0; i < 25; i++) {
      const p = this.getParticle();
      const angle = Math.random() * Math.PI * 2;
      const innerSpeed = Math.random() * 2.5 * size;
      p.init(
        x, y,
        Math.cos(angle) * innerSpeed,
        Math.sin(angle) * innerSpeed,
        centerColor,
        2.0,
        0.018,
        'strobe',
        0.04,
        0.96
      );
    }
  }

  createStrobeBurst(x, y, palette, size) {
    const count = Math.floor(100 * size);
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.8) * 6.5 * size;
      p.init(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        palette[Math.floor(Math.random() * palette.length)],
        2.5,
        0.011 + Math.random() * 0.005,
        'strobe',
        0.04,
        0.97
      );
    }
  }

  createCrossetteBurst(x, y, palette, size) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = (i / count) * Math.PI * 2;
      const speed = 5.0 * size;
      p.init(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        palette[i % palette.length],
        3.0,
        0.015,
        'crossette',
        0.04,
        0.98
      );
    }
  }

  splitCrossette(x, y, color) {
    for (let i = 0; i < 4; i++) {
      const p = this.getParticle();
      const angle = (i * Math.PI / 2) + (Math.PI / 4);
      const speed = 2.5;
      p.init(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2.0,
        0.025,
        'normal',
        0.04,
        0.97
      );
    }
    if (window.soundEngine) {
      window.soundEngine.playCrackle(0.5);
    }
  }

  createFairyBurst(x, y, size = 1) {
    const count = 60;
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.1 + Math.random() * 0.6) * 3.5 * size;
      p.init(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() < 0.5 ? '#FFF3B0' : '#E0AAFF',
        2.2,
        0.008 + Math.random() * 0.006,
        'fairy',
        0.02,
        0.98
      );
    }
  }

  createGrandCrownBurst(x, y, size = 1.6) {
    const count = Math.floor(350 * size);
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.8) * 10.0 * size;
      const isCore = Math.random() < 0.2;
      p.init(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        isCore ? '#FFFFFF' : (Math.random() < 0.7 ? '#FFD700' : '#FFAA00'),
        3.0,
        0.007 + Math.random() * 0.005,
        'willow',
        0.038,
        0.978
      );
    }
  }

  update() {
    // Update rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.update();
      if (r.isDead) {
        this.explode(r.x, r.y, r.shellType, r.color, r.size);
        this.rockets.splice(i, 1);
      }
    }

    // Update active particles
    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      if (!p.isDead) {
        p.update(this);
      }
    }

    // Decay flash and shake
    if (this.flashAlpha > 0) {
      this.flashAlpha -= 0.03;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.85;
      if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
    }
  }

  render() {
    this.ctx.save();

    // Camera shake
    if (this.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.ctx.translate(dx, dy);
    }

    // Sky trail fade
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = 'rgba(2, 2, 8, 0.22)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Screen Flash
    if (this.flashAlpha > 0) {
      this.ctx.fillStyle = `rgba(255, 235, 200, ${this.flashAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Additive glow rendering for fireworks
    this.ctx.globalCompositeOperation = 'lighter';

    // Draw Rockets
    for (let i = 0; i < this.rockets.length; i++) {
      this.rockets[i].draw(this.ctx);
    }

    // Draw Particles
    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      if (!p.isDead) {
        p.draw(this.ctx);
      }
    }

    this.ctx.restore();
  }
}

window.FireworksEngine = FireworksEngine;
