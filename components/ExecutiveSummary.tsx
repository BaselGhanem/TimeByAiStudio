
import React from 'react';
import { DailyReport } from '../types';

interface Props {
  report: Partial<DailyReport> | null;
  loading: boolean;
  onAnalyze: () => void;
}

const ExecutiveSummary: React.FC<Props> = ({ report, loading, onAnalyze }) => {
  if (!report && !loading) {
    return (
      <div className="glass p-8 rounded-2xl shadow-xl text-center">
        <h3 className="text-xl font-bold mb-4">Strategic Layer Inactive</h3>
        <p className="text-slate-400 mb-6 max-w-sm mx-auto">
          Process your behavioral data through the Gemini Engine to unlock CEO Mode and narrative insights.
        </p>
        <button 
          onClick={onAnalyze}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-indigo-900/40"
        >
          Initialize Intelligence
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-indigo-400 animate-pulse font-mono uppercase tracking-widest text-xs">Processing Neural Patterns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-2xl shadow-xl border-t-4 border-indigo-500">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </span>
          CEO Mode: Executive Summary
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-red-400 uppercase mb-2 tracking-tighter">Primary Risk</h4>
            <p className="text-sm text-slate-200">{report.ceoSummary?.topRisk}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2 tracking-tighter">Growth Opportunity</h4>
            <p className="text-sm text-slate-200">{report.ceoSummary?.topOpportunity}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 tracking-tighter">Core Directive</h4>
            <p className="text-sm text-slate-200 font-bold">{report.ceoSummary?.recommendation}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Behavioral Narrative</h4>
          <div className="text-slate-300 leading-relaxed space-y-4">
            {report.narrative?.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
