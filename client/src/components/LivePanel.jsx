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

const mobileGrid = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const mobileSectionLabel = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--text-tertiary)',
  margin: '12px 0 6px',
  paddingBottom: 4,
  borderBottom: '0.5px solid var(--border)',
};

const emptyNote = {
  fontSize: 13,
  color: 'var(--text-tertiary)',
  padding: '10px 0',
};

function dateKey(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString();
}

function isToday(isoStr) {
  return dateKey(isoStr) === new Date().toLocaleDateString();
}

function formatDateHeader(isoStr) {
  return new Date(isoStr).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function LivePanel({ games, picks, mobile }) {
  const live = games.filter(g => g.status === 'inprogress' || g.status === 'halftime');
  const todayScheduled = games.filter(g => g.status === 'scheduled' && isToday(g.scheduledAt));
  const todayFinal = games.filter(g => g.status === 'closed' && isToday(g.scheduledAt));

  // Future scheduled games grouped by date
  const futureScheduled = games
    .filter(g => g.status === 'scheduled' && !isToday(g.scheduledAt))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const futureDays = [];
  const seen = new Set();
  for (const g of futureScheduled) {
    const dk = dateKey(g.scheduledAt);
    if (!seen.has(dk)) {
      seen.add(dk);
      futureDays.push({
        key: dk,
        label: formatDateHeader(g.scheduledAt),
        games: futureScheduled.filter(fg => dateKey(fg.scheduledAt) === dk),
      });
    }
  }

  // Past final games grouped by date (most recent first)
  const pastFinal = games
    .filter(g => g.status === 'closed' && !isToday(g.scheduledAt))
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  const pastDays = [];
  const seenPast = new Set();
  for (const g of pastFinal) {
    const dk = dateKey(g.scheduledAt);
    if (!seenPast.has(dk)) {
      seenPast.add(dk);
      pastDays.push({
        key: dk,
        label: formatDateHeader(g.scheduledAt),
        games: pastFinal.filter(fg => dateKey(fg.scheduledAt) === dk),
      });
    }
  }

  const g_ = mobile ? mobileGrid : grid;
  const sl_ = mobile ? mobileSectionLabel : sectionLabel;

  return (
    <div>
      {/* Live games */}
      <div style={sl_}>live now</div>
      {live.length === 0
        ? <p style={emptyNote}>No games in progress right now</p>
        : <div style={g_}>{live.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
      }

      {/* Upcoming today */}
      {todayScheduled.length > 0 && (
        <>
          <div style={sl_}>upcoming today</div>
          <div style={g_}>{todayScheduled.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
        </>
      )}

      {/* All finals — today first, then past days */}
      {todayFinal.length > 0 && (
        <>
          <div style={sl_}>final — today</div>
          <div style={g_}>{todayFinal.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
        </>
      )}

      {pastDays.map(day => (
        <div key={day.key}>
          <div style={sl_}>final — {day.label}</div>
          <div style={g_}>{day.games.map(g => <GameCard key={g.id} game={g} picks={picks} />)}</div>
        </div>
      ))}
    </div>
  );
}
