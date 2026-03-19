import React, { useMemo } from 'react';
import BracketMatchup from './BracketMatchup.jsx';

// Round ordering for regional brackets
const ROUND_ORDER = ['First Round', 'Second Round', 'Sweet 16', 'Elite Eight'];
const ROUND_SHORT = { 'First Round': 'R64', 'Second Round': 'R32', 'Sweet 16': 'S16', 'Elite Eight': 'E8' };
const ROUND_GAME_COUNT = { 'First Round': 8, 'Second Round': 4, 'Sweet 16': 2, 'Elite Eight': 1 };

// Regions and their flow direction
const LEFT_REGIONS = ['East', 'South'];
const RIGHT_REGIONS = ['West', 'Midwest'];

function groupGames(games) {
  const regions = {};
  const finalFour = [];
  const championship = [];
  const firstFour = [];

  for (const g of games) {
    if (g.round === 'Final Four') {
      finalFour.push(g);
    } else if (g.round === 'Championship') {
      championship.push(g);
    } else if (g.round === 'First Four') {
      firstFour.push(g);
    } else if (g.region) {
      if (!regions[g.region]) regions[g.region] = {};
      if (!regions[g.region][g.round]) regions[g.region][g.round] = [];
      regions[g.region][g.round].push(g);
    }
  }

  // Sort each round by scheduledAt
  for (const region of Object.values(regions)) {
    for (const round of Object.values(region)) {
      round.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    }
  }
  finalFour.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  return { regions, finalFour, championship, firstFour };
}

// Creates placeholder games for empty slots
function padRound(games, expectedCount) {
  const result = [...games];
  while (result.length < expectedCount) {
    result.push(null); // null = TBD placeholder
  }
  return result;
}

// Shared constants
const GAME_HEIGHT = 42;
const BASE_GAP = 3;

function getRoundGap(roundIndex) {
  return BASE_GAP + (Math.pow(2, roundIndex) - 1) * (GAME_HEIGHT + BASE_GAP);
}

function getRoundTopPad(roundIndex) {
  return roundIndex === 0 ? 0 : (Math.pow(2, roundIndex) - 1) * (GAME_HEIGHT + BASE_GAP) / 2;
}

// Connector lines between rounds
// sourceRoundIndex = the round these lines come FROM (e.g., 0 for R64→R32 connector)
function ConnectorColumn({ sourceRoundIndex, isRTL }) {
  const pairCount = Math.pow(2, 3 - sourceRoundIndex) / 2; // R64:4 pairs, R32:2, S16:1
  const sourceGap = getRoundGap(sourceRoundIndex);
  const sourceTopPad = getRoundTopPad(sourceRoundIndex);
  const pairHeight = GAME_HEIGHT * 2 + sourceGap;

  const connectors = [];
  for (let i = 0; i < pairCount; i++) {
    const topLine = GAME_HEIGHT / 2;
    const bottomLine = GAME_HEIGHT + sourceGap + GAME_HEIGHT / 2;
    const midLine = (topLine + bottomLine) / 2;

    connectors.push(
      <div key={i} style={{
        position: 'relative',
        height: pairHeight,
        width: '100%',
        marginBottom: i < pairCount - 1 ? sourceGap : 0,
      }}>
        {/* Top horizontal stub */}
        <div style={{
          position: 'absolute',
          top: topLine,
          [isRTL ? 'right' : 'left']: 0,
          width: '50%',
          borderTop: '1px solid var(--border-med)',
        }} />
        {/* Bottom horizontal stub */}
        <div style={{
          position: 'absolute',
          top: bottomLine,
          [isRTL ? 'right' : 'left']: 0,
          width: '50%',
          borderTop: '1px solid var(--border-med)',
        }} />
        {/* Vertical line connecting pair */}
        <div style={{
          position: 'absolute',
          top: topLine,
          [isRTL ? 'right' : 'left']: '50%',
          width: 0,
          height: bottomLine - topLine,
          borderLeft: '1px solid var(--border-med)',
        }} />
        {/* Horizontal stub to next round */}
        <div style={{
          position: 'absolute',
          top: midLine,
          [isRTL ? 'right' : 'left']: '50%',
          width: '50%',
          borderTop: '1px solid var(--border-med)',
        }} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: 32,
      flexShrink: 0,
      paddingTop: sourceTopPad + 14, // offset for round label height
    }}>
      {connectors}
    </div>
  );
}

// A single column of games for one round
function RoundColumn({ games, picks, roundIndex, label, compact }) {
  const gap = getRoundGap(roundIndex);
  const topPad = getRoundTopPad(roundIndex);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-tertiary)',
        marginBottom: 3,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gap,
        paddingTop: topPad,
      }}>
        {games.map((game, i) => (
          <BracketMatchup key={game ? game.id : `tbd-${i}`} game={game} picks={picks} compact={compact} />
        ))}
      </div>
    </div>
  );
}

// A full regional bracket (4 rounds with connectors)
function RegionBracket({ regionName, regionGames, picks, direction }) {
  const isRTL = direction === 'rtl';

  // Build round arrays
  const rounds = ROUND_ORDER.map(roundName => {
    const games = regionGames[roundName] || [];
    return padRound(games, ROUND_GAME_COUNT[roundName]);
  });

  const GAME_HEIGHT = 54;
  const BASE_GAP = 6;

  // Build columns: interleave round columns with connector columns
  const columns = [];
  const roundLabels = ROUND_ORDER.map(r => ROUND_SHORT[r]);

  // For RTL, reverse the order
  const indices = isRTL ? [3, 2, 1, 0] : [0, 1, 2, 3];

  for (let idx = 0; idx < indices.length; idx++) {
    const ri = indices[idx];
    columns.push(
      <RoundColumn
        key={`round-${ri}`}
        games={rounds[ri]}
        picks={picks}
        roundIndex={ri}
        label={roundLabels[ri]}
        compact={ri > 0}
      />
    );

    // Add connector after each round except the last
    if (idx < 3) {
      // For LTR: source is current round (ri), connector pairs its games
      // For RTL: source is the next column (which is a lower round index)
      const sourceRoundIdx = isRTL ? indices[idx + 1] : ri;
      columns.push(
        <ConnectorColumn
          key={`conn-${idx}`}
          sourceRoundIndex={sourceRoundIdx}
          isRTL={isRTL}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: 4,
        textAlign: isRTL ? 'right' : 'left',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {regionName}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0,
      }}>
        {columns}
      </div>
    </div>
  );
}

// Final Four center section
function FinalFourSection({ finalFour, championship, picks }) {
  const GAME_HEIGHT = 54;
  const BASE_GAP = 6;

  // Pad to expected counts
  const ffGames = padRound(finalFour, 2);
  const champGames = padRound(championship, 1);

  // Find champion (winner of championship game if closed)
  let champion = null;
  if (champGames[0] && champGames[0].status === 'closed') {
    const g = champGames[0];
    champion = g.home.score > g.away.score ? g.home : g.away;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 12px',
      minWidth: 220,
    }}>
      {/* Champion display */}
      {champion && (
        <div style={{
          textAlign: 'center',
          marginBottom: 16,
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #D4A017 0%, #F5D061 100%)',
          borderRadius: 8,
          color: '#1a1a18',
        }}>
          <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            Champion
          </div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {champion.seed && <span style={{ fontSize: 11, fontWeight: 400, marginRight: 4 }}>({champion.seed})</span>}
            {champion.alias || champion.name}
          </div>
        </div>
      )}

      {!champion && (
        <div style={{
          textAlign: 'center',
          marginBottom: 16,
          fontSize: 9,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-tertiary)',
        }}>
          Championship
        </div>
      )}

      {/* Championship game */}
      <BracketMatchup game={champGames[0]} picks={picks} />

      <div style={{
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-tertiary)',
        margin: '16px 0 8px',
      }}>
        Final Four
      </div>

      {/* Final Four games stacked */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: BASE_GAP, alignItems: 'center' }}>
        {ffGames.map((game, i) => (
          <BracketMatchup key={game ? game.id : `ff-tbd-${i}`} game={game} picks={picks} />
        ))}
      </div>
    </div>
  );
}

export default function BracketTree({ games, picks }) {
  const { regions, finalFour, championship } = useMemo(() => groupGames(games), [games]);

  // If no games at all, show empty state
  if (games.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        borderRadius: 10,
        color: 'var(--text-secondary)',
        fontSize: 14,
      }}>
        Bracket data loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0', overflowX: 'hidden' }}>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Top half: East (LTR) | Final Four | West (RTL) */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 0,
          marginBottom: 16,
        }}>
          {/* East region — left side, LTR */}
          <RegionBracket
            regionName="East"
            regionGames={regions['East'] || {}}
            picks={picks}
            direction="ltr"
          />

          {/* Center: Final Four + Championship */}
          <FinalFourSection
            finalFour={finalFour}
            championship={championship}
            picks={picks}
          />

          {/* West region — right side, RTL */}
          <RegionBracket
            regionName="West"
            regionGames={regions['West'] || {}}
            picks={picks}
            direction="rtl"
          />
        </div>

        {/* Bottom half: South (LTR) | spacer | Midwest (RTL) */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 0,
        }}>
          {/* South region — left side, LTR */}
          <RegionBracket
            regionName="South"
            regionGames={regions['South'] || {}}
            picks={picks}
            direction="ltr"
          />

          {/* Center spacer to match Final Four width */}
          <div style={{ minWidth: 220, padding: '0 12px' }} />

          {/* Midwest region — right side, RTL */}
          <RegionBracket
            regionName="Midwest"
            regionGames={regions['Midwest'] || {}}
            picks={picks}
            direction="rtl"
          />
        </div>
      </div>
    </div>
  );
}
