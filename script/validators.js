//Regex

export const PATTERNS = {
 
  description: /^\S(?:.*\S)?$/,

 
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,


  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

  
  
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,


  duplicateWord: /\b(\w+)\s+\1\b/i,

  
  rate: /^(0|[1-9]\d*)(\.\d{1,6})?$/,

  
  budget: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
};



export const ALLOWED_CATEGORIES = [
  'Food',
  'Books',
  'Transport',
  'Entertainment',
  'Fees',
  'Other'
];



const ERROR_MESSAGES = {
  REQUIRED: (field) => `${field} is required.`,
  INVALID: (field) => `Please enter a valid ${field}.`,
  LEADING_SPACE: 'Remove any leading or trailing spaces.',
  DOUBLE_SPACE: 'Avoid double spaces in the description.',
  DUPLICATE_WORD: 'Description contains a duplicate consecutive word.',
  AMOUNT_FORMAT: 'Enter a valid amount (e.g., 12.50, max 2 decimal places).',
  AMOUNT_POSITIVE: 'Amount must be greater than zero.',
  DATE_FORMAT: 'Date must be in YYYY-MM-DD format.',
  DATE_INVALID: 'That date does not exist.',
  CATEGORY_REQUIRED: 'Please select a category.',
  CATEGORY_INVALID: 'Please select a valid category.',
  RATE_FORMAT: 'Enter a positive number (e.g., 0.92).',
  RATE_POSITIVE: 'Rate must be greater than zero.',
  BUDGET_FORMAT: 'Enter a valid budget amount (e.g., 500).',
  BUDGET_POSITIVE: 'Budget must be greater than zero.',
};


function cleanString(val) {
  return val !== null && val !== undefined ? String(val).trim() : '';
}


function isEmpty(str) {
  return !str || str.trim() === '';
}


function hasDoubleSpaces(str) {
  return /  /.test(str);
}


function hasDuplicateWords(str) {
  return PATTERNS.duplicateWord.test(str);
}


function isValidCalendarDate(dateStr) {
  try {
    const parts = dateStr.split('-').map(Number);
    const year = parts[0];
    const month = parts[1] - 1; 
    const day = parts[2];
    
    const date = new Date(year, month, day);
    return date.getFullYear() === year &&
           date.getMonth() === month &&
           date.getDate() === day;
  } catch {
    return false;
  }
}


export function validateDescription(val) {
  const v = cleanString(val);
  
 
  if (isEmpty(v)) {
    return ERROR_MESSAGES.REQUIRED('Description');
  }
  
  
  if (!PATTERNS.description.test(v)) {
    return ERROR_MESSAGES.LEADING_SPACE;
  }
  
  
  if (hasDoubleSpaces(v)) {
    return ERROR_MESSAGES.DOUBLE_SPACE;
  }
  
 
  if (hasDuplicateWords(v)) {
    return ERROR_MESSAGES.DUPLICATE_WORD;
  }
  
  return '';
}


export function validateAmount(val) {
  const v = cleanString(val);
  

  if (isEmpty(v)) {
    return ERROR_MESSAGES.REQUIRED('Amount');
  }
  
  
  if (!PATTERNS.amount.test(v)) {
    return ERROR_MESSAGES.AMOUNT_FORMAT;
  }
  
  
  if (parseFloat(v) <= 0) {
    return ERROR_MESSAGES.AMOUNT_POSITIVE;
  }
  
  return '';
}


export function validateDate(val) {
  const v = cleanString(val);
  
 
  if (isEmpty(v)) {
    return ERROR_MESSAGES.REQUIRED('Date');
  }
  
  
  if (!PATTERNS.date.test(v)) {
    return ERROR_MESSAGES.DATE_FORMAT;
  }
  
 
  if (!isValidCalendarDate(v)) {
    return ERROR_MESSAGES.DATE_INVALID;
  }
  
  return '';
}


export function validateCategory(val, allowedCategories = ALLOWED_CATEGORIES) {
  const v = cleanString(val);
  
 
  if (isEmpty(v)) {
    return ERROR_MESSAGES.CATEGORY_REQUIRED;
  }
  
  
  if (!PATTERNS.category.test(v)) {
    return ERROR_MESSAGES.CATEGORY_INVALID;
  }
  
  
  if (allowedCategories && allowedCategories.length > 0) {
    if (!allowedCategories.includes(v)) {
      return ERROR_MESSAGES.CATEGORY_INVALID;
    }
  }
  
  return '';
}


export function validateRate(val) {
  const v = cleanString(val);
  
 
  if (isEmpty(v)) {
    return ERROR_MESSAGES.REQUIRED('Rate');
  }
  
 
  if (!PATTERNS.rate.test(v)) {
    return ERROR_MESSAGES.RATE_FORMAT;
  }
  

  if (parseFloat(v) <= 0) {
    return ERROR_MESSAGES.RATE_POSITIVE;
  }
  
  return '';
}


export function validateBudget(val) {
  const v = cleanString(val);
  
  
  if (isEmpty(v)) {
    return '';
  }
  
 
  if (!PATTERNS.budget.test(v)) {
    return ERROR_MESSAGES.BUDGET_FORMAT;
  }
  
 
  if (parseFloat(v) <= 0) {
    return ERROR_MESSAGES.BUDGET_POSITIVE;
  }
  
  return '';
}


export function validateExpenseForm(data, allowedCategories = ALLOWED_CATEGORIES) {
  const errors = {
    description: validateDescription(data?.description),
    amount: validateAmount(data?.amount),
    category: validateCategory(data?.category, allowedCategories),
    date: validateDate(data?.date),
  };
  
  const valid = Object.values(errors).every(error => error === '');
  
  return { valid, errors };
}


export function validateSettingsForm(data) {
  const errors = {
    budget: validateBudget(data?.budget),
    eur: validateRate(data?.eur),
    gbp: validateRate(data?.gbp),
  };
  
  const valid = Object.values(errors).every(error => error === '');
  
  return { valid, errors };
}


export function getErrorMessages(errors) {
  if (!errors) return [];
  
  return Object.entries(errors)
    .filter(([field, error]) => error !== '')
    .map(([field, error]) => `${field}: ${error}`);
}



if (window && window.__DEV__) {
  window.__validators = {
    PATTERNS,
    ALLOWED_CATEGORIES,
    ERROR_MESSAGES,
    validateDescription,
    validateAmount,
    validateDate,
    validateCategory,
    validateRate,
    validateBudget,
    validateExpenseForm,
    validateSettingsForm,
    getErrorMessages,
  };
}



export default {
  PATTERNS,
  ALLOWED_CATEGORIES,
  ERROR_MESSAGES,
  validateDescription,
  validateAmount,
  validateDate,
  validateCategory,
  validateRate,
  validateBudget,
  validateExpenseForm,
  validateSettingsForm,
  getErrorMessages,
};