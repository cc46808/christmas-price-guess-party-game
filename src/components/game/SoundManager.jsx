// Sound effects manager for main screen only
// Uses Web Audio API for low latency

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = false;
    this.sounds = {};
  }
  
  async init() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.enabled = true;
      
      // Pre-generate some sounds
      this.sounds = {
        tick: this.createTick(),
        reveal: this.createReveal(),
        success: this.createSuccess(),
        whoosh: this.createWhoosh()
      };
    } catch (e) {
      console.warn('Audio not available:', e);
      this.enabled = false;
    }
  }
  
  createTick() {
    return () => {
      if (!this.enabled) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
    };
  }
  
  createReveal() {
    return () => {
      if (!this.enabled) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.3);
    };
  }
  
  createSuccess() {
    return () => {
      if (!this.enabled) return;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.audioContext.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.3);
        osc.start(this.audioContext.currentTime + i * 0.1);
        osc.stop(this.audioContext.currentTime + i * 0.1 + 0.3);
      });
    };
  }
  
  createWhoosh() {
    return () => {
      if (!this.enabled) return;
      const noise = this.audioContext.createBufferSource();
      const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      }
      noise.buffer = buffer;
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      const gain = this.audioContext.createGain();
      gain.gain.value = 0.3;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioContext.destination);
      noise.start();
    };
  }
  
  play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;
    try {
      this.sounds[soundName]();
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }
}

export const soundManager = new SoundManager();