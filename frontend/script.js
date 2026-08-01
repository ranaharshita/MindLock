/* =============================================
   MINDLOCK — script.js
   All app logic: Auth, Dashboard, Focus Mode,
   Gamification, AI Companion, Chatbot
   ============================================= */

// ============================================
// STATE — Load from localStorage on start
// ============================================
let currentUser = null;  // username string

function getState() {
  if (!currentUser) return null;
  const key = 'ml_' + currentUser;
  const raw = localStorage.getItem(key);
  if (!raw) return defaultState();
  return JSON.parse(raw);
}

function saveState(state) {
  localStorage.setItem('ml_' + currentUser, JSON.stringify(state));
}

function defaultState() {
  return {
    points: 0,
    sessions: 0,
    focusMinutes: 0,
    streak: 1,
    lastSessionDate: null,
    distractionCount: 0
  };
}

// ============================================
// LEVEL SYSTEM
// ============================================
const LEVELS = [
  { min: 0,   max: 50,  level: 1, name: '👾 Glitch Core',  msg: '"System unstable… too many distractions"',  orbClass: 'level-1' },
  { min: 50,  max: 150, level: 2, name: '🤖 Basic Bot',     msg: '"Initializing focus systems…"',              orbClass: 'level-2' },
  { min: 150, max: 300, level: 3, name: '🧠 Smart AI',      msg: '"Focus improving. Keep going."',             orbClass: 'level-3' },
  { min: 300, max: 500, level: 4, name: '⚡ Advanced AI',   msg: '"You are in control."',                      orbClass: 'level-4' },
  { min: 500, max: 9999,level: 5, name: '🌌 Sentient AI',   msg: '"Optimal state achieved."',                  orbClass: 'level-5' },
];

function getLevelData(points) {
  for (let l of LEVELS) {
    if (points >= l.min && points < l.max) return l;
  }
  return LEVELS[LEVELS.length - 1];
}

// ============================================
// AUTH
// ============================================
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.add('hidden');
  
  if (tab === 'login') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('loginForm').classList.remove('hidden');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('signupForm').classList.remove('hidden');
  }
}

async function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const err = document.getElementById("loginError");

  if (!username || !password) {
    err.textContent = "Please fill in all fields.";
    return;
  }

  try {
    const response = await fetch("http://13.201.104.168:5000/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (data.success) {
      err.textContent = "";
      currentUser = username;
      localStorage.setItem("ml_currentUser", username);

      // Create local progress if first login
      if (!localStorage.getItem("ml_" + username)) {
        saveState(defaultState());
      }

      loadDashboard();
    } else {
      err.textContent = data.message;
    }

  } catch (e) {
    err.textContent = "Could not reach server.";
    console.error(e);
  }
}
async function signup() {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("signupConfirm").value;
  const err = document.getElementById("signupError");

  if (!username || !password) {
    err.textContent = "Please fill in all fields.";
    return;
  }

  if (password !== confirm) {
    err.textContent = "Passwords do not match.";
    return;
  }

  try {
    const response = await fetch("http://13.201.104.168:5000/api/users/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (data.success) {
      currentUser = username;
      localStorage.setItem("ml_currentUser", username);

      saveState(defaultState());

      loadDashboard();
    } else {
      err.textContent = data.message;
    }

  } catch (e) {
    err.textContent = "Could not reach server.";
    console.error(e);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('ml_currentUser');
  showScreen('authScreen');
  // Clear form fields
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
}

// ============================================
// SCREEN NAVIGATION
// ============================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const el = document.getElementById(id);
  el.style.display = 'block';
  el.classList.add('active');

  // If going to focus screen, reset UI
  if (id === 'focusScreen') initFocusScreen();
}

// ============================================
// DASHBOARD
// ============================================
function loadDashboard() {
  showScreen('dashboardScreen');
  updateStreak();
  renderDashboard();
}

function updateStreak() {
  const state = getState();
  const today = new Date().toDateString();
  if (state.lastSessionDate !== today) {
    // Check if yesterday
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.lastSessionDate === yesterday) {
      // streak continues
    } else if (state.lastSessionDate !== today) {
      // reset streak only if more than 1 day gap
      const daysSince = state.lastSessionDate
        ? Math.floor((Date.now() - new Date(state.lastSessionDate)) / 86400000)
        : 0;
      if (daysSince > 1) state.streak = 0;
    }
    saveState(state);
  }
}

function renderDashboard() {
  const state = getState();
  if (!state) return;

  document.getElementById('navUser').textContent = '👤 ' + currentUser;

  // Stats
  document.getElementById('totalFocusTime').textContent = state.focusMinutes + ' min';
  document.getElementById('totalPoints').textContent = state.points + ' pts';
  document.getElementById('dailyStreak').textContent = state.streak + ' days';
  document.getElementById('sessionsCount').textContent = state.sessions;

  // Companion mini-stats
  document.getElementById('cPoints').textContent = state.points;
  document.getElementById('cLevel').textContent = getLevelData(state.points).level;
  document.getElementById('cSessions').textContent = state.sessions;

  // Level & progress bar
  const lvl = getLevelData(state.points);
  const nextLvl = LEVELS.find(l => l.level === lvl.level + 1);
  const pct = nextLvl
    ? Math.min(100, ((state.points - lvl.min) / (lvl.max - lvl.min)) * 100)
    : 100;

  document.getElementById('progressBarFill').style.width = pct + '%';
  document.getElementById('progressLevelText').textContent = 'Level ' + lvl.level;
  document.getElementById('progressSubtext').textContent = nextLvl
    ? (lvl.max - state.points) + ' pts to Level ' + nextLvl.level
    : '🌌 Maximum Level Reached!';

  // AI Companion
  updateCompanionVisual(state.points);

  // Overuse alert
  document.getElementById('overuseAlert').classList.toggle('hidden', state.distractionCount < 5);

  // Motivation
  refreshMotivation();

  // Bonus features
  renderGoal();
  renderHistory();
}

function updateCompanionVisual(points) {
  const lvl = getLevelData(points);
  const orb = document.getElementById('companionOrb');
  orb.className = 'companion-orb ' + lvl.orbClass;
  document.getElementById('companionName').textContent = lvl.name;
  document.getElementById('companionMsg').textContent = lvl.msg;
  document.getElementById('companionLevelBadge').textContent = 'Level ' + lvl.level;

  // Also update focus mini companion color
  const mini = document.getElementById('focusCompanionMini');
  if (mini) {
    const colors = {
      'level-1': '#4a3870',
      'level-2': '#7c3aed',
      'level-3': '#3b82f6',
      'level-4': '#a855f7',
      'level-5': '#ffffff'
    };
    mini.style.background = colors[lvl.orbClass] || 'var(--accent-grad)';
  }
}

// ============================================
// MOTIVATION QUOTES
// ============================================
const QUOTES = [
  '"Every focused minute is a step toward clarity."',
  '"Your phone can wait. Your future cannot."',
  '"Discipline is choosing what you want most over what you want now."',
  '"Small steps every day build extraordinary outcomes."',
  '"The mind is the most powerful tool you own."',
  '"Digital detox is not about escaping life — it\'s about finding it."',
  '"Focus is the new IQ."',
  '"Less scrolling, more living."',
  '"You are stronger than any notification."',
  '"Awareness is the first step to change."',
];

function refreshMotivation() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('motivationMsg').textContent = q;
}

// ============================================
// FOCUS MODE
// ============================================
let focusTimer = null;
let focusTotalSeconds = 0;
let focusSecondsLeft = 0;
let focusPaused = false;
let selectedMinutes = 25;

function initFocusScreen() {
  // Reset to setup state
  document.getElementById('focusSetup').classList.remove('hidden');
  document.getElementById('focusActive').classList.add('hidden');
  document.getElementById('focusComplete').classList.add('hidden');
  document.getElementById('distractionWarning').classList.add('hidden');
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('customMinutes').value = '';
  clearInterval(focusTimer);

  // Update companion mini color
  if (currentUser) {
    const state = getState();
    if (state) updateCompanionVisual(state.points);
  }
}

function setPreset(min) {
  selectedMinutes = min;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
  event.target.classList.add('selected');
  document.getElementById('customMinutes').value = '';
}

function startFocusSession() {
  const custom = parseInt(document.getElementById('customMinutes').value);
  const minutes = custom > 0 ? custom : selectedMinutes;

  if (!minutes || minutes < 1) {
    showToast('Please select or enter a duration!');
    return;
  }

  focusTotalSeconds = minutes * 60;
  focusSecondsLeft = focusTotalSeconds;
  focusPaused = false;
  distractionStrikes = 0;
  lockOverlayVisible = false;

  document.getElementById('focusSetup').classList.add('hidden');
  document.getElementById('focusActive').classList.remove('hidden');
  document.getElementById('focusLockOverlay').classList.add('hidden');
  document.getElementById('pauseBtn').textContent = '⏸ Pause';

  updateTimerDisplay();
  updateRingProgress();

  focusTimer = setInterval(tickTimer, 1000);

  // NEW: Fullscreen + focus guards
  tryFullscreen();
  attachFocusGuards();
}

function tickTimer() {
  if (focusPaused) return;
  focusSecondsLeft--;
  updateTimerDisplay();
  updateRingProgress();

  if (focusSecondsLeft <= 0) {
    clearInterval(focusTimer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    sessionComplete();
  }
}

function updateTimerDisplay() {
  const m = Math.floor(focusSecondsLeft / 60).toString().padStart(2, '0');
  const s = (focusSecondsLeft % 60).toString().padStart(2, '0');
  document.getElementById('timerDisplay').textContent = m + ':' + s;
}

function updateRingProgress() {
  const circumference = 2 * Math.PI * 88; // 553.0
  const fraction = focusSecondsLeft / focusTotalSeconds;
  const offset = circumference * (1 - fraction);
  const ring = document.getElementById('ringProgress');
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = offset;
  // Set stroke color via attribute (gradient fallback)
  ring.style.stroke = fraction > 0.5 ? '#7c3aed' : '#3b82f6';
}

function pauseResume() {
  focusPaused = !focusPaused;
  document.getElementById('pauseBtn').textContent = focusPaused ? '▶ Resume' : '⏸ Pause';
}

function endSessionEarly() {
  clearInterval(focusTimer);
  detachFocusGuards();
  lockOverlayVisible = false;
  document.getElementById('focusLockOverlay').classList.add('hidden');
  initFocusScreen();
  showToast('Session ended early. Keep going next time! 💪');
}

function exitFocusMode() {
  clearInterval(focusTimer);
  detachFocusGuards();
  lockOverlayVisible = false;
  document.getElementById('focusLockOverlay').classList.add('hidden');
  if (soundOn) stopSound();
  showScreen('dashboardScreen');
  renderDashboard();
}

// ============================================
// FOCUS LOCK SYSTEM
// ============================================
let distractionStrikes = 0;   // per session
let lockOverlayVisible = false;

const LOCK_MESSAGES = [
  "You left your session! Come back — your companion needs you.",
  "Second time! Every distraction costs your focus streak. 😤",
  "Third strike! Seriously, lock in. You promised yourself this session.",
  "Stop. Your future self will thank you for finishing this. 💪",
  "This is the fifth time. You CAN do this. Stay here.",
];

const DISTRACTION_TIPS = [
  "💡 Tip: Put your phone face-down before sessions.",
  "💡 Tip: Close unused browser tabs before you start.",
  "💡 Tip: Tell people you're in a focus session.",
  "💡 Tip: Try the 5-second rule — count 5 and return.",
  "💡 Tip: Each distraction resets your deep focus momentum.",
];

// Called when user tries to leave (tab blur, visibility change, etc.)
function triggerFocusLock() {
  if (!focusSecondsLeft || focusSecondsLeft <= 0 || focusPaused) return;
  if (lockOverlayVisible) return; // already showing

  distractionStrikes++;
  const state = getState();
  state.distractionCount = (state.distractionCount || 0) + 1;
  saveState(state);

  const idx = Math.min(distractionStrikes - 1, LOCK_MESSAGES.length - 1);
  document.getElementById('lockBody').textContent = LOCK_MESSAGES[idx];

  // Penalty message
  const tip = DISTRACTION_TIPS[(distractionStrikes - 1) % DISTRACTION_TIPS.length];
  document.getElementById('lockPenalty').textContent =
    `⚡ Distraction #${distractionStrikes} this session  ·  ${tip}`;

  // Make orb look damaged
  const orb = document.getElementById('lockOrb');
  const lvl = getLevelData(state.points);
  // Use current level colors but tinted red
  orb.style.background = 'radial-gradient(circle at 35% 35%, #ef4444, #7f1d1d)';
  orb.style.boxShadow = '0 0 50px rgba(239,68,68,0.7), 0 0 100px rgba(239,68,68,0.3)';

  lockOverlayVisible = true;
  document.getElementById('focusLockOverlay').classList.remove('hidden');

  // Shake if repeat offender
  if (distractionStrikes > 1) {
    const content = document.querySelector('.lock-content');
    content.classList.remove('shake');
    void content.offsetWidth; // reflow
    content.classList.add('shake');
  }

  // Also flash the page title as an extra cue
  flashTitle('🔒 RETURN TO SESSION');
}

function dismissLockOverlay() {
  lockOverlayVisible = false;
  document.getElementById('focusLockOverlay').classList.add('hidden');
  stopTitleFlash();
  // Re-request fullscreen
  tryFullscreen();
}

// ---- Fullscreen ----
function tryFullscreen() {
  const el = document.getElementById('focusScreen');
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
}

// ---- Title flasher ----
let titleFlashInterval = null;
let originalTitle = 'MindLock – Manage Digital Addiction';

function flashTitle(msg) {
  let show = true;
  titleFlashInterval = setInterval(() => {
    document.title = show ? msg : originalTitle;
    show = !show;
  }, 800);
}

function stopTitleFlash() {
  clearInterval(titleFlashInterval);
  document.title = originalTitle;
}

// ---- Event listeners for leaving ----
function attachFocusGuards() {
  document.addEventListener('visibilitychange', onFocusLeave);
  window.addEventListener('blur', onFocusLeave);
}

function detachFocusGuards() {
  document.removeEventListener('visibilitychange', onFocusLeave);
  window.removeEventListener('blur', onFocusLeave);
  stopTitleFlash();
  exitFullscreen();
}

function onFocusLeave() {
  if (document.hidden || !document.hasFocus()) {
    triggerFocusLock();
  }
}

// ---- Also catch old onVisibilityChange reference ----
function onVisibilityChange() { onFocusLeave(); }

// ============================================
// NIGHT OVERUSE ALERT
// ============================================
let nightAlertTimeout = null;
let nightSnoozed = false;

const NIGHT_QUOTES = [
  '"Sleep is the best meditation." — Dalai Lama',
  '"A good laugh and a long sleep are the best cures." — Irish Proverb',
  '"Your future self is watching you right now." — Unknown',
  '"The brain never stops working — give it rest." — Neuroscience',
  '"Late-night scrolling steals tomorrow\'s focus." — MindLock',
];

const NIGHT_MESSAGES = {
  22: "It's past 10 PM. Screens this late suppress melatonin and disrupt deep sleep. Your brain is begging for rest.",
  23: "It's almost midnight. Heavy screen use now will cost you 2–3 hours of productive focus tomorrow. Is it worth it?",
  0:  "It's past midnight. This is the peak time when digital addiction is hardest to resist. You are stronger than the algorithm.",
  1:  "It's 1 AM. This level of late-night usage is directly linked to anxiety and depression. Please rest.",
  2:  "It's past 2 AM. Seriously — nothing on your phone is worth this. Your mental health matters.",
};

function checkNightTime() {
  const h = new Date().getHours();
  const isNightHour = h >= 22 || h <= 2; // 10 PM – 2 AM
  if (!isNightHour || nightSnoozed) return;

  const modal = document.getElementById('nightAlertModal');
  if (!modal.classList.contains('hidden')) return; // already showing

  // Pick message
  const msg = NIGHT_MESSAGES[h] || NIGHT_MESSAGES[22];
  document.getElementById('nightMsg').textContent = msg;

  // Random night quote
  const q = NIGHT_QUOTES[Math.floor(Math.random() * NIGHT_QUOTES.length)];
  document.getElementById('nightQuote').textContent = q;

  modal.classList.remove('hidden');
}

function closeNightAlert(putDown) {
  document.getElementById('nightAlertModal').classList.add('hidden');
  if (putDown) {
    showToast('💤 Great choice. Rest well, come back tomorrow!');
    nightSnoozed = true; // don't show again this session
  } else {
    // Snooze 30 min
    showToast('⏰ Reminder set for 30 minutes.');
    nightSnoozed = true;
    nightAlertTimeout = setTimeout(() => {
      nightSnoozed = false;
      checkNightTime();
    }, 30 * 60 * 1000);
  }
}

// Check night time every 5 minutes while app is open
function startNightWatcher() {
  checkNightTime(); // immediate check on load
  setInterval(checkNightTime, 5 * 60 * 1000);
}

function sessionComplete() {
  clearInterval(focusTimer);
  detachFocusGuards();
  lockOverlayVisible = false;
  document.getElementById('focusLockOverlay').classList.add('hidden');
  const minutesDone = Math.ceil(focusTotalSeconds / 60);
  const pointsEarned = 20; // fixed per session

  const state = getState();
  state.points += pointsEarned;
  state.sessions += 1;
  state.focusMinutes += minutesDone;
  state.streak = (state.streak || 0) + 1;
  state.lastSessionDate = new Date().toDateString();
  saveState(state);

  // Log to history + tick daily goal
  addHistoryEntry(minutesDone, pointsEarned);
  tickGoal();

  // Show complete UI
  document.getElementById('focusActive').classList.add('hidden');
  document.getElementById('focusComplete').classList.remove('hidden');
  document.getElementById('completeSubtitle').textContent =
    `+${pointsEarned} points earned! Total: ${state.points} pts`;
}

function claimReward() {
  showScreen('dashboardScreen');
  renderDashboard();
  showToast('🎉 Reward claimed! Great work!');
}

// ============================================
// CHATBOT (Rule-based)
// ============================================
const CHAT_RULES = [
  { triggers: ['hello','hi','hey','start'], reply: "Hey there! 👋 I'm your AI Companion. Ready to crush some focus sessions? 🚀" },
  { triggers: ['focus','session','start session','timer'], reply: "Let's start a focus session! 🚀 Head to Focus Mode and set your timer. Even 15 minutes makes a difference!" },
  { triggers: ['points','score','level','xp'], reply: "You earn +20 points per completed session! Keep stacking them to level up your companion. 💪" },
  { triggers: ['level','evolve','upgrade','grow'], reply: "Your AI Companion evolves as you earn points: Level 1→2 at 50pts, 2→3 at 150pts, 3→4 at 300pts, 4→5 at 500pts! 🌌" },
  { triggers: ['streak','daily','consecutive'], reply: "Your daily streak grows every day you complete a session. Don't break the chain! 🔥" },
  { triggers: ['distraction','phone','social media','scrolling'], reply: "Digital addiction is real! Every time you avoid a distraction, your mind gets stronger. You've got this! 💪" },
  { triggers: ['motivation','inspire','quote','help'], reply: "\"Focus is the new IQ.\" 🧠 One focused hour beats three scattered hours. You're already ahead by being here!" },
  { triggers: ['break','rest','tired'], reply: "Take a short break and refresh! ☕ Even 5 minutes away from screens helps reset your mind." },
  { triggers: ['how','what is','explain','mindlock'], reply: "MindLock helps you manage digital addiction using focus sessions, gamification, and an AI companion that grows with you! 🌱" },
  { triggers: ['dashboard','home','back','navigate'], reply: "Head to the Dashboard to see your stats and companion, or hit Focus Mode to start a session! 🗺️" },
  { triggers: ['great','good','awesome','nice','thanks','thank'], reply: "You're improving! 🔥 Every session is a victory. Keep going — your companion is watching! 👾" },
  { triggers: ['bad','fail','failed','miss','sad'], reply: "Don't worry! Progress isn't linear. Every new session is a fresh start. I believe in you! 💙" },
];

const DEFAULT_REPLY = "I'm here to help! Try asking about focus sessions, your level, streaks, or motivation. 😊";

function toggleChat() {
  const win = document.getElementById('chatWindow');
  win.classList.toggle('hidden');
}

async function sendChat() {
  console.log("NEW sendChat is running");
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  appendChat(msg, 'user');
  input.value = '';

  try {
    const response = await fetch("http://13.201.104.168:5000/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: msg
      })
    });

    const data = await response.json();

    if (data.success) {
      appendChat(data.reply, "bot");
    } else {
      appendChat("Sorry, AI is unavailable.", "bot");
    }

  } catch (error) {
    console.error(error);
    appendChat("Cannot connect to AI server.", "bot");
  }
}

function appendChat(text, sender) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + sender;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function getBotReply(msg) {
  for (let rule of CHAT_RULES) {
    if (rule.triggers.some(t => msg.includes(t))) return rule.reply;
  }
  // Add personal stats if logged in
  if (currentUser) {
    const state = getState();
    if (state && (msg.includes('my') || msg.includes('me') || msg.includes('stat'))) {
      const lvl = getLevelData(state.points);
      return `You have ${state.points} points, ${state.sessions} sessions, and a ${state.streak}-day streak! Your companion is at ${lvl.name}. Keep going! 💫`;
    }
  }
  return DEFAULT_REPLY;
}

// ============================================
// TOAST NOTIFICATION
// ============================================
let toastTimeout = null;
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), duration);
}

// ============================================
// BONUS FEATURE 1: DAILY GOAL TRACKER
// ============================================

function getGoalState() {
  if (!currentUser) return { target: 3, todayDone: 0, date: '' };
  const raw = localStorage.getItem('ml_goal_' + currentUser);
  const today = new Date().toDateString();
  if (!raw) return { target: 3, todayDone: 0, date: today };
  const g = JSON.parse(raw);
  // Reset daily count if new day
  if (g.date !== today) { g.todayDone = 0; g.date = today; saveGoalState(g); }
  return g;
}

function saveGoalState(g) {
  localStorage.setItem('ml_goal_' + currentUser, JSON.stringify(g));
}

function adjustGoal(delta) {
  const g = getGoalState();
  g.target = Math.max(1, Math.min(10, (g.target || 3) + delta));
  saveGoalState(g);
  renderGoal();
}

function renderGoal() {
  const g = getGoalState();
  const target = g.target || 3;
  const done = Math.min(g.todayDone || 0, target);

  document.getElementById('goalTarget').textContent = target;
  document.getElementById('goalSubtext').textContent =
    done >= target
      ? `✅ Goal complete! Amazing work!`
      : `Complete ${target} sessions today (${done}/${target} done)`;

  const box = document.getElementById('goalCheckboxes');
  box.innerHTML = '';
  for (let i = 0; i < target; i++) {
    const div = document.createElement('div');
    div.className = 'goal-check' + (i < done ? ' done' : '');
    div.textContent = i < done ? '✓' : '';
    box.appendChild(div);
  }
}

// Called after each completed session to tick off a checkbox
function tickGoal() {
  const g = getGoalState();
  g.date = new Date().toDateString();
  g.todayDone = (g.todayDone || 0) + 1;
  saveGoalState(g);
  renderGoal();
  if (g.todayDone === g.target) {
    setTimeout(() => showToast('🎯 Daily goal complete! You\'re on fire!'), 500);
  }
}

// ============================================
// BONUS FEATURE 2: SESSION HISTORY LOG
// ============================================

function getHistory() {
  if (!currentUser) return [];
  const raw = localStorage.getItem('ml_history_' + currentUser);
  return raw ? JSON.parse(raw) : [];
}

function addHistoryEntry(minutes, points) {
  const history = getHistory();
  const now = new Date();
  const entry = {
    id: Date.now(),
    minutes: minutes,
    points: points,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
  };
  history.unshift(entry); // newest first
  // Keep only last 5
  if (history.length > 5) history.pop();
  localStorage.setItem('ml_history_' + currentUser, JSON.stringify(history));
}

function renderHistory() {
  const history = getHistory();
  const list = document.getElementById('historyList');
  if (!history.length) {
    list.innerHTML = '<p class="history-empty">No sessions yet. Start your first one! 🚀</p>';
    return;
  }
  list.innerHTML = history.map(e => `
    <div class="history-item">
      <div class="history-item-left">
        <span class="history-item-icon">⏱</span>
        <div>
          <div class="history-item-title">${e.minutes} min session</div>
          <div class="history-item-time">${e.date} · ${e.time}</div>
        </div>
      </div>
      <span class="history-item-pts">+${e.points} pts</span>
    </div>
  `).join('');
}

function clearHistory() {
  if (!currentUser) return;
  localStorage.removeItem('ml_history_' + currentUser);
  renderHistory();
  showToast('History cleared.');
}

// ============================================
// BONUS FEATURE 3: AMBIENT FOCUS SOUND
// ============================================
let audioCtx = null;
let soundNodes = [];   // oscillators / gain nodes
let soundOn = false;

function toggleSound() {
  soundOn ? stopSound() : startSound();
  // Update both sound buttons
  const label = soundOn ? '🔊 Sound' : '🔇 Sound';
  const focusLabel = soundOn ? '🔊' : '🔇';
  const navBtn = document.getElementById('soundBtn');
  const focusBtn = document.getElementById('focusSoundBtn');
  if (navBtn) navBtn.textContent = label;
  if (focusBtn) {
    focusBtn.textContent = focusLabel;
    focusBtn.classList.toggle('active', soundOn);
  }
}

function startSound() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Low hum: binaural-style ambient drone
    const createOsc = (freq, gainVal, type = 'sine') => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + 2); // fade in
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      return { osc, gain };
    };

    // Soft layered ambient: 40Hz base + 60Hz + gentle white noise feel
    const n1 = createOsc(40,  0.04, 'sine');    // deep sub hum
    const n2 = createOsc(60,  0.03, 'sine');    // soft hum
    const n3 = createOsc(180, 0.015, 'sine');   // faint overtone
    const n4 = createOsc(240, 0.010, 'sine');   // air feel

    soundNodes = [n1, n2, n3, n4];
    soundOn = true;
    showToast('🔊 Ambient focus sound ON');
  } catch (e) {
    showToast('Sound not supported in this browser.');
  }
}

function stopSound() {
  soundNodes.forEach(({ osc, gain }) => {
    try {
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1); // fade out
      setTimeout(() => osc.stop(), 1100);
    } catch (e) {}
  });
  soundNodes = [];
  soundOn = false;
  showToast('🔇 Sound off');
}

// (sound auto-stops via exitFocusMode which calls stopSound directly)

window.addEventListener('DOMContentLoaded', () => {
  // Start night-time overuse watcher
  startNightWatcher();

  // Check if user was already logged in
  const saved = localStorage.getItem('ml_currentUser');
  if (saved) {
    const users = JSON.parse(localStorage.getItem('ml_users') || '{}');
    if (users[saved]) {
      currentUser = saved;
      loadDashboard();
      return;
    }
  }
  showScreen('authScreen');
});

// Testing backend connection
