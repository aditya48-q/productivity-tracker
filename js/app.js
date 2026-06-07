import { UIManager } from './ui.js';
import { Storage } from './storage.js';
import { settings } from './settings.js';
import { Onboarding } from './onboarding.js';
import { visualManager } from './visuals.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Ensure the theme is correctly applied before rendering
  settings.applyTheme();
  
  // Initialize PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('SW registered: ', registration.scope))
        .catch(err => console.log('SW registration failed: ', err));
    });
  }
  
  // Initialize UI components
  window.appUI = new UIManager();
  
  // Initialize Onboarding
  window.appOnboarding = new Onboarding();
  
  console.log('FocusFlow Premium Dashboard Initialized');
});
