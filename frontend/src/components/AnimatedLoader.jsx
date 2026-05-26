import React from 'react';
import './AnimatedLoader.css';

const AnimatedLoader = ({ size = 'medium', text = 'Loading...' }) => {
  return (
    <div className={`animated-loader-wrapper ${size}`}>
      <div className="loader-orbit">
        <div className="loader-core"></div>
        <div className="loader-ring loader-ring-1"></div>
        <div className="loader-ring loader-ring-2"></div>
      </div>
      {text && <div className="loader-text">{text}</div>}
    </div>
  );
};

export default AnimatedLoader;
