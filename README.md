# Student Finance Tracker

A fully accessible, responsive, vHTML/CSS/JS Student  Finance tracker. It helps students to budget 
Track and know how they  use their money.

**GitHub Pages URL:** https://your-username.github.io/finance-tracker/

---


---

## Features

| Feature | Detail |
|---|---|
| Add / edit / delete records | Inline edit, confirmed delete |
| Live regex search | Matches description and category, highlights results in `<mark>` |
| Sort | By date, description (A–Z), or amount. Click again to reverse |
| Budget cap | Monthly limit . |
| 7-day chart | Bar chart of daily spending for the last 7 days |
| Currency conversion | USD to Kenyan Shillings to Rwandan Francs in Settings |
| JSON export | Downloads a dated `.json` backup file |
| JSON import | Validates structure record-by-record before loading |
| Custom categories | Add / remove categories; syncs to expense form dropdown |

| Keyboard navigation | Full app usable without a mouse |
| Screen reader support | ARIA landmarks, live regions, labels, roles throughout |

---

## Regex catalog

| Pattern | Purpose | Valid example | Invalid example |
|---|---|---|---|
| `/^\S(?:.*\S)?$/` | No leading/trailing spaces | `"Lunch"` | `" Lunch"` |
| `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Amount ≤ 2 decimal places | `"12.50"` | `"12.555"` |
| `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | Date YYYY-MM-DD | `"2025-09-29"` | `"29/09/2025"` |
| `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Category name | `"Lab Fees"` | `"Food!!!"` |
| `/\b(\w+)\s+\1\b/i` |  Advanced: duplicate word (back-reference) | — | `"coffee coffee"` |
| `/^(0\|[1-9]\d*)(\.\d{1,6})?$/` | Exchange rate | `"0.920000"` | `"abc"` |
| `/(coffee\|tea)/i` | Search: beverage keyword | `"Coffee with friends"` | — |
| `/\.\d{2}\b/` | Search: amount has cents | `"$12.50"` | `"$12"` |

The duplicate-word pattern uses a **back-reference** (`\1`): it captures the first word in group 1, then `\1` requires the same word to appear again immediately after whitespace. This is the "advanced regex" requirement.


## File structure

```
finance-tracker/
├── index.html            — single HTML file, all 5 sections
├── seed.json             — 10 sample records (importable via Settings)
├── tests.html            — 55 regex/validator assertions, no build needed
├── README.md
│
├── styles/
│   └── main.css          — mobile-first CSS, 3 breakpoints, dark theme
│
└── scripts/
    ├── app.js            — single entry point, imports all modules
             
    ├── ui.js             — nav, toasts, confirm dialog with focus trap
    ├── state.js          — single shared in-memory state object
    ├── storage.js        — localStorage read/write helpers
    ├── validators.js     — all 6 regex patterns + validator functions
    ├── search.js         — safe regex compiler + highlight helper
    ├── records-complete.js        — filter, sort, render table/cards, edit/delete
    ├── form.js           — add/edit form wiring and validation
    ├── dashboard.js      — stats cards, budget bar, 7-day chart
    └── settings.js       — settings form, categories, import/export
```

---

## Keyboard map

| Key | Where | Action |
|---|---|---|
| `Tab` | Anywhere | Move to next interactive element |
| `Shift + Tab` | Anywhere | Move to previous element |
| `Enter` / `Space` | Button or link | Activate |
| `Escape` | Confirm dialog | Cancel and close |
| `Tab` | Confirm dialog | Cycle between Cancel and Delete (focus trapped) |
| `Arrow keys` | Select dropdown | Navigate category options |
| `Enter` | Category input | Add new category (same as clicking Add) |
| Skip link | Page load, first Tab | Jump straight to main content |

### How to test keyboard navigation
1. Click anywhere on the page, then press `Tab` repeatedly
2. You should see a visible blue outline on every button, link, and input
3. Navigate to Add Expense, fill the form with the keyboard only, and submit with `Enter.`
4. Navigate to Records, Tab to a Delete button, press `Enter`, then use `Tab` and `Enter` in the confirm dialog
5. At no point should focus become invisible or get stuck

---

## Accessibility notes

### Landmarks
Every page region uses a semantic HTML landmark element:
- `<header role="banner">` — site header and nav
- `<nav aria-label="Primary navigation">` — navigation links
- `<main id="main-content" tabindex="-1">` — main content (skip link target)
- `<footer role="contentinfo">` — footer
- `<section aria-labelledby="...">` — each page section

### ARIA live regions
| Element | Type | Used for |
|---|---|---|
| `#status-msg` | `aria-live="polite"` | Save/delete confirmations |
| `#budget-alert` | `aria-live="assertive"` (over budget) or `"polite"` (warning) | Budget alerts |
| `#results-count` | `aria-live="polite"` | Search result count updates |
| Form error spans | `role="alert"` + `aria-live="polite"` | Inline field errors |

### Focus management
- **Skip link**: first focusable element on every page; jumps to `#main-content`
- **Section navigation**: `h1` of each section receives focus when the section becomes active (screen readers announce the new page title)
- **Confirm dialog**: focus moves into dialog on open; Tab is trapped between Cancel and Delete; focus returns to the triggering element on close
- **Form errors**: after failed submit, focus moves to the first invalid field


- 

### Reduced motion
All animations and transitions are disabled via:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## How to run

**Option 1 — VS Code Live Server**
1. Open the `finance-tracker` folder in VS Code
2. Right-click `index.html` → Open with Live Server



## How to run tests

Open `tests.html` in a browser while the app is served—no build step needed. You should see 55 tests all passing green.

---

## How to load sample data

1. Go to **Settings**
2. Under Data, click **Import JSON**
3. Select `seed.json` from the project folder
4. 10 diverse records will load, including edge cases (large amounts, old dates, small amounts)





