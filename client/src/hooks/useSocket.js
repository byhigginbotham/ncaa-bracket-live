import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Server URL: always same hostname as browser, port 3001
// This ensures LAN, Tailscale, and localhost all work without rebuild
const SERVER_URL = `http://${window.location.hostname}:3001`;

export function useSocket() {
  const [games, setGames] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connected, setConnected] = useState(false);
  const [picks, setPicks] = useState(null);
  const [picksStatus, setPicksStatus] = useState('loading');
  const [pollStats, setPollStats] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[socket] connected');

      // Fetch full game list (DB + live merged) on connect
      // This includes historical rounds ESPN dropped from live feed
      fetch(`${SERVER_URL}/api/games`)
        .then(r => r.json())
        .then(data => {
          if (data.games) {
            setGames(data.games);
            setLastUpdated(data.lastUpdated);
          }
        })
        .catch(() => {});
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[socket] disconnected');
    });

    socket.on('scores:update', ({ games: liveGames, lastUpdated, pollStats: ps }) => {
      // Merge: keep DB games, overlay live state for fresher scores
      setGames(prev => {
        if (!prev || prev.length === 0) return liveGames || [];
        const map = new Map(prev.map(g => [g.id, g]));
        for (const g of (liveGames || [])) {
          map.set(g.id, g); // live data overwrites DB for active games
        }
        return Array.from(map.values()).sort(
          (a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || '')
        );
      });
      setLastUpdated(lastUpdated);
      if (ps) setPollStats(ps);
    });

    // Fetch picks once
    fetch(`${SERVER_URL}/api/picks`)
      .then(r => r.json())
      .then(data => {
        if (!data.picks || Object.keys(data.picks).length === 0 || data._status === 'awaiting') {
          setPicks(new Map());
          setPicksStatus('awaiting');
        } else {
          // Map round keys to game round names for lookup
          const roundKeyToGameRound = {
            'round-of-64': 'First Round',
            'round-of-32': 'Second Round',
            'sweet-16': 'Sweet 16',
            'elite-8': 'Elite 8',
            'final-four': 'Final Four',
            'championship': 'Championship',
          };
          const picksByRound = new Map();
          for (const [roundKey, teams] of Object.entries(data.picks)) {
            if (Array.isArray(teams)) {
              const gameRound = roundKeyToGameRound[roundKey] || roundKey;
              picksByRound.set(gameRound, new Set(teams));
            }
          }
          setPicks(picksByRound);
          setPicksStatus('ready');
        }
      })
      .catch(() => {
        setPicks(new Map());
        setPicksStatus('awaiting');
      });

    return () => socket.disconnect();
  }, []);

  return { games, lastUpdated, connected, picks, picksStatus, pollStats };
}
