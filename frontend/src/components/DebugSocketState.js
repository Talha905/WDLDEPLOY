import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

/**
 * Debug component to monitor authentication and socket state changes
 * Add this to your VideoRoom component to track what's causing re-renders
 */
export function DebugSocketState() {
  const { isAuthenticated, user, loading } = useAuth();
  const { socket, isConnected, connectionAttempts } = useSocket();
  const renderCountRef = useRef(0);
  const prevStateRef = useRef({});
  const lastLogTimeRef = useRef(0);
  
  renderCountRef.current += 1;
  
  const currentState = {
    isAuthenticated,
    userId: user?._id,
    userName: user?.name,
    loading,
    socketId: socket?.id,
    isConnected,
    connectionAttempts,
    renderCount: renderCountRef.current
  };
  
  useEffect(() => {
    const now = Date.now();
    const prevState = prevStateRef.current;
    const changes = {};
    
    Object.keys(currentState).forEach(key => {
      if (currentState[key] !== prevState[key]) {
        changes[key] = {
          from: prevState[key],
          to: currentState[key]
        };
      }
    });
    
    // Only log changes every 500ms to avoid spam
    if (Object.keys(changes).length > 0 && (now - lastLogTimeRef.current) > 500) {
      console.log('🔍 DEBUG: State changes detected:', changes);
      lastLogTimeRef.current = now;
    }
    
    prevStateRef.current = { ...currentState };
  });
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '50px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '10px',
      fontSize: '11px',
      fontFamily: 'monospace',
      borderRadius: '4px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div style={{ fontWeight: 'bold', color: '#ff6b6b', marginBottom: '5px' }}>
        🐛 DEBUG: Socket State Monitor
      </div>
      <div>Renders: {renderCountRef.current}</div>
      <div>Auth: {isAuthenticated ? '✅' : '❌'} (loading: {loading ? '⏳' : '✅'})</div>
      <div>User: {user?.name || 'None'} ({user?._id?.substring(0, 8)}...)</div>
      <div>Socket: {socket?.id?.substring(0, 8)}... ({isConnected ? '🟢' : '🔴'})</div>
      <div>Attempts: {connectionAttempts}</div>
      
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#ccc' }}>
        Watch console for state change logs
      </div>
    </div>
  );
}

export default DebugSocketState;