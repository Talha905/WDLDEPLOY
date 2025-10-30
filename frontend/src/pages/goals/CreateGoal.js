import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import GoalForm from '../../components/goals/GoalForm';
import '../../styles/pages/Goals.css';

function CreateGoal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    
    try {
      // Calculate initial progress based on completed milestones
      const completedMilestones = formData.milestones?.filter(m => m.completed).length || 0;
      const totalMilestones = formData.milestones?.length || 0;
      const calculatedProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
      
      const goalData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority || 'Medium',
        status: formData.status || 'Active',
        targetDate: formData.targetDate,
        tags: formData.tags || [],
        milestones: formData.milestones || [],
        progress: calculatedProgress, // Calculate from milestones
        // Try different user ID field names
        userId: user._id,
        mentee: user._id, // Fallback for legacy API
        user: user._id    // Another fallback
      };
      
      console.log('Submitting goal data:', goalData);
      console.log('User object:', user);
      
      const response = await api.post('/goals', goalData);
      console.log('Full CreateGoal API response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Handle different possible response structures for redirect
      let goalId;
      const data = response.data;
      
      if (data.success && data.data) {
        // Standard success response with data wrapper
        goalId = data.data._id || data.data.id;
      } else if (data._id || data.id) {
        // Direct goal object response
        goalId = data._id || data.id;
      } else if (data.goal) {
        // Response with goal field
        goalId = data.goal._id || data.goal.id;
      } else if (data.data?._id || data.data?.id) {
        // Nested data structure
        goalId = data.data._id || data.data.id;
      }
      
      console.log('Extracted goal ID:', goalId);
      
      if (goalId) {
        toast.success('Goal created successfully!');
        navigate(`/goals/${goalId}`);
      } else {
        // Still successful but can't determine ID, go to list
        console.warn('Goal created but could not determine ID. Full response:', data);
        toast.success('Goal created! Redirecting to goals list.');
        navigate('/goals');
      }
    } catch (error) {
      console.error('Failed to create goal - Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      let errorMessage = 'Failed to create goal. Please try again.';
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.errors) {
          errorMessage = Object.values(error.response.data.errors).join(', ');
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/goals');
  };

  return (
    <div className="create-goal-page fade-in">
      <div className="page-header">
        <h1>Create New Goal</h1>
        <p>Define your objectives and track your progress toward success.</p>
      </div>

      <GoalForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        submitText="Create Goal"
        isEdit={false}
      />
    </div>
  );
}

export default CreateGoal;