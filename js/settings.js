import { Storage } from './storage.js';

class Settings {
  constructor() {
    this.settings = Storage.get(Storage.KEYS.SETTINGS, {
      theme: 'dark'
    });
    
    this.applyTheme();
  }
  
  applyTheme() {
    document.body.dataset.theme = this.settings.theme;
  }
  
  toggleTheme() {
    this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    Storage.set(Storage.KEYS.SETTINGS, this.settings);
  }
}

export const settings = new Settings();
