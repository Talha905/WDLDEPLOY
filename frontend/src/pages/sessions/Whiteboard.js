import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/Whiteboard.css';

function Whiteboard() {
  const { sessionId } = useParams();
  const canvasRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set initial canvas properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Join whiteboard room
    if (socket) {
      socket.emit('join-whiteboard', { sessionId, user: user.name });
      
      // Listen for drawing events
      socket.on('drawing', handleRemoteDrawing);
      socket.on('whiteboard-participants', setParticipants);
      socket.on('clear-whiteboard', handleClearCanvas);
    }

    return () => {
      if (socket) {
        socket.off('drawing', handleRemoteDrawing);
        socket.off('whiteboard-participants', setParticipants);
        socket.off('clear-whiteboard', handleClearCanvas);
        socket.emit('leave-whiteboard', { sessionId });
      }
    };
  }, [socket, sessionId, user]);

  const handleRemoteDrawing = (data) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (data.tool === 'clear') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    
    ctx.beginPath();
    ctx.moveTo(data.prevX, data.prevY);
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    
    // Get previous position
    const prevX = e.clientX - rect.left - e.movementX;
    const prevY = e.clientY - rect.top - e.movementY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Emit drawing data to other users
    if (socket) {
      socket.emit('drawing', {
        sessionId,
        x,
        y,
        prevX,
        prevY,
        tool,
        color,
        size,
        user: user.name
      });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (socket) {
      socket.emit('clear-whiteboard', { sessionId });
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `whiteboard-${sessionId}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="whiteboard-container">
      <div className="whiteboard-header">
        <h2>Whiteboard - Session {sessionId}</h2>
        <div className="participants-indicator">
          <span>👥 {participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="whiteboard-toolbar">
        <div className="tool-group">
          <button 
            className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >
            ✏️
          </button>
          <button 
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            🧹
          </button>
        </div>

        <div className="tool-group">
          <label htmlFor="color-picker">Color:</label>
          <input
            id="color-picker"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={tool === 'eraser'}
          />
        </div>

        <div className="tool-group">
          <label htmlFor="size-slider">Size:</label>
          <input
            id="size-slider"
            type="range"
            min="1"
            max="20"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
          <span className="size-indicator">{size}px</span>
        </div>

        <div className="tool-group">
          <button onClick={clearCanvas} className="clear-btn" title="Clear Canvas">
            🗑️ Clear
          </button>
          <button onClick={downloadCanvas} className="download-btn" title="Download">
            💾 Download
          </button>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="whiteboard-canvas"
        />
      </div>

      <div className="whiteboard-footer">
        <small>
          💡 Tip: Use your mouse to draw. Changes are shared in real-time with other participants.
        </small>
      </div>
    </div>
  );
}

export default Whiteboard;