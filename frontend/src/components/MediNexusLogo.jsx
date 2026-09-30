import React from 'react';

/**
 * MediNexus Brand Logo Component
 * Incorporates a clinical intelligence symbol (connected hexagon + pulse cross)
 * with modern typography and optional tagline.
 */
const MediNexusLogo = ({ 
  size = 'md', 
  showTagline = false, 
  variant = 'light', // 'light' (on white/light bg) or 'dark' (on dark navy bg)
  className = '',
  onClick
}) => {
  // Sizing definitions
  const sizeMap = {
    sm: { icon: 28, text: 'text-base', tagline: 'text-[9px]' },
    md: { icon: 36, text: 'text-xl', tagline: 'text-[10px]' },
    lg: { icon: 44, text: 'text-2xl', tagline: 'text-xs' },
    xl: { icon: 54, text: 'text-3xl', tagline: 'text-xs' },
  };

  const { icon, text, tagline } = sizeMap[size] || sizeMap.md;
  const isDark = variant === 'dark';

  return (
    <div 
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Precision Clinical Hexagon Pulse Icon */}
      <div 
        className="relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-xs transition-transform duration-200 hover:scale-105"
        style={{ width: icon, height: icon }}
      >
        <svg 
          viewBox="0 0 44 44" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="medinexusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F9D8A" />
              <stop offset="100%" stopColor="#0A7A6B" />
            </linearGradient>
            <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#A7F3D0" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F9D8A" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Hexagonal Shield Background */}
          <path 
            d="M22 2L39 11.8V32.2L22 42L5 32.2V11.8L22 2Z" 
            fill="url(#medinexusGrad)" 
            filter="url(#glowFilter)"
          />

          {/* Inner Geometric Shield Accent */}
          <path 
            d="M22 6L35 13.5V30.5L22 38L9 30.5V13.5L22 6Z" 
            stroke="#5EEAD4" 
            strokeWidth="1.2" 
            strokeOpacity="0.4"
            fill="none"
          />

          {/* Connected Healthcare Pulse Line */}
          <path 
            d="M11 22H16L18.5 17L22 27L25 19L27 22H33" 
            stroke="url(#pulseGrad)" 
            strokeWidth="2.8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Neural Connection Nodes */}
          <circle cx="11" cy="22" r="2.2" fill="#FFFFFF" />
          <circle cx="33" cy="22" r="2.2" fill="#FFFFFF" />
          <circle cx="22" cy="11.5" r="1.6" fill="#A7F3D0" />
          <circle cx="22" cy="32.5" r="1.6" fill="#A7F3D0" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className={`font-black tracking-tight leading-none ${text} flex items-center`}>
          <span className={isDark ? 'text-white' : 'text-slate-900'}>Medi</span>
          <span className="text-[#0F9D8A]">Nexus</span>
        </div>
        {showTagline && (
          <span className={`font-semibold tracking-wide uppercase mt-1 leading-tight ${tagline} ${isDark ? 'text-teal-300/80' : 'text-slate-500'}`}>
            Clinical Intelligence
          </span>
        )}
      </div>
    </div>
  );
};

export default MediNexusLogo;
