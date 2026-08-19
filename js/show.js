// Disney Fireworks Show Choreographer & Timeline Controller
class ShowController {
  constructor(engine) {
    this.engine = engine;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 98; // Total show seconds
    this.currentActIndex = 0;
    this.autoSandbox = false;
    this.timer = null;
    this.lastFrameTime = 0;

    this.acts = [
      {
        id: 1,
        startTime: 0,
        endTime: 24,
        title: "第一幕 · 奇迹序曲",
        enTitle: "Act I · The Magic Begins",
        desc: "当星光洒落城堡，静谧的夜空孕育着最初的梦境...",
        themeColor: "#89CFF0"
      },
      {
        id: 2,
        startTime: 24,
        endTime: 46,
        title: "第二幕 · 梦幻华章",
        enTitle: "Act II · A Dream is a Wish",
        desc: "斑斓的色彩在夜空起舞，编织出浪漫与希望的旋律...",
        themeColor: "#C77DFF"
      },
      {
        id: 3,
        startTime: 46,
        endTime: 78,
        title: "第三幕 · 烈焰交响",
        enTitle: "Act III · Symphonic Ignition",
        desc: "连续轰鸣的猛烈烟花狂潮！点亮浩瀚无垠的璀璨夜空！",
        themeColor: "#FFD700"
      },
      {
        id: 4,
        startTime: 78,
        endTime: 98,
        title: "第四幕 · 终极璀璨",
        enTitle: "Act IV · Happily Ever After",
        desc: "万丈金瀑倾泻而下，千朵礼花齐聚城堡之巅！",
        themeColor: "#FFAA00"
      }
    ];

    this.initEvents();
  }

  initEvents() {
    // Click / touch canvas to launch manual firework
    this.engine.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.engine.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Random launch from ground bottom
      const startX = this.engine.width * (0.3 + Math.random() * 0.4);
      const startY = this.engine.height * 0.88;

      const types = ['chrysanthemum', 'peony', 'willow', 'heart', 'ring', 'crossette', 'strobe'];
      const type = types[Math.floor(Math.random() * types.length)];
      const palettes = ['disneyGold', 'cinderella', 'frozen', 'tangled', 'ariel', 'belle', 'grandRainbow'];
      const palette = palettes[Math.floor(Math.random() * palettes.length)];

      this.engine.launch(startX, startY, x, y, type, palette, 1.2 + Math.random() * 0.5);
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

    this.updateActUI(0);
    this.loop();
  }

  pause() {
    this.isPlaying = false;
    if (window.soundEngine) {
      window.soundEngine.stopMusic();
    }
  }

  resume() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    if (window.soundEngine) {
      window.soundEngine.startMusic(this.acts[this.currentActIndex]?.id || 1);
    }
    this.loop();
  }

  seekTo(seconds) {
    this.currentTime = Math.max(0, Math.min(this.duration, seconds));
    this.updateActByIndex(this.getActIndexAt(this.currentTime));
    this.updateProgressBar();
  }

  jumpToClimax() {
    this.seekTo(46); // Jump straight to Act 3
    if (!this.isPlaying) {
      this.resume();
    }
  }

  restart() {
    this.currentTime = 0;
    this.currentActIndex = 0;
    this.seekTo(0);
    if (!this.isPlaying) {
      this.start();
    }
  }

  getActIndexAt(time) {
    for (let i = 0; i < this.acts.length; i++) {
      if (time >= this.acts[i].startTime && time < this.acts[i].endTime) {
        return i;
      }
    }
    return this.acts.length - 1;
  }

  updateActByIndex(index) {
    if (index !== this.currentActIndex) {
      this.currentActIndex = index;
      this.updateActUI(index);
      if (window.soundEngine) {
        window.soundEngine.setAct(this.acts[index].id);
      }
    }
  }

  updateActUI(index) {
    const act = this.acts[index];
    if (!act) return;

    const badgeEl = document.getElementById('act-badge');
    const titleEl = document.getElementById('act-title');
    const descEl = document.getElementById('act-desc');
    const container = document.getElementById('narrative-box');

    if (container && badgeEl && titleEl && descEl) {
      container.classList.remove('fade-in');
      container.classList.add('fade-out');

      setTimeout(() => {
        badgeEl.textContent = act.enTitle;
        titleEl.textContent = act.title;
        descEl.textContent = act.desc;
        container.classList.remove('fade-out');
        container.classList.add('fade-in');
      }, 400);
    }

    // Adjust searchlight intensity
    const searchlights = document.getElementById('searchlights');
    if (searchlights) {
      searchlights.style.opacity = index === 0 ? '0.2' : (index === 1 ? '0.5' : '0.9');
    }
  }

  updateProgressBar() {
    const fill = document.getElementById('timeline-fill');
    const curTimeEl = document.getElementById('current-time-text');
    if (fill) {
      const pct = (this.currentTime / this.duration) * 100;
      fill.style.width = `${Math.min(100, pct)}%`;
    }
    if (curTimeEl) {
      const curM = Math.floor(this.currentTime / 60);
      const curS = Math.floor(this.currentTime % 60).toString().padStart(2, '0');
      const totM = Math.floor(this.duration / 60);
      const totS = Math.floor(this.duration % 60).toString().padStart(2, '0');
      curTimeEl.textContent = `${curM}:${curS} / ${totM}:${totS}`;
    }
  }

  loop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.currentTime += dt;
    this.updateProgressBar();

    const actIdx = this.getActIndexAt(this.currentTime);
    this.updateActByIndex(actIdx);

    // Choreograph fireworks based on timeline
    this.choreograph(this.currentTime, dt);

    // End of scripted show -> Seamless infinite celebration sandbox
    if (this.currentTime >= this.duration) {
      // Loop or free celebration
      this.currentTime = 46; // Loop back to intense climax or repeat
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

    // --- ACT 1: 前摇 (The Magic Begins / 0s - 24s) ---
    if (t >= 0 && t < 24) {
      // 4s: Tinkerbell fairy flight across sky
      if (t >= 4 && t < 8.5) {
        if (Math.random() < 0.3) {
          const progress = (t - 4) / 4.5;
          const fairyX = W * 0.15 + progress * (W * 0.7);
          const fairyY = H * 0.45 - Math.sin(progress * Math.PI) * (H * 0.25);
          this.engine.explode(fairyX, fairyY, 'fairy', '#FFF8DB', 0.6);
        }
      }

      // 8s: Single majestic central ascending willow
      if (this.isTriggerTime(t, 8.2, dt)) {
        this.engine.launch(castleCenter, groundY, castleCenter, H * 0.25, 'willow', 'disneyGold', 1.8);
      }

      // 14s & 18s: Gentle dual tower spires
      if (this.isTriggerTime(t, 14.0, dt)) {
        this.engine.launch(castleLeft, groundY, castleLeft - W * 0.05, H * 0.35, 'peony', 'cinderella', 1.2);
        this.engine.launch(castleRight, groundY, castleRight + W * 0.05, H * 0.35, 'peony', 'frozen', 1.2);
      }

      if (this.isTriggerTime(t, 19.5, dt)) {
        this.engine.launch(castleCenter - 40, groundY, castleCenter - 80, H * 0.3, 'strobe', 'tangled', 1.3);
        this.engine.launch(castleCenter + 40, groundY, castleCenter + 80, H * 0.3, 'strobe', 'belle', 1.3);
      }
    }

    // --- ACT 2: 渐入佳境 (Buildup / 24s - 46s) ---
    else if (t >= 24 && t < 46) {
      // Periodic rhythmic dual launches (every 2.5s)
      const step = Math.floor((t - 24) / 2.2);
      if (this.isTriggerTime(t, 24 + step * 2.2, dt)) {
        const types = ['heart', 'ring', 'crossette', 'peony', 'chrysanthemum'];
        const currentType = types[step % types.length];
        const palettes = ['tangled', 'ariel', 'cinderella', 'belle', 'disneyGold'];
        const pal = palettes[step % palettes.length];

        this.engine.launch(castleLeft, groundY, W * (0.2 + Math.random() * 0.25), H * (0.25 + Math.random() * 0.2), currentType, pal, 1.3);
        this.engine.launch(castleRight, groundY, W * (0.55 + Math.random() * 0.25), H * (0.25 + Math.random() * 0.2), currentType, pal, 1.3);
      }

      // Intermittent central salute
      if (this.isTriggerTime(t, 35.0, dt) || this.isTriggerTime(t, 42.0, dt)) {
        this.engine.launch(castleCenter, groundY, castleCenter, H * 0.18, 'willow', 'disneyGold', 1.7);
      }
    }

    // --- ACT 3: 狂潮爆发 · 连续猛烈烟花 (Intense Fireworks Climax / 46s - 78s) ---
    else if (t >= 46 && t < 78) {
      // Continuous rapid fire barrage (5-8 launches every second!)
      const launchRate = 0.18; // Every 180ms
      if (Math.random() < 0.65) {
        const startX = W * (0.25 + Math.random() * 0.5);
        const targetX = W * (0.1 + Math.random() * 0.8);
        const targetY = H * (0.15 + Math.random() * 0.4);

        const types = ['chrysanthemum', 'peony', 'willow', 'crossette', 'strobe', 'ring', 'heart'];
        const type = types[Math.floor(Math.random() * types.length)];
        const palettes = ['grandRainbow', 'disneyGold', 'frozen', 'tangled', 'belle', 'ariel'];
        const palette = palettes[Math.floor(Math.random() * palettes.length)];

        this.engine.launch(startX, groundY, targetX, targetY, type, palette, 1.1 + Math.random() * 0.6);
      }

      // Big heavy shell every 3 seconds
      const waveStep = Math.floor((t - 46) / 3.0);
      if (this.isTriggerTime(t, 46 + waveStep * 3.0, dt)) {
        this.engine.launch(castleCenter, groundY, castleCenter + (Math.random() - 0.5) * 150, H * 0.15, 'willow', 'disneyGold', 2.0);
        this.engine.launch(W * 0.2, groundY, W * 0.25, H * 0.22, 'chrysanthemum', 'grandRainbow', 1.6);
        this.engine.launch(W * 0.8, groundY, W * 0.75, H * 0.22, 'chrysanthemum', 'grandRainbow', 1.6);
      }
    }

    // --- ACT 4: 终极狂欢 (Grand Finale / 78s - 98s) ---
    else if (t >= 78 && t < 98) {
      if (t < 90) {
        // Relentless Grand Finale Barrage (Daylight illumination!)
        if (Math.random() < 0.85) {
          const startX = W * (0.2 + Math.random() * 0.6);
          const targetX = W * (0.05 + Math.random() * 0.9);
          const targetY = H * (0.1 + Math.random() * 0.45);
          this.engine.launch(startX, groundY, targetX, targetY, 'grandFinale', 'disneyGold', 1.4 + Math.random() * 0.6);
        }
      }

      // 91.0s: The Ultimate Synchronized 5-Point Crown Finale
      if (this.isTriggerTime(t, 91.0, dt)) {
        const positions = [0.15, 0.32, 0.5, 0.68, 0.85];
        positions.forEach((posRatio, idx) => {
          setTimeout(() => {
            this.engine.launch(W * posRatio, groundY, W * posRatio, H * (0.12 + Math.random() * 0.1), 'grandFinale', 'disneyGold', 2.2);
          }, idx * 120);
        });
      }
    }
  }

  isTriggerTime(currentTime, targetTime, dt) {
    return currentTime >= targetTime && (currentTime - dt) < targetTime;
  }
}

window.ShowController = ShowController;
