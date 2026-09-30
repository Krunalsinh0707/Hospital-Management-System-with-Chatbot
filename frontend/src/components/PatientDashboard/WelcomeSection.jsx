import React from 'react';
import { RefreshCw } from 'lucide-react';

const WelcomeSection = ({ userName, lastSyncTime, refreshing, onRefresh }) => {
  // Determine dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format real timestamp
  const formattedTimestamp = React.useMemo(() => {
    if (!lastSyncTime) return 'Synchronizing...';
    try {
      const d = new Date(lastSyncTime);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) + ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  }, [lastSyncTime]);

  const firstName = userName ? userName.trim().split(/\s+/)[0] : 'Patient';

  return (
    <section className="mb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {/* Synchronization Status Pill */}
          <div className="inline-flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold text-[#0D9488] tracking-tight">
              Health data synchronized
            </span>
          </div>

          {/* Large Patient Greeting in Editorial Serif */}
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[40px] font-normal text-slate-900 leading-tight tracking-tight">
            {getGreeting()}, {firstName}
          </h1>

          {/* Supporting Text with Real Timestamp */}
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5">
            Here is what needs your attention today. Last updated {formattedTimestamp}.
          </p>
        </div>

        {/* Refresh Data Button */}
        <div className="shrink-0">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            title="Refresh clinical data from hospital server"
          >
            <RefreshCw 
              size={14} 
              className={`text-[#0D9488] transition-transform ${refreshing ? 'animate-spin' : ''}`} 
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh data'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
