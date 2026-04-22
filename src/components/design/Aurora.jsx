// Aurora — drifting blobs behind glass panels.
// level: 'bold' | 'visible' | 'subtle' | 'whisper'
// Ported from Claude Design bundle.

export function Aurora({ level = 'visible' }) {
  const classMap = { bold: '', visible: '', subtle: 'subtle', whisper: 'whisper' };
  return (
    <div className={`aurora-wrap ${classMap[level] || ''}`} aria-hidden>
      <div className="aurora-blob a" />
      <div className="aurora-blob b" />
      <div className="aurora-blob c" />
      <div className="aurora-blob d" />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(1200px 800px at 50% -10%, rgba(232,168,56,0.06), transparent 60%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
