import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useRoomStore } from './stores/roomStore';
import Landing from './components/Landing';
import AppShell from './components/AppShell';

export default function App() {
  const view = useRoomStore((s) => s.view);
  const loading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
    </div>
  );
}
