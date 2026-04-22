import { create } from 'zustand';

const STORAGE_KEY = 'sq-audio-settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Debounce localStorage writes so rapid slider drags don't hammer disk
let saveTimer = null;
function scheduleSave(settings) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, 200);
}

const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

const defaults = {
  masterVolume: 1,
  sfxVolume: 0.8,
  voiceVolume: 1,
  micInputVolume: 1,
  sfxEnabled: true,
};

const saved = loadSettings();

export const useAudioSettingsStore = create((set, get) => ({
  ...defaults,
  ...saved,

  setMasterVolume: (v) => { const c = clamp01(v); set({ masterVolume: c }); scheduleSave({ ...get(), masterVolume: c }); },
  setSfxVolume: (v) => { const c = clamp01(v); set({ sfxVolume: c }); scheduleSave({ ...get(), sfxVolume: c }); },
  setVoiceVolume: (v) => { const c = clamp01(v); set({ voiceVolume: c }); scheduleSave({ ...get(), voiceVolume: c }); },
  setMicInputVolume: (v) => { const c = clamp01(v); set({ micInputVolume: c }); scheduleSave({ ...get(), micInputVolume: c }); },
  setSfxEnabled: (v) => { set({ sfxEnabled: !!v }); scheduleSave({ ...get(), sfxEnabled: !!v }); },
}));
