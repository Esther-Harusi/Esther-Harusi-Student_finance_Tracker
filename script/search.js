export function compileRegex(input, flags = 'i', addGlobal = false) {
  
  if (!input || !input.trim()) {
    return null;
  }

  try {
   
    let finalFlags = flags;
    
    
    if (!finalFlags.includes('u')) {
      finalFlags += 'u';
    }
    
   
    if (addGlobal && !finalFlags.includes('g')) {
      finalFlags += 'g';
    }
    
    return new RegExp(input.trim(), finalFlags);
  } catch (error) {
    
    console.debug('Invalid regex pattern:', input, error.message);
    return null;
  }
}


export function escapeHtml(str) {
  if (!str) return '';
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;'
  };
  
  return String(str).replace(/[&<>"'`]/g, function(char) {
    return htmlEscapes[char] || char;
  });
}


export function highlight(text, re, tag = 'mark') {
  
  if (!text || !re) {
    return text || '';
  }

  try {
   
    let globalRe = re;
    if (!re.flags.includes('g')) {
      
      const flags = re.flags + 'g';
      globalRe = new RegExp(re.source, flags);
    }
    
    
    const escapedText = escapeHtml(text);
    
  
    const matches = [];
    let match;
    const tempRe = new RegExp(globalRe.source, globalRe.flags);
    while ((match = tempRe.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }
    
    
    if (matches.length === 0) {
      return escapedText;
    }
    
  
    let result = '';
    let lastIndex = 0;
    
    matches.forEach(function(m) {
     
      const before = escapedText.substring(lastIndex, m.start);
      result += before;
      
     
      const matchText = text.substring(m.start, m.end);
      result += `<${tag}>${escapeHtml(matchText)}</${tag}>`;
      
      lastIndex = m.end;
    });
    
   
    result += escapedText.substring(lastIndex);
    
    return result;
  } catch (error) {
    console.debug('Highlight error:', error.message);
    return text || '';
  }
}

export function highlightText(text, query, caseSensitive = false) {
  if (!text || !query || !query.trim()) {
    return text || '';
  }
  
  try {
    const flags = caseSensitive ? 'g' : 'gi';
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escapedQuery, flags);
    return text.replace(re, function(match) {
      return '<mark>' + escapeHtml(match) + '</mark>';
    });
  } catch (error) {
    console.debug('Highlight text error:', error.message);
    return text;
  }
}


export function isValidRegex(input, flags = 'iu') {
 
  if (!input || !input.trim()) {
    return true;
  }

  try {
    new RegExp(input.trim(), flags);
    return true;
  } catch {
    return false;
  }
}



export function sanitizeRegex(str) {
  if (!str) return '';
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


export function createPhraseRegex(phrase, options = {}) {
  const {
    wholeWord = false,
    flags = 'giu'
  } = options;
  
  if (!phrase) return null;
  
  const sanitized = sanitizeRegex(phrase);
  const pattern = wholeWord ? `\\b${sanitized}\\b` : sanitized;
  
  let finalFlags = flags;
  if (!finalFlags.includes('u')) {
    finalFlags += 'u';
  }
  
  try {
    return new RegExp(pattern, finalFlags);
  } catch (error) {
    console.debug('Failed to create phrase regex:', error.message);
    return null;
  }
}


export function highlightMultiple(text, searchTerms, options = {}) {
  const {
    tag = 'mark',
    caseSensitive = false
  } = options;
  
  if (!text || !searchTerms) return text || '';
  
  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const validTerms = terms.filter(function(t) {
    return t && t.trim();
  });
  
  if (validTerms.length === 0) return text;
  
  const pattern = validTerms
    .map(function(t) {
      return sanitizeRegex(t);
    })
    .join('|');
  
  const flags = caseSensitive ? 'g' : 'gi';
  
  try {
    const re = new RegExp(pattern, flags + 'u');
    return highlight(text, re, tag);
  } catch (error) {
    console.debug('Multiple highlight error:', error.message);
    return text;
  }
}


export default {
  compileRegex,
  highlight,
  highlightText,
  isValidRegex,
  escapeHtml,
  sanitizeRegex,
  createPhraseRegex,
  highlightMultiple
};

if (window && typeof window !== 'undefined') {
  window.__search = {
    compileRegex,
    highlight,
    highlightText,
    isValidRegex,
    escapeHtml,
    sanitizeRegex,
    createPhraseRegex,
    highlightMultiple
  };
}