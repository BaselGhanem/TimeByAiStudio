
export enum ActivityCategory {
  DEEP_WORK = 'Deep Work',
  SHALLOW_WORK = 'Shallow Work',
  FIELD_ACTIVITY = 'Field Activity',
  ARRIVAL = 'Arrival',
  BREAK = 'Break',
  IDLE = 'Idle Gap'
}

export interface TaskEntry {
  id: string;
  date: string;
  category: ActivityCategory;
  description: string;
  startTime: string; // HH:mm
  duration: number; // minutes
}

export interface DailyReport {
  date: string;
  totalWorkMinutes: number;
  deepFocusMinutes: number;
  idleGapMinutes: number;
  efficiencyScore: number;
  narrative?: string;
  ceoSummary?: {
    topRisk: string;
    topOpportunity: string;
    recommendation: string;
  };
}

export interface AppState {
  entries: TaskEntry[];
  currentDate: string;
  isSettingsOpen: boolean;
}
