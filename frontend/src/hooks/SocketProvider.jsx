import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';

const SocketContext = createContext(null);

/**
 * Get the WebSocket server URL.
 * In production: connect directly to Railway (WebSocket can't go through Vercel rewrites).
 * In development: connect to same origin (proxied by Vite).
 */
function getSocketURL() {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (base) {
    return base.replace(/\/$/, ''); // e.g. https://trajex-production.up.railway.app
  }
  return undefined; // Socket.io defaults to current origin (localhost:5173 in dev)
}

/**
 * SocketProvider — creates ONE socket connection per authenticated session.
 * All child components share the same socket via useSocket() hook.
 */
export function SocketProvider({ children }) {
  const { token, user, isAuthenticated } = useAuthStore();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    if (socketRef.current?.connected) return;

    const socketURL = getSocketURL();

    const s = io(socketURL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      withCredentials: true,
    });

    s.on('connect', () => {
      if (user?.businessId) s.emit('join-org', user.businessId);
    });

    s.on('error', () => {});

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [token, isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * useSocket — returns the shared socket instance from SocketProvider.
 * Returns null if not authenticated or not yet connected.
 */
export default function useSocket() {
  return useContext(SocketContext);
}
