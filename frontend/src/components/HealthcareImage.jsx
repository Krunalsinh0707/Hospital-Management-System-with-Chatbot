import React, { useState } from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

const HealthcareImage = ({
  src,
  alt = 'Healthcare Visual',
  variant = 'card',
  aspectRatio = 'aspect-video',
  className = '',
  loading = 'lazy',
  badgeText,
  badgeSubtext,
  showOverlay = false,
  overlayTitle,
  overlaySubtitle
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const variantStyles = {
    hero: 'rounded-3xl shadow-2xl border-4 border-white/90 ring-1 ring-slate-900/5',
    section: 'rounded-2xl shadow-xl border border-slate-200/80',
    card: 'rounded-xl shadow-md border border-slate-100',
    department: 'rounded-2xl shadow-md border border-slate-100 group-hover:scale-105 transition-transform duration-500',
    feature: 'rounded-xl shadow-sm border border-teal-100/50'
  };

  const selectedVariantStyle = variantStyles[variant] || variantStyles.card;

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${selectedVariantStyle} ${className} bg-slate-100`}>
      {/* Loading Skeleton */}
      {!isLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse flex items-center justify-center">
          <Activity size={28} className="text-teal-400 opacity-40 animate-spin" />
        </div>
      )}

      {/* Main Image or Fallback */}
      {!imageError ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover object-center transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        /* Clean Healthcare Fallback UI */
        <div className="w-full h-full bg-gradient-to-br from-teal-900 via-slate-900 to-teal-950 p-6 flex flex-col justify-between text-white relative">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 backdrop-blur-md border border-teal-400/30 flex items-center justify-center text-teal-300">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-md">
              Health Analyzer AI
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">{alt}</h4>
            <p className="text-xs text-teal-200/90 mt-0.5">Verified Medical Visual</p>
          </div>
        </div>
      )}

      {/* Optional Gradient Overlay for Text Readability */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-5 text-white">
          {overlayTitle && <h3 className="text-lg font-black tracking-tight">{overlayTitle}</h3>}
          {overlaySubtitle && <p className="text-xs text-teal-200/90 font-medium mt-0.5">{overlaySubtitle}</p>}
        </div>
      )}

      {/* Floating Glassmorphism Badge */}
      {badgeText && (
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-100/80 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-extrabold text-slate-800 tracking-tight">{badgeText}</span>
          </div>
          {badgeSubtext && (
            <span className="text-xs font-bold text-[#0F9D8A] bg-teal-50 px-2.5 py-1 rounded-md">
              {badgeSubtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthcareImage;
