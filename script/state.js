import { 
  loadRecords, 
  saveRecords,
  loadSettings, 
  saveSettings,
  loadFullState,
  saveFullState,
  getDefaults
} from './storage.js';


const DEFAULT_SETTINGS = {
  budget: 0,                              
  currency: '$',                        
  RWFRate: 0.92,                          
  KESRate: 0.79,                         
  categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'],
  theme: 'light',                         
  autoSave: true,                         
};

const DEFAULT_SEARCH = {
  query: '',                            
  caseSensitive: false,                   
  sortField: 'date',                     
  sortAsc: false,                         
};

const DEFAULT_UI = {
  activeSection: 'dashboard',             
  toastTimeout: 3000,                    
  confirmTimeout: 5000,                   
};


function createState() {
  
  const savedSettings = loadSettings();
  
 
  const settings = {
    ...DEFAULT_SETTINGS,
    ...savedSettings,

    categories: Array.isArray(savedSettings?.categories) 
      ? savedSettings.categories 
      : DEFAULT_SETTINGS.categories,
  };
  
  
  let records = loadRecords();
  
 
  if (!Array.isArray(records)) {
    console.warn('Invalid records data, using empty array');
    records = [];
  }
  

  records = records.filter(record => 
    record && 
    typeof record === 'object' &&
    record.id &&
    typeof record.description === 'string' &&
    typeof record.amount === 'number'
  );
  
  return {
   
    records: records,
    
   
    settings: settings,
    
  
    
    
    searchQuery: DEFAULT_SEARCH.query,
    
   
    caseSensitive: DEFAULT_SEARCH.caseSensitive,
    
    
    sortField: DEFAULT_SEARCH.sortField,
    
    
    sortAsc: DEFAULT_SEARCH.sortAsc,
    
   
    activeSection: DEFAULT_UI.activeSection,
    
   
    toastTimeout: DEFAULT_UI.toastTimeout,
    
   
    confirmTimeout: DEFAULT_UI.confirmTimeout,
    
   
    _version: '1.0.0',
    
    
    _lastSaved: null,
    
  
    _dirty: false,
  };
}



export const state = createState();


export function saveState(force = false) {
  if (!state._dirty && !force) {
    return true;
  }
  
  try {
    saveFullState({
      records: state.records,
      settings: state.settings,
    });
    
    state._lastSaved = new Date().toISOString();
    state._dirty = false;
    return true;
  } catch (error) {
    console.error('Failed to save state:', error);
    return false;
  }
}


export function reloadState() {
  try {
    const data = loadFullState();
    if (data) {
      state.records = data.records || [];
      state.settings = {
        ...DEFAULT_SETTINGS,
        ...data.settings,
      };
      state._dirty = false;
      state._lastSaved = new Date().toISOString();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to reload state:', error);
    return false;
  }
}


export function resetState(confirm = true) {
  if (confirm && !window.confirm('Reset all data to defaults? This cannot be undone!')) {
    return false;
  }
  
  try {
   
    state.records = [];
    
 
    state.settings = { ...DEFAULT_SETTINGS };
    
  
    state.searchQuery = DEFAULT_SEARCH.query;
    state.caseSensitive = DEFAULT_SEARCH.caseSensitive;
    state.sortField = DEFAULT_SEARCH.sortField;
    state.sortAsc = DEFAULT_SEARCH.sortAsc;
    
   
    state.activeSection = DEFAULT_UI.activeSection;
    
    state._dirty = true;
    saveState(true);
    
    return true;
  } catch (error) {
    console.error('Failed to reset state:', error);
    return false;
  }
}


export function getRecordById(id) {
  return state.records.find(record => record.id === id) || null;
}


export function addRecord(record, save = true) {
  if (!record || !record.id) {
    console.error('Invalid record:', record);
    return false;
  }
  
 
  if (getRecordById(record.id)) {
    console.warn('Record already exists:', record.id);
    return false;
  }
  
  state.records.push(record);
  state._dirty = true;
  
  if (save) {
    return saveState();
  }
  
  return true;
}


export function updateRecord(id, updates, save = true) {
  const index = state.records.findIndex(record => record.id === id);
  if (index === -1) {
    console.warn('Record not found:', id);
    return false;
  }
  
  state.records[index] = {
    ...state.records[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  state._dirty = true;
  
  if (save) {
    return saveState();
  }
  
  return true;
}


export function deleteRecord(id, save = true) {
  const index = state.records.findIndex(record => record.id === id);
  if (index === -1) {
    console.warn('Record not found:', id);
    return false;
  }
  
  state.records.splice(index, 1);
  state._dirty = true;
  
  if (save) {
    return saveState();
  }
  
  return true;
}


export function updateSetting(key, value, save = true) {
  if (!(key in state.settings)) {
    console.warn('Unknown setting:', key);
    return false;
  }
  
  state.settings[key] = value;
  state._dirty = true;
  
  if (save) {
    return saveState();
  }
  
  return true;
}


export function getSortedRecords(field = 'date', ascending = false) {
  const sorted = [...state.records];
  
  sorted.sort((a, b) => {
    let cmp = 0;
    
    switch (field) {
      case 'date':
        cmp = new Date(a.date || 0) - new Date(b.date || 0);
        break;
      case 'description':
        cmp = (a.description || '').localeCompare(b.description || '');
        break;
      case 'amount':
        cmp = (a.amount || 0) - (b.amount || 0);
        break;
      case 'category':
        cmp = (a.category || '').localeCompare(b.category || '');
        break;
      default:
        cmp = 0;
    }
    
    return ascending ? cmp : -cmp;
  });
  
  return sorted;
}


export function getFilteredRecords(query = '', caseSensitive = false) {
  if (!query || query.trim() === '') {
    return [...state.records];
  }
  
  const flags = caseSensitive ? '' : 'i';
  let regex;
  
  try {
    regex = new RegExp(query, flags);
  } catch {
  
    const lowerQuery = query.toLowerCase();
    return state.records.filter(record => {
      const text = `${record.description} ${record.category || ''}`.toLowerCase();
      return text.includes(lowerQuery);
    });
  }
  
  return state.records.filter(record => {
    const text = `${record.description} ${record.category || ''}`;
    return regex.test(text);
  });
}


export function getSpendingSummary(period = 'month', year = null, month = null) {
  const now = new Date();
  const targetYear = year !== null ? year : now.getFullYear();
  const targetMonth = month !== null ? month : now.getMonth();
  
  let filtered = [...state.records];
  
  if (period === 'month') {
    filtered = filtered.filter(record => {
      if (!record.date) return false;
      const date = new Date(record.date + 'T00:00:00');
      return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
    });
  } else if (period === 'year') {
    filtered = filtered.filter(record => {
      if (!record.date) return false;
      const date = new Date(record.date + 'T00:00:00');
      return date.getFullYear() === targetYear;
    });
  }
  
  const total = filtered.reduce((sum, record) => sum + (record.amount || 0), 0);
  const count = filtered.length;
  

  const categories = {};
  filtered.forEach(record => {
    const category = record.category || 'Uncategorized';
    categories[category] = (categories[category] || 0) + (record.amount || 0);
  });
  

  let topCategory = null;
  let topAmount = 0;
  Object.entries(categories).forEach(([category, amount]) => {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = category;
    }
  });
  
  return {
    total,
    count,
    categories,
    topCategory,
    topAmount,
    average: count > 0 ? total / count : 0,
  };
}


export function getBudgetStatus() {
  const budget = state.settings.budget || 0;
  const summary = getSpendingSummary('month');
  const spent = summary.total;
  const remaining = budget - spent;
  const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
  
  return {
    budget,
    spent,
    remaining,
    percentUsed: Math.min(percentUsed, 100),
    isOverBudget: remaining < 0,
    isApproaching: percentUsed >= 80 && percentUsed < 100,
    isOnTrack: percentUsed < 80,
  };
}



let autoSaveTimer = null;


export function enableAutoSave(delay = 1000) {
 
  const originalPush = state.records.push;
  const originalSplice = state.records.splice;
  
  state.records.push = function(...items) {
    const result = originalPush.apply(this, items);
    state._dirty = true;
    triggerAutoSave(delay);
    return result;
  };
  
  state.records.splice = function(...args) {
    const result = originalSplice.apply(this, args);
    state._dirty = true;
    triggerAutoSave(delay);
    return result;
  };
  
  console.log('Auto-save enabled');
}


function triggerAutoSave(delay = 1000) {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  if (state.settings.autoSave) {
    autoSaveTimer = setTimeout(() => {
      saveState();
      autoSaveTimer = null;
    }, delay);
  }
}



if (window && window.__DEV__) {
  window.__state = {
    state,
    saveState,
    reloadState,
    resetState,
    getRecordById,
    addRecord,
    updateRecord,
    deleteRecord,
    updateSetting,
    getSortedRecords,
    getFilteredRecords,
    getSpendingSummary,
    getBudgetStatus,
    DEFAULT_SETTINGS,
  };
}



export default state;