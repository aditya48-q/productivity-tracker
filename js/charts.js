export class ChartManager {
  constructor() {
    this.charts = {};
    
    // Shared Chart.js config for Obsidian theme
    Chart.defaults.color = '#94A3B8';
    Chart.defaults.font.family = 'Inter';
    Chart.defaults.plugins.tooltip.backgroundColor = '#111827';
    Chart.defaults.plugins.tooltip.titleColor = '#F8FAFC';
    Chart.defaults.plugins.tooltip.bodyColor = '#94A3B8';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.08)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
  }

  initFocusChart(ctx, data) {
    this.charts.focus = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Focus Hours',
          data: data,
          backgroundColor: 'rgba(74, 222, 128, 0.6)',
          hoverBackgroundColor: 'rgba(74, 222, 128, 1)',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            border: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  initTasksChart(ctx, stats) {
    this.charts.tasks = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [{
          data: [stats.completed, stats.total - stats.completed],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)', // Success
            'rgba(255, 255, 255, 0.1)' // Bg
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  initCategoriesChart(ctx, taskData) {
    const categories = { work: 0, personal: 0, study: 0, health: 0 };
    taskData.forEach(t => {
      if (categories[t.category] !== undefined) categories[t.category]++;
    });

    this.charts.categories = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Work', 'Personal', 'Study', 'Health'],
        datasets: [{
          data: [categories.work, categories.personal, categories.study, categories.health],
          backgroundColor: [
            '#38BDF8', // Secondary/Work
            '#A78BFA', // Accent/Personal
            '#F59E0B', // Warning/Study
            '#22C55E'  // Success/Health
          ],
          borderWidth: 1,
          borderColor: '#111827'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  updateTasksChart(stats) {
    if (this.charts.tasks) {
      this.charts.tasks.data.datasets[0].data = [stats.completed, stats.total - stats.completed];
      this.charts.tasks.update();
    }
  }

  updateCategoriesChart(taskData) {
    if (this.charts.categories) {
      const categories = { work: 0, personal: 0, study: 0, health: 0 };
      taskData.forEach(t => {
        if (categories[t.category] !== undefined) categories[t.category]++;
      });
      this.charts.categories.data.datasets[0].data = [
        categories.work, categories.personal, categories.study, categories.health
      ];
      this.charts.categories.update();
    }
  }
}

export const chartManager = new ChartManager();
