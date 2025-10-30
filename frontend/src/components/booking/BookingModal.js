import React, { useState } from 'react';
import { api } from '../../services/api';
import '../../styles/components/BookingModal.css';

function BookingModal({ mentor, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await api.post('/sessions', {
        ...formData,
        mentor: mentor._id
      });
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to book session');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // At least 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book Session with {mentor.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label className="form-label">Session Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Career Guidance Session"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              rows="3"
              placeholder="What would you like to discuss?"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scheduled Date & Time *</label>
            <input
              type="datetime-local"
              name="scheduledAt"
              value={formData.scheduledAt}
              onChange={handleChange}
              className="form-input"
              min={getMinDateTime()}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Duration</label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="form-select"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Booking...' : 'Book Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;