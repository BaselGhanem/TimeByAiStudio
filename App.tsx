
import React, { useState, useEffect, useMemo } from 'react';
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
    if (data) setEntries(data);
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
    
    const arrivalEntry = dailyEntries.find(e => e.category === ActivityCategory.ARRIVAL);
    const arrivalTime = arrivalEntry ? arrivalEntry.startTime : "Pending";

    return { totalMinutes, workMinutes, deepMinutes, arrivalTime };
  }, [dailyEntries]);

  const pieData = useMemo(() => {
    const groups = dailyEntries.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.duration;
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(groups).map(([name, value]) => ({ name, value }));
    return data.length > 0 ? data : [{ name: 'No Data', value: 1 }];
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
        alert("Personal Intelligence Vault Restored.");
      } catch (err) {
        alert("Vault Restoration Failed: " + (err as Error).message);
      }
    }
  };

  return (
    <div className="min-h-screen pb-24 p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white">TIME BRAIN <span className="text-blue-500 italic">V5</span></h1>
          <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase">Behavior Intelligence System</p>
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
            className="p-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-slate-400"
            title="Vault Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center animate-in fade-in zoom-in duration-200">
          <div className="flex-1">
            <h3 className="text-sm font-bold uppercase text-slate-300 mb-1">Vault Management</h3>
            <p className="text-xs text-slate-500 italic">"Privacy is power. This data is yours alone."</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => exportToExcel(entries)}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-600 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Archive to Excel
            </button>
            <label className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer border border-slate-600 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Restore Vault
              <input type="file" className="hidden" accept=".xlsx" onChange={handleImport} />
            </label>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl cockpit-card border-l-amber-500">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Arrival Anchor</span>
          <div className="text-3xl font-black text-amber-500 tracking-tighter">{stats.arrivalTime}</div>
          <div className="mt-4 text-[9px] text-slate-500 font-bold uppercase">Chronological Baseline</div>
        </div>
        <div className="glass p-6 rounded-2xl cockpit-card border-l-blue-500">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Deep Brain Hours</span>
          <div className="text-3xl font-black text-blue-400 tracking-tighter">{Math.round(stats.deepMinutes / 60 * 10) / 10}h</div>
          <div className="w-full bg-slate-800 h-1 mt-4 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats.deepMinutes / 240) * 100)}%` }}></div>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl cockpit-card border-l-emerald-500">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Execution Index</span>
          <div className="text-3xl font-black text-emerald-400 tracking-tighter">{Math.round(stats.workMinutes / 60 * 10) / 10}h</div>
          <div className="mt-4 text-[9px] text-slate-500 font-bold uppercase">Contextual Capacity</div>
        </div>
        <div className="glass p-4 rounded-2xl cockpit-card border-l-indigo-500 flex items-center justify-center min-h-[120px]">
          {dailyEntries.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={pieData} innerRadius={30} outerRadius={40} dataKey="value" stroke="none" animationBegin={0} animationDuration={800}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as ActivityCategory] || '#1e293b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-[10px] font-black text-slate-600 uppercase text-center">Awaiting Calibration</div>
          )}
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-8 order-2 lg:order-1">
          <BehaviorEngine onAddEntry={handleAddEntry} currentDate={currentDate} />
          
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-800 pb-2">Behavioral Spectrum</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: color }}></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase truncate">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-8 space-y-8 order-1 lg:order-2">
          <Timeline entries={dailyEntries} onDelete={handleDeleteEntry} />
          <ExecutiveSummary report={report} loading={loading} onAnalyze={handleAnalyze} />
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 text-center z-50">
        <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.4em]">
          Time Brain V5 • Decision Mirror • Basel Behavioral Engine • Local First
        </p>
      </footer>
    </div>
  );
};

export default App;
