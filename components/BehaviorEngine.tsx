
import React, { useState } from 'react';
import { ActivityCategory, TaskEntry } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';

interface Props {
  onAddEntry: (entry: Omit<TaskEntry, 'id'>) => void;
  currentDate: string;
}

const BehaviorEngine: React.FC<Props> = ({ onAddEntry, currentDate }) => {
  const [category, setCategory] = useState<ActivityCategory>(ActivityCategory.DEEP_WORK);
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [duration, setDuration] = useState<number>(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    onAddEntry({
      date: currentDate,
      category,
      description,
      startTime,
      duration,
    });
    setDescription('');
  };

  return (
    <div className="glass p-6 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
        </span>
        Behavior Capture
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">Context</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {Object.values(ActivityCategory).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-2 rounded-lg text-[10px] md:text-xs flex flex-col items-center gap-1 border transition-all ${
                    category === cat ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {CATEGORY_ICONS[cat]}
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{cat}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="col-span-2">
            <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">Task/Context Details</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did your brain focus on?"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs uppercase text-slate-400 font-semibold mb-1 block">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20 uppercase tracking-widest text-xs"
        >
          Inject to Timeline
        </button>
      </form>
    </div>
  );
};

export default BehaviorEngine;
