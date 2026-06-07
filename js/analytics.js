import { Storage } from './storage.js';

class Analytics {
  constructor() {
    this.data = Storage.getAnalytics();
    this.checkStreak();
  }

  checkStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (this.data.lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (this.data.lastLogin !== yesterdayStr) {
        // Streak broken
        this.data.streak = 0;
      }
      this.data.lastLogin = today;
      Storage.saveAnalytics(this.data);
    }
  }

  recordTaskCompletion() {
    this.data.completedTasks++;
    
    // Check if first task of the day
    const today = new Date().toISOString().split('T')[0];
    if (!this.data.daily[today]) {
      this.data.daily[today] = 0;
      this.data.streak++;
    }
    
    this.data.daily[today]++;
    Storage.saveAnalytics(this.data);
    
    return this.data.streak;
  }

  recordFocusTime(minutes) {
    const today = new Date().getDay(); // 0 is Sunday
    // Map to Monday-based index (0-6)
    const index = today === 0 ? 6 : today - 1;
    
    this.data.focusHours[index] += minutes / 60;
    Storage.saveAnalytics(this.data);
  }

  getStreak() {
    return this.data.streak;
  }

  getFocusHours() {
    return this.data.focusHours;
  }
}

export const analytics = new Analytics();
