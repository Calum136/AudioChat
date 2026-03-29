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

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

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

  setMasterVolume: (v) => { set({ masterVolume: v }); saveSettings({ ...get(), masterVolume: v }); },
  setSfxVolume: (v) => { set({ sfxVolume: v }); saveSettings({ ...get(), sfxVolume: v }); },
  setVoiceVolume: (v) => { set({ voiceVolume: v }); saveSettings({ ...get(), voiceVolume: v }); },
  setMicInputVolume: (v) => { set({ micInputVolume: v }); saveSettings({ ...get(), micInputVolume: v }); },
  setSfxEnabled: (v) => { set({ sfxEnabled: v }); saveSettings({ ...get(), sfxEnabled: v }); },
}));
