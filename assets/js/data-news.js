// Initialize with empty array
window.NEWS_DATA = [];

// Store activities data globally
let activitiesDataCache = [];

// Get current language
function getCurrentLanguage() {
  const langSelect = document.getElementById('langSelect');
  return langSelect ? langSelect.value : 'en';
}

// Get translated value
function getTranslatedValue(field, lang) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field['en'] || '';
}

// Function to update NEWS_DATA
function updateNewsData(lang) {
  if (activitiesDataCache.length === 0) return;
  
  const sortedActivities = [...activitiesDataCache].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  }).slice(0, 5);
  
  window.NEWS_DATA = sortedActivities.map(activity => ({
    id: activity.id,
    title: getTranslatedValue(activity.title, lang),
    date: activity.date,
    image: activity.image || 'assets/img/3.jpg',
    tags: Array.isArray(activity.tags) ? activity.tags : [],
    excerpt: getTranslatedValue(activity.summary, lang),
    contentHtml: getTranslatedValue(activity.content, lang)
  }));
}

// Fetch and initialize
async function loadActivitiesData() {
  try {
    const response = await fetch('assets/data/activities.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    activitiesDataCache = await response.json();
    
    // Initial load
    const lang = getCurrentLanguage();
    updateNewsData(lang);
    
    // Trigger render event
    window.dispatchEvent(new CustomEvent('newsDataReady'));
    
  } catch (error) {
    console.error('Error loading activities:', error);
    window.NEWS_DATA = [];
  }
}

// Listen for language changes
document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', () => {
      const newLang = getCurrentLanguage();
      updateNewsData(newLang);
      window.dispatchEvent(new CustomEvent('newsDataReady'));
    });
  }
});

// Start loading immediately
loadActivitiesData();
