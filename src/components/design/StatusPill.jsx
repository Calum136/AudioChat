// StatusPill — tiny uppercase pill with a glowing dot.
// kind: 'live' | 'idle' | 'gold'
// Ported from Claude Design bundle.

const MAP = {
  live: { bg: 'rgba(111,228,168,0.1)', bd: 'rgba(111,228,168,0.3)', c: '#6fe4a8' },
  idle: { bg: 'rgba(144,144,176,0.1)', bd: 'rgba(144,144,176,0.2)', c: '#9090b0' },
  gold: { bg: 'rgba(232,168,56,0.12)', bd: 'rgba(232,168,56,0.35)', c: '#e8a838' },
};

export function StatusPill({ kind = 'idle', label }) {
  const m = MAP[kind] || MAP.idle;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 999,
        background: m.bg,
        border: `1px solid ${m.bd}`,
        color: m.c,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: m.c,
          boxShadow: `0 0 6px ${m.c}`,
        }}
      />
      {label}
    </span>
  );
}
