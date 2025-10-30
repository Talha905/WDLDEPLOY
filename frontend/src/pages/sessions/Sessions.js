import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/pages/Sessions.css';

function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      // Build query parameters based on filter
      if (filter === 'upcoming') {
        params.set('upcoming', 'true');
      } else if (filter === 'past') {
        params.set('past', 'true');
      } else if (filter !== 'all') {
        // For specific status filters
        params.set('status', filter);
      }

      const response = await api.get(`/sessions?${params.toString()}`);
      setSessions(response.data.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setError('Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'badge badge-success';
      case 'InProgress': return 'badge badge-primary';
      case 'Cancelled': return 'badge badge-error';
      case 'Scheduled': return 'badge badge-warning';
      default: return 'badge badge-secondary';
    }
  };

  const formatStatus = (status) => {
    // Convert camelCase to space-separated words
    return status.replace(/([A-Z])/g, ' $1').trim();
  };

  const getActualStatus = (session) => {
    // If backend status is already Completed or Cancelled, use that
    if (session.status === 'Completed' || session.status === 'Cancelled') {
      return session.status;
    }

    // Check if scheduled session is in the past
    const sessionEndTime = new Date(session.scheduledAt).getTime() + (session.duration * 60 * 1000);
    const now = new Date().getTime();

    if (now > sessionEndTime && session.status === 'Scheduled') {
      return 'Completed'; // Past scheduled sessions should show as completed
    }

    // Check if session is currently in progress
    const sessionStartTime = new Date(session.scheduledAt).getTime();
    if (now >= sessionStartTime && now <= sessionEndTime && session.status === 'Scheduled') {
      return 'InProgress';
    }

    return session.status;
  };

  if (loading) {
    return <LoadingSpinner text="Loading sessions..." />;
  }

  if (error) {
    return (
      <div className="sessions-container fade-in">
        <div className="error-state">
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={fetchSessions} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-container fade-in">
      <div className="sessions-header decorative-dots">
        <div className="header-content">
          <h1>My Sessions</h1>
          <p className="header-subtitle text-compact">{sessions.length} total session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="sessions-filters flex-dense-sm">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`filter-btn ${filter === 'Scheduled' ? 'active' : ''}`}
            onClick={() => setFilter('Scheduled')}
          >
            Scheduled
          </button>
          <button 
            className={`filter-btn ${filter === 'Completed' ? 'active' : ''}`}
            onClick={() => setFilter('Completed')}
          >
            Completed
          </button>
          <button 
            className={`filter-btn ${filter === 'Cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('Cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {sessions.length > 0 ? (
        <div className="sessions-layout">
          <div className="sessions-main">
            <div className="sessions-grid grid-dense-sm">
              {sessions.map(session => {
                const actualStatus = getActualStatus(session);
                return (
                  <div key={session._id} className="session-card decorative-line">
                    <div className="session-card-header">
                      <h3 className="text-dense">{session.title}</h3>
                      <span className={getStatusBadgeClass(actualStatus)}>
                        {formatStatus(actualStatus)}
                      </span>
                    </div>
                    
                    <div className="session-card-body p-compact">
                      <div className="session-meta grid-dense-xs">
                        <div className="meta-item">
                          <span className="meta-icon">📅</span>
                          <span className="meta-text text-compact">{formatDate(session.scheduledAt)}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">⏱️</span>
                          <span className="meta-text text-compact">{session.duration} min</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">{user?.role === 'Mentor' ? '👤' : '🎓'}</span>
                          <span className="meta-text text-compact">
                            {user?.role === 'Mentor' 
                              ? session.mentee?.name || 'Unknown Mentee'
                              : session.mentor?.name || 'Unknown Mentor'}
                          </span>
                        </div>
                      </div>
                      {session.description && (
                        <p className="session-description text-compact mt-compact">{session.description}</p>
                      )}
                    </div>

                    <div className="session-card-actions flex-dense-sm px-compact pb-compact">
                      <Link to={`/sessions/${session._id}`} className="btn btn-primary btn-sm">
                        Details
                      </Link>
                      {actualStatus === 'Scheduled' && (
                        <span className="chip">Ready to join</span>
                      )}
                      {actualStatus === 'InProgress' && (
                        <span className="chip chip-primary">Join Now</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="sessions-sidebar">
            <div className="sidebar-section">
              <h4>Quick Stats</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">
                    {sessions.filter(s => {
                      const status = getActualStatus(s);
                      return status === 'Scheduled' || status === 'InProgress';
                    }).length}
                  </div>
                  <div className="stat-label">Upcoming</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {sessions.filter(s => getActualStatus(s) === 'Completed').length}
                  </div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
            </div>
            
            {user?.role === 'Mentee' && (
              <div className="sidebar-section">
                <h4>Session Tips</h4>
                <div className="tips-list">
                  <div className="tip-item">
                    <span className="tip-icon">💡</span>
                    <span className="tip-text">Prepare questions beforehand</span>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">📝</span>
                    <span className="tip-text">Take notes during sessions</span>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">🎯</span>
                    <span className="tip-text">Set clear session goals</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No sessions found</h3>
          <p>
            {filter !== 'all' 
              ? `No ${filter.toLowerCase()} sessions found.`
              : user?.role === 'Mentee' 
                ? "You haven't booked any sessions yet." 
                : "You don't have any sessions scheduled."}
          </p>
          {user?.role === 'Mentee' && filter === 'all' && (
            <Link to="/search" className="btn btn-primary">
              Find a Mentor
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default Sessions;