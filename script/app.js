import './theme.js';       
import { initUI } from './ui.js';       
import { initRecords } from './records.js'; 
import { initForm } from './form.js';     
import { initDashboard } from './dashboard.js'; 
import { initSettings } from './settings.js'; 
import { state } from './state.js';       
import { loadData, saveData } from './storage.js'; 


const APP_CONFIG = {
  name: 'Student Finance Tracker',
  version: '1.0.0',
  debug: false, 
  autoSave: true 
};


export function initApp() {
  try {
    log(' Starting application...');
    log(` ${APP_CONFIG.name} v${APP_CONFIG.version}`);

   
    loadAppData();
    
  
    initializeModules();
    
   
    setupGlobalListeners();
    
 
    renderInitialView();
    
    handleHashRouting();
    
    
    if (APP_CONFIG.autoSave) {
      setupAutoSave();
    }
    
    log(' Application initialized successfully!');
    log(` Loaded ${state.records?.length || 0} records`);
    log(` Budget: ${state.settings?.budget || 'Not set'}`);
    
    
    if (APP_CONFIG.debug || window.__DEV__) {
      exposeDebugTools();
    }
    
  } catch (error) {
    console.error(' Application initialization failed:', error);
    showStartupError(error);
  }
}


function loadAppData() {
  try {
    const data = loadData();
    
    if (data) {
     
      if (data.records) state.records = data.records;
      if (data.settings) state.settings = { ...state.settings, ...data.settings };
      
      log(`Loaded ${data.records?.length || 0} records from storage`);
    } else {
     
      log(' No data found - loading sample data');
      loadSampleData();
    }
  } catch (error) {
    console.warn(' Error loading data:', error);
    loadSampleData(); // Fallback to sample data
  }
}


function loadSampleData() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];
  
  state.records = [
    {
      id: 'sample_1',
      description: 'Lunch at cafeteria',
      amount: 12.50,
      category: 'Food',
      date: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sample_2',
      description: 'Chemistry textbook',
      amount: 89.99,
      category: 'Books',
      date: yesterday,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sample_3',
      description: 'Monthly bus pass',
      amount: 45.00,
      category: 'Transport',
      date: twoDaysAgo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sample_4',
      description: 'Coffee with friends',
      amount: 8.75,
      category: 'Entertainment',
      date: yesterday,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  state.settings = {
    budget: 500,
    currency: '$',
    categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other']
  };
  
  saveData(state);
  log('Sample data loaded');
}


function initializeModules() {
  log(' Initializing modules...');
  
  
  if (typeof initUI === 'function') {
    initUI();
    log(' UI module initialized');
  } else {
    console.warn('initUI not found');
  }
  
  
  if (typeof initDashboard === 'function') {
    initDashboard();
    log('Dashboard module initialized');
  } else {
    console.warn(' initDashboard not found');
  }
  
  
  if (typeof initRecords === 'function') {
    initRecords();
    log('Records module initialized');
  } else {
    console.warn(' initRecords not found');
  }
  
  if (typeof initForm === 'function') {
    initForm();
    log(' Form module initialized');
  } else {
    console.warn('initForm not found');
  }
  
 
  if (typeof initSettings === 'function') {
    initSettings();
    log('Settings module initialized');
  } else {
    console.warn(' initSettings not found');
  }
}


function setupGlobalListeners() {
  
  document.addEventListener('records:changed', handleRecordsChanged);
  
 
  document.addEventListener('settings:changed', handleSettingsChanged);
  
 
  document.addEventListener('error', handleGlobalError);
  
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  log(' Event listeners configured');
}


function handleRecordsChanged(event) {
  log(' Records changed, updating views...');
  
  
  if (typeof updateDashboard === 'function') {
    updateDashboard();
  }
  
 
  if (typeof renderRecords === 'function') {
    renderRecords();
  }
  
  
  if (APP_CONFIG.autoSave) {
    saveData(state);
  }
}


function handleSettingsChanged(event) {
  log(' Settings changed, updating...');
  
 
  if (typeof updateDashboard === 'function') {
    updateDashboard();
  }
  
  e
  if (APP_CONFIG.autoSave) {
    saveData(state);
  }
}


function handleGlobalError(event) {
  console.error(' Global error caught:', event.error || event.message);
  
 
  const statusEl = document.getElementById('status-msg');
  if (statusEl) {
    statusEl.textContent = ' Something went wrong. Please try again.';
    statusEl.setAttribute('aria-live', 'assertive');
    setTimeout(() => {
      statusEl.textContent = '';
    }, 5000);
  }
}


function handleBeforeUnload(event) {
  if (APP_CONFIG.autoSave) {
    saveData(state);
    log(' Data saved before unloading');
  }
}

function handleOnline() {
  log(' App is online');
  const statusEl = document.getElementById('status-msg');
  if (statusEl) {
    statusEl.textContent = ' Back online';
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  }
}


function handleOffline() {
  log(' App is offline - data will be saved locally');
  const statusEl = document.getElementById('status-msg');
  if (statusEl) {
    statusEl.textContent = ' Offline mode - data saved locally';
    statusEl.setAttribute('aria-live', 'assertive');
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  }
}


function renderInitialView() {
  log(' Rendering initial view...');
  
  
  const dashboardSection = document.getElementById('dashboard');
  if (dashboardSection) {
    dashboardSection.removeAttribute('hidden');
    dashboardSection.classList.add('active');
  }
  
 
  if (typeof updateDashboard === 'function') {
    updateDashboard();
  }
  
  
  if (typeof renderRecords === 'function') {
    renderRecords();
  }
}


function handleHashRouting() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  const validSections = ['dashboard', 'records', 'add-record', 'settings', 'about'];
  
  if (validSections.includes(hash)) {
    log(` Navigating to: ${hash}`);
    
   
    if (typeof navigateTo === 'function') {
      navigateTo(hash);
    } else {
      
      const link = document.querySelector(`[data-section="${hash}"]`);
      if (link) link.click();
    }
  }
  
  
  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.replace('#', '') || 'dashboard';
    if (validSections.includes(newHash)) {
      log(` Hash changed to: ${newHash}`);
      if (typeof navigateTo === 'function') {
        navigateTo(newHash);
      }
    }
  });
}


function setupAutoSave() {
  
  let saveTimeout = null;
  
  const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveData(state);
      log(' Auto-saved');
    }, 1000);
  };
  
 
  document.addEventListener('records:changed', debouncedSave);
  document.addEventListener('settings:changed', debouncedSave);
  
  
  setInterval(() => {
    if (state.records && state.records.length > 0) {
      saveData(state);
      log('Periodic auto-save');
    }
  }, 30000);
  
  log(' Auto-save enabled');
}


function log(message) {
  if (APP_CONFIG.debug || window.__DEV__) {
    console.log(`[App] ${message}`);
  }
}




function showStartupError(error) {
  const container = document.querySelector('.container');
  if (container) {
    container.innerHTML = `
      <div style="padding: 2rem; background: #fee2e2; border-radius: 0.5rem; border: 2px solid #dc2626; margin: 1rem;">
        <h2 style="color: #991b1b;">Application Failed to Start</h2>
        <p style="color: #7f1d1d;">${error.message || 'Unknown error'}</p>
        <p style="color: #7f1d1d; font-size: 0.875rem;">
          Please check the console for more details.
        </p>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
           Reload Application
        </button>
      </div>
    `;
  }
  
  console.error('Startup error:', error);
}




function exposeDebugTools() {
  console.log(' Debug tools available:');
  console.log('  state:', state);
  console.log('  saveData():', saveData);
  console.log('  loadData():', loadData);
  console.log('  refresh():', refreshApp);
  
  window.__app = {
    state,
    saveData,
    loadData,
    refresh: refreshApp,
    config: APP_CONFIG
  };
  
  console.log(' Use window.__app to access app internals');
}




export function refreshApp() {
  log('Refreshing application...');
  
  
  loadAppData();
  
  
  if (typeof updateDashboard === 'function') {
    updateDashboard();
  }
  if (typeof renderRecords === 'function') {
    renderRecords();
  }
  
  log('Application refreshed');
}



export const app = {
  init: initApp,
  refresh: refreshApp,
  config: APP_CONFIG,
  state: state
};




if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  
  initApp();
}




if (window) {
  window.app = app;
}


function renderChart() {
    const chartContainer = document.getElementById('bar-chart');
    if (!chartContainer) return;
    
    
    let records = [];
    try {
        const data = localStorage.getItem('financeRecords');
        if (data) {
            records = JSON.parse(data);
        }
    } catch (e) {}
    
    
    const days = getLast7Days(records);
    
    
    const hasData = days.some(d => d.total > 0);
    
    if (!hasData) {
        chartContainer.innerHTML = '<p class="chart-empty">No spending data for the last 7 days. Add some expenses!</p>';
        return;
    }
    
    
    const maxTotal = Math.max(...days.map(d => d.total), 1);
    
    
    chartContainer.innerHTML = '';
    
    days.forEach(function(day) {
        const heightPct = day.total === 0 ? 2 : (day.total / maxTotal) * 100;
        const isToday = day.label === 'Today';
        
        
        let colorClass = 'low';
        const pctOfMax = day.total / maxTotal;
        if (pctOfMax > 0.8) colorClass = 'very-high';
        else if (pctOfMax > 0.5) colorClass = 'high';
        else if (pctOfMax > 0.25) colorClass = 'medium';
        
        
        const group = document.createElement('div');
        group.className = 'chart-bar-group';
        
        
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';
        
        
        const bar = document.createElement('div');
        bar.className = `chart-bar ${colorClass}`;
        bar.style.height = `${Math.max(heightPct, 2)}%`;
        
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = `${day.label}: $${day.total.toFixed(2)}`;
        bar.appendChild(tooltip);
        
        wrapper.appendChild(bar);
        group.appendChild(wrapper);
        
        
        const label = document.createElement('span');
        label.className = `chart-day-label${isToday ? ' today' : ''}`;
        label.textContent = day.label;
        group.appendChild(label);
        
        chartContainer.appendChild(group);
    });
    
    
    const summary = days
        .filter(d => d.total > 0)
        .map(d => `${d.label}: $${d.total.toFixed(2)}`)
        .join(', ');
    chartContainer.setAttribute('aria-label', 
        `Spending over last 7 days. ${summary || 'No spending recorded.'}`
    );
}

function getLast7Days(records) {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const dateStr = date.toISOString().slice(0, 10);
        const label = i === 0 ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short' });
        
        
        const total = records
            .filter(r => r.date === dateStr)
            .reduce((sum, r) => sum + (r.amount || 0), 0);
        
        days.push({ dateStr, label, total });
    }
    
    return days;
}



function renderChartLegend() {
    const chartSection = document.querySelector('.chart-section');
    if (!chartSection) return;
    
    
    if (chartSection.querySelector('.chart-legend')) return;
    
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.innerHTML = `
        <span class="chart-legend-item"><span class="dot low"></span> Low</span>
        <span class="chart-legend-item"><span class="dot medium"></span> Medium</span>
        <span class="chart-legend-item"><span class="dot high"></span> High</span>
        <span class="chart-legend-item"><span class="dot very-high"></span> Very High</span>
    `;
    chartSection.appendChild(legend);
}



function initChart() {
    renderChart();
    renderChartLegend();
    
    
    document.addEventListener('records:changed', function() {
        renderChart();
    });
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChart);
} else {
    initChart();
}