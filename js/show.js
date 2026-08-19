// 20-Second Disney Fireworks Choreographer & Timeline Controller
class ShowController {
  constructor(engine) {
    this.engine = engine;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 20.5; // Exactly ~20 seconds show cycle
    this.lastFrameTime = 0;
    this.initEvents();
  }

  initEvents() {
    // Click / touch canvas anywhere to launch custom firework & unlock audio
    const handlePointer = (e) => {
      if (window.soundEngine) {
        window.soundEngine.init();
        window.soundEngine.resume();
      }

      const rect = this.engine.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const startX = this.engine.width * (0.3 + Math.random() * 0.4);
      const startY = this.engine.height * 0.88;

      const types = ['chrysanthemum', 'peony', 'willow', 'heart', 'ring', 'crossette', 'strobe', 'grandFinale'];
      const type = types[Math.floor(Math.random() * types.length)];
      const palettes = ['disneyGold', 'cinderella', 'frozen', 'tangled', 'ariel', 'belle', 'grandRainbow'];
      const palette = palettes[Math.floor(Math.random() * palettes.length)];

      this.engine.launch(startX, startY, x, y, type, palette, 1.2 + Math.random() * 0.5);
    };

    this.engine.canvas.addEventListener('pointerdown', handlePointer);
    window.addEventListener('keydown', () => {
      if (window.soundEngine) {
        window.soundEngine.init();
        window.soundEngine.resume();
      }
    });
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

    // Choreograph fireworks along the 20-second timeline
    this.choreograph(this.currentTime, dt);

    // Auto-loop seamlessly after 20 seconds
    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
      if (window.soundEngine) {
        window.soundEngine.setAct(1);
      }
    }

    // Update fireworks physics & render
    this.engine.update();
    this.engine.render();

    requestAnimationFrame(() => this.loop());
  }

  choreograph(t, dt) {
    const W = this.engine.width;
    const H = this.engine.height;
    const castleLeft = W * 0.35;
    const castleCenter = W * 0.5;
    const castleRight = W * 0.65;
    const groundY = H * 0.88;

    // ==========================================
    // 1. 前摇阶段 (0s - 7s: 奇迹序曲) ~7秒
    // ==========================================
    if (t >= 0 && t < 7.0) {
      // 1.8s - 4.2s: Tinkerbell golden pixie dust arc across the sky
      if (t >= 1.8 && t < 4.2) {
        if (Math.random() < 0.4) {
          const progress = (t - 1.8) / 2.4;
          const fairyX = W * 0.15 + progress * (W * 0.7);
          const fairyY = H * 0.42 - Math.sin(progress * Math.PI) * (H * 0.22);
          this.engine.explode(fairyX, fairyY, 'fairy', '#FFF8DB', 0.6);
        }
      }

      // 4.5s: Single elegant ascending golden willow from center spire
      if (this.isTriggerTime(t, 4.5, dt)) {
        this.engine.launch(castleCenter, groundY, castleCenter, H * 0.22, 'willow', 'disneyGold', 2.0);
      }

      // 5.8s: Flanking soft lavender & ice-blue peonies
      if (this.isTriggerTime(t, 5.8, dt)) {
        this.engine.launch(castleLeft, groundY, castleLeft - W * 0.08, H * 0.32, 'peony', 'cinderella', 1.3);
        this.engine.launch(castleRight, groundY, castleRight + W * 0.08, H * 0.32, 'peony', 'frozen', 1.3);
      }
    }

    // ==========================================
    // 2. 渐入佳境 (7s - 12s: 梦幻华章) ~5秒
    // ==========================================
    else if (t >= 7.0 && t < 12.0) {
      if (this.isTriggerTime(t, 7.1, dt) && window.soundEngine) {
        window.soundEngine.setAct(2);
      }

      // 7.2s: Twin Heart Bursts
      if (this.isTriggerTime(t, 7.2, dt)) {
        this.engine.launch(castleLeft, groundY, W * 0.38, H * 0.25, 'heart', 'tangled', 1.4);
        this.engine.launch(castleRight, groundY, W * 0.62, H * 0.25, 'heart', 'belle', 1.4);
      }

      // 8.8s: Double Crossette Burst
      if (this.isTriggerTime(t, 8.8, dt)) {
        this.engine.launch(castleLeft, groundY, W * 0.28, H * 0.28, 'crossette', 'ariel', 1.3);
        this.engine.launch(castleRight, groundY, W * 0.72, H * 0.28, 'crossette', 'cinderella', 1.3);
      }

      // 10.4s: Saturn Rings & Strobe
      if (this.isTriggerTime(t, 10.4, dt)) {
        this.engine.launch(castleCenter - 60, groundY, W * 0.42, H * 0.22, 'ring', 'grandRainbow', 1.4);
        this.engine.launch(castleCenter + 60, groundY, W * 0.58, H * 0.22, 'strobe', 'disneyGold', 1.4);
      }
    }

    // ==========================================
    // 3. 连续猛烈狂潮 (12s - 17s: 烈焰交响) ~5秒
    // ==========================================
    else if (t >= 12.0 && t < 17.0) {
      if (this.isTriggerTime(t, 12.1, dt) && window.soundEngine) {
        window.soundEngine.setAct(3);
      }

      // High frequency continuous barrage (6-10 shells per second)
      if (Math.random() < 0.75) {
        const startX = W * (0.2 + Math.random() * 0.6);
        const targetX = W * (0.08 + Math.random() * 0.84);
        const targetY = H * (0.12 + Math.random() * 0.38);

        const types = ['chrysanthemum', 'peony', 'willow', 'crossette', 'strobe', 'ring', 'heart'];
        const type = types[Math.floor(Math.random() * types.length)];
        const palettes = ['grandRainbow', 'disneyGold', 'frozen', 'tangled', 'belle', 'ariel'];
        const palette = palettes[Math.floor(Math.random() * palettes.length)];

        this.engine.launch(startX, groundY, targetX, targetY, type, palette, 1.2 + Math.random() * 0.6);
      }

      // Intermittent heavy thud shells
      if (this.isTriggerTime(t, 13.5, dt) || this.isTriggerTime(t, 15.2, dt)) {
        this.engine.launch(castleCenter, groundY, castleCenter, H * 0.16, 'willow', 'disneyGold', 2.2);
        this.engine.launch(W * 0.2, groundY, W * 0.22, H * 0.2, 'chrysanthemum', 'grandRainbow', 1.7);
        this.engine.launch(W * 0.8, groundY, W * 0.78, H * 0.2, 'chrysanthemum', 'grandRainbow', 1.7);
      }
    }

    // ==========================================
    // 4. 终极璀璨大绝杀 (17s - 20.5s: 终极狂欢) ~3.5秒
    // ==========================================
    else if (t >= 17.0 && t < 20.5) {
      if (this.isTriggerTime(t, 17.1, dt) && window.soundEngine) {
        window.soundEngine.setAct(4);
      }

      // 17s - 18.5s: Relentless daylight grand barrage
      if (t < 18.5) {
        if (Math.random() < 0.88) {
          const startX = W * (0.15 + Math.random() * 0.7);
          const targetX = W * (0.05 + Math.random() * 0.9);
          const targetY = H * (0.08 + Math.random() * 0.42);
          this.engine.launch(startX, groundY, targetX, targetY, 'grandFinale', 'disneyGold', 1.5 + Math.random() * 0.6);
        }
      }

      // 18.6s: Synchronized 5-Point Apex Crown Grand Salvo
      if (this.isTriggerTime(t, 18.6, dt)) {
        const positions = [0.15, 0.32, 0.5, 0.68, 0.85];
        positions.forEach((posRatio, idx) => {
          setTimeout(() => {
            this.engine.launch(W * posRatio, groundY, W * posRatio, H * (0.1 + Math.random() * 0.1), 'grandFinale', 'disneyGold', 2.3);
          }, idx * 90);
        });
      }
    }
  }

  isTriggerTime(currentTime, targetTime, dt) {
    return currentTime >= targetTime && (currentTime - dt) < targetTime;
  }
}

window.ShowController = ShowController;
