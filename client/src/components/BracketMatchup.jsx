import React from 'react';

function TeamRow({ team, opponent, game, picks, isTop }) {
  const isTBD = !team || !team.alias || team.alias === 'TBD';
  const isScheduled = game.status === 'scheduled';
  const isClosed = game.status === 'closed';

  // Determine winner for closed games
  let isWinner = false;
  let opponentWon = false;
  if (isClosed && team && opponent) {
    isWinner = team.score > opponent.score;
    opponentWon = opponent.score > team.score;
  }

  // Leading (for live games)
  const isLeading = !isClosed && team && opponent &&
    team.score !== null && opponent.score !== null &&
    team.score > opponent.score;

  const isPicked = picks && team && picks.has(team.alias);
  const pickedAndLost = isPicked && isClosed && opponentWon;

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1px 5px',
    borderTop: isTop ? 'none' : '1px solid var(--border)',
    minHeight: 20,
    gap: 4,
  };

  const seedStyle = {
    fontSize: 8,
    color: 'var(--text-tertiary)',
    minWidth: 12,
    textAlign: 'right',
    flexShrink: 0,
  };

  const aliasStyle = {
    fontSize: 10,
    fontWeight: (isClosed && isWinner) || (!isClosed && isLeading) ? 700 : 400,
    color: isTBD ? 'var(--text-tertiary)' : 'var(--text)',
    fontStyle: isTBD ? 'italic' : 'normal',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    minWidth: 0,
  };

  const scoreStyle = {
    fontSize: 10,
    fontWeight: 600,
    color: (isClosed && isWinner) || (!isClosed && isLeading) ? '#1D9E75' : 'var(--text)',
    flexShrink: 0,
    minWidth: 20,
    textAlign: 'right',
  };

  const pickStyle = {
    fontSize: 9,
    flexShrink: 0,
    marginLeft: 2,
    color: pickedAndLost ? '#E74C3C' : '#D4A017',
  };

  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, minWidth: 0 }}>
        <span style={seedStyle}>{isTBD ? '' : (team?.seed || '')}</span>
        <span style={aliasStyle}>{isTBD ? 'TBD' : team.alias}</span>
        {isPicked && (
          <span style={pickStyle}>{pickedAndLost ? '\u2715' : '\u2605'}</span>
        )}
      </div>
      <span style={scoreStyle}>
        {isTBD ? '' : isScheduled ? '\u2013' : (team?.score ?? '')}
      </span>
    </div>
  );
}

export default function BracketMatchup({ game, picks, compact }) {
  if (!game) {
    // Placeholder TBD slot
    const placeholder = { alias: 'TBD', seed: null, score: null };
    const tbdGame = { status: 'scheduled', home: placeholder, away: placeholder };
    return <BracketMatchup game={tbdGame} picks={picks} compact={compact} />;
  }

  const isLive = game.status === 'inprogress' || game.status === 'halftime';
  const isTBD = (!game.home?.alias || game.home.alias === 'TBD') &&
                (!game.away?.alias || game.away.alias === 'TBD');
  const width = (compact && isTBD) ? 70 : 145;

  const cardStyle = {
    width,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    borderLeft: isLive ? '3px solid #1D9E75' : '1px solid var(--border)',
    overflow: 'hidden',
    flexShrink: 0,
    opacity: (compact && isTBD) ? 0.4 : 1,
  };

  return (
    <div style={cardStyle}>
      <TeamRow team={game.away} opponent={game.home} game={game} picks={picks} isTop={true} />
      <TeamRow team={game.home} opponent={game.away} game={game} picks={picks} isTop={false} />
    </div>
  );
}
