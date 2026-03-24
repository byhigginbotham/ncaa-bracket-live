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
          setPicks(new Set());
          setPicksStatus('awaiting');
        } else {
          const allPicks = new Set();
          for (const round of Object.values(data.picks)) {
            if (Array.isArray(round)) {
              for (const alias of round) allPicks.add(alias);
            }
          }
          setPicks(allPicks);
          setPicksStatus('ready');
        }
      })
      .catch(() => {
        setPicks(new Set());
        setPicksStatus('awaiting');
      });

    return () => socket.disconnect();
  }, []);

  return { games, lastUpdated, connected, picks, picksStatus, pollStats };
}
