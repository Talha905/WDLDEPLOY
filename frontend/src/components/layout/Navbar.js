import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/logo.svg';
import '../../styles/components/Navbar.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToggleAnimating, setIsToggleAnimating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleThemeToggle = () => {
    setIsToggleAnimating(true);
    toggleTheme();
    setTimeout(() => setIsToggleAnimating(false), 300);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <img src={logo} alt="MentorHub" className="nav-logo" />
        </Link>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          
          <Link 
            to="/sessions" 
            className={`nav-link ${isActive('/sessions') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Sessions
          </Link>
          
          {user?.role === 'Mentee' && (
            <Link 
              to="/goals" 
              className={`nav-link ${isActive('/goals') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Goals
            </Link>
          )}
          
          {user?.role === 'Mentee' && (
            <Link 
              to="/search" 
              className={`nav-link ${isActive('/search') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Find Mentors
            </Link>
          )}
          
          <Link 
            to="/disputes" 
            className={`nav-link ${isActive('/disputes') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Disputes
          </Link>

          <Link 
            to="/community" 
            className={`nav-link ${isActive('/community') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Community
          </Link>

          {user?.role === 'Admin' && (
            <Link 
              to="/admin" 
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          )}

          <div className="nav-actions">
            <button 
              className={`theme-toggle ${isToggleAnimating ? 'rotating' : ''}`}
              onClick={handleThemeToggle}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="theme-toggle-icon">
                {isDark ? '☀️' : '🌙'}
              </span>
            </button>
            
            <div className="nav-user">
              <Link 
                to="/profile" 
                className="nav-user-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="nav-user-info">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="nav-avatar" />
                  ) : (
                    <div className="nav-avatar-placeholder">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className="nav-username">{user?.name}</span>
                </div>
              </Link>
              <button onClick={handleLogout} className="nav-logout">
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className={`nav-hamburger ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;