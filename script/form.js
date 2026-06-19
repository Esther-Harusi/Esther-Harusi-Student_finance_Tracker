import { state, addRecord, updateRecord, saveState } from './state.js';
import { saveRecords, saveSettings } from './storage.js';
import {
  validateExpenseForm,
  validateDescription,
  validateAmount,
  validateCategory,
  validateDate,
  getErrorMessages,
} from './validators.js';
import { showToast, announceStatus, navigateTo } from './ui.js';

const form = document.getElementById('expense-form');
const editIdInput = document.getElementById('edit-id');
const formHeading = document.getElementById('form-heading');
const submitBtn = document.getElementById('form-submit-btn');
const cancelBtn = document.getElementById('form-cancel-btn');

const fields = {
  description: document.getElementById('f-description'),
  amount: document.getElementById('f-amount'),
  category: document.getElementById('f-category'),
  date: document.getElementById('f-date'),
};

const errorEls = {
  description: document.getElementById('f-description-err'),
  amount: document.getElementById('f-amount-err'),
  category: document.getElementById('f-category-err'),
  date: document.getElementById('f-date-err'),
};

const hintEls = {
  description: document.getElementById('f-description-hint'),
  amount: document.getElementById('f-amount-hint'),
};



const fieldValidators = {
  description: validateDescription,
  amount: validateAmount,
  category: validateCategory,
  date: validateDate,
};



let isDirty = false;       
let isEditing = false;     
let originalValues = {};   


function setFieldError(name, message) {
  const input = fields[name];
  const err = errorEls[name];
  
  if (!input || !err) return;
  
  err.textContent = message;
  
  if (message) {
    input.classList.add('invalid');
    input.classList.remove('valid');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', `${name}-err`);
  } else {
    input.classList.remove('invalid');
    input.classList.add('valid');
    input.setAttribute('aria-invalid', 'false');
    input.removeAttribute('aria-describedby');
  }
}


function clearFieldError(name) {
  const input = fields[name];
  const err = errorEls[name];
  
  if (!err) return;
  
  err.textContent = '';
  
  if (input) {
    input.classList.remove('invalid', 'valid');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  }
}


function clearAllErrors() {
  Object.keys(fields).forEach(clearFieldError);
}


function showAllErrors(errors) {
  Object.entries(errors).forEach(([name, msg]) => {
    setFieldError(name, msg);
  });
  
  
  const errorMessages = getErrorMessages(errors);
  if (errorMessages.length > 0) {
    announceStatus(`Form has ${errorMessages.length} error(s). Please fix them.`);
  }
}


function getFormValues() {
  return {
    description: fields.description?.value || '',
    amount: fields.amount?.value || '',
    category: fields.category?.value || '',
    date: fields.date?.value || '',
  };
}


function getOriginalValues() {
  return { ...originalValues };
}


function isFormDirty() {
  if (!isDirty) return false;
  
  const current = getFormValues();
  const original = getOriginalValues();
  
  
  for (const key of Object.keys(current)) {
    if (current[key] !== original[key]) {
      return true;
    }
  }
  
  return false;
}


function generateId() {
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}


function setDefaultDate() {
  if (fields.date && !fields.date.value) {
    fields.date.value = new Date().toISOString().slice(0, 10);
  }
}


export function resetForm(keepErrors = false) {
  
  if (form) form.reset();
  
 
  editIdInput.value = '';
  isEditing = false;
  isDirty = false;
  
  
  formHeading.textContent = 'Add expense';
  submitBtn.textContent = 'Save expense';
  cancelBtn.style.display = 'inline-block';
  
  
  if (!keepErrors) {
    clearAllErrors();
  }
  
  
  setDefaultDate();
  
  
  originalValues = getFormValues();
}


export function openEditForm(record) {
  if (!record) {
    console.warn('No record provided for editing');
    return;
  }
  
  
  editIdInput.value = record.id;
  fields.description.value = record.description || '';
  fields.amount.value = record.amount?.toString() || '';
  fields.category.value = record.category || '';
  fields.date.value = record.date || '';
  
 
  formHeading.textContent = 'Edit expense';
  submitBtn.textContent = 'Save changes';
  cancelBtn.style.display = 'inline-block';
  
 
  isEditing = true;
  isDirty = false;
  
 
  originalValues = getFormValues();
  
  
  clearAllErrors();
  
 
  navigateTo('add-record');
  
  
  setTimeout(() => {
    fields.description?.focus();
  }, 100);
  

  announceStatus(`Editing record: ${record.description}`);
}


function handleSubmit(event) {
  event.preventDefault();
  
  const values = getFormValues();
  const { valid, errors } = validateExpenseForm(values);
  
  
  showAllErrors(errors);
  
  if (!valid) {
  
    const firstInvalid = Object.keys(errors).find(key => errors[key]);
    if (firstInvalid && fields[firstInvalid]) {
      fields[firstInvalid].focus();
    }
    announceStatus('Please fix the errors in the form.');
    return;
  }
  
  
  const now = new Date().toISOString();
  const editingId = editIdInput.value;
  
  const recordData = {
    description: values.description.trim(),
    amount: parseFloat(values.amount),
    category: values.category,
    date: values.date,
    updatedAt: now,
  };
  
  try {
    if (editingId) {
     
      const success = updateRecord(editingId, recordData, false);
      if (success) {
        showToast('Record updated successfully.', 'success');
        announceStatus('Record updated.');
      } else {
        throw new Error('Record not found');
      }
    } else {
      
      const newRecord = {
        id: generateId(),
        ...recordData,
        createdAt: now,
      };
      
      const success = addRecord(newRecord, false);
      if (success) {
        showToast('Expense saved successfully.', 'success');
        announceStatus('New expense added.');
      } else {
        throw new Error('Failed to add record');
      }
    }
    
   
    saveState(true);
    
 
    resetForm();
    
   
    document.dispatchEvent(new CustomEvent('records:changed'));
    
   
    navigateTo('records');
    
  } catch (error) {
    console.error('Form submit error:', error);
    showToast('Error saving record. Please try again.', 'error');
    announceStatus('Error saving record.');
  }
}


function handleCancel() {
 
  if (isFormDirty()) {
    if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return;
    }
  }
  
  resetForm();
  navigateTo('records');
  showToast('Cancelled.', '');
}


function setupValidation() {
  Object.entries(fields).forEach(([name, input]) => {
    if (!input) return;
    
    
    input.addEventListener('blur', () => {
      if (input.value.trim() !== '' || name === 'category') {
        const error = fieldValidators[name]?.(input.value);
        setFieldError(name, error || '');
      }
    });
    
   
    input.addEventListener('input', () => {
      if (input.classList.contains('invalid')) {
        clearFieldError(name);
        isDirty = true;
      }
    });
    
    
    input.addEventListener('change', () => {
      isDirty = true;
    });
  });
}


function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {

    // Ctrl+Enter or Cmd+Enter to submit

    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      if (document.activeElement?.closest('#expense-form')) {
        event.preventDefault();
        form?.dispatchEvent(new Event('submit'));
      }
    }
    
   
    if (event.key === 'Escape') {
      if (document.activeElement?.closest('#expense-form')) {
        event.preventDefault();
        handleCancel();
      }
    }
  });
}


if (form) {
  form.addEventListener('submit', handleSubmit);
}


if (cancelBtn) {
  cancelBtn.addEventListener('click', handleCancel);
}


document.addEventListener('records:edit', (event) => {
  openEditForm(event.detail);
});


document.addEventListener('records:changed', () => {
  
  if (isFormDirty() && !isEditing) {
    resetForm();
  }
});


function initForm() {
  
  setDefaultDate();
  

  setupValidation();
  
  
  setupKeyboardShortcuts();
  
  resetForm();
  
  console.log('Form module initialized');
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initForm);
} else {
  initForm();
}



if (window && window.__DEV__) {
  window.__form = {
    resetForm,
    openEditForm,
    getFormValues,
    isFormDirty,
    fields,
    errorEls,
  };
}



export default {
  resetForm,
  openEditForm,
  isFormDirty,
};