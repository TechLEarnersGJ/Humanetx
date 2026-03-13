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
  initPageHandlers();  // NEW: Page-specific initialization
  if (window.location.pathname.includes('feed.html') || window.location.pathname.includes('receiver.html')) {
    pollFeed();
  }
  if (window.location.pathname.includes('simulation.html')) {
    setupSimulation();
  }
});

// NEW: Page-specific handlers
function initPageHandlers() {
  const path = window.location.pathname.split('/').pop(); // Get filename
  
  switch(path) {
    case 'setup.html':
      setupSetupForm();
      break;
    case 'simulation.html':
      initSimulation();
      break;
    case 'crowd.html':
      setupCrowdHandler();
      break;
    case 'sender.html':
      setupSenderHandler();
      break;
    case 'receiver.html':
      setupReceiverAlerts();
      break;
    case 'dashboard.html':
      setupDashboard();
      break;
  }
}

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
  const roleRadios = document.querySelectorAll('input[name="role"]');
  roleRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      const link = document.getElementById("role-link");
      const text = document.getElementById("role-link-text");
      const roleLinks = {
        sender: { href: "sender.html", text: "Go to Sender Simulation" },
        receiver: {
          href: "receiver.html",
          text: "Go to Receiver Simulation",
        },
        crowd: { href: "crowd.html", text: "Go to Crowd Report" },
      };
      if (roleLinks[this.value]) {
        link.href = roleLinks[this.value].href;
        link.textContent = roleLinks[this.value].text;
        text.style.display = "none";
      }
    });
  });
}

// NEW: Page-specific functions

// setup.html
function setupSetupForm() {
  const form = document.getElementById("setup-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const settings = {
        name: document.getElementById("name").value,
        location: document.getElementById("location").value,
      };
      saveSettings(settings);
      showNotification('Settings saved! Ready for simulation.', 'success');
    });
  }
}

// crowd.html
function setupCrowdHandler() {
  const btn = document.getElementById("crowd-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      sendCrowdReport();
    });
  }
}

// sender.html
function setupSenderHandler() {
  const btn = document.getElementById("sos-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      sendEmergencySOS();
    });
  }
}

// receiver.html - Complex polling/display
function setupReceiverAlerts() {
  function displayAlerts() {
    const container = document.getElementById("alerts-container");
    if (!container) return;
    
    const activeAlerts = humanNetData.alerts.filter(
      (a) => a.status === "active",
    );
    if (activeAlerts.length === 0) {
      container.innerHTML =
        '<div class="card" style="text-align: center; grid-column: span 2;"><p>No active alerts. <a href="sender.html">Simulate an emergency</a> first!</p></div>';
      return;
    }
    container.innerHTML = activeAlerts
      .map(
        (alert) => `
      <div class="card alert-card">
        <h3>🚨 ${alert.emergencyType}</h3>
        <p><strong>${alert.name}</strong></p>
        <p>📍 ${alert.location}</p>
        <p>${alert.description}</p>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">${alert.timestamp}</p>
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
          <button class="accept-btn btn" data-alert-id="${alert.id}" style="flex: 1; background: var(--success);">✅ ACCEPT RESPONSE</button>
          <button class="decline-btn btn btn-secondary" data-alert-id="${alert.id}" style="flex: 1;">❌ DECLINE</button>
        </div>
      </div>
    `,
      )
      .join("");

    // Re-setup buttons
    document.querySelectorAll(".accept-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        acceptResponse(parseInt(btn.dataset.alertId));
        btn.closest(".card").innerHTML +=
          '<p style="color: var(--success); font-weight: bold;">You are now responding!</p>';
        btn.remove();
        btn.nextElementSibling?.remove();
      });
    });
    document.querySelectorAll(".decline-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        declineResponse(parseInt(btn.dataset.alertId));
        btn.closest(".card").innerHTML +=
          '<p style="color: var(--text-secondary);">Declined.</p>';
        btn.remove();
      });
    });
  }

  let lastAlertCount = 0;
  function checkNewAlerts() {
    const activeAlerts = humanNetData.alerts.filter(
      (a) => a.status === "active",
    );
    if (activeAlerts.length > lastAlertCount) {
      playAlertSound();
      if (activeAlerts[activeAlerts.length - 1]) {
        showFullScreenAlert(activeAlerts[activeAlerts.length - 1]);
      }
      lastAlertCount = activeAlerts.length;
    }
    displayAlerts();
  }
  setInterval(checkNewAlerts, 1000);
  checkNewAlerts();
}

// simulation.html - Complex logic moved here
function initSimulation() {
  // Global simulation functions exposed to onclick handlers
  window.simulateSenderSOS = simulateSenderSOS;
  window.nextSenderStage = nextSenderStage;
  window.volunteerAccept = volunteerAccept;
  window.volunteerDecline = volunteerDecline;
  window.resolveEmergency = resetSimulation;

  // Controls
  const simSOS = document.getElementById("sim-sos");
  const simCrowd = document.getElementById("sim-crowd");
  const resetBtn = document.getElementById("reset-sim");
  if (simSOS) simSOS.onclick = () => runSimulation("sos");
  if (simCrowd) simCrowd.onclick = () => runSimulation("crowd");
  if (resetBtn) resetBtn.onclick = resetSimulation;
}

const simStages = {
  sos: [
    { sender: "sos-ready", network: "idle", volunteer: "idle" },
    { sender: "sos-sent", network: "received", volunteer: "idle" },
    { sender: "waiting-help", network: "processing", volunteer: "idle" },
    {
      sender: "waiting-help",
      network: "broadcasting",
      volunteer: "idle",
    },
    {
      sender: "volunteer-responding",
      network: "response-active",
      volunteer: "responding",
    },
    { sender: "safe", network: "resolved", volunteer: "completed" },
  ],
  crowd: [
    { sender: "crowd-ready", network: "idle", volunteer: "idle" },
    {
      sender: "crowd-sent",
      network: "crowd-received",
      volunteer: "awareness",
    },
  ],
};

function runSimulation(type) {
  const currentSim = type;
  let stage = 0;
  const interval = setInterval(() => {
    if (stage >= simStages[type].length) {
      clearInterval(interval);
      return;
    }
    updateSimulationStage(simStages[type][stage]);
    stage++;
  }, 1500);
}

function updateSimulationStage(stageData) {
  // Update sender panel
  const senderContent = getPanelContent("sender", stageData.sender);
  document.getElementById("sender-panel").innerHTML = senderContent;

  // Update network
  const networkContent = getPanelContent("network", stageData.network);
  document.getElementById("network-panel").innerHTML = networkContent;

  // Update volunteer
  const volunteerContent = getPanelContent(
    "volunteer",
    stageData.volunteer,
  );
  document.getElementById("volunteer-panel").innerHTML = volunteerContent;

  // Signal animations
  animateSignalFlow();
}

function getPanelContent(panel, state) {
  const contents = {
    // Sender states (abbreviated)
    sender: {
      "sos-ready": `
        <div class="status-idle">
          <div class="status-icon">📱</div>
          <h3>Sender Ready</h3>
          <p>Awaiting emergency</p>
          <button class="sos-button" onclick="simulateSenderSOS()">🚨 SOS</button>
        </div>
      `,
      "sos-sent": `
        <div class="setup-hero">
          <h3>✅ SOS SENT</h3>
          <p>Broadcast to volunteers</p>
          <button class="safe-button" onclick="nextSenderStage()">I'm SAFE</button>
        </div>
      `,
      "waiting-help": `
        <div class="setup-hero">
          <h3>⏳ Waiting</h3>
          <p>Volunteers notified</p>
          <div class="signal-pulse"></div>
        </div>
      `,
      "volunteer-responding": `
        <div class="setup-hero">
          <h3>🦸 Help Arriving</h3>
          <p>Volunteer connected</p>
          <button class="safe-button" onclick="resolveEmergency()">Mark SAFE</button>
        </div>
      `,
      safe: `
        <div class="setup-hero">
          <h3>✅ EMERGENCY RESOLVED</h3>
          <p>Session closed</p>
        </div>
      `,
      "crowd-ready": `
        <div class="status-idle">
          <div class="status-icon">👥</div>
          <h3>Crowd Reporter</h3>
          <p>Ready to report</p>
          <button class="sos-button" onclick="simulateCrowdReport()" style="background: var(--warning);">📢 Report</button>
        </div>
      `,
      "crowd-sent": `
        <div class="setup-hero">
          <h3>✅ Report Sent</h3>
          <p>Added to community feed</p>
        </div>
      `,
    },
    // Network states (abbreviated)
    network: {
      idle: `<div class="status-idle"><div class="network-icon">🌐</div><h3>HumanNet Core</h3><p>System idle</p></div>`,
      received: `<div class="setup-hero"><div class="signal-pulse"></div><h3>📥 Alert Received</h3><p>Validating sender location</p></div>`,
      processing: `<div class="setup-hero" style="color: var(--accent);"><h3>🔄 Processing</h3><p>Checking nearby volunteers</p></div>`,
      broadcasting: `<div class="setup-hero" style="color: var(--accent);"><h3>📤 Broadcasting</h3><p>To 23 nearby volunteers</p><div class="signal-pulse"></div></div>`,
      "response-active": `<div class="setup-hero" style="color: var(--success);"><h3>✅ Response Active</h3><p>3 Guiders assigned</p></div>`,
      resolved: `<div class="setup-hero" style="color: var(--success);"><h3>🏁 Session Closed</h3><p>Data auto-deleted</p></div>`,
      "crowd-received": `<div class="setup-hero" style="color: var(--warning);"><h3>📢 Crowd Report</h3><p>Added to awareness feed</p></div>`,
    },
    // Volunteer states
    volunteer: {
      idle: `<div class="status-idle"><div class="status-icon">🦸</div><h3>Volunteer Ready</h3><p>No active alerts</p></div>`,
      "alert-received": `
        <div class="alert-active">
          <h3>🚨 EMERGENCY ALERT</h3>
          <p>SOS - Medical</p>
          <p style="font-size: 0.9rem; opacity: 0.8;">Nearby sender needs help</p>
          <div style="margin-top: 2rem; display: flex; gap: 1rem;">
            <button class="btn" style="flex: 1; background: var(--success); font-weight: bold; padding: 0.8rem;" onclick="volunteerAccept()">✅ Accept</button>
            <button class="btn btn-secondary" style="flex: 1; padding: 0.8rem;" onclick="volunteerDecline()">❌ Decline</button>
          </div>
        </div>
      `,
      responding: `
        <div class="status-responding">
          <h3>✅ RESPONDING</h3>
          <p>Guider #1</p>
          <p style="font-size: 0.9rem; opacity: 0.8;">VoIP connected</p>
        </div>
      `,
      completed: `<div class="setup-hero" style="color: var(--success);"><h3>✅ Session Complete</h3><p>Emergency resolved</p></div>`,
      awareness: `<div class="setup-hero" style="color: var(--warning);"><h3>📢 Community Alert</h3><p>Crowd report nearby</p></div>`,
    },
  };
  return contents[panel][state] || contents[panel].idle;
}

function resetSimulation() {
  document.querySelectorAll(".device-screen").forEach((screen) => {
    screen.innerHTML =
      screen.querySelector(".status-idle")?.outerHTML ||
      getPanelContent(screen.id.replace("-panel", ""), "idle");
  });
}

function animateSignalFlow() {
  const arrows = document.querySelectorAll(".flow-arrow");
  arrows.forEach((arrow, i) => {
    setTimeout(() => {
      arrow.classList.add("active");
      setTimeout(() => arrow.classList.remove("active"), 3000);
    }, i * 500);
  });
}

// Simulation onclick handlers
function simulateSenderSOS() { runSimulation("sos"); }
function nextSenderStage() { updateSimulationStage(simStages.sos[5]); }
function volunteerAccept() {
  document.getElementById("volunteer-panel").innerHTML = getPanelContent("volunteer", "responding");
}
function volunteerDecline() {
  document.getElementById("volunteer-panel").innerHTML = getPanelContent("volunteer", "idle");
}

// General event listeners
function setupEventListeners() {
  setupForms();
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

function setupSimulation() {
  document.getElementById('simulate-emergency')?.addEventListener('click', simulateEmergency);
  document.getElementById('simulate-response')?.addEventListener('click', simulateResponse);
  document.getElementById('simulate-crowd')?.addEventListener('click', simulateCrowd);
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
  if (!container) return;
  
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
  const endX = parseFloat(toPos.left) + 2;
  const endY = parseFloat(toPos.top);
  
  arrow.style.left = startX + '%';
  arrow.style.top = startY + '%';
  arrow.style.transform = `rotate(${Math.atan2(endY - startY, endX - startX) * 180 / Math.PI}deg)`;
  arrow.style.height = '0%';
  
  document.querySelector('.simulation-container').appendChild(arrow);
}
