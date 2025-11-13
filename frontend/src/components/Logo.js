import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium' }) => {
  return (
    <div className={`logo-container ${size}`}>
      <div className="logo">
        <div className="brain">
          <div className="brain-left"></div>
          <div className="brain-right"></div>
          <div className="brain-connection"></div>
        </div>
        <div className="trail">
          <div className="trail-dot dot1"></div>
          <div className="trail-dot dot2"></div>
          <div className="trail-dot dot3"></div>
        </div>
      </div>
      <span className="logo-text">Brain-Trails</span>
    </div>
  );
};

export default Logo; 