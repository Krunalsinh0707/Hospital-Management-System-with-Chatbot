import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HealthInfoCard = ({ title, description, whyItMatters, abnormalIndicators, learnMoreLink }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="health-info-container" style={{ position: 'relative', display: 'inline-block', marginLeft: '6px' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="info-toggle-btn"
        aria-label={`Why do we ask for ${title}?`}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: isOpen ? '#1D9E75' : '#94A3B8',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.2s ease'
        }}
      >
        <HelpCircle size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="info-card-dropdown"
            style={{
              position: 'absolute',
              zIndex: 100,
              top: '24px',
              left: '0',
              width: '280px',
              background: '#FFFBEB',
              border: '1px solid #FEF3C7',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '16px',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
               Why do we ask this?
               {/* Close button for mobile */}
               <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', display: 'md:none' }}>
                <ChevronUp size={14} />
               </button>
            </div>
            
            <p style={{ color: '#92400E', marginBottom: '12px', lineHeight: '1.4' }}>
              <strong>{title}:</strong> {description}
            </p>
            
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, color: '#92400E', display: 'block', marginBottom: '2px' }}>Importance:</span>
              <span style={{ color: '#B45309' }}>{whyItMatters}</span>
            </div>

            {abnormalIndicators && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, color: '#92400E', display: 'block', marginBottom: '2px' }}>Clinical Context:</span>
                <span style={{ color: '#B45309' }}>{abnormalIndicators}</span>
              </div>
            )}

            {learnMoreLink && (
              <a 
                href={learnMoreLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="learn-more-link"
                style={{ 
                  color: '#1D9E75', 
                  fontWeight: 600, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  textDecoration: 'none',
                  marginTop: '12px',
                  borderTop: '1px solid #FEF3C7',
                  paddingTop: '8px'
                }}
              >
                Learn more on Wikipedia <ExternalLink size={12} />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HealthInfoCard;
