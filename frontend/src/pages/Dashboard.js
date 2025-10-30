import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages/Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    upcomingSessions: [],
    recentGoals: [],
    stats: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const requests = [
          api.get('/sessions?upcoming=true&limit=5')
        ];
        
        // Only fetch goals for mentees
        if (user?.role === 'Mentee') {
          requests.push(api.get('/goals?status=Active&limit=5'));
        }
        
        const responses = await Promise.all(requests);
        const sessionsRes = responses[0];
        const goalsRes = user?.role === 'Mentee' ? responses[1] : null;

        setData({
          upcomingSessions: sessionsRes.data.data.sessions || [],
          recentGoals: goalsRes?.data.data.goals || [],
          stats: {
            totalSessions: sessionsRes.data.data.sessions?.length || 0,
            activeGoals: goalsRes?.data.data.goals?.length || 0
          }
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.name}!</h1>
          <p className="welcome-subtitle">
            {user?.role === 'Admin' ? 'Manage your platform' :
             user?.role === 'Mentor' ? 'Ready to guide and inspire?' :
             'Continue your learning journey'}
          </p>
        </div>

        {user?.role === 'Mentor' && !user?.isMentorApproved && (
          <div className="alert alert-warning">
            <strong>Mentor Approval Pending</strong>
            <p>Your mentor account is under review. You'll be notified once approved!</p>
          </div>
        )}
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <div className="dashboard-grid">
            <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">{data.stats.totalSessions}</div>
            <div className="stat-label">Upcoming Sessions</div>
            <Link to="/sessions" className="stat-link">View All</Link>
          </div>

          {user?.role === 'Mentee' && (
            <div className="stat-card">
              <div className="stat-number">{data.stats.activeGoals}</div>
              <div className="stat-label">Active Goals</div>
              <Link to="/goals" className="stat-link">View All</Link>
            </div>
          )}

          {user?.role === 'Mentor' && (
            <div className="stat-card">
              <div className="stat-number">{user?.rating?.toFixed(1) || '0.0'}</div>
              <div className="stat-label">Average Rating</div>
              <span className="stat-extra">({user?.ratingsCount || 0} reviews)</span>
            </div>
          )}
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <div className="section-header">
              <h3>Upcoming Sessions</h3>
              <Link to="/sessions" className="section-link">View All</Link>
            </div>
            
            {data.upcomingSessions.length > 0 ? (
              <div className="session-list">
                {data.upcomingSessions.map(session => (
                  <div key={session._id} className="session-item">
                    <div className="session-info">
                      <h4>{session.title}</h4>
                      <p className="session-date">{formatDate(session.scheduledAt)}</p>
                      <p className="session-participants">
                        {user?.role === 'Mentor' ? 
                          `with ${session.mentee?.name}` : 
                          `with ${session.mentor?.name}`
                        }
                      </p>
                    </div>
                    <div className="session-actions">
                      <Link to={`/sessions/${session._id}`} className="btn btn-primary btn-sm">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No upcoming sessions</p>
                {user?.role === 'Mentee' && (
                  <Link to="/search" className="btn btn-primary">Find a Mentor</Link>
                )}
              </div>
            )}
          </div>

          {user?.role === 'Mentee' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h3>Active Goals</h3>
                <Link to="/goals" className="section-link">View All</Link>
              </div>
            
            {data.recentGoals.length > 0 ? (
              <div className="goal-list">
                {data.recentGoals.map(goal => (
                  <div key={goal._id} className="goal-item">
                    <div className="goal-info">
                      <h4>{goal.title}</h4>
                      <div className="goal-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{goal.progress}%</span>
                      </div>
                      <p className="goal-status">
                        Status: {goal.status} • Priority: {goal.priority}
                      </p>
                    </div>
                    <div className="goal-actions">
                      <Link to={`/goals/${goal._id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No active goals</p>
                <Link to="/goals/new" className="btn btn-primary">Create Your First Goal</Link>
              </div>
            )}
            </div>
          )}
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            {user?.role === 'Mentee' && (
              <>
                <Link to="/search" className="btn btn-primary">Find Mentors</Link>
                <Link to="/goals/new" className="btn btn-secondary">Create Goal</Link>
                <Link to="/sessions" className="btn btn-outline">My Sessions</Link>
              </>
            )}
            
            {user?.role === 'Mentor' && user?.isMentorApproved && (
              <>
                <Link to="/sessions" className="btn btn-primary">View Sessions</Link>
                <Link to="/profile" className="btn btn-secondary">Manage Profile</Link>
              </>
            )}

            {user?.role === 'Admin' && (
              <>
                <Link to="/admin" className="btn btn-primary">Admin Panel</Link>
                <Link to="/admin/analytics" className="btn btn-secondary">View Analytics</Link>
              </>
            )}
            
            <Link to="/profile" className="btn btn-secondary">Edit Profile</Link>
          </div>
        </div>
          </div>
        </div>
        
        <div className="dashboard-sidebar">
          <div className="sidebar-section">
            <h4>Recent Activity</h4>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">📅</div>
                <div className="activity-content">
                  <span className="activity-text">Session reminder in 2 hours</span>
                  <span className="activity-time">Today</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🎯</div>
                <div className="activity-content">
                  <span className="activity-text">Goal progress updated</span>
                  <span className="activity-time">2 days ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">⭐</div>
                <div className="activity-content">
                  <span className="activity-text">Received 5-star rating</span>
                  <span className="activity-time">1 week ago</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h4>Tips & Insights</h4>
            <div className="tips-content">
              <div className="tip-item">
                <div className="tip-badge">💡</div>
                <p>Set clear objectives before each session to maximize impact</p>
              </div>
              <div className="tip-item">
                <div className="tip-badge">📈</div>
                <p>{user?.role === 'Mentor' ? 'Ask open-ended questions to encourage deeper thinking' : 'Take notes during sessions to track your progress'}</p>
              </div>
            </div>
          </div>
          
          {user?.role === 'Mentee' && (
            <div className="sidebar-section">
              <h4>Learning Path</h4>
              <div className="learning-progress">
                <div className="progress-step completed">
                  <div className="step-icon">✓</div>
                  <span>Profile Setup</span>
                </div>
                <div className="progress-step completed">
                  <div className="step-icon">✓</div>
                  <span>First Session</span>
                </div>
                <div className="progress-step active">
                  <div className="step-icon">→</div>
                  <span>Goal Setting</span>
                </div>
                <div className="progress-step">
                  <div className="step-icon">○</div>
                  <span>Regular Check-ins</span>
                </div>
              </div>
            </div>
          )}
          
          {user?.role === 'Mentor' && (
            <div className="sidebar-section">
              <h4>Mentor Tools</h4>
              <div className="tools-grid">
                <div className="tool-item">
                  <div className="tool-icon">📋</div>
                  <span>Session Templates</span>
                </div>
                <div className="tool-item">
                  <div className="tool-icon">📊</div>
                  <span>Progress Tracking</span>
                </div>
                <div className="tool-item">
                  <div className="tool-icon">💬</div>
                  <span>Communication Tips</span>
                </div>
                <div className="tool-item">
                  <div className="tool-icon">🎯</div>
                  <span>Goal Frameworks</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;