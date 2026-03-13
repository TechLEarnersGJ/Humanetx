/* script.js - HumanNet simulation logic using localStorage */

// Data structures
let humanNetData = {
  alerts: [],
  reports: [],
  responses: [],
  settings: {}
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  setupEventListeners();
  if (window.location.pathname.includes('feed.html') || window.location.pathname.includes('receiver.html')) {
    pollFeed();
  }
  if (window.location.pathname.includes('simulation.html')) {
    setupSimulation();
  }
});

// Load data from sessionStorage
function loadData() {
  const saved = sessionStorage.getItem('humanNetData');
  if (saved) {
    humanNetData = { ...humanNetData, ...JSON.parse(saved) };
  }
  const savedSettings = sessionStorage.getItem('humanNetSettings');
  if (savedSettings) {
    humanNetData.settings = JSON.parse(savedSettings);
  }
}

// Save data to sessionStorage
function saveData() {
  sessionStorage.setItem('humanNetData', JSON.stringify(humanNetData));
}

// Save settings to sessionStorage
function saveSettings(settings) {
  humanNetData.settings = settings;
  sessionStorage.setItem('humanNetSettings', JSON.stringify(settings));
}

// Generate timestamp
function getTimestamp() {
  return new Date().toLocaleString();
}

// Add emergency alert (sender)
function getSettings() {
  return humanNetData.settings || {};
}

function sendEmergencySOS(emergencyType = 'SOS', description = 'Emergency! Help needed!') {
  const settings = getSettings();
  const alert = {
    id: Date.now(),
    type: 'emergency',
    name: settings.name || 'Unknown',
    emergencyType,
    location: settings.location || 'Unknown',
    description,
    timestamp: getTimestamp(),
    status: 'active'
  };
  humanNetData.alerts.push(alert);
  saveData();
  showNotification('🚨 SOS sent to HumanNet network!', 'danger');
  updateFeed();
  playAlertSound();
  return alert;
}

function sendEmergencyAlert(formData) {
  sendEmergencySOS(formData.emergencyType, formData.description);
}

// Add crowd report
function submitCrowdReport(formData) {
  const settings = getSettings();
  const report = {
    id: Date.now(),
    type: 'report',
    reportType: formData.reportType || 'Public Issue',
    location: settings.location || formData.location || 'Unknown',
    description: formData.description,
    reporter: settings.name || 'Anonymous',
    timestamp: getTimestamp()
  };
  humanNetData.reports.push(report);
  saveData();
  showNotification('📢 Crowd report sent!', 'warning');
  updateFeed();
  return report;
}

function sendCrowdReport(reportType = 'Public Issue', description = 'Community report') {
  const settings = getSettings();
  const formData = { reportType, description };
  submitCrowdReport(formData);
}

// Accept response (receiver)
function acceptResponse(alertId) {
  const alert = humanNetData.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.status = 'responding';
    humanNetData.responses.push({
      id: Date.now(),
      alertId,
      responderName: humanNetData.settings.name || 'Volunteer',
      timestamp: getTimestamp()
    });
    saveData();
    showNotification('You are responding to this emergency.', 'success');
    updateFeed();
  }
}

// Decline response
function declineResponse(alertId) {
  const alert = humanNetData.alerts.find(a => a.id === alertId);
  if (alert) {
    showNotification('Response declined.', 'info');
  }
}

// Update feed display
function updateFeed() {
  const feedContainer = document.getElementById('feed-container');
  if (!feedContainer) return;

  const combinedFeed = [
    ...humanNetData.alerts.map(a => ({ ...a, emoji: '🚨', class: 'alert-card' })),
    ...humanNetData.reports.map(r => ({ ...r, emoji: '📢', class: 'report-card' })),
    ...humanNetData.responses.map(resp => ({ 
      ...resp, 
      emoji: '✅', 
      class: 'response-card',
      title: `${humanNetData.settings.name || 'Volunteer'} responding to emergency`
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  feedContainer.innerHTML = combinedFeed.map(item => `
    <div class="feed-item ${item.class}">
      <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${item.emoji}</div>
      <strong>${item.title || item.emergencyType || item.reportType || item.title}</strong><br>
      📍 ${item.location}<br>
      <small>${item.timestamp} | ${item.description || item.status || ''}</small>
    </div>
  `).join('');
}

// Poll for feed updates (sim real-time)
function pollFeed(interval = 2000) {
  setInterval(updateFeed, interval);
}

// Show notification
function showNotification(message, type = 'info') {
  const colors = { success: '#44ff44', danger: '#ff4444', warning: '#ffaa00', info: '#00d4ff' };
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 1rem 2rem; 
    background: ${colors[type]}; color: black; border-radius: 12px; 
    box-shadow: var(--shadow); z-index: 1000; transform: translateX(400px);
    transition: var(--transition);
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.style.transform = 'translateX(0)', 100);
  setTimeout(() => {
    notif.style.transform = 'translateX(400px)';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

let audioContext;
function playAlertSound() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function showFullScreenAlert(alert) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(255,68,68,0.95); color: white; z-index: 2000; 
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    animation: pulse 1s infinite;
  `;
  overlay.innerHTML = `
    <h1 style="font-size: 4rem; margin-bottom: 1rem;">🚨 ALERT</h1>
    <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">${alert.emergencyType}</p>
    <p style="font-size: 1.2rem;">${alert.name} at ${alert.location}</p>
    <button onclick="this.parentElement.remove()" style="margin-top: 2rem; padding: 1rem 2rem; font-size: 1.2rem; background: white; color: #ff4444; border: none; border-radius: 12px; cursor: pointer;">Acknowledge</button>
  `;
  document.body.appendChild(overlay);
}

const style = document.createElement('style');
style.textContent = '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }';
document.head.appendChild(style);


// Form submission handler (generic)
function setupForms() {
  const forms = document.querySelectorAll('form[data-handler]');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(this));
      const handler = this.dataset.handler;
      if (handler === 'send-emergency') {
        sendEmergencyAlert(formData);
      } else if (handler === 'submit-report') {
        submitCrowdReport(formData);
      } else if (handler === 'save-settings') {
        saveSettings(formData);
        showNotification('Settings saved!');
      }
      this.reset();
    });
  });

  // Receiver buttons
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      acceptResponse(parseInt(this.dataset.alertId));
    });
  });
  document.querySelectorAll('.decline-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      declineResponse(parseInt(this.dataset.alertId));
    });
  });
}

// Setup dashboard role selector
function setupDashboard() {
  const roleSelect = document.querySelector('input[name="role"]:checked');
  if (roleSelect) {
    const role = roleSelect.value;
    const roleLinks = {
      sender: 'sender.html',
      receiver: 'receiver.html',
      crowd: 'crowd.html'
    };
    const link = document.getElementById('role-link');
    if (link) link.href = roleLinks[role];
  }
}

// Simulation setup
function setupSimulation() {
  document.getElementById('simulate-emergency').addEventListener('click', simulateEmergency);
  document.getElementById('simulate-response').addEventListener('click', simulateResponse);
  document.getElementById('simulate-crowd').addEventListener('click', simulateCrowd);
}

function simulateEmergency() {
  animateFlow(['sender', 'network', 'volunteers'], '🚨 Emergency Flow');
}

function simulateResponse() {
  animateFlow(['sender', 'network', 'volunteers', 'response'], '✅ Response Flow');
}

function simulateCrowd() {
  animateFlow(['crowd', 'network', 'volunteers'], '📢 Crowd Alert Flow');
}

function animateFlow(sequence, title) {
  const container = document.querySelector('.simulation-container');
  container.innerHTML = `<h3 style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%);">${title}</h3>`;
  
  const nodes = {
    sender: { left: '10%', top: '50%' },
    network: { left: '35%', top: '50%' },
    volunteers: { left: '60%', top: '50%' },
    response: { left: '85%', top: '50%' },
    crowd: { left: '10%', top: '30%' }
  };

  sequence.forEach((node, index) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'sim-node';
      Object.assign(el.style, nodes[node]);
      el.textContent = node.toUpperCase();
      container.appendChild(el);
      
      if (index < sequence.length - 1) {
        createArrow(el, nodes[sequence[index+1]]);
      }
    }, index * 800);
  });
}

function createArrow(fromNode, toPos) {
  const arrow = document.createElement('div');
  arrow.className = 'sim-arrow';
  const rect = fromNode.getBoundingClientRect();
  const contRect = document.querySelector('.simulation-container').getBoundingClientRect();
  const startX = (rect.left - contRect.left + rect.width / 2) / contRect.width * 100;
  const startY = (rect.top - contRect.top + rect.height) / contRect.height * 100;
  const endX = parseFloat(toPos.left) + 2; // approx center
  const endY = parseFloat(toPos.top);
  
  arrow.style.left = startX + '%';
  arrow.style.top = startY + '%';
  arrow.style.transform = `rotate(${Math.atan2(endY - startY, endX - startX) * 180 / Math.PI}deg)`;
  arrow.style.height = '0%';
  
  document.querySelector('.simulation-container').appendChild(arrow);
}

// General event listeners
function setupEventListeners() {
  setupForms();
  if (document.querySelector('.dashboard')) setupDashboard();
}

// Export for use in HTML inline if needed
window.HumanNet = {
  loadData,
  saveData,
  sendEmergencyAlert,
  submitCrowdReport,
  acceptResponse,
  updateFeed
};
