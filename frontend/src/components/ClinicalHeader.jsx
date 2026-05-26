import React from 'react';
import { Search, Bell, User, ShieldCheck, Menu } from 'lucide-react';

const ClinicalHeader = ({ title, subtitle, showSearch = true, onMenuClick }) => {
  return (
    <header className="col-span-12 flex flex-col md:flex-row items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-30 mb-2">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
        >
          <Menu size={20} />
        </button>
        <div className="w-10 h-10 bg-[#0F9D8A] rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-600/20 shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-[20px] lg:text-[24px] font-bold text-slate-900 leading-none mb-1 truncate">{title}</h1>
          <p className="text-[10px] lg:text-[12px] font-semibold text-slate-400 uppercase tracking-wider truncate">{subtitle}</p>
        </div>
      </div>

      {showSearch && (
        <div className="flex-1 max-w-xl px-8 hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Query patient records or clinical models..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D8A]/20 focus:border-[#0F9D8A] transition-all"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 lg:gap-6 mt-4 md:mt-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Live Status ● Connected</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-[#0F9D8A] transition-colors relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClinicalHeader;
