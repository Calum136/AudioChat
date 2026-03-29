import { create } from 'zustand';
import { Room, RoomEvent, Track } from 'livekit-client';
import { useFriendStore } from './friendStore';
import { useAudioSettingsStore } from './audioSettingsStore';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

// In Electron production builds, the app loads from file:// so relative API
// calls won't work. Use the Netlify-hosted function instead.
const isElectronProd = window.electronAPI?.isElectron && window.location.protocol === 'file:';
const TOKEN_URL = isElectronProd
  ? 'https://sidequest-hangout.netlify.app/api/livekit-token'
  : '/api/livekit-token';

// Spatial audio constants
const ROOM_WIDTH = 500;
const MAX_DISTANCE = 600;

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export const useVoiceStore = create((set, get) => ({
  // Connection state
  room: null,
  connectionState: 'disconnected', // 'disconnected' | 'connecting' | 'connected'

  // Local audio
  isMuted: false,
  isDeafened: false,

  // Speaking state — { identity: boolean }
  speakingMap: {},

  // Web Audio spatial processing
  _audioContext: null,
  _sourceNodes: new Map(), // identity -> { source, panner, gain }

  connect: async (roomName, identity) => {
    const state = get();
    if (state.connectionState !== 'disconnected') return;

    set({ connectionState: 'connecting' });

    try {
      const lkRoom = new Room({
        audioCaptureDefaults: { autoGainControl: true, noiseSuppression: true },
        publishDefaults: { audioBitrate: 24000 },
      });

      // Fetch token from our server (or Netlify in Electron production)
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, identity }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get token');
      }

      const { token } = await res.json();

      // Set up event listeners before connecting
      lkRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const map = {};
        for (const p of speakers) {
          map[p.identity] = true;
        }
        set({ speakingMap: map });
      });

      lkRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind !== Track.Kind.Audio) return;
        get()._attachSpatialAudio(track, participant.identity);
      });

      lkRoom.on(RoomEvent.TrackUnsubscribed, (_track, _publication, participant) => {
        get()._detachSpatialAudio(participant.identity);
      });

      lkRoom.on(RoomEvent.Disconnected, () => {
        get()._cleanup();
        set({
          room: null,
          connectionState: 'disconnected',
          isMuted: false,
          isDeafened: false,
          speakingMap: {},
        });
      });

      // Connect to LiveKit room
      await lkRoom.connect(LIVEKIT_URL, token);

      // Try to enable mic — may fail if permission denied (e.g. preview browser)
      try {
        await lkRoom.localParticipant.setMicrophoneEnabled(true);
      } catch (micErr) {
        console.warn('[voice] Mic access denied — connected without mic:', micErr.name);
        set({ isMuted: true });
      }

      set({ room: lkRoom, connectionState: 'connected' });
    } catch (err) {
      console.error('[voice] Connection failed:', err);
      set({ connectionState: 'disconnected', room: null });
    }
  },

  disconnect: async () => {
    const { room } = get();
    if (room) {
      await room.disconnect();
    }
    get()._cleanup();
    set({
      room: null,
      connectionState: 'disconnected',
      isMuted: false,
      isDeafened: false,
      speakingMap: {},
    });
  },

  toggleMute: () => {
    const { room, isMuted } = get();
    if (!room) return;
    const newMuted = !isMuted;
    room.localParticipant.setMicrophoneEnabled(!newMuted);
    set({ isMuted: newMuted });
  },

  setDeafened: (deafened) => {
    set({ isDeafened: deafened });
    // When deafened, mute all incoming audio
    const sourceNodes = get()._sourceNodes;
    for (const [, nodes] of sourceNodes) {
      nodes.gain.gain.value = deafened ? 0 : 1;
    }
  },

  // --- Spatial audio ---

  _getAudioContext: () => {
    let ctx = get()._audioContext;
    if (!ctx) {
      ctx = new AudioContext();
      set({ _audioContext: ctx });
    }
    return ctx;
  },

  _attachSpatialAudio: (track, identity) => {
    const ctx = get()._getAudioContext();
    const sourceNodes = get()._sourceNodes;

    // Clean up existing nodes for this participant
    get()._detachSpatialAudio(identity);

    // Attach track to get a media element, but don't add to DOM
    const mediaElement = track.attach();
    mediaElement.muted = true; // Mute the element — we route through Web Audio instead

    const source = ctx.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
    const panner = ctx.createStereoPanner();
    const gain = ctx.createGain();

    source.connect(panner).connect(gain).connect(ctx.destination);

    sourceNodes.set(identity, { source, panner, gain, mediaElement });
    set({ _sourceNodes: new Map(sourceNodes) });
  },

  _detachSpatialAudio: (identity) => {
    const sourceNodes = get()._sourceNodes;
    const nodes = sourceNodes.get(identity);
    if (!nodes) return;

    nodes.source.disconnect();
    nodes.panner.disconnect();
    nodes.gain.disconnect();
    if (nodes.mediaElement) {
      nodes.mediaElement.remove();
    }
    sourceNodes.delete(identity);
    set({ _sourceNodes: new Map(sourceNodes) });
  },

  updateSpatialAudio: (myPos, participantPositions) => {
    const sourceNodes = get()._sourceNodes;
    if (sourceNodes.size === 0) return;

    const mutedUsers = useFriendStore.getState().mutedUsers;

    for (const [identity, pos] of Object.entries(participantPositions)) {
      const nodes = sourceNodes.get(identity);
      if (!nodes) continue;

      // Muted users get zero gain
      if (mutedUsers.has(identity)) {
        nodes.gain.gain.value = 0;
        continue;
      }

      // Pan based on relative X position
      const pan = clamp((pos.x - myPos.x) / ROOM_WIDTH, -1, 1);
      nodes.panner.pan.value = pan;

      // Gain based on distance (floor at 0.15 — always audible), scaled by voice volume
      const dx = pos.x - myPos.x;
      const dy = pos.y - myPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const { masterVolume, voiceVolume } = useAudioSettingsStore.getState();
      const spatialGain = clamp(1 - distance / MAX_DISTANCE, 0.15, 1);
      const gainValue = spatialGain * masterVolume * voiceVolume;
      nodes.gain.gain.value = gainValue;
    }
  },

  _cleanup: () => {
    const sourceNodes = get()._sourceNodes;
    for (const [identity] of sourceNodes) {
      get()._detachSpatialAudio(identity);
    }
    const ctx = get()._audioContext;
    if (ctx) {
      ctx.close().catch(() => {});
    }
    set({ _audioContext: null, _sourceNodes: new Map() });
  },
}));
