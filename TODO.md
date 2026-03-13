    # HumanNet Clean Code TODO

Status: In Progress | Goal: Move internal CSS/JS to external files

## Steps from Approved Plan

### 1. Update style.css ✅

- Append extracted inline styles as CSS classes
- Add simulation-specific styles (devices, bezels, buttons, animations)

### 2. Update script.js ✅

- Append page-specific JS functions (setupSetupForm, initSimulation, etc.)
- Add page-detection logic to auto-init handlers

### 3. Clean HTML files [PENDING]

- setup.html: Remove inline styles/scripts, add classes ✅
- simulation.html: Remove extensive inline styles/scripts, add classes
- crowd.html: Remove inline styles/scripts, add classes ✅
- sender.html: Remove inline styles/scripts, add classes ✅
- receiver.html: Remove inline styles/scripts, add classes ✅
- receiver.html: Remove inline styles/scripts, add classes
- dashboard.html: Remove inline script ✅

### 4. Testing [PENDING]

- Verify all pages load correctly
- Test simulation flow (setup → sender/crowd → feed/receiver)
- Check responsive design, no JS errors
- Update this TODO with completion status

### 5. Final Validation [PENDING]

- Run HTML/CSS/JS linters if available
- Confirm clean separation (no inline styles/scripts left)

**Next: BLACKBOXAI will handle step-by-step using tools**
