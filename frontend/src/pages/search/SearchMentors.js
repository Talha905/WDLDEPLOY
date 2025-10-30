import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BookingModal from '../../components/booking/BookingModal';
import '../../styles/pages/SearchMentors.css';

function SearchMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: '',
    expertise: '',
    rating: ''
  });
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    searchMentors();
  }, []);

  const searchMentors = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.expertise) params.set('expertise', filters.expertise);
      if (filters.rating) params.set('rating', filters.rating);

      const response = await api.get(`/search/mentors?${params.toString()}`);
      setMentors(response.data.data.mentors || []);
    } catch (error) {
      console.error('Failed to search mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    searchMentors();
  };

  const handleBookSession = (mentor) => {
    setSelectedMentor(mentor);
    setShowBookingModal(true);
  };

  const renderStars = (rating, count) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star'}>
          ★
        </span>
      );
    }
    return (
      <div className="rating">
        {stars}
        <span className="rating-text">({count} reviews)</span>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Searching mentors..." />;
  }

  return (
    <div className="search-container fade-in">
      <div className="search-header">
        <h1>Find Your Perfect Mentor</h1>
        <p>Connect with experienced professionals who can guide your career</p>
      </div>

      <div className="search-filters">
        <form onSubmit={handleSearch} className="filter-form">
          <div className="filter-group">
            <input
              type="text"
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Search by name or bio..."
              className="form-input"
            />
          </div>
          
          <div className="filter-group">
            <input
              type="text"
              name="expertise"
              value={filters.expertise}
              onChange={handleFilterChange}
              placeholder="Expertise (e.g., React, Design)"
              className="form-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              name="rating"
              value={filters.rating}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {mentors.length > 0 ? (
        <div className="mentors-grid">
          {mentors.map(mentor => (
            <div key={mentor._id} className="mentor-card slide-up">
              <div className="mentor-avatar">
                {mentor.avatarUrl ? (
                  <img src={mentor.avatarUrl} alt={mentor.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {mentor.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="mentor-info">
                <h3>{mentor.name}</h3>
                {renderStars(mentor.rating || 0, mentor.ratingsCount || 0)}
                
                {mentor.bio && (
                  <p className="mentor-bio">{mentor.bio.substring(0, 150)}...</p>
                )}
                
                {mentor.expertise && mentor.expertise.length > 0 && (
                  <div className="mentor-expertise">
                    {mentor.expertise
                      .filter(exp => exp.status === 'Approved')
                      .slice(0, 3)
                      .map((exp, index) => (
                        <span key={index} className="expertise-tag">
                          {exp.name}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              
              <div className="mentor-actions">
                <button 
                  onClick={() => handleBookSession(mentor)}
                  className="btn btn-primary"
                >
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No mentors found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      )}

      {showBookingModal && (
        <BookingModal
          mentor={selectedMentor}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            // Could show success message or redirect
          }}
        />
      )}
    </div>
  );
}

export default SearchMentors;