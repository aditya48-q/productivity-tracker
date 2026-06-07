import { Storage } from './storage.js';

export class Onboarding {
  constructor() {
    this.hasCompleted = Storage.get('focusflow_onboarding_completed', false);
    
    if (!this.hasCompleted) {
      this.init();
    }
  }

  init() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;
    
    modal.classList.add('active');
    
    const form = document.getElementById('onboarding-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const preferences = {
        goal: document.getElementById('onboard-goal').value,
        studyHours: document.getElementById('onboard-hours').value,
        sessionLength: document.getElementById('onboard-session').value,
        category: document.getElementById('onboard-category').value
      };
      
      Storage.set('focusflow_user_prefs', preferences);
      Storage.set('focusflow_onboarding_completed', true);
      
      modal.classList.remove('active');
      
      // Personalize UI based on preferences (e.g. adjust default Pomodoro length)
      this.applyPreferences(preferences);
    });
  }
  
  applyPreferences(prefs) {
    if (window.appUI && prefs.goal) {
      // Small personalization: Change the welcome message based on goal
      const headerSpan = document.querySelector('.hero-header h1 .accent-text');
      if (headerSpan) {
        const goalMap = {
          'placements': 'Job Seeker',
          'college': 'Student',
          'personal': 'Achiever',
          'work': 'Professional',
          'exams': 'Champion'
        };
        headerSpan.textContent = goalMap[prefs.goal] || 'Achiever';
      }
    }
  }
}
