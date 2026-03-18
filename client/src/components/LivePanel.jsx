import React from 'react';
import GameCard from './GameCard.jsx';

const sectionLabel = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--text-tertiary)',
  margin: '16px 0 8px',
  paddingBottom: 5,
  borderBottom: '0.5px solid var(--border)',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
  gap: 8,
};

const emptyNote = {
  fontSize: 13,
  color: 'var(--text-tertiary)',
  padding: '10px 0',
};

export default function LivePanel({ games, picks }) {
  const live = games.filter(g => g.status === 'inprogress' || g.status === 'halftime');
  const scheduled = games.filter(g => g.status === 'scheduled');
  const final = games.filter(g => g.status === 'closed');

  return (
    <div>
      <div style={sectionLabel}>live now</div>
      {live.length === 0
        ? <p style={emptyNote}>No games in progress right now</p>
        : <div style={grid}>{live.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
      }

      {scheduled.length > 0 && (
        <>
          <div style={sectionLabel}>upcoming today</div>
          <div style={grid}>{scheduled.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
        </>
      )}

      {final.length > 0 && (
        <>
          <div style={sectionLabel}>final</div>
          <div style={grid}>{final.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
        </>
      )}
    </div>
  );
}
