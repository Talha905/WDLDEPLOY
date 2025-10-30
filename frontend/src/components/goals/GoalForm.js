import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/GoalForm.css';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['Active', 'Paused', 'Completed'];

function GoalForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  submitText = 'Create Goal',
  isEdit = false 
}) {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Active',
    targetDate: '',
    tags: [],
    milestones: [],
    progress: 0,
    ...initialData
  });

  const [tagInput, setTagInput] = useState('');
  const [milestoneInput, setMilestoneInput] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [errors, setErrors] = useState({});

  // Update form when initial data changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        targetDate: initialData.targetDate ? 
          new Date(initialData.targetDate).toISOString().split('T')[0] : '',
        tags: initialData.tags || [],
        milestones: initialData.milestones || []
      }));
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Calculate progress based on completed milestones
  const calculateProgress = (milestones = []) => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addMilestone = () => {
    if (milestoneInput.title.trim()) {
      const newMilestone = {
        title: milestoneInput.title,
        description: milestoneInput.description,
        dueDate: milestoneInput.dueDate || null,
        completed: false
      };
      
      setFormData(prev => ({
        ...prev,
        milestones: [...prev.milestones, newMilestone]
      }));
      
      setMilestoneInput({ title: '', description: '', dueDate: '' });
    }
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const toggleMilestone = (index) => {
    const updatedMilestones = formData.milestones.map((milestone, i) => 
      i === index ? { ...milestone, completed: !milestone.completed } : milestone
    );
    
    setFormData(prev => ({
      ...prev,
      milestones: updatedMilestones,
      // Update progress immediately when milestone is toggled
      progress: calculateProgress(updatedMilestones)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else {
      const targetDate = new Date(formData.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate < today) {
        newErrors.targetDate = 'Target date must be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Include calculated progress based on milestones
    const submitData = {
      ...formData,
      progress: calculateProgress(formData.milestones)
    };
    
    onSubmit(submitData);
  };

  return (
    <div className="goal-form-container">
      <form onSubmit={handleSubmit} className="goal-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="title">Goal Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
              placeholder="Enter your goal title"
              disabled={isLoading}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="Describe your goal in detail"
              rows="4"
              disabled={isLoading}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                {PRIORITY_OPTIONS.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="targetDate">Target Date *</label>
              <input
                type="date"
                id="targetDate"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleInputChange}
                className={errors.targetDate ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.targetDate && <span className="error-message">{errors.targetDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Progress: {calculateProgress(formData.milestones)}%</label>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${calculateProgress(formData.milestones)}%` }}
              ></div>
            </div>
            <small className="progress-note">
              Progress is automatically calculated based on completed milestones.
              {formData.milestones.length === 0 && ' Add milestones below to track progress.'}
            </small>
          </div>
        </div>

        <div className="form-section">
          <h3>Tags</h3>
          <div className="tags-input">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              disabled={isLoading}
            />
            <button type="button" onClick={addTag} disabled={isLoading}>
              Add Tag
            </button>
          </div>
          
          <div className="tags-list">
            {formData.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)}
                  disabled={isLoading}
                  className="tag-remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Milestones</h3>
          <p className="section-description">
            Break your goal into smaller milestones. Your overall progress will be automatically calculated based on completed milestones.
          </p>
          <div className="milestone-input">
            <div className="milestone-form">
              <input
                type="text"
                value={milestoneInput.title}
                onChange={(e) => setMilestoneInput(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                placeholder="Milestone title"
                disabled={isLoading}
              />
              <input
                type="text"
                value={milestoneInput.description}
                onChange={(e) => setMilestoneInput(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="Milestone description (optional)"
                disabled={isLoading}
              />
              <input
                type="date"
                value={milestoneInput.dueDate}
                onChange={(e) => setMilestoneInput(prev => ({
                  ...prev,
                  dueDate: e.target.value
                }))}
                disabled={isLoading}
              />
              <button type="button" onClick={addMilestone} disabled={isLoading}>
                Add Milestone
              </button>
            </div>
          </div>

          <div className="milestones-list">
            {formData.milestones.map((milestone, index) => (
              <div key={index} className={`milestone-item ${milestone.completed ? 'completed' : ''}`}>
                <div className="milestone-checkbox">
                  <input
                    type="checkbox"
                    checked={milestone.completed}
                    onChange={() => toggleMilestone(index)}
                    disabled={isLoading}
                  />
                </div>
                <div className="milestone-content">
                  <h4>{milestone.title}</h4>
                  {milestone.description && <p>{milestone.description}</p>}
                  {milestone.dueDate && (
                    <small>Due: {new Date(milestone.dueDate).toLocaleDateString()}</small>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => removeMilestone(index)}
                  className="milestone-remove"
                  disabled={isLoading}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="small" /> : submitText}
          </button>
        </div>
      </form>
    </div>
  );
}

export default GoalForm;