import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-brand">
          <img src={logo} alt="MentorHub Logo" className="header-logo" />
        </Link>
        <nav className="header-nav">
          <Link to="/login" className="header-link">
            Sign In
          </Link>
          <Link to="/register" className="header-cta">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;