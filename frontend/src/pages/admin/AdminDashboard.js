import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SimpleBarChart from '../../components/common/SimpleBarChart';
import SimpleLineChart from '../../components/common/SimpleLineChart';
import '../../styles/pages/AdminDashboard.css';

function AdminDashboard() {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, analyticsRes] = await Promise.all([
        api.get('/admin/users?limit=10'),
        api.get('/admin/analytics')
      ]);
      setUsers(usersRes.data.data.users || []);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = async (userId, updates) => {
    try {
      await api.put(`/admin/users/${userId}`, updates);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    return location.pathname.startsWith(path) && path !== '/admin';
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  return (
    <div className="admin-container fade-in">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage users, content, and platform analytics</p>
      </div>

      <div className="admin-nav">
        <Link 
          to="/admin" 
          className={`admin-nav-link ${isActive('/admin') ? 'active' : ''}`}
        >
          Overview
        </Link>
        <Link 
          to="/admin/users" 
          className={`admin-nav-link ${isActive('/admin/users') ? 'active' : ''}`}
        >
          Users
        </Link>
        <Link 
          to="/admin/mentor-requests" 
          className={`admin-nav-link ${isActive('/admin/mentor-requests') ? 'active' : ''}`}
        >
          Mentor Requests
        </Link>
        <Link 
          to="/admin/expertise-requests" 
          className={`admin-nav-link ${isActive('/admin/expertise-requests') ? 'active' : ''}`}
        >
          Expertise Requests
        </Link>
        <Link 
          to="/admin/analytics" 
          className={`admin-nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}
        >
          Analytics
        </Link>
      </div>

      <Routes>
        <Route path="/" element={<OverviewTab analytics={analytics} />} />
        <Route path="/users" element={<UsersTab users={users} onUserUpdate={handleUserUpdate} />} />
        <Route path="/mentor-requests" element={<MentorRequestsTab onUserUpdate={handleUserUpdate} />} />
        <Route path="/expertise-requests" element={<ExpertiseRequestsTab />} />
        <Route path="/analytics" element={<AnalyticsTab analytics={analytics} />} />
      </Routes>
    </div>
  );
}

function OverviewTab({ analytics }) {
  if (!analytics) return <LoadingSpinner />;

  return (
    <div className="admin-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-breakdown">
            <div>Admins: {analytics.stats.users?.Admin || 0}</div>
            <div>Mentors: {analytics.stats.users?.Mentor || 0}</div>
            <div>Mentees: {analytics.stats.users?.Mentee || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <h3>Sessions</h3>
          <div className="stat-breakdown">
            <div>Completed: {analytics.stats.sessions?.Completed || 0}</div>
            <div>Scheduled: {analytics.stats.sessions?.Scheduled || 0}</div>
            <div>In Progress: {analytics.stats.sessions?.InProgress || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <h3>Goals</h3>
          <div className="stat-breakdown">
            <div>Active: {analytics.stats.goals?.Active || 0}</div>
            <div>Completed: {analytics.stats.goals?.Completed || 0}</div>
            <div>Paused: {analytics.stats.goals?.Paused || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <h3>Disputes</h3>
          <div className="stat-breakdown">
            <div>Open: {analytics.stats.disputes?.Open || 0}</div>
            <div>Resolved: {analytics.stats.disputes?.Resolved || 0}</div>
            <div>In Review: {analytics.stats.disputes?.InReview || 0}</div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <div className="activity-section">
          <h3>Recent Users</h3>
          {analytics.recent?.users?.map(user => (
            <div key={user._id} className="activity-item">
              <span>{user.name}</span>
              <span className="activity-meta">{user.role} - {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users, onUserUpdate }) {
  const [filter, setFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  return (
    <div className="admin-users">
      <div className="users-header">
        <div className="user-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users
          </button>
          <button 
            className={`filter-btn ${filter === 'Mentor' ? 'active' : ''}`}
            onClick={() => setFilter('Mentor')}
          >
            Mentors
          </button>
          <button 
            className={`filter-btn ${filter === 'Mentee' ? 'active' : ''}`}
            onClick={() => setFilter('Mentee')}
          >
            Mentees
          </button>
        </div>
      </div>

      <div className="users-table">
        {filteredUsers.map(user => (
          <div key={user._id} className="user-row">
            <div className="user-info">
              <div className="user-avatar">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h4>{user.name}</h4>
                <p>{user.email}</p>
                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
                {user.role === 'Mentor' && (
                  <span className={`approval-badge ${user.isMentorApproved ? 'approved' : 'pending'}`}>
                    {user.isMentorApproved ? 'Approved' : 'Pending'}
                  </span>
                )}
              </div>
            </div>

            <div className="user-actions">
              {user.role === 'Mentor' && !user.isMentorApproved && (
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => onUserUpdate(user._id, { isMentorApproved: true })}
                >
                  Approve
                </button>
              )}
              
              <button 
                className={`btn btn-sm ${user.status === 'Active' ? 'btn-danger' : 'btn-success'}`}
                onClick={() => onUserUpdate(user._id, { 
                  status: user.status === 'Active' ? 'Blocked' : 'Active' 
                })}
              >
                {user.status === 'Active' ? 'Block' : 'Unblock'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MentorRequestsTab({ onUserUpdate }) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get('/admin/users?role=Mentor&isMentorApproved=false&limit=100');
        setRequests(res.data.data.users || []);
      } catch (e) {
        console.error('Failed to fetch mentor requests', e);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-users">
      <div className="users-header">
        <h3>Pending Mentor Approvals</h3>
      </div>
      <div className="users-table">
        {requests.map(user => (
          <div key={user._id} className="user-row">
            <div className="user-info">
              <div className="user-avatar">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">{user.name.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="user-details">
                <h4>{user.name}</h4>
                <p>{user.email}</p>
                <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>
                <span className={`approval-badge pending`}>Pending</span>
              </div>
            </div>
            <div className="user-actions">
              <button className="btn btn-success btn-sm" onClick={() => onUserUpdate(user._id, { isMentorApproved: true })}>Approve</button>
              <button className="btn btn-danger btn-sm" onClick={() => onUserUpdate(user._id, { role: 'Mentee', isMentorApproved: false })}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab({ analytics }) {
  const [localData, setLocalData] = useState(analytics);
  const [granularity, setGranularity] = useState('day');
  const fmt = (d) => d.toISOString().slice(0, 10);
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 30);
  const [start, setStart] = useState(fmt(defaultStart));
  const [end, setEnd] = useState(fmt(today));
  const [loading, setLoading] = useState(false);

  const data = localData || analytics;
  if (!data) return <LoadingSpinner />;

  const users = data.stats?.users || {};
  const sessions = data.stats?.sessions || {};
  const disputes = data.stats?.disputes || {};
  const goals = data.stats?.goals || {};
  const status = data.status || {};

  const totalUsers = (users.Admin || 0) + (users.Mentor || 0) + (users.Mentee || 0);
  const totalSessions = Object.values(sessions).reduce((a, b) => a + (b || 0), 0);
  const openDisputes = disputes.Open || 0;
  const activeGoals = goals.Active || 0;

  const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

  const userData = [
    { label: 'Mentees', value: users.Mentee || 0, color: '#3b82f6' },
    { label: 'Mentors', value: users.Mentor || 0, color: '#22c55e' },
    { label: 'Admins', value: users.Admin || 0, color: '#f59e0b' }
  ];

  const sessionData = [
    { label: 'Completed', value: sessions.Completed || 0, color: '#22c55e' },
    { label: 'Scheduled', value: sessions.Scheduled || 0, color: '#3b82f6' },
    { label: 'In Prog', value: sessions.InProgress || 0, color: '#f59e0b' }
  ];

  const disputeData = [
    { label: 'Open', value: disputes.Open || 0, color: '#ef4444' },
    { label: 'Resolved', value: disputes.Resolved || 0, color: '#22c55e' },
    { label: 'Review', value: disputes.InReview || 0, color: '#f59e0b' }
  ];

  const goalData = [
    { label: 'Active', value: goals.Active || 0, color: '#3b82f6' },
    { label: 'Done', value: goals.Completed || 0, color: '#22c55e' },
    { label: 'Paused', value: goals.Paused || 0, color: '#f59e0b' }
  ];

  // Timeseries for trends
  const userSeries = data.timeseries?.users || [];
  const sessionsCompleted = data.timeseries?.sessions?.Completed || [];

  const derived = data.derived || {};
  const resolutionRate = derived.disputes?.resolutionRate ?? null;
  const avgResolutionHours = derived.disputes?.avgResolutionHours ?? null;

  const applyFilters = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/analytics?startDate=${start}&endDate=${end}&granularity=${granularity}`);
      setLocalData(res.data.data);
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-analytics">
      <h2>Platform Analytics</h2>

      <div className="filter-bar">
        <div className="filter-row">
          <label>
            Start
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            End
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <label>
            Granularity
            <select value={granularity} onChange={(e) => setGranularity(e.target.value)}>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </label>
          <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
            {loading ? 'Loading…' : 'Apply'}
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Users Today</div>
          <div className="kpi-value">{status.usersToday ?? 0}</div>
          <div className="kpi-sub">Total users {totalUsers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Sessions Today</div>
          <div className="kpi-value">{status.sessionsScheduledToday ?? 0}</div>
          <div className="kpi-sub">Completed {status.sessionsCompletedToday ?? 0} • Rate {status.completionRateToday ?? 0}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Next 24h</div>
          <div className="kpi-value">{status.sessionsNext24h ?? 0}</div>
          <div className="kpi-sub">Active now {status.activeSessionsNow ?? 0}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Open Disputes</div>
          <div className="kpi-value kpi-danger">{status.openDisputes ?? openDisputes}</div>
          <div className="kpi-sub">Resolved {disputes.Resolved || 0}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Pending Approvals</div>
          <div className="kpi-value">{(status.pendingMentorApprovals ?? 0) + (status.pendingExpertiseUsers ?? 0)}</div>
          <div className="kpi-sub">Mentors {status.pendingMentorApprovals ?? 0} • Expertise {status.pendingExpertiseUsers ?? 0}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Blocked Users</div>
          <div className="kpi-value">{status.blockedUsers ?? 0}</div>
          <div className="kpi-sub">Mentors {pct(users.Mentor || 0, totalUsers)}% • Mentees {pct(users.Mentee || 0, totalUsers)}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Uptime</div>
          <div className="kpi-value">{status.uptimeMinutes ?? 0}m</div>
          <div className="kpi-sub">Version {status.version || 'n/a'}</div>
        </div>
      </div>

      <div className="trends-grid">
        <div className="chart-card">
          <SimpleLineChart title="Users created" data={userSeries} height={90} stroke="#0ea5e9" fill="rgba(14,165,233,0.12)" />
        </div>
        <div className="chart-card">
          <SimpleLineChart title="Sessions completed" data={sessionsCompleted} height={90} stroke="#10b981" fill="rgba(16,185,129,0.12)" />
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
<SimpleBarChart title="Users by role" data={userData} height={240} />
        </div>
        <div className="chart-card">
<SimpleBarChart title="Session status" data={sessionData} height={240} />
        </div>
        <div className="chart-card">
<SimpleBarChart title="Disputes status" data={disputeData} height={240} />
        </div>
      </div>

      <div className="recent-activity">
        <div className="activity-section">
          <h3>Recent Users</h3>
          {data.recent?.users?.map(user => (
            <div key={user._id} className="activity-item">
              <span>{user.name}</span>
              <span className="activity-meta">{user.role} - {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpertiseRequestsTab() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/expertise/pending');
      setRequests(res.data.data.expertise || []);
    } catch (e) {
      console.error('Failed to fetch expertise requests', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId, expertiseName, status) => {
    try {
      await api.put(`/admin/users/${userId}/expertise/${encodeURIComponent(expertiseName)}`, { status });
      // Refresh the list
      fetchRequests();
    } catch (error) {
      console.error('Failed to update expertise status:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-expertise-requests">
      <div className="users-header">
        <h3>Pending Expertise Approvals</h3>
        <p>Review and approve user-submitted areas of expertise</p>
      </div>
      
      {requests.length === 0 ? (
        <div className="no-requests">
          <p>No pending expertise requests at this time.</p>
        </div>
      ) : (
        <div className="expertise-requests-list">
          {requests.map((request, index) => (
            <div key={`${request.userId}-${request.expertiseName}-${index}`} className="expertise-request-item">
              <div className="request-info">
                <div className="user-avatar">
                  {request.userAvatar ? (
                    <img src={request.userAvatar} alt={request.userName} />
                  ) : (
                    <div className="avatar-placeholder">{request.userName.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div className="user-details">
                  <h4>{request.userName}</h4>
                  <p>{request.userEmail}</p>
                  <span className={`role-badge role-${request.userRole.toLowerCase()}`}>{request.userRole}</span>
                </div>
                <div className="expertise-details">
                  <h5>Requested Expertise:</h5>
                  <p className="expertise-name">{request.expertiseName}</p>
                  <small>Submitted: {new Date(request.submittedAt).toLocaleDateString()}</small>
                </div>
              </div>
              <div className="request-actions">
                <button 
                  className="btn btn-success btn-sm" 
                  onClick={() => handleApproval(request.userId, request.expertiseName, 'Approved')}
                >
                  Approve
                </button>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => handleApproval(request.userId, request.expertiseName, 'Rejected')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
