export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', variant = 'default', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="confirm-title">{title}</h3>}
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
          <button className={`confirm-btn ${variant}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
