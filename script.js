// ═══════════════════════════════════════════════════════
//  script.js — HealthAI Platform
//  Features: Dark Mode, Charts, PDF Export, Medications,
//            Vitals, Symptom Checker, Doctors, Chat, BMI
// ═══════════════════════════════════════════════════════

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

function doLogin() {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  document.getElementById('app').classList.remove('hidden');
  initApp();
  navigate('dashboard');
}

function doRegister() {
  const fn = document.getElementById('reg-fname').value.trim();
  const ln = document.getElementById('reg-lname').value.trim();
  if (!fn || !ln) { showToast('⚠️', 'Please fill in First and Last name'); return; }
  USER.fname = fn; USER.lname = ln;
  if (document.getElementById('reg-age').value)    USER.age    = parseInt(document.getElementById('reg-age').value);
  if (document.getElementById('reg-sex').value)    USER.sex    = document.getElementById('reg-sex').value;
  if (document.getElementById('reg-blood').value)  USER.blood  = document.getElementById('reg-blood').value;
  if (document.getElementById('reg-height').value) USER.height = parseInt(document.getElementById('reg-height').value);
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  document.getElementById('app').classList.remove('hidden');
  initApp();
  navigate('dashboard');
  showToast('🎉', 'Account created! Welcome to HealthAI');
}

function doLogout() {
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

function saveVitalLog() {
  let reading = '', type = '';
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
  } else if (currentLogType === 'heart') {
    const hr = document.getElementById('log-hr')?.value;
    if (!hr) { showToast('⚠️','Enter a value'); return; }
    reading = `${hr} bpm`; type = 'Heart Rate';
    HISTORY.unshift({ date: dateStr, type, reading, status: 'Normal', notes });
  } else if (currentLogType === 'temp') {
    const t = document.getElementById('log-temp')?.value;
    if (!t) { showToast('⚠️','Enter a value'); return; }
    reading = `${t}°C`; type = 'Temperature';
    const status = parseFloat(t) < 36 ? 'Low' : parseFloat(t) <= 37.5 ? 'Normal' : 'High';
    HISTORY.unshift({ date: dateStr, type, reading, status, notes });
  } else if (currentLogType === 'spo2') {
    const o = document.getElementById('log-spo2')?.value;
    if (!o) { showToast('⚠️','Enter a value'); return; }
    reading = `${o}%`; type = 'SpO2';
    HISTORY.unshift({ date: dateStr, type, reading, status: 'Normal', notes });
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
  if (pendingDoseId) {
    DOSE_LOG[pendingDoseId] = 'taken';
    pendingDoseId = null;
  }
  closeModal('dose-modal');
  renderTodaySchedule();
  renderAdherence();
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

  try {
    const age      = document.getElementById('c-age').value;
    const sex      = document.getElementById('c-sex').value;
    const dur      = document.getElementById('c-duration').value;
    const sev      = document.getElementById('c-severity').value;
    const fever    = document.getElementById('c-fever').value;
    const complaint = document.getElementById('c-complaint').value;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1000,
        system: `You are a medical AI. Respond ONLY with valid JSON, no markdown fences. Format:
{"urgency":"self-care"|"consult"|"urgent"|"emergency","urgency_title":"short title","urgency_msg":"one sentence","conditions":[{"name":"...","probability":85,"tagline":"...","description":"2 sentences.","tags":["tag1","tag2"]}]}
Return 4-5 conditions ordered by probability descending.`,
        messages: [{ role:'user', content:`Patient: ${age}yr ${sex}. Complaint: ${complaint}. Symptoms: ${checkerSymptoms.join(', ')}. Duration: ${dur}. Severity: ${sev}/10. Fever: ${fever}.` }]
      })
    });
    const data = await res.json();
    let txt = data.content[0].text.trim().replace(/```json|```/g,'').trim();
    renderCheckerResults(JSON.parse(txt));
  } catch(e) {
    renderCheckerResults(fallbackResults());
  }
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

async function sendChat() {
  const inp  = document.getElementById('chat-input');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = ''; inp.style.height = 'auto';
  addChatMsg('user', text.replace(/\n/g,'<br>'));
  chatHistory.push({ role:'user', content:text });
  document.getElementById('chat-send').disabled = true;
  showTyping();
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:600, system:CHAT_SYSTEM, messages:chatHistory })
    });
    const data = await res.json();
    removeTyping();
    const reply = data.content[0].text;
    chatHistory.push({ role:'assistant', content:reply });
    addChatMsg('bot', reply);
  } catch(e) {
    removeTyping();
    addChatMsg('bot','⚠️ Connection error. Please check your internet and try again.');
  }
  document.getElementById('chat-send').disabled = false;
  document.getElementById('chat-input').focus();
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
// MODAL HELPERS
// ════════════════════════════════════════════
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
