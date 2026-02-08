# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static website for New Halabja Center for Teaching & Memorizing the Holy Qur'an. It's a vanilla HTML/CSS/JavaScript site with no build process, frameworks, or backend dependencies. The site works entirely offline and can be deployed to any static hosting service.

**Key characteristic**: This is intentionally a simple, framework-free static site. All functionality is implemented in vanilla JavaScript without dependencies.

## Running & Development

### Local Development
```bash
# No build process required
# Simply open index.html in a browser, or use a local server:
npx serve .
# Or with Python:
python -m http.server 8000
```

### Deployment
Upload the entire folder to any static hosting:
- cPanel / shared hosting
- GitHub Pages
- Netlify / Vercel
- Any CDN or file server

## Architecture & Structure

### Multi-language Support (i18n)
The site supports three languages: English (EN), Kurdish (KU), and Arabic (AR).

**Translation system**:
- All translations are defined in [assets/js/i18n.js](assets/js/i18n.js) in `window.I18N` object
- HTML elements use `data-i18n` attributes with keys like `"nav.home"`, `"hero.title1"`
- The `applyLanguage()` function in [assets/js/main.js](assets/js/main.js) applies translations on page load and language change
- RTL layout is automatically applied for Arabic and Kurdish

**Content data translations**:
- Dynamic content (activities, publications, tafsir) support multilingual fields
- Fields can be either strings (English only) or objects with `{en: "", ku: "", ar: ""}` keys
- The `getTranslatedValue(field, lang)` helper extracts the correct language version

### Page Architecture

Each HTML page follows this pattern:
1. **Header** with navigation, language selector, mobile menu
2. **Main content** specific to each page
3. **Footer** with contact info, quick links, social media
4. **Modal** for pop-up content (shared across all pages)

The `data-page` attribute on `<body>` identifies the page type (e.g., `data-page="home"`, `data-page="news"`).

### JavaScript Organization

**Core scripts** (loaded on all pages):
- [assets/js/i18n.js](assets/js/i18n.js) - Translation dictionaries
- [assets/js/site-config.js](assets/js/site-config.js) - Contact info and social media URLs
- [assets/js/main.js](assets/js/main.js) - Core functionality: mobile menu, language switching, modal system, scroll animations, program accordion

**Page-specific scripts**:
- [assets/js/data-news.js](assets/js/data-news.js) - Loads activities from JSON and populates `window.NEWS_DATA` for the home page
- [assets/js/activities-loader.js](assets/js/activities-loader.js) - Full activities page implementation with filtering, search, and modal display
- [assets/js/data-publications.js](assets/js/data-publications.js) - Publications data

**Execution order matters**: i18n.js → site-config.js → main.js → page-specific scripts

### Data Files

Content is stored in JavaScript data files (not JSON) and one JSON file:

- [assets/data/activities.json](assets/data/activities.json) - News/activities with multilingual support
- [assets/js/data-publications.js](assets/js/data-publications.js) - PDF publications metadata

**Activities data structure**:
```javascript
{
  "id": "unique-id",
  "title": {"en": "...", "ku": "...", "ar": "..."},
  "date": "2025-01-09",
  "image": "path/to/image.jpg",
  "categories": [{"en": "...", "ku": "...", "ar": "..."}],
  "summary": {"en": "...", "ku": "...", "ar": "..."},
  "content": {"en": "HTML content", "ku": "...", "ar": "..."},
  "gallery": ["img1.jpg", "img2.jpg"]
}
```

### Key UI Components

**Modal system** ([assets/js/main.js](assets/js/main.js)):
- Global modal at `#modal` managed by `window.NHC_MODAL.open(title, html)` and `window.NHC_MODAL.close()`
- Handles focus trapping, ESC key, backdrop clicks
- Used for activity details, publication previews, video playback

**Language selector**:
- Custom dropdown UI built over a native `<select id="langSelect">`
- The `setupLanguageDropdown()` function creates a styled button/menu interface
- Selection persists to `localStorage` as `nhc_lang`

**Mobile menu**:
- Drawer slides in from right with backdrop
- Toggle via hamburger button `#menuBtn`
- Closes on link click, backdrop click, or ESC key

**Activities slider** (home page):
- Horizontal scrolling carousel with arrow navigation and dot indicators
- Keyboard accessible (arrow keys, Home, End)
- Responsive: shows different numbers of cards based on viewport width

**Programs accordion** (home page):
- Desktop: all programs expanded
- Mobile (<768px): accordion behavior with one program open at a time
- Uses ResizeObserver to maintain correct `max-height` during content changes

### Scroll Animations

The `.reveal` class triggers fade-in animations when elements enter viewport:
- Implemented via IntersectionObserver in [assets/js/main.js](assets/js/main.js)
- `setupReveal()` function can be called after dynamic content is added

### Contact Configuration

Edit [assets/js/site-config.js](assets/js/site-config.js) to update:
- Phone number
- Email address
- Physical address
- Social media URLs (Facebook, Instagram, WhatsApp)

These values are automatically injected into the footer and header on every page.

## Content Updates

### Adding News/Activities
Edit [assets/data/activities.json](assets/data/activities.json) and add new activity objects with multilingual fields.

### Adding Publications
Edit [assets/js/data-publications.js](assets/js/data-publications.js) and place PDF files in `assets/pdfs/`.

### Adding Tafsir Lectures

### Adding Translations
Add new keys to [assets/js/i18n.js](assets/js/i18n.js) under the `en`, `ku`, and `ar` language objects, then reference them in HTML with `data-i18n="your.key"`.

## Common Patterns

### Reading User's Language
```javascript
const langSelect = document.getElementById('langSelect');
const currentLang = langSelect ? langSelect.value : 'en';
```

### Getting Translated Content
```javascript
function getTranslatedValue(field, lang) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field['en'] || '';
}
```

### Opening the Modal
```javascript
window.NHC_MODAL.open('Title', '<p>HTML content here</p>');
```

### Triggering Scroll Animations
After adding new `.reveal` elements to the DOM:
```javascript
if (typeof window.setupReveal === 'function') {
  window.setupReveal();
}
```

## Important Constraints

1. **No build process**: Don't introduce npm scripts, bundlers, or transpilers. Keep everything browser-native.
2. **No frameworks**: No React, Vue, jQuery, etc. Use vanilla JavaScript.
3. **Offline-first**: The site must work without a server or internet connection.
4. **Static assets only**: No server-side rendering, APIs, or databases.
5. **Manual data updates**: Content is updated by editing JavaScript/JSON files directly, not through a CMS.

## Browser Compatibility

The site uses modern JavaScript features (ES6+, IntersectionObserver, ResizeObserver) and assumes modern browser support. Graceful degradation is implemented where observers aren't available.
