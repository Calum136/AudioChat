/**
 * Simple sound effects using Web Audio API oscillators.
 * No external files needed — everything is synthesized.
 * Respects audio settings from audioSettingsStore.
 */

import { useAudioSettingsStore } from '../stores/audioSettingsStore';

let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function getSfxVolume() {
  const { masterVolume, sfxVolume, sfxEnabled } = useAudioSettingsStore.getState();
  if (!sfxEnabled) return 0;
  return masterVolume * sfxVolume;
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  const vol = getSfxVolume();
  if (vol === 0) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume * vol;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** Friend joined the room — bright ascending chime */
export function playJoinSound() {
  const vol = getSfxVolume();
  if (vol === 0) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.12 * vol;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + 0.25 + i * 0.08);
  });
}

/** Friend left the room — descending soft tone */
export function playLeaveSound() {
  const vol = getSfxVolume();
  if (vol === 0) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  [659, 523].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.1 * vol;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + 0.3 + i * 0.1);
  });
}

/** Knock sound — someone requesting to join your room */
export function playKnockSound() {
  const vol = getSfxVolume();
  if (vol === 0) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Three short percussive knocks
  [0, 0.15, 0.3].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 180;
    osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.06);
    gain.gain.value = 0.15 * vol;
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.1);
  });
}
