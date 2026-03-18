// Full 64-team mock bracket for NCAA Tournament 2026
// Realistic seeds, teams, networks, and schedule spread across tournament days

const REGIONS = {
  SOUTH: 'South',
  EAST: 'East',
  MIDWEST: 'Midwest',
  WEST: 'West',
};

// 64 teams with seeds — loosely based on real projections
const BRACKET = {
  [REGIONS.SOUTH]: [
    { seed: 1, name: 'Auburn Tigers', alias: 'AUB' },
    { seed: 16, name: 'South Alabama Jaguars', alias: 'USA' },
    { seed: 8, name: 'Michigan State Spartans', alias: 'MSU' },
    { seed: 9, name: 'Boise State Broncos', alias: 'BSU' },
    { seed: 5, name: 'Oregon Ducks', alias: 'ORE' },
    { seed: 12, name: 'UC Irvine Anteaters', alias: 'UCI' },
    { seed: 4, name: 'Texas Tech Red Raiders', alias: 'TTU' },
    { seed: 13, name: 'Vermont Catamounts', alias: 'UVM' },
    { seed: 6, name: 'Clemson Tigers', alias: 'CLEM' },
    { seed: 11, name: 'Colorado State Rams', alias: 'CSU' },
    { seed: 3, name: 'Wisconsin Badgers', alias: 'WIS' },
    { seed: 14, name: 'Colgate Raiders', alias: 'COLG' },
    { seed: 7, name: 'Saint Mary\'s Gaels', alias: 'SMC' },
    { seed: 10, name: 'New Mexico Lobos', alias: 'UNM' },
    { seed: 2, name: 'Florida Gators', alias: 'FLA' },
    { seed: 15, name: 'Robert Morris Colonials', alias: 'RMU' },
  ],
  [REGIONS.EAST]: [
    { seed: 1, name: 'Duke Blue Devils', alias: 'DUKE' },
    { seed: 16, name: 'Norfolk State Spartans', alias: 'NSU' },
    { seed: 8, name: 'BYU Cougars', alias: 'BYU' },
    { seed: 9, name: 'Georgia Bulldogs', alias: 'UGA' },
    { seed: 5, name: 'Michigan Wolverines', alias: 'MICH' },
    { seed: 12, name: 'Grand Canyon Antelopes', alias: 'GCU' },
    { seed: 4, name: 'Arizona Wildcats', alias: 'ARIZ' },
    { seed: 13, name: 'Iona Gaels', alias: 'IONA' },
    { seed: 6, name: 'Missouri Tigers', alias: 'MIZ' },
    { seed: 11, name: 'Drake Bulldogs', alias: 'DRKE' },
    { seed: 3, name: 'Iowa State Cyclones', alias: 'ISU' },
    { seed: 14, name: 'Lipscomb Bisons', alias: 'LIP' },
    { seed: 7, name: 'UCLA Bruins', alias: 'UCLA' },
    { seed: 10, name: 'Arkansas Razorbacks', alias: 'ARK' },
    { seed: 2, name: 'Alabama Crimson Tide', alias: 'BAMA' },
    { seed: 15, name: 'Siena Saints', alias: 'SIE' },
  ],
  [REGIONS.MIDWEST]: [
    { seed: 1, name: 'Houston Cougars', alias: 'HOU' },
    { seed: 16, name: 'Howard Bison', alias: 'HOW' },
    { seed: 8, name: 'San Diego State Aztecs', alias: 'SDSU' },
    { seed: 9, name: 'Creighton Bluejays', alias: 'CREI' },
    { seed: 5, name: 'Marquette Golden Eagles', alias: 'MARQ' },
    { seed: 12, name: 'McNeese State Cowboys', alias: 'MCNS' },
    { seed: 4, name: 'Purdue Boilermakers', alias: 'PUR' },
    { seed: 13, name: 'Kent State Golden Flashes', alias: 'KENT' },
    { seed: 6, name: 'Illinois Fighting Illini', alias: 'ILL' },
    { seed: 11, name: 'George Mason Patriots', alias: 'GMU' },
    { seed: 3, name: 'Tennessee Volunteers', alias: 'TENN' },
    { seed: 14, name: 'Morehead State Eagles', alias: 'MORE' },
    { seed: 7, name: 'Memphis Tigers', alias: 'MEM' },
    { seed: 10, name: 'Indiana Hoosiers', alias: 'IND' },
    { seed: 2, name: 'Kansas Jayhawks', alias: 'KU' },
    { seed: 15, name: 'UMBC Retrievers', alias: 'UMBC' },
  ],
  [REGIONS.WEST]: [
    { seed: 1, name: 'Connecticut Huskies', alias: 'UCONN' },
    { seed: 16, name: 'Liberty Flames', alias: 'LIB' },
    { seed: 8, name: 'Pittsburgh Panthers', alias: 'PITT' },
    { seed: 9, name: 'Ole Miss Rebels', alias: 'MISS' },
    { seed: 5, name: 'Gonzaga Bulldogs', alias: 'GONZ' },
    { seed: 12, name: 'Western Kentucky Hilltoppers', alias: 'WKU' },
    { seed: 4, name: 'Kentucky Wildcats', alias: 'UK' },
    { seed: 13, name: 'Samford Bulldogs', alias: 'SAM' },
    { seed: 6, name: 'St. John\'s Red Storm', alias: 'SJU' },
    { seed: 11, name: 'North Carolina Tar Heels', alias: 'UNC' },
    { seed: 3, name: 'Baylor Bears', alias: 'BAY' },
    { seed: 14, name: 'Northern Kentucky Norse', alias: 'NKU' },
    { seed: 7, name: 'Mississippi State Bulldogs', alias: 'MSST' },
    { seed: 10, name: 'Dayton Flyers', alias: 'DAY' },
    { seed: 2, name: 'Marquette Golden Eagles', alias: 'MARQ' },
    { seed: 15, name: 'Oral Roberts Golden Eagles', alias: 'ORU' },
  ],
};

// Tournament schedule (Round of 64)
// Day 1: Thursday Mar 20 — 16 games
// Day 2: Friday Mar 21 — 16 games
// Days 3-4: Sat-Sun Mar 22-23 — Round of 32
const NETWORKS_ROTATION = ['CBS', 'TBS', 'TNT', 'truTV'];
const ESPN_NETS = ['ESPN', 'ESPN2', 'ESPNU'];

function buildFirstFour(today, now) {
  const games = [];
  // First Four: Tue & Wed before Round of 64 (2 days before day 1)
  const firstFourTeams = [
    // Two 16-seed play-in games
    { home: { name: 'Texas Southern Tigers', alias: 'TXSO', seed: 16 },
      away: { name: 'Fairleigh Dickinson Knights', alias: 'FDU', seed: 16 }, network: 'truTV' },
    { home: { name: 'Southeast Missouri State Redhawks', alias: 'SEMO', seed: 16 },
      away: { name: 'Montana State Bobcats', alias: 'MTST', seed: 16 }, network: 'truTV' },
    // Two 11-seed play-in games
    { home: { name: 'Rutgers Scarlet Knights', alias: 'RUT', seed: 11 },
      away: { name: 'Nevada Wolf Pack', alias: 'NEV', seed: 11 }, network: 'TBS' },
    { home: { name: 'Virginia Cavaliers', alias: 'UVA', seed: 11 },
      away: { name: 'Texas Longhorns', alias: 'TEX', seed: 11 }, network: 'TBS' },
  ];

  for (let i = 0; i < firstFourTeams.length; i++) {
    const dayOffset = i < 2 ? -2 : -1; // Tue = -2, Wed = -1 relative to day 1
    const day = new Date(today);
    day.setDate(today.getDate() + dayOffset);
    const hour = i % 2 === 0 ? 18 : 21; // 6 PM and 9 PM
    day.setHours(hour, 30, 0, 0);

    const msSinceStart = now - day;
    let status = 'scheduled';
    let homeScore = null, awayScore = null, clock = null, period = null;

    if (msSinceStart > 2.5 * 3600000) {
      status = 'closed';
      clock = 'FINAL';
      homeScore = Math.floor(60 + Math.random() * 20);
      awayScore = Math.floor(55 + Math.random() * 20);
      if (homeScore === awayScore) homeScore += 3;
    } else if (msSinceStart > 0) {
      status = 'inprogress';
      period = msSinceStart < 1200000 ? 1 : 2;
      const mins = Math.max(0, 20 - Math.floor((msSinceStart % 1200000) / 60000));
      clock = `${mins}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
      const progress = Math.min(msSinceStart / (40 * 60000), 1);
      homeScore = Math.floor(65 * progress + Math.random() * 8);
      awayScore = Math.floor(62 * progress + Math.random() * 8);
    }

    const ff = firstFourTeams[i];
    games.push({
      id: `ff-playin-${i}`,
      status,
      clock,
      period,
      scheduledAt: day.toISOString(),
      network: ff.network,
      region: 'First Four',
      round: 'First Four',
      home: { ...ff.home, score: homeScore },
      away: { ...ff.away, score: awayScore },
    });
  }

  return games;
}

function buildRound1Schedule() {
  const games = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // First Four (Tue/Wed)
  games.push(...buildFirstFour(today, now));

  // Day 1 — 16 first-round games (South + East)
  const day1 = new Date(today);
  day1.setDate(today.getDate()); // today
  const day1Regions = [REGIONS.SOUTH, REGIONS.EAST];

  // Day 2 — 16 first-round games (Midwest + West)
  const day2 = new Date(today);
  day2.setDate(today.getDate() + 1); // tomorrow
  const day2Regions = [REGIONS.MIDWEST, REGIONS.WEST];

  let gameIndex = 0;

  for (const [dayOffset, regions] of [[0, day1Regions], [1, day2Regions]]) {
    const day = new Date(today);
    day.setDate(today.getDate() + dayOffset);

    // Time slots: 12:15, 2:45, 5:15, 7:10 (ET-ish, but we'll use local)
    const timeSlots = [
      { hour: 11, min: 15 },  // morning
      { hour: 13, min: 45 },  // early afternoon
      { hour: 16, min: 15 },  // late afternoon
      { hour: 19, min: 10 },  // evening
    ];

    for (const region of regions) {
      const teams = BRACKET[region];
      // Matchups: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
      const matchups = [
        [0, 1], [2, 3], [4, 5], [6, 7],
        [8, 9], [10, 11], [12, 13], [14, 15],
      ];

      for (let i = 0; i < matchups.length; i++) {
        const [hiIdx, loIdx] = matchups[i];
        const home = teams[hiIdx];
        const away = teams[loIdx];
        const slotIdx = i % timeSlots.length;
        const netIdx = gameIndex % NETWORKS_ROTATION.length;

        const scheduled = new Date(day);
        scheduled.setHours(timeSlots[slotIdx].hour, timeSlots[slotIdx].min, 0, 0);

        // Determine game status based on current time
        const msSinceStart = now - scheduled;
        let status = 'scheduled';
        let clock = null;
        let period = null;
        let homeScore = null;
        let awayScore = null;

        if (msSinceStart > 0 && msSinceStart < 2.5 * 3600000) {
          // Game in progress (roughly 2.5 hours)
          status = 'inprogress';
          const gameMinutes = Math.floor(msSinceStart / 60000);
          if (gameMinutes < 20) {
            period = 1;
            clock = `${20 - gameMinutes}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
          } else if (gameMinutes < 25) {
            status = 'halftime';
            period = 1;
            clock = 'HALF';
          } else if (gameMinutes < 45) {
            period = 2;
            clock = `${45 - gameMinutes}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
          } else {
            status = 'closed';
            clock = 'FINAL';
          }

          // Generate scores based on seeds (lower seed = better team = likely higher score)
          const homeExpected = (17 - home.seed) * 2.5 + 30;
          const awayExpected = (17 - away.seed) * 2.5 + 30;
          const progress = Math.min(gameMinutes / 40, 1);
          homeScore = Math.floor(homeExpected * progress + (Math.random() * 10 - 5));
          awayScore = Math.floor(awayExpected * progress + (Math.random() * 10 - 5));
        } else if (msSinceStart > 2.5 * 3600000) {
          // Game finished
          status = 'closed';
          clock = 'FINAL';
          const homeExpected = (17 - home.seed) * 2.5 + 30;
          const awayExpected = (17 - away.seed) * 2.5 + 30;
          homeScore = Math.floor(homeExpected + (Math.random() * 14 - 7));
          awayScore = Math.floor(awayExpected + (Math.random() * 14 - 7));
          // Ensure no ties
          if (homeScore === awayScore) homeScore += (home.seed < away.seed ? 2 : -2);
        }

        games.push({
          id: `r64-${region.toLowerCase()}-${i}`,
          status,
          clock,
          period,
          scheduledAt: scheduled.toISOString(),
          network: NETWORKS_ROTATION[netIdx],
          region,
          round: 'Round of 64',
          home: { name: home.name, alias: home.alias, score: homeScore, seed: home.seed },
          away: { name: away.name, alias: away.alias, score: awayScore, seed: away.seed },
        });

        gameIndex++;
      }
    }
  }

  // Add Round of 32 placeholders (Sat/Sun)
  for (let dayOff = 2; dayOff <= 3; dayOff++) {
    const day = new Date(today);
    day.setDate(today.getDate() + dayOff);
    const slots = [
      { hour: 11, min: 0 },
      { hour: 13, min: 30 },
      { hour: 16, min: 0 },
      { hour: 18, min: 30 },
    ];
    for (let i = 0; i < 8; i++) {
      const slotIdx = i % slots.length;
      const netIdx = i % NETWORKS_ROTATION.length;
      const scheduled = new Date(day);
      scheduled.setHours(slots[slotIdx].hour, slots[slotIdx].min, 0, 0);

      games.push({
        id: `r32-day${dayOff}-${i}`,
        status: 'scheduled',
        clock: null,
        period: null,
        scheduledAt: scheduled.toISOString(),
        network: NETWORKS_ROTATION[netIdx],
        region: dayOff === 2 ? (i < 4 ? REGIONS.SOUTH : REGIONS.EAST) : (i < 4 ? REGIONS.MIDWEST : REGIONS.WEST),
        round: 'Round of 32',
        home: { name: 'TBD', alias: 'TBD', score: null, seed: null },
        away: { name: 'TBD', alias: 'TBD', score: null, seed: null },
      });
    }
  }

  // Sweet 16 placeholders (Thu/Fri next week)
  for (let dayOff = 6; dayOff <= 7; dayOff++) {
    const day = new Date(today);
    day.setDate(today.getDate() + dayOff);
    for (let i = 0; i < 4; i++) {
      const scheduled = new Date(day);
      scheduled.setHours(18 + i, 0, 0, 0);
      games.push({
        id: `s16-day${dayOff}-${i}`,
        status: 'scheduled',
        clock: null,
        period: null,
        scheduledAt: scheduled.toISOString(),
        network: i < 2 ? 'CBS' : 'TBS',
        region: Object.values(REGIONS)[i],
        round: 'Sweet 16',
        home: { name: 'TBD', alias: 'TBD', score: null, seed: null },
        away: { name: 'TBD', alias: 'TBD', score: null, seed: null },
      });
    }
  }

  // Elite 8 placeholders
  for (let i = 0; i < 4; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + (i < 2 ? 8 : 9));
    const scheduled = new Date(day);
    scheduled.setHours(i < 2 ? 17 : 14, 0, 0, 0);
    games.push({
      id: `e8-${i}`,
      status: 'scheduled',
      clock: null,
      period: null,
      scheduledAt: scheduled.toISOString(),
      network: i % 2 === 0 ? 'CBS' : 'TBS',
      region: Object.values(REGIONS)[i],
      round: 'Elite 8',
      home: { name: 'TBD', alias: 'TBD', score: null, seed: null },
      away: { name: 'TBD', alias: 'TBD', score: null, seed: null },
    });
  }

  // Final Four + Championship
  const ff1 = new Date(today); ff1.setDate(today.getDate() + 13); ff1.setHours(17, 0, 0, 0);
  const ff2 = new Date(today); ff2.setDate(today.getDate() + 13); ff2.setHours(19, 30, 0, 0);
  const champ = new Date(today); champ.setDate(today.getDate() + 15); champ.setHours(20, 0, 0, 0);

  games.push(
    { id: 'ff-1', status: 'scheduled', clock: null, period: null, scheduledAt: ff1.toISOString(),
      network: 'CBS', region: 'Final Four', round: 'Final Four',
      home: { name: 'TBD', alias: 'TBD', score: null, seed: null },
      away: { name: 'TBD', alias: 'TBD', score: null, seed: null } },
    { id: 'ff-2', status: 'scheduled', clock: null, period: null, scheduledAt: ff2.toISOString(),
      network: 'CBS', region: 'Final Four', round: 'Final Four',
      home: { name: 'TBD', alias: 'TBD', score: null, seed: null },
      away: { name: 'TBD', alias: 'TBD', score: null, seed: null } },
    { id: 'championship', status: 'scheduled', clock: null, period: null, scheduledAt: champ.toISOString(),
      network: 'CBS', region: 'Championship', round: 'Championship',
      home: { name: 'TBD', alias: 'TBD', score: null, seed: null },
      away: { name: 'TBD', alias: 'TBD', score: null, seed: null } },
  );

  return games;
}

// Persistent state for live game score ticking
const liveState = new Map();

export function getMockBracket() {
  const games = buildRound1Schedule();

  // For in-progress games, make scores tick on each call
  for (const game of games) {
    if (game.status === 'inprogress') {
      if (!liveState.has(game.id)) {
        liveState.set(game.id, { home: game.home.score, away: game.away.score });
      }
      const state = liveState.get(game.id);
      if (Math.random() > 0.4) state.home += Math.ceil(Math.random() * 3);
      if (Math.random() > 0.4) state.away += Math.ceil(Math.random() * 3);
      game.home.score = state.home;
      game.away.score = state.away;
    }
  }

  return games;
}
