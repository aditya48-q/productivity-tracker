class Cursor {
  constructor() {
    this.dot = document.querySelector('.cursor-dot');
    this.outline = document.querySelector('.cursor-outline');
    
    if (!this.dot || !this.outline) return;
    
    this.cursorX = window.innerWidth / 2;
    this.cursorY = window.innerHeight / 2;
    this.outlineX = this.cursorX;
    this.outlineY = this.cursorY;
    
    this.init();
  }
  
  init() {
    // Track mouse movement
    window.addEventListener('mousemove', (e) => {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
      
      // Instantly move the dot
      this.dot.style.transform = `translate(${this.cursorX}px, ${this.cursorY}px)`;
    });
    
    // Hover effects for clickable elements
    const clickables = document.querySelectorAll('button, a, input, select, .task-item, .task-checkbox');
    
    clickables.forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
      });
    });
    
    // Drag effects
    document.addEventListener('dragstart', () => {
      document.body.classList.add('cursor-drag');
    });
    document.addEventListener('dragend', () => {
      document.body.classList.remove('cursor-drag');
    });
    
    // Hide default cursor when leaving window
    document.addEventListener('mouseleave', () => {
      this.dot.style.opacity = 0;
      this.outline.style.opacity = 0;
    });
    document.addEventListener('mouseenter', () => {
      this.dot.style.opacity = 1;
      this.outline.style.opacity = 1;
    });
    
    // Start animation loop for outline
    this.animate();
  }
  
  animate() {
    // Easing factor
    const ease = 0.15;
    
    // Calculate distance
    const dx = this.cursorX - this.outlineX;
    const dy = this.cursorY - this.outlineY;
    
    // Apply easing
    this.outlineX += dx * ease;
    this.outlineY += dy * ease;
    
    // Apply transform
    this.outline.style.transform = `translate(${this.outlineX}px, ${this.outlineY}px)`;
    
    // Loop
    requestAnimationFrame(this.animate.bind(this));
  }
  
  // Method to re-bind hover events to dynamically added elements
  updateClickables() {
    const clickables = document.querySelectorAll('button, a, input, select, .task-item, .task-checkbox');
    
    clickables.forEach(el => {
      // Remove to prevent duplicates
      el.removeEventListener('mouseenter', this.handleMouseEnter);
      el.removeEventListener('mouseleave', this.handleMouseLeave);
      
      el.addEventListener('mouseenter', this.handleMouseEnter);
      el.addEventListener('mouseleave', this.handleMouseLeave);
    });
  }
  
  handleMouseEnter = () => document.body.classList.add('cursor-hover');
  handleMouseLeave = () => document.body.classList.remove('cursor-hover');
}

export const cursor = new Cursor();
