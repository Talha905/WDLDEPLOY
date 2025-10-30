import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChatPanel from '../../components/meeting/ChatPanel';
import ParticipantsPanel from '../../components/meeting/ParticipantsPanel';
import ShareDialog from '../../components/meeting/ShareDialog';
import '../../styles/components/VideoRoom.css';

function VideoRoom() {
  const { sessionId } = useParams(); // Use sessionId from URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  // Media refs and state
  const localVideoRef = useRef();
  const peersRef = useRef({}); // Use object to prevent duplicates
  const peerConnectionsRef = useRef({}); // Track connection states
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  
  // UI state
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [roomFull, setRoomFull] = useState(false);
  
  // Screen sharing state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [presenter, setPresenter] = useState(null); // {socketId, name, role}
  const [originalStream, setOriginalStream] = useState(null);
  
  // Initialize media and join room
  useEffect(() => {
    if (!socket || !isConnected || !user) return;
    
    const initRoom = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Join room via Socket.IO
        socket.emit('join room', {
          roomID: sessionId, // Use sessionId as roomID
          userEmail: user.email,
          userUid: user._id,
          userName: user.name,
          userRole: user.role
        });
        
        // Get initial data
        socket.emit('get chat history', sessionId);
        socket.emit('get participants', sessionId);
        
        toast.success('Joined session successfully!');
      } catch (error) {
        console.error('Failed to initialize room:', error);
        toast.error('Failed to access camera/microphone');
      }
    };
    
    initRoom();
    
    // Cleanup on unmount
    return () => {
      // Clean up screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (originalStream) {
        originalStream.getTracks().forEach(track => track.stop());
      }
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Clean up all peer connections
      Object.values(peersRef.current).forEach(peer => {
        if (peer && !peer.destroyed) {
          peer.destroy();
        }
      });
      peersRef.current = {};
      peerConnectionsRef.current = {};
      
      if (socket) {
        socket.emit('leave room', { roomID: sessionId });
      }
    };
  }, [socket, isConnected, user, sessionId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !localStream) return;
    
    // Room full handler
    const handleRoomFull = () => {
      setRoomFull(true);
      toast.error('Session is full (max 10 participants)');
      setTimeout(() => navigate('/sessions'), 3000);
    };
    
    // Handle all existing users
    const handleAllUsers = (users) => {
      console.log('Existing users in room:', users);
      const newPeers = {};
      
      users.forEach(userID => {
        if (!peersRef.current[userID] && userID !== socket.id) {
          try {
            const peer = createPeer(userID, socket.id, localStream);
            peersRef.current[userID] = peer;
            newPeers[userID] = peer;
            peerConnectionsRef.current[userID] = 'connecting';
          } catch (error) {
            console.error(`Failed to create peer for ${userID}:`, error);
          }
        }
      });
      
      setPeers(prev => ({ ...prev, ...newPeers }));
    };
    
    // Handle new user joined
    const handleUserJoined = (payload) => {
      console.log('User joined:', payload.callerID);
      
      if (peersRef.current[payload.callerID] || payload.callerID === socket.id) {
        console.log('Ignoring duplicate or self connection');
        return;
      }
      
      try {
        const peer = addPeer(payload.signal, payload.callerID, localStream);
        peersRef.current[payload.callerID] = peer;
        peerConnectionsRef.current[payload.callerID] = 'connecting';
        
        setPeers(prev => ({ ...prev, [payload.callerID]: peer }));
        toast.info('A new participant joined');
      } catch (error) {
        console.error(`Failed to add peer for ${payload.callerID}:`, error);
      }
    };
    
    // Handle receiving returned signal
    const handleReturnedSignal = (payload) => {
      console.log('Receiving returned signal from:', payload.id);
      const peer = peersRef.current[payload.id];
      
      if (peer && !peer.destroyed && peerConnectionsRef.current[payload.id] === 'connecting') {
        try {
          peer.signal(payload.signal);
        } catch (error) {
          console.error(`Failed to signal peer ${payload.id}:`, error);
        }
      } else {
        console.warn(`Cannot signal peer ${payload.id}: ${peer ? 'destroyed' : 'not found'}`);
      }
    };
    
    // Handle user left
    const handleUserLeft = (id) => {
      console.log('User left:', id);
      const peer = peersRef.current[id];
      
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
      
      delete peersRef.current[id];
      delete peerConnectionsRef.current[id];
      
      setPeers(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      
      toast.info('A participant left the session');
    };
    
    // Chat and participants updates
    const handleChatHistory = (history) => {
      setMessages(history);
    };
    
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };
    
    const handleParticipantsUpdate = (participants) => {
      setParticipants(participants);
    };
    
    // Screen sharing event handlers
    const handleScreenShareStarted = (data) => {
      console.log('Screen sharing started by:', data.presenterInfo);
      setPresenter(data.presenterInfo);
      if (data.presenterInfo.socketId !== socket.id) {
        toast.info(`${data.presenterInfo.name} started presenting`);
      }
    };
    
    const handleScreenShareStopped = () => {
      console.log('Screen sharing stopped');
      const wasPresenting = presenter?.socketId === socket.id;
      setPresenter(null);
      if (!wasPresenting && presenter) {
        toast.info(`${presenter.name} stopped presenting`);
      }
    };
    
    // Register event handlers
    socket.on('room full', handleRoomFull);
    socket.on('all users', handleAllUsers);
    socket.on('user joined', handleUserJoined);
    socket.on('receiving returned signal', handleReturnedSignal);
    socket.on('user left', handleUserLeft);
    socket.on('chat history', handleChatHistory);
    socket.on('new message', handleNewMessage);
    socket.on('participants update', handleParticipantsUpdate);
    socket.on('screen share started', handleScreenShareStarted);
    socket.on('screen share stopped', handleScreenShareStopped);
    
    return () => {
      socket.off('room full', handleRoomFull);
      socket.off('all users', handleAllUsers);
      socket.off('user joined', handleUserJoined);
      socket.off('receiving returned signal', handleReturnedSignal);
      socket.off('user left', handleUserLeft);
      socket.off('chat history', handleChatHistory);
      socket.off('new message', handleNewMessage);
      socket.off('participants update', handleParticipantsUpdate);
      socket.off('screen share started', handleScreenShareStarted);
      socket.off('screen share stopped', handleScreenShareStopped);
    };
  }, [socket, localStream, navigate, sessionId]);

  // Create peer for existing user (initiator)
  function createPeer(userToSignal, callerID, stream) {
    console.log(`Creating initiator peer for ${userToSignal}`);
    
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });
    
    peer.on('signal', signal => {
      if (!peer.destroyed) {
        console.log(`Sending signal to ${userToSignal}`);
        socket.emit('sending signal', {
          userToSignal,
          callerID,
          signal
        });
      }
    });
    
    peer.on('connect', () => {
      console.log(`Connected to peer ${userToSignal}`);
      peerConnectionsRef.current[userToSignal] = 'connected';
    });
    
    peer.on('error', (error) => {
      console.error(`Peer error with ${userToSignal}:`, error);
      peerConnectionsRef.current[userToSignal] = 'failed';
    });
    
    peer.on('close', () => {
      console.log(`Peer connection closed with ${userToSignal}`);
      peerConnectionsRef.current[userToSignal] = 'closed';
    });
    
    return peer;
  }

  // Add peer for new user (non-initiator)
  function addPeer(incomingSignal, callerID, stream) {
    console.log(`Creating receiver peer for ${callerID}`);
    
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });
    
    peer.on('signal', signal => {
      if (!peer.destroyed) {
        console.log(`Returning signal to ${callerID}`);
        socket.emit('returning signal', {
          signal,
          callerID
        });
      }
    });
    
    peer.on('connect', () => {
      console.log(`Connected to peer ${callerID}`);
      peerConnectionsRef.current[callerID] = 'connected';
    });
    
    peer.on('error', (error) => {
      console.error(`Peer error with ${callerID}:`, error);
      peerConnectionsRef.current[callerID] = 'failed';
    });
    
    peer.on('close', () => {
      console.log(`Peer connection closed with ${callerID}`);
      peerConnectionsRef.current[callerID] = 'closed';
    });
    
    // Signal immediately for non-initiator
    try {
      peer.signal(incomingSignal);
    } catch (error) {
      console.error(`Failed to signal peer ${callerID}:`, error);
      throw error;
    }
    
    return peer;
  }

  // Toggle audio mute
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioMuted; // CORRECT: Use negation
        setAudioMuted(!audioMuted);
        toast.info(audioMuted ? 'Microphone unmuted' : 'Microphone muted');
      }
    }
  };

  // Toggle video mute
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoMuted; // CORRECT: Use negation
        setVideoMuted(!videoMuted);
        toast.info(videoMuted ? 'Camera enabled' : 'Camera disabled');
      }
    }
  };

  // Send chat message
  const sendMessage = (message) => {
    socket.emit('send message', {
      meetingCode: sessionId,
      message,
      senderEmail: user.email,
      senderUid: user._id,
      senderName: user.name
    });
  };

  // Leave room
  const leaveRoom = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Destroy all peer connections
    Object.values(peersRef.current).forEach(peer => {
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
    });
    
    peersRef.current = {};
    peerConnectionsRef.current = {};
    
    socket.emit('leave room', { roomID: sessionId });
    navigate('/sessions');
  };

  // Check screen sharing permissions
  const canStartScreenShare = () => {
    const allowedRoles = ['MENTOR', 'ADMIN'];
    return allowedRoles.includes(user?.role?.toUpperCase());
  };
  
  // Start screen sharing
  const startScreenShare = async () => {
    if (!canStartScreenShare()) {
      toast.error('Only mentors and admins can share their screen');
      return;
    }
    
    if (presenter && presenter.socketId !== socket.id) {
      toast.error('Someone else is already presenting');
      return;
    }
    
    try {
      console.log('Starting screen share...');
      
      // Get screen share stream
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Store original camera stream
      if (localStream && !originalStream) {
        setOriginalStream(localStream);
      }
      
      // Replace tracks in all peer connections
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        Object.values(peersRef.current).forEach(peer => {
          if (peer && !peer.destroyed) {
            const sender = peer._pc?.getSenders()?.find(s => 
              s.track && s.track.kind === 'video'
            );
            if (sender) {
              sender.replaceTrack(videoTrack).catch(err => 
                console.error('Failed to replace track:', err)
              );
            }
          }
        });
      }
      
      // Update local video
      setScreenStream(displayStream);
      setLocalStream(displayStream);
      setIsScreenSharing(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
      }
      
      // Listen for screen share end (user clicks stop sharing)
      videoTrack.addEventListener('ended', () => {
        stopScreenShare();
      });
      
      // Notify other participants
      socket.emit('screen share started', {
        roomID: sessionId,
        presenterInfo: {
          socketId: socket.id,
          name: user.name,
          role: user.role
        }
      });
      
      toast.success('Screen sharing started');
    } catch (error) {
      console.error('Failed to start screen share:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing permission denied');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Screen sharing not supported on this device');
      } else {
        toast.error('Failed to start screen sharing');
      }
    }
  };
  
  // Stop screen sharing
  const stopScreenShare = async () => {
    try {
      console.log('Stopping screen share...');
      
      // Stop screen stream
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      
      // Restore original camera stream
      if (originalStream) {
        const videoTrack = originalStream.getVideoTracks()[0];
        if (videoTrack) {
          Object.values(peersRef.current).forEach(peer => {
            if (peer && !peer.destroyed) {
              const sender = peer._pc?.getSenders()?.find(s => 
                s.track && s.track.kind === 'video'
              );
              if (sender) {
                sender.replaceTrack(videoTrack).catch(err => 
                  console.error('Failed to replace track:', err)
                );
              }
            }
          });
        }
        
        setLocalStream(originalStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = originalStream;
        }
      }
      
      setIsScreenSharing(false);
      setOriginalStream(null);
      
      // Notify other participants
      socket.emit('screen share stopped', {
        roomID: sessionId
      });
      
      toast.info('Screen sharing stopped');
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      toast.error('Failed to stop screen sharing');
    }
  };
  
  // Toggle screen sharing
  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Open whiteboard
  const openWhiteboard = () => {
    window.open(`/${sessionId}/whiteboard`, '_blank');
  };

  if (roomFull) {
    return (
      <div className="video-room">
        <div className="room-full-container">
          <div className="room-full-content">
            <div className="room-full-icon">🚫</div>
            <h2>Session is Full</h2>
            <p>This video session has reached its maximum capacity of 10 participants.</p>
            <p>Redirecting you back to sessions...</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-room">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Enhanced Header */}
      <div className="video-header">
        <div className="room-info">
          <h2>Video Session</h2>
          <div className="status-info">
            <div className="connection-status status-connected">
              ● Connected
            </div>
            <div className="participants-count">
              {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="header-controls">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`header-btn ${showParticipants ? 'active' : ''}`}
            title="Participants"
          >
            👥 {participants.length + 1}
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`header-btn ${showChat ? 'active' : ''}`}
            title="Chat"
          >
            💬 {messages.length > 0 && <span className="notification-dot">{messages.length}</span>}
          </button>
        </div>
      </div>
      
      {/* Main Video Layout */}
      <div className={`video-layout ${showChat ? 'with-chat' : 'full-video'}`}>
        <div className="video-container">
          {/* Local video - always first */}
          <div className="video-wrapper local-video-wrapper">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="video-stream"
              style={{ display: videoMuted ? 'none' : 'block' }}
            />
            {videoMuted && (
              <div className="video-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">📹</div>
                  <div className="placeholder-text">Camera Off</div>
                </div>
              </div>
            )}
            <div className="video-label">
              <div className="label-content">
                <span className="participant-name">
                  You ({user?.name})
                  {isScreenSharing && <span className="presenting-label"> - Presenting</span>}
                </span>
                {isScreenSharing && (
                  <span className="presenting-indicator">📺</span>
                )}
              </div>
              <div className="audio-indicator">
                {audioMuted ? '🔇' : '🎤'}
              </div>
            </div>
          </div>
          
          {/* Remote videos */}
          {Object.entries(peers).map(([peerID, peer]) => {
            // Find participant info for this peer
            const participant = participants.find(p => p.socketId === peerID);
            return (
              <RemoteVideo 
                key={peerID} 
                peer={peer} 
                peerID={peerID}
                participant={participant}
                isPresenting={presenter?.socketId === peerID}
              />
            );
          })}
          
          {/* Empty slots for visual consistency */}
          {participants.length + 1 < 4 && (
            <div className="video-wrapper remote-video-placeholder">
              <div className="video-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">👥</div>
                  <div className="placeholder-text">Waiting for participants...</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Chat Panel */}
        {showChat && (
          <div className="video-chat">
            <div className="chat-header">
              <h3>Session Chat</h3>
              <div className="chat-status">
                {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="chat-close-btn"
                title="Close Chat"
              >
                ✕
              </button>
            </div>
            
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <div className="no-messages-icon">💬</div>
                  <div className="no-messages-text">No messages yet</div>
                  <small>Start the conversation!</small>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwnMessage = msg.senderUid === user._id || msg.senderEmail === user.email;
                  return (
                    <div 
                      key={index} 
                      className={`chat-message ${
                        isOwnMessage ? 'message-sent' : 'message-received'
                      }`}
                    >
                      <div className="message-header">
                        <span className="sender-name">
                          {isOwnMessage ? 'You' : (msg.senderName || msg.senderEmail)}
                        </span>
                        <span className="message-time">
                          {new Date(msg.sentAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="message-content">{msg.message}</div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="chat-input">
              <ChatInput onSendMessage={sendMessage} />
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Control Bar */}
      <div className="video-controls">
        <div className="controls-group">
          <button
            onClick={toggleAudio}
            className={`control-btn audio-btn ${
              audioMuted ? 'btn-danger' : 'btn-primary'
            }`}
            title={audioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            <span className="control-icon">{audioMuted ? '🔇' : '🎤'}</span>
            <span className="control-text">Microphone</span>
          </button>
          
          <button
            onClick={toggleVideo}
            className={`control-btn video-btn ${
              videoMuted ? 'btn-danger' : 'btn-primary'
            }`}
            title={videoMuted ? 'Turn on Camera' : 'Turn off Camera'}
          >
            <span className="control-icon">{videoMuted ? '📹' : '📷'}</span>
            <span className="control-text">Camera</span>
          </button>
        </div>
        
        <div className="controls-group">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`control-btn chat-btn ${
              showChat ? 'btn-active' : 'btn-secondary'
            }`}
            title="Toggle Chat"
          >
            <span className="control-icon">💬</span>
            <span className="control-text">Chat</span>
            {messages.length > 0 && (
              <span className="control-badge">{messages.length}</span>
            )}
          </button>
          
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`control-btn participants-btn ${
              showParticipants ? 'btn-active' : 'btn-secondary'
            }`}
            title="Participants"
          >
            <span className="control-icon">👥</span>
            <span className="control-text">Participants</span>
            <span className="control-badge">{participants.length + 1}</span>
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`control-btn present-btn ${
              isScreenSharing ? 'btn-danger' : (canStartScreenShare() ? 'btn-secondary' : 'btn-disabled')
            }`}
            title={
              isScreenSharing 
                ? 'Stop Presenting' 
                : canStartScreenShare() 
                  ? 'Share Your Screen' 
                  : 'Only mentors and admins can present'
            }
            disabled={!canStartScreenShare() && !isScreenSharing}
          >
            <span className="control-icon">
              {isScreenSharing ? '🛑' : '📺'}
            </span>
            <span className="control-text">
              {isScreenSharing ? 'Stop' : 'Present'}
            </span>
            {presenter && presenter.socketId === socket.id && (
              <span className="presenting-badge">●</span>
            )}
          </button>
          
          <button
            onClick={openWhiteboard}
            className="control-btn whiteboard-btn btn-secondary"
            title="Open Whiteboard"
          >
            <span className="control-icon">✏️</span>
            <span className="control-text">Whiteboard</span>
          </button>
          
          <button
            onClick={() => setShowShare(true)}
            className="control-btn share-btn btn-secondary"
            title="Share Session Link"
          >
            <span className="control-icon">🔗</span>
            <span className="control-text">Share</span>
          </button>
        </div>
        
        <div className="controls-group">
          <button
            onClick={leaveRoom}
            className="control-btn leave-btn btn-danger"
            title="Leave Session"
          >
            <span className="control-icon">📞</span>
            <span className="control-text">Leave</span>
          </button>
        </div>
      </div>
      
      {/* Side panels */}
      {showParticipants && (
        <ParticipantsPanel
          participants={participants}
          onClose={() => setShowParticipants(false)}
        />
      )}
      
      {showShare && (
        <ShareDialog
          roomID={sessionId}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

// Remote video component
function RemoteVideo({ peer, peerID, participant, isPresenting }) {
  const ref = useRef();
  const [hasStream, setHasStream] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  
  useEffect(() => {
    if (!peer || peer.destroyed) return;
    
    const handleStream = (stream) => {
      console.log(`Received stream from peer ${peerID}`);
      if (ref.current && !ref.current.srcObject) {
        ref.current.srcObject = stream;
        setHasStream(true);
        setIsConnecting(false);
      }
    };
    
    const handleConnect = () => {
      console.log(`Peer connected: ${peerID}`);
      setIsConnecting(false);
    };
    
    const handleError = (error) => {
      console.error(`Remote video error for peer ${peerID}:`, error);
      setIsConnecting(false);
    };
    
    peer.on('stream', handleStream);
    peer.on('connect', handleConnect);
    peer.on('error', handleError);
    
    return () => {
      if (ref.current && ref.current.srcObject) {
        const tracks = ref.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        ref.current.srcObject = null;
      }
      setHasStream(false);
    };
  }, [peer, peerID]);
  
  const participantName = participant?.name || participant?.email || `Participant-${peerID?.slice(-4)}`;
  const participantRole = participant?.role || 'User';
  
  return (
    <div className={`video-wrapper remote-video-wrapper ${
      isPresenting ? 'presenting-video' : ''
    }`}>
      <video
        ref={ref}
        autoPlay
        playsInline
        className="video-stream"
        style={{ display: hasStream ? 'block' : 'none' }}
      />
      {!hasStream && (
        <div className="video-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">
              {isConnecting ? '⏳' : '👤'}
            </div>
            <div className="placeholder-text">
              {isConnecting ? 'Connecting...' : 'No Video'}
            </div>
          </div>
        </div>
      )}
      {isPresenting && (
        <div className="presenting-overlay">
          <div className="presenting-badge">
            <span className="presenting-icon">📺</span>
            <span className="presenting-text">PRESENTING</span>
          </div>
        </div>
      )}
      <div className="video-label">
        <div className="label-content">
          <span className="participant-name">
            {participantName}
            {isPresenting && <span className="presenting-label"> - Presenting</span>}
          </span>
          {isPresenting && (
            <span className="presenting-indicator">📺</span>
          )}
        </div>
        <div className="participant-role">
          <span className={`role-badge role-${participantRole.toLowerCase()}`}>
            {participantRole}
          </span>
        </div>
      </div>
    </div>
  );
}

// Chat input component
function ChatInput({ onSendMessage }) {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <div className="input-wrapper">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        className="chat-text-input"
        maxLength={500}
      />
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={!message.trim()}
        className={`send-btn ${
          message.trim() ? 'btn-primary' : 'btn-secondary'
        }`}
        title="Send message"
      >
        ➤
      </button>
    </div>
  );
}

export default VideoRoom;
