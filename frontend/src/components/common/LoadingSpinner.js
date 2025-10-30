import React from 'react';
import '../../styles/components/LoadingSpinner.css';

function LoadingSpinner({ size = 'medium', text = 'Loading...' }) {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;