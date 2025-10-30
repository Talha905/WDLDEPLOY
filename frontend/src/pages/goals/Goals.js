import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/pages/Goals.css';

function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchGoals();
  }, [filter]);

  const fetchGoals = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);

      const response = await api.get(`/goals?${params.toString()}`);
      setGoals(response.data.data.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'badge badge-error';
      case 'Medium': return 'badge badge-warning';
      case 'Low': return 'badge badge-success';
      default: return 'badge badge-secondary';
    }
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'badge badge-primary';
      case 'Completed': return 'badge badge-success';
      case 'Paused': return 'badge badge-warning';
      case 'Cancelled': return 'badge badge-error';
      default: return 'badge badge-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No target date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading goals..." />;
  }

  return (
    <div className="goals-container fade-in">
      <div className="goals-header decorative-dots">
        <div className="header-content">
          <h1>My Goals</h1>
          <p className="header-subtitle text-compact">Track your progress and achieve your objectives</p>
          <div className="header-stats flex-dense">
            <span className="stat-chip">
              <span className="stat-icon">🎯</span>
              <span>{goals.length} total</span>
            </span>
            <span className="stat-chip">
              <span className="stat-icon">✅</span>
              <span>{goals.filter(g => g.status === 'Completed').length} completed</span>
            </span>
          </div>
        </div>
        <div className="header-actions">
          <Link to="/goals/new" className="btn btn-primary">
            <span>+</span> Create Goal
          </Link>
        </div>
      </div>
      
      <div className="goals-controls">
        <div className="goals-filters flex-dense-sm">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Goals
          </button>
          <button 
            className={`filter-btn ${filter === 'Active' ? 'active' : ''}`}
            onClick={() => setFilter('Active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'Completed' ? 'active' : ''}`}
            onClick={() => setFilter('Completed')}
          >
            Completed
          </button>
          <button 
            className={`filter-btn ${filter === 'Paused' ? 'active' : ''}`}
            onClick={() => setFilter('Paused')}
          >
            Paused
          </button>
        </div>
      </div>

      {goals.length > 0 ? (
        <div className="goals-layout">
          <div className="goals-main">
            <div className="goals-grid grid-dense-sm">
              {goals.map(goal => (
                <div key={goal._id} className="goal-card decorative-line">
                  <div className="goal-card-header">
                    <h3 className="text-dense">{goal.title}</h3>
                    <div className="goal-meta flex-dense-xs">
                      <span className={getPriorityBadgeClass(goal.priority)}>
                        {goal.priority}
                      </span>
                      <span className={getStatusBadgeClass(goal.status)}>
                        {goal.status}
                      </span>
                    </div>
                  </div>

                  <div className="goal-card-body p-compact">
                    <div className="goal-progress mb-compact">
                      <div className="progress-header">
                        <span className="text-compact">🎯 Progress</span>
                        <span className="progress-percentage">{goal.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {goal.description && (
                      <p className="goal-description text-compact">
                        {goal.description.length > 80 
                          ? goal.description.substring(0, 80) + '...' 
                          : goal.description}
                      </p>
                    )}

                    <div className="goal-info-compact grid-dense-xs">
                      <div className="info-item-compact">
                        <span className="info-icon">📅</span>
                        <span className="info-text text-compact">{formatDate(goal.targetDate)}</span>
                      </div>
                      <div className="info-item-compact">
                        <span className="info-icon">✨</span>
                        <span className="info-text text-compact">{formatDate(goal.createdAt)}</span>
                      </div>
                    </div>

                    {goal.tags && goal.tags.length > 0 && (
                      <div className="goal-tags flex-dense-xs mt-compact">
                        {goal.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="chip">{tag}</span>
                        ))}
                        {goal.tags.length > 2 && (
                          <span className="chip">+{goal.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="goal-card-actions flex-dense-sm px-compact pb-compact">
                    <Link to={`/goals/${goal._id}`} className="btn btn-primary btn-sm">
                      Details
                    </Link>
                    <div className="progress-indicator">
                      <div className="progress-circle">
                        <span>{goal.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="goals-sidebar">
            <div className="sidebar-section">
              <h4>Goal Insights</h4>
              <div className="insights-grid">
                <div className="insight-item">
                  <div className="insight-value">
                    {Math.round(goals.filter(g => g.progress > 0).reduce((acc, g) => acc + g.progress, 0) / goals.filter(g => g.progress > 0).length) || 0}%
                  </div>
                  <div className="insight-label">Avg Progress</div>
                </div>
                <div className="insight-item">
                  <div className="insight-value">{goals.filter(g => g.status === 'Active').length}</div>
                  <div className="insight-label">Active Goals</div>
                </div>
              </div>
            </div>
            
            <div className="sidebar-section">
              <h4>Priority Breakdown</h4>
              <div className="priority-list">
                <div className="priority-item">
                  <span className="priority-color high"></span>
                  <span className="priority-text">High Priority</span>
                  <span className="priority-count">{goals.filter(g => g.priority === 'High').length}</span>
                </div>
                <div className="priority-item">
                  <span className="priority-color medium"></span>
                  <span className="priority-text">Medium Priority</span>
                  <span className="priority-count">{goals.filter(g => g.priority === 'Medium').length}</span>
                </div>
                <div className="priority-item">
                  <span className="priority-color low"></span>
                  <span className="priority-text">Low Priority</span>
                  <span className="priority-count">{goals.filter(g => g.priority === 'Low').length}</span>
                </div>
              </div>
            </div>
            
            <div className="sidebar-section">
              <h4>Goal Tips</h4>
              <div className="tips-list">
                <div className="tip-item">
                  <span className="tip-icon">🔥</span>
                  <span className="tip-text">Break large goals into smaller milestones</span>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">📈</span>
                  <span className="tip-text">Review and update progress weekly</span>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">🎆</span>
                  <span className="tip-text">Celebrate small wins along the way</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No goals found</h3>
          <p>
            {filter === 'all' 
              ? "You haven't created any goals yet. Start by setting your first objective!"
              : `No ${filter.toLowerCase()} goals found. Try adjusting your filter or create a new goal.`}
          </p>
          <Link to="/goals/new" className="btn btn-primary">
            Create Your First Goal
          </Link>
        </div>
      )}
    </div>
  );
}

export default Goals;