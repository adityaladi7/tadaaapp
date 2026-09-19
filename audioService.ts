import confetti from 'canvas-confetti';

class AudioService {
  private audioCtx: AudioContext | null = null;
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private musicGain: GainNode | null = null;
  private isPlayingMusic = false;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Speaks aloud automatically with warm, patient cadence
  public speak(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Select Indian English voice if available, otherwise clear natural voice
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(
      (v) => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india')
    );
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    // Patient, deliberate elder cadence
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error/interrupted:', e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  // Barge-in: immediate cancel
  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // Delightful gentle chime for "Tada! You did it yourself."
  public playTadaChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Golden major chord progression (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.22, now + index * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.65);
      });
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  // Celebratory confetti burst
  public triggerConfetti() {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#D97706', '#FBBF24', '#10B981', '#3B82F6'],
      });
    } catch (e) {
      // safe fallback
    }
  }

  // Ambient Indian Santoor & Tanpura Synthesizer for Music & Memories
  public startAmbientIndianMusic(era: '1980s' | '1990s' | 'rafi' | 'bhajans') {
    this.stopAmbientMusic();
    try {
      const ctx = this.getAudioContext();
      this.isPlayingMusic = true;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.musicGain = masterGain;

      // Raga scales (frequencies in Hz)
      // Bhairav / Yaman soothing frequencies
      let droneFrequencies = [130.81, 196.0, 261.63]; // Sa, Pa, Sa (C3, G3, C4)
      if (era === 'bhajans') {
        droneFrequencies = [146.83, 220.0, 293.66]; // D3, A3, D4
      } else if (era === 'rafi') {
        droneFrequencies = [138.59, 207.65, 277.18]; // C#3, G#3, C#4
      }

      // 1. Tanpura continuous warm drone
      droneFrequencies.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Add slow subtle vibrato/shimmer
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.3 + Math.random() * 0.2, ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();
        this.musicOscillators.push(lfo);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.connect(gain);
        gain.connect(masterGain);

        osc.start();
        this.musicOscillators.push(osc);
      });

      // 2. Santoor / Sitar gentle rhythmic plucks in the background
      const ragaNotes = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
      let noteIndex = 0;
      const intervalId = window.setInterval(() => {
        if (!this.isPlayingMusic || ctx.state === 'closed') {
          clearInterval(intervalId);
          return;
        }
        const noteFreq = ragaNotes[(noteIndex + Math.floor(Math.random() * 3)) % ragaNotes.length];
        noteIndex = (noteIndex + 1) % ragaNotes.length;

        const pluckOsc = ctx.createOscillator();
        const pluckGain = ctx.createGain();

        pluckOsc.type = 'sine';
        pluckOsc.frequency.setValueAtTime(noteFreq, ctx.currentTime);

        pluckGain.gain.setValueAtTime(0.09, ctx.currentTime);
        pluckGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        pluckOsc.connect(pluckGain);
        pluckGain.connect(masterGain);

        pluckOsc.start();
        pluckOsc.stop(ctx.currentTime + 1.3);
      }, 1400);

      // Store interval cleanup
      (this as any)._pluckInterval = intervalId;
    } catch (e) {
      console.warn('Ambient music error:', e);
    }
  }

  public stopAmbientMusic() {
    this.isPlayingMusic = false;
    if ((this as any)._pluckInterval) {
      clearInterval((this as any)._pluckInterval);
      (this as any)._pluckInterval = null;
    }
    this.musicOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.musicOscillators = [];
    if (this.musicGain) {
      try {
        this.musicGain.disconnect();
      } catch (e) {}
      this.musicGain = null;
    }
  }

  public getIsPlayingMusic(): boolean {
    return this.isPlayingMusic;
  }
}

export const audioService = new AudioService();
