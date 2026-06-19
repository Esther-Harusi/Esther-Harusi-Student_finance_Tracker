// ============================================
// scripts/ui.js - User Interface Controller
// Handles navigation, toasts, dialogs, and ARIA announcements
// ============================================

import { state } from './state.js';

// ─── DOM REFERENCES ───────────────────────────────────────────
// Cache DOM elements for performance

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.page-section');
const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('#primary-nav');
const statusMsg = document.getElementById('status-msg');
const budgetAlert = document.getElementById('budget-alert');

// ─── SECTION MANAGEMENT ──────────────────────────────────────

/**
 * Show a specific section and hide all others
 * @param {string} id - The ID of the section to show
 */
function showSection(id) {
  // Validate section ID
  if (!id) {
    console.warn('ui.js: No section ID provided');
    return;
  }

  // Find the target section
  const targetSection = document.getElementById(id);
  if (!targetSection) {
    console.warn(`ui.js: Section "${id}" not found`);
    return;
  }

  // Hide all sections, show target
  sections.forEach(section => {
    const isTarget = section === targetSection;
    section.hidden = !isTarget;
    section.classList.toggle('active', isTarget);
  });

  // Update navigation links
  navLinks.forEach(link => {
    const isActive = link.dataset.section === id;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Focus the heading for screen readers
  const heading = targetSection.querySelector('h1, h2');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  // Close mobile nav
  closeMobileNav();

  // Update URL hash without triggering scroll
  if (history && history.replaceState) {
    history.replaceState(null, '', `#${id}`);
  }
}

/**
 * Close the mobile navigation menu
 */
function closeMobileNav() {
  if (primaryNav && primaryNav.classList.contains('open')) {
    primaryNav.classList.remove('open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
    }
  }
}

/**
 * Toggle the mobile navigation menu
 */
function toggleMobileNav() {
  if (!primaryNav || !navToggle) return;
  
  const isOpen = primaryNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute(
    'aria-label',
    isOpen ? 'Close navigation menu' : 'Open navigation menu'
  );
}

// ─── NAVIGATION EVENT LISTENERS ─────────────────────────────

// Navigation link clicks
navLinks.forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const sectionId = link.dataset.section;
    if (sectionId) {
      showSection(sectionId);
    }
  });
});

// Hamburger menu toggle
if (navToggle && primaryNav) {
  navToggle.addEventListener('click', toggleMobileNav);
}

// Close nav when clicking outside
document.addEventListener('click', event => {
  if (!primaryNav || !navToggle) return;
  
  const isInsideNav = primaryNav.contains(event.target);
  const isToggle = navToggle.contains(event.target);
  
  if (!isInsideNav && !isToggle && primaryNav.classList.contains('open')) {
    closeMobileNav();
  }
});

// Close nav on Escape key
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && primaryNav && primaryNav.classList.contains('open')) {
    closeMobileNav();
    if (navToggle) navToggle.focus();
  }
});

// ─── TOAST NOTIFICATIONS ─────────────────────────────────────

let toastElement = null;
let toastTimeout = null;

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', or '' (empty for neutral)
 * @param {number} duration - How long to show the toast (ms)
 */
export function showToast(message, type = '', duration = 3000) {
  // Validate input
  if (!message) {
    console.warn('ui.js: showToast called with empty message');
    return;
  }

  // Create toast element if it doesn't exist
  if (!toastElement) {
    toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.setAttribute('role', 'status');
    toastElement.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastElement);
  }

  // Clear any existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  // Update toast content and appearance
  toastElement.textContent = message;
  toastElement.className = `toast ${type}`;
  
  // Force reflow for animation
  void toastElement.offsetHeight;
  toastElement.classList.add('show');

  // Auto-hide after duration
  toastTimeout = setTimeout(() => {
    toastElement.classList.remove('show');
    toastTimeout = null;
  }, duration);
}

/**
 * Quick success toast
 * @param {string} message - Success message
 */
export function showSuccessToast(message) {
  showToast(message, 'success');
}

/**
 * Quick error toast
 * @param {string} message - Error message
 */
export function showErrorToast(message) {
  showToast(message, 'error');
}

// ─── ARIA LIVE REGIONS ──────────────────────────────────────

/**
 * Announce a status message (polite)
 * @param {string} message - The message to announce
 */
export function announceStatus(message) {
  if (!statusMsg) {
    console.warn('ui.js: status-msg element not found');
    return;
  }

  // Clear and re-set to ensure announcement
  statusMsg.textContent = '';
  requestAnimationFrame(() => {
    statusMsg.textContent = message || '';
  });
}

/**
 * Announce a budget alert with appropriate urgency
 * @param {string} message - The alert message
 * @param {string} urgency - 'polite' or 'assertive'
 */
export function announceBudgetAlert(message, urgency = 'polite') {
  if (!budgetAlert) {
    console.warn('ui.js: budget-alert element not found');
    return;
  }

  // Validate urgency
  const validUrgencies = ['polite', 'assertive'];
  const finalUrgency = validUrgencies.includes(urgency) ? urgency : 'polite';

  // Update ARIA live attribute
  budgetAlert.setAttribute('aria-live', finalUrgency);
  
  // Clear and re-set to force re-announcement
  budgetAlert.textContent = '';
  requestAnimationFrame(() => {
    budgetAlert.textContent = message || '';
  });
}

// ─── CONFIRM DIALOG ─────────────────────────────────────────

/**
 * Show a confirmation dialog
 * @param {string} message - The confirmation message
 * @param {string} confirmText - Text for the confirm button (default: 'Delete')
 * @param {string} cancelText - Text for the cancel button (default: 'Cancel')
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export function confirmDialog(message, confirmText = 'Delete', cancelText = 'Cancel') {
  return new Promise((resolve) => {
    // Validate message
    if (!message) {
      console.warn('ui.js: confirmDialog called with empty message');
      resolve(false);
      return;
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'confirm-title');

    overlay.innerHTML = `
      <div class="confirm-dialog">
        <h2 id="confirm-title">Are you sure?</h2>
        <p>${escapeHtml(message)}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="confirm-cancel">${escapeHtml(cancelText)}</button>
          <button class="btn btn-primary" id="confirm-ok">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Store previously focused element
    const previouslyFocused = document.activeElement;

    // Add dialog-open class for visual effect
    document.body.classList.add('dialog-open');

    // Get button references
    const cancelBtn = overlay.querySelector('#confirm-cancel');
    const okBtn = overlay.querySelector('#confirm-ok');

    // Focus cancel by default (safer)
    if (cancelBtn) cancelBtn.focus();

    // Cleanup function
    function closeDialog(result) {
      document.body.classList.remove('dialog-open');
      overlay.remove();
      
      // Restore focus
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
      
      resolve(result);
    }

    // Event listeners
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => closeDialog(false));
    }
    
    if (okBtn) {
      okBtn.addEventListener('click', () => closeDialog(true));
    }

    // Keyboard handling
    overlay.addEventListener('keydown', (event) => {
      // Escape key cancels
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog(false);
        return;
      }

      // Tab trapping
      if (event.key === 'Tab' && cancelBtn && okBtn) {
        const isShiftTab = event.shiftKey;
        const isCancelFocused = document.activeElement === cancelBtn;
        const isOkFocused = document.activeElement === okBtn;

        // Shift+Tab from Cancel → wrap to OK
        if (isShiftTab && isCancelFocused) {
          event.preventDefault();
          okBtn.focus();
        }
        // Tab from OK → wrap to Cancel
        else if (!isShiftTab && isOkFocused) {
          event.preventDefault();
          cancelBtn.focus();
        }
      }
    });
  });
}

/**
 * Simple HTML escaping to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── HASH ROUTING ───────────────────────────────────────────

/**
 * Initialize the app with the current URL hash
 */
function initFromHash() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  const validSections = ['dashboard', 'records', 'add-record', 'settings', 'about'];
  
  // Only show valid sections
  const sectionId = validSections.includes(hash) ? hash : 'dashboard';
  showSection(sectionId);
}

// ─── EXPOSE NAVIGATION FOR OTHER MODULES ──────────────────

/**
 * Navigate to a specific section (for use by other modules)
 * @param {string} sectionId - The section ID to navigate to
 */
export function navigateTo(sectionId) {
  showSection(sectionId);
}

// ─── INITIALIZATION ─────────────────────────────────────────

// Initialize from URL hash when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFromHash);
} else {
  initFromHash();
}

// ─── EXPOSE FOR DEBUGGING ──────────────────────────────────

// Make key functions available globally for debugging
if (window && window.__DEV__) {
  window.__ui = {
    showSection,
    showToast,
    confirmDialog,
    announceStatus,
    announceBudgetAlert,
    navigateTo
  };
}