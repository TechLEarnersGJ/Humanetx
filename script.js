/**
 * Humanity Safety — Simulation Engine
 * Manages SOS/Crowd simulation, UI updates, map, chat, tabs, and timeline.
 * Zero inline JS in HTML — all behavior lives here.
 */

(function () {
  'use strict';

  /* ============================================================
     1. Simulation Data
     ============================================================ */

  var STAGE_DELAY = 2500; // ms between simulation stages

  var timelineData = {
    0:  { title: '0–1 Minute: Broadcast Phase',     desc: 'SOS alert is broadcast. Nearby volunteers are notified immediately via push notifications.' },
    1:  { title: '1–3 Minutes: Contact Phase',       desc: 'The first three volunteers become Guiders. A secure WebRTC VoIP call is established to provide guidance.' },
    3:  { title: '3–10 Minutes: Coordination Phase',  desc: 'Guiders and Responders coordinate movement via live chat. GPS locations are updated in real-time.' },
    10: { title: '10–30 Minutes: Stabilization Phase', desc: 'Community responders reach the scene. Assistance is provided under Guider supervision.' },
    30: { title: '30–60 Minutes: Resolution Phase',   desc: 'Situation is brought under control. Victim marks themselves as SAFE or responders confirm END.' },
    60: { title: '60+ Minutes: Cleanup',              desc: 'Emergency session is archived. All sensitive personal data is permanently deleted from the core.' }
  };

  var simStages = {
    sos: [
      { sender: 'sos-sent',             network: 'received',        volunteer: 'idle',           time: 0,  chat: '<strong>[SYSTEM]</strong> SOS Alert from "John Doe" received by HumaNet Core.' },
      { sender: 'waiting-help',          network: 'processing',      volunteer: 'idle',           time: 1,  chat: '<strong>[SYSTEM]</strong> Searching for nearby volunteers within 2 km...' },
      { sender: 'waiting-help',          network: 'broadcasting',    volunteer: 'alert-received', time: 1,  chat: '<strong>[SYSTEM]</strong> Alert broadcasted to 23 volunteers. Waiting for acceptance.' },
      { sender: 'volunteer-responding',  network: 'response-active', volunteer: 'responding',     time: 3,  chat: '<strong>[SYSTEM]</strong> Guider #1 (Jane) has accepted. WebRTC voice call established.<br><strong>Jane (Guider):</strong> John, this is Jane from HumaNet. Are you safe to talk?' },
      { sender: 'volunteer-responding',  network: 'response-active', volunteer: 'responding',     time: 10, chat: '<strong>Responder #2:</strong> I\'m 2 minutes away from the location.<br><strong>Jane (Guider):</strong> Copy that. Victim reports minor injury. Proceed with caution.' },
      { sender: 'volunteer-responding',  network: 'response-active', volunteer: 'responding',     time: 30, chat: '<strong>Responder #2:</strong> At the scene. Victim is stable. Situation is calm.<br><strong>Jane (Guider):</strong> Excellent. Stand by for SAFE confirmation.' },
      { sender: 'safe',                  network: 'resolved',        volunteer: 'completed',      time: 60, chat: '<strong>[SYSTEM]</strong> Victim marked as SAFE. Session resolved. All personal data permanently deleted.' }
    ],
    crowd: [
      { sender: 'crowd-ready',  network: 'idle',           volunteer: 'idle',      time: 0,  chat: null },
      { sender: 'crowd-sent',   network: 'crowd-received', volunteer: 'awareness', time: 1,  chat: '<strong>[SYSTEM]</strong> Crowd report of "Unconscious Person" filed. Added to public awareness feed.' }
    ]
  };

  /* ============================================================
     2. Panel Content Templates
     ============================================================ */

  var panelTemplates = {
    sender: {
      'sos-ready': function () {
        return '<div class="panel-idle">' +
          '<div class="panel-idle-icon">📱</div>' +
          '<h3>Sender Phone</h3>' +
          '<p>Tap SOS to start simulation</p>' +
          '<button class="sos-btn" id="sos-btn-device">🚨 SOS</button>' +
          '</div>';
      },
      'sos-sent': function () {
        return '<div class="panel-active panel-active--accent">' +
          '<div class="signal-pulse"></div>' +
          '<h3>✅ SOS SENT</h3>' +
          '<p>Broadcasting to network...</p>' +
          '</div>';
      },
      'waiting-help': function () {
        return '<div class="panel-active panel-active--warning">' +
          '<h3>⏳ Waiting for Response</h3>' +
          '<p>Volunteers are being notified</p>' +
          '</div>';
      },
      'volunteer-responding': function () {
        return '<div class="panel-active panel-active--success">' +
          '<h3>🦸 Guider Connected</h3>' +
          '<p>You are now on a secure voice call with Jane, a volunteer Guider.</p>' +
          '<button class="safe-btn" id="safe-btn">✅ Mark as SAFE</button>' +
          '</div>';
      },
      'safe': function () {
        return '<div class="panel-active panel-active--success">' +
          '<h3>✅ EMERGENCY RESOLVED</h3>' +
          '<p>Your session has ended. All personal data permanently deleted.</p>' +
          '</div>';
      },
      'crowd-ready': function () {
        return '<div class="panel-idle">' +
          '<div class="panel-idle-icon">👥</div>' +
          '<h3>Crowd Reporter</h3>' +
          '<p>Ready to report an incident</p>' +
          '</div>';
      },
      'crowd-sent': function () {
        return '<div class="panel-active panel-active--warning">' +
          '<h3>✅ Report Sent</h3>' +
          '<p>The incident has been added to the public community awareness feed.</p>' +
          '</div>';
      }
    },
    network: {
      'idle': function () {
        return '<div class="panel-idle">' +
          '<div class="core-icon">🌐</div>' +
          '<h3>HumaNet Core</h3>' +
          '<p>System idle. Monitoring network.</p>' +
          '</div>';
      },
      'received': function () {
        return '<div class="panel-active panel-active--accent">' +
          '<div class="signal-pulse"></div>' +
          '<h3>📥 Alert Received</h3>' +
          '<p>Validating sender location and identity...</p>' +
          '</div>';
      },
      'processing': function () {
        return '<div class="panel-active panel-active--accent">' +
          '<h3>🔄 Processing</h3>' +
          '<p>Querying for volunteers within 2 km radius.</p>' +
          '</div>';
      },
      'broadcasting': function () {
        return '<div class="panel-active panel-active--accent">' +
          '<div class="signal-pulse"></div>' +
          '<h3>📤 Broadcasting</h3>' +
          '<p>Push notification sent to 23 nearby volunteers. Awaiting acceptance.</p>' +
          '</div>';
      },
      'response-active': function () {
        return '<div class="panel-active panel-active--success">' +
          '<h3>✅ Response Active</h3>' +
          '<p>3 Guiders assigned. Session live. Monitoring coordination.</p>' +
          '</div>';
      },
      'resolved': function () {
        return '<div class="panel-active panel-active--success">' +
          '<h3>🏁 Session Closed</h3>' +
          '<p>SAFE confirmation received. Wiping all session data.</p>' +
          '</div>';
      },
      'crowd-received': function () {
        return '<div class="panel-active panel-active--warning">' +
          '<h3>📢 Crowd Report Stored</h3>' +
          '<p>Incident logged and distributed to public-facing channels.</p>' +
          '</div>';
      }
    },
    volunteer: {
      'idle': function () {
        return '<div class="panel-idle">' +
          '<div class="panel-idle-icon">🦸</div>' +
          '<h3>Volunteer Phone</h3>' +
          '<p>On standby. Ready to help.</p>' +
          '</div>';
      },
      'alert-received': function () {
        return '<div class="panel-active alert-pulse panel-active--danger">' +
          '<h3>🚨 EMERGENCY ALERT</h3>' +
          '<p><strong>Type:</strong> Self SOS &nbsp; <strong>Distance:</strong> ~2 km</p>' +
          '<p>A community member needs help near you.</p>' +
          '<div class="panel-actions">' +
          '<button class="btn btn-sm" id="accept-btn" style="background:var(--success);color:#000;font-weight:700">✅ Accept</button>' +
          '<button class="btn btn-sm btn-secondary" id="decline-btn">❌ Decline</button>' +
          '</div>' +
          '</div>';
      },
      'responding': function () {
        return '<div class="panel-active panel-active--success">' +
          '<h3>✅ GUIDER #1</h3>' +
          '<p><strong>Status:</strong> Connected to victim via WebRTC voice call.</p>' +
          '<p><strong>Next:</strong> Coordinate with responders in the live chat.</p>' +
          '</div>';
      },
      'completed': function () {
        return '<div class="panel-active panel-active--success">' +
          '<h3>✅ Session Complete</h3>' +
          '<p>Thank you for your help. You have been logged out of the session.</p>' +
          '</div>';
      },
      'awareness': function () {
        return '<div class="panel-active panel-active--warning">' +
          '<h3>📢 New Crowd Report</h3>' +
          '<p>An incident was reported nearby. View details in the community feed.</p>' +
          '</div>';
      }
    }
  };

  /* ============================================================
     3. State
     ============================================================ */

  var currentSim = null;   // 'sos' | 'crowd' | null
  var simTimer = null;     // interval ID
  var currentStage = 0;
  var resumeCallback = null;

  /* ============================================================
     4. DOM Helpers
     ============================================================ */

  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function isSimPage() {
    return !!$('sender-panel');
  }

  /* ============================================================
     5. Panel Updater
     ============================================================ */

  function updatePanel(panel, state) {
    var el = $(panel + '-panel');
    if (!el) return;
    var template = panelTemplates[panel] && panelTemplates[panel][state];
    if (template) {
      el.innerHTML = template();
      bindDynamicButtons();
    }
  }

  /* ============================================================
     6. Timeline Updater (Horizontal)
     ============================================================ */

  function updateTimeline(time) {
    $$('.time-node').forEach(function (node) {
      var stepTime = parseInt(node.dataset.step, 10);
      node.classList.remove('active', 'completed');
      if (stepTime === time) node.classList.add('active');
      else if (stepTime < time) node.classList.add('completed');
    });

    var desc = timelineData[time];
    var descEl = $('step-description');
    if (desc && descEl) {
      descEl.innerHTML = '<h3>' + desc.title + '</h3><p>' + desc.desc + '</p>';
    }
  }

  /* ============================================================
     7. Map Updater
     ============================================================ */

  function updateMap(stageData) {
    var victim = $('victim-marker');
    var rings = $('broadcast-rings');
    var vols = $('volunteer-markers');
    if (!victim || !rings || !vols) return;

    var showVictim = ['received', 'processing', 'broadcasting', 'response-active'].indexOf(stageData.network) >= 0;
    if (showVictim) {
      victim.hidden = false;
      victim.style.left = '50%';
      victim.style.top = '50%';
    } else {
      victim.hidden = true;
    }

    if (stageData.network === 'broadcasting') {
      rings.innerHTML = '<div class="broadcast-ring" style="left:50%;top:50%"></div>';
    } else {
      rings.innerHTML = '';
    }

    if (stageData.volunteer === 'alert-received') {
      vols.innerHTML =
        '<div id="vol-1" class="map-marker map-marker--responder" style="left:20%;top:25%">🦸</div>' +
        '<div id="vol-2" class="map-marker map-marker--responder" style="left:80%;top:30%">🦸</div>' +
        '<div id="vol-3" class="map-marker map-marker--responder" style="left:40%;top:85%">🦸</div>' +
        '<div id="vol-4" class="map-marker map-marker--responder" style="left:75%;top:75%">🦸</div>';
    } else if (stageData.volunteer === 'responding') {
      ensureVolunteerMarkers(vols);
      setTimeout(function () {
        moveToGuider('vol-1', '45%', '45%');
        moveToGuider('vol-2', '55%', '52%');
        moveToGuider('vol-3', '48%', '55%');
      }, 100);
    } else if (stageData.network === 'resolved' || stageData.volunteer === 'completed') {
      vols.innerHTML = '';
    }
  }

  function ensureVolunteerMarkers(container) {
    if (!$('vol-1')) {
      container.innerHTML =
        '<div id="vol-1" class="map-marker map-marker--responder" style="left:20%;top:25%">🦸</div>' +
        '<div id="vol-2" class="map-marker map-marker--responder" style="left:80%;top:30%">🦸</div>' +
        '<div id="vol-3" class="map-marker map-marker--responder" style="left:40%;top:85%">🦸</div>' +
        '<div id="vol-4" class="map-marker map-marker--responder" style="left:75%;top:75%">🦸</div>';
    }
  }

  function moveToGuider(id, left, top) {
    var el = $(id);
    if (!el) return;
    el.className = 'map-marker map-marker--guider';
    el.style.left = left;
    el.style.top = top;
    el.textContent = '🛡️';
  }

  /* ============================================================
     8. Chat Updater
     ============================================================ */

  function updateChat(stageData, isFirstStage) {
    var chat = $('chat-messages');
    if (!chat) return;

    if (isFirstStage) {
      chat.innerHTML = '';
    }

    if (stageData.chat) {
      var msg = document.createElement('div');
      msg.className = 'chat-msg';
      msg.innerHTML = stageData.chat;
      chat.appendChild(msg);
      chat.scrollTop = chat.scrollHeight;
    }
  }

  /* ============================================================
     9. Simulation Engine
     ============================================================ */

  function runSimulation(type) {
    resetSimulation();
    currentSim = type;
    currentStage = 0;

    var coordPanel = $('coordination-panel');
    if (coordPanel) coordPanel.classList.add('visible');

    advanceStage();
  }

  function advanceStage() {
    var stages = simStages[currentSim];
    if (!stages || currentStage >= stages.length) {
      clearTimer();
      return;
    }

    var stage = stages[currentStage];
    var isFirst = currentStage === 0;

    updatePanel('sender', stage.sender);
    updatePanel('network', stage.network);
    updatePanel('volunteer', stage.volunteer);
    updateTimeline(stage.time);
    updateMap(stage);
    updateChat(stage, isFirst);

    // Pause at volunteer alert-received for user to accept
    if (stage.volunteer === 'alert-received') {
      clearTimer();
      resumeCallback = function () {
        currentStage++;
        advanceStage();
      };
      return;
    }

    currentStage++;

    // Schedule next stage
    clearTimer();
    if (currentStage < stages.length) {
      simTimer = setTimeout(advanceStage, STAGE_DELAY);
    }
  }

  function jumpToStage(time) {
    clearTimer();

    var stages = simStages.sos; // jumping always uses SOS stages
    var targetIdx = -1;

    for (var i = stages.length - 1; i >= 0; i--) {
      if (stages[i].time <= time) { targetIdx = i; break; }
    }

    if (targetIdx < 0) return;

    currentSim = 'sos';
    currentStage = targetIdx;

    var coordPanel = $('coordination-panel');
    if (coordPanel) coordPanel.classList.add('visible');

    // Replay chat history
    var chat = $('chat-messages');
    if (chat) chat.innerHTML = '';
    for (var j = 0; j <= targetIdx; j++) {
      updateChat(stages[j], j === 0);
    }

    // Update UI to target
    var s = stages[targetIdx];
    updatePanel('sender', s.sender);
    updatePanel('network', s.network);
    updatePanel('volunteer', s.volunteer);
    updateTimeline(s.time);
    updateMap(s);
  }

  function resetSimulation() {
    clearTimer();
    currentSim = null;
    currentStage = 0;
    resumeCallback = null;

    updatePanel('sender', 'sos-ready');
    updatePanel('network', 'idle');
    updatePanel('volunteer', 'idle');
    updateTimeline(0);

    var coordPanel = $('coordination-panel');
    if (coordPanel) coordPanel.classList.remove('visible');

    var chat = $('chat-messages');
    if (chat) chat.innerHTML = '<div class="chat-placeholder">Waiting for active session...</div>';

    var victim = $('victim-marker');
    if (victim) victim.hidden = true;

    var vols = $('volunteer-markers');
    if (vols) vols.innerHTML = '';

    var rings = $('broadcast-rings');
    if (rings) rings.innerHTML = '';

    bindDynamicButtons();
  }

  function clearTimer() {
    if (simTimer) {
      clearTimeout(simTimer);
      simTimer = null;
    }
  }

  /* ============================================================
     10. Event Binding
     ============================================================ */

  function bindStaticButtons() {
    // Main control buttons
    var sosBtn = $('sim-sos');
    var crowdBtn = $('sim-crowd');
    var resetBtn = $('reset-sim');

    if (sosBtn) sosBtn.addEventListener('click', function () { runSimulation('sos'); });
    if (crowdBtn) crowdBtn.addEventListener('click', function () { runSimulation('crowd'); });
    if (resetBtn) resetBtn.addEventListener('click', resetSimulation);

    // Tab switching
    $$('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.tab-btn').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        $$('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        var panel = $(btn.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });

    // Timeline node clicks
    $$('.time-node').forEach(function (node) {
      node.addEventListener('click', function () {
        var time = parseInt(node.dataset.step, 10);
        jumpToStage(time);
      });
    });

    // Data protection toggle
    var dataToggle = $('data-toggle');
    var dataDetails = $('data-details');
    if (dataToggle && dataDetails) {
      dataToggle.addEventListener('click', function () {
        var isVisible = dataDetails.classList.contains('visible');
        dataDetails.classList.toggle('visible');
        dataToggle.textContent = isVisible
          ? '🛡️ View Data Protection Details'
          : '🛡️ Hide Data Protection Details';
      });
    }
  }

  function bindDynamicButtons() {
    // SOS button inside device panel
    var sosDeviceBtn = $('sos-btn-device');
    if (sosDeviceBtn) {
      sosDeviceBtn.addEventListener('click', function () { runSimulation('sos'); });
    }

    // Accept button
    var acceptBtn = $('accept-btn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        if (resumeCallback) {
          var cb = resumeCallback;
          resumeCallback = null;
          cb();
        }
      });
    }

    // Decline button
    var declineBtn = $('decline-btn');
    if (declineBtn) {
      declineBtn.addEventListener('click', function () {
        var panel = $('volunteer-panel');
        if (panel) {
          panel.innerHTML = '<div class="panel-active"><p>Response declined.</p></div>';
        }
      });
    }

    // SAFE button
    var safeBtn = $('safe-btn');
    if (safeBtn) {
      safeBtn.addEventListener('click', function () { jumpToStage(60); });
    }
  }

  /* ============================================================
     11. Init
     ============================================================ */

  document.addEventListener('DOMContentLoaded', function () {
    if (isSimPage()) {
      bindStaticButtons();
      bindDynamicButtons();
    }
  });

})();
