
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskEntry, ActivityCategory, DailyReport } from './types';
import { getStoredEntries, saveEntries, exportToExcel, importFromExcel } from './services/storageService';
import { analyzeDay } from './services/geminiService';
import BehaviorEngine from './components/BehaviorEngine';
import Timeline from './components/Timeline';
import ExecutiveSummary from './components/ExecutiveSummary';
import { CATEGORY_COLORS } from './constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const App: React.FC = () => {
  const [entries, setEntries] = useState<TaskEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<Partial<DailyReport> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const data = getStoredEntries();
    setEntries(data);
  }, []);

  const dailyEntries = useMemo(() => 
    entries.filter(e => e.date === currentDate),
  [entries, currentDate]);

  const stats = useMemo(() => {
    const totalMinutes = dailyEntries.reduce((acc, curr) => acc + curr.duration, 0);
    const workMinutes = dailyEntries
      .filter(e => [ActivityCategory.DEEP_WORK, ActivityCategory.SHALLOW_WORK, ActivityCategory.FIELD_ACTIVITY].includes(e.category))
      .reduce((acc, curr) => acc + curr.duration, 0);
    const deepMinutes = dailyEntries
      .filter(e => e.category === ActivityCategory.DEEP_WORK)
      .reduce((acc, curr) => acc + curr.duration, 0);
    
    // Arrival logic
    const arrivalEntry = dailyEntries.find(e => e.category === ActivityCategory.ARRIVAL);
    const arrivalTime = arrivalEntry ? arrivalEntry.startTime : "Not Recorded";

    return { totalMinutes, workMinutes, deepMinutes, arrivalTime };
  }, [dailyEntries]);

  const pieData = useMemo(() => {
    const groups = dailyEntries.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.duration;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [dailyEntries]);

  const handleAddEntry = (newEntry: Omit<TaskEntry, 'id'>) => {
    const entry: TaskEntry = {
      ...newEntry,
      id: Math.random().toString(36).substr(2, 9),
    };
    const updated = [...entries, entry];
    setEntries(updated);
    saveEntries(updated);
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  };

  const handleAnalyze = async () => {
    if (dailyEntries.length === 0) return;
    setLoading(true);
    const res = await analyzeDay(dailyEntries, currentDate);
    setReport(res);
    setLoading(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const imported = await importFromExcel(e.target.files[0]);
        const updated = [...entries, ...imported].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setEntries(updated);
        saveEntries(updated);
        alert("Backup restored successfully.");
      } catch (err) {
        alert("Failed to restore backup: " + (err as Error).message);
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white">TIME BRAIN <span className="text-blue-500 italic">V5</span></h1>
          <p className="text-slate-500 font-medium tracking-wide">BEHAVIOR INTELLIGENCE SYSTEM</p>
        </div>
        
        <div className="flex items-center gap-4">
          <input 
            type="date" 
            value={currentDate} 
            onChange={(e) => { setCurrentDate(e.target.value); setReport(null); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center animate-in slide-in-from-top duration-300">
          <div className="flex-1">
            <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">Vault Management</h3>
            <p className="text-xs text-slate-500">Your data never leaves your browser unless you export it.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => exportToExcel(entries)}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Excel
            </button>
            <label className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import Backup
              <input type="file" className="hidden" accept=".xlsx" onChange={handleImport} />
            </label>
          </div>
        </div>
      )}

      {/* Analytics Dashboard - Top Layer */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl cockpit-card border-l-amber-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Arrival Target</span>
          <div className="text-3xl font-black mt-1 text-amber-500">{stats.arrivalTime}</div>
          <p className="text-[10px] text-slate-400 mt-2 uppercase">Momentum Anchor Point</p>
        </div>
        <div className="glass p-6 rounded-2xl cockpit-card border-l-blue-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Deep Focus</span>
          <div className="text-3xl font-black mt-1 text-blue-400">{Math.round(stats.deepMinutes / 60 * 10) / 10}h</div>
          <div className="w-full bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (stats.deepMinutes / 240) * 100)}%` }}></div>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl cockpit-card border-l-emerald-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Output</span>
          <div className="text-3xl font-black mt-1 text-emerald-400">{Math.round(stats.workMinutes / 60 * 10) / 10}h</div>
          <p className="text-[10px] text-slate-400 mt-2 uppercase">Core Effort Investment</p>
        </div>
        <div className="glass p-6 rounded-2xl cockpit-card border-l-indigo-500 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                    <Pie data={pieData} innerRadius={30} outerRadius={40} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as ActivityCategory] || '#8884d8'} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </section>

      {/* Main Grid: Input and Visual flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-4 space-y-8 sticky top-8">
          <BehaviorEngine onAddEntry={handleAddEntry} currentDate={currentDate} />
          
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Context Legend</h3>
            <div className="space-y-3">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}></div>
                  <span className="text-xs text-slate-400 font-bold">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-8 space-y-8">
          <Timeline entries={dailyEntries} onDelete={handleDeleteEntry} />
          <ExecutiveSummary report={report} loading={loading} onAnalyze={handleAnalyze} />
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 text-center z-50">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
          Time Brain V5 • Decision Mirror • Basel Engine • No Backend Tracking
        </p>
      </footer>
    </div>
  );
};

export default App;
