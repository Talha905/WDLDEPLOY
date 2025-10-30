import React from 'react';
import Avatar from 'react-avatar';
import './ParticipantsPanel.css';

function ParticipantsPanel({ participants, onClose }) {
  return (
    <div className="participants-panel">
      <div className="panel-header">
        <h3>👥 Participants ({participants.length})</h3>
        <button onClick={onClose} className="close-btn" title="Close">
          ✖
        </button>
      </div>
      
      <div className="participants-list">
        {participants.length === 0 ? (
          <div className="no-participants">
            No participants yet
          </div>
        ) : (
          participants.map((participant, index) => (
            <div key={participant.socketId || index} className="participant-item">
              <Avatar
                name={participant.name || participant.email}
                size="40"
                round={true}
                color={participant.role === 'Mentor' ? '#48BB78' : participant.role === 'Admin' ? '#E53E3E' : '#4A90E2'}
                fgColor="#FFF"
              />
              <div className="participant-info">
                <div className="participant-name">
                  {participant.name || participant.email}
                </div>
                <div className="participant-meta">
                  <span className={`role-badge role-${(participant.role || 'user').toLowerCase()}`}>
                    {participant.role || 'User'}
                  </span>
                  <span className="participant-joined">
                    {new Date(participant.joinedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              {participant.isActive && (
                <span className="active-indicator" title="Active">🟢</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ParticipantsPanel;