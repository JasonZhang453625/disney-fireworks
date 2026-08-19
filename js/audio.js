// Web Audio API Sound Synthesizer for Disney Fireworks Show
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
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  resume() {
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

  setMute(mute) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
  }

  // Firework Launch Whistle / Whoosh
  playLaunch(pitch = 1, volume = 0.5) {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Noise whoosh
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400 * pitch, t);
    filter.frequency.exponentialRampToValueAtTime(1400 * pitch, t + 0.35);
    filter.Q.setValueAtTime(4, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(volume * 0.3, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.38);

    // Whistling tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(1200 * pitch, t + 0.35);

    oscGain.gain.setValueAtTime(0.01, t);
    oscGain.gain.linearRampToValueAtTime(volume * 0.15, t + 0.05);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.38);
  }

  // Deep booming explosion
  playExplosion(size = 1, type = 'normal') {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const duration = Math.min(1.8, 0.8 + size * 0.4);

    // Sub-bass thump (35Hz - 110Hz drop)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, t);
    subOsc.frequency.exponentialRampToValueAtTime(32, t + duration * 0.7);

    const subVol = Math.min(1.0, 0.45 * size);
    subGain.gain.setValueAtTime(subVol, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + duration);

    // Noise burst with acoustic reverb-like decay
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.28));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + duration * 0.8);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(Math.min(0.8, 0.4 * size), t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSource.start(t);
    noiseSource.stop(t + duration);

    // Crackle effect for willow / brocade
    if (type === 'willow' || type === 'crackle' || Math.random() < 0.35) {
      setTimeout(() => {
        this.playCrackle(size);
      }, 350 + Math.random() * 200);
    }
  }

  // Golden crackles / dragon eggs
  playCrackle(intensity = 1) {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const count = Math.floor(6 + intensity * 6);
    const t = this.ctx.currentTime;

    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 0.6;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 2200, t + delay);

      gain.gain.setValueAtTime(0.08 * intensity, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.05);
    }
  }

  // Magical Celesta / Harp Chime (Disney Prelude)
  playMagicChime(freq = 1046.5, delay = 0) {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime + delay;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 1.8);
  }

  // Start background Disney magical theme soundtrack (Synthesized Orchestral Fantasy)
  startMusic(act = 1) {
    this.currentAct = act;
    if (this.musicInterval) clearInterval(this.musicInterval);

    // Major scale frequencies: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6
    const notes = [
      261.63, 293.66, 329.63, 392.00, 440.00,
      523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1318.51
    ];

    // Disney fantasy chord progressions (When you wish upon a star / fantasy vibe)
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
      
      // Play shimmering arpeggio
      if (this.currentAct === 1) {
        // Gentle, slow, dreamy
        const note = chord[noteIdx % chord.length] * (Math.random() > 0.5 ? 2 : 1);
        this.playMagicChime(note, 0);
        if (Math.random() < 0.3) {
          this.playMagicChime(notes[Math.floor(Math.random() * notes.length)] * 1.5, 0.2);
        }
      } else if (this.currentAct === 2) {
        // Romantic & majestic
        this.playMagicChime(chord[0] * 1.5, 0);
        this.playMagicChime(chord[1] * 1.5, 0.15);
        this.playMagicChime(chord[2] * 2, 0.3);
      } else if (this.currentAct >= 3) {
        // Grand, intense, brassy harmony
        this.playMagicChime(chord[noteIdx % chord.length] * 2, 0);
        this.playMagicChime(chord[(noteIdx + 2) % chord.length] * 2, 0.1);
        this.playMagicChime(chord[(noteIdx + 1) % chord.length] * 2.5, 0.2);
      }

      noteIdx++;
      if (noteIdx % 4 === 0) {
        this.chordStep++;
      }
    }, this.currentAct === 1 ? 700 : this.currentAct === 2 ? 500 : 350);
  }

  setAct(act) {
    this.currentAct = act;
    this.startMusic(act);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

window.soundEngine = new SoundEngine();
