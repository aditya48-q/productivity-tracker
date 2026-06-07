import { analytics } from './analytics.js';
import { Storage } from './storage.js';

class Pomodoro {
  constructor() {
    this.MODES = {
      pomodoro: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60
    };
    
    this.currentMode = 'pomodoro';
    this.timeLeft = this.MODES.pomodoro;
    this.isRunning = false;
    this.intervalId = null;
    this.sessionCount = Storage.get('focusflow_session_count', 0);
    this.totalDuration = this.MODES.pomodoro;
    
    this.onTick = null;
    this.onComplete = null;
    this.onModeChange = null;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.intervalId = setInterval(() => {
      this.timeLeft--;
      
      if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
      
      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.intervalId);
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  reset() {
    this.pause();
    this.timeLeft = this.MODES[this.currentMode];
    if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
  }

  setMode(mode) {
    if (this.MODES[mode]) {
      this.currentMode = mode;
      this.totalDuration = this.MODES[mode];
      this.timeLeft = this.totalDuration;
      this.pause();
      
      if (this.onModeChange) this.onModeChange(mode);
      if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
    }
  }

  skip() {
    this.complete();
  }

  complete() {
    this.pause();
    this.playNotificationSound();
    
    if (this.currentMode === 'pomodoro') {
      this.sessionCount++;
      Storage.set('focusflow_session_count', this.sessionCount);
      analytics.recordFocusTime(25);
      
      // Auto transition
      if (this.sessionCount % 4 === 0) {
        this.setMode('longBreak');
      } else {
        this.setMode('shortBreak');
      }
      
      // Throw confetti
      if (window.confetti) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      this.setMode('pomodoro');
    }
    
    if (this.onComplete) this.onComplete(this.currentMode, this.sessionCount);
  }

  playNotificationSound() {
    // A pleasant synthesized sound instead of a file
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 1);
    } catch(e) {
      console.log('Audio not supported or permitted');
    }
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

export const pomodoro = new Pomodoro();
