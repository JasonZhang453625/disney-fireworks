// Web Audio API Sound Synthesizer with iOS Safari Audio Pipeline Support
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.initialized = false;
    this.musicInterval = null;
    this.chordStep = 0;
    this.currentAct = 1;
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Play silent buffer for iOS Safari audio pipeline unlock
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);

      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API initialization note:", e);
    }
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Firework Launch Whistle
  playLaunch(pitch = 1, volume = 0.5) {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450 * pitch, t);
    filter.frequency.exponentialRampToValueAtTime(1500 * pitch, t + 0.3);
    filter.Q.setValueAtTime(4, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(volume * 0.28, t + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.35);
  }

  // Deep booming explosion
  playExplosion(size = 1, type = 'normal') {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const duration = Math.min(1.6, 0.75 + size * 0.35);

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(115, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + duration * 0.7);

    const subVol = Math.min(0.9, 0.42 * size);
    subGain.gain.setValueAtTime(subVol, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + duration);

    // Noise burst
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + duration * 0.8);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(Math.min(0.75, 0.38 * size), t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSource.start(t);
    noiseSource.stop(t + duration);

    if (type === 'willow' || type === 'crackle' || Math.random() < 0.3) {
      setTimeout(() => {
        this.playCrackle(size);
      }, 320 + Math.random() * 180);
    }
  }

  // Golden crackles / dragon eggs
  playCrackle(intensity = 1) {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    this.resume();
    const count = Math.floor(5 + intensity * 5);
    const t = this.ctx.currentTime;

    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 0.55;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850 + Math.random() * 2100, t + delay);

      gain.gain.setValueAtTime(0.07 * intensity, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.035);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.04);
    }
  }

  // Magical Celesta / Harp Chime
  playMagicChime(freq = 1046.5, delay = 0) {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime + delay;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 1.6);
  }

  startMusic(act = 1) {
    this.currentAct = act;
    if (this.musicInterval) clearInterval(this.musicInterval);

    const notes = [
      261.63, 293.66, 329.63, 392.00, 440.00,
      523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1318.51
    ];

    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C major
      [220.00, 261.63, 329.63, 440.00], // A minor
      [174.61, 220.00, 261.63, 349.23], // F major
      [196.00, 246.94, 293.66, 392.00], // G major
      [261.63, 329.63, 392.00, 659.25], // C add9
      [174.61, 261.63, 329.63, 523.25]  // F maj7
    ];

    let noteIdx = 0;
    this.musicInterval = setInterval(() => {
      if (this.isMuted || !this.initialized) return;

      const chord = chords[this.chordStep % chords.length];
      
      if (this.currentAct === 1) {
        const note = chord[noteIdx % chord.length] * (Math.random() > 0.5 ? 2 : 1);
        this.playMagicChime(note, 0);
        if (Math.random() < 0.25) {
          this.playMagicChime(notes[Math.floor(Math.random() * notes.length)] * 1.5, 0.2);
        }
      } else if (this.currentAct === 2) {
        this.playMagicChime(chord[0] * 1.5, 0);
        this.playMagicChime(chord[1] * 1.5, 0.15);
        this.playMagicChime(chord[2] * 2, 0.3);
      } else if (this.currentAct >= 3) {
        this.playMagicChime(chord[noteIdx % chord.length] * 2, 0);
        this.playMagicChime(chord[(noteIdx + 2) % chord.length] * 2, 0.1);
        this.playMagicChime(chord[(noteIdx + 1) % chord.length] * 2.5, 0.2);
      }

      noteIdx++;
      if (noteIdx % 4 === 0) {
        this.chordStep++;
      }
    }, this.currentAct === 1 ? 650 : this.currentAct === 2 ? 480 : 340);
  }

  setAct(act) {
    this.currentAct = act;
    this.startMusic(act);
  }
}

window.soundEngine = new SoundEngine();
