console.log('Loading records...');

const tbody = document.getElementById('records-tbody');
const cardList = document.getElementById('record-cards');
const emptyState = document.getElementById('empty-state');
const resultsCount = document.getElementById('results-count');
const searchInput = document.getElementById('search-input');

console.log('  tbody found:', !!tbody);



function formatCurrency(amount) {
    return 'KES ' + Number(amount).toFixed(2);
}

function highlightText(text, query) {
    if (!text || !query || !query.trim()) return text || '';
    try {
        var lowerQuery = query.toLowerCase();
        var textLower = text.toLowerCase();
        if (!textLower.includes(lowerQuery)) return text;
        var idx = textLower.indexOf(lowerQuery);
        return text.substring(0, idx) + '<mark>' + text.substring(idx, idx + query.length) + '</mark>' + text.substring(idx + query.length);
    } catch (e) {
        return text;
    }
}



function getRecords() {
    try {
        var data = localStorage.getItem('financeRecords');
        if (!data) data = localStorage.getItem('sft:records');
        if (data) {
            var parsed = JSON.parse(data);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {}
    return [];
}

function saveRecords(records) {
    try {
        localStorage.setItem('financeRecords', JSON.stringify(records));
        localStorage.setItem('sft:records', JSON.stringify(records));
        return true;
    } catch (e) {
        console.error('Error saving records:', e);
        return false;
    }
}



window.editRecord = function(id) {
    console.log(' Edit record called with ID:', id);
    if (!id) { console.error('No ID provided'); return; }
    
    var records = getRecords();
    var record = records.find(function(r) { return r.id === id; });
    if (!record) { alert('Record not found!'); return; }
    
    document.getElementById('edit-id').value = record.id;
    document.getElementById('f-description').value = record.description || '';
    document.getElementById('f-amount').value = record.amount || '';
    document.getElementById('f-category').value = record.category || '';
    document.getElementById('f-date').value = record.date || '';
    
    document.getElementById('form-heading').textContent = 'Edit expense';
    document.getElementById('form-submit-btn').textContent = 'Update expense';
    
    var addTab = document.querySelector('[data-section="add-record"]');
    if (addTab) addTab.click();
};



window.deleteRecord = function(id) {
    console.log('Delete record called with ID:', id);
    if (!id) { console.error('No ID provided'); return; }
    if (!confirm('Delete this record? This cannot be undone!')) return;
    
    var records = getRecords();
    var filteredRecords = records.filter(function(r) { return r.id !== id; });
    if (records.length === filteredRecords.length) { alert('Record not found!'); return; }
    
    saveRecords(filteredRecords);
    renderRecords(searchInput ? searchInput.value : '');
    document.dispatchEvent(new CustomEvent('records:changed'));
    console.log(' Record deleted');
};

function renderRecords(query) {
    query = query || '';
    var records = getRecords();
    
    if (query && query.trim()) {
        var lowerQuery = query.toLowerCase();
        records = records.filter(function(r) {
            return r.description.toLowerCase().includes(lowerQuery) ||
                   (r.category || '').toLowerCase().includes(lowerQuery);
        });
    }
    
    if (resultsCount) {
        var total = getRecords().length;
        resultsCount.textContent = query && query.trim() ? 
            'Showing ' + records.length + ' of ' + total + ' records' : 
            total + ' record' + (total !== 1 ? 's' : '');
    }
    
    if (emptyState) {
        emptyState.style.display = records.length === 0 ? 'block' : 'none';
    }
    
   
    if (tbody) {
        tbody.innerHTML = '';
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#6b7280;">No records found</td></tr>';
        } else {
            records.forEach(function(r) {
                var tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${highlightText(r.description, query)}</td>
                    <td>${formatCurrency(r.amount)}</td>
                    <td>${highlightText(r.category || 'Uncategorized', query)}</td>
                    <td>${r.date}</td>
                    <td>
                        <button class="btn-icon edit-btn" data-id="${r.id}">Edit</button>
                        <button class="btn-icon delete-btn" data-id="${r.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
          
            tbody.addEventListener('click', function(e) {
                var target = e.target.closest('button');
                if (!target) return;
                var id = target.getAttribute('data-id');
                if (!id) return;
                if (target.classList.contains('edit-btn')) window.editRecord(id);
                if (target.classList.contains('delete-btn')) window.deleteRecord(id);
            });
        }
    }
    
   
    if (cardList) {
        cardList.innerHTML = '';
        records.forEach(function(r) {
            var li = document.createElement('li');
            li.className = 'record-card';
            li.innerHTML = `
                <span class="record-card-desc">${highlightText(r.description, query)}</span>
                <span class="record-card-amount">${formatCurrency(r.amount)}</span>
                <span class="record-card-meta">${highlightText(r.category || 'Uncategorized', query)} · ${r.date}</span>
                <span class="record-card-actions">
                    <button class="btn-icon edit-btn" data-id="${r.id}">Edit</button>
                    <button class="btn-icon delete-btn" data-id="${r.id}">Delete</button>
                </span>
            `;
            cardList.appendChild(li);
        });
        
        
        cardList.addEventListener('click', function(e) {
            var target = e.target.closest('button');
            if (!target) return;
            var id = target.getAttribute('data-id');
            if (!id) return;
            if (target.classList.contains('edit-btn')) window.editRecord(id);
            if (target.classList.contains('delete-btn')) window.deleteRecord(id);
        });
    }
}


if (searchInput) {
    var newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    newInput.addEventListener('input', function() { renderRecords(this.value); });
}



function init() {
    console.log('🔧 Initializing records...');
    renderRecords();
    console.log(' Records ready!');
    console.log(' Click "Edit" to edit a record');
    console.log(' Click "Delete" to delete a record');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

document.addEventListener('records:changed', function() {
    renderRecords(searchInput ? searchInput.value : '');
});

console.log('records-complete.js loaded with text buttons!');