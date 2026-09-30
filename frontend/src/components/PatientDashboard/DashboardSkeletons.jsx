import React from 'react';

export const MetricSkeleton = () => (
  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs animate-pulse">
    <div className="flex justify-between items-center mb-3">
      <div className="h-3 w-20 bg-slate-200 rounded" />
      <div className="h-4 w-12 bg-slate-200 rounded" />
    </div>
    <div className="h-7 w-28 bg-slate-200 rounded mb-3" />
    <div className="h-3 w-24 bg-slate-100 rounded" />
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs animate-pulse mb-8">
    <div className="h-3 w-28 bg-slate-200 rounded mb-2" />
    <div className="h-6 w-36 bg-slate-200 rounded mb-6" />
    <div className="h-56 bg-slate-100 rounded-xl mb-3" />
    <div className="h-3 w-48 bg-slate-100 rounded" />
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs animate-pulse mb-6">
    <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
    <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
    <div className="space-y-3">
      <div className="h-12 bg-slate-100 rounded-xl" />
      <div className="h-12 bg-slate-100 rounded-xl" />
    </div>
  </div>
);
