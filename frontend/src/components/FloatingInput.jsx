import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './FloatingInput.css';

const FloatingInput = ({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  name,
  required,
  error,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || (value !== '' && value !== undefined && value !== null);

  return (
    <div className={`floating-input-container ${error ? 'has-error' : ''}`}>
      <div className={`input-wrapper ${isActive ? 'active' : ''} ${focused ? 'focused' : ''}`}>
        {icon && <div className="input-icon-left">{icon}</div>}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          {...props}
        />
        <label className={isActive ? 'floating' : ''}>{label}</label>
      </div>
      {error && (
        <motion.span 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="error-text"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
};

export default FloatingInput;
