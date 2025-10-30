import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const reconnectTimeoutRef = useRef(null);
  const { isAuthenticated, user } = useAuth();
  const userIdRef = useRef(null);

  // Cleanup function
  const cleanupSocket = useCallback(() => {
    if (!socketRef.current) {
      console.log('ℹ️ No socket to clean up');
      return;
    }
    
    console.log('🧹 Cleaning up socket connection...', {
      socketId: socketRef.current.id,
      connected: socketRef.current.connected
    });
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setSocket(null);
    setIsConnected(false);
    setConnectionAttempts(0);
  }, []);

  // Connect function
  const connectSocket = useCallback(() => {
    if (!isAuthenticated || !user || !user._id) {
      console.log('⏳ Cannot connect socket: user not authenticated');
      return;
    }

    // If already connected for this user, do nothing
    if (socketRef.current?.connected && userIdRef.current === user._id) {
      console.log('✅ Socket already connected for current user');
      return;
    }

    // If we have an existing socket for the same user but it's not connected, try to reconnect it
    if (socketRef.current && userIdRef.current === user._id) {
      console.log('🔁 Reconnecting existing socket for current user');
      try {
        socketRef.current.connect();
        return;
      } catch (e) {
        console.warn('⚠️ Failed to reconnect existing socket, creating new one...', e?.message || e);
        // fall through to create new socket
      }
    }

    // If user changed, clean up previous socket before creating a new one
    if (socketRef.current && userIdRef.current !== user._id) {
      console.log('👤 User changed, cleaning up previous socket before reconnect');
      cleanupSocket();
    }

    console.log('🔌 Initializing socket connection for user:', user._id);
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    const newSocket = io(socketUrl, {
      auth: { userId: user._id },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      forceNew: false // Reuse connection when possible
    });
    
    socketRef.current = newSocket;
    userIdRef.current = user._id;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionAttempts(0);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      // Only attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
        console.log('🔄 Will attempt to reconnect...');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionAttempts(0);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket reconnection attempt:', attemptNumber);
      setConnectionAttempts(attemptNumber);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      setConnectionAttempts(0);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    });

  }, [isAuthenticated, user, cleanupSocket]);

  useEffect(() => {
    console.log(`🔄 SocketContext useEffect triggered:`, {
      isAuthenticated, 
      userIdExists: !!user?._id,
      currentUserId: user?._id,
      storedUserId: userIdRef.current,
      hasSocket: !!socketRef.current,
      isSocketConnected: socketRef.current?.connected
    });
    
    if (isAuthenticated && user?._id) {
      // Only connect if user ID changed or no existing connection
      if (!socketRef.current || userIdRef.current !== user._id || !socketRef.current.connected) {
        console.log('🔌 SocketContext: Attempting to connect...');
        connectSocket();
      } else {
        console.log('✅ SocketContext: Socket already connected, no action needed');
      }
    } else {
      console.log('🧹 SocketContext: Not authenticated, cleaning up...');
      // Clean up when not authenticated
      cleanupSocket();
      userIdRef.current = null;
    }

    // Cleanup on unmount only
    // Note: do NOT add connectSocket/cleanupSocket to deps to avoid re-running this effect
    // and tearing down the socket unnecessarily.
    return () => {
      console.log('🧹 SocketContext useEffect cleanup called');
      cleanupSocket();
      userIdRef.current = null;
    };
  }, [isAuthenticated, user?._id]);

  const emitEvent = useCallback((event, data) => {
    if (socket && isConnected) {
      console.log('📤 Emitting event:', event, data);
      socket.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit event - socket not connected:', event);
    }
  }, [socket, isConnected]);

  const onEvent = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => {
        if (socket) {
          socket.off(event, callback);
        }
      };
    }
  }, [socket]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection requested');
    connectSocket();
  }, [connectSocket]);

  const value = {
    socket,
    isConnected,
    connectionAttempts,
    emitEvent,
    onEvent,
    reconnect
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}