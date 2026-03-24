export const C = {
  blue: '#4f8ef7', 
  orange: '#f97316', 
  green: '#22c55e',
  gold: '#f5c842', 
  purple: '#a78bfa', 
  teal: '#2dd4bf',
  red: '#ef4444', 
  pink: '#f472b6', 
  muted: '#58567a'
};

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9b99b6', font: { family: "'Outfit', sans-serif", size: 10 } } },
    tooltip: {
      backgroundColor: 'rgba(3,3,3,.96)',
      titleColor: '#f5c842', bodyColor: '#9b99b6',
      borderColor: '#252540', borderWidth: 1, padding: 10,
      mode: 'index' as const,
      intersect: false
    }
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: C.muted, font: { family: "'JetBrains Mono', monospace", size: 9 } } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: C.muted, font: { family: "'JetBrains Mono', monospace", size: 9 } } }
  },
  animation: { duration: 320 },
};
