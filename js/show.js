// 20-Second Disney Fireworks Show Choreographer - Multi-Device & iPhone Portrait Optimized
class ShowController {
  constructor(engine) {
    this.engine = engine;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 20.5;
    this.lastFrameTime = 0;
    this.initEvents();
  }

  initEvents() {
    // Touch & pointer handling for iPhone / iPad / Desktop
    const handleLaunch = (clientX, clientY) => {
      if (window.soundEngine) {
        window.soundEngine.init();
        window.soundEngine.resume();
      }

      const rect = this.engine.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const isPortrait = this.engine.width < this.engine.height;
      const startX = this.engine.width * (0.35 + Math.random() * 0.3);
      const startY = isPortrait ? this.engine.height * 0.78 : this.engine.height * 0.86;

      const types = ['chrysanthemum', 'peony', 'willow', 'heart', 'ring', 'crossette', 'strobe', 'grandFinale'];
      const type = types[Math.floor(Math.random() * types.length)];
      const palettes = ['disneyGold', 'cinderella', 'royalFantasy', 'tangledLantern', 'frozenIce', 'belleRose', 'grandRainbow'];
      const palette = palettes[Math.floor(Math.random() * palettes.length)];

      this.engine.launch(startX, startY, x, y, type, palette, 1.3 + Math.random() * 0.5);
    };

    this.engine.canvas.addEventListener('pointerdown', (e) => {
      handleLaunch(e.clientX, e.clientY);
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        handleLaunch(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    
    if (window.soundEngine) {
      window.soundEngine.init();
      window.soundEngine.startMusic(1);
    }

    this.loop();
  }

  loop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.currentTime += dt;

    this.choreograph(this.currentTime, dt);

    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
      if (window.soundEngine) {
        window.soundEngine.setAct(1);
      }
    }

    this.engine.update();
    this.engine.render();

    requestAnimationFrame(() => this.loop());
  }

  choreograph(t, dt) {
    const W = this.engine.width;
    const H = this.engine.height;
    const isPortrait = W < H;

    const castleLeft = isPortrait ? W * 0.28 : W * 0.34;
    const castleCenter = W * 0.5;
    const castleRight = isPortrait ? W * 0.72 : W * 0.66;
    const groundY = isPortrait ? H * 0.78 : H * 0.86;

    // ========================================================
    // 1. 序曲前摇 (0.0s - 7.5s: 奇迹序曲 / Prelude) ~7.5秒
    // ========================================================
    if (t >= 0 && t < 7.5) {
      // 1.8s - 4.2s: Tinkerbell golden pixie dust arc across the sky
      if (t >= 1.8 && t < 4.2) {
        if (Math.random() < 0.45) {
          const progress = (t - 1.8) / 2.4;
          const fairyX = W * 0.12 + progress * (W * 0.76);
          const fairyY = (isPortrait ? H * 0.32 : H * 0.38) - Math.sin(progress * Math.PI) * (H * 0.22);
          this.engine.explode(fairyX, fairyY, 0, 'fairy', '#FFF8DB', 0.65);
        }
      }

      // 4.6s: Single elegant ascending golden willow from central spire
      if (this.isTriggerTime(t, 4.6, dt)) {
        this.engine.launch(castleCenter, groundY, castleCenter, isPortrait ? H * 0.16 : H * 0.20, 'willow', 'disneyGold', 2.1);
      }

      // 6.0s: Flanking soft lavender & ice-blue peonies
      if (this.isTriggerTime(t, 6.0, dt)) {
        this.engine.launch(castleLeft, groundY, castleLeft - W * 0.08, isPortrait ? H * 0.26 : H * 0.30, 'peony', 'cinderella', 1.35);
        this.engine.launch(castleRight, groundY, castleRight + W * 0.08, isPortrait ? H * 0.26 : H * 0.30, 'peony', 'frozenIce', 1.35);
      }
    }

    // ========================================================
    // 2. 渐入佳境 (7.5s - 13.0s: 梦幻华章 / Buildup) ~5.5秒
    // ========================================================
    else if (t >= 7.5 && t < 13.0) {
      if (this.isTriggerTime(t, 7.6, dt) && window.soundEngine) {
        window.soundEngine.setAct(2);
      }

      // 7.8s: Twin 3D Romantic Hearts
      if (this.isTriggerTime(t, 7.8, dt)) {
        this.engine.launch(castleLeft, groundY, W * 0.38, isPortrait ? H * 0.20 : H * 0.24, 'heart', 'belleRose', 1.45);
        this.engine.launch(castleRight, groundY, W * 0.62, isPortrait ? H * 0.20 : H * 0.24, 'heart', 'tangledLantern', 1.45);
      }

      // 9.5s: Double Crossette Burst
      if (this.isTriggerTime(t, 9.5, dt)) {
        this.engine.launch(castleLeft, groundY, W * 0.24, isPortrait ? H * 0.22 : H * 0.27, 'crossette', 'royalFantasy', 1.4);
        this.engine.launch(castleRight, groundY, W * 0.76, isPortrait ? H * 0.22 : H * 0.27, 'crossette', 'cinderella', 1.4);
      }

      // 11.2s: 3D Saturn Rings & Strobe
      if (this.isTriggerTime(t, 11.2, dt)) {
        this.engine.launch(castleCenter - 60, groundY, W * 0.38, isPortrait ? H * 0.16 : H * 0.20, 'ring', 'grandRainbow', 1.45);
        this.engine.launch(castleCenter + 60, groundY, W * 0.62, isPortrait ? H * 0.16 : H * 0.20, 'strobe', 'disneyGold', 1.45);
      }
    }

    // ========================================================
    // 3. 连续猛烈高潮 (13.0s - 17.0s: 烈焰交响) ~4.0秒
    // ========================================================
    else if (t >= 13.0 && t < 17.0) {
      if (this.isTriggerTime(t, 13.1, dt) && window.soundEngine) {
        window.soundEngine.setAct(3);
      }

      if (Math.random() < 0.58) {
        const startX = W * (0.22 + Math.random() * 0.56);
        const targetX = W * (0.08 + Math.random() * 0.84);
        const targetY = isPortrait ? H * (0.08 + Math.random() * 0.32) : H * (0.12 + Math.random() * 0.36);

        const types = ['chrysanthemum', 'peony', 'willow', 'crossette', 'strobe', 'ring'];
        const type = types[Math.floor(Math.random() * types.length)];
        const palettes = ['grandRainbow', 'disneyGold', 'royalFantasy', 'tangledLantern', 'belleRose'];
        const palette = palettes[Math.floor(Math.random() * palettes.length)];

        this.engine.launch(startX, groundY, targetX, targetY, type, palette, 1.25 + Math.random() * 0.5);
      }

      if (this.isTriggerTime(t, 14.5, dt)) {
        this.engine.launch(castleCenter, groundY, castleCenter, isPortrait ? H * 0.12 : H * 0.15, 'willow', 'disneyGold', 2.2);
        this.engine.launch(W * 0.22, groundY, W * 0.25, isPortrait ? H * 0.15 : H * 0.18, 'chrysanthemum', 'grandRainbow', 1.7);
        this.engine.launch(W * 0.78, groundY, W * 0.75, isPortrait ? H * 0.15 : H * 0.18, 'chrysanthemum', 'grandRainbow', 1.7);
      }
    }

    // ========================================================
    // 4. 终极璀璨绝杀 (17.0s - 20.5s: 终极金锦冠) ~3.5秒
    // ========================================================
    else if (t >= 17.0 && t < 20.5) {
      if (this.isTriggerTime(t, 17.1, dt) && window.soundEngine) {
        window.soundEngine.setAct(4);
      }

      if (t < 18.5) {
        if (Math.random() < 0.82) {
          const startX = W * (0.16 + Math.random() * 0.68);
          const targetX = W * (0.06 + Math.random() * 0.88);
          const targetY = isPortrait ? H * (0.06 + Math.random() * 0.36) : H * (0.08 + Math.random() * 0.40);
          this.engine.launch(startX, groundY, targetX, targetY, 'grandFinale', 'disneyGold', 1.5 + Math.random() * 0.6);
        }
      }

      if (this.isTriggerTime(t, 18.6, dt)) {
        const positions = [0.15, 0.32, 0.5, 0.68, 0.85];
        positions.forEach((posRatio, idx) => {
          setTimeout(() => {
            this.engine.launch(W * posRatio, groundY, W * posRatio, isPortrait ? H * (0.08 + Math.random() * 0.08) : H * (0.10 + Math.random() * 0.08), 'grandFinale', 'disneyGold', 2.35);
          }, idx * 85);
        });
      }
    }
  }

  isTriggerTime(currentTime, targetTime, dt) {
    return currentTime >= targetTime && (currentTime - dt) < targetTime;
  }
}

window.ShowController = ShowController;
