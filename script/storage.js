const STORAGE_KEYS = {
  RECORDS: 'sft:records',
  SETTINGS: 'sft:settings',
  STATE: 'sft:state',      
  BACKUP: 'sft:backup',  
  VERSION: 'sft:version'   
};


const DATA_VERSION = '1.0.0';


const DEFAULT_DATA = {
  records: [],
  settings: {
    budget: 0,
    currency: 'KES',
    categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other']
  }
};


function setItem(key, data, backup = true) {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
    
   
    if (backup && key !== STORAGE_KEYS.BACKUP) {
      localStorage.setItem(STORAGE_KEYS.BACKUP, json);
    }
    
    return true;
  } catch (error) {
    console.error('Storage save error:', error);
    

    if (backup) {
      try {
        localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(data));
        console.warn('Saved to backup storage');
        return true;
      } catch (e) {
        console.error('Backup save also failed:', e);
      }
    }
    
    return false;
  }
}


function getItem(key, fallback = null, validator = null) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    
    const parsed = JSON.parse(data);
    
 
    if (validator && !validator(parsed)) {
      console.warn(`Validation failed for key: ${key}`);
      return fallback;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Storage load error (${key}):`, error);
    return fallback;
  }
}


function removeItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Storage remove error (${key}):`, error);
    return false;
  }
}


function isValidRecords(records) {
  if (!Array.isArray(records)) return false;
  
 
  return records.every(record => {
    return (
      record.id &&
      typeof record.description === 'string' &&
      typeof record.amount === 'number' &&
      typeof record.category === 'string' &&
      typeof record.date === 'string'
    );
  });
}


function isValidSettings(settings) {
  if (!settings || typeof settings !== 'object') return false;
  
  const required = ['budget', 'currency', 'categories'];
  return required.every(key => key in settings);
}


function isValidState(state) {
  if (!state || typeof state !== 'object') return false;
  if (!('records' in state) || !('settings' in state)) return false;
  return isValidRecords(state.records) && isValidSettings(state.settings);
}


export function getDataVersion() {
  return localStorage.getItem(STORAGE_KEYS.VERSION) || '0.0.0';
}


export function setDataVersion(version) {
  localStorage.setItem(STORAGE_KEYS.VERSION, version);
}


export function needsMigration() {
  return getDataVersion() !== DATA_VERSION;
}


function migrateData(oldData) {
  const version = getDataVersion();
  let data = { ...oldData };
  
  
  if (version === '0.0.0') {
   
    if (data.records) {
      data.records = data.records.map(record => ({
        ...record,
        id: record.id || 'migrated_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: record.updatedAt || new Date().toISOString()
      }));
    }
    
   
    if (data.settings) {
      data.settings = {
        budget: data.settings.budget || 0,
        currency: data.settings.currency || 'KES',
        categories: data.settings.categories || ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other']
      };
    }
    
    setDataVersion(DATA_VERSION);
  }
  
  return data;
}


export function loadRecords(useBackup = true) {
  let records = getItem(STORAGE_KEYS.RECORDS, [], isValidRecords);
  
 
  if ((!records || records.length === 0) && useBackup) {
    const backup = getItem(STORAGE_KEYS.BACKUP, null, isValidRecords);
    if (backup && backup.length > 0) {
      console.warn('Using backup data');
      records = backup;
      
      saveRecords(records);
    }
  }
  
 
  if (!records || records.length === 0) {
    records = DEFAULT_DATA.records;
  }
  
  return records;
}


export function saveRecords(records, createBackup = true) {
  if (!Array.isArray(records)) {
    console.error('Invalid records data:', records);
    return false;
  }
  
 
  if (!isValidRecords(records)) {
    console.warn('Records validation failed, but saving anyway');
  }
  
  const success = setItem(STORAGE_KEYS.RECORDS, records, createBackup);
  
  
  if (success) {
    const settings = loadSettings(false);
    saveFullState({ records, settings }, false);
  }
  
  return success;
}

export function addRecord(record) {
  const records = loadRecords();
  records.push(record);
  return saveRecords(records);
}


export function updateRecord(id, updates) {
  const records = loadRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  records[index] = { ...records[index], ...updates, updatedAt: new Date().toISOString() };
  return saveRecords(records);
}


export function deleteRecord(id) {
  const records = loadRecords();
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length === records.length) return false;
  return saveRecords(filtered);
}


export function loadSettings(useBackup = true) {
  let settings = getItem(STORAGE_KEYS.SETTINGS, null, isValidSettings);
  
  
  if (!settings && useBackup) {
    const backup = getItem(STORAGE_KEYS.BACKUP, null, isValidSettings);
    if (backup) {
      console.warn('Using backup settings');
      settings = backup;
      saveSettings(settings);
    }
  }
  
  
  if (!settings) {
    settings = { ...DEFAULT_DATA.settings };
  }
  
  return settings;
}


export function saveSettings(settings, createBackup = true) {
  if (!settings || typeof settings !== 'object') {
    console.error('Invalid settings data:', settings);
    return false;
  }
  
 
  if (!isValidSettings(settings)) {
    console.warn('Settings validation failed, but saving anyway');
  }
  
  const success = setItem(STORAGE_KEYS.SETTINGS, settings, createBackup);
  
 
  if (success) {
    const records = loadRecords(false);
    saveFullState({ records, settings }, false);
  }
  
  return success;
}


export function updateSetting(key, value) {
  const settings = loadSettings();
  settings[key] = value;
  return saveSettings(settings);
}


export function loadFullState(useBackup = true) {

  let state = getItem(STORAGE_KEYS.STATE, null, isValidState);
  
  if (state && !needsMigration()) {
    return state;
  }
  
  
  const records = loadRecords(useBackup);
  const settings = loadSettings(useBackup);
  
  state = { records, settings };
  
  
  if (needsMigration()) {
    state = migrateData(state);
  }
  
  saveFullState(state, false);
  
  return state;
}


export function saveFullState(state, createBackup = true) {
  if (!state || typeof state !== 'object') {
    console.error('Invalid state data:', state);
    return false;
  }
  
  
  if (!isValidState(state)) {
    console.warn('State validation failed, but saving anyway');
  }

  const success = setItem(STORAGE_KEYS.STATE, state, createBackup);
  
  
  if (success) {
    setItem(STORAGE_KEYS.RECORDS, state.records, false);
    setItem(STORAGE_KEYS.SETTINGS, state.settings, false);
  }
  
  return success;
}


export function exportData(pretty = true) {
  const state = loadFullState();
  const exportData = {
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'Student Finance Tracker',
    data: state
  };
  
  return pretty ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
}


export function importData(jsonString, merge = false) {
  try {
    
    const imported = JSON.parse(jsonString);
    
   
    if (!imported.data || !imported.data.records || !imported.data.settings) {
      return {
        success: false,
        message: 'Invalid data structure. Missing records or settings.'
      };
    }
    
    
    if (!isValidRecords(imported.data.records)) {
      return {
        success: false,
        message: 'Invalid records data. Check required fields.'
      };
    }
    
   
    if (!isValidSettings(imported.data.settings)) {
      return {
        success: false,
        message: 'Invalid settings data.'
      };
    }
    
    
    if (merge) {
      
      const existing = loadFullState();
      const mergedRecords = [...existing.records];
      
      imported.data.records.forEach(record => {
        const exists = mergedRecords.some(r => r.id === record.id);
        if (!exists) {
          mergedRecords.push(record);
        }
      });
      
      const mergedSettings = { ...existing.settings, ...imported.data.settings };
      const mergedState = { records: mergedRecords, settings: mergedSettings };
      
      saveFullState(mergedState);
      
      return {
        success: true,
        message: `Imported ${imported.data.records.length} records (merged with existing)`,
        data: mergedState
      };
    } else {
      
      saveFullState(imported.data);
      
      return {
        success: true,
        message: `Imported ${imported.data.records.length} records (replaced existing)`,
        data: imported.data
      };
    }
    
  } catch (error) {
    return {
      success: false,
      message: `Import failed: ${error.message}`
    };
  }
}


export function clearAllData(keepBackup = true) {
  try {
  
    const keysToRemove = Object.values(STORAGE_KEYS);
    
    keysToRemove.forEach(key => {
      if (!keepBackup || key !== STORAGE_KEYS.BACKUP) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Clear data error:', error);
    return false;
  }
}

export function getStorageInfo() {
  let totalSize = 0;
  const items = {};
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      totalSize += size;
      items[key] = size;
    }
  } catch (error) {
    console.error('Storage info error:', error);
  }
  
  return {
    totalItems: localStorage.length,
    totalSize: totalSize,
    totalSizeFormatted: (totalSize / 1024).toFixed(2) + ' KB',
    items: items,
    limit: 5 * 1024 * 1024, 
    percentUsed: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2) + '%'
  };
}


export function resetToDefaults(keepBackup = true) {
  clearAllData(keepBackup);
  saveFullState(DEFAULT_DATA);
  return DEFAULT_DATA;
}


export function getDefaults() {
  return { ...DEFAULT_DATA };
}


export function forceMigration() {
  const state = loadFullState();
  setDataVersion('0.0.0');
  const migrated = migrateData(state);
  saveFullState(migrated);
  return migrated;
}



if (window && window.__DEV__) {
  window.__storage = {
    loadRecords,
    saveRecords,
    loadSettings,
    saveSettings,
    loadFullState,
    saveFullState,
    exportData,
    importData,
    clearAllData,
    getStorageInfo,
    resetToDefaults,
    getDefaults
  };
}