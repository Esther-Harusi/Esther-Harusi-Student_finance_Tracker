console.log('Dashboard loading...');


const statCountEl = document.getElementById('stat-count-val');
const statSpentEl = document.getElementById('stat-spent-val');
const statCategoryEl = document.getElementById('stat-category-val');
const budgetBarFill = document.getElementById('budget-bar-fill');
const budgetSummary = document.getElementById('budget-summary');
const barChart = document.getElementById('bar-chart');

function getRecords() {
    try {
        let data = localStorage.getItem('financeRecords');
        if (!data) data = localStorage.getItem('sft:records');
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {}
    return [];
}

function getSettings() {
    try {
        const data = localStorage.getItem('financeSettings');
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed === 'object') return parsed;
        }
    } catch (e) {}
    return { budget: 0 };
}



function formatCurrency(amount) {
    return 'KES' + Number(amount).toFixed(2);
}


function updateStatCards() {
    const records = getRecords();
    if (statCountEl) statCountEl.textContent = records.length;
    
    const total = records.reduce((sum, r) => sum + (r.amount || 0), 0);
    if (statSpentEl) statSpentEl.textContent = formatCurrency(total);
    
    if (statCategoryEl) {
        statCategoryEl.textContent = getTopCategory(records) || '—';
    }
}

function getTopCategory(records) {
    if (records.length === 0) return null;
    
    const totals = records.reduce((map, r) => {
        map[r.category] = (map[r.category] || 0) + r.amount;
        return map;
    }, {});
    
    const entries = Object.entries(totals);
    if (entries.length === 0) return null;
    
    const [topCat] = entries.reduce(
        (best, current) => current[1] > best[1] ? current : best
    );
    
    return topCat;
}


function updateBudgetBar() {
    const settings = getSettings();
    const cap = parseFloat(settings.budget) || 0;
    const records = getRecords();
    
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    const monthlyRecords = records.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date + 'T12:00:00');
        return d.getMonth() === month && d.getFullYear() === year;
    });
    
    const spent = monthlyRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    if (!budgetBarFill || !budgetSummary) return;
    
    if (!cap) {
        budgetBarFill.style.width = '0%';
        budgetBarFill.className = 'budget-bar-fill';
        budgetSummary.textContent = 'Set a budget cap in Settings.';
        return;
    }
    
    const pct = (spent / cap) * 100;
    const barWidth = Math.min(pct, 100);
    const remaining = cap - spent;
    
    budgetBarFill.style.width = barWidth + '%';
    
    if (pct >= 100) {
        budgetBarFill.className = 'budget-bar-fill danger';
        budgetSummary.textContent = 'Over budget by ' + formatCurrency(spent - cap);
    } else if (pct >= 80) {
        budgetBarFill.className = 'budget-bar-fill warning';
        budgetSummary.textContent = formatCurrency(remaining) + ' remaining (' + Math.round(pct) + '% used)';
    } else {
        budgetBarFill.className = 'budget-bar-fill';
        budgetSummary.textContent = formatCurrency(remaining) + ' remaining (' + Math.round(pct) + '% used)';
    }
}



function updateChart() {
    if (!barChart) return;
    
    const records = getRecords();
    
    const days = [];
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = y + '-' + m + '-' + d;
        const label = i === 0 ? 'Today' : dayNames[date.getDay()];
        
        const total = records
            .filter(r => r.date === dateStr)
            .reduce((sum, r) => sum + (r.amount || 0), 0);
        
        days.push({ dateStr, label, total });
    }
    
    const hasData = days.some(d => d.total > 0);
    
    if (!hasData) {
        barChart.innerHTML = '<p class="chart-empty"> No spending data</p>';
        return;
    }
    
    const maxTotal = Math.max(...days.map(d => d.total), 1);
    
    barChart.innerHTML = '';
    
    days.forEach(function(day) {
        const heightPct = day.total === 0 ? 2 : (day.total / maxTotal) * 100;
        const isToday = day.label === 'Today';
        
        const group = document.createElement('div');
        group.className = 'chart-bar-group';
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = Math.max(heightPct, 2) + '%';
        
        
        bar.title = day.label + ': ' + formatCurrency(day.total);
        bar.setAttribute('data-amount', day.total);
        
        const label = document.createElement('span');
        label.className = 'chart-day-label' + (isToday ? ' today' : '');
        label.textContent = day.label;
        
        group.appendChild(bar);
        group.appendChild(label);
        barChart.appendChild(group);
    });
}
      


function updateDashboard() {
    updateStatCards();
    updateBudgetBar();
    updateChart();
}



function initDashboard() {
    console.log(' Dashboard initializing...');
    updateDashboard();
    console.log(' Dashboard ready!');
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

document.addEventListener('records:changed', updateDashboard);