import { useState } from 'react';
import { useFriendStore } from '../stores/friendStore';
import ParticipantPanel from './ParticipantPanel';
import FriendsPanel from './FriendsPanel';

export default function SocialPanel() {
  const [tab, setTab] = useState('room'); // 'room' | 'friends'
  const pendingRequests = useFriendStore((s) => s.pendingRequests);

  return (
    <div className="social-panel">
      <div className="social-tabs">
        <button
          className={`social-tab ${tab === 'room' ? 'active' : ''}`}
          onClick={() => setTab('room')}
        >
          Room
        </button>
        <button
          className={`social-tab ${tab === 'friends' ? 'active' : ''}`}
          onClick={() => setTab('friends')}
        >
          Friends
          {pendingRequests.length > 0 && (
            <span className="social-tab-badge">{pendingRequests.length}</span>
          )}
        </button>
      </div>
      <div className="social-content">
        {tab === 'room' ? <ParticipantPanel /> : <FriendsPanel />}
      </div>
    </div>
  );
}
