import React from 'react';

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0 12px',
    borderBottom: '0.5px solid var(--border)',
    marginBottom: 16,
  },
  titleWrap: {},
  title: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' },
  subtitle: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 },
  statusWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
};

function formatUpdated(iso) {
  if (!iso) return 'waiting…';
  const d = new Date(iso);
  return `updated ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

export default function Header({ connected, lastUpdated, liveCount }) {
  return (
    <div style={styles.header}>
      <div style={styles.titleWrap}>
        <div style={styles.title}>🏀 NCAA Tournament 2026</div>
        <div style={styles.subtitle}>
          {liveCount > 0 ? `${liveCount} game${liveCount > 1 ? 's' : ''} live` : 'March Madness'}
        </div>
      </div>
      <div style={styles.statusWrap}>
        <div
          style={{
            ...styles.dot,
            background: connected ? '#1D9E75' : '#E24B4A',
            animation: connected ? 'pulse 1.4s infinite' : 'none',
          }}
        />
        <span>{connected ? formatUpdated(lastUpdated) : 'reconnecting…'}</span>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
