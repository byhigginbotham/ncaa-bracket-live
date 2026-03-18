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

function isToday(isoStr) {
  if (!isoStr) return false;
  const gameDate = new Date(isoStr).toLocaleDateString();
  const today = new Date().toLocaleDateString();
  return gameDate === today;
}

export default function LivePanel({ games, picks }) {
  const live = games.filter(g => g.status === 'inprogress' || g.status === 'halftime');
  const todayScheduled = games.filter(g => g.status === 'scheduled' && isToday(g.scheduledAt));
  const todayFinal = games.filter(g => g.status === 'closed' && isToday(g.scheduledAt));

  // Next game day (if no games today)
  const nextScheduled = games
    .filter(g => g.status === 'scheduled' && !isToday(g.scheduledAt))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const nextDay = nextScheduled.length > 0
    ? new Date(nextScheduled[0].scheduledAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
    : null;
  const nextDayGames = nextScheduled.length > 0
    ? nextScheduled.filter(g => {
        const d1 = new Date(g.scheduledAt).toLocaleDateString();
        const d2 = new Date(nextScheduled[0].scheduledAt).toLocaleDateString();
        return d1 === d2;
      })
    : [];

  return (
    <div>
      <div style={sectionLabel}>live now</div>
      {live.length === 0
        ? <p style={emptyNote}>No games in progress right now</p>
        : <div style={grid}>{live.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
      }

      {todayScheduled.length > 0 && (
        <>
          <div style={sectionLabel}>upcoming today</div>
          <div style={grid}>{todayScheduled.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
        </>
      )}

      {todayScheduled.length === 0 && nextDayGames.length > 0 && (
        <>
          <div style={sectionLabel}>next games — {nextDay}</div>
          <div style={grid}>{nextDayGames.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
        </>
      )}

      {todayFinal.length > 0 && (
        <>
          <div style={sectionLabel}>final — today</div>
          <div style={grid}>{todayFinal.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
        </>
      )}
    </div>
  );
}
