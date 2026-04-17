import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';

const SocketContext = createContext(null);

/**
 * SocketProvider — creates ONE socket connection per authenticated session.
 * All child components share the same socket via useSocket() hook.
 * This prevents the duplicate-connection bug where each component
 * calling useSocket() created its own connection.
 */
export function SocketProvider({ children }) {
  const { token, user, isAuthenticated } = useAuthStore();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect any existing socket when auth is lost
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // Don't create a new socket if one already exists and is connected
    if (socketRef.current?.connected) return;

    const s = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
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
