import React, { useState } from 'react';
import { Search, X, UserCheck, ShieldCheck } from 'lucide-react';

export default function StudentSearchBar({
  searchTerm = '',
  onSearchChange,
  placeholder = 'Search by student name or child code…',
  totalCount = 0,
  filteredCount = 0,
  className = ''
}) {
  return (
    <div className={`relative w-full flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="relative flex-1 min-w-[280px]">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4EB8E0]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-[#0F1722]/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-[#8DA0B0] focus:outline-none focus:border-[#4EB8E0] focus:ring-1 focus:ring-[#4EB8E0] shadow-inner font-sans transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8DA0B0] hover:text-white transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] font-mono text-[#8DA0B0] bg-[#132030]/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
        <ShieldCheck className="w-3.5 h-3.5 text-[#3FA88A]" />
        <span>
          Showing <strong className="text-white font-bold">{filteredCount}</strong> {totalCount > 0 ? `of ${totalCount}` : ''} records
        </span>
      </div>
    </div>
  );
}
