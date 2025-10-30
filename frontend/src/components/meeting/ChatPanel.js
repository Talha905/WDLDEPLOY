import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import './ChatPanel.css';

function ChatPanel({ messages, onSendMessage, onClose, roomID }) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Meeting Chats', 20, 20);
      doc.setFontSize(10);
      doc.text(`Room: ${roomID}`, 20, 30);
      doc.text(`Date: ${new Date().toLocaleString()}`, 20, 35);
      
      let y = 45;
      messages.forEach((msg, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        const text = `${msg.senderName || msg.senderEmail}: ${msg.message}`;
        const lines = doc.splitTextToSize(text, 170);
        
        doc.setFontSize(8);
        doc.text(`[${new Date(msg.sentAt).toLocaleTimeString()}]`, 20, y);
        doc.setFontSize(10);
        
        lines.forEach(line => {
          y += 5;
          doc.text(line, 30, y);
        });
        
        y += 7;
      });
      
      doc.save('meeting_chat.pdf');
      toast.success('Chat exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting chat:', error);
      toast.error('Failed to export chat');
    }
  };
  
  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>💬 Chat</h3>
        <div className="chat-actions">
          <button onClick={exportToPDF} className="export-btn" title="Export to PDF">
            📄
          </button>
          <button onClick={onClose} className="close-btn" title="Close">
            ✖
          </button>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <div className="message-header">
                <span className="sender-name">{msg.senderName || msg.senderEmail}</span>
                <span className="message-time">
                  {new Date(msg.sentAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button
          onClick={handleSend}
          className="send-btn"
          disabled={!inputMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;