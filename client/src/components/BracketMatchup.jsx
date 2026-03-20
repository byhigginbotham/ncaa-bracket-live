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

  const isInProgress = game.status === 'inprogress';
  const isHalftime = game.status === 'halftime';
  const isLive = isInProgress || isHalftime;
  const isTBD = (!game.home?.alias || game.home.alias === 'TBD') &&
                (!game.away?.alias || game.away.alias === 'TBD');
  const width = (compact && isTBD) ? 70 : 145;

  // Check if game starts within 30 minutes
  const isSoon = game.status === 'scheduled' && game.scheduledAt &&
    (new Date(game.scheduledAt).getTime() - Date.now()) < 30 * 60 * 1000 &&
    (new Date(game.scheduledAt).getTime() - Date.now()) > 0;

  let borderColor = 'var(--border)';
  let borderWidth = 1;
  let animationName = undefined;
  let boxShadow = 'none';

  if (isInProgress) {
    borderColor = '#1D9E75';
    borderWidth = 2;
    animationName = 'bracketPulse';
    boxShadow = '0 0 8px rgba(29, 158, 117, 0.3)';
  } else if (isHalftime) {
    borderColor = '#D4A017';
    borderWidth = 2;
    boxShadow = '0 0 6px rgba(212, 160, 23, 0.2)';
  } else if (isSoon) {
    borderColor = '#5B9BD5';
    borderWidth = 2;
    boxShadow = '0 0 6px rgba(91, 155, 213, 0.2)';
  }

  const cardStyle = {
    width,
    background: 'var(--bg-secondary)',
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    opacity: (compact && isTBD) ? 0.4 : 1,
    boxShadow,
    animation: animationName ? `${animationName} 2s ease-in-out infinite` : 'none',
  };

  return (
    <>
      {/* Inject keyframes for pulse animation */}
      {isInProgress && (
        <style>{`
          @keyframes bracketPulse {
            0%, 100% { box-shadow: 0 0 8px rgba(29, 158, 117, 0.3); }
            50% { box-shadow: 0 0 16px rgba(29, 158, 117, 0.6); }
          }
        `}</style>
      )}
      <div style={cardStyle}>
        <TeamRow team={game.away} opponent={game.home} game={game} picks={picks} isTop={true} />
        <TeamRow team={game.home} opponent={game.away} game={game} picks={picks} isTop={false} />
      </div>
    </>
  );
}
