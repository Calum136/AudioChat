import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useFriendStore } from '../stores/friendStore';
import { useRoomStore } from '../stores/roomStore';
import ConfirmDialog from './ConfirmDialog';
import Icon from './Icon';

export default function FriendsPanel() {
  const user = useAuthStore((s) => s.user);
  const roomId = useRoomStore((s) => s.roomId);
  const sendKnock = useRoomStore((s) => s.sendKnock);
  const [knockedIds, setKnockedIds] = useState(new Set()); // track who we've knocked
  const friends = useFriendStore((s) => s.friends);
  const pendingRequests = useFriendStore((s) => s.pendingRequests);
  const blockedUsers = useFriendStore((s) => s.blockedUsers);
  const mutedUsers = useFriendStore((s) => s.mutedUsers);
  const onlineUsers = useFriendStore((s) => s.onlineUsers);
  const searchResults = useFriendStore((s) => s.searchResults);
  const searchLoading = useFriendStore((s) => s.searchLoading);
  const loading = useFriendStore((s) => s.loading);

  const searchUsers = useFriendStore((s) => s.searchUsers);
  const sendRequest = useFriendStore((s) => s.sendRequest);
  const acceptRequest = useFriendStore((s) => s.acceptRequest);
  const declineRequest = useFriendStore((s) => s.declineRequest);
  const removeFriend = useFriendStore((s) => s.removeFriend);
  const blockUser = useFriendStore((s) => s.blockUser);
  const unblockUser = useFriendStore((s) => s.unblockUser);
  const toggleMute = useFriendStore((s) => s.toggleMute);
  const loadFriends = useFriendStore((s) => s.loadFriends);

  // Auto-refresh friends data on mount and every 15 seconds (silent refresh to avoid flicker)
  useEffect(() => {
    if (!user) return;
    loadFriends(user.id);
    const interval = setInterval(() => loadFriends(user.id, true), 15000);
    return () => clearInterval(interval);
  }, [user, loadFriends]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null); // friendId
  const [confirmAction, setConfirmAction] = useState(null); // { type, target }
  const [tab, setTab] = useState('friends'); // 'friends' | 'blocked'

  const handleSearch = useCallback((e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (user) searchUsers(q, user.id);
  }, [user, searchUsers]);

  const handleSendRequest = async (targetId) => {
    if (!user) return;
    try {
      await sendRequest(user.id, targetId);
    } catch (e) {
      // Already handled in store
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction || !user) return;
    const { type, target } = confirmAction;
    if (type === 'remove') await removeFriend(target.friendshipId, user.id);
    if (type === 'block') await blockUser(user.id, target.id);
    if (type === 'unblock') await unblockUser(target.friendshipId, user.id);
    setConfirmAction(null);
    setActiveMenu(null);
  };

  // Split friends into online/offline, sort online first
  const onlineFriends = friends.filter((f) => onlineUsers[f.id]);
  const offlineFriends = friends.filter((f) => !onlineUsers[f.id]);

  const getStatus = (friendId) => {
    const presence = onlineUsers[friendId];
    if (!presence) return 'offline';
    if (roomId && presence.roomId === roomId) return 'in-room';
    if (presence.roomId) return 'in-other-room';
    return 'online';
  };

  const statusLabel = (status) => {
    if (status === 'in-room') return 'In your room';
    if (status === 'in-other-room') return 'In a room';
    if (status === 'online') return 'Online';
    return 'Offline';
  };

  if (!user) return null;

  return (
    <div className="friends-panel">
      <h3 className="friends-title">Friends</h3>

      {/* Search */}
      <div className="friends-search">
        <input
          type="text"
          className="friends-search-input"
          placeholder="Add friend..."
          value={searchQuery}
          onChange={handleSearch}
          maxLength={20}
        />
      </div>

      {/* Search results */}
      {searchQuery && (
        <div className="friends-search-results">
          {searchLoading ? (
            <div className="friends-loading"><div className="loading-spinner tiny" /></div>
          ) : searchResults.length > 0 ? (
            searchResults.map((u) => (
              <div key={u.id} className="friend-row search-result">
                <div className="friend-avatar" style={{ background: u.color }}>
                  {u.displayName[0]}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{u.displayName}</span>
                </div>
                <button
                  className="friend-action-btn add"
                  onClick={() => handleSendRequest(u.id)}
                  title="Send friend request"
                >
                  <Icon name="userPlus" size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="friends-empty-hint">No users found</div>
          )}
        </div>
      )}

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="friends-section">
          <h4 className="friends-section-label">
            Requests
            <span className="friends-badge">{pendingRequests.length}</span>
          </h4>
          {pendingRequests.map((r) => (
            <div key={r.friendshipId} className="friend-row request">
              <div className="friend-avatar" style={{ background: r.color }}>
                {r.displayName[0]}
              </div>
              <div className="friend-info">
                <span className="friend-name">{r.displayName}</span>
              </div>
              <button
                className="friend-action-btn accept"
                onClick={() => acceptRequest(r.friendshipId, user.id)}
                title="Accept"
              >
                <Icon name="check" size={12} />
              </button>
              <button
                className="friend-action-btn decline"
                onClick={() => declineRequest(r.friendshipId, user.id)}
                title="Decline"
              >
                {'\u00D7'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs: Friends / Blocked */}
      <div className="friends-tabs">
        <button className={`friends-tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          Friends ({friends.length})
        </button>
        <button className={`friends-tab ${tab === 'blocked' ? 'active' : ''}`} onClick={() => setTab('blocked')}>
          Blocked ({blockedUsers.length})
        </button>
      </div>

      {tab === 'friends' && (
        <div className="friends-list">
          {loading ? (
            <div className="friends-loading"><div className="loading-spinner tiny" /></div>
          ) : friends.length === 0 ? (
            <div className="friends-empty-hint">
              Search above to add friends
            </div>
          ) : (
            <>
              {/* Online friends */}
              {onlineFriends.map((f) => {
                const status = getStatus(f.id);
                const muted = mutedUsers.has(f.id);
                return (
                  <div key={f.id} className={`friend-row ${status}`}>
                    <div className="friend-avatar" style={{ background: f.color }}>
                      {f.displayName[0]}
                      <span className={`status-dot ${status}`} />
                    </div>
                    <div className="friend-info">
                      <span className="friend-name">
                        {f.displayName}
                        {muted && <span className="muted-badge">M</span>}
                      </span>
                      <span className="friend-status">{statusLabel(status)}</span>
                    </div>
                    {status === 'in-other-room' && onlineUsers[f.id]?.roomId && (
                      <button
                        className={`friend-action-btn knock ${knockedIds.has(f.id) ? 'knocked' : ''}`}
                        onClick={() => {
                          const targetRoom = onlineUsers[f.id]?.roomId;
                          if (targetRoom && user) {
                            sendKnock(targetRoom, user);
                            setKnockedIds((s) => new Set([...s, f.id]));
                          }
                        }}
                        disabled={knockedIds.has(f.id)}
                        title={knockedIds.has(f.id) ? 'Knock sent!' : 'Knock to request entry'}
                      >
                        {knockedIds.has(f.id) ? 'Sent' : 'Knock'}
                      </button>
                    )}
                    <button
                      className="friend-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === f.id ? null : f.id);
                      }}
                    >
                      <Icon name="dots" size={14} />
                    </button>
                    {activeMenu === f.id && (
                      <div className="friend-context-menu">
                        <button onClick={() => { toggleMute(f.id); setActiveMenu(null); }}>
                          {muted ? 'Unmute' : 'Mute'}
                        </button>
                        <button onClick={() => { setConfirmAction({ type: 'block', target: f }); setActiveMenu(null); }}>
                          Block
                        </button>
                        <button className="danger" onClick={() => { setConfirmAction({ type: 'remove', target: f }); setActiveMenu(null); }}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Offline friends */}
              {offlineFriends.length > 0 && onlineFriends.length > 0 && (
                <div className="friends-divider">Offline</div>
              )}
              {offlineFriends.map((f) => {
                const muted = mutedUsers.has(f.id);
                return (
                  <div key={f.id} className="friend-row offline">
                    <div className="friend-avatar offline-avatar" style={{ background: f.color }}>
                      {f.displayName[0]}
                    </div>
                    <div className="friend-info">
                      <span className="friend-name">
                        {f.displayName}
                        {muted && <span className="muted-badge">M</span>}
                      </span>
                    </div>
                    <button
                      className="friend-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === f.id ? null : f.id);
                      }}
                    >
                      <Icon name="dots" size={14} />
                    </button>
                    {activeMenu === f.id && (
                      <div className="friend-context-menu">
                        <button onClick={() => { toggleMute(f.id); setActiveMenu(null); }}>
                          {muted ? 'Unmute' : 'Mute'}
                        </button>
                        <button onClick={() => { setConfirmAction({ type: 'block', target: f }); setActiveMenu(null); }}>
                          Block
                        </button>
                        <button className="danger" onClick={() => { setConfirmAction({ type: 'remove', target: f }); setActiveMenu(null); }}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {tab === 'blocked' && (
        <div className="friends-list">
          {blockedUsers.length === 0 ? (
            <div className="friends-empty-hint">No blocked users</div>
          ) : (
            blockedUsers.map((b) => (
              <div key={b.id} className="friend-row blocked">
                <div className="friend-avatar offline-avatar" style={{ background: b.color }}>
                  {b.displayName[0]}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{b.displayName}</span>
                </div>
                <button
                  className="friend-action-btn unblock"
                  onClick={() => setConfirmAction({ type: 'unblock', target: b })}
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.type === 'remove' ? `Remove ${confirmAction.target.displayName}?`
          : confirmAction?.type === 'block' ? `Block ${confirmAction.target.displayName}?`
          : confirmAction?.type === 'unblock' ? `Unblock ${confirmAction.target.displayName}?`
          : ''
        }
        message={
          confirmAction?.type === 'block' ? "They won't be able to see you or send requests."
          : confirmAction?.type === 'remove' ? "You can always add them back later."
          : "They'll be able to see you and send requests again."
        }
        confirmLabel={confirmAction?.type === 'unblock' ? 'Unblock' : confirmAction?.type === 'block' ? 'Block' : 'Remove'}
        variant={confirmAction?.type === 'unblock' ? 'default' : 'danger'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
