// ═══════════════════════════════════════════════════════
//  script.js — HealthAI Platform
//  Features: Dark Mode, Charts, PDF Export, Medications,
//            Vitals, Symptom Checker, Doctors, Chat, BMI
// ═══════════════════════════════════════════════════════

// ── BACKEND API CONFIG ────────────────────────────────
const API_URL = 'https://healthai-backend-production-b5ec.up.railway.app/api';

// Get stored JWT token
function getToken() {
  return localStorage.getItem('healthai_token');
}

// Universal API call helper
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(API_URL + endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
  } catch (err) {
    console.warn('API call failed:', err.message);
    throw err;
  }
}

// ── 1. USER DATA ──────────────────────────────────────
const USER = {
  fname: 'John', lname: 'Doe',
  email: 'demo@healthai.com',
  age: 28, sex: 'Male', blood: 'O+',
  height: 175, weight: 72
};

// ── 2. VITALS HISTORY ─────────────────────────────────
const HISTORY = [
  { date:'2025-03-12 08:30', type:'Blood Pressure', reading:'118/76', status:'Normal',   notes:'Morning' },
  { date:'2025-03-12 09:00', type:'Blood Sugar',    reading:'95 mg/dL', status:'Normal', notes:'Fasting' },
  { date:'2025-03-11 20:00', type:'Blood Pressure', reading:'128/84', status:'Elevated', notes:'Evening' },
  { date:'2025-03-11 13:00', type:'Blood Sugar',    reading:'138 mg/dL',status:'High',   notes:'Post-meal' },
  { date:'2025-03-10 08:00', type:'Heart Rate',     reading:'72 bpm',  status:'Normal',  notes:'Resting' },
  { date:'2025-03-10 08:00', type:'SpO2',           reading:'98%',     status:'Normal',  notes:'' },
  { date:'2025-03-09 07:45', type:'Weight',         reading:'72 kg',   status:'Normal',  notes:'Morning' },
  { date:'2025-03-09 08:00', type:'Temperature',    reading:'36.8°C',  status:'Normal',  notes:'' },
];

// ── 3. MEDICATIONS ────────────────────────────────────
let MEDICATIONS = [
  { id:1, name:'Metformin',   dose:'500mg', freq:'Twice daily', time:'8:00 AM, 8:00 PM', notes:'Take with food', start:'2025-01-01', active:true },
  { id:2, name:'Amlodipine',  dose:'5mg',   freq:'Once daily',  time:'9:00 AM',           notes:'BP medication',  start:'2025-01-15', active:true },
  { id:3, name:'Vitamin D3',  dose:'1000IU',freq:'Once daily',  time:'8:00 AM',           notes:'With breakfast', start:'2025-02-01', active:true },
];

// Dose tracking: {medId_date: 'taken'|'missed'}
const DOSE_LOG = {};
let pendingDoseId = null;

// ── 4. DOCTORS ────────────────────────────────────────
const DOCTORS = [
  { name:'Dr. Priya Sharma',  spec:'Cardiologist',      exp:'12 yrs', rating:'4.9', reviews:248, avail:'Available Today', fee:'₹800',  emoji:'👩‍⚕️' },
  { name:'Dr. Arjun Mehta',   spec:'General Physician', exp:'8 yrs',  rating:'4.8', reviews:412, avail:'Available Today', fee:'₹500',  emoji:'👨‍⚕️' },
  { name:'Dr. Kavita Rao',    spec:'Endocrinologist',   exp:'15 yrs', rating:'4.9', reviews:187, avail:'This Week',       fee:'₹1000', emoji:'👩‍⚕️' },
  { name:'Dr. Rohan Patel',   spec:'Neurologist',       exp:'10 yrs', rating:'4.7', reviews:134, avail:'This Week',       fee:'₹900',  emoji:'👨‍⚕️' },
  { name:'Dr. Ananya Singh',  spec:'Dermatologist',     exp:'6 yrs',  rating:'4.8', reviews:320, avail:'Available Today', fee:'₹600',  emoji:'👩‍⚕️' },
  { name:'Dr. Vikram Nair',   spec:'Pulmonologist',     exp:'11 yrs', rating:'4.6', reviews:98,  avail:'This Week',       fee:'₹850',  emoji:'👨‍⚕️' },
];

// ── 5. APPOINTMENTS ───────────────────────────────────
let APPOINTMENTS = [
  { doc:'Dr. Priya Sharma', spec:'Cardiologist',   day:'18', month:'MAR', time:'10:30 AM', reason:'Heart checkup', status:'confirmed' },
  { doc:'Dr. Arjun Mehta',  spec:'General Physician',day:'22',month:'MAR',time:'02:00 PM', reason:'Routine checkup',status:'confirmed' },
  { doc:'Dr. Kavita Rao',   spec:'Endocrinologist', day:'05', month:'APR', time:'11:00 AM', reason:'Diabetes review',status:'pending' },
];

// ── 6. CHART INSTANCES (store for destroy/rebuild) ────
const charts = {};
let currentRange = 7;

// ── 7. CHAT ───────────────────────────────────────────
let chatHistory = [];
let checkerSymptoms = [];
let currentLogType = '';
let isDark = false;

const CHAT_SYSTEM = `You are Dr. HealthAI, a warm and professional AI health assistant. Provide helpful health information concisely. Use <b>bold</b> for key terms. Use <ul><li> for lists. Keep answers under 120 words unless detail is needed. Always remind users to consult a real doctor for serious concerns.`;

const SYMPTOMS_LIST = [
  'Headache','Fever','Fatigue','Sore throat','Runny nose','Cough',
  'Shortness of breath','Chest pain','Nausea','Vomiting','Diarrhoea',
  'Abdominal pain','Back pain','Joint pain','Muscle aches','Rash',
  'Dizziness','Loss of appetite','Chills','Night sweats','Swollen lymph nodes',
  'Eye redness','Blurred vision','Ear pain','Heart palpitations',
  'Frequent urination','Burning urination','Constipation','Bloating',
  'Anxiety','Insomnia','Weight loss','Numbness','Confusion','High BP',
];

// ════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════
function showAuthPage(id) {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function doLogin() {
  const email    = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;

  // If no inputs found (demo mode), just log in directly
  if (!email || !password) {
    _enterApp();
    return;
  }

  const btn = document.querySelector('#page-login .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

  try {
    const data = await apiCall('/auth/login', 'POST', { email, password });
    localStorage.setItem('healthai_token', data.token);

    // Fill USER from backend response
    if (data.user) {
      USER.fname  = data.user.firstName || data.user.fname  || USER.fname;
      USER.lname  = data.user.lastName  || data.user.lname  || USER.lname;
      USER.email  = data.user.email     || USER.email;
      USER.age    = data.user.age       || USER.age;
      USER.sex    = data.user.sex       || USER.sex;
      USER.blood  = data.user.bloodGroup || data.user.blood_group || USER.blood;
      USER.height = data.user.heightCm  || data.user.height_cm   || USER.height;
      USER.weight = data.user.weightKg  || data.user.weight_kg   || USER.weight;
    }
    _enterApp();
  } catch (err) {
    showToast('❌', err.message || 'Login failed. Check email/password.');
    if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
  }
}

function _enterApp() {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  document.getElementById('app').classList.remove('hidden');
  initApp();
  navigate('dashboard');
}

async function doRegister() {
  const fn    = document.getElementById('reg-fname').value.trim();
  const ln    = document.getElementById('reg-lname').value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const pass  = document.getElementById('reg-password')?.value;

  if (!fn || !ln) { showToast('⚠️', 'Please fill in First and Last name'); return; }

  const btn = document.querySelector('#page-register .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }

  // Update local USER object
  USER.fname  = fn; USER.lname = ln;
  if (document.getElementById('reg-age').value)    USER.age    = parseInt(document.getElementById('reg-age').value);
  if (document.getElementById('reg-sex').value)    USER.sex    = document.getElementById('reg-sex').value;
  if (document.getElementById('reg-blood').value)  USER.blood  = document.getElementById('reg-blood').value;
  if (document.getElementById('reg-height').value) USER.height = parseInt(document.getElementById('reg-height').value);
  if (email) USER.email = email;

  try {
    const payload = {
      firstName:  fn,
      lastName:   ln,
      email:      email || `${fn.toLowerCase()}.${ln.toLowerCase()}@healthai.com`,
      password:   pass  || 'demo1234',
      age:        USER.age,
      sex:        USER.sex,
      bloodGroup: USER.blood,
      heightCm:   USER.height,
      weightKg:   USER.weight,
    };
    const data = await apiCall('/auth/register', 'POST', payload);
    localStorage.setItem('healthai_token', data.token);
    showToast('🎉', 'Account created! Welcome to HealthAI');
  } catch (err) {
    // If backend fails, still let them use the app (offline mode)
    console.warn('Register API error:', err.message);
    showToast('🎉', 'Welcome to HealthAI! (offline mode)');
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  document.getElementById('app').classList.remove('hidden');
  initApp();
  navigate('dashboard');
}

function doLogout() {
  localStorage.removeItem('healthai_token');
  document.getElementById('app').classList.add('hidden');
  showAuthPage('page-login');
}

// ════════════════════════════════════════════
// APP INIT
// ════════════════════════════════════════════
function initApp() {
  document.getElementById('nav-avatar').textContent = USER.fname[0];
  document.getElementById('nav-uname').textContent  = `${USER.fname} ${USER.lname[0]}.`;
  document.getElementById('book-date').valueAsDate  = new Date();
  document.getElementById('med-start').valueAsDate  = new Date();

  buildDashboard();
  buildVitals();
  buildTrends(7);
  buildMedications();
  buildChecker();
  renderDoctors();
  buildAppointments();
  buildProfile();
  buildLog();
  generateSlots();
  initChat();
}

// ════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════
function navigate(sec) {
  document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('section-' + sec);
  if (el) el.classList.add('active');
  const ni = document.getElementById('nav-' + sec);
  if (ni) ni.classList.add('active');
  window.scrollTo(0, 0);
}

// ════════════════════════════════════════════
// DARK MODE
// ════════════════════════════════════════════
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-btn').textContent = isDark ? '☀️' : '🌙';
  // Rebuild charts with new theme
  setTimeout(() => { buildTrends(currentRange); buildDashboardCharts(); }, 100);
  showToast(isDark ? '🌙' : '☀️', isDark ? 'Dark mode on' : 'Light mode on');
}

// ════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════
function buildDashboard() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const emoji  = h < 12 ? '☀️' : h < 17 ? '🌤️' : '🌙';
  document.getElementById('dash-greeting').textContent = `${greet}, ${USER.fname}! ${emoji}`;

  document.getElementById('dash-stats').innerHTML = [
    { icon:'❤️', bg:'#ffe4e4', val:'118/76',    lbl:'Blood Pressure', trend:'↓ Normal',        tc:'trend-ok' },
    { icon:'🩸', bg:'#fef3c7', val:'95 mg/dL',  lbl:'Blood Sugar',    trend:'✓ Fasting normal', tc:'trend-good' },
    { icon:'💓', bg:'#fee2e2', val:'72 bpm',     lbl:'Heart Rate',     trend:'→ Resting normal', tc:'trend-ok' },
    { icon:'⚖️', bg:'#ede9fe', val:'72 kg',      lbl:'Weight',         trend:'→ Stable',         tc:'trend-ok' },
  ].map(s => `
    <div class="stat-card" onclick="navigate('vitals')">
      <div class="stat-icon" style="background:${s.bg}">${s.icon}</div>
      <div>
        <div class="stat-val">${s.val}</div>
        <div class="stat-lbl">${s.lbl}</div>
        <div class="stat-trend ${s.tc}">${s.trend}</div>
      </div>
    </div>`).join('');

  document.getElementById('quick-actions').innerHTML = [
    { icon:'💊', label:'Log BP',         action:"openLogModal('bp')" },
    { icon:'🩸', label:'Log Sugar',      action:"openLogModal('sugar')" },
    { icon:'🔍', label:'Check Symptoms', action:"navigate('checker')" },
    { icon:'📅', label:'Book Appt',      action:"openModal('book-modal')" },
  ].map(q => `
    <div class="qa-btn" onclick="${q.action}">
      <div class="qa-icon">${q.icon}</div>
      <div class="qa-label">${q.label}</div>
    </div>`).join('');

  document.getElementById('activity-feed').innerHTML = [
    { icon:'💊', bg:'#ffe4e4', title:'BP logged: 118/76 mmHg',               time:'Today 8:30 AM' },
    { icon:'🩸', bg:'#fef3c7', title:'Blood sugar: 95 mg/dL (fasting)',       time:'Today 9:00 AM' },
    { icon:'📅', bg:'#eaf1ff', title:'Appointment confirmed — Dr. Priya Sharma', time:'Yesterday' },
    { icon:'💊', bg:'#dcfce7', title:'Metformin taken — 8:00 PM',             time:'Yesterday' },
    { icon:'🔍', bg:'#ede9fe', title:'Symptom check completed',                time:'2 days ago' },
  ].map(a => `
    <div class="activity-item">
      <div class="act-dot" style="background:${a.bg}">${a.icon}</div>
      <div>
        <div class="act-title">${a.title}</div>
        <div class="act-time">${a.time}</div>
      </div>
    </div>`).join('');

  buildDashboardCharts();
}

function buildDashboardCharts() {
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#8b949e' : '#94a3b8';

  destroyChart('dash-bp-chart');
  destroyChart('dash-sugar-chart');

  charts['dash-bp-chart'] = new Chart(document.getElementById('dash-bp-chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Systolic', data: [120, 118, 125, 122, 118, 116, 118],
        borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.1)',
        borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3,
      }]
    },
    options: miniChartOptions(gridColor, textColor)
  });

  charts['dash-sugar-chart'] = new Chart(document.getElementById('dash-sugar-chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Blood Sugar', data: [95, 142, 98, 110, 95, 105, 95],
        borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.1)',
        borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3,
      }]
    },
    options: miniChartOptions(gridColor, textColor)
  });
}

function miniChartOptions(gridColor, textColor) {
  return {
    responsive: true, maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10, weight: '700' } } },
      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } }
    }
  };
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ════════════════════════════════════════════
// VITALS
// ════════════════════════════════════════════
function buildVitals() {
  document.getElementById('vital-panels').innerHTML = `
    <div class="vital-panel">
      <div class="vital-header">
        <div class="vital-title-grp">
          <div class="vital-icon" style="background:#ffe4e4">❤️</div>
          <div><div class="vital-name">Blood Pressure</div><div class="vital-sub">mmHg</div></div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openLogModal('bp')">+ Log</button>
      </div>
      <div class="vital-body">
        <div class="vital-reading">
          <span class="vital-num" id="bp-sys">118</span>
          <span class="vital-slash">/</span>
          <span class="vital-num" id="bp-dia">76</span>
          <span class="vital-unit">mmHg</span>
        </div>
        <span class="badge badge-green" id="bp-badge">✓ Normal</span>
        <div class="gauge-wrap">
          <div class="gauge-track"><div class="gauge-needle" id="bp-needle" style="left:35%"></div></div>
          <div class="gauge-labels"><span>Low</span><span>Normal</span><span>Elevated</span><span>High</span></div>
        </div>
        <div style="font-size:11px;color:var(--dim);font-weight:600;margin-top:6px">Normal: 90/60 – 120/80 mmHg</div>
      </div>
    </div>

    <div class="vital-panel">
      <div class="vital-header">
        <div class="vital-title-grp">
          <div class="vital-icon" style="background:#fef3c7">🩸</div>
          <div><div class="vital-name">Blood Sugar</div><div class="vital-sub">mg/dL</div></div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openLogModal('sugar')">+ Log</button>
      </div>
      <div class="vital-body">
        <div class="vital-reading">
          <span class="vital-num" id="sugar-val">95</span>
          <span class="vital-unit">mg/dL</span>
        </div>
        <span class="badge badge-green" id="sugar-badge">✓ Normal (Fasting)</span>
        <div class="gauge-wrap">
          <div class="gauge-track"><div class="gauge-needle" id="sugar-needle" style="left:28%"></div></div>
          <div class="gauge-labels"><span>&lt;70 Low</span><span>Normal</span><span>Pre-diab</span><span>&gt;200</span></div>
        </div>
        <div style="font-size:11px;color:var(--dim);font-weight:600;margin-top:6px">Fasting: 70–99 | Post-meal: &lt;140 mg/dL</div>
      </div>
    </div>`;

  document.getElementById('more-vitals').innerHTML = [
    { icon:'💓', bg:'#fee2e2', name:'Heart Rate',  val:'72 bpm', sub:'Resting normal', badge:'badge-green', b:'✓ Normal',    type:'heart' },
    { icon:'🌡️', bg:'#ffedd5', name:'Temperature', val:'36.8°C', sub:'Normal body',    badge:'badge-green', b:'✓ Normal',    type:'temp'  },
    { icon:'💨', bg:'#e0f8f8', name:'SpO2',         val:'98%',    sub:'O₂ saturation', badge:'badge-green', b:'✓ Excellent', type:'spo2'  },
  ].map(v => `
    <div class="vital-panel">
      <div class="vital-header">
        <div class="vital-title-grp">
          <div class="vital-icon" style="background:${v.bg}">${v.icon}</div>
          <div><div class="vital-name">${v.name}</div><div class="vital-sub">${v.sub}</div></div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="openLogModal('${v.type}')">+ Log</button>
      </div>
      <div class="vital-body">
        <div class="vital-reading"><span class="vital-num" style="font-size:30px">${v.val}</span></div>
        <span class="badge ${v.badge}">${v.b}</span>
      </div>
    </div>`).join('');

  renderHistory();
}

function renderHistory() {
  const statusMap = { Normal:'badge-green', High:'badge-red', Elevated:'badge-yellow', Low:'badge-red' };
  document.getElementById('history-body').innerHTML = HISTORY.map(r => `
    <tr>
      <td>${r.date}</td><td>${r.type}</td>
      <td><b>${r.reading}</b></td>
      <td><span class="badge ${statusMap[r.status]||'badge-blue'}">${r.status}</span></td>
      <td style="color:var(--dim)">${r.notes||'—'}</td>
    </tr>`).join('');
}

// ── LOG MODAL ──
function openLogModal(type) {
  currentLogType = type;
  const configs = {
    bp: {
      title:'💊 Log Blood Pressure', desc:'Enter your BP reading',
      fields:`
        <div class="form-row-2">
          <div class="field"><label>Systolic (upper)</label><input type="number" id="log-sys" placeholder="120" min="60" max="250"/></div>
          <div class="field"><label>Diastolic (lower)</label><input type="number" id="log-dia" placeholder="80" min="40" max="150"/></div>
        </div>
        <div class="field"><label>Context</label>
          <select id="log-ctx"><option>Morning (fasting)</option><option>After exercise</option><option>Evening</option><option>After meal</option></select>
        </div>`
    },
    sugar: {
      title:'🩸 Log Blood Sugar', desc:'Enter your glucose reading',
      fields:`
        <div class="field"><label>Blood Glucose (mg/dL)</label><input type="number" id="log-glucose" placeholder="95" min="30" max="600"/></div>
        <div class="field"><label>Test Type</label>
          <select id="log-sg-type"><option>Fasting</option><option>Post-meal (2hr)</option><option>Random</option><option>Bedtime</option></select>
        </div>`
    },
    heart: {
      title:'💓 Log Heart Rate', desc:'Enter your pulse',
      fields:`<div class="field"><label>Heart Rate (bpm)</label><input type="number" id="log-hr" placeholder="72" min="30" max="250"/></div>`
    },
    temp: {
      title:'🌡️ Log Temperature', desc:'Enter body temperature',
      fields:`<div class="field"><label>Temperature (°C)</label><input type="number" id="log-temp" placeholder="36.6" min="30" max="45" step=".1"/></div>`
    },
    spo2: {
      title:'💨 Log SpO2', desc:'Oxygen saturation',
      fields:`<div class="field"><label>SpO2 (%)</label><input type="number" id="log-spo2" placeholder="98" min="70" max="100"/></div>`
    },
  };
  const c = configs[type] || configs.bp;
  document.getElementById('log-modal-title').textContent = c.title;
  document.getElementById('log-modal-desc').textContent  = c.desc;
  document.getElementById('log-modal-fields').innerHTML  = c.fields;
  document.getElementById('log-notes').value = '';
  openModal('log-modal');
}

async function saveVitalLog() {
  let reading = '', type = '', apiPayload = null;
  const notes = document.getElementById('log-notes').value;
  const now   = new Date();
  const dateStr = now.toISOString().slice(0,16).replace('T',' ');

  if (currentLogType === 'bp') {
    const s = document.getElementById('log-sys')?.value;
    const d = document.getElementById('log-dia')?.value;
    if (!s || !d) { showToast('⚠️','Enter both values'); return; }
    reading = `${s}/${d} mmHg`; type = 'Blood Pressure';
    document.getElementById('bp-sys').textContent = s;
    document.getElementById('bp-dia').textContent = d;
    const pct = Math.min(95, Math.max(5, (parseInt(s) - 80) / 80 * 100));
    document.getElementById('bp-needle').style.left = pct + '%';
    const bpStatus = parseInt(s) < 90 ? 'Low' : parseInt(s) <= 120 ? 'Normal' : parseInt(s) <= 130 ? 'Elevated' : 'High';
    document.getElementById('bp-badge').textContent = bpStatus === 'Normal' ? '✓ Normal' : '⚠️ ' + bpStatus;
    document.getElementById('bp-badge').className = `badge ${bpStatus === 'Normal' ? 'badge-green' : bpStatus === 'Low' ? 'badge-blue' : 'badge-red'}`;
    HISTORY.unshift({ date: dateStr, type, reading, status: bpStatus, notes });
    pushLog('vitals','❤️','#fee2e2','Blood Pressure logged', reading + (notes?' — '+notes:''), reading, bpStatus==='Normal'?'badge-green':'badge-yellow', bpStatus);
    apiPayload = { type:'bp', systolic:parseInt(s), diastolic:parseInt(d), unit:'mmHg', status:bpStatus, notes, context:'manual' };
  } else if (currentLogType === 'sugar') {
    const g = document.getElementById('log-glucose')?.value;
    if (!g) { showToast('⚠️','Enter a value'); return; }
    reading = `${g} mg/dL`; type = 'Blood Sugar';
    document.getElementById('sugar-val').textContent = g;
    const pct = Math.min(95, Math.max(5, (parseInt(g) - 70) / 130 * 100));
    document.getElementById('sugar-needle').style.left = pct + '%';
    const sgStatus = parseInt(g) < 70 ? 'Low' : parseInt(g) <= 99 ? 'Normal' : parseInt(g) <= 125 ? 'Elevated' : 'High';
    document.getElementById('sugar-badge').textContent = sgStatus === 'Normal' ? '✓ Normal (Fasting)' : '⚠️ ' + sgStatus;
    HISTORY.unshift({ date: dateStr, type, reading, status: sgStatus, notes });
    pushLog('vitals','🩸','#fef3c7','Blood Sugar logged', reading + (notes?' — '+notes:''), reading, sgStatus==='Normal'?'badge-green':'badge-red', sgStatus);
    apiPayload = { type:'sugar', value:parseFloat(g), unit:'mg/dL', status:sgStatus, notes, context: document.getElementById('log-sg-type')?.value || 'fasting' };
  } else if (currentLogType === 'heart') {
    const hr = document.getElementById('log-hr')?.value;
    if (!hr) { showToast('⚠️','Enter a value'); return; }
    reading = `${hr} bpm`; type = 'Heart Rate';
    HISTORY.unshift({ date: dateStr, type, reading, status: 'Normal', notes });
    apiPayload = { type:'heart_rate', value:parseFloat(hr), unit:'bpm', status:'Normal', notes };
  } else if (currentLogType === 'temp') {
    const t = document.getElementById('log-temp')?.value;
    if (!t) { showToast('⚠️','Enter a value'); return; }
    reading = `${t}°C`; type = 'Temperature';
    const status = parseFloat(t) < 36 ? 'Low' : parseFloat(t) <= 37.5 ? 'Normal' : 'High';
    HISTORY.unshift({ date: dateStr, type, reading, status, notes });
    apiPayload = { type:'temp', value:parseFloat(t), unit:'°C', status, notes };
  } else if (currentLogType === 'spo2') {
    const o = document.getElementById('log-spo2')?.value;
    if (!o) { showToast('⚠️','Enter a value'); return; }
    reading = `${o}%`; type = 'SpO2';
    HISTORY.unshift({ date: dateStr, type, reading, status: 'Normal', notes });
    apiPayload = { type:'spo2', value:parseFloat(o), unit:'%', status:'Normal', notes };
  }

  // Save to backend (silently — don't block the UI if it fails)
  if (apiPayload && getToken()) {
    apiCall('/vitals', 'POST', apiPayload).catch(err => console.warn('Vitals save failed:', err.message));
  }

  renderHistory();
  closeModal('log-modal');
  showToast('✅', `${type} logged: ${reading}`);
  buildTrends(currentRange);
}

// ── CSV EXPORT ──
function exportCSV() {
  const rows = ['Date,Type,Reading,Status,Notes',
    ...HISTORY.map(r => `"${r.date}","${r.type}","${r.reading}","${r.status}","${r.notes}"`)
  ];
  const blob = new Blob([rows.join('\n')], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `health_report_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast('⬇️', 'CSV export started!');
}

// ════════════════════════════════════════════
// TRENDS & CHARTS
// ════════════════════════════════════════════
function setRange(days, btn) {
  currentRange = days;
  document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  buildTrends(days);
}

function generateLabels(days) {
  const labels = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en', { month:'short', day:'numeric' }));
  }
  return labels;
}

function randAround(base, spread, n) {
  return Array.from({ length: n }, () => +(base + (Math.random() - 0.5) * spread * 2).toFixed(1));
}

function buildTrends(days) {
  const labels     = generateLabels(days);
  const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const textColor  = isDark ? '#8b949e' : '#94a3b8';

  const baseOpts = {
    responsive: true, maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid:{ color: gridColor }, ticks:{ color: textColor, font:{ size:10, weight:'600' }, maxTicksLimit: 7 } },
      y: { grid:{ color: gridColor }, ticks:{ color: textColor, font:{ size:10 } } }
    }
  };

  // BP Chart
  destroyChart('bp-trend-chart');
  charts['bp-trend-chart'] = new Chart(document.getElementById('bp-trend-chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Systolic', data: randAround(122, 8, days),
          borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.08)',
          borderWidth: 2.5, tension: 0.4, fill: false, pointRadius: 3, pointHoverRadius: 6,
        },
        {
          label: 'Diastolic', data: randAround(80, 6, days),
          borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.08)',
          borderWidth: 2.5, tension: 0.4, fill: false, pointRadius: 3, pointHoverRadius: 6,
        },
        {
          label: 'Normal (120)', data: Array(days).fill(120),
          borderColor: 'rgba(22,163,74,.4)', borderDash: [6,4],
          borderWidth: 1.5, pointRadius: 0, fill: false,
        }
      ]
    },
    options: { ...baseOpts }
  });

  // Sugar Chart
  destroyChart('sugar-trend-chart');
  charts['sugar-trend-chart'] = new Chart(document.getElementById('sugar-trend-chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Fasting', data: randAround(96, 10, days),
          borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.1)',
          borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 3,
        },
        {
          label: 'Post-meal', data: randAround(135, 20, days),
          borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,.05)',
          borderWidth: 2, tension: 0.4, fill: false, pointRadius: 3, borderDash: [4,3],
        },
        {
          label: 'Threshold (100)', data: Array(days).fill(100),
          borderColor: 'rgba(220,38,38,.35)', borderDash: [6,4],
          borderWidth: 1.5, pointRadius: 0, fill: false,
        }
      ]
    },
    options: { ...baseOpts }
  });

  // Heart Rate
  destroyChart('hr-trend-chart');
  charts['hr-trend-chart'] = new Chart(document.getElementById('hr-trend-chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Heart Rate', data: randAround(72, 8, days),
        borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,.1)',
        borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 3,
      }]
    },
    options: { ...baseOpts }
  });

  // Weight
  destroyChart('weight-trend-chart');
  const baseWeight = USER.weight || 72;
  const weightData = Array.from({ length: days }, (_, i) =>
    +(baseWeight + (Math.random() - 0.55) * 0.3 - i * 0.01).toFixed(1)
  ).reverse();
  charts['weight-trend-chart'] = new Chart(document.getElementById('weight-trend-chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Weight', data: weightData,
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.1)',
        borderWidth: 2.5, tension: 0.3, fill: true, pointRadius: 3,
      }]
    },
    options: { ...baseOpts }
  });

  // Stats summary
  document.getElementById('trend-stats').innerHTML = [
    { label:'Avg Systolic BP', val:'121 mmHg',  sub:'Normal range',  color:'var(--red)' },
    { label:'Avg Fasting Sugar', val:'96 mg/dL', sub:'Normal',       color:'var(--yellow)' },
    { label:'Avg Heart Rate', val:'72 bpm',       sub:'Resting normal',color:'var(--primary)' },
    { label:'Weight Change', val:'-0.3 kg',        sub:`Over ${days} days`,color:'var(--green)' },
  ].map(s => `
    <div class="stat-sum-item">
      <div class="stat-sum-label">${s.label}</div>
      <div class="stat-sum-val" style="color:${s.color}">${s.val}</div>
      <div class="stat-sum-sub">${s.sub}</div>
    </div>`).join('');
}

// ════════════════════════════════════════════
// MEDICATIONS
// ════════════════════════════════════════════
function buildMedications() {
  renderMedList();
  renderTodaySchedule();
  renderAdherence();
}

function addMedication() {
  const name = document.getElementById('med-name').value.trim();
  const dose = document.getElementById('med-dose').value.trim();
  if (!name || !dose) { showToast('⚠️','Enter medication name and dosage'); return; }

  const med = {
    id:    Date.now(),
    name,
    dose,
    freq:  document.getElementById('med-freq').value,
    time:  document.getElementById('med-time').value || '8:00 AM',
    notes: document.getElementById('med-notes').value,
    start: document.getElementById('med-start').value,
    end:   document.getElementById('med-end').value,
    active: true,
  };
  MEDICATIONS.push(med);

  // Clear form
  ['med-name','med-dose','med-time','med-notes','med-end'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  buildMedications();
  showToast('✅', `${name} added to your medications`);
}

function removeMed(id) {
  MEDICATIONS = MEDICATIONS.filter(m => m.id !== id);
  buildMedications();
  showToast('🗑️','Medication removed');
}

function renderMedList() {
  const el = document.getElementById('med-list');
  if (!MEDICATIONS.length) {
    el.innerHTML = '<div style="color:var(--dim);font-size:13px;font-weight:600;padding:20px 0">No medications added yet.</div>';
    return;
  }
  el.innerHTML = MEDICATIONS.map(m => `
    <div class="med-card">
      <div class="med-icon">💊</div>
      <div class="med-info">
        <div class="med-name">${m.name} <span style="font-size:12px;font-weight:600;color:var(--dim)">${m.dose}</span></div>
        <div class="med-detail">${m.freq} · ${m.notes || 'No special instructions'}</div>
        <div class="med-time-badge">🕐 ${m.time}</div>
      </div>
      <div class="med-actions">
        <button class="btn btn-ghost btn-sm" onclick="removeMed(${m.id})">🗑️</button>
      </div>
    </div>`).join('');
}

function renderTodaySchedule() {
  const today = new Date().toISOString().slice(0,10);
  const doses = [];

  MEDICATIONS.forEach(m => {
    const times = m.time.split(',').map(t => t.trim());
    times.forEach(t => {
      const key = `${m.id}_${today}_${t}`;
      const status = DOSE_LOG[key] || 'pending';
      doses.push({ med: m, time: t, key, status });
    });
  });

  doses.sort((a, b) => {
    const toMin = t => {
      const [time, period] = t.split(' ');
      let [h, min] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + (min || 0);
    };
    return toMin(a.time) - toMin(b.time);
  });

  const el = document.getElementById('med-today');
  if (!doses.length) {
    el.innerHTML = '<div style="color:var(--dim);font-size:13px;font-weight:600;padding:20px 0">No medications scheduled today.</div>';
    return;
  }

  el.innerHTML = doses.map(d => `
    <div class="dose-card ${d.status}">
      <div class="dose-time">${d.time}</div>
      <div class="dose-info">
        <div class="dose-name">${d.med.name} ${d.med.dose}</div>
        <div class="dose-sub">${d.med.notes || d.med.freq}</div>
      </div>
      <div>
        ${d.status === 'taken'
          ? '<span class="badge badge-green">✓ Taken</span>'
          : `<button class="btn btn-success btn-sm" onclick="openDoseModal('${d.key}','${d.med.name}','${d.time}')">Mark Taken</button>`
        }
      </div>
    </div>`).join('');
}

function openDoseModal(key, name, time) {
  pendingDoseId = key;
  document.getElementById('dose-title').textContent = `Mark Dose as Taken`;
  document.getElementById('dose-desc').textContent  = `${name} — ${time}`;
  openModal('dose-modal');
}

function confirmDose() {
  const savedId = pendingDoseId;
  if (savedId) {
    DOSE_LOG[savedId] = 'taken';
    pendingDoseId = null;
  }
  closeModal('dose-modal');
  renderTodaySchedule();
  renderAdherence();
  // Find the medication name for the log
  const doseKey   = savedId || '';
  const medId     = parseInt(doseKey.split('_')[0]);
  const med       = MEDICATIONS.find(m => m.id === medId);
  if (med) pushLog('meds','💊','#eaf1ff', med.name + ' ' + med.dose + ' taken', med.freq + ' · dose logged', '✓ Taken', 'badge-green', 'Taken');
  showToast('✅','Dose marked as taken!');
}

function renderAdherence() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const el = document.getElementById('adherence-grid');

  el.innerHTML = days.map((day, i) => {
    const dots = MEDICATIONS.slice(0,3).map((m, mi) => {
      const taken = (i < 5 && mi < 2) || (i === 4 && mi === 0);
      return `<div class="adh-dot ${taken ? 'taken' : i < 5 ? 'missed' : 'pending'}">${taken ? '✓' : ''}</div>`;
    }).join('');
    return `<div class="adh-day"><div class="adh-label">${day}</div><div class="adh-dots">${dots}</div></div>`;
  }).join('');
}

// ════════════════════════════════════════════
// SYMPTOM CHECKER
// ════════════════════════════════════════════
function buildChecker() {
  document.getElementById('sym-grid').innerHTML = SYMPTOMS_LIST.map(s =>
    `<div class="sym-chip" onclick="toggleSym(this,'${s}')">${s}</div>`
  ).join('');
}

function toggleSym(el, sym) {
  el.classList.toggle('active');
  if (el.classList.contains('active')) {
    if (!checkerSymptoms.includes(sym)) checkerSymptoms.push(sym);
  } else {
    checkerSymptoms = checkerSymptoms.filter(x => x !== sym);
  }
}

function checkerNext(from) {
  if (from === 1) {
    if (!document.getElementById('c-age').value || !document.getElementById('c-sex').value) {
      showToast('⚠️','Please fill in all fields'); return;
    }
  }
  if (from === 2 && checkerSymptoms.length === 0) {
    showToast('⚠️','Select at least one symptom'); return;
  }
  document.getElementById('csec-'+from).classList.remove('active');
  document.getElementById('csec-'+(from+1)).classList.add('active');
  document.getElementById('ctab-'+from).classList.remove('active');
  document.getElementById('ctab-'+from).classList.add('done');
  document.getElementById('ctab-'+(from+1)).classList.add('active');
}

function checkerPrev(from) {
  document.getElementById('csec-'+from).classList.remove('active');
  document.getElementById('csec-'+(from-1)).classList.add('active');
  document.getElementById('ctab-'+from).classList.remove('active');
  document.getElementById('ctab-'+(from-1)).classList.remove('done');
  document.getElementById('ctab-'+(from-1)).classList.add('active');
}

async function runCheckerAI() {
  if (!document.getElementById('c-duration').value) { showToast('⚠️','Please select duration'); return; }

  document.getElementById('csec-3').classList.remove('active');
  document.getElementById('csec-4').classList.add('active');
  document.getElementById('ctab-3').classList.remove('active');
  document.getElementById('ctab-3').classList.add('done');
  document.getElementById('ctab-4').classList.add('active');

  document.getElementById('checker-results').innerHTML = `
    <div class="card" style="text-align:center;padding:48px">
      <div class="spin-loader"></div>
      <div style="font-size:18px;font-weight:800;margin-bottom:8px;margin-top:20px">Analysing your symptoms…</div>
      <div style="color:var(--mid);font-size:14px">AI is matching symptoms to known conditions</div>
    </div>
    <style>.spin-loader{width:56px;height:56px;border:4px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto}.spin-loader{}</style>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

  // Offline AI — works 100% on GitHub Pages, no API needed
  setTimeout(() => {
    renderCheckerResults(analyseSymptoms());
  }, 2200);
}

// ── OFFLINE SYMPTOM ANALYSER ──────────────────────────
// Matches selected symptoms to conditions using a rule engine
function analyseSymptoms() {
  const s    = checkerSymptoms.map(x => x.toLowerCase());
  const sev  = parseInt(document.getElementById('c-severity').value) || 5;
  const fever = document.getElementById('c-fever').value;
  const hasFever = fever === 'Yes';

  // Each condition has weighted symptom matches
  const CONDITIONS = [
    {
      name: 'Viral Upper Respiratory Infection (Common Cold / Flu)',
      tagline: 'Very common viral illness affecting nose, throat and airways',
      tags: ['Viral','Common','Self-limiting'],
      symptoms: ['cough','sore throat','runny nose','fever','fatigue','headache','muscle aches','chills'],
      weight: 1.0,
    },
    {
      name: 'Tension Headache',
      tagline: 'Most common type of headache — stress and muscle tension related',
      tags: ['Neurological','Common','Self-care'],
      symptoms: ['headache','fatigue','muscle aches','anxiety','dizziness'],
      weight: 0.9,
    },
    {
      name: 'Hypertension (High Blood Pressure)',
      tagline: 'Elevated blood pressure that may cause headaches and chest discomfort',
      tags: ['Cardiovascular','Chronic'],
      symptoms: ['headache','chest pain','dizziness','blurred vision','high bp','heart palpitations','fatigue'],
      weight: 0.85,
    },
    {
      name: 'Type 2 Diabetes / Pre-Diabetes',
      tagline: 'Elevated blood sugar levels with fatigue and frequent urination',
      tags: ['Metabolic','Chronic','Manageable'],
      symptoms: ['fatigue','frequent urination','blurred vision','weight loss','numbness','anxiety'],
      weight: 0.8,
    },
    {
      name: 'Gastroenteritis (Stomach Bug)',
      tagline: 'Viral or bacterial infection of the digestive system',
      tags: ['Digestive','Viral/Bacterial'],
      symptoms: ['nausea','vomiting','diarrhoea','abdominal pain','fever','fatigue','loss of appetite','chills'],
      weight: 0.9,
    },
    {
      name: 'Anxiety / Panic Disorder',
      tagline: 'Mental health condition causing physical and emotional symptoms',
      tags: ['Mental Health','Treatable'],
      symptoms: ['anxiety','heart palpitations','shortness of breath','chest pain','dizziness','insomnia','fatigue','muscle aches'],
      weight: 0.8,
    },
    {
      name: 'Anaemia (Low Iron)',
      tagline: 'Reduced red blood cells causing fatigue and weakness',
      tags: ['Blood','Nutritional'],
      symptoms: ['fatigue','dizziness','shortness of breath','heart palpitations','loss of appetite','chills'],
      weight: 0.75,
    },
    {
      name: 'Migraine',
      tagline: 'Severe recurring headache often with nausea and light sensitivity',
      tags: ['Neurological','Recurring'],
      symptoms: ['headache','nausea','vomiting','blurred vision','dizziness','eye redness'],
      weight: 0.85,
    },
    {
      name: 'COVID-19 / Viral Infection',
      tagline: 'Coronavirus or other respiratory viral infection',
      tags: ['Viral','Respiratory','Test recommended'],
      symptoms: ['fever','cough','fatigue','muscle aches','shortness of breath','headache','chills','loss of appetite'],
      weight: 0.9,
    },
    {
      name: 'Urinary Tract Infection (UTI)',
      tagline: 'Bacterial infection in the urinary tract',
      tags: ['Bacterial','Urinary','Treatable'],
      symptoms: ['frequent urination','burning urination','abdominal pain','fever','chills','fatigue'],
      weight: 0.9,
    },
  ];

  // Score each condition
  const scored = CONDITIONS.map(c => {
    const matches = c.symptoms.filter(sym => s.some(sel => sel.toLowerCase().includes(sym) || sym.includes(sel)));
    let score = (matches.length / c.symptoms.length) * 100 * c.weight;
    if (hasFever && c.symptoms.includes('fever')) score += 8;
    if (sev >= 7 && ['Hypertension','COVID-19','Gastroenteritis'].some(n => c.name.includes(n))) score += 5;
    return { ...c, probability: Math.round(Math.min(92, Math.max(8, score))), matched: matches.length };
  });

  // Sort and take top 4
  scored.sort((a, b) => b.probability - a.probability);
  const top = scored.filter(c => c.matched > 0).slice(0, 5);
  if (top.length === 0) return fallbackResults();

  // Determine urgency
  const maxP = top[0].probability;
  const hasChest = s.includes('chest pain');
  const hasSob   = s.includes('shortness of breath');
  let urgency = 'self-care', urgency_title = 'Monitor at Home', urgency_msg = 'Your symptoms appear mild. Rest, stay hydrated, and monitor.';

  if (hasChest || (hasSob && hasFever && sev >= 7)) {
    urgency = 'urgent'; urgency_title = 'Seek Medical Attention Soon';
    urgency_msg = 'Some of your symptoms may need prompt medical evaluation.';
  } else if (sev >= 7 || hasFever) {
    urgency = 'consult'; urgency_title = 'See a Doctor This Week';
    urgency_msg = 'Your symptoms suggest a medical consultation would be beneficial.';
  } else if (maxP < 40) {
    urgency = 'self-care'; urgency_title = 'Self-Care Recommended';
    urgency_msg = 'Your symptoms appear mild. Rest and home care should help.';
  }

  return {
    urgency, urgency_title, urgency_msg,
    conditions: top.map(c => ({
      name: c.name, probability: c.probability,
      tagline: c.tagline, description: c.tagline,
      tags: c.tags
    }))
  };
}

function renderCheckerResults(data) {
  const urgMap = {
    'self-care': { icon:'🏠', badge:'badge-green',  label:'Self-Care' },
    'consult':   { icon:'👨‍⚕️', badge:'badge-yellow', label:'See a Doctor' },
    'urgent':    { icon:'⚠️',  badge:'badge-red',    label:'Urgent Care' },
    'emergency': { icon:'🚨',  badge:'badge-red',    label:'Emergency' },
  };
  const urg = urgMap[data.urgency] || urgMap.consult;
  const probCls = p => p >= 60 ? 'high' : p >= 35 ? 'med' : 'low';

  document.getElementById('checker-results').innerHTML = `
    <div class="card" style="margin-bottom:14px;display:flex;align-items:center;gap:14px">
      <div style="font-size:36px">${urg.icon}</div>
      <div style="flex:1">
        <div style="font-size:16px;font-weight:800;margin-bottom:4px">${data.urgency_title}</div>
        <div style="font-size:13px;color:var(--mid);font-weight:500">${data.urgency_msg}</div>
      </div>
      <span class="badge ${urg.badge}">${urg.label}</span>
    </div>
    ${data.conditions.map((c, i) => `
    <div class="cond-row" style="animation-delay:${i*.07}s">
      <div class="cond-prob ${probCls(c.probability)}">
        <div class="pct">${c.probability}%</div>
        <div class="plbl">match</div>
      </div>
      <div class="cond-info">
        <div class="cond-name">${c.name}</div>
        <div class="cond-desc">${c.tagline}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">
          ${(c.tags||[]).map(t=>`<span class="badge badge-blue">${t}</span>`).join('')}
        </div>
      </div>
      <div class="prob-strip">
        <div style="font-size:10px;font-weight:700;color:var(--dim);margin-bottom:4px">Match</div>
        <div class="prob-bar"><div class="prob-fill" style="width:${c.probability}%"></div></div>
      </div>
    </div>`).join('')}
    <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
      <button class="btn btn-outline" onclick="resetChecker()">↩ Start Over</button>
      <button class="btn btn-primary" onclick="navigate('doctors')">👨‍⚕️ Find a Doctor</button>
    </div>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-top:16px;font-size:12px;color:#78350f;font-weight:500;line-height:1.6">
      <b>⚠️ Disclaimer:</b> These results are educational only and NOT a medical diagnosis. Always consult a qualified healthcare professional.
    </div>`;

  setTimeout(() => {
    document.querySelectorAll('.prob-fill').forEach(bar => {
      const w = bar.style.width; bar.style.width = '0';
      setTimeout(() => bar.style.width = w, 100);
    });
  }, 100);
}

function fallbackResults() {
  return {
    urgency: 'consult', urgency_title: 'Schedule a Doctor Visit',
    urgency_msg: 'Based on your symptoms, a consultation with a healthcare professional is recommended.',
    conditions: [
      { name:'Viral Upper Respiratory Infection', probability:72, tagline:'Common cold or flu', description:'A very common viral infection affecting the nose, throat, and airways. Usually resolves within 7–10 days.', tags:['Viral','Common'] },
      { name:'Bacterial Sinusitis', probability:44, tagline:'Sinus cavity infection', description:'Bacterial infection causing facial pain and congestion.', tags:['Bacterial','ENT'] },
      { name:'Allergic Rhinitis', probability:36, tagline:'Hay fever / seasonal allergies', description:'Allergic response causing sneezing and runny nose.', tags:['Allergy'] },
      { name:'COVID-19', probability:28, tagline:'Coronavirus infection', description:'Consider getting tested. Wide range of symptoms.', tags:['Viral','Test recommended'] },
    ]
  };
}

function resetChecker() {
  checkerSymptoms = [];
  document.querySelectorAll('.sym-chip').forEach(c => c.classList.remove('active'));
  ['c-age','c-sex','c-complaint','c-duration','c-fever'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('c-severity').value = 5;
  document.getElementById('sev-show').textContent = '5';
  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById('csec-'+i); if(s) s.classList.remove('active');
    const t = document.getElementById('ctab-'+i); if(t) t.classList.remove('active','done');
  }
  document.getElementById('csec-1').classList.add('active');
  document.getElementById('ctab-1').classList.add('active');
}

// ════════════════════════════════════════════
// DOCTORS
// ════════════════════════════════════════════
function renderDoctors() {
  const q     = (document.getElementById('doc-search')?.value || '').toLowerCase();
  const spec  = document.getElementById('doc-spec')?.value  || '';
  const avail = document.getElementById('doc-avail')?.value || '';

  const filtered = DOCTORS.filter(d =>
    (!q     || d.name.toLowerCase().includes(q) || d.spec.toLowerCase().includes(q)) &&
    (!spec  || d.spec  === spec) &&
    (!avail || d.avail === avail)
  );

  document.getElementById('doctors-list').innerHTML = filtered.length === 0
    ? '<div class="card" style="text-align:center;padding:40px;color:var(--mid)">No doctors found.</div>'
    : filtered.map(d => `
      <div class="doctor-card">
        <div class="doc-av">${d.emoji}</div>
        <div class="doc-info">
          <div class="doc-name">${d.name}</div>
          <div class="doc-spec">${d.spec}</div>
          <div class="doc-meta">
            <span>🏆 ${d.exp} exp</span>
            <span>💰 ${d.fee}</span>
          </div>
          <div class="doc-rating">⭐ ${d.rating} <span style="color:var(--dim);font-weight:500;font-size:12px">(${d.reviews})</span>
            <span class="badge ${d.avail==='Available Today'?'badge-green':'badge-yellow'}" style="margin-left:10px">${d.avail}</span>
          </div>
        </div>
        <div class="doc-btns">
          <button class="btn btn-primary btn-sm" onclick="openModal('book-modal')">📅 Book</button>
          <button class="btn btn-ghost btn-sm"   onclick="showToast('💬','Chat coming soon!')">💬 Chat</button>
        </div>
      </div>`).join('');
}

// ════════════════════════════════════════════
// APPOINTMENTS
// ════════════════════════════════════════════
function buildAppointments() {
  document.getElementById('appt-list').innerHTML = APPOINTMENTS.map((a, i) => `
    <div class="appt-card">
      <div class="appt-date-box">
        <div class="appt-day">${a.day}</div>
        <div class="appt-month">${a.month}</div>
      </div>
      <div class="appt-info">
        <div class="appt-doc">${a.doc}</div>
        <div class="appt-spec">${a.spec}</div>
        <div class="appt-time-row">🕐 ${a.time} · ${a.reason}</div>
      </div>
      <div class="appt-actions">
        <span class="badge ${a.status==='confirmed'?'badge-green':'badge-yellow'}">${a.status}</span>
        <button class="btn btn-ghost btn-sm" onclick="cancelAppt(${i})">Cancel</button>
      </div>
    </div>`).join('');

  document.getElementById('appt-stats').innerHTML = [
    { icon:'📅', label:'Total',     val: APPOINTMENTS.length },
    { icon:'✅', label:'Confirmed', val: APPOINTMENTS.filter(a=>a.status==='confirmed').length },
    { icon:'⏳', label:'Pending',   val: APPOINTMENTS.filter(a=>a.status==='pending').length },
  ].map(s => `
    <div class="appt-stat-item">
      <span style="font-size:24px">${s.icon}</span>
      <div><div class="appt-stat-val">${s.val}</div><div class="appt-stat-lbl">${s.label}</div></div>
    </div>`).join('');
}

function cancelAppt(i) {
  APPOINTMENTS.splice(i, 1);
  buildAppointments();
  showToast('🗑️','Appointment cancelled');
}

function generateSlots() {
  const slots  = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','02:00 PM','02:30 PM','03:00 PM'];
  const taken  = [2, 5];
  document.getElementById('book-slots').innerHTML = slots.map((s, i) =>
    `<div class="time-slot ${taken.includes(i)?'taken':''}" onclick="selectSlot(this)">${s}</div>`
  ).join('');
}

function selectSlot(el) {
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}

function confirmBooking() {
  const doc    = document.getElementById('book-doctor').value;
  const date   = document.getElementById('book-date').value;
  const slot   = document.querySelector('.time-slot.selected');
  const reason = document.getElementById('book-reason').value || 'Consultation';
  if (!slot) { showToast('⚠️','Please select a time slot'); return; }

  const d = new Date(date);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  APPOINTMENTS.unshift({
    doc:    doc.split('–')[0].trim(),
    spec:   doc.split('–')[1]?.trim() || 'Specialist',
    day:    String(d.getDate()).padStart(2,'0'),
    month:  months[d.getMonth()],
    time:   slot.textContent,
    reason,
    status: 'confirmed'
  });
  buildAppointments();
  closeModal('book-modal');
  pushLog('appts','📅','#eaf1ff','Appointment booked', doc.split('–')[0].trim() + ' · ' + slot.textContent, a.day+' '+a.month, 'badge-green','Confirmed');
  showToast('✅', `Appointment booked with ${doc.split('–')[0].trim()}`);
}

// ════════════════════════════════════════════
// AI CHAT
// ════════════════════════════════════════════
function initChat() {
  document.getElementById('chat-messages').innerHTML = '';
  addChatMsg('bot', `Hello ${USER.fname}! 👋 I'm <b>Dr. HealthAI</b>, your AI health assistant.<br><br>I can help you understand symptoms, interpret your BP and sugar readings, answer health questions, and much more. What's on your mind today?`);
}

function addChatMsg(role, html) {
  const msgs  = document.getElementById('chat-messages');
  const isBot = role === 'bot';
  const div   = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `
    <div class="msg-av">${isBot ? '🤖' : '👤'}</div>
    <div><div class="msg-bub">${html}</div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'msg bot'; div.id = 'typing-ind';
  div.innerHTML = `<div class="msg-av">🤖</div><div class="msg-bub"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
function removeTyping() { const t = document.getElementById('typing-ind'); if (t) t.remove(); }

function autoResizeChat(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}
function chatKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }

// ── OFFLINE HEALTH KNOWLEDGE BASE ──────────────────────
// Works 100% on GitHub Pages — no server, no API key needed!
const HEALTH_KB = [
  {
    keys: ['blood pressure','bp','hypertension','systolic','diastolic'],
    reply: `<b>Blood Pressure Guide 🩺</b><br><br>
<b>Normal ranges:</b><br>
<ul>
  <li>✅ <b>Normal:</b> Less than 120/80 mmHg</li>
  <li>⚠️ <b>Elevated:</b> 120–129 / less than 80</li>
  <li>⚠️ <b>Stage 1 High:</b> 130–139 / 80–89</li>
  <li>🚨 <b>Stage 2 High:</b> 140+ / 90+</li>
  <li>🔵 <b>Low (Hypotension):</b> Below 90/60</li>
</ul>
<b>Tips to lower BP:</b> Reduce salt intake, exercise 30 min/day, limit alcohol, manage stress, take medications as prescribed.<br><br>
⚠️ <i>If BP is consistently above 140/90, see a doctor.</i>`
  },
  {
    keys: ['blood sugar','glucose','diabetes','diabetic','sugar level','hba1c','fasting','post meal'],
    reply: `<b>Blood Sugar Levels 🩸</b><br><br>
<b>Fasting glucose:</b><br>
<ul>
  <li>✅ <b>Normal:</b> 70–99 mg/dL</li>
  <li>⚠️ <b>Pre-diabetes:</b> 100–125 mg/dL</li>
  <li>🚨 <b>Diabetes:</b> 126+ mg/dL</li>
</ul>
<b>Post-meal (2 hours after eating):</b><br>
<ul>
  <li>✅ <b>Normal:</b> Below 140 mg/dL</li>
  <li>⚠️ <b>Pre-diabetes:</b> 140–199 mg/dL</li>
  <li>🚨 <b>Diabetes:</b> 200+ mg/dL</li>
</ul>
<b>Foods that help:</b> Leafy greens, whole grains, nuts, cinnamon, bitter gourd, fenugreek.<br><br>
💡 <i>HbA1c below 5.7% is normal; 5.7–6.4% is pre-diabetes.</i>`
  },
  {
    keys: ['heart rate','pulse','bpm','tachycardia','bradycardia','palpitation','heart beat'],
    reply: `<b>Heart Rate Information 💓</b><br><br>
<b>Normal resting heart rate:</b><br>
<ul>
  <li>✅ <b>Adults:</b> 60–100 bpm</li>
  <li>🏃 <b>Athletes:</b> 40–60 bpm (normal for fit people)</li>
  <li>⚠️ <b>Tachycardia (too fast):</b> Above 100 bpm at rest</li>
  <li>⚠️ <b>Bradycardia (too slow):</b> Below 60 bpm (if not athletic)</li>
</ul>
<b>Causes of high heart rate:</b> Stress, caffeine, dehydration, fever, thyroid issues, exercise.<br>
<b>Causes of low heart rate:</b> Medications, very fit physique, hypothyroidism.<br><br>
🚨 <i>Seek emergency care for chest pain + palpitations.</i>`
  },
  {
    keys: ['headache','migraine','head pain','head ache'],
    reply: `<b>Headache Guide 🤕</b><br><br>
<b>Common types:</b><br>
<ul>
  <li>💧 <b>Tension headache:</b> Stress, poor posture, dehydration</li>
  <li>🌩️ <b>Migraine:</b> Throbbing, one side, nausea, light sensitivity</li>
  <li>😤 <b>Cluster headache:</b> Severe pain around one eye</li>
  <li>🤧 <b>Sinus headache:</b> Facial pressure + congestion</li>
</ul>
<b>Quick relief:</b><br>
<ul>
  <li>Drink 2 glasses of water</li>
  <li>Rest in a dark, quiet room</li>
  <li>Apply cold/warm compress</li>
  <li>Paracetamol or ibuprofen (if not contraindicated)</li>
</ul>
🚨 <i>See a doctor if headache is sudden, severe ("thunderclap"), or with vision changes/numbness.</i>`
  },
  {
    keys: ['fever','temperature','high temperature','pyrexia'],
    reply: `<b>Fever Guide 🌡️</b><br><br>
<b>Temperature ranges:</b><br>
<ul>
  <li>✅ <b>Normal:</b> 36.1–37.2°C (97–99°F)</li>
  <li>⚠️ <b>Low fever:</b> 37.3–38°C</li>
  <li>🔶 <b>Fever:</b> 38–39°C (100.4–102.2°F)</li>
  <li>🚨 <b>High fever:</b> Above 39.5°C (103°F)</li>
</ul>
<b>Home management:</b><br>
<ul>
  <li>Stay hydrated (water, coconut water, ORS)</li>
  <li>Rest and avoid strenuous activity</li>
  <li>Paracetamol / Ibuprofen as directed</li>
  <li>Luke-warm sponge bath for very high fever</li>
</ul>
🚨 <i>See doctor immediately if fever is above 39.5°C, lasts more than 3 days, or comes with rash/stiff neck.</i>`
  },
  {
    keys: ['cough','cold','flu','sore throat','runny nose','congestion','respiratory'],
    reply: `<b>Cold & Respiratory Tips 🤧</b><br><br>
<b>Cold vs Flu:</b><br>
<ul>
  <li>🤧 <b>Cold:</b> Gradual, runny nose, mild fever, sore throat</li>
  <li>🥵 <b>Flu:</b> Sudden, high fever, body aches, fatigue, headache</li>
</ul>
<b>Home remedies:</b><br>
<ul>
  <li>🍯 Honey + ginger + warm water</li>
  <li>🧄 Garlic — natural antiviral</li>
  <li>💧 Steam inhalation for congestion</li>
  <li>🍋 Vitamin C (citrus fruits, amla)</li>
  <li>🛌 Rest is the best medicine</li>
</ul>
<b>See a doctor if:</b> Fever above 39°C, difficulty breathing, symptoms last more than 10 days.`
  },
  {
    keys: ['bmi','body mass','weight','obese','obesity','overweight','underweight'],
    reply: `<b>BMI & Weight Guide ⚖️</b><br><br>
<b>BMI Categories:</b><br>
<ul>
  <li>🔵 <b>Underweight:</b> Below 18.5</li>
  <li>✅ <b>Normal:</b> 18.5 – 24.9</li>
  <li>⚠️ <b>Overweight:</b> 25 – 29.9</li>
  <li>🚨 <b>Obese Class I:</b> 30 – 34.9</li>
  <li>🚨 <b>Obese Class II:</b> 35+</li>
</ul>
<b>Healthy weight tips:</b><br>
<ul>
  <li>Eat more vegetables, protein, and fibre</li>
  <li>Exercise at least 150 min/week</li>
  <li>Cut sugary drinks and processed foods</li>
  <li>Sleep 7–9 hours (poor sleep causes weight gain)</li>
</ul>
💡 <i>Use the BMI Calculator on the Profile page for your exact BMI!</i>`
  },
  {
    keys: ['cholesterol','ldl','hdl','triglyceride','lipid'],
    reply: `<b>Cholesterol Guide 🫀</b><br><br>
<b>Normal levels (mg/dL):</b><br>
<ul>
  <li>✅ <b>Total cholesterol:</b> Below 200</li>
  <li>✅ <b>LDL ("bad"):</b> Below 100 (ideal)</li>
  <li>✅ <b>HDL ("good"):</b> Above 60 (protective)</li>
  <li>✅ <b>Triglycerides:</b> Below 150</li>
</ul>
<b>Lower cholesterol with:</b><br>
<ul>
  <li>🫒 Olive oil, nuts, avocado (good fats)</li>
  <li>🐟 Fish (salmon, mackerel) — omega-3</li>
  <li>🌾 Oats, beans, soluble fibre</li>
  <li>🚫 Avoid trans fats, fried foods, red meat excess</li>
</ul>`
  },
  {
    keys: ['sleep','insomnia','tired','fatigue','exhausted','sleepy','rest'],
    reply: `<b>Sleep & Fatigue Guide 😴</b><br><br>
<b>Recommended sleep:</b><br>
<ul>
  <li>Adults (18–64): <b>7–9 hours/night</b></li>
  <li>Elderly (65+): <b>7–8 hours/night</b></li>
  <li>Teenagers: <b>8–10 hours/night</b></li>
</ul>
<b>Better sleep tips:</b><br>
<ul>
  <li>📵 No phone/screen 1 hour before bed</li>
  <li>🕙 Keep a fixed sleep schedule</li>
  <li>☕ No caffeine after 2 PM</li>
  <li>🌡️ Keep bedroom cool and dark</li>
  <li>🧘 Try deep breathing or meditation</li>
</ul>
<b>Fatigue causes:</b> Anaemia, thyroid issues, poor sleep, dehydration, depression, diabetes.<br><br>
⚠️ <i>If fatigue persists for 2+ weeks, see a doctor for blood tests.</i>`
  },
  {
    keys: ['stress','anxiety','mental health','depression','worry','panic','nervous'],
    reply: `<b>Stress & Mental Health 🧠</b><br><br>
<b>Signs of stress:</b> Headaches, irritability, poor sleep, muscle tension, digestive issues.<br><br>
<b>Proven stress relievers:</b><br>
<ul>
  <li>🧘 <b>Deep breathing:</b> 4-7-8 method (inhale 4s, hold 7s, exhale 8s)</li>
  <li>🚶 <b>Walk 20 minutes</b> — nature reduces cortisol by 15%</li>
  <li>📝 <b>Journaling</b> — write down worries to process them</li>
  <li>👥 <b>Talk to someone</b> — friend, family, or therapist</li>
  <li>🎵 <b>Music therapy</b> — calming music lowers heart rate</li>
</ul>
⚠️ <i>If you feel hopeless or unable to cope for 2+ weeks, please speak to a mental health professional.</i>`
  },
  {
    keys: ['water','hydration','dehydration','drink','thirst'],
    reply: `<b>Hydration Guide 💧</b><br><br>
<b>Daily water intake:</b><br>
<ul>
  <li>🧑 <b>Men:</b> ~3.7 litres (about 13 cups)</li>
  <li>👩 <b>Women:</b> ~2.7 litres (about 9 cups)</li>
  <li>More if you exercise, it's hot, or you're unwell</li>
</ul>
<b>Signs of dehydration:</b><br>
<ul>
  <li>Dark yellow urine</li>
  <li>Headache and dizziness</li>
  <li>Dry mouth and fatigue</li>
  <li>Rapid heartbeat</li>
</ul>
<b>Hydration tips:</b><br>
<ul>
  <li>Start every morning with 2 glasses of water</li>
  <li>Eat water-rich fruits: watermelon, cucumber, oranges</li>
  <li>Set hourly reminders on your phone</li>
</ul>`
  },
  {
    keys: ['vitamin','deficiency','iron','calcium','zinc','b12','vitamin d','anaemia','anemia'],
    reply: `<b>Common Nutrient Deficiencies 💊</b><br><br>
<b>Vitamin D deficiency signs:</b> Bone pain, fatigue, mood changes, frequent illness.<br>
<b>Sources:</b> Sunlight, fatty fish, egg yolks, fortified milk.<br><br>
<b>Vitamin B12 deficiency signs:</b> Tingling, fatigue, memory issues, pale skin.<br>
<b>Sources:</b> Meat, eggs, dairy, B12 supplements (especially for vegetarians).<br><br>
<b>Iron deficiency (Anaemia) signs:</b> Fatigue, pale skin, shortness of breath, cold hands.<br>
<b>Sources:</b> Red meat, spinach, lentils, fortified cereals, consume with Vitamin C.<br><br>
<b>Calcium deficiency signs:</b> Weak bones, muscle cramps, brittle nails.<br>
<b>Sources:</b> Dairy, broccoli, almonds, sesame seeds.<br><br>
💡 <i>Get blood tests to confirm any deficiency before supplementing.</i>`
  },
  {
    keys: ['exercise','workout','fitness','physical activity','gym','yoga','walk','jogging','run'],
    reply: `<b>Exercise & Fitness Guide 🏃</b><br><br>
<b>WHO recommended activity:</b><br>
<ul>
  <li>✅ <b>Moderate:</b> 150–300 minutes/week (brisk walk, cycling)</li>
  <li>✅ <b>Vigorous:</b> 75–150 minutes/week (running, swimming)</li>
  <li>✅ <b>Strength:</b> 2 days/week minimum</li>
</ul>
<b>Best exercises for heart health:</b><br>
<ul>
  <li>🚶 Brisk walking — accessible, effective</li>
  <li>🏊 Swimming — low impact, full body</li>
  <li>🚴 Cycling — great for cardiovascular</li>
  <li>🧘 Yoga — reduces BP and stress</li>
</ul>
<b>Start simple:</b> 10 minutes/day is better than nothing. Build up gradually.<br><br>
⚠️ <i>Consult a doctor before starting if you have heart disease or are severely overweight.</i>`
  },
  {
    keys: ['diet','nutrition','food','eat','healthy eating','calories','protein','carb','fat'],
    reply: `<b>Healthy Diet Guide 🥗</b><br><br>
<b>Balanced plate (each meal):</b><br>
<ul>
  <li>🥦 <b>Half the plate:</b> Vegetables and fruits</li>
  <li>🌾 <b>Quarter:</b> Whole grains (brown rice, oats, multigrain)</li>
  <li>🐔 <b>Quarter:</b> Lean protein (dal, chicken, fish, eggs)</li>
  <li>🥛 <b>Side:</b> Dairy or dairy alternative</li>
</ul>
<b>Foods to reduce:</b><br>
<ul>
  <li>🚫 Processed/packaged foods</li>
  <li>🚫 Sugary drinks (soda, packaged juice)</li>
  <li>🚫 Deep fried foods</li>
  <li>🚫 White bread and refined carbs</li>
</ul>
💡 <i>Eat mindfully. Chew slowly. Stop when 80% full.</i>`
  },
  {
    keys: ['chest pain','angina','heart attack','cardiac'],
    reply: `<b>⚠️ Chest Pain — Important!</b><br><br>
Chest pain can have many causes — some serious, some not.<br><br>
<b>🚨 Call emergency (112) immediately if:</b><br>
<ul>
  <li>Chest pain spreading to arm, jaw, or back</li>
  <li>Crushing or squeezing pressure in chest</li>
  <li>Shortness of breath + sweating + nausea</li>
  <li>Sudden dizziness or loss of consciousness</li>
</ul>
<b>Less urgent causes:</b> Acid reflux/GERD, muscle strain, anxiety, costochondritis.<br><br>
🚨 <i><b>Never ignore chest pain. Always get it checked by a doctor.</b></i>`
  },
  {
    keys: ['covid','coronavirus','covid-19','omicron','infection','viral'],
    reply: `<b>COVID-19 & Viral Infections 🦠</b><br><br>
<b>Common COVID symptoms:</b><br>
<ul>
  <li>Fever, cough, sore throat</li>
  <li>Loss of smell/taste</li>
  <li>Body aches, fatigue</li>
  <li>Shortness of breath (severe cases)</li>
</ul>
<b>What to do:</b><br>
<ul>
  <li>🏠 Isolate and rest at home for mild cases</li>
  <li>💧 Stay hydrated, paracetamol for fever</li>
  <li>🧪 Get tested (RAT or RT-PCR)</li>
  <li>💉 Keep vaccinations up to date</li>
</ul>
🚨 <i>Go to hospital if breathing is difficult, SpO2 drops below 94%, or lips turn blue.</i>`
  },
  {
    keys: ['kidney','renal','urine','urination','uti','bladder','creatinine'],
    reply: `<b>Kidney Health Guide 🫘</b><br><br>
<b>Signs of kidney issues:</b><br>
<ul>
  <li>Swelling in legs, ankles, feet</li>
  <li>Foamy or dark urine</li>
  <li>Reduced urine output</li>
  <li>Fatigue and nausea</li>
  <li>High blood pressure</li>
</ul>
<b>Protect your kidneys:</b><br>
<ul>
  <li>💧 Drink 8+ glasses of water daily</li>
  <li>🚫 Limit painkillers (NSAIDs damage kidneys)</li>
  <li>🩺 Control BP and blood sugar</li>
  <li>🧂 Reduce salt intake</li>
</ul>
<b>UTI symptoms:</b> Burning urination, frequent urge to urinate, cloudy urine. Drink plenty of water and see a doctor for antibiotics.`
  },
  {
    keys: ['thyroid','hypothyroid','hyperthyroid','tsh','thyroxine'],
    reply: `<b>Thyroid Health Guide 🦋</b><br><br>
<b>Hypothyroidism (underactive):</b><br>
<ul>
  <li>Weight gain, fatigue, cold sensitivity</li>
  <li>Depression, dry skin, hair loss</li>
  <li>Slow heart rate</li>
</ul>
<b>Hyperthyroidism (overactive):</b><br>
<ul>
  <li>Weight loss, anxiety, heat sensitivity</li>
  <li>Rapid heartbeat, trembling hands</li>
  <li>Bulging eyes (in Graves' disease)</li>
</ul>
<b>Normal TSH range:</b> 0.4 – 4.0 mIU/L<br><br>
💡 <i>A simple blood test (TSH) can diagnose thyroid issues. Very treatable with medication.</i>`
  },
  {
    keys: ['back pain','spine','neck pain','posture','sciatica','lumbar'],
    reply: `<b>Back & Neck Pain Guide 🦴</b><br><br>
<b>Most common causes:</b><br>
<ul>
  <li>Poor posture (especially sitting all day)</li>
  <li>Muscle strain from lifting</li>
  <li>Disc problems</li>
  <li>Stress and tension</li>
</ul>
<b>Home remedies:</b><br>
<ul>
  <li>🧊 Ice pack for first 48 hours (reduces inflammation)</li>
  <li>🔥 Heat pad after 48 hours (relaxes muscles)</li>
  <li>💊 Ibuprofen / naproxen for pain</li>
  <li>🧘 Gentle stretching, yoga, walking</li>
</ul>
<b>Good posture tips:</b> Screen at eye level, back straight, feet flat on floor, take breaks every 30 min.<br><br>
⚠️ <i>See a doctor if pain radiates down the leg, or if there is numbness/weakness.</i>`
  },
  {
    keys: ['medication','medicine','drug','tablet','capsule','dose','side effect','antibiotic'],
    reply: `<b>Medication Tips 💊</b><br><br>
<b>General rules:</b><br>
<ul>
  <li>Always complete the full course of antibiotics</li>
  <li>Never share medications</li>
  <li>Store away from heat and moisture</li>
  <li>Check expiry dates regularly</li>
  <li>Never crush time-release capsules</li>
</ul>
<b>Common mistakes:</b><br>
<ul>
  <li>❌ Stopping BP meds when you feel fine (don't!)</li>
  <li>❌ Taking antibiotics for viral infections (won't help)</li>
  <li>❌ Doubling dose if you miss one (take it as soon as remembered)</li>
</ul>
💡 <i>Use the Medication Tracker page to log your medicines and set reminders!</i>`
  },
  {
    keys: ['eye','vision','eyesight','glasses','contact lens','dry eye','cataract'],
    reply: `<b>Eye Health Guide 👁️</b><br><br>
<b>Signs you need glasses:</b> Squinting, headaches after reading, blurry distant vision, eye strain.<br><br>
<b>Eye care tips:</b><br>
<ul>
  <li>📱 Follow the <b>20-20-20 rule:</b> Every 20 min, look at something 20 feet away for 20 seconds</li>
  <li>💧 Blink more — screens reduce blinking by 60%</li>
  <li>🥕 Eat Vitamin A rich foods (carrots, sweet potato, spinach)</li>
  <li>☀️ Wear UV-protection sunglasses outdoors</li>
  <li>🩺 Get an eye test every 2 years</li>
</ul>
<b>Diabetic eye disease:</b> If diabetic, get annual eye check — diabetes can cause blindness if untreated.`
  },
  {
    keys: ['skin','rash','acne','pimple','eczema','psoriasis','itching','dermatology'],
    reply: `<b>Skin Health Guide 🧴</b><br><br>
<b>Acne tips:</b><br>
<ul>
  <li>Wash face twice daily with gentle cleanser</li>
  <li>Don't pop pimples — causes scarring</li>
  <li>Use non-comedogenic moisturiser</li>
  <li>Salicylic acid or benzoyl peroxide for mild acne</li>
</ul>
<b>Rash — when to see a doctor:</b><br>
<ul>
  <li>🚨 Rapidly spreading rash</li>
  <li>🚨 Rash with fever</li>
  <li>🚨 Difficulty breathing with rash (allergy)</li>
</ul>
<b>Healthy skin habits:</b> Stay hydrated, eat antioxidant-rich foods, use SPF 30+ sunscreen daily.<br><br>
💡 <i>Most skin conditions are treatable — see a dermatologist for persistent issues.</i>`
  },
  {
    keys: ['first aid','emergency','cut','wound','bleed','burn','fracture','sprain','injury'],
    reply: `<b>First Aid Guide 🩹</b><br><br>
<b>Cuts & wounds:</b><br>
<ul>
  <li>Apply firm pressure with clean cloth</li>
  <li>Clean with water, apply antiseptic</li>
  <li>Cover with bandage</li>
  <li>See doctor if deep, won't stop bleeding, or animal bite</li>
</ul>
<b>Burns:</b><br>
<ul>
  <li>Cool under running water for 10–20 min</li>
  <li>Do NOT use ice, butter, or toothpaste</li>
  <li>Cover loosely with clean bandage</li>
</ul>
<b>Emergency numbers:</b><br>
<ul>
  <li>🚑 <b>Ambulance (India): 108</b></li>
  <li>🚑 <b>Police: 100</b></li>
  <li>🚑 <b>General emergency: 112</b></li>
</ul>`
  },
];

// Greeting patterns
const GREETINGS = ['hi','hello','hey','good morning','good afternoon','good evening','namaste','hola','how are you'];
const THANKS    = ['thank','thanks','thank you','helpful','great','awesome','perfect','good'];

function getBotReply(input) {
  const text = input.toLowerCase().trim();

  // Greetings
  if (GREETINGS.some(g => text.includes(g))) {
    return `Hello ${USER.fname}! 👋 I'm <b>Dr. HealthAI</b>, your personal health assistant.<br><br>I can help you with:<br>
<ul>
  <li>💓 Blood pressure and heart health</li>
  <li>🩸 Blood sugar and diabetes</li>
  <li>😴 Sleep, stress, and mental health</li>
  <li>💊 Medications and vitamins</li>
  <li>🏃 Exercise and diet tips</li>
  <li>🤒 Symptoms like fever, cough, headache</li>
</ul>
Just type your question or use the quick topics on the left! What can I help you with today?`;
  }

  // Thanks
  if (THANKS.some(t => text.includes(t))) {
    return `You're very welcome, ${USER.fname}! 😊<br><br>Remember: I'm always here to help. Is there anything else about your health you'd like to know?<br><br><i>⚠️ Reminder: I provide general health information only. For medical diagnosis and treatment, always consult a qualified doctor.</i>`;
  }

  // Personalised vitals question
  if (text.includes('my bp') || text.includes('my blood pressure') || text.includes('my reading')) {
    return `Based on your latest logged reading of <b>118/76 mmHg</b>, your blood pressure is in the <span style="color:var(--green)"><b>Normal range</b></span>! ✅<br><br>
Normal is anything below 120/80 mmHg. Keep maintaining:<br>
<ul>
  <li>Regular exercise</li>
  <li>Low-salt diet</li>
  <li>Stress management</li>
  <li>Regular monitoring</li>
</ul>
Keep up the great work! 💪`;
  }

  if (text.includes('my sugar') || text.includes('my glucose') || text.includes('my blood sugar')) {
    return `Your latest fasting blood sugar was <b>95 mg/dL</b>, which is <span style="color:var(--green)"><b>Normal</b></span>! ✅<br><br>
Normal fasting glucose is 70–99 mg/dL. You're doing well!<br><br>
<b>To keep it in range:</b><br>
<ul>
  <li>Avoid sugary foods and drinks</li>
  <li>Walk for 15–20 minutes after meals</li>
  <li>Eat high-fibre foods</li>
  <li>Stay hydrated</li>
</ul>`;
  }

  // Match knowledge base
  for (const kb of HEALTH_KB) {
    if (kb.keys.some(k => text.includes(k))) {
      return kb.reply;
    }
  }

  // Symptom keywords fallback
  const symptoms = ['pain','ache','swelling','nausea','vomit','dizziness','dizzy','breathless','weakness','numbness','tingling'];
  if (symptoms.some(s => text.includes(s))) {
    return `I understand you're not feeling well. Here's what I'd suggest:<br><br>
<b>General steps when you have symptoms:</b><br>
<ul>
  <li>📝 Note when symptoms started and how severe (1–10)</li>
  <li>💧 Stay hydrated and get rest</li>
  <li>🌡️ Check your temperature</li>
  <li>🔍 Use the <b>Symptom Checker</b> page for a more detailed analysis</li>
  <li>👨‍⚕️ If symptoms are severe or worsening, see a doctor</li>
</ul>
🚨 <i>For chest pain, difficulty breathing, or sudden severe symptoms — call emergency services (112) immediately.</i><br><br>
Would you like me to explain more about any specific symptom?`;
  }

  // Default helpful response
  return `That's a great health question! Here are some topics I can help you with right now:<br><br>
<ul>
  <li>❤️ <b>Blood pressure</b> — type "blood pressure"</li>
  <li>🩸 <b>Blood sugar / diabetes</b> — type "blood sugar"</li>
  <li>💊 <b>Medications</b> — type "medication"</li>
  <li>🏃 <b>Exercise tips</b> — type "exercise"</li>
  <li>🥗 <b>Diet & nutrition</b> — type "diet"</li>
  <li>😴 <b>Sleep issues</b> — type "sleep"</li>
  <li>🤕 <b>Headache / fever / cough</b> — just type the symptom!</li>
</ul>
Or click any <b>Quick Topic</b> button on the left sidebar. What would you like to know?`;
}

function sendChat() {
  const inp  = document.getElementById('chat-input');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = ''; inp.style.height = 'auto';
  addChatMsg('user', text.replace(/\n/g,'<br>'));

  document.getElementById('chat-send').disabled = true;
  showTyping();

  // Simulate realistic typing delay (600–1400ms based on reply length)
  const reply = getBotReply(text);
  const delay = Math.min(1400, 600 + reply.length * 0.8);

  setTimeout(() => {
    removeTyping();
    addChatMsg('bot', reply);
    document.getElementById('chat-send').disabled = false;
    document.getElementById('chat-input').focus();
  }, delay);
}

function sendQuickChat(text) {
  document.getElementById('chat-input').value = text;
  sendChat();
}

// ════════════════════════════════════════════
// PROFILE & BMI
// ════════════════════════════════════════════
function buildProfile() {
  document.getElementById('profile-avatar').textContent = USER.fname[0];
  document.getElementById('profile-name').textContent   = `${USER.fname} ${USER.lname}`;
  document.getElementById('profile-sub').textContent    = `${USER.age} years · ${USER.sex} · ${USER.blood} · Member since 2025`;

  document.getElementById('profile-info').innerHTML = [
    ['Full Name', `${USER.fname} ${USER.lname}`],
    ['Email',     USER.email],
    ['Age',       `${USER.age} years`],
    ['Sex',       USER.sex],
    ['Blood Group', USER.blood],
    ['Height',    `${USER.height} cm`],
    ['Weight',    `${USER.weight} kg`],
  ].map(r => `
    <div class="info-row">
      <span class="info-key">${r[0]}</span>
      <span class="info-val">${r[1]}</span>
    </div>`).join('');

  document.getElementById('profile-health').innerHTML = [
    ['Last BP',       '118/76 mmHg',  'badge-green',  'Normal'],
    ['Last Sugar',    '95 mg/dL',     'badge-green',  'Normal'],
    ['Heart Rate',    '72 bpm',       'badge-green',  'Normal'],
    ['SpO2',          '98%',          'badge-green',  'Excellent'],
    ['Medications',   `${MEDICATIONS.length} active`, 'badge-blue', 'Active'],
    ['Appointments',  `${APPOINTMENTS.length} total`, 'badge-blue', 'Scheduled'],
  ].map(r => `
    <div class="info-row" style="align-items:center">
      <span class="info-key">${r[0]}</span>
      <span class="info-val" style="flex:1">${r[1]}</span>
      <span class="badge ${r[2]}">${r[3]}</span>
    </div>`).join('');

  document.getElementById('bmi-info').innerHTML = [
    { label:'Underweight', range:'< 18.5',      color:'#60a5fa' },
    { label:'Normal',      range:'18.5 – 24.9', color:'#34d399' },
    { label:'Overweight',  range:'25 – 29.9',   color:'#fbbf24' },
    { label:'Obese',       range:'≥ 30',         color:'#f87171' },
  ].map(b => `
    <div class="bmi-cat-row">
      <div class="bmi-cat-dot" style="background:${b.color}"></div>
      <div class="bmi-cat-name">${b.label}</div>
      <div class="bmi-cat-range">${b.range}</div>
    </div>`).join('');

  // Pre-fill BMI with user data
  if (USER.height) document.getElementById('bmi-h').value = USER.height;
  if (USER.weight) document.getElementById('bmi-w').value = USER.weight;
  calcBMI();
}

function calcBMI() {
  const h = parseFloat(document.getElementById('bmi-h').value);
  const w = parseFloat(document.getElementById('bmi-w').value);
  if (!h || !w || h < 50 || w < 10) return;

  const bmi = (w / (h/100)**2).toFixed(1);
  const cat = bmi < 18.5 ? { l:'Underweight', c:'#60a5fa' }
            : bmi < 25   ? { l:'Normal weight',c:'#34d399' }
            : bmi < 30   ? { l:'Overweight',   c:'#fbbf24' }
            :               { l:'Obese',         c:'#f87171' };
  const pct = Math.min(95, Math.max(5, (bmi - 15) / 25 * 100));

  document.getElementById('bmi-result').innerHTML = `
    <div class="bmi-display">
      <div class="bmi-number" style="color:${cat.c}">${bmi}</div>
      <div class="bmi-category" style="color:${cat.c}">${cat.l}</div>
      <div class="bmi-bar-outer"><div class="bmi-pointer" style="left:${pct}%"></div></div>
      <div class="bmi-scale"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span></div>
    </div>`;
}

// ════════════════════════════════════════════
// PDF EXPORT
// ════════════════════════════════════════════
function exportPDF() {
  showToast('📄','Generating PDF report…');
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });

    const primary = [28, 110, 243];
    const dark    = [15, 23, 42];
    const mid     = [71, 85, 105];
    const light   = [226, 232, 240];

    // Header bar
    doc.setFillColor(...primary);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(22); doc.setFont('helvetica','bold');
    doc.text('HealthAI', 14, 17);
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text('Personal Health Report', 14, 25);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`, 14, 32);

    // Patient name on header
    doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.text(`${USER.fname} ${USER.lname}`, 196, 17, { align:'right' });
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text(`${USER.age} yrs · ${USER.sex} · ${USER.blood}`, 196, 25, { align:'right' });

    let y = 50;

    // ── PATIENT INFO ──
    doc.setTextColor(...dark); doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.text('Patient Information', 14, y); y += 6;
    doc.setDrawColor(...light); doc.setLineWidth(0.4);
    doc.line(14, y, 196, y); y += 8;

    const infoData = [
      ['Name:', `${USER.fname} ${USER.lname}`],
      ['Age:',  `${USER.age} years`],
      ['Sex:',  USER.sex],
      ['Blood Group:', USER.blood],
      ['Height:', `${USER.height} cm`],
      ['Weight:', `${USER.weight} kg`],
    ];
    doc.setFontSize(10);
    infoData.forEach(([k, v]) => {
      doc.setFont('helvetica','bold'); doc.setTextColor(...mid); doc.text(k, 14, y);
      doc.setFont('helvetica','normal'); doc.setTextColor(...dark); doc.text(v, 70, y);
      y += 7;
    });

    y += 6;

    // ── VITALS SUMMARY ──
    doc.setTextColor(...dark); doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.text('Current Vitals', 14, y); y += 6;
    doc.line(14, y, 196, y); y += 8;

    const vitals = [
      ['Blood Pressure', '118/76 mmHg', 'Normal', [22,163,74]],
      ['Blood Sugar (Fasting)', '95 mg/dL', 'Normal', [22,163,74]],
      ['Heart Rate', '72 bpm', 'Normal', [22,163,74]],
      ['SpO2', '98%', 'Excellent', [22,163,74]],
      ['Temperature', '36.8°C', 'Normal', [22,163,74]],
      ['BMI', `${(USER.weight / (USER.height/100)**2).toFixed(1)}`, 'Normal weight', [22,163,74]],
    ];

    vitals.forEach(([label, val, status, col]) => {
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...dark);
      doc.text(label + ':', 14, y);
      doc.setFont('helvetica','normal'); doc.text(val, 85, y);
      doc.setTextColor(...col); doc.text(status, 150, y);
      doc.setTextColor(...dark);
      y += 7;
    });

    y += 6;

    // ── MEDICATIONS ──
    doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(...dark);
    doc.text('Active Medications', 14, y); y += 6;
    doc.line(14, y, 196, y); y += 8;

    if (MEDICATIONS.length === 0) {
      doc.setFont('helvetica','italic'); doc.setFontSize(10); doc.setTextColor(...mid);
      doc.text('No medications recorded.', 14, y); y += 8;
    } else {
      MEDICATIONS.forEach(m => {
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...dark);
        doc.text(`• ${m.name} ${m.dose}`, 14, y);
        doc.setFont('helvetica','normal'); doc.setTextColor(...mid);
        doc.text(`${m.freq} · ${m.time}`, 85, y);
        y += 7;
        if (m.notes) {
          doc.setFontSize(9); doc.text(`  Notes: ${m.notes}`, 14, y); y += 5;
        }
      });
    }

    y += 6;

    // ── APPOINTMENTS ──
    doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(...dark);
    doc.text('Upcoming Appointments', 14, y); y += 6;
    doc.line(14, y, 196, y); y += 8;

    APPOINTMENTS.slice(0,5).forEach(a => {
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...dark);
      doc.text(`• ${a.doc}`, 14, y);
      doc.setFont('helvetica','normal'); doc.setTextColor(...mid);
      doc.text(`${a.day} ${a.month} · ${a.time} · ${a.reason}`, 80, y);
      y += 7;
    });

    y += 6;

    // ── READINGS HISTORY ──
    if (y < 200) {
      doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(...dark);
      doc.text('Recent Readings', 14, y); y += 6;
      doc.line(14, y, 196, y); y += 8;

      HISTORY.slice(0,6).forEach(r => {
        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...dark);
        doc.text(r.date, 14, y);
        doc.setFont('helvetica','normal');
        doc.text(r.type, 70, y);
        doc.setFont('helvetica','bold'); doc.text(r.reading, 130, y);
        const sc = r.status === 'Normal' ? [22,163,74] : [220,38,38];
        doc.setTextColor(...sc); doc.text(r.status, 170, y);
        doc.setTextColor(...dark); y += 6;
      });
    }

    // Footer
    doc.setFillColor(...light);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(...mid); doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text('HealthAI – Final Year Project · For educational purposes only · Not a medical diagnosis', 105, 292, { align:'center' });

    doc.save(`HealthAI_Report_${USER.fname}_${new Date().toISOString().slice(0,10)}.pdf`);
    showToast('✅','PDF downloaded!');
  } catch(e) {
    console.error(e);
    showToast('⚠️','PDF generation failed. Ensure you are connected to the internet.');
  }
}

// ════════════════════════════════════════════
// ACTIVITY LOG
// ════════════════════════════════════════════

// Master log — every action the user takes gets added here
const ACTIVITY_LOG = [
  // Today
  { date:'2025-03-12', time:'09:15 AM', type:'vitals', icon:'❤️',  iconBg:'#fee2e2', title:'Blood Pressure logged',        sub:'Reading: 118/76 mmHg',           val:'118/76',    badge:'badge-green',  status:'Normal'  },
  { date:'2025-03-12', time:'09:00 AM', type:'vitals', icon:'🩸',  iconBg:'#fef3c7', title:'Blood Sugar logged',           sub:'Fasting — 95 mg/dL',             val:'95 mg/dL',  badge:'badge-green',  status:'Normal'  },
  { date:'2025-03-12', time:'08:30 AM', type:'meds',   icon:'💊',  iconBg:'#eaf1ff', title:'Metformin 500mg taken',        sub:'Morning dose — 8:00 AM',         val:'✓ Taken',   badge:'badge-green',  status:'Taken'   },
  { date:'2025-03-12', time:'08:30 AM', type:'meds',   icon:'💊',  iconBg:'#eaf1ff', title:'Vitamin D3 1000IU taken',      sub:'Morning dose — 8:00 AM',         val:'✓ Taken',   badge:'badge-green',  status:'Taken'   },
  { date:'2025-03-12', time:'08:00 AM', type:'good',   icon:'🌅',  iconBg:'#dcfce7', title:'Good morning, John!',          sub:'Logged in to HealthAI',          val:'',          badge:'',             status:''        },

  // Yesterday
  { date:'2025-03-11', time:'08:30 PM', type:'vitals', icon:'❤️',  iconBg:'#fee2e2', title:'Blood Pressure logged',        sub:'Evening — 128/84 mmHg',          val:'128/84',    badge:'badge-yellow', status:'Elevated'},
  { date:'2025-03-11', time:'08:00 PM', type:'meds',   icon:'💊',  iconBg:'#eaf1ff', title:'Metformin 500mg taken',        sub:'Evening dose — 8:00 PM',         val:'✓ Taken',   badge:'badge-green',  status:'Taken'   },
  { date:'2025-03-11', time:'01:00 PM', type:'vitals', icon:'🩸',  iconBg:'#fef3c7', title:'Blood Sugar logged',           sub:'Post-meal — 138 mg/dL',          val:'138 mg/dL', badge:'badge-red',    status:'High'    },
  { date:'2025-03-11', time:'09:30 AM', type:'appts',  icon:'📅',  iconBg:'#eaf1ff', title:'Appointment confirmed',        sub:'Dr. Priya Sharma — 18 Mar',      val:'18 MAR',    badge:'badge-blue',   status:'Confirmed'},
  { date:'2025-03-11', time:'08:30 AM', type:'meds',   icon:'💊',  iconBg:'#eaf1ff', title:'Amlodipine 5mg taken',         sub:'Morning dose — 9:00 AM',         val:'✓ Taken',   badge:'badge-green',  status:'Taken'   },

  // 2 days ago
  { date:'2025-03-10', time:'10:00 AM', type:'vitals', icon:'💓',  iconBg:'#ffe4e4', title:'Heart Rate logged',            sub:'Resting — 72 bpm',               val:'72 bpm',    badge:'badge-green',  status:'Normal'  },
  { date:'2025-03-10', time:'09:00 AM', type:'vitals', icon:'💨',  iconBg:'#e0f8f8', title:'SpO2 logged',                  sub:'Oxygen saturation — 98%',        val:'98%',       badge:'badge-green',  status:'Excellent'},
  { date:'2025-03-10', time:'08:30 AM', type:'meds',   icon:'💊',  iconBg:'#eaf1ff', title:'All morning medications taken',sub:'3 medications logged',           val:'✓ 3 doses', badge:'badge-green',  status:'Taken'   },
  { date:'2025-03-10', time:'07:00 AM', type:'alerts', icon:'⚠️',  iconBg:'#fef3c7', title:'High sugar alert',             sub:'Post-meal reading was above 130', val:'138 mg/dL', badge:'badge-yellow', status:'Alert'   },

  // 3 days ago
  { date:'2025-03-09', time:'08:00 AM', type:'vitals', icon:'🌡️', iconBg:'#ffedd5', title:'Temperature logged',           sub:'Normal — 36.8°C',                val:'36.8°C',    badge:'badge-green',  status:'Normal'  },
  { date:'2025-03-09', time:'07:45 AM', type:'vitals', icon:'⚖️',  iconBg:'#ede9fe', title:'Weight logged',               sub:'Morning — 72 kg',                val:'72 kg',     badge:'badge-green',  status:'Normal'  },
  { date:'2025-03-09', time:'07:00 AM', type:'appts',  icon:'📋',  iconBg:'#eaf1ff', title:'Symptom check completed',     sub:'4 symptoms analysed — Mild cold', val:'Self-care', badge:'badge-blue',   status:'Done'    },
];

let currentLogFilter = 'all';

function buildLog() {
  renderLogStats();
  renderLogTimeline(currentLogFilter);
}

function filterLog(type, btn) {
  currentLogFilter = type;
  document.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLogTimeline(type);
}

function renderLogStats() {
  const stats = [
    { icon:'📝', bg:'#eaf1ff', val: ACTIVITY_LOG.length,                                              lbl:'Total Entries' },
    { icon:'💓', bg:'#fee2e2', val: ACTIVITY_LOG.filter(e=>e.type==='vitals').length + HISTORY.length, lbl:'Vitals Logged' },
    { icon:'💊', bg:'#eaf1ff', val: ACTIVITY_LOG.filter(e=>e.type==='meds').length,                   lbl:'Doses Taken'   },
    { icon:'⚠️', bg:'#fef3c7', val: ACTIVITY_LOG.filter(e=>e.type==='alerts').length,                 lbl:'Health Alerts' },
  ];
  document.getElementById('log-stats').innerHTML = stats.map(s => `
    <div class="log-stat-card">
      <div class="log-stat-icon" style="background:${s.bg}">${s.icon}</div>
      <div>
        <div class="log-stat-val">${s.val}</div>
        <div class="log-stat-lbl">${s.lbl}</div>
      </div>
    </div>`).join('');
}

function renderLogTimeline(filter) {
  const el = document.getElementById('log-timeline');
  const entries = filter === 'all'
    ? ACTIVITY_LOG
    : ACTIVITY_LOG.filter(e => e.type === filter);

  if (!entries.length) {
    el.innerHTML = `<div class="log-empty">
      <div class="log-empty-icon">📭</div>
      <div class="log-empty-text">No ${filter} entries yet.</div>
      <div style="font-size:13px;margin-top:8px;color:var(--dim)">Start logging your vitals or medications to see entries here.</div>
    </div>`;
    return;
  }

  // Group by date
  const groups = {};
  entries.forEach(e => {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  });

  const today     = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);

  el.innerHTML = Object.entries(groups).map(([date, items]) => {
    const label = date === today ? '📅 Today' : date === yesterday ? '📅 Yesterday' : '📅 ' + new Date(date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

    const rows = items.map((e, i) => `
      <div class="log-entry" data-type="${e.type}">
        <div class="log-line-col">
          <div class="log-dot ${e.type}"></div>
          ${i < items.length - 1 ? '<div class="log-line"></div>' : ''}
        </div>
        <div class="log-entry-card">
          <div class="log-entry-icon" style="background:${e.iconBg}">${e.icon}</div>
          <div class="log-entry-body">
            <div class="log-entry-title">${e.title}</div>
            <div class="log-entry-sub">${e.sub}</div>
          </div>
          ${e.val ? `<div class="log-entry-val" style="color:var(--primary)">${e.val}</div>` : ''}
          ${e.badge ? `<span class="badge ${e.badge}">${e.status}</span>` : ''}
          <div class="log-entry-time">${e.time}</div>
        </div>
      </div>`).join('');

    return `<div class="log-day-group">
      <div class="log-day-label">${label}</div>
      ${rows}
    </div>`;
  }).join('');
}

// Push a new entry into the log (called when user logs a vital, takes a dose, etc.)
function pushLog(type, icon, iconBg, title, sub, val, badge, status) {
  const now  = new Date();
  const date = now.toISOString().slice(0,10);
  const time = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  ACTIVITY_LOG.unshift({ date, time, type, icon, iconBg, title, sub, val, badge, status });
  if (currentLogFilter !== undefined) renderLogTimeline(currentLogFilter);
  renderLogStats();
}


function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function modalOutside(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

// ════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════
let toastTimer;
function showToast(icon, msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-msg').textContent  = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
