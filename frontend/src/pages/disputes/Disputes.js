import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/pages/Disputes.css';

function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const fetchDisputes = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);

      const response = await api.get(`/disputes?${params.toString()}`);
      setDisputes(response.data.data.disputes || []);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#28a745';
      case 'InReview': return '#007bff';
      case 'Closed': return '#6c757d';
      default: return '#ffc107';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading disputes..." />;
  }

  return (
    <div className="disputes-container fade-in">
      <div className="disputes-header">
        <h1>Disputes</h1>
        <div className="disputes-actions">
          <div className="disputes-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'Open' ? 'active' : ''}`}
              onClick={() => setFilter('Open')}
            >
              Open
            </button>
            <button 
              className={`filter-btn ${filter === 'Resolved' ? 'active' : ''}`}
              onClick={() => setFilter('Resolved')}
            >
              Resolved
            </button>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Dispute'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <CreateDisputeForm 
          onSubmit={() => {
            setShowCreateForm(false);
            fetchDisputes();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {disputes.length > 0 ? (
        <div className="disputes-list">
          {disputes.map(dispute => (
            <div key={dispute._id} className="dispute-card">
              <div className="dispute-card-header">
                <h3>{dispute.title}</h3>
                <div className="dispute-meta">
                  <span 
                    className="dispute-status"
                    style={{ color: getStatusColor(dispute.status) }}
                  >
                    {dispute.status}
                  </span>
                  <span className="dispute-type">{dispute.type}</span>
                </div>
              </div>

              <div className="dispute-card-body">
                <p className="dispute-description">
                  {dispute.description.length > 200 
                    ? dispute.description.substring(0, 200) + '...'
                    : dispute.description}
                </p>

                <div className="dispute-participants">
                  <p><strong>Reported by:</strong> {dispute.reportedBy?.name}</p>
                  <p><strong>Against:</strong> {dispute.reportedAgainst?.name}</p>
                  <p><strong>Created:</strong> {formatDate(dispute.createdAt)}</p>
                </div>

                {dispute.resolution && (
                  <div className="dispute-resolution">
                    <h4>Resolution:</h4>
                    <p>{dispute.resolution}</p>
                    {dispute.resolvedBy && (
                      <p className="resolution-meta">
                        Resolved by {dispute.resolvedBy.name} on {formatDate(dispute.resolvedAt)}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="dispute-actions">
                  <button className="btn btn-outline" onClick={() => setSelectedDispute(dispute)}>View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No disputes found</h3>
          <p>No disputes have been created yet.</p>
        </div>
      )}
      
      {selectedDispute && (
        <DisputeDetail 
          dispute={selectedDispute} 
          onClose={() => setSelectedDispute(null)}
        />
      )}
    </div>
  );
}

function CreateDisputeForm({ onSubmit, onCancel }) {
  const [sessions, setSessions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Other',
    reportedAgainstEmail: '',
    session: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/sessions');
        setSessions(res.data.data.sessions || []);
      } catch (e) {
        console.error('Failed to load sessions for disputes', e);
      }
    };
    fetchSessions();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...formData };
      if (!payload.session) delete payload.session;
      await api.post('/disputes', payload);
      onSubmit();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card create-dispute-form">
      <div className="card-header">
        <h3>Create New Dispute</h3>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-input" required />
        </div>

        <div className="form-group">
          <label className="form-label">Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="form-select">
            <option value="Session">Session Related</option>
            <option value="Goal">Goal Related</option>
            <option value="Conduct">Conduct Issue</option>
            <option value="Payment">Payment Issue</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Against (Email) *</label>
          <input type="email" name="reportedAgainstEmail" value={formData.reportedAgainstEmail} onChange={handleChange} className="form-input" placeholder="user@example.com" required />
        </div>

        <div className="form-group">
          <label className="form-label">Related Session (optional)</label>
          <select name="session" value={formData.session} onChange={handleChange} className="form-select">
            <option value="">-- Select a session --</option>
            {sessions.map(s => (
              <option key={s._id} value={s._id}>{s.title} ({new Date(s.scheduledAt).toLocaleDateString()})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" rows="4" placeholder="Please describe the issue in detail..." required />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Dispute'}</button>
        </div>
      </form>
    </div>
  );
}

function DisputeDetail({ dispute, onClose }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const updateStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/disputes/${dispute._id}`, { status: newStatus });
      dispute.status = newStatus;
      onClose(); // Close and refresh parent
    } catch (e) {
      console.error('Failed to update dispute status', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="dispute-detail-overlay">
      <div className="dispute-detail">
        <div className="dispute-header">
          <h2>{dispute.title}</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="dispute-info">
          <div className="dispute-meta">
            <span className={`status-badge status-${dispute.status.toLowerCase()}`}>
              {dispute.status}
            </span>
            <span className="dispute-type">{dispute.type}</span>
            <span className="dispute-date">Created: {new Date(dispute.createdAt).toLocaleDateString()}</span>
          </div>
          
          <div className="dispute-description">
            <h4>Description</h4>
            <p>{dispute.description}</p>
          </div>
          
          <div className="dispute-participants">
            <h4>Participants</h4>
            <p><strong>Reporter:</strong> {dispute.reportedBy?.name || 'Unknown'} ({dispute.reportedBy?.email})</p>
            <p><strong>Reported Against:</strong> {dispute.reportedAgainst?.name || 'Unknown'} ({dispute.reportedAgainst?.email})</p>
          </div>

          {dispute.session && (
            <div className="dispute-session">
              <h4>Related Session</h4>
              <p>{dispute.session.title} - {new Date(dispute.session.scheduledAt).toLocaleDateString()}</p>
            </div>
          )}

          {dispute.goal && (
            <div className="dispute-goal">
              <h4>Related Goal</h4>
              <p>{dispute.goal.title}</p>
            </div>
          )}

          {dispute.resolution && (
            <div className="dispute-resolution">
              <h4>Admin Resolution</h4>
              <p>{dispute.resolution}</p>
              <p><em>Resolved on: {new Date(dispute.resolvedAt).toLocaleDateString()}</em></p>
            </div>
          )}

          {isAdmin && dispute.status === 'Open' && (
            <div className="admin-actions">
              <h4>Admin Actions</h4>
              <div className="action-buttons">
                <button 
                  className="btn btn-success" 
                  onClick={() => updateStatus('Resolved')}
                  disabled={updatingStatus}
                >
                  Mark Resolved
                </button>
                <button 
                  className="btn btn-warning" 
                  onClick={() => updateStatus('Under Review')}
                  disabled={updatingStatus}
                >
                  Under Review
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => updateStatus('Rejected')}
                  disabled={updatingStatus}
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Disputes;
