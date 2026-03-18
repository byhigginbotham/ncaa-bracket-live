import React, { useState, useMemo } from 'react';
import { useSocket } from './hooks/useSocket.js';
import Header from './components/Header.jsx';
import LivePanel from './components/LivePanel.jsx';
import BracketView from './components/BracketView.jsx';

const ROUND_TABS = [
  { key: 'live', label: 'Live & Scores' },
  { key: 'first-four', label: 'First Four' },
  { key: 'round-64', label: 'Round of 64' },
  { key: 'round-32', label: 'Round of 32' },
  { key: 'sweet-16', label: 'Sweet 16' },
  { key: 'elite-8', label: 'Elite 8' },
  { key: 'final-four', label: 'Final Four' },
  { key: 'championship', label: 'Championship' },
  { key: 'bracket', label: 'All Games' },
];

const ROUND_FILTER = {
  'first-four': 'First Four',
  'round-64': 'Round of 64',
  'round-32': 'Round of 32',
  'sweet-16': 'Sweet 16',
  'elite-8': 'Elite 8',
  'final-four': 'Final Four',
  'championship': 'Championship',
};

const appStyle = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '0 16px 40px',
};

const tabBar = {
  display: 'flex',
  gap: 0,
  marginBottom: 4,
  borderBottom: '0.5px solid var(--border)',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

function tabStyle(active) {
  return {
    padding: '7px 12px',
    fontSize: 12,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: active ? 'var(--text)' : 'var(--text-secondary)',
    borderBottom: `2px solid ${active ? 'var(--text)' : 'transparent'}`,
    fontWeight: active ? 500 : 400,
    transition: 'all 0.15s',
    marginBottom: -1,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

export default function App() {
  const { games, lastUpdated, connected, picks, picksStatus } = useSocket();
  const [activeTab, setActiveTab] = useState('live');

  const liveCount = games.filter(
    g => g.status === 'inprogress' || g.status === 'halftime'
  ).length;

  // Count games per round for badge display
  const roundCounts = useMemo(() => {
    const counts = {};
    for (const g of games) {
      const round = g.round || 'Unknown';
      if (!counts[round]) counts[round] = { total: 0, final: 0, live: 0 };
      counts[round].total++;
      if (g.status === 'closed') counts[round].final++;
      if (g.status === 'inprogress' || g.status === 'halftime') counts[round].live++;
    }
    return counts;
  }, [games]);

  // Filter games for round-specific tabs
  const filteredGames = useMemo(() => {
    const roundName = ROUND_FILTER[activeTab];
    if (!roundName) return games;
    return games.filter(g => g.round === roundName);
  }, [games, activeTab]);

  // Determine which tabs have content
  const availableRounds = useMemo(() => {
    const rounds = new Set(games.map(g => g.round).filter(Boolean));
    return rounds;
  }, [games]);

  return (
    <div style={appStyle}>
      <Header connected={connected} lastUpdated={lastUpdated} liveCount={liveCount} />

      {picksStatus === 'awaiting' && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid #D4A017',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 12,
          color: '#e0e0e0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🏀</span>
            <strong style={{ fontSize: 14, color: '#D4A017' }}>Bracket Picks Not Set</strong>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: '#b0b0b0' }}>
            <p style={{ margin: '0 0 6px' }}>To track your bracket picks:</p>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li>Fill out your bracket on <strong>Sleeper</strong> (deadline: Thursday 11 AM CT)</li>
              <li>Screenshot each region of your completed bracket</li>
              <li>Paste the screenshots into <strong>Claude Code</strong></li>
              <li>Claude reads your picks and updates <code style={{ background: '#2a2a3e', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>data/picks.json</code> automatically</li>
            </ol>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#888' }}>
              ★ stars will appear next to your picked teams once loaded
            </p>
          </div>
        </div>
      )}

      <div style={tabBar}>
        {ROUND_TABS.map(tab => {
          const roundName = ROUND_FILTER[tab.key];
          const counts = roundName ? roundCounts[roundName] : null;
          const hasGames = tab.key === 'live' || tab.key === 'bracket' || availableRounds.has(roundName);

          // Don't show empty round tabs
          if (!hasGames && tab.key !== 'live' && tab.key !== 'bracket') return null;

          return (
            <button
              key={tab.key}
              style={{
                ...tabStyle(activeTab === tab.key),
                opacity: hasGames ? 1 : 0.4,
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === 'live' && liveCount > 0 && (
                <span style={{
                  marginLeft: 5,
                  background: '#1D9E75',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: 10,
                }}>{liveCount}</span>
              )}
              {counts && counts.live > 0 && tab.key !== 'live' && (
                <span style={{
                  marginLeft: 5,
                  background: '#1D9E75',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: 10,
                }}>{counts.live}</span>
              )}
              {counts && counts.final > 0 && counts.final === counts.total && (
                <span style={{
                  marginLeft: 5,
                  background: 'var(--text-tertiary)',
                  color: 'var(--bg)',
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: 10,
                }}>done</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ paddingTop: 8 }}>
        {activeTab === 'live' && <LivePanel games={games} picks={picks} />}
        {activeTab === 'bracket' && <BracketView games={games} picks={picks} />}
        {ROUND_FILTER[activeTab] && (
          <BracketView games={filteredGames} title={ROUND_FILTER[activeTab]} picks={picks} />
        )}
      </div>

      <footer style={{
        marginTop: 32,
        paddingTop: 12,
        borderTop: '0.5px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-tertiary)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>Polling every 30s · scores via SportsRadar NCAAMB API</span>
        <span>Channel numbers: Birmingham, AL market · <a
          href="https://tv.youtube.com/guide"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--text-tertiary)' }}
        >verify at tv.youtube.com</a></span>
      </footer>
    </div>
  );
}
