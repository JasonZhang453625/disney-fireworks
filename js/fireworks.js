// High Precision 3D Fireworks Physics Engine - iPhone Retina & Touch Optimized
const ColorPalettes = {
  disneyGold: ['#FFF8DB', '#FFE066', '#FFD700', '#FFAA00', '#FF8800'],
  royalFantasy: ['#70D6FF', '#FF70A6', '#FF9770', '#E9FF70', '#C77DFF', '#FFFFFF'],
  cinderella: ['#80E3FF', '#A0E8FF', '#E2F7FF', '#FF6584', '#FFE066', '#FFFFFF'],
  frozenIce: ['#54E346', '#00E8FF', '#70D6FF', '#B8F2E6', '#FFFFFF'],
  tangledLantern: ['#C77DFF', '#E0AAFF', '#FFD166', '#FF9E00', '#FFF3B0', '#FFFFFF'],
  belleRose: ['#FF4D6D', '#FF758F', '#FFB3C1', '#FFD700', '#F9C74F', '#FFFFFF'],
  grandRainbow: ['#FF0055', '#FF5500', '#FFCC00', '#00FF88', '#00CCFF', '#AA00FF', '#FF66CC', '#FFFFFF']
};

class Particle3D {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.alpha = 1;
    this.decay = 0.015;
    this.color = '#fff';
    this.secondaryColor = null;
    this.size = 2.2;
    this.flicker = false;
    this.gravity = 0.045;
    this.drag = 0.98;
    this.trail = [];
    this.trailLength = 5;
    this.isDead = true;
    this.type = 'normal';
    this.sparkle = false;
    this.hasCrossed = false;
    this.crossDelay = 0;
    this.age = 0;
    this.maxAge = 60;
  }

  init(x, y, z, vx, vy, vz, color, size, decay, type = 'normal', secondaryColor = null, gravity = 0.048, drag = 0.978) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.color = color;
    this.secondaryColor = secondaryColor;
    this.size = size;
    this.decay = decay;
    this.alpha = 1;
    this.type = type;
    this.gravity = gravity;
    this.drag = drag;
    this.trail = [];
    this.trailLength = type === 'willow' ? 8 : (type === 'fairy' ? 10 : 4);
    this.flicker = type === 'strobe' || type === 'willow' || Math.random() < 0.3;
    this.sparkle = type === 'willow' || type === 'fairy' || type === 'strobe';
    this.hasCrossed = false;
    this.crossDelay = 14 + Math.random() * 12;
    this.age = 0;
    this.maxAge = Math.floor(1 / decay);
    this.isDead = false;
  }

  update(fireworksEngine) {
    if (this.isDead) return;

    this.age++;

    this.trail.push({ x: this.x, y: this.y, z: this.z, alpha: this.alpha });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    this.vx *= this.drag;
    this.vz *= this.drag;
    this.vy = (this.vy * this.drag) + this.gravity;

    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    this.alpha -= this.decay;

    if (this.type === 'crossette' && !this.hasCrossed) {
      this.crossDelay--;
      if (this.crossDelay <= 0) {
        this.hasCrossed = true;
        fireworksEngine.splitCrossette3D(this.x, this.y, this.z, this.color);
      }
    }

    if (this.alpha <= 0) {
      this.isDead = true;
    }
  }

  draw(ctx, focalLength, centerX, centerY, waterLevel) {
    if (this.isDead) return;

    const scale = focalLength / (focalLength + this.z);
    if (scale <= 0) return;

    const projX = centerX + (this.x - centerX) * scale;
    const projY = centerY + (this.y - centerY) * scale;
    const projSize = Math.max(0.6, this.size * scale);

    let currentAlpha = this.alpha;
    if (this.flicker && Math.random() < 0.35) {
      currentAlpha *= 0.25;
    }

    let renderColor = this.color;
    if (this.secondaryColor && this.age > this.maxAge * 0.4) {
      renderColor = this.secondaryColor;
    }

    // 1. Motion Trail
    if (this.trail.length > 1) {
      ctx.beginPath();
      const first = this.trail[0];
      const s0 = focalLength / (focalLength + first.z);
      ctx.moveTo(centerX + (first.x - centerX) * s0, centerY + (first.y - centerY) * s0);

      for (let i = 1; i < this.trail.length; i++) {
        const pt = this.trail[i];
        const s = focalLength / (focalLength + pt.z);
        ctx.lineTo(centerX + (pt.x - centerX) * s, centerY + (pt.y - centerY) * s);
      }

      ctx.strokeStyle = renderColor;
      ctx.globalAlpha = currentAlpha * 0.45 * Math.min(1, scale);
      ctx.lineWidth = projSize * 0.8;
      ctx.stroke();
    }

    // 2. Head & Core
    ctx.beginPath();
    ctx.arc(projX, projY, projSize, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.globalAlpha = currentAlpha;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(projX, projY, projSize * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = currentAlpha * 0.85;
    ctx.fill();

    // 3. Water Reflection
    if (projY < waterLevel) {
      const distFromWater = waterLevel - projY;
      const refY = waterLevel + distFromWater * 0.45;
      const refAlpha = currentAlpha * 0.18 * Math.min(1, scale);

      if (refY < ctx.canvas.height && refAlpha > 0.01) {
        const rippleX = projX + Math.sin(refY * 0.1 + Date.now() * 0.005) * 3;
        ctx.beginPath();
        ctx.ellipse(rippleX, refY, projSize * 1.6, projSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = renderColor;
        ctx.globalAlpha = refAlpha;
        ctx.fill();
      }
    }
  }
}

class Rocket3D {
  constructor(startX, startY, startZ, targetX, targetY, targetZ, color, shellType, size = 1) {
    this.x = startX;
    this.y = startY;
    this.z = startZ;
    this.targetX = targetX;
    this.targetY = targetY;
    this.targetZ = targetZ;
    this.color = color;
    this.shellType = shellType;
    this.size = size;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dz = targetZ - startZ;
    const distance = Math.hypot(dx, dy, dz);
    this.speed = Math.min(22, Math.max(13, distance / 32));

    this.vx = (dx / distance) * this.speed;
    this.vy = (dy / distance) * this.speed;
    this.vz = (dz / distance) * this.speed;

    this.trail = [];
    this.trailLength = 9;
    this.isDead = false;
    this.distanceTraveled = 0;
    this.totalDistance = distance;
  }

  update() {
    this.trail.push({ x: this.x, y: this.y, z: this.z });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.distanceTraveled += this.speed;

    if (this.distanceTraveled >= this.totalDistance * 0.72) {
      this.vx *= 0.94;
      this.vy *= 0.94;
      this.vz *= 0.94;
    }

    if (this.distanceTraveled >= this.totalDistance || this.y <= this.targetY) {
      this.isDead = true;
    }
  }

  draw(ctx, focalLength, centerX, centerY) {
    if (this.isDead) return;

    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      const progress = i / this.trail.length;
      const scale = focalLength / (focalLength + pt.z);
      const px = centerX + (pt.x - centerX) * scale;
      const py = centerY + (pt.y - centerY) * scale;

      ctx.beginPath();
      ctx.arc(px, py, (1.2 + progress * 2.2) * scale, 0, Math.PI * 2);
      ctx.fillStyle = progress > 0.6 ? '#FFFFFF' : '#FFAE19';
      ctx.globalAlpha = progress * 0.85;
      ctx.fill();
    }

    const scale = focalLength / (focalLength + this.z);
    const px = centerX + (this.x - centerX) * scale;
    const py = centerY + (this.y - centerY) * scale;

    ctx.beginPath();
    ctx.arc(px, py, 2.8 * scale, 0, Math.PI * 2);
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
    this.maxParticles = 3200;
    this.flashAlpha = 0;
    this.shakeIntensity = 0;
    this.focalLength = 800;
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);

    this.initPool();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
  }

  initPool() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(new Particle3D());
    }
  }

  getParticle() {
    for (let i = 0; i < this.particlePool.length; i++) {
      if (this.particlePool[i].isDead) {
        return this.particlePool[i];
      }
    }
    const newP = new Particle3D();
    this.particlePool.push(newP);
    return newP;
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.isPortrait = this.width < this.height;
    this.waterLevel = this.isPortrait ? this.height * 0.82 : this.height * 0.86;
  }

  launch(startX, startY, targetX, targetY, shellType = 'chrysanthemum', palette = 'disneyGold', size = 1) {
    const colors = ColorPalettes[palette] || ColorPalettes.disneyGold;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const startZ = (Math.random() - 0.5) * 80;
    const targetZ = (Math.random() - 0.5) * 220;

    const rocket = new Rocket3D(startX, startY, startZ, targetX, targetY, targetZ, color, shellType, size);
    this.rockets.push(rocket);

    if (window.soundEngine) {
      window.soundEngine.playLaunch(0.85 + Math.random() * 0.35, 0.45 + size * 0.25);
    }
  }

  explode(x, y, z, shellType, baseColor, size = 1) {
    if (window.soundEngine) {
      window.soundEngine.playExplosion(size, shellType);
    }

    if (size > 1.2) {
      this.flashAlpha = Math.min(0.30, size * 0.15);
      this.shakeIntensity = Math.min(4.5, size * 2.0);
    }

    const paletteKeys = Object.keys(ColorPalettes);
    const randomPalette = ColorPalettes[paletteKeys[Math.floor(Math.random() * paletteKeys.length)]];

    switch (shellType) {
      case 'heart':
        this.createHeartBurst3D(x, y, z, randomPalette, size);
        break;
      case 'ring':
        this.createRingBurst3D(x, y, z, randomPalette, size);
        break;
      case 'willow':
        this.createWillowBurst3D(x, y, z, '#FFD700', size);
        break;
      case 'crossette':
        this.createCrossetteBurst3D(x, y, z, randomPalette, size);
        break;
      case 'strobe':
        this.createStrobeBurst3D(x, y, z, ['#FFFFFF', '#FFE066', '#A0C4FF'], size);
        break;
      case 'grandFinale':
        this.createGrandCrownBurst3D(x, y, z, size);
        break;
      case 'fairy':
        this.createFairyBurst3D(x, y, z, size);
        break;
      case 'peony':
      case 'chrysanthemum':
      default:
        this.createSphereBurst3D(x, y, z, randomPalette, size, shellType);
        break;
    }
  }

  createSphereBurst3D(x, y, z, palette, size, shellType) {
    const count = Math.floor((shellType === 'peony' ? 100 : 140) * size);
    const speedBase = (shellType === 'peony' ? 6.0 : 7.5) * size;
    const decay = shellType === 'peony' ? 0.013 : 0.016;
    const secondaryColor = shellType === 'peony' ? palette[Math.floor(Math.random() * palette.length)] : null;

    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);

      const vx = Math.cos(theta) * Math.sin(phi);
      const vy = Math.sin(theta) * Math.sin(phi);
      const vz = Math.cos(phi);

      const speed = (0.75 + Math.random() * 0.25) * speedBase;
      const color = palette[i % palette.length];

      const p = this.getParticle();
      p.init(
        x, y, z,
        vx * speed, vy * speed, vz * speed,
        color,
        2.3,
        decay + Math.random() * 0.006,
        shellType,
        secondaryColor,
        0.042,
        0.975
      );
    }
  }

  createWillowBurst3D(x, y, z, color, size) {
    const count = Math.floor(180 * size);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random());
      const sinPhi = Math.sin(phi);

      const vx = r * sinPhi * Math.cos(theta);
      const vy = r * sinPhi * Math.sin(theta);
      const vz = r * Math.cos(phi);

      const speed = (0.3 + Math.random() * 0.7) * (7.8 * size);
      const p = this.getParticle();
      p.init(
        x, y, z,
        vx * speed, vy * speed, vz * speed,
        Math.random() < 0.2 ? '#FFFFFF' : '#FFD700',
        2.5,
        0.0065 + Math.random() * 0.0035,
        'willow',
        '#FFA500',
        0.032,
        0.98
      );
    }
  }

  createHeartBurst3D(x, y, z, palette, size) {
    const count = Math.floor(100 * size);
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const hz = (Math.random() - 0.5) * 5;

      const p = this.getParticle();
      const speed = 0.30 * size;
      const color = Math.random() < 0.7 ? '#FF3366' : '#FFB3C6';
      p.init(
        x, y, z,
        hx * speed + (Math.random() - 0.5) * 0.3,
        hy * speed + (Math.random() - 0.5) * 0.3,
        hz * speed,
        color,
        2.4,
        0.013,
        'normal',
        '#FFF0F5',
        0.038,
        0.98
      );
    }
  }

  createRingBurst3D(x, y, z, palette, size) {
    const count = Math.floor(80 * size);
    const speed = 6.2 * size;
    const ringColor = palette[0];
    const centerColor = palette[1] || '#FFFFFF';

    const tiltAngle = (Math.random() - 0.5) * 0.8;
    const cosT = Math.cos(tiltAngle);
    const sinT = Math.sin(tiltAngle);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const rx = Math.cos(angle) * speed;
      const ry = Math.sin(angle) * speed * cosT;
      const rz = Math.sin(angle) * speed * sinT;

      const p = this.getParticle();
      p.init(
        x, y, z,
        rx, ry, rz,
        ringColor,
        2.4,
        0.013,
        'normal',
        null,
        0.028,
        0.975
      );
    }

    for (let i = 0; i < 25; i++) {
      const p = this.getParticle();
      const angle = Math.random() * Math.PI * 2;
      const innerSpeed = Math.random() * 2.6 * size;
      p.init(
        x, y, z,
        Math.cos(angle) * innerSpeed,
        Math.sin(angle) * innerSpeed,
        (Math.random() - 0.5) * 2 * size,
        centerColor,
        2.0,
        0.016,
        'strobe',
        null,
        0.035,
        0.96
      );
    }
  }

  createStrobeBurst3D(x, y, z, palette, size) {
    const count = Math.floor(110 * size);
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.25 + Math.random() * 0.75) * 6.5 * size;
      p.init(
        x, y, z,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * 4 * size,
        palette[Math.floor(Math.random() * palette.length)],
        2.5,
        0.011 + Math.random() * 0.005,
        'strobe',
        '#FFFFFF',
        0.036,
        0.972
      );
    }
  }

  createCrossetteBurst3D(x, y, z, palette, size) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = (i / count) * Math.PI * 2;
      const speed = 5.2 * size;
      p.init(
        x, y, z,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * 3,
        palette[i % palette.length],
        3.0,
        0.014,
        'crossette',
        null,
        0.038,
        0.98
      );
    }
  }

  splitCrossette3D(x, y, z, color) {
    for (let i = 0; i < 4; i++) {
      const p = this.getParticle();
      const angle = (i * Math.PI / 2) + (Math.PI / 4);
      const speed = 2.8;
      p.init(
        x, y, z,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * 2,
        color,
        2.0,
        0.024,
        'normal',
        '#FFFFFF',
        0.038,
        0.97
      );
    }
    if (window.soundEngine) {
      window.soundEngine.playCrackle(0.5);
    }
  }

  createFairyBurst3D(x, y, z, size = 1) {
    const count = 65;
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.1 + Math.random() * 0.7) * 3.8 * size;
      p.init(
        x, y, z,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * 3,
        Math.random() < 0.5 ? '#FFF8DB' : '#E0AAFF',
        2.3,
        0.0075 + Math.random() * 0.005,
        'fairy',
        '#FFFFFF',
        0.018,
        0.982
      );
    }
  }

  createGrandCrownBurst3D(x, y, z, size = 1.6) {
    const count = Math.floor(360 * size);
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random());
      const sinPhi = Math.sin(phi);

      const vx = r * sinPhi * Math.cos(theta);
      const vy = r * sinPhi * Math.sin(theta);
      const vz = r * Math.cos(phi);

      const speed = (0.25 + Math.random() * 0.75) * (10.0 * size);
      const isCore = Math.random() < 0.22;
      p.init(
        x, y, z,
        vx * speed, vy * speed, vz * speed,
        isCore ? '#FFFFFF' : (Math.random() < 0.7 ? '#FFD700' : '#FFAA00'),
        3.0,
        0.0068 + Math.random() * 0.004,
        'willow',
        '#FFF5CC',
        0.035,
        0.98
      );
    }
  }

  update() {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.update();
      if (r.isDead) {
        this.explode(r.x, r.y, r.z, r.shellType, r.color, r.size);
        this.rockets.splice(i, 1);
      }
    }

    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      if (!p.isDead) {
        p.update(this);
      }
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha -= 0.028;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.84;
      if (this.shakeIntensity < 0.08) this.shakeIntensity = 0;
    }
  }

  render() {
    this.ctx.save();

    if (this.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.ctx.translate(dx, dy);
    }

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = 'rgba(0, 0, 3, 0.20)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.flashAlpha > 0) {
      this.ctx.fillStyle = `rgba(255, 230, 190, ${this.flashAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    this.ctx.globalCompositeOperation = 'lighter';

    const centerX = this.width / 2;
    const centerY = this.isPortrait ? this.height * 0.38 : this.height * 0.45;

    for (let i = 0; i < this.rockets.length; i++) {
      this.rockets[i].draw(this.ctx, this.focalLength, centerX, centerY);
    }

    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      if (!p.isDead) {
        p.draw(this.ctx, this.focalLength, centerX, centerY, this.waterLevel);
      }
    }

    this.ctx.restore();
  }
}

window.FireworksEngine = FireworksEngine;
