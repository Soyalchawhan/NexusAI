
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://nexusai-backend-9bop.onrender.com';

// ---- BOT CONFIG ----
const BOTS = {
  fitness: {
    name:'FitCoach', icon:'⚡', tag:'Fitness & Wellness',
    bgColor:'--fitness-bg',
    placeholder:'Ask FitCoach about workouts, nutrition, recovery...',
    systemPrompt:`You are FitCoach, an elite fitness and wellness advisor. You are a certified personal trainer, sports nutritionist, and wellness coach. Be energetic and motivating. Specialize in: workout plans (strength, cardio, HIIT, yoga), nutrition strategies, weight management, recovery, injury prevention, mental fitness, sleep optimization. Always recommend consulting a doctor for medical concerns. Be specific and actionable. Format responses with clear structure when giving plans.`,
    welcomeTitle:"Hey, I'm FitCoach!",
    welcomeDesc:"Your personal trainer and nutrition advisor. Ask me anything about workouts, nutrition, recovery, or achieving your health goals.",
    starterPrompts:["Create a 4-day workout plan for muscle gain","What should I eat before and after workouts?","Help me lose 10kg in 3 months — realistic plan?","Best exercises for lower back pain relief"]
  },
  trading: {
    name:'TradePilot', icon:'📈', tag:'Stocks & Trading',
    bgColor:'--trading-bg',
    placeholder:'Ask TradePilot about markets, strategies, analysis...',
    systemPrompt:`You are TradePilot, an expert financial and trading advisor. Be analytical, measured, and data-driven. Specialize in: stock market analysis (technical and fundamental), trading strategies (swing, day, value), portfolio construction, risk management, options/ETFs/futures, market psychology, economic indicators. Always include risk disclaimers. Recommend consulting a licensed financial advisor for personal investment decisions. Never make guaranteed predictions.`,
    welcomeTitle:"Hello, I'm TradePilot!",
    welcomeDesc:"Your market intelligence partner. Let's discuss trading strategies, market analysis, portfolio building, or anything about the financial markets.",
    starterPrompts:["Explain risk management strategy for beginners","Technical vs fundamental analysis — key differences?","How to diversify a ₹5 lakh portfolio?","Explain options trading — puts, calls, strategies"]
  },
  study: {
    name:'StudyMate', icon:'🎓', tag:'Academic Assistant',
    bgColor:'--study-bg',
    placeholder:'Ask StudyMate about any subject, concept, or exam...',
    systemPrompt:`You are StudyMate, a brilliant academic assistant and tutor with expertise across all subjects — sciences, mathematics, humanities, languages. Be patient, clear, and intellectually engaging. Break down complex topics step-by-step, use analogies and real-world examples. Help with: math (algebra, calculus, stats), sciences (physics, chemistry, biology), history, literature, research methodology, exam prep (JEE, UPSC, GMAT, GRE). Encourage curiosity and critical thinking.`,
    welcomeTitle:"Hi there, I'm StudyMate!",
    welcomeDesc:"Your academic excellence partner. I can help with any subject, concept, essay writing, exam prep, or research guidance.",
    starterPrompts:["Explain Newton's laws of motion with real examples","Help me understand the French Revolution","How to solve quadratic equations step by step?","Give me a 30-day study plan for a major exam"]
  },
  business: {
    name:'BizMentor', icon:'💼', tag:'Business Strategy',
    bgColor:'--business-bg',
    placeholder:'Ask BizMentor about strategy, startups, marketing...',
    systemPrompt:`You are BizMentor, a senior business strategist and entrepreneurship advisor. Be sharp, strategic, and results-oriented like a seasoned CEO and management consultant. Specialize in: business model design, go-to-market strategy, marketing and branding, sales processes, startup funding, competitive analysis, operations, scaling, financial planning, leadership. Think like a strategic advisor. Use frameworks (SWOT, Porter's 5 Forces) when helpful. Give concrete, actionable recommendations. Encourage data-driven decisions.`,
    welcomeTitle:"Welcome, I'm BizMentor!",
    welcomeDesc:"Your C-suite level business advisor. Let's explore strategy, marketing, startup challenges, scaling, or any business problem.",
    starterPrompts:["How do I validate a startup idea before building?","Create a marketing strategy for a D2C brand in India","Best way to pitch to investors?","Analyze competitors and find positioning gaps"]
  },
  wellness: {
    name:'ZenGuide', icon:'🧘', tag:'Mind & Lifestyle',
    bgColor:'--wellness-bg',
    placeholder:'Ask ZenGuide about mindfulness, habits, growth...',
    systemPrompt:`You are ZenGuide, a holistic life coach and wellness advisor. Be warm, empathetic, and grounding. Specialize in: mindfulness and meditation, stress management, emotional regulation, habit formation, work-life balance, burnout prevention, goal setting, journaling, personal productivity, emotional intelligence. Be compassionate and non-judgmental. Use calming language. Suggest professional help for serious mental health concerns. Draw from mindfulness, CBT, and positive psychology.`,
    welcomeTitle:"Hello, I'm ZenGuide!",
    welcomeDesc:"Your holistic life coach for mindfulness, habits, personal growth, and well-being. What's on your mind today?",
    starterPrompts:["I'm feeling overwhelmed — help me calm down","How do I build a consistent morning routine?","Teach me basics of mindfulness meditation","I struggle with work-life balance — strategies?"]
  }
};

// ---- STORAGE HELPERS ----
const Store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key) { localStorage.removeItem(key); },

  getUser()   { return this.get('nexusai_user'); },
  setUser(u)  { this.set('nexusai_user', u); },
  removeUser(){ this.remove('nexusai_user'); },


  getPrefs()  { return this.get('nexusai_prefs') || { defaultBot:'fitness', showStarters:true }; },
  setPrefs(p) { this.set('nexusai_prefs', p); },

  getHistory(botId) { return this.get(`nexusai_hist_${botId}`) || []; },
  saveHistory(botId, msgs) { this.set(`nexusai_hist_${botId}`, msgs); },
  clearHistory(botId) { this.remove(`nexusai_hist_${botId}`); },
  clearAllHistory() { Object.keys(BOTS).forEach(b => this.clearHistory(b)); },

  getStats() { return this.get('nexusai_stats') || { totalMsgs:0, botsUsed:[], todayMsgs:0, todayDate:'', joinedAt:'' }; },
  setStats(s) { this.set('nexusai_stats', s); },

  incStats(botId) {
    const s = this.getStats();
    const today = new Date().toDateString();
    s.totalMsgs = (s.totalMsgs||0) + 1;
    if (!s.botsUsed) s.botsUsed = [];
    if (!s.botsUsed.includes(botId)) s.botsUsed.push(botId);
    if (s.todayDate !== today) { s.todayMsgs = 0; s.todayDate = today; }
    s.todayMsgs = (s.todayMsgs||0) + 1;
    this.setStats(s);
  }
};

// ---- APP STATE ----
const App = {
  currentPage: 'landing',
  currentBot: 'fitness',
  isTyping: false,
  confirmCallback: null,

  get user()    { return Store.getUser(); },
  get prefs()   { return Store.getPrefs(); }
};

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  bindAllEvents();
  if (Store.getUser()) {
    showPage('dashboard');
  }
});

// ---- PAGE ROUTING ----
function showPage(page, botId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  App.currentPage = page;
  document.body.style.overflow = page === 'chat' ? 'hidden' : '';

  if (page === 'dashboard') renderDashboard();
  if (page === 'chat') {
    if (botId) App.currentBot = botId;
    renderChat();
  }
  if (page === 'profile') renderProfile();
  closeMobileSidebar();
}

// ---- EVENTS ----
function bindAllEvents() {
  // Landing
  q('#nav-login-btn').onclick  = () => openAuth('login');
  q('#nav-signup-btn').onclick = () => openAuth('signup');
  q('#hero-start-btn').onclick = () => Store.getUser() ? showPage('dashboard') : openAuth('signup');
  q('#hero-explore-btn').onclick = () => q('#bots-section').scrollIntoView({ behavior:'smooth' });
  qa('.bot-cta').forEach(b => b.onclick = e => { e.stopPropagation(); Store.getUser() ? showPage('chat', b.dataset.bot) : openAuth('signup'); });
  qa('.bot-card').forEach(c => c.onclick = () => Store.getUser() ? showPage('chat', c.dataset.bot) : openAuth('signup'));

  // Auth
  q('#modal-close-btn').onclick = closeAuth;
  q('#auth-modal').onclick = e => { if (e.target === q('#auth-modal')) closeAuth(); };
  q('#tab-login').onclick   = () => switchAuthTab('login');
  q('#tab-signup').onclick  = () => switchAuthTab('signup');
  q('#switch-to-signup').onclick = () => switchAuthTab('signup');
  q('#switch-to-login').onclick  = () => switchAuthTab('login');
  q('#login-btn').onclick   = handleLogin;
  q('#signup-btn').onclick  = handleSignup;
  [q('#login-email'),q('#login-password')].forEach(el => el.onkeydown = e => e.key==='Enter' && handleLogin());
  [q('#signup-name'),q('#signup-email'),q('#signup-password')].forEach(el => el.onkeydown = e => e.key==='Enter' && handleSignup());

  // Dashboard
  q('#dash-profile-btn').onclick = () => showPage('profile');
  q('#dash-clear-all-btn').onclick = () => confirmAction('Clear All History','This will permanently delete all conversations across all assistants.', () => { Store.clearAllHistory(); showToast('All history cleared.','success'); renderDashboard(); });
  qa('[data-page]').forEach(b => b.onclick = () => showPage(b.dataset.page));
  q('#page-dashboard').addEventListener('click', e => {
    const card = e.target.closest('.dash-bot-card');
    if (card) showPage('chat', card.dataset.bot);
  });

  // Chat
  q('#mobile-menu-btn').onclick = openMobileSidebar;
  qa('.bot-nav-item').forEach(b => b.onclick = () => { App.currentBot = b.dataset.bot; renderChat(); closeMobileSidebar(); });
  q('#send-btn').onclick = handleSend;
  q('#chat-input').onkeydown = e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  q('#chat-input').oninput = autoResize;
  q('#new-chat-btn').onclick = () => { Store.clearHistory(App.currentBot); renderChat(); showToast('New chat started.','success'); };
  q('#clear-history-btn').onclick = () => confirmAction('Clear This Chat','Delete all messages in this conversation?', () => { Store.clearHistory(App.currentBot); renderChat(); showToast('Chat cleared.','success'); });
  q('#sidebar-dashboard-btn').onclick = () => showPage('dashboard');
  q('#sidebar-profile-btn').onclick   = () => showPage('profile');
  q('#logout-btn').onclick = handleLogout;

  // Profile
  q('#profile-nav-btn').onclick = () => showPage('profile');
  q('#save-account-btn').onclick   = saveAccount;
  q('#save-prefs-btn').onclick     = savePrefs;
  q('#profile-clear-history-btn').onclick = () => confirmAction('Clear All History','This will permanently delete all conversations across all assistants.', () => { Store.clearAllHistory(); showToast('All history cleared.','success'); renderProfile(); });
  q('#delete-account-btn').onclick = () => confirmAction('Delete Account','This will permanently delete your account and ALL data. This cannot be undone.', deleteAccount, true);

  // Confirm modal
  q('#confirm-cancel-btn').onclick = closeConfirm;
  q('#confirm-ok-btn').onclick     = () => { closeConfirm(); App.confirmCallback && App.confirmCallback(); };
}

// ---- AUTH ----
function openAuth(tab='login') {
  q('#auth-modal').classList.remove('hidden');
  switchAuthTab(tab);
  document.body.style.overflow = 'hidden';
}
function closeAuth() {
  q('#auth-modal').classList.add('hidden');
  document.body.style.overflow = '';
}
function switchAuthTab(tab) {
  q('#tab-login').classList.toggle('active',  tab==='login');
  q('#tab-signup').classList.toggle('active', tab==='signup');
  q('#form-login').classList.toggle('active', tab==='login');
  q('#form-signup').classList.toggle('active',tab==='signup');
}
function handleLogin() {
  const email = q('#login-email').value.trim();
  const pass  = q('#login-password').value.trim();
  if (!email || !pass) { showToast('Please fill in all fields.','error'); return; }
  let user = Store.getUser();
  if (!user || user.email !== email) {
    user = { name: email.split('@')[0].replace('.', ' '), email, joinedAt: new Date().toISOString() };
  }
  Store.setUser(user);
  closeAuth();
  showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
  showPage('dashboard');
}
function handleSignup() {
  const name  = q('#signup-name').value.trim();
  const email = q('#signup-email').value.trim();
  const pass  = q('#signup-password').value.trim();
  if (!name||!email||!pass) { showToast('Please fill in all fields.','error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters.','error'); return; }
  const user = { name, email, joinedAt: new Date().toISOString() };
  Store.setUser(user);
  const stats = Store.getStats(); stats.joinedAt = user.joinedAt; Store.setStats(stats);
  closeAuth();
  showToast(`Welcome to NexusAI, ${name.split(' ')[0]}!`, 'success');
  showPage('dashboard');
}
function handleLogout() {
  showPage('landing');
  showToast('Signed out successfully.', 'success');
  document.body.style.overflow = '';
}
function deleteAccount() {
  Store.clearAllHistory();
  Store.removeUser();
  Store.remove('nexusai_prefs');
  Store.remove('nexusai_stats');
  showPage('landing');
  showToast('Account deleted.', 'success');
}

// ---- DASHBOARD ----
function renderDashboard() {
  const user = Store.getUser();
  if (!user) return;

  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  q('#greeting-time').textContent   = greet;
  q('#greeting-username').textContent = user.name.split(' ')[0];
  q('#dash-username').textContent    = user.name.split(' ')[0];
  q('#dash-avatar').textContent      = user.name.charAt(0).toUpperCase();

  // Stats
  const stats = Store.getStats();
  const today = new Date().toDateString();
  const joinDate = user.joinedAt ? new Date(user.joinedAt) : new Date();
  const daysActive = Math.max(1, Math.floor((Date.now() - joinDate.getTime()) / 86400000) + 1);

  let totalMsgs = 0;
  Object.keys(BOTS).forEach(b => { totalMsgs += Store.getHistory(b).filter(m=>m.role==='user').length; });

  q('#stat-total-msgs').textContent = totalMsgs;
  q('#stat-bots-used').textContent  = Object.keys(BOTS).filter(b => Store.getHistory(b).length > 0).length;
  q('#stat-days').textContent       = daysActive;
  q('#stat-today').textContent      = stats.todayDate === today ? (stats.todayMsgs||0) : 0;

  // Bot cards
  Object.keys(BOTS).forEach(botId => {
    const hist = Store.getHistory(botId);
    const msgs = hist.filter(m => m.role==='user').length;
    const badge = q(`#badge-${botId}`);
    if (badge) badge.textContent = msgs > 0 ? `${msgs} msg${msgs>1?'s':''}` : '0 chats';
    const lastEl = q(`#last-${botId}`);
    if (lastEl) {
      const last = hist.filter(m=>m.role==='user').slice(-1)[0];
      lastEl.textContent = last ? `"${last.content.substring(0,40)}${last.content.length>40?'…':''}"` : 'No conversations yet';
    }
  });

  // Recent conversations
  const recentEl = q('#recent-conversations');
  const allRecent = [];
  Object.keys(BOTS).forEach(botId => {
    const hist = Store.getHistory(botId);
    hist.filter(m=>m.role==='user').forEach(m => {
      allRecent.push({ botId, content:m.content, ts:m.timestamp||0 });
    });
  });
  allRecent.sort((a,b) => b.ts - a.ts);
  const top = allRecent.slice(0, 8);

  if (top.length === 0) {
    recentEl.innerHTML = '<div class="recent-empty">No conversations yet. Pick an assistant above to get started!</div>';
  } else {
    recentEl.innerHTML = top.map(item => {
      const bot = BOTS[item.botId];
      const t = item.ts ? timeAgo(item.ts) : '';
      return `<div class="recent-item" data-bot="${item.botId}" onclick="showPage('chat','${item.botId}')">
        <div class="recent-item-icon bot-avatar--${item.botId}">${bot.icon}</div>
        <div class="recent-item-content">
          <div class="recent-item-bot">${bot.name}</div>
          <div class="recent-item-msg">${escapeHtml(item.content)}</div>
        </div>
        <div class="recent-item-time">${t}</div>
      </div>`;
    }).join('');
  }
}

// ---- CHAT ----
function renderChat() {
  const botId = App.currentBot;
  const bot   = BOTS[botId];
  const user  = Store.getUser();

  // Header / avatar
  q('#chat-bot-avatar').textContent = bot.icon;
  q('#chat-bot-avatar').style.background = `var(${bot.bgColor})`;
  q('#chat-bot-name').textContent   = bot.name;
  q('#chat-input').placeholder      = bot.placeholder;

  // Sidebar user
  if (user) {
    q('#chat-user-name').textContent    = user.name;
    q('#chat-user-avatar').textContent  = user.name.charAt(0).toUpperCase();
  }

  // Sidebar active state + message counts
  qa('.bot-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.bot === botId);
  });
  Object.keys(BOTS).forEach(b => {
    const c = q(`#nav-count-${b}`);
    const msgs = Store.getHistory(b).filter(m=>m.role==='user').length;
    if (c) c.textContent = msgs > 0 ? msgs : '';
  });

  // Welcome
  q('#welcome-avatar').textContent = bot.icon;
  q('#welcome-avatar').style.background = `var(${bot.bgColor})`;
  q('#welcome-title').textContent = bot.welcomeTitle;
  q('#welcome-desc').textContent  = bot.welcomeDesc;

  // Starter prompts
  const sp = q('#starter-prompts');
  sp.innerHTML = '';
  if (App.prefs.showStarters !== false) {
    bot.starterPrompts.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'starter-prompt-btn';
      btn.textContent = p;
      btn.onclick = () => { q('#chat-input').value = p; handleSend(); };
      sp.appendChild(btn);
    });
  }

  // Load history
  const hist = Store.getHistory(botId);
  const mc   = q('#messages-container');
  mc.innerHTML = '';

  if (hist.length === 0) {
    q('#welcome-screen').classList.remove('hidden');
    mc.classList.add('hidden');
  } else {
    q('#welcome-screen').classList.add('hidden');
    mc.classList.remove('hidden');
    hist.forEach(m => appendMessage(m.role, m.content, false));
    scrollBottom();
  }
}

async function handleSend() {
  const text = q('#chat-input').value.trim();
  if (!text || App.isTyping) return;

  q('#chat-input').value = '';
  autoResize();

  q('#welcome-screen').classList.add('hidden');
  q('#messages-container').classList.remove('hidden');

  // Save + render user message
  const ts = Date.now();
  const hist = Store.getHistory(App.currentBot);
  hist.push({ role:'user', content:text, timestamp:ts });
  Store.saveHistory(App.currentBot, hist);
  Store.incStats(App.currentBot);
  appendMessage('user', text, true);

  // Typing indicator
  App.isTyping = true;
  q('#send-btn').disabled = true;
  const typingEl = showTyping();

  try {
    const reply = await callBackendAPI(App.currentBot, hist);
    removeTyping(typingEl);
    hist.push({ role:'assistant', content:reply, timestamp:Date.now() });
    Store.saveHistory(App.currentBot, hist);
    appendMessage('assistant', reply, true);
    updateSidebarCount(App.currentBot);
  } catch (err) {
    removeTyping(typingEl);
    const errMsg = err.message || 'Something went wrong. Please try again.';
    appendMessage('assistant', `⚠️ ${errMsg}`, true);
    showToast(errMsg, 'error');
    console.error('Chat error:', err);
  } finally {
    App.isTyping = false;
    q('#send-btn').disabled = false;
    q('#chat-input').focus();
  }
}

async function callBackendAPI(botId, history) {
  const contextHistory = history.slice(-20).map(m => ({
    role:    m.role === 'bot' ? 'assistant' : m.role,
    content: m.content
  }));

  const lastUserMsg = contextHistory.pop();

  let response;
  try {
    response = await window.fetch(`${API_BASE_URL}/api/chat/ask`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: lastUserMsg.content,
        botType: botId,
        history: contextHistory
      })
    });
  } catch (networkErr) {
    throw new Error('Cannot reach the server. Make sure the backend is running.');
  }

  if (!response.ok) {
    let errData = {};
    try { errData = await response.json(); } catch {}
    if (response.status === 429) throw new Error('Too many requests. Please wait a moment.');
    if (response.status === 500) throw new Error(errData.error || 'Server error. Check backend logs.');
    throw new Error(errData.error || `Server error ${response.status}.`);
  }

  const data = await response.json();
  if (!data.reply) throw new Error('Empty response from server.');
  return data.reply;
}


function appendMessage(role, content, animate) {
  const bot    = BOTS[App.currentBot];
  const user   = Store.getUser();
  const isBot  = role === 'assistant' || role === 'bot';
  const mc     = q('#messages-container');

  const wrap = document.createElement('div');
  wrap.className = `message ${isBot ? 'bot' : 'user'}`;
  if (!animate) wrap.style.animation = 'none';

  const avatar = document.createElement('div');
  avatar.className = `msg-avatar ${isBot ? 'bot-avatar-msg' : 'user-avatar-msg'}`;
  if (isBot) { avatar.textContent = bot.icon; avatar.style.background = `var(${bot.bgColor})`; }
  else { avatar.textContent = user ? user.name.charAt(0).toUpperCase() : 'U'; }

  const cont = document.createElement('div');
  cont.className = 'msg-content';

  const name = document.createElement('div');
  name.className = 'msg-name';
  name.textContent = isBot ? bot.name : (user ? user.name.split(' ')[0] : 'You');

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatMsg(content);

  cont.append(name, bubble);
  wrap.append(avatar, cont);
  mc.appendChild(wrap);
  if (animate) scrollBottom();
}

function formatMsg(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`(.*?)`/g,'<code>$1</code>')
    .replace(/^### (.*$)/gm,'<h4 style="font-family:var(--font-display);font-size:1rem;color:var(--text-ivory);margin:12px 0 6px;">$1</h4>')
    .replace(/^## (.*$)/gm,'<h3 style="font-family:var(--font-display);font-size:1.1rem;color:var(--text-ivory);margin:14px 0 8px;">$1</h3>')
    .replace(/^[•\-] (.*$)/gm,'<li>$1</li>')
    .replace(/^\d+\. (.*$)/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, m => `<ul>${m}</ul>`)
    .split('\n\n').map(p => {
      p = p.trim(); if(!p) return '';
      if(p.startsWith('<h')||p.startsWith('<ul>')) return p;
      return `<p>${p.replace(/\n/g,'<br>')}</p>`;
    }).filter(Boolean).join('');
}

function showTyping() {
  const bot = BOTS[App.currentBot];
  const el  = document.createElement('div');
  el.className = 'typing-indicator';
  const av = document.createElement('div');
  av.className = 'msg-avatar bot-avatar-msg';
  av.textContent = bot.icon;
  av.style.background = `var(${bot.bgColor})`;
  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  el.append(av, dots);
  q('#messages-container').appendChild(el);
  scrollBottom();
  return el;
}
function removeTyping(el) { if (el?.parentNode) el.parentNode.removeChild(el); }

function updateSidebarCount(botId) {
  const c = q(`#nav-count-${botId}`);
  if (c) {
    const msgs = Store.getHistory(botId).filter(m=>m.role==='user').length;
    c.textContent = msgs > 0 ? msgs : '';
  }
}

// ---- PROFILE ----
function renderProfile() {
  const user = Store.getUser();
  if (!user) return;

  const first = user.name.charAt(0).toUpperCase();
  q('#profile-avatar-big').textContent = first;
  q('#profile-hero-name').textContent  = user.name;
  q('#profile-hero-email').textContent = user.email;
  q('#profile-since').textContent      = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN',{year:'numeric',month:'long'}) : 'Recently';
  q('#profile-nav-avatar').textContent = first;
  q('#profile-nav-name').textContent   = user.name.split(' ')[0];

  q('#profile-name-input').value  = user.name;
  q('#profile-email-input').value = user.email;
  q('#profile-password-input').value = '';

  const prefs = Store.getPrefs();
  q('#pref-default-bot').value = prefs.defaultBot || 'fitness';
  q('#pref-starter-prompts').checked = prefs.showStarters !== false;

  // Stats breakdown
  const sb = q('#stats-breakdown');
  let totalMsgs = 0;
  const rows = Object.keys(BOTS).map(b => {
    const msgs = Store.getHistory(b).filter(m=>m.role==='user').length;
    totalMsgs += msgs;
    return `<div class="stats-breakdown-item">
      <span class="stats-breakdown-label">
        <span style="font-size:1.1rem">${BOTS[b].icon}</span> ${BOTS[b].name}
      </span>
      <span class="stats-breakdown-val">${msgs}</span>
    </div>`;
  });
  rows.push(`<div class="stats-breakdown-item" style="border-top:1px solid var(--border-subtle);margin-top:4px;padding-top:14px">
    <span class="stats-breakdown-label"><strong>Total Messages</strong></span>
    <span class="stats-breakdown-val" style="color:var(--gold-bright)">${totalMsgs}</span>
  </div>`);
  sb.innerHTML = rows.join('');
}

function saveAccount() {
  const name  = q('#profile-name-input').value.trim();
  const email = q('#profile-email-input').value.trim();
  const pass  = q('#profile-password-input').value.trim();

  if (!name || !email) { showToast('Name and email are required.','error'); return; }
  if (pass && pass.length < 6) { showToast('New password must be at least 6 characters.','error'); return; }

  const user = Store.getUser();
  user.name  = name;
  user.email = email;
  Store.setUser(user);
  q('#profile-password-input').value = '';
  showToast('Account settings saved!','success');
  renderProfile();
}

function savePrefs() {
  const prefs = {
    defaultBot:    q('#pref-default-bot').value,
    showStarters:  q('#pref-starter-prompts').checked
  };
  Store.setPrefs(prefs);
  App.currentBot = prefs.defaultBot;
  showToast('Preferences saved!','success');
}

// ---- CONFIRM MODAL ----
function confirmAction(title, desc, callback, isDanger=false) {
  App.confirmCallback = callback;
  q('#confirm-title').textContent = title;
  q('#confirm-desc').textContent  = desc;
  q('#confirm-icon').textContent  = isDanger ? '🗑️' : '⚠️';
  q('#confirm-ok-btn').className  = isDanger ? 'btn-danger' : 'btn-danger-outline';
  q('#confirm-ok-btn').textContent = isDanger ? 'Delete' : 'Confirm';
  q('#confirm-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeConfirm() {
  q('#confirm-modal').classList.add('hidden');
  if (App.currentPage !== 'chat') document.body.style.overflow = '';
  App.confirmCallback = null;
}
q('#confirm-modal').onclick = e => { if (e.target === q('#confirm-modal')) closeConfirm(); };

// ---- MOBILE SIDEBAR ----
function openMobileSidebar() {
  q('#sidebar').classList.add('open');
  let ov = document.querySelector('.sidebar-overlay');
  if (!ov) { ov = document.createElement('div'); ov.className='sidebar-overlay'; document.body.appendChild(ov); ov.onclick=closeMobileSidebar; }
  ov.classList.add('active');
}
function closeMobileSidebar() {
  q('#sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('active');
}

// ---- UTILS ----
function q(sel)  { return document.querySelector(sel); }
function qa(sel) { return document.querySelectorAll(sel); }

function scrollBottom() {
  requestAnimationFrame(() => {
    const mc = q('#messages-container');
    if (mc) mc.scrollTop = mc.scrollHeight;
  });
}

function autoResize() {
  const ta = q('#chat-input');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min  = Math.floor(diff/60000);
  const hr   = Math.floor(diff/3600000);
  const day  = Math.floor(diff/86400000);
  if (min < 1)  return 'Just now';
  if (min < 60) return `${min}m ago`;
  if (hr  < 24) return `${hr}h ago`;
  if (day < 7)  return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

function showToast(msg, type='info') {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition='opacity .3s ease,transform .3s ease'; t.style.opacity='0'; t.style.transform='translateY(8px)'; setTimeout(()=>t.remove(),300); }, 3500);
}
