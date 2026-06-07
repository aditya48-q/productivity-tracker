// LocalStorage handling module

export const Storage = {
  KEYS: {
    TASKS: 'focusflow_tasks',
    SETTINGS: 'focusflow_settings',
    ANALYTICS: 'focusflow_analytics',
    POMODORO: 'focusflow_pomodoro'
  },

  // Generic Get
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  },

  // Generic Set
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  },

  // Get Tasks
  getTasks() {
    return this.get(this.KEYS.TASKS, []);
  },

  // Save Tasks
  saveTasks(tasks) {
    this.set(this.KEYS.TASKS, tasks);
  },

  // Get Analytics
  getAnalytics() {
    const defaultAnalytics = {
      daily: {},
      focusHours: Array(7).fill(0),
      completedTasks: 0,
      streak: 0,
      lastLogin: new Date().toISOString().split('T')[0]
    };
    return this.get(this.KEYS.ANALYTICS, defaultAnalytics);
  },

  saveAnalytics(analytics) {
    this.set(this.KEYS.ANALYTICS, analytics);
  },

  // Export Data
  exportData() {
    const data = {
      tasks: this.getTasks(),
      settings: this.get(this.KEYS.SETTINGS, {}),
      analytics: this.getAnalytics(),
      pomodoro: this.get(this.KEYS.POMODORO, {})
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Import Data
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.tasks) this.saveTasks(data.tasks);
          if (data.settings) this.set(this.KEYS.SETTINGS, data.settings);
          if (data.analytics) this.saveAnalytics(data.analytics);
          if (data.pomodoro) this.set(this.KEYS.POMODORO, data.pomodoro);
          resolve(true);
        } catch (err) {
          console.error("Invalid JSON file", err);
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },
  
  clearAll() {
    localStorage.clear();
  }
};
