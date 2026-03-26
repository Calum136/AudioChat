import { create } from 'zustand';

/**
 * Music store — ambient lo-fi music when a jukebox is in the room.
 * Uses Web Audio API to generate chill procedural music (no external files).
 */

let audioCtx = null;
let masterGain = null;
let isPlaying = false;
let schedulerInterval = null;

// Pentatonic scale notes for lo-fi chill vibes (C minor pentatonic)
const SCALE = [261.63, 293.66, 311.13, 349.23, 392.00, 466.16, 523.25]; // C4 Eb4 F4 G4 Bb4 Eb5 C5
const BASS_NOTES = [65.41, 73.42, 87.31, 98.00]; // C2 D2 F2 G2
const CHORD_SETS = [
  [261.63, 311.13, 392.00], // Cm
  [233.08, 293.66, 349.23], // Bb
  [220.00, 261.63, 329.63], // Am (passing)
  [246.94, 311.13, 369.99], // Eb
];

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(audioCtx.destination);
  }
  return { ctx: audioCtx, master: masterGain };
}

function playNote(freq, startTime, duration, type = 'sine', volume = 0.3) {
  const { ctx, master } = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  // Soft attack and release for lo-fi feel
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
  gain.gain.setValueAtTime(volume, startTime + duration - 0.1);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gain);
  gain.connect(master);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playChord(notes, startTime, duration) {
  notes.forEach(freq => {
    playNote(freq * 0.5, startTime, duration, 'triangle', 0.08);
  });
}

let beatIndex = 0;

function scheduleBar() {
  if (!isPlaying || !audioCtx) return;

  const now = audioCtx.currentTime;
  const bpm = 70;
  const beatLen = 60 / bpm;

  // Schedule 4 beats ahead
  for (let i = 0; i < 4; i++) {
    const beatTime = now + i * beatLen;

    // Bass note every 2 beats
    if ((beatIndex + i) % 2 === 0) {
      const bassNote = BASS_NOTES[Math.floor(Math.random() * BASS_NOTES.length)];
      playNote(bassNote, beatTime, beatLen * 1.8, 'triangle', 0.12);
    }

    // Chord pad every 4 beats
    if ((beatIndex + i) % 4 === 0) {
      const chord = CHORD_SETS[Math.floor(Math.random() * CHORD_SETS.length)];
      playChord(chord, beatTime, beatLen * 3.5);
    }

    // Melody — random pentatonic notes, 60% chance per beat
    if (Math.random() > 0.4) {
      const note = SCALE[Math.floor(Math.random() * SCALE.length)];
      const dur = (Math.random() > 0.5 ? 2 : 1) * beatLen * 0.8;
      playNote(note, beatTime + beatLen * 0.05, dur, 'sine', 0.06);
    }

    // Hi-hat tick (noise-like) — high frequency blip
    if (Math.random() > 0.3) {
      playNote(8000 + Math.random() * 2000, beatTime, 0.03, 'square', 0.015);
    }
  }

  beatIndex += 4;
}

function startMusic() {
  if (isPlaying) return;
  const { ctx } = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  isPlaying = true;
  beatIndex = 0;
  scheduleBar();
  schedulerInterval = setInterval(scheduleBar, (60 / 70) * 4 * 1000 - 100); // schedule just before bar ends
}

function stopMusic() {
  isPlaying = false;
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

export const useMusicStore = create((set, get) => ({
  isEnabled: false,
  volume: 0.15,

  toggleMusic: () => {
    const { isEnabled } = get();
    if (isEnabled) {
      stopMusic();
      set({ isEnabled: false });
    } else {
      startMusic();
      set({ isEnabled: true });
    }
  },

  setVolume: (vol) => {
    set({ volume: vol });
    if (masterGain) {
      masterGain.gain.value = vol;
    }
  },

  // Call when leaving room
  cleanup: () => {
    stopMusic();
    set({ isEnabled: false });
  },
}));
