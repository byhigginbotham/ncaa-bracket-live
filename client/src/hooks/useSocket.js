import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export function useSocket() {
  const [games, setGames] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connected, setConnected] = useState(false);
  const [picks, setPicks] = useState(null);
  const [picksStatus, setPicksStatus] = useState('loading'); // 'loading' | 'awaiting' | 'ready'
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

    socket.on('scores:update', ({ games, lastUpdated }) => {
      setGames(games || []);
      setLastUpdated(lastUpdated);
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

  return { games, lastUpdated, connected, picks, picksStatus };
}
