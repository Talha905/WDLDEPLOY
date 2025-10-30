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
import '../../styles/components/Room.css';

function Room() {
  const { roomID } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  // Media refs and state
  const localVideoRef = useRef();
  const peersRef = useRef([]);
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  
  // UI state
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [roomFull, setRoomFull] = useState(false);
  
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
          roomID,
          userEmail: user.email,
          userUid: user._id,
          userName: user.name
        });
        
        // Get initial data
        socket.emit('get chat history', roomID);
        socket.emit('get participants', roomID);
        
        toast.success('Joined meeting successfully!');
      } catch (error) {
        console.error('Failed to initialize room:', error);
        toast.error('Failed to access camera/microphone');
      }
    };
    
    initRoom();
    
    // Cleanup on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      peersRef.current.forEach(peer => {
        peer.peer.destroy();
      });
      if (socket) {
        socket.emit('leave room', { roomID });
      }
    };
  }, [socket, isConnected, user, roomID]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !localStream) return;
    
    // Room full handler
    socket.on('room full', () => {
      setRoomFull(true);
      toast.error('Room is full (max 10 participants)');
      setTimeout(() => navigate('/sessions'), 3000);
    });
    
    // Handle all existing users
    socket.on('all users', (users) => {
      console.log('Existing users in room:', users);
      const peers = [];
      
      users.forEach(userID => {
        const peer = createPeer(userID, socket.id, localStream);
        peersRef.current.push({
          peerID: userID,
          peer
        });
        peers.push({
          peerID: userID,
          peer
        });
      });
      
      setPeers(peers);
    });
    
    // Handle new user joined
    socket.on('user joined', (payload) => {
      console.log('User joined:', payload.callerID);
      const peer = addPeer(payload.signal, payload.callerID, localStream);
      
      peersRef.current.push({
        peerID: payload.callerID,
        peer
      });
      
      setPeers(prev => [...prev, {
        peerID: payload.callerID,
        peer
      }]);
    });
    
    // Handle receiving returned signal
    socket.on('receiving returned signal', (payload) => {
      console.log('Receiving returned signal from:', payload.id);
      const item = peersRef.current.find(p => p.peerID === payload.id);
      if (item) {
        item.peer.signal(payload.signal);
      }
    });
    
    // Handle user left
    socket.on('user left', (id) => {
      console.log('User left:', id);
      const peerObj = peersRef.current.find(p => p.peerID === id);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      const peers = peersRef.current.filter(p => p.peerID !== id);
      peersRef.current = peers;
      setPeers(peers);
      toast.info('A participant left the meeting');
    });
    
    // Chat and participants updates
    socket.on('chat history', (history) => {
      setMessages(history);
    });
    
    socket.on('new message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    socket.on('participants update', (participants) => {
      setParticipants(participants);
    });
    
    return () => {
      socket.off('room full');
      socket.off('all users');
      socket.off('user joined');
      socket.off('receiving returned signal');
      socket.off('user left');
      socket.off('chat history');
      socket.off('new message');
      socket.off('participants update');
    };
  }, [socket, localStream, navigate]);

  // Create peer for existing user (initiator)
  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });
    
    peer.on('signal', signal => {
      socket.emit('sending signal', {
        userToSignal,
        callerID,
        signal
      });
    });
    
    return peer;
  }

  // Add peer for new user (non-initiator)
  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });
    
    peer.on('signal', signal => {
      socket.emit('returning signal', {
        signal,
        callerID
      });
    });
    
    peer.signal(incomingSignal);
    
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
      meetingCode: roomID,
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
    peersRef.current.forEach(peer => {
      peer.peer.destroy();
    });
    socket.emit('leave room', { roomID });
    navigate('/sessions');
  };

  // Open whiteboard
  const openWhiteboard = () => {
    window.open(`/${roomID}/whiteboard`, '_blank');
  };

  if (roomFull) {
    return (
      <div className="room-full-container">
        <h2>Room is Full</h2>
        <p>This meeting room has reached its maximum capacity of 10 participants.</p>
        <p>Redirecting you back...</p>
      </div>
    );
  }

  return (
    <div className="room-container">
      <ToastContainer position="top-right" />
      
      <div className="room-header">
        <h2>Meeting Room: {roomID}</h2>
        <span className="participant-count">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="video-grid-container">
        <div className="video-grid">
          {/* Local video */}
          <div className="video-wrapper">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="video-element local-video"
            />
            <div className="video-label">
              You {audioMuted && '🔇'} {videoMuted && '📹'}
            </div>
          </div>
          
          {/* Remote videos */}
          {peers.map((peer, index) => (
            <RemoteVideo key={peer.peerID} peer={peer.peer} />
          ))}
        </div>
      </div>
      
      {/* Control bar */}
      <div className="control-bar">
        <button
          onClick={toggleAudio}
          className={`control-btn ${audioMuted ? 'muted' : ''}`}
          title={audioMuted ? 'Unmute' : 'Mute'}
        >
          {audioMuted ? '🔇' : '🎤'}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`control-btn ${videoMuted ? 'disabled' : ''}`}
          title={videoMuted ? 'Enable Camera' : 'Disable Camera'}
        >
          {videoMuted ? '📹' : '📷'}
        </button>
        
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="control-btn"
          title="Participants"
        >
          👥 {participants.length}
        </button>
        
        <button
          onClick={() => setShowChat(!showChat)}
          className="control-btn"
          title="Chat"
        >
          💬 {messages.length > 0 && <span className="badge">{messages.length}</span>}
        </button>
        
        <button
          onClick={openWhiteboard}
          className="control-btn"
          title="Whiteboard"
        >
          ✏️
        </button>
        
        <button
          onClick={() => setShowShare(true)}
          className="control-btn"
          title="Share Meeting"
        >
          🔗
        </button>
        
        <button
          onClick={leaveRoom}
          className="control-btn end-call"
          title="Leave Meeting"
        >
          📞
        </button>
      </div>
      
      {/* Side panels */}
      {showChat && (
        <ChatPanel
          messages={messages}
          onSendMessage={sendMessage}
          onClose={() => setShowChat(false)}
          roomID={roomID}
        />
      )}
      
      {showParticipants && (
        <ParticipantsPanel
          participants={participants}
          onClose={() => setShowParticipants(false)}
        />
      )}
      
      {showShare && (
        <ShareDialog
          roomID={roomID}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

// Remote video component
function RemoteVideo({ peer }) {
  const ref = useRef();
  
  useEffect(() => {
    peer.on('stream', stream => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
    
    return () => {
      if (ref.current && ref.current.srcObject) {
        ref.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [peer]);
  
  return (
    <div className="video-wrapper">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="video-element remote-video"
      />
      <div className="video-label">Participant</div>
    </div>
  );
}

export default Room;