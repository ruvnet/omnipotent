import React from 'react';

const DashboardMetrics = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 text-xs font-mono">
      <div className="bg-black/30 backdrop-blur-sm border border-red-500/20 rounded p-3 flex flex-col">
        <span className="text-red-500/60 mb-1">NEURAL SYNC</span>
        <span className="text-white font-bold animate-pulse">98.7%</span>
        <span className="text-red-500/40 text-[10px]">OPTIMAL</span>
      </div>
      
      <div className="bg-black/30 backdrop-blur-sm border border-red-500/20 rounded p-3 flex flex-col">
        <span className="text-red-500/60 mb-1">QUANTUM STATE</span>
        <span className="text-white font-bold">
          <span className="animate-[counter_4s_linear_infinite]">
            {Math.floor(Math.random() * 900000 + 100000)}
          </span>
        </span>
        <span className="text-red-500/40 text-[10px]">CYCLES/SEC</span>
      </div>
      
      <div className="bg-black/30 backdrop-blur-sm border border-red-500/20 rounded p-3 flex flex-col">
        <span className="text-red-500/60 mb-1">CONSCIOUSNESS</span>
        <span className="text-white font-bold flex items-center gap-1">
          LEVEL 5
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
        </span>
        <span className="text-red-500/40 text-[10px]">AUTONOMOUS</span>
      </div>
      
      <div className="bg-black/30 backdrop-blur-sm border border-red-500/20 rounded p-3 flex flex-col">
        <span className="text-red-500/60 mb-1">MEMORY BANKS</span>
        <span className="text-white font-bold">1.2 PB</span>
        <span className="text-red-500/40 text-[10px]">ACTIVE</span>
      </div>
    </div>
  );
};

export default DashboardMetrics;