import React from 'react';

/**
 * HealthIllustrations - A collection of inline SVG medical illustrations.
 * Designed for both light and dark backgrounds.
 */

export const BloodDrop = ({ size = 20, color = "#EF4444" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C15.866 22 19 18.866 19 15C19 11.134 12 3 12 3C12 3 5 11.134 5 15C5 18.866 8.134 22 12 22Z" fill={color} fillOpacity="0.8" />
    <path d="M10 15C10 13.8954 10.8954 13 12 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const HeartIcon = ({ size = 20, color = "#1D9E75" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill={color} fillOpacity="0.8" />
  </svg>
);

export const LungIcon = ({ size = 20, color = "#0EA5E9" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3C4.68629 3 2 5.68629 2 9C2 12.3137 4.68629 15 8 15V3Z" fill={color} fillOpacity="0.8" />
    <path d="M16 3V15C19.3137 15 22 12.3137 22 9C22 5.68629 19.3137 3 16 3Z" fill={color} fillOpacity="0.8" />
    <path d="M12 15V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M12 3V15" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PancreasSVG = ({ className = "" }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M100 150C100 120 150 100 200 100C250 100 300 120 300 150C300 180 250 200 200 200C150 200 100 180 100 150Z" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2" />
    <circle cx="200" cy="150" r="10" fill="#F59E0B" fillOpacity="0.6" />
    <path d="M180 150L220 150M200 130L200 170" stroke="#F59E0B" strokeWidth="1.5" />
    <text x="200" y="240" textAnchor="middle" fill="#B45309" fontWeight="600" fontSize="14">Anatomic Pancreas Visualization</text>
    <rect x="170" y="20" width="60" height="260" rx="30" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
  </svg>
);

export const HeartAnatomySVG = ({ className = "" }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2DD4BF" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <path d="M200 50C150 50 120 100 120 150C120 220 200 250 200 250C200 250 280 220 280 150C280 100 250 50 200 50Z" fill="url(#riskGradient)" fillOpacity="0.2" stroke="url(#riskGradient)" strokeWidth="2" />
    <path d="M180 100V150H130" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
    <path d="M220 100V150H270" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <text x="200" y="280" textAnchor="middle" fill="#64748B" fontWeight="600" fontSize="14">Multi-Chamber Cardiac Mapping</text>
  </svg>
);

export const BloodVesselSVG = ({ className = "" }) => (
  <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Normal Artery */}
    <rect x="50" y="50" width="120" height="60" rx="30" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="2" />
    <rect x="80" y="65" width="60" height="30" rx="15" fill="#10B981" fillOpacity="0.3" />
    <text x="110" y="140" textAnchor="middle" fill="#065F46" fontSize="12" fontWeight="600">Normal Artery</text>
    
    {/* Narrowed Artery */}
    <rect x="230" y="50" width="120" height="60" rx="30" fill="#EF4444" fillOpacity="0.1" stroke="#EF4444" strokeWidth="2" />
    <path d="M260 80C270 70 310 70 320 80" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
    <path d="M260 80C270 90 310 90 320 80" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
    <text x="290" y="140" textAnchor="middle" fill="#991B1B" fontSize="12" fontWeight="600">Narrowed (Hypertension)</text>
  </svg>
);

export const MicroscopeSVG = ({ className = "" }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="200" cy="150" r="100" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="4" />
    <circle cx="150" cy="120" r="12" fill="#EF4444" fillOpacity="0.6" />
    <circle cx="230" cy="180" r="15" fill="#EF4444" fillOpacity="0.4" />
    <circle cx="210" cy="110" r="8" fill="#3B82F6" fillOpacity="0.5" />
    <circle cx="170" cy="190" r="10" fill="#EF4444" fillOpacity="0.6" />
    <circle cx="260" cy="140" r="6" fill="#EF4444" fillOpacity="0.3" />
    <text x="200" y="280" textAnchor="middle" fill="#64748B" fontWeight="600" fontSize="14">Digital Hematology View</text>
  </svg>
);

export const PulseWatermark = ({ className = "" }) => (
  <svg viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M0 100H200L220 40L250 160L280 100H400L420 20L460 180L500 100H800" stroke="#1D9E75" strokeWidth="2" strokeOpacity="0.08" />
  </svg>
);
