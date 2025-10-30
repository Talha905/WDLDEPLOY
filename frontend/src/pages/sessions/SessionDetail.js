import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/pages/SessionDetail.css';

function SessionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState('');
  const [accessInfo, setAccessInfo] = useState(null);
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const [sessionRes, accessRes] = await Promise.all([
          api.get(`/sessions/${id}`),
          api.get(`/sessions/${id}/access`)
        ]);
        
        setSession(sessionRes.data.data.session);
        setAccessInfo(accessRes.data.data);
        setNotes(sessionRes.data.data.session.notes || '');
        setRating(sessionRes.data.data.session.rating || '');
        
        // Fetch messages for this session
        try {
          const msgRes = await api.get(`/sessions/${id}/messages`);
          setMessages(msgRes.data.data.messages || []);
        } catch (e) {
          console.error('Failed to load messages', e);
        }
      } catch (error) {
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  // Update time display every minute
  useEffect(() => {
    if (!session || !accessInfo) return;

    const updateTimeDisplay = () => {
      const now = new Date();
      const scheduledTime = new Date(session.scheduledAt);
      const accessTime = new Date(accessInfo.accessTime);
      const endTime = new Date(accessInfo.endTime);
      
      if (now < accessTime) {
        const minutesUntil = Math.ceil((accessTime - now) / (60 * 1000));
        setTimeDisplay(`Available in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`);
      } else if (now > endTime) {
        setTimeDisplay('Session has ended');
      } else {
        const minutesRemaining = Math.ceil((endTime - now) / (60 * 1000));
        setTimeDisplay(`${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining`);
      }
    };

    updateTimeDisplay();
    const interval = setInterval(updateTimeDisplay, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session, accessInfo]);

  const handleUpdateNotes = async () => {
    try {
      await api.put(`/sessions/${id}`, { notes: newNote });
      setNotes(newNote);
      setNewNote('');
    } catch (e) {
      setError('Failed to update notes');
    }
  };

  const handleRateSession = async (r) => {
    try {
      await api.put(`/sessions/${id}`, { rating: r });
      setRating(r);
    } catch (e) {
      setError('Failed to rate session');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page session-detail-page">
      <div className="page-header">
        <h1>Session Details</h1>
        <Link to="/sessions" className="btn btn-secondary">Back to Sessions</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {session && (
        <div className="session-detail">
          <div className="session-info card">
            <div className="card-header">
              <h2>{session.title}</h2>
              <div className="session-meta">
                <span className={`status-badge status-${session.status.toLowerCase()}`}>{session.status}</span>
                <span className="session-type">{session.type}</span>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <label>Scheduled:</label>
                  <span>{new Date(session.scheduledAt).toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <label>Duration:</label>
                  <span>{session.duration} minutes</span>
                </div>
                <div className="info-item">
                  <label>Participants:</label>
                  <span>{session.mentor?.name}, {session.mentee?.name}</span>
                </div>
                {accessInfo && (
                  <div className="info-item">
                    <label>Access Status:</label>
                    <span className={`access-status ${accessInfo.accessible ? 'accessible' : 'not-accessible'}`}>
                      {timeDisplay || accessInfo.message}
                    </span>
                  </div>
                )}
              </div>
              {session.description && <p className="session-description">{session.description}</p>}
              
              {/* Video Access Section */}
              {accessInfo && (
                <div className="video-access-section">
                  {accessInfo.accessible ? (
                    <div className="access-available">
                      <p className="access-message">✅ Session is now accessible!</p>
                      <Link to={`/video/${id}`} className="btn btn-primary btn-large">
                        Join Video Call
                      </Link>
                    </div>
                  ) : (
                    <div className="access-pending">
                      <p className="access-message">⏰ {accessInfo.message}</p>
                      {accessInfo.timeUntilAccess > 0 && (
                        <p className="access-details">
                          Session will be available at {new Date(accessInfo.accessTime).toLocaleTimeString()}
                          (15 minutes before scheduled time)
                        </p>
                      )}
                      <button className="btn btn-secondary" disabled>
                        Join Video Call
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="session-notes card">
            <div className="card-header">
              <h3>Session Notes</h3>
            </div>
            <div className="card-body">
              {notes && <div className="existing-notes">
                <h4>Current Notes:</h4>
                <p>{notes}</p>
              </div>}
              <div className="add-notes">
                <label className="form-label">Add/Update Notes:</label>
                <textarea 
                  className="form-textarea" 
                  value={newNote} 
                  onChange={(e) => setNewNote(e.target.value)}
                  rows="4"
                  placeholder="Add session notes..."
                />
                <button className="btn btn-primary" onClick={handleUpdateNotes} disabled={!newNote}>Update Notes</button>
              </div>
            </div>
          </div>

          {session.status === 'Completed' && (
            <div className="session-rating card">
              <div className="card-header">
                <h3>Session Rating</h3>
              </div>
              <div className="card-body">
                {rating && <p>Current Rating: <strong>{rating}/5</strong></p>}
                <div className="rating-buttons">
                  {[1,2,3,4,5].map(r => (
                    <button key={r} className={`btn ${rating === r ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleRateSession(r)}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="session-chat card">
            <div className="card-header">
              <h3>Session Messages ({messages.length})</h3>
            </div>
            <div className="card-body">
              {messages.length === 0 ? (
                <p>No messages yet.</p>
              ) : (
                <div className="messages-list">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.senderId === user?._id ? 'message-sent' : 'message-received'}`}>
                      <div className="message-header">
                        <strong>{msg.senderName || 'Unknown'}</strong>
                        <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="message-content">{msg.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionDetail;
