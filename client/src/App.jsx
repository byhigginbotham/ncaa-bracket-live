import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSocket } from './hooks/useSocket.js';
import Header from './components/Header.jsx';
import LivePanel from './components/LivePanel.jsx';
import BracketView from './components/BracketView.jsx';
import BracketTree from './components/BracketTree.jsx';

const ROUND_TABS = [
  { key: 'live', label: 'Live & Scores' },
  { key: 'bracket-tree', label: 'Bracket' },
  { key: 'first-four', label: 'First Four' },
  { key: 'first-round', label: 'Round of 64' },
  { key: 'second-round', label: 'Round of 32' },
  { key: 'sweet-16', label: 'Sweet 16' },
  { key: 'elite-8', label: 'Elite 8' },
  { key: 'final-four', label: 'Final Four' },
  { key: 'championship', label: 'Championship' },
  { key: 'nit', label: 'NIT' },
  { key: 'bracket', label: 'All NCAA' },
];

const ROUND_FILTER = {
  'first-four': 'First Four',
  'first-round': 'First Round',
  'second-round': 'Second Round',
  'sweet-16': 'Sweet 16',
  'elite-8': 'Elite 8',
  'final-four': 'Final Four',
  'championship': 'Championship',
  'nit': '_NIT_',  // special filter
};

const appStyle = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '0 16px 40px',
};

const tabBar = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 0,
  marginBottom: 4,
  borderBottom: '0.5px solid var(--border)',
};

const tabBarMobile = {
  display: 'flex',
  flexWrap: 'nowrap',
  gap: 0,
  marginBottom: 4,
  borderBottom: '0.5px solid var(--border)',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
};

const mobileToggleStyle = (active) => ({
  padding: '5px 8px',
  fontSize: 11,
  cursor: 'pointer',
  border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
  background: active ? 'var(--text)' : 'transparent',
  color: active ? 'var(--bg)' : 'var(--text-secondary)',
  borderRadius: 5,
  fontWeight: 500,
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
  marginLeft: 'auto',
  flexShrink: 0,
  lineHeight: 1,
});

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
  };
}

export default function App() {
  const { games, lastUpdated, connected, picks, picksStatus, pollStats } = useSocket();

  // Mobile toggle — persisted in localStorage
  const [isMobile, setIsMobile] = useState(() => {
    try { return localStorage.getItem('ncaa_mobile') === 'true'; } catch { return false; }
  });
  const toggleMobile = () => {
    setIsMobile(prev => {
      const next = !prev;
      try { localStorage.setItem('ncaa_mobile', String(next)); } catch {}
      return next;
    });
  };

  // Countdown timer — resets when server pushes new data
  const [countdown, setCountdown] = useState(null);
  const lastUpdateRef = useRef(lastUpdated);
  useEffect(() => {
    if (!pollStats?.currentInterval || pollStats.currentInterval <= 0) {
      setCountdown(null);
      return;
    }
    // Reset countdown whenever lastUpdated changes (new poll arrived)
    const intervalSecs = Math.round(pollStats.currentInterval / 1000);
    if (lastUpdated !== lastUpdateRef.current) {
      lastUpdateRef.current = lastUpdated;
      setCountdown(intervalSecs);
    }
    const id = setInterval(() => {
      setCountdown(prev => prev != null && prev > 0 ? prev - 1 : intervalSecs);
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated, pollStats?.currentInterval]);
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

  // Split NCAA vs NIT
  const ncaaGames = useMemo(() => games.filter(g => g.tournament !== 'NIT'), [games]);
  const nitGames = useMemo(() => games.filter(g => g.tournament === 'NIT'), [games]);

  // Filter games for round-specific tabs
  const filteredGames = useMemo(() => {
    if (activeTab === 'nit') return nitGames;
    if (activeTab === 'bracket') return ncaaGames;
    const roundName = ROUND_FILTER[activeTab];
    if (!roundName) return ncaaGames;
    return ncaaGames.filter(g => g.round === roundName);
  }, [ncaaGames, nitGames, activeTab]);

  // Determine which tabs have content
  const availableRounds = useMemo(() => {
    const rounds = new Set(ncaaGames.map(g => g.round).filter(Boolean));
    if (nitGames.length > 0) rounds.add('_NIT_');
    return rounds;
  }, [ncaaGames, nitGames]);

  return (
    <div style={isMobile ? { ...appStyle, padding: '0 8px 24px', maxWidth: '100%' } : appStyle}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ ...(isMobile ? tabBarMobile : tabBar), flex: 1, minWidth: 0 }}>
          {ROUND_TABS.filter(tab => {
            return true;
          }).map(tab => {
            const roundName = ROUND_FILTER[tab.key];
            const counts = roundName ? roundCounts[roundName] : null;
            const alwaysShow = tab.key === 'live' || tab.key === 'bracket' || tab.key === 'bracket-tree';
            const hasGames = alwaysShow || availableRounds.has(roundName);

            // Don't show empty round tabs
            if (!hasGames && !alwaysShow) return null;

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
        <button
          onClick={toggleMobile}
          style={mobileToggleStyle(isMobile)}
          title={isMobile ? 'Switch to desktop view' : 'Switch to mobile view'}
        >
          {isMobile ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      <div style={{ paddingTop: 8 }}>
        {activeTab === 'live' && <LivePanel games={ncaaGames} picks={picks} mobile={isMobile} />}
        {activeTab === 'bracket-tree' && (
          <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
            <BracketTree games={ncaaGames} picks={picks} />
          </div>
        )}
        {activeTab === 'bracket' && <BracketView games={ncaaGames} picks={picks} title="All NCAA Tournament Games" mobile={isMobile} />}
        {ROUND_FILTER[activeTab] && (
          <BracketView games={filteredGames} title={ROUND_FILTER[activeTab]} picks={picks} mobile={isMobile} />
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
        flexWrap: 'wrap',
        gap: 4,
      }}>
        <span>
          {pollStats ? (
            <>
              Polls: {pollStats.pollCount}
              {' · '}
              {pollStats.currentInterval > 0
                ? <>Next: {countdown != null ? `${countdown}s` : '...'} · Interval: {Math.round(pollStats.currentInterval / 1000)}s</>
                : 'Paused'
              }
              {' · '}Source: {pollStats.dataSource?.toUpperCase()}
            </>
          ) : (
            'Connecting...'
          )}
        </span>
        <span>Channels: Birmingham, AL · <a
          href="https://tv.youtube.com/guide"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--text-tertiary)' }}
        >tv.youtube.com</a></span>
      </footer>
    </div>
  );
}
