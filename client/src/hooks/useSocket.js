import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Auto-detect server URL: same hostname as browser, port 3001
function getServerUrl() {
  const env = import.meta.env.VITE_SERVER_URL;
  if (env) return env;
  return `http://${window.location.hostname}:3001`;
}
const SERVER_URL = getServerUrl();

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
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[socket] disconnected');
    });

    socket.on('scores:update', ({ games, lastUpdated, pollStats: ps }) => {
      setGames(games || []);
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
