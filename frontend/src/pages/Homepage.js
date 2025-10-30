import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/Homepage.css';

function Homepage() {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Connect, Learn, and Grow with <span className="gradient-text">MentorHub</span>
          </h1>
          <p className="hero-subtitle">
            The premier platform connecting passionate mentors with ambitious learners. 
            Build meaningful relationships, achieve your goals, and unlock your potential.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              Sign In
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">
            <div className="hero-icon">🚀</div>
            <p>Your mentorship journey starts here</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose <span className="gradient-text">MentorHub</span>?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Expert Mentors</h3>
              <p>Connect with industry professionals and experienced mentors who are passionate about sharing their knowledge.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Goal Tracking</h3>
              <p>Set personalized goals, track milestones, and celebrate your achievements with built-in progress tracking.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Interactive Sessions</h3>
              <p>Engage in video calls, live chat, and collaborative sessions designed to maximize your learning experience.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Community Support</h3>
              <p>Join a vibrant community of learners and mentors, share experiences, and get support when you need it.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Flexible Scheduling</h3>
              <p>Book sessions that fit your schedule with our easy-to-use calendar and scheduling system.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Safe & Secure</h3>
              <p>Your privacy and security are our priority. All sessions are monitored and disputes are handled fairly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your account and complete your profile to get started</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Find a Mentor</h3>
              <p>Browse our network of expert mentors and find the perfect match</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Schedule & Learn</h3>
              <p>Book sessions, set goals, and start your learning journey</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Active Mentors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">5000+</div>
              <div className="stat-label">Successful Sessions</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of learners who have transformed their careers with MentorHub</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Join as Mentee
            </Link>
            <Link to="/register" className="btn btn-outline btn-large">
              Become a Mentor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>MentorHub</h3>
              <p>Empowering growth through mentorship</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Platform</h4>
                <ul>
                  <li><Link to="/register">Sign Up</Link></li>
                  <li><Link to="/login">Sign In</Link></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <ul>
                  <li><a href="#help">Help Center</a></li>
                  <li><a href="#contact">Contact Us</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 MentorHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;