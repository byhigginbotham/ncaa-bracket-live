import React, { useState, useCallback } from 'react';
import { getNetwork, getNetworkColor } from '../data/channels.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

function statusLabel(game) {
  if (game.status === 'inprogress') {
    if (!game.clock) return 'LIVE';
    const halfLabel = game.period === 1 ? '1st Half' : '2nd Half';
    return `${halfLabel} · ${game.clock}`;
  }
  if (game.status === 'halftime') return 'HALF';
  if (game.status === 'closed')   return 'Final';
  return formatTime(game.scheduledAt);
}

export default function GameCard({ game, picks }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const network = getNetwork(game.network);
  const netColor = getNetworkColor(game.network);
  const isLive = game.status === 'inprogress' || game.status === 'halftime';
  const isFinal = game.status === 'closed';

  const homeLeads = game.home.score !== null && game.home.score > game.away.score;
  const awayLeads = game.away.score !== null && game.away.score > game.home.score;

  const homePicked = picks && picks.has(game.home.alias);
  const awayPicked = picks && picks.has(game.away.alias);

  const [showQuarters, setShowQuarters] = useState(false);
  const [quarters, setQuarters] = useState(null);

  const fetchQuarters = useCallback(() => {
    if (quarters) { setShowQuarters(v => !v); return; }
    fetch(`${SERVER_URL}/api/games/${game.id}/quarters`)
      .then(r => r.json())
      .then(data => { setQuarters(data.quarters || []); setShowQuarters(true); })
      .catch(() => setQuarters([]));
  }, [game.id, quarters]);

  const cardStyle = {
    background: 'var(--bg)',
    border: `${isLive ? '1.5px' : '0.5px'} solid ${isLive ? '#1D9E75' : 'var(--border)'}`,
    borderRadius: 10,
    padding: '10px 13px',
    transition: 'border-color 0.2s',
    position: 'relative',
  };

  const teamRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '3px 0',
  };

  return (
    <div style={cardStyle}>
      {/* Top row: time + network badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {game.status === 'inprogress'
            ? <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#1D9E75', display:'inline-block', animation:'pulse 1.4s infinite' }} />
                <strong style={{ color:'#1D9E75', fontWeight:500 }}>LIVE</strong>
              </span>
            : game.status === 'halftime'
              ? <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#D4A017', display:'inline-block' }} />
                  <strong style={{ color:'#D4A017', fontWeight:500 }}>HALF</strong>
                </span>
              : isFinal
                ? <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Final</span>
                : formatTime(game.scheduledAt)
          }
        </span>

        {/* Network badge + tooltip */}
        <div style={{ position: 'relative' }}>
          <span
            onClick={() => setShowTooltip(v => !v)}
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              background: netColor.bg,
              color: netColor.text,
              cursor: 'pointer',
              userSelect: 'none',
              letterSpacing: '0.03em',
            }}
          >
            {network.label} · {network.youtubeTV?.channelNumber}
          </span>

          {showTooltip && (
            <div
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                position: 'absolute',
                top: 'calc(100% + 5px)',
                right: 0,
                background: 'var(--bg)',
                border: '0.5px solid var(--border-med)',
                borderRadius: 8,
                padding: '9px 12px',
                whiteSpace: 'nowrap',
                zIndex: 20,
                minWidth: 160,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                {network.label} · Ch {network.youtubeTV?.channelNumber}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                YouTube TV
              </div>
              <button
                onClick={() => window.open(network.youtubeTV?.url || 'https://tv.youtube.com', '_blank')}
                style={{
                  width: '100%',
                  padding: '5px 0',
                  fontSize: 11,
                  fontWeight: 500,
                  background: '#FF0000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer',
                }}
              >
                ▶ Open YouTube TV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Away team */}
      <div style={teamRowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {game.away.seed && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', minWidth: 14 }}>{game.away.seed}</span>
          )}
          <span style={{ fontSize: 13, fontWeight: awayLeads ? 600 : 400 }}>
            {game.away.alias || game.away.name}
            {awayPicked && <span style={{ marginLeft: 4, fontSize: 10, color: '#D4A017' }} title="My pick">★</span>}
          </span>
        </div>
        {game.away.score !== null && (
          <span style={{ fontSize: 15, fontWeight: 600, color: awayLeads ? '#1D9E75' : 'var(--text)' }}>
            {game.away.score}
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '0.5px solid var(--border)', margin: '3px 0' }} />

      {/* Home team */}
      <div style={teamRowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {game.home.seed && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', minWidth: 14 }}>{game.home.seed}</span>
          )}
          <span style={{ fontSize: 13, fontWeight: homeLeads ? 600 : 400 }}>
            {game.home.alias || game.home.name}
            {homePicked && <span style={{ marginLeft: 4, fontSize: 10, color: '#D4A017' }} title="My pick">★</span>}
          </span>
        </div>
        {game.home.score !== null && (
          <span style={{ fontSize: 15, fontWeight: 600, color: homeLeads ? '#1D9E75' : 'var(--text)' }}>
            {game.home.score}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 7,
        borderTop: '0.5px solid var(--border)',
      }}>
        <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 500 }}>
          {game.status === 'inprogress' ? statusLabel(game) : ''}
        </span>

        <button
          onClick={() => window.open(network.youtubeTV?.url || 'https://tv.youtube.com', '_blank')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 500,
            padding: '3px 9px',
            borderRadius: 5,
            border: '0.5px solid var(--border-med)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 7s-.3-2-1.2-2.8c-1.2-1.2-2.5-1.2-3.1-1.3C16.6 2.8 12 2.8 12 2.8s-4.6 0-7.2.2c-.6.1-1.9.1-3.1 1.3C.8 5 .5 7 .5 7S.2 9.3.2 11.5v2.1c0 2.2.3 4.5.3 4.5s.3 2 1.2 2.8c1.2 1.2 2.7 1.1 3.4 1.2C7.2 22.3 12 22.3 12 22.3s4.6 0 7.2-.2c.6-.1 1.9-.1 3.1-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.3.3-4.5v-2.1C23.8 9.3 23.5 7 23.5 7zm-13.9 8.7V8.3l8.4 4.2-8.4 3.2z"/>
          </svg>
          Watch
        </button>

        {isFinal && (
          <button
            onClick={fetchQuarters}
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 7px',
              borderRadius: 4,
              border: '0.5px solid var(--border-med)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginLeft: 6,
            }}
          >
            {showQuarters ? 'Hide' : 'Halves'}
          </button>
        )}
      </div>

      {/* Quarter breakdown */}
      {showQuarters && quarters && quarters.length > 0 && (
        <div style={{
          marginTop: 6,
          padding: '6px 8px',
          background: 'var(--bg-secondary)',
          borderRadius: 6,
          fontSize: 11,
        }}>
          <div style={{ display: 'flex', gap: 0, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 3 }}>
            <span style={{ width: 50 }}></span>
            {quarters.map(q => (
              <span key={q.period} style={{ width: 36, textAlign: 'center' }}>
                {q.period <= 2 ? `H${q.period}` : `OT${q.period - 2}`}
              </span>
            ))}
            <span style={{ width: 36, textAlign: 'center', fontWeight: 700 }}>F</span>
          </div>
          <div style={{ display: 'flex', gap: 0, color: awayLeads || (!homeLeads && !awayLeads) ? 'var(--text)' : 'var(--text-secondary)' }}>
            <span style={{ width: 50, fontWeight: 500 }}>{game.away.alias}</span>
            {quarters.map(q => (
              <span key={q.period} style={{ width: 36, textAlign: 'center' }}>{q.away_score}</span>
            ))}
            <span style={{ width: 36, textAlign: 'center', fontWeight: 600 }}>{game.away.score}</span>
          </div>
          <div style={{ display: 'flex', gap: 0, color: homeLeads || (!homeLeads && !awayLeads) ? 'var(--text)' : 'var(--text-secondary)' }}>
            <span style={{ width: 50, fontWeight: 500 }}>{game.home.alias}</span>
            {quarters.map(q => (
              <span key={q.period} style={{ width: 36, textAlign: 'center' }}>{q.home_score}</span>
            ))}
            <span style={{ width: 36, textAlign: 'center', fontWeight: 600 }}>{game.home.score}</span>
          </div>
        </div>
      )}

      {showQuarters && quarters && quarters.length === 0 && (
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
          No half data available
        </div>
      )}
    </div>
  );
}
