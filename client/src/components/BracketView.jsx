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

export default function BracketView({ games, title, picks }) {
  const sorted = [...games].sort((a, b) =>
    new Date(a.scheduledAt) - new Date(b.scheduledAt)
  );

  if (sorted.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        borderRadius: 10,
        color: 'var(--text-secondary)',
        fontSize: 14,
      }}>
        {title ? `No ${title} games yet` : 'Bracket data loading…'}
      </div>
    );
  }

  // Group by region if showing a specific round
  const regions = {};
  for (const g of sorted) {
    const region = g.region || 'Other';
    if (!regions[region]) regions[region] = [];
    regions[region].push(g);
  }
  const hasRegions = Object.keys(regions).length > 1;

  // Summary stats
  const finalCount = sorted.filter(g => g.status === 'closed').length;
  const liveCount = sorted.filter(g => g.status === 'inprogress' || g.status === 'halftime').length;
  const schedCount = sorted.filter(g => g.status === 'scheduled').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={sectionLabel}>{title || 'All Tournament Games'}</div>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {sorted.length} games
          {finalCount > 0 && ` · ${finalCount} final`}
          {liveCount > 0 && ` · ${liveCount} live`}
          {schedCount > 0 && ` · ${schedCount} upcoming`}
        </span>
      </div>

      {hasRegions ? (
        Object.entries(regions).map(([region, regionGames]) => (
          <div key={region}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              margin: '14px 0 6px',
              paddingLeft: 2,
            }}>
              {region} Region
            </div>
            <div style={grid}>
              {regionGames.map(g => <GameCard key={g.id} game={g} picks={picks} />)}
            </div>
          </div>
        ))
      ) : (
        <div style={grid}>
          {sorted.map(g => <GameCard key={g.id} game={g} picks={picks} />)}
        </div>
      )}
    </div>
  );
}
