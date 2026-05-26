import React from 'react';
import { motion } from 'framer-motion';

const FloatingCard = ({ children, className = '', delay = 0, padding = 'p-6' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={`clinical-card ${padding} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default FloatingCard;
