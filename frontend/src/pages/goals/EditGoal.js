import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import GoalForm from '../../components/goals/GoalForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/pages/Goals.css';

function EditGoal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGoal();
  }, [id]);

  const fetchGoal = async () => {
    try {
      const response = await api.get(`/goals/${id}`);
      console.log('EditGoal API response:', response.data); // Debug log
      
      // Handle different possible response structures
      let goalData;
      if (response.data.data) {
        goalData = response.data.data;
      } else if (response.data.goal) {
        goalData = response.data.goal;
      } else if (response.data._id || response.data.id) {
        goalData = response.data;
      } else {
        throw new Error('Invalid response structure');
      }
      
      // Check if the current user is the owner of this goal (simplified for personal tracker)
      if (goalData.userId && goalData.userId !== user._id) {
        setError('You do not have permission to edit this goal.');
        return;
      }
      
      setGoal(goalData);
    } catch (error) {
      console.error('Failed to fetch goal:', error);
      setError(
        error.response?.status === 404 
          ? 'Goal not found' 
          : 'Failed to load goal details'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    
    try {
      const response = await api.put(`/goals/${id}`, formData);
      
      toast.success('Goal updated successfully!');
      navigate(`/goals/${id}`);
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to update goal. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/goals/${id}`);
  };

  if (loading) {
    return <LoadingSpinner text="Loading goal..." />;
  }

  if (error || !goal) {
    return (
      <div className="edit-goal-page fade-in">
        <div className="error-state">
          <h2>Cannot Edit Goal</h2>
          <p>{error || 'This goal could not be loaded for editing.'}</p>
          <button onClick={() => navigate('/goals')} className="btn btn-primary">
            Back to Goals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-goal-page fade-in">
      <div className="page-header">
        <h1>Edit Goal</h1>
        <p>Update your goal details and track your progress.</p>
      </div>

      <GoalForm
        initialData={goal}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        submitText="Update Goal"
        isEdit={true}
      />
    </div>
  );
}

export default EditGoal;