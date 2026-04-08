import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useRoomStore } from './stores/roomStore';
import { useFriendStore } from './stores/friendStore';
import Landing from './components/Landing';
import AppShell from './components/AppShell';
import UpdateNotification from './components/UpdateNotification';

export default function App() {
  const view = useRoomStore((s) => s.view);
  const roomId = useRoomStore((s) => s.roomId);
  const loading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const initialize = useAuthStore((s) => s.initialize);
  const connectGlobalPresence = useFriendStore((s) => s.connectGlobalPresence);
  const disconnectGlobalPresence = useFriendStore((s) => s.disconnectGlobalPresence);
  const updatePresenceRoom = useFriendStore((s) => s.updatePresenceRoom);
  const loadFriends = useFriendStore((s) => s.loadFriends);

  useEffect(() => {
    initialize();
    // Restore persisted appearance settings
    const scale = localStorage.getItem('sq-ui-scale');
    if (scale) document.documentElement.dataset.uiScale = scale;
    if (localStorage.getItem('sq-reduced-motion') === 'true') {
      document.documentElement.classList.add('reduced-motion');
    }
  }, [initialize]);

  // Connect global presence + load friends when authenticated
  useEffect(() => {
    if (user) {
      connectGlobalPresence(user, roomId);
      loadFriends(user.id);
    } else {
      disconnectGlobalPresence();
    }
  }, [user]);

  // Update presence when entering/leaving rooms
  useEffect(() => {
    if (user) {
      updatePresenceRoom(roomId);
    }
  }, [roomId, user]);

  // Refresh presence when Electron window regains focus
  useEffect(() => {
    if (!window.electronAPI?.isElectron) return;
    const handleFocus = () => {
      if (user) updatePresenceRoom(roomId);
    };
    window.electronAPI.onWindowFocus(handleFocus);
  }, [user, roomId, updatePresenceRoom]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {view === 'landing' ? <Landing /> : <AppShell />}
      {window.electronAPI?.isElectron && <UpdateNotification />}
    </div>
  );
}
