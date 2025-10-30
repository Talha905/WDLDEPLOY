import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { toast } from 'react-toastify';
import './ShareDialog.css';

function ShareDialog({ roomID, onClose }) {
  const meetingURL = window.location.href;
  
  const handleCopyURL = () => {
    toast.success('Meeting URL copied to clipboard!');
  };
  
  const handleCopyCode = () => {
    toast.success('Meeting code copied to clipboard!');
  };
  
  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>🔗 Share Meeting</h3>
          <button onClick={onClose} className="close-btn" title="Close">
            ✖
          </button>
        </div>
        
        <div className="dialog-content">
          <div className="share-item">
            <label>Meeting URL:</label>
            <div className="copy-container">
              <input
                type="text"
                value={meetingURL}
                readOnly
                className="share-input"
              />
              <CopyToClipboard text={meetingURL} onCopy={handleCopyURL}>
                <button className="copy-btn">Copy</button>
              </CopyToClipboard>
            </div>
          </div>
          
          <div className="share-item">
            <label>Meeting Code:</label>
            <div className="copy-container">
              <input
                type="text"
                value={roomID}
                readOnly
                className="share-input"
              />
              <CopyToClipboard text={roomID} onCopy={handleCopyCode}>
                <button className="copy-btn">Copy</button>
              </CopyToClipboard>
            </div>
          </div>
          
          <div className="share-instructions">
            <p>Share the meeting URL or code with participants to join this meeting.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareDialog;