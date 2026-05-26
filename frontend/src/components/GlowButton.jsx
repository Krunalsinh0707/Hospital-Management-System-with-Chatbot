import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import './GlowButton.css';

const GlowButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  type = 'button', 
  icon = null,
  disabled = false,
  loading = false,
  loadingText = "Processing..."
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={!disabled && !loading ? { y: -2, scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`glow-button ${variant} ${className} ${disabled || loading ? 'disabled' : ''}`}
      disabled={disabled || loading}
    >
      <span className="glow-button-bg"></span>
      <span className="glow-button-content">
        {loading ? (
          <>
            <Loader2 size={18} className="spinner" />
            {loadingText}
          </>
        ) : (
          <>
            {icon && <span className="button-icon">{icon}</span>}
            {children}
          </>
        )}
      </span>
    </motion.button>
  );
};

export default GlowButton;
