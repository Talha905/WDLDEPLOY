import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/pages/Goals.css';

function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGoal();
  }, [id]);

  const fetchGoal = async () => {
    try {
      const response = await api.get(`/goals/${id}`);
      console.log('Full API response:', response.data); // Debug log
      
      // Handle different possible response structures
      let goalData;
      if (response.data.data?.goal) {
        goalData = response.data.data.goal;
      } else if (response.data.goal) {
        goalData = response.data.goal;
      } else if (response.data.data?._id) {
        goalData = response.data.data;
      } else if (response.data._id || response.data.id) {
        goalData = response.data;
      } else {
        throw new Error('Invalid response structure');
      }
      
      console.log('Processed goal data:', goalData); // Debug log
      setGoal(goalData);
    } catch (error) {
      console.error('Failed to fetch goal:', error);
      setError(error.response?.status === 404 ? 'Goal not found' : 'Failed to load goal details');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#dc3545';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No target date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate progress from milestones
  const calculateProgress = (milestones = []) => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const handleToggleMilestone = async (milestoneIndex) => {
    try {
      const updatedMilestones = goal.milestones.map((milestone, index) => {
        if (index === milestoneIndex) {
          const isCompleting = !milestone.completed;
          return { 
            ...milestone, 
            completed: isCompleting,
            completedAt: isCompleting ? new Date() : null
          };
        }
        return milestone;
      });
      
      const newProgress = calculateProgress(updatedMilestones);
      
      const updateData = {
        milestones: updatedMilestones,
        progress: newProgress
      };
      
      await api.put(`/goals/${id}`, updateData);
      
      setGoal(prev => ({
        ...prev,
        milestones: updatedMilestones,
        progress: newProgress
      }));
      
      toast.success('Milestone updated!');
    } catch (error) {
      console.error('Failed to update milestone:', error);
      toast.error('Failed to update milestone');
    }
  };

  const handleStatusToggle = async () => {
    setUpdating(true);
    
    try {
      const newStatus = (goal.status || '').toLowerCase() === 'active' ? 'Paused' : 'Active';
      const response = await api.put(`/goals/${id}`, { status: newStatus });
      
      setGoal(prev => ({ ...prev, status: newStatus }));
      toast.success(`Goal ${newStatus.toLowerCase()}!`);
    } catch (error) {
      console.error('Failed to update goal status:', error);
      toast.error('Failed to update goal status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }
    
    setUpdating(true);
    
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal deleted successfully!');
      navigate('/goals');
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast.error('Failed to delete goal');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading goal details..." />;
  }

  if (error || !goal) {
    return (
      <div className="goal-detail-container">
        <div className="error-state">
          <h2>Goal Not Found</h2>
          <p>{error || 'This goal could not be found or you don\'t have permission to view it.'}</p>
          <div style={{ margin: '20px 0', fontSize: '12px', color: '#666' }}>
            <details>
              <summary>Debug Info</summary>
              <pre>{JSON.stringify({ goalId: id, error, hasGoal: !!goal }, null, 2)}</pre>
            </details>
          </div>
          <Link to="/goals" className="btn btn-primary">Back to Goals</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="goal-detail-container fade-in">
      <div className="goal-detail-header">
        <div className="breadcrumb">
          <Link to="/goals">← Back to Goals</Link>
        </div>
        <div className="goal-title-section">
          <h1>{goal.title}</h1>
          <div className="goal-meta">
            <span 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(goal.priority || 'Medium') }}
            >
              {goal.priority || 'Medium'} Priority
            </span>
            <span className={`status-badge status-${(goal.status || 'unknown').toLowerCase()}`}>
              {goal.status || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="goal-detail-content">
        <div className="goal-main-info">
          <div className="info-section">
            <h3>Description</h3>
            <p>{goal.description || 'No description provided.'}</p>
          </div>

          <div className="info-section">
            <h3>Progress</h3>
            <div className="progress-section">
              <div className="progress-bar-large">
                <div 
                  className="progress-fill"
                  style={{ width: `${goal.progress || 0}%` }}
                ></div>
              </div>
              <div className="progress-info">
                <span className="progress-percentage">{goal.progress || 0}%</span>
                <div className="progress-info-text">
                  <small>Progress is automatically calculated from completed milestones.</small>
                </div>
              </div>
            </div>
          </div>

          {goal.milestones && goal.milestones.length > 0 && (
            <div className="info-section">
              <h3>Milestones</h3>
              <div className="milestones-list">
                {goal.milestones.map((milestone, index) => (
                  <div 
                    key={index} 
                    className={`milestone-item ${milestone.completed ? 'completed' : ''} clickable`}
                    onClick={() => handleToggleMilestone(index)}
                  >
                    <div className="milestone-checkbox">
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={() => handleToggleMilestone(index)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="milestone-content">
                      <h4>{milestone.title}</h4>
                      {milestone.description && <p>{milestone.description}</p>}
                      {milestone.dueDate && (
                        <small>Due: {formatDate(milestone.dueDate)}</small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {goal.tags && goal.tags.length > 0 && (
            <div className="info-section">
              <h3>Tags</h3>
              <div className="goal-tags-large">
                {goal.tags.map((tag, index) => (
                  <span key={index} className="goal-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="goal-sidebar">
          <div className="sidebar-section">
            <h4>Goal Information</h4>
            <div className="info-item">
              <strong>Target Date:</strong>
              <span>{formatDate(goal.targetDate)}</span>
            </div>
            <div className="info-item">
              <strong>Created:</strong>
              <span>{formatDate(goal.createdAt)}</span>
            </div>
            <div className="info-item">
              <strong>Last Updated:</strong>
              <span>{formatDate(goal.updatedAt)}</span>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Goal Statistics</h4>
            <div className="goal-stats">
              <div className="info-item">
                <strong>Completion:</strong>
                <span>{goal.progress || 0}% complete</span>
              </div>
              <div className="info-item">
                <strong>Milestones:</strong>
                <span>{goal.milestones?.filter(m => m.completed).length || 0} of {goal.milestones?.length || 0} completed</span>
              </div>
              <div className="info-item">
                <strong>Days Remaining:</strong>
                <span>{goal.targetDate ? 
                  Math.max(0, Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))) + ' days' : 
                  'No deadline'}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-actions">
            <Link to={`/goals/${id}/edit`} className="btn btn-primary btn-block">
              Edit Goal
            </Link>
            <button 
              onClick={handleStatusToggle}
              className={`btn btn-block ${
                (goal.status || '').toLowerCase() === 'active' ? 'btn-warning' : 'btn-success'
              }`}
              disabled={updating}
            >
              {updating ? 'Updating...' :
               (goal.status || '').toLowerCase() === 'active' ? 'Pause Goal' : 'Resume Goal'}
            </button>
            <button 
              onClick={handleDelete}
              className="btn btn-danger btn-block"
              disabled={updating}
            >
              {updating ? 'Deleting...' : 'Delete Goal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalDetail;
