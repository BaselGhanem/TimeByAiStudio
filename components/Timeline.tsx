
import React from 'react';
import { TaskEntry, ActivityCategory } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface Props {
  entries: TaskEntry[];
  onDelete: (id: string) => void;
}

const Timeline: React.FC<Props> = ({ entries, onDelete }) => {
  const sorted = [...entries].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const calculateGaps = () => {
    const gaps: { start: string; duration: number }[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i+1];
      
      const currentEnd = new Date(`2000-01-01T${current.startTime}`);
      currentEnd.setMinutes(currentEnd.getMinutes() + current.duration);
      
      const nextStart = new Date(`2000-01-01T${next.startTime}`);
      
      const diff = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      if (diff > 15) {
        gaps.push({ 
          start: currentEnd.toTimeString().slice(0, 5), 
          duration: Math.round(diff) 
        });
      }
    }
    return gaps;
  };

  const gaps = calculateGaps();

  return (
    <div className="glass p-6 rounded-2xl shadow-xl flex-1 flex flex-col">
      <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2">
           <span className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
          Activity Flow
        </span>
        <span className="text-xs text-slate-400 font-normal">{entries.length} segments tracked</span>
      </h2>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
        {sorted.length === 0 && (
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
            No behavioral data found for this period.
          </div>
        )}
        
        {sorted.map((entry, idx) => (
          <React.Fragment key={entry.id}>
            <div className="relative group">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center min-w-[50px]">
                  <span className="text-sm font-bold text-slate-300">{entry.startTime}</span>
                  <div className="w-px h-full bg-slate-700 min-h-[40px] mt-2"></div>
                </div>
                
                <div 
                  className="flex-1 cockpit-card glass p-4 rounded-xl relative hover:bg-slate-800/80 transition-all cursor-default"
                  style={{ borderLeftColor: CATEGORY_COLORS[entry.category] }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-900 border border-slate-700 mb-2 inline-block" style={{ color: CATEGORY_COLORS[entry.category] }}>
                        {entry.category}
                      </span>
                      <p className="text-sm text-slate-200">{entry.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-400">{entry.duration}m</span>
                      <button 
                        onClick={() => onDelete(entry.id)}
                        className="block mt-2 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gap Display */}
            {gaps.find(g => {
                const entryEnd = new Date(`2000-01-01T${entry.startTime}`);
                entryEnd.setMinutes(entryEnd.getMinutes() + entry.duration);
                return g.start === entryEnd.toTimeString().slice(0, 5);
            }) && (
              <div className="flex items-start gap-4 animate-pulse">
                <div className="min-w-[50px]"></div>
                <div className="flex-1 bg-red-900/10 border border-red-500/20 p-2 rounded-lg text-center">
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter">Behavioral Gap Detected: {gaps.find(g => {
                      const entryEnd = new Date(`2000-01-01T${entry.startTime}`);
                      entryEnd.setMinutes(entryEnd.getMinutes() + entry.duration);
                      return g.start === entryEnd.toTimeString().slice(0, 5);
                  })?.duration} minutes lost</span>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
