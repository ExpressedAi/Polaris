import { entityStorage } from '../services/storage';
import { downloadJSON } from './helpers';

export interface ExportData {
  version: string;
  exportDate: number;
  data: {
    brand: any[];
    people: any[];
    concepts: any[];
    journal: any[];
    agenda: any[];
    deliverables: any[];
    calendar: any[];
    pomodoro: any[];
    goals: any[];
    threads: any[];
    messages: any[];
  };
  settings: Record<string, any>;
}

export const exportAllData = async (): Promise<ExportData> => {
  const [
    brand,
    people,
    concepts,
    journal,
    agenda,
    deliverables,
    calendar,
    pomodoro,
    goals,
    threads,
    messages,
  ] = await Promise.all([
    entityStorage.getBrandRecords(),
    entityStorage.getPeopleRecords(),
    entityStorage.getConceptRecords(),
    entityStorage.getJournalEntries(),
    entityStorage.getAgendaItems(),
    entityStorage.getDeliverables(),
    entityStorage.getCalendarEvents(),
    entityStorage.getPomodoroSessions(),
    entityStorage.getGoals(),
    entityStorage.getThreads(),
    entityStorage.getMessages(),
  ]);

  // Get all settings from localStorage
  const settings: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !key.startsWith('polaris_')) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          settings[key] = JSON.parse(value);
        } catch {
          settings[key] = value;
        }
      }
    }
  }

  return {
    version: '1.0.0',
    exportDate: Date.now(),
    data: {
      brand,
      people,
      concepts,
      journal,
      agenda,
      deliverables,
      calendar,
      pomodoro,
      goals,
      threads,
      messages,
    },
    settings,
  };
};

export const downloadExport = async (filename?: string) => {
  const data = await exportAllData();
  const name = filename || `polaris-backup-${new Date().toISOString().split('T')[0]}.json`;
  downloadJSON(data, name);
};

export const importData = async (data: ExportData, options: {
  merge?: boolean;
  overwrite?: boolean;
} = {}): Promise<{ success: boolean; error?: string }> => {
  try {
    const { merge = false, overwrite = false } = options;

    // Import brand records
    if (data.data.brand) {
      for (const record of data.data.brand) {
        if (merge) {
          const existing = await entityStorage.getBrandRecord(record.id);
          if (!existing || overwrite) {
            await entityStorage.saveBrandRecord(record);
          }
        } else {
          await entityStorage.saveBrandRecord(record);
        }
      }
    }

    // Import people records
    if (data.data.people) {
      for (const record of data.data.people) {
        if (merge) {
          const existing = await entityStorage.getPeopleRecord(record.id);
          if (!existing || overwrite) {
            await entityStorage.savePeopleRecord(record);
          }
        } else {
          await entityStorage.savePeopleRecord(record);
        }
      }
    }

    // Import concepts
    if (data.data.concepts) {
      for (const record of data.data.concepts) {
        if (merge) {
          const existing = await entityStorage.getConceptRecord(record.id);
          if (!existing || overwrite) {
            await entityStorage.saveConceptRecord(record);
          }
        } else {
          await entityStorage.saveConceptRecord(record);
        }
      }
    }

    // Import journal entries
    if (data.data.journal) {
      for (const entry of data.data.journal) {
        if (merge) {
          const existing = await entityStorage.getJournalEntry(entry.id);
          if (!existing || overwrite) {
            await entityStorage.saveJournalEntry(entry);
          }
        } else {
          await entityStorage.saveJournalEntry(entry);
        }
      }
    }

    // Import settings
    if (data.settings && !merge) {
      Object.entries(data.settings).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Import failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const parseImportFile = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // Validate data structure
        if (!data.version || !data.data) {
          reject(new Error('Invalid backup file format'));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse backup file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
