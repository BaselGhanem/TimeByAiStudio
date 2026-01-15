import { GoogleGenAI, Type } from "@google/genai";

// --- CONFIG & CONSTANTS ---
const CATEGORIES = {
    DEEP_WORK: { name: 'Deep Work', color: '#3b82f6', icon: '⚡' },
    SHALLOW_WORK: { name: 'Shallow Work', color: '#6366f1', icon: '📝' },
    FIELD_ACTIVITY: { name: 'Field Activity', color: '#10b981', icon: '🌍' },
    ARRIVAL: { name: 'Arrival', color: '#f59e0b', icon: '🏁' },
    BREAK: { name: 'Break', color: '#64748b', icon: '☕' },
    IDLE: { name: 'Idle Gap', color: '#ef4444', icon: '⚠️' }
};

const STORAGE_KEY = "TIME_BRAIN_V5_DATA";

// --- STATE MANAGEMENT ---
let state = {
    entries: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
    currentDate: new Date().toISOString().split('T')[0],
    report: null,
    loading: false,
    chart: null
};

// --- CORE UTILS ---
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));

const getDailyEntries = () => state.entries
    .filter(e => e.date === state.currentDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

// --- UI RENDERERS ---
const renderDashboard = () => {
    const daily = getDailyEntries();
    const deepMinutes = daily.filter(e => e.category === 'Deep Work').reduce((s, e) => s + e.duration, 0);
    const workMinutes = daily.filter(e => ['Deep Work', 'Shallow Work', 'Field Activity'].includes(e.category)).reduce((s, e) => s + e.duration, 0);
    const arrival = daily.find(e => e.category === 'Arrival')?.startTime || 'Pending';

    const container = document.getElementById('dashboardStats');
    container.innerHTML = `
        <div class="glass p-6 rounded-2xl cockpit-card border-l-amber-500">
            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Arrival Anchor</span>
            <div class="text-3xl font-black text-amber-500 tracking-tighter">${arrival}</div>
        </div>
        <div class="glass p-6 rounded-2xl cockpit-card border-l-blue-500">
            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Deep Brain Hours</span>
            <div class="text-3xl font-black text-blue-400 tracking-tighter">${(deepMinutes/60).toFixed(1)}h</div>
        </div>
        <div class="glass p-6 rounded-2xl cockpit-card border-l-emerald-500">
            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Execution Index</span>
            <div class="text-3xl font-black text-emerald-400 tracking-tighter">${(workMinutes/60).toFixed(1)}h</div>
        </div>
        <div class="glass p-4 rounded-2xl cockpit-card border-l-indigo-500 flex items-center justify-center h-[120px]">
            <canvas id="donutChart"></canvas>
        </div>
    `;
    renderChart(daily);
};

const renderChart = (daily) => {
    const ctx = document.getElementById('donutChart');
    if (!ctx) return;
    if (state.chart) state.chart.destroy();

    const dataMap = {};
    daily.forEach(e => dataMap[e.category] = (dataMap[e.category] || 0) + e.duration);
    
    const labels = Object.keys(dataMap);
    if (labels.length === 0) return;

    state.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(dataMap),
                backgroundColor: labels.map(l => Object.values(CATEGORIES).find(c => c.name === l)?.color || '#1e293b'),
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            maintainAspectRatio: false
        }
    });
};

const renderCapture = () => {
    const container = document.getElementById('captureEngine');
    container.innerHTML = `
        <div class="glass p-6 rounded-2xl shadow-xl">
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <span class="p-2 bg-blue-500/20 rounded-lg text-blue-400">⚡</span> Behavior Capture
            </h2>
            <form id="taskForm" class="space-y-4">
                <div class="grid grid-cols-3 gap-2" id="categoryGrid">
                    ${Object.values(CATEGORIES).map(cat => `
                        <button type="button" data-cat="${cat.name}" class="cat-btn p-2 rounded-lg text-[10px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 transition-all flex flex-col items-center">
                            <span>${cat.icon}</span>
                            <span class="truncate w-full text-center">${cat.name}</span>
                        </button>
                    `).join('')}
                </div>
                <input type="text" id="desc" placeholder="Details..." class="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white" required>
                <div class="grid grid-cols-2 gap-4">
                    <input type="time" id="stime" class="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white" required>
                    <input type="number" id="dur" placeholder="Min" class="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white" required>
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg uppercase tracking-widest text-xs shadow-lg">Inject to Timeline</button>
            </form>
        </div>
    `;

    // Add event listeners for cat selection
    let selectedCat = 'Deep Work';
    const btns = container.querySelectorAll('.cat-btn');
    const updateBtns = (target) => {
        btns.forEach(b => b.classList.remove('border-blue-500', 'bg-blue-500/10', 'text-blue-400'));
        target.classList.add('border-blue-500', 'bg-blue-500/10', 'text-blue-400');
        selectedCat = target.dataset.cat;
    };
    btns.forEach(b => {
        if (b.dataset.cat === selectedCat) updateBtns(b);
        b.onclick = (e) => updateBtns(e.currentTarget);
    });

    // Default time to now
    document.getElementById('stime').value = new Date().toTimeString().slice(0, 5);
    document.getElementById('dur').value = 30;

    document.getElementById('taskForm').onsubmit = (e) => {
        e.preventDefault();
        const entry = {
            id: Math.random().toString(36).substr(2, 9),
            date: state.currentDate,
            category: selectedCat,
            description: document.getElementById('desc').value,
            startTime: document.getElementById('stime').value,
            duration: parseInt(document.getElementById('dur').value)
        };
        state.entries.push(entry);
        save();
        init();
    };
};

const renderTimeline = () => {
    const daily = getDailyEntries();
    const container = document.getElementById('timelineContainer');
    
    let html = `
        <div class="glass p-6 rounded-2xl shadow-xl flex-1">
            <h2 class="text-xl font-bold mb-6 flex items-center justify-between">
                <span class="flex items-center gap-2">🌍 Activity Flow</span>
                <span class="text-xs text-slate-500">${daily.length} nodes recorded</span>
            </h2>
            <div class="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
    `;

    if (daily.length === 0) {
        html += `<div class="text-center py-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">Mirror is empty. Log behavioral data.</div>`;
    }

    daily.forEach((e, i) => {
        const cat = Object.values(CATEGORIES).find(c => c.name === e.category);
        html += `
            <div class="flex items-start gap-4 animate-entry">
                <div class="flex flex-col items-center min-w-[50px]">
                    <span class="text-sm font-bold text-slate-400">${e.startTime}</span>
                    <div class="w-px h-full bg-slate-800 min-h-[30px] mt-2"></div>
                </div>
                <div class="flex-1 cockpit-card glass p-4 rounded-xl relative group" style="border-left-color: ${cat.color}">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-slate-900 border border-slate-800 mb-2 inline-block" style="color: ${cat.color}">${e.category}</span>
                            <p class="text-sm text-slate-200">${e.description}</p>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-[10px] font-bold text-slate-500">${e.duration}m</span>
                            <button onclick="deleteEntry('${e.id}')" class="text-slate-700 hover:text-red-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Gap detection
        if (daily[i+1]) {
            const end = new Date(`2000-01-01T${e.startTime}`);
            end.setMinutes(end.getMinutes() + e.duration);
            const nextStart = new Date(`2000-01-01T${daily[i+1].startTime}`);
            const gap = (nextStart - end) / 60000;
            if (gap > 15) {
                html += `<div class="flex items-center gap-4 py-2 opacity-50"><div class="min-w-[50px]"></div><div class="flex-1 text-center text-[9px] font-black text-red-500 uppercase tracking-tighter border-y border-red-500/20 py-1">GAP: ${Math.round(gap)}m Lapsed</div></div>`;
            }
        }
    });

    html += `</div></div>`;
    container.innerHTML = html;
};

const renderExecutive = () => {
    const container = document.getElementById('executiveContainer');
    if (!state.report && !state.loading) {
        container.innerHTML = `
            <div class="glass p-8 rounded-2xl shadow-xl text-center">
                <h3 class="text-xl font-bold mb-4">Strategic Layer Inactive</h3>
                <button id="analyzeBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-indigo-900/40">Initialize Intelligence</button>
            </div>
        `;
        document.getElementById('analyzeBtn').onclick = analyze;
    } else if (state.loading) {
        container.innerHTML = `<div class="glass p-8 rounded-2xl flex flex-col items-center min-h-[200px] justify-center"><div class="animate-spin h-8 w-8 border-2 border-indigo-500 rounded-full border-t-transparent mb-4"></div><p class="text-xs uppercase tracking-widest text-indigo-400">Processing Neural Patterns...</p></div>`;
    } else {
        container.innerHTML = `
            <div class="glass p-6 rounded-2xl border-t-4 border-indigo-500 shadow-xl animate-entry">
                <h2 class="text-xl font-bold mb-4 text-white">CEO Mode Summary</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-red-500/10 border border-red-500/20 p-3 rounded-xl"><h4 class="text-[9px] font-black text-red-400 uppercase mb-1">Risk</h4><p class="text-xs">${state.report.ceoSummary.topRisk}</p></div>
                    <div class="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl"><h4 class="text-[9px] font-black text-emerald-400 uppercase mb-1">Opportunity</h4><p class="text-xs">${state.report.ceoSummary.topOpportunity}</p></div>
                    <div class="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl"><h4 class="text-[9px] font-black text-blue-400 uppercase mb-1">Directive</h4><p class="text-xs font-bold">${state.report.ceoSummary.recommendation}</p></div>
                </div>
                <div class="text-slate-300 text-sm leading-relaxed space-y-4">${state.report.narrative.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>
            </div>
        `;
    }
};

const renderLegend = () => {
    const container = document.getElementById('legend');
    container.innerHTML = `
        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-800 pb-2">Behavioral Spectrum</h3>
        <div class="grid grid-cols-2 gap-4">
            ${Object.values(CATEGORIES).map(cat => `
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" style="background-color: ${cat.color}"></div>
                    <span class="text-[10px] text-slate-500 font-bold uppercase">${cat.name}</span>
                </div>
            `).join('')}
        </div>
    `;
};

// --- CORE ACTIONS ---
window.deleteEntry = (id) => {
    state.entries = state.entries.filter(e => e.id !== id);
    save();
    init();
};

const analyze = async () => {
    const daily = getDailyEntries();
    if (daily.length === 0) return alert("Log data first.");
    state.loading = true;
    renderExecutive();

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze behavior for ${state.currentDate}: ${JSON.stringify(daily)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        narrative: { type: Type.STRING },
                        ceoSummary: {
                            type: Type.OBJECT,
                            properties: {
                                topRisk: { type: Type.STRING },
                                topOpportunity: { type: Type.STRING },
                                recommendation: { type: Type.STRING }
                            },
                            required: ["topRisk", "topOpportunity", "recommendation"]
                        }
                    },
                    required: ["narrative", "ceoSummary"]
                }
            }
        });
        state.report = JSON.parse(response.text);
    } catch (e) {
        console.error(e);
        state.report = { narrative: "Intelligence connection failed.", ceoSummary: { topRisk: "Offline", topOpportunity: "Manual Review", recommendation: "Reconnect" } };
    }
    state.loading = false;
    renderExecutive();
};

const exportData = () => {
    const ws = XLSX.utils.json_to_sheet(state.entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RawData");
    XLSX.writeFile(wb, `TimeBrain_Backup_${state.currentDate}.xlsx`);
};

const importData = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const wb = XLSX.read(event.target.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        state.entries = data;
        save();
        init();
    };
    reader.readAsBinaryString(e.target.files[0]);
};

// --- INITIALIZATION ---
const init = () => {
    renderDashboard();
    renderCapture();
    renderTimeline();
    renderExecutive();
    renderLegend();
};

document.getElementById('dateSelector').value = state.currentDate;
document.getElementById('dateSelector').onchange = (e) => {
    state.currentDate = e.target.value;
    state.report = null;
    init();
};

document.getElementById('toggleSettings').onclick = () => document.getElementById('settingsPanel').classList.toggle('hidden');
document.getElementById('exportBtn').onclick = exportData;
document.getElementById('importFile').onchange = importData;

init();