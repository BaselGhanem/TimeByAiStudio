
import { TaskEntry } from "../types";
// Import XLSX to fix "Cannot find name 'XLSX'" errors
import * as XLSX from 'xlsx';

const STORAGE_KEY = "TIME_BRAIN_V5_DATA";

export const getStoredEntries = (): TaskEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveEntries = (entries: TaskEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const exportToExcel = (entries: TaskEntry[]) => {
  const ws_data = entries.map(e => ({
    Date: e.date,
    Category: e.category,
    Description: e.description,
    Start: e.startTime,
    Duration: e.duration
  }));
  
  // Use imported XLSX object to handle workbook and sheet creation
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Behavior Log");
  
  // Database sheet for restoration
  const ws_raw = XLSX.utils.json_to_sheet(entries);
  XLSX.utils.book_append_sheet(wb, ws_raw, "RAW_DATABASE");
  
  XLSX.writeFile(wb, `TimeBrain_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const importFromExcel = (file: File): Promise<TaskEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Use imported XLSX object to read binary data from file
        const workbook = XLSX.read(data, { type: 'binary' });
        const rawSheet = workbook.Sheets["RAW_DATABASE"];
        if (!rawSheet) throw new Error("Invalid backup: Missing RAW_DATABASE sheet.");
        const json = XLSX.utils.sheet_to_json(rawSheet) as TaskEntry[];
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};
