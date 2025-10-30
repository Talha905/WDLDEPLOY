import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import '../styles/pages/Profile.css';

function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || ''
  });

  const [newExpertise, setNewExpertise] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/auth/profile', profileData);
      updateUser(response.data.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
    }

    setLoading(false);
  };

  const handleAddExpertise = async (e) => {
    e.preventDefault();
    if (!newExpertise.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/expertise', { name: newExpertise.trim() });
      updateUser(response.data.data.user);
      setNewExpertise('');
      setMessage({ type: 'success', text: 'Expertise added! Waiting for admin approval.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to add expertise' });
    }

    setLoading(false);
  };

  const handleRequestMentor = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/request-mentor');
      updateUser(response.data.data.user);
      setMessage({ type: 'success', text: 'Mentor request submitted! Waiting for admin approval.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to request mentor role' });
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const getExpertiseStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved': return 'badge badge-success';
      case 'Rejected': return 'badge badge-error';
      default: return 'badge badge-warning';
    }
  };
  
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin': return 'badge badge-error';
      case 'Mentor': return 'badge badge-primary';
      case 'Mentee': return 'badge badge-success';
      default: return 'badge badge-secondary';
    }
  };

  return (
    <div className="profile-container fade-in">
      <div className="profile-header decorative-dots">
        <div className="profile-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" />
          ) : (
            <div className="avatar-placeholder">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="avatar-status">
            <div className="status-indicator online"></div>
          </div>
        </div>
        <div className="profile-info">
          <h1 className="text-dense">{user?.name}</h1>
          <p className="profile-email text-compact">{user?.email}</p>
          <div className="profile-badges flex-dense-xs">
            <span className={getRoleBadgeClass(user?.role)}>
              {user?.role}
            </span>
            {user?.role === 'Mentor' && (
              <span className={`badge ${user?.isMentorApproved ? 'badge-success' : 'badge-warning'}`}>
                {user?.isMentorApproved ? 'Verified' : 'Pending'}
              </span>
            )}
          </div>
          <div className="profile-stats flex-dense mt-compact">
            <div className="stat-compact">
              <span className="stat-icon">📅</span>
              <span className="stat-text">Member since {new Date(user?.createdAt).getFullYear()}</span>
            </div>
            {user?.role === 'Mentor' && user?.rating && (
              <div className="stat-compact">
                <span className="stat-icon">⭐</span>
                <span className="stat-text">{user.rating.toFixed(1)} rating</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'expertise' ? 'active' : ''}`}
          onClick={() => setActiveTab('expertise')}
        >
          Expertise
        </button>
        {user?.role === 'Mentee' && (
          <button 
            className={`tab-button ${activeTab === 'mentor-request' ? 'active' : ''}`}
            onClick={() => setActiveTab('mentor-request')}
          >
            Become a Mentor
          </button>
        )}
      </div>

      <div className="profile-layout">
        <div className="profile-main">
          <div className="profile-content">
            {activeTab === 'profile' && (
              <div className="card decorative-line">
                <div className="card-header">
                  <h3 className="card-title text-dense">Profile Information</h3>
                  <span className="card-icon">👤</span>
                </div>
                
                <form onSubmit={handleProfileUpdate} className="p-compact">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      className="form-textarea"
                      rows="3"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Avatar URL</label>
                    <input
                      type="url"
                      name="avatarUrl"
                      value={profileData.avatarUrl}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'expertise' && (
              <div className="card decorative-line">
                <div className="card-header">
                  <h3 className="card-title text-dense">Areas of Expertise</h3>
                  <span className="card-icon">🏆</span>
                </div>

                <div className="expertise-section p-compact">
                  <form onSubmit={handleAddExpertise} className="add-expertise-form">
                    <div className="form-group">
                      <label className="form-label">Add New Expertise</label>
                      <div className="input-group flex-dense">
                        <input
                          type="text"
                          value={newExpertise}
                          onChange={(e) => setNewExpertise(e.target.value)}
                          className="form-input"
                          placeholder="e.g., React, Node.js, Machine Learning"
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          Add
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="expertise-list flex-dense">
                    {user?.expertise?.length > 0 ? (
                      user.expertise.map((exp, index) => (
                        <div key={index} className="expertise-item chip">
                          <span className="expertise-name">{exp.name}</span>
                          <span className={getExpertiseStatusBadgeClass(exp.status)}>
                            {exp.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state-compact">
                        <span className="empty-icon">🏆</span>
                        <p>No expertise areas added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mentor-request' && user?.role === 'Mentee' && (
              <div className="card decorative-line">
                <div className="card-header">
                  <h3 className="card-title text-dense">Become a Mentor</h3>
                  <span className="card-icon">🎓</span>
                </div>

                <div className="mentor-request-content p-compact">
                  <p className="text-compact">Ready to share your knowledge and help others grow? Join our mentor community!</p>
                  
                  <div className="mentor-benefits">
                    <h4>As a mentor, you'll be able to:</h4>
                    <div className="benefits-grid">
                      <div className="benefit-item">
                        <span className="benefit-icon">🎆</span>
                        <span>Guide and inspire mentees</span>
                      </div>
                      <div className="benefit-item">
                        <span className="benefit-icon">⏰</span>
                        <span>Set your own availability</span>
                      </div>
                      <div className="benefit-item">
                        <span className="benefit-icon">🤝</span>
                        <span>Build meaningful relationships</span>
                      </div>
                      <div className="benefit-item">
                        <span className="benefit-icon">💡</span>
                        <span>Share your expertise</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleRequestMentor} 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Request Mentor Role'}
                  </button>

                  <div className="mentor-note chip">
                    <strong>ℹ️ Note:</strong> Your request will be reviewed by our admin team. 
                    You'll receive an email once your application is approved.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-sidebar">
          <div className="sidebar-section">
            <h4>Account Stats</h4>
            <div className="stats-list">
              <div className="stat-item">
                <span className="stat-icon">📅</span>
                <div className="stat-content">
                  <span className="stat-label">Joined</span>
                  <span className="stat-value">{new Date(user?.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🏆</span>
                <div className="stat-content">
                  <span className="stat-label">Expertise Areas</span>
                  <span className="stat-value">{user?.expertise?.length || 0}</span>
                </div>
              </div>
              {user?.role === 'Mentor' && (
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <div className="stat-content">
                    <span className="stat-label">Rating</span>
                    <span className="stat-value">{user?.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="sidebar-section">
            <h4>Quick Actions</h4>
            <div className="quick-actions">
              {user?.role === 'Mentee' && (
                <>
                  <button className="action-btn" onClick={() => setActiveTab('mentor-request')}>
                    <span className="action-icon">🎓</span>
                    <span>Become Mentor</span>
                  </button>
                  <button className="action-btn" onClick={() => window.location.href = '/search'}>
                    <span className="action-icon">🔍</span>
                    <span>Find Mentors</span>
                  </button>
                </>
              )}
              <button className="action-btn" onClick={() => setActiveTab('expertise')}>
                <span className="action-icon">🏆</span>
                <span>Manage Skills</span>
              </button>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h4>Profile Tips</h4>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-icon">📷</span>
                <span className="tip-text">Add a professional photo to build trust</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">📝</span>
                <span className="tip-text">Write a compelling bio to showcase your experience</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🏆</span>
                <span className="tip-text">Add your expertise areas to attract the right connections</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;