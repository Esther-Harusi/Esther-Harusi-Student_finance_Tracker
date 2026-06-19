import { state }                       from './state.js';
import { saveSettings, saveRecords }   from './storage.js';
import { validateBudget, validateRate,
         validateCategory, PATTERNS }  from './validators.js';
import { showToast, announceStatus }   from './ui.js';



const settingsForm    = document.getElementById('settings-form');
const budgetInput     = document.getElementById('s-budget');
const eurInput        = document.getElementById('s-eur');
const gbpInput        = document.getElementById('s-gbp');
const budgetErr       = document.getElementById('s-budget-err');
const eurErr          = document.getElementById('s-eur-err');
const gbpErr          = document.getElementById('s-gbp-err');

const categoriesList  = document.getElementById('categories-list');
const newCatInput     = document.getElementById('s-new-category');
const addCatBtn       = document.getElementById('add-category-btn');
const catErr          = document.getElementById('s-cat-err');

const exportBtn       = document.getElementById('export-btn');
const importFile      = document.getElementById('import-file');
const importErr       = document.getElementById('import-err');



function populateForm() {
  budgetInput.value = state.settings.budget  || '';
  eurInput.value    = state.settings.eurRate || '';
  gbpInput.value    = state.settings.gbpRate || '';
  renderCategoryChips();
}



function renderCategoryChips() {
  categoriesList.innerHTML = '';

  state.settings.categories.forEach(cat => {
    const chip = document.createElement('span');
    chip.className = 'category-chip';
    chip.setAttribute('role', 'listitem');

    const label = document.createElement('span');
    label.textContent = cat;

    const removeBtn = document.createElement('button');
    removeBtn.type      = 'button';
    removeBtn.className = 'category-chip-remove';
    removeBtn.textContent = '';
    removeBtn.setAttribute('aria-label', `Remove ${cat}`);

    removeBtn.addEventListener('click', () => removeCategory(cat));

    chip.appendChild(label);
    chip.appendChild(removeBtn);
    categoriesList.appendChild(chip);
  });
}


function addCategory() {
  const val = newCatInput.value.trim();

  
  const formatError = validateCategory(val);
  if (formatError) {
    showFieldError(catErr, formatError);
    newCatInput.focus();
    return;
  }

 
  const isDuplicate = state.settings.categories
    .some(c => c.toLowerCase() === val.toLowerCase());
  if (isDuplicate) {
    showFieldError(catErr, `"${val}" already exists.`);
    newCatInput.focus();
    return;
  }

 
  state.settings.categories.push(val);
  saveSettings(state.settings);
  renderCategoryChips();
  updateCategoryDropdown();

  newCatInput.value = '';
  clearFieldError(catErr);
  announceStatus(`Category "${val}" added.`);
}


function removeCategory(cat) {
  state.settings.categories = state.settings.categories.filter(c => c !== cat);
  saveSettings(state.settings);
  renderCategoryChips();
  updateCategoryDropdown();
  announceStatus(`Category "${cat}" removed.`);
}



function updateCategoryDropdown() {
  const select = document.getElementById('f-category');
  if (!select) return;

  const currentValue = select.value; 
  select.innerHTML = '<option value="">— Select a category —</option>';

  state.settings.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value       = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

 
  select.value = currentValue;
}



settingsForm.addEventListener('submit', e => {
  e.preventDefault();

  const budgetVal = budgetInput.value.trim();
  const eurVal    = eurInput.value.trim();
  const gbpVal    = gbpInput.value.trim();

  const budgetError = validateBudget(budgetVal);
  const eurError    = eurVal ? validateRate(eurVal) : '';
  const gbpError    = gbpVal ? validateRate(gbpVal) : '';

  showFieldError(budgetErr, budgetError);
  showFieldError(eurErr,    eurError);
  showFieldError(gbpErr,    gbpError);

  if (budgetError || eurError || gbpError) {
   
    if (budgetError) budgetInput.focus();
    else if (eurError) eurInput.focus();
    else gbpInput.focus();
    return;
  }

  
  state.settings.budget  = budgetVal  ? parseFloat(budgetVal) : 0;
  state.settings.eurRate = eurVal     ? parseFloat(eurVal)    : state.settings.eurRate;
  state.settings.gbpRate = gbpVal     ? parseFloat(gbpVal)    : state.settings.gbpRate;

  
  saveSettings(state.settings);


  document.dispatchEvent(new CustomEvent('settings:changed'));

  showToast('Settings saved.', 'success');
  announceStatus('Settings saved successfully.');
});



exportBtn.addEventListener('click', () => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version:    1,                         
    records:    state.records,
    settings:   state.settings,
  };

  const json = JSON.stringify(exportData, null, 2); 
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);

  const today    = new Date().toISOString().slice(0, 10); 
  const filename = `finance-tracker-${today}.json`;

  
  const a  = document.createElement('a');
  a.href   = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  
  URL.revokeObjectURL(url);

  showToast('Exported successfully.', 'success');
  announceStatus(`Records exported as ${filename}.`);
});



importFile.addEventListener('change', () => {
  const file = importFile.files[0];
  if (!file) return;

  clearFieldError(importErr);

 
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    showFieldError(importErr, 'Please select a .json file.');
    return;
  }


  if (file.size > 5 * 1024 * 1024) {
    showFieldError(importErr, 'File is too large (max 5MB).');
    return;
  }

  const reader = new FileReader();

  
  reader.onload = (e) => {
    let parsed;

  
    try {
      parsed = JSON.parse(e.target.result);
    } catch {
      showFieldError(importErr, 'Invalid JSON — file could not be parsed.');
      importFile.value = '';
      return;
    }

   
    const validationError = validateImportStructure(parsed);
    if (validationError) {
      showFieldError(importErr, validationError);
      importFile.value = '';
      return;
    }

   
    const count = state.records.length;
    if (count > 0) {
      const ok = window.confirm(
        `This will replace your ${count} existing record${count !== 1 ? 's' : ''}. Continue?`
      );
      if (!ok) {
        importFile.value = '';
        return;
      }
    }

    state.records = parsed.records;
    saveRecords(state.records);

   
    if (parsed.settings) {
      Object.assign(state.settings, parsed.settings);
      saveSettings(state.settings);
      populateForm(); 
    }

   
    document.dispatchEvent(new CustomEvent('records:changed'));
    document.dispatchEvent(new CustomEvent('settings:changed'));

    importFile.value = ''; 
    showToast(`Imported ${parsed.records.length} records.`, 'success');
    announceStatus(`Import complete: ${parsed.records.length} records loaded.`);
  };

  
  reader.onerror = () => {
    showFieldError(importErr, 'Could not read the file. Try again.');
    importFile.value = '';
  };

  
  reader.readAsText(file);
});



function validateImportStructure(data) {
 
  if (!data || typeof data !== 'object') {
    return 'File does not contain a valid JSON object.';
  }


  if (!Array.isArray(data.records)) {
    return 'JSON must have a "records" array at the top level.';
  }

 
  for (let i = 0; i < data.records.length; i++) {
    const r   = data.records[i];
    const pos = `Record ${i + 1}`; 

    if (!r || typeof r !== 'object') {
      return `${pos}: must be an object.`;
    }
    if (typeof r.id !== 'string' || !r.id.trim()) {
      return `${pos}: "id" must be a non-empty string.`;
    }
    if (typeof r.description !== 'string' || !r.description.trim()) {
      return `${pos}: "description" must be a non-empty string.`;
    }
    if (typeof r.amount !== 'number' || !isFinite(r.amount) || r.amount <= 0) {
      return `${pos}: "amount" must be a positive number.`;
    }
    if (typeof r.category !== 'string' || !r.category.trim()) {
      return `${pos}: "category" must be a non-empty string.`;
    }
    if (typeof r.date !== 'string' || !PATTERNS.date.test(r.date)) {
      return `${pos}: "date" must be in YYYY-MM-DD format.`;
    }
  }

  return ''; 
}



function showFieldError(el, message) {
  if (!el) return;
  el.textContent = message;
}

function clearFieldError(el) {
  if (!el) return;
  el.textContent = '';
}


addCatBtn.addEventListener('click', addCategory);

newCatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault(); 
    addCategory();
  }
});

newCatInput.addEventListener('input', () => clearFieldError(catErr));



document.addEventListener('settings:changed', () => {
  populateForm();
  updateCategoryDropdown();
});



populateForm();
updateCategoryDropdown();