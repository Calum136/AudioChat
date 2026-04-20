import { useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import * as roomService from '../lib/roomService';

export default function EditRoomModal({ onClose }) {
  const user = useAuthStore((s) => s.user);
  const roomName = useRoomStore((s) => s.roomName);
  const roomImageUrl = useRoomStore((s) => s.roomImageUrl);
  const participants = useRoomStore((s) => s.participants);
  const ownerId = useRoomStore((s) => s.ownerId);
  const updateRoomName = useRoomStore((s) => s.updateRoomName);
  const updateRoomImageUrl = useRoomStore((s) => s.updateRoomImageUrl);
  const roomId = useRoomStore((s) => s.roomId);

  const [nameValue, setNameValue] = useState(roomName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageMsg, setImageMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleNameSave = async () => {
    if (!nameValue.trim() || nameValue.trim() === roomName) return;
    setNameSaving(true);
    try {
      await updateRoomName(nameValue.trim());
      setNameMsg({ type: 'success', text: 'Saved' });
    } catch (e) {
      setNameMsg({ type: 'error', text: e.message });
    }
    setNameSaving(false);
    setTimeout(() => setNameMsg(null), 2500);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageMsg({ type: 'error', text: 'Please select an image file' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageMsg({ type: 'error', text: 'Image must be under 2MB' });
      return;
    }
    setImageUploading(true);
    setImageMsg(null);
    try {
      const publicUrl = await roomService.uploadRoomImage(roomId, user.id, file);
      await updateRoomImageUrl(publicUrl);
      setImageMsg({ type: 'success', text: 'Cover image updated' });
    } catch (e) {
      setImageMsg({ type: 'error', text: e.message });
    }
    setImageUploading(false);
    setTimeout(() => setImageMsg(null), 2500);
  };

  const handleRemoveImage = async () => {
    try {
      await updateRoomImageUrl(null);
      setImageMsg({ type: 'success', text: 'Image removed' });
    } catch (e) {
      setImageMsg({ type: 'error', text: e.message });
    }
    setTimeout(() => setImageMsg(null), 2500);
  };

  const participantList = Object.values(participants);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="edit-room-panel" onClick={(e) => e.stopPropagation()}>
        <div className="edit-room-header">
          <h2>Room Settings</h2>
          <button className="settings-close" onClick={onClose}>&times;</button>
        </div>

        <div className="edit-room-body">
          {/* Room Name */}
          <div className="edit-room-section">
            <label className="edit-room-label">Room Name</label>
            <div className="edit-room-row">
              <input
                className="edit-room-input"
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              />
              <button
                className="edit-room-save-btn"
                onClick={handleNameSave}
                disabled={nameSaving || !nameValue.trim() || nameValue.trim() === roomName}
              >
                {nameSaving ? <div className="loading-spinner tiny" /> : 'Save'}
              </button>
            </div>
            {nameMsg && (
              <span className={`edit-room-msg ${nameMsg.type}`}>{nameMsg.text}</span>
            )}
          </div>

          {/* Cover Image */}
          <div className="edit-room-section">
            <label className="edit-room-label">Cover Image</label>
            {roomImageUrl && (
              <div className="edit-room-image-preview">
                <img src={roomImageUrl} alt="Room cover" />
                <button className="edit-room-remove-img" onClick={handleRemoveImage} title="Remove image">
                  &times;
                </button>
              </div>
            )}
            <div className="edit-room-image-actions">
              <button
                className="edit-room-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
              >
                {imageUploading ? (
                  <><div className="loading-spinner tiny" /> Uploading...</>
                ) : (
                  roomImageUrl ? 'Change Image' : 'Upload Image'
                )}
              </button>
              <span className="edit-room-hint">PNG, JPG · max 2MB</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            {imageMsg && (
              <span className={`edit-room-msg ${imageMsg.type}`}>{imageMsg.text}</span>
            )}
          </div>

          {/* Members */}
          {participantList.length > 0 && (
            <div className="edit-room-section">
              <label className="edit-room-label">In Room Now</label>
              <div className="edit-room-members">
                {participantList.map((p) => (
                  <div key={p.id} className="edit-room-member">
                    <div className="edit-room-member-avatar" style={{ background: p.color }}>
                      {p.displayName?.[0]?.toUpperCase()}
                    </div>
                    <span className="edit-room-member-name">{p.displayName}</span>
                    {p.id === ownerId && (
                      <span className="edit-room-role-badge owner">Host</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
