/* Lui Secondary School Portal
   Pupils & Teachers: Timetables, School Fees, Period Registers.
   Data is stored in the browser (localStorage) for this demo version. */
(function () {
  'use strict';

  /* ===================== SCHOOL DATA ===================== */
  const SCHOOL = { name: 'Lui Secondary School', term: 'Term 3', year: 2026 };
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const PERIODS = [
    { n: 1, label: '07:30 – 08:10', s: 450, e: 490 },
    { n: 2, label: '08:10 – 08:50', s: 490, e: 530 },
    { n: 3, label: '08:50 – 09:30', s: 530, e: 570 },
    { n: 4, label: '09:30 – 10:10', s: 570, e: 610 },
    { n: 5, label: '10:40 – 11:20', s: 640, e: 680 },
    { n: 6, label: '11:20 – 12:00', s: 680, e: 720 },
    { n: 7, label: '12:00 – 12:40', s: 720, e: 760 },
    { n: 8, label: '12:40 – 13:20', s: 760, e: 800 }
  ];
  const BREAK_AFTER = 4;
  const SUBJECTS = ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics',
    'Geography', 'History', 'Civic Education', 'Computer Studies', 'Religious Education'];
  const TEACHERS = [
    { id: 'T001', name: 'Mr. M. Banda', subject: 'Mathematics', bursar: true },
    { id: 'T002', name: 'Mrs. C. Mulenga', subject: 'English Language' },
    { id: 'T003', name: 'Mr. D. Mwale', subject: 'Biology' },
    { id: 'T004', name: 'Mrs. R. Phiri', subject: 'Chemistry' },
    { id: 'T005', name: 'Mr. J. Sakala', subject: 'Physics' },
    { id: 'T006', name: 'Ms. N. Chanda', subject: 'Geography' },
    { id: 'T007', name: 'Mr. P. Kalaba', subject: 'History' },
    { id: 'T008', name: 'Mrs. G. Tembo', subject: 'Civic Education' },
    { id: 'T009', name: 'Mr. S. Lungu', subject: 'Computer Studies' },
    { id: 'T010', name: 'Mrs. B. Zulu', subject: 'Religious Education' }
  ];
  const CLASSES = ['8A', '9A', '10A', '11A', '12A'];
  const TERM_FEES = { '8A': 450, '9A': 450, '10A': 650, '11A': 700, '12A': 750 };
  const PUPIL_NAMES = [
    'Chileshe Mutale', 'Mwila Kapambwe', 'Natasha Mumba', 'Kelvin Sikazwe', 'Bwalya Chola',
    'Thandiwe Nkhoma', 'Joseph Kasonde', 'Mercy Lubinda', 'Brian Mukuka', 'Precious Siame',
    'Patrick Mwanza', 'Ruth Chisenga', 'Daniel Mubanga', 'Esther Kunda', 'Moses Katongo',
    'Loveness Banda', 'Isaac Simwanza', 'Grace Namwinga', 'Collins Mbewe', 'Faith Kangwa',
    'Emmanuel Lisulo', 'Joy Mwiinga', 'Steven Muyunda', 'Agnes Sinkala', 'Peter Wamunyima'
  ];
  const PUPILS = PUPIL_NAMES.map((name, i) => ({
    id: 'LSS26-' + String(i + 1).padStart(3, '0'),
    name, cls: CLASSES[Math.floor(i / 5)], pin: '1234'
  }));
  const PAY_METHODS = ['Airtel Money', 'MTN MoMo', 'Zamtel Kwacha', 'Bank Deposit'];
  // Zambian mobile money networks and their number prefixes (after +260)
  const PAY_NETWORKS = {
    'MTN MoMo': { name: 'MTN', prefixes: ['76', '96'], ph: '096 123 4567' },
    'Airtel Money': { name: 'Airtel', prefixes: ['97', '77', '57'], ph: '097 123 4567' },
    'Zamtel Kwacha': { name: 'Zamtel', prefixes: ['95', '55'], ph: '095 123 4567' }
  };
  const ADMINS = [{ id: 'HT001', name: 'Mr. C.Akabondo', title: 'Head Teacher', pin: '1234' }];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function normalizeZmPhone(raw) {
    let d = String(raw).replace(/[\s\-()]/g, '');
    if (d.startsWith('+')) d = d.slice(1);
    if (d.startsWith('260')) d = d.slice(3); else if (d.startsWith('0')) d = d.slice(1);
    return /^\d{9}$/.test(d) ? d : null;
  }
  const momoHint = m => { const n = PAY_NETWORKS[m]; return n ? n.name + ' numbers start with ' + n.prefixes.map(x => '+260' + x).join(', ') : ''; };
  function validateMomo(method, raw) {
    const n = PAY_NETWORKS[method], d = normalizeZmPhone(raw);
    if (!d) return { ok: false, msg: 'Enter a valid Zambian number, e.g. ' + n.ph + ' or +260 ' + n.ph.slice(1) + '.' };
    if (!n.prefixes.includes(d.slice(0, 2))) {
      const owner = Object.keys(PAY_NETWORKS).find(k => PAY_NETWORKS[k].prefixes.includes(d.slice(0, 2)));
      return { ok: false, msg: 'This is not a valid ' + n.name + ' number. ' + momoHint(method) + '.' + (owner ? ' It looks like a ' + PAY_NETWORKS[owner].name + ' number, so choose ' + owner + '.' : '') };
    }
    return { ok: true, full: '+260' + d };
  }
  const NOTICES = [
    { t: 'End-of-term examinations', d: 'Check the examinations office board for your class schedule and bring your examination slip.' },
    { t: 'Fees clearance', d: 'Pupils must clear Term 3 balances to receive their end-of-term report.' },
    { t: 'Attendance', d: 'Registers are taken every period. Please be punctual to all lessons.' }
  ];

  /* ===================== HELPERS ===================== */
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => 'K ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pad = n => String(n).padStart(2, '0');
  const isoDate = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const prettyDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const dayIndex = iso => new Date(iso + 'T00:00:00').getDay() - 1; // 0=Mon … 4=Fri, -1/5 weekend
  const initials = n => n.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const teacherFor = subj => TEACHERS.find(t => t.subject === subj);
  const pupilById = id => PUPILS.find(p => p.id === id);
  const teacherById = id => TEACHERS.find(t => t.id === id);

  function slotSubject(cls, day, periodIdx) {
    const ci = CLASSES.indexOf(cls);
    return SUBJECTS[(periodIdx + day * 3 + ci * 2) % SUBJECTS.length];
  }
  function nowInfo() {
    const d = new Date();
    return { iso: isoDate(d), day: d.getDay() - 1, mins: d.getHours() * 60 + d.getMinutes() };
  }
  function currentPeriodIdx() {
    const { mins } = nowInfo();
    return PERIODS.findIndex(p => mins >= p.s && mins < p.e);
  }
  function mulberry32(a) {
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.className = 'toast', 3200);
  }

  /* ===================== STORAGE ===================== */
  const KEY = 'lui_portal_v1';
  let store = load();
  if (!store.activity) { store.activity = seedActivity(store.payments); try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
  function seedActivity(pays) {
    return pays.map(x => { const p = pupilById(x.pupilId);
      return { t: x.date + 'T10:00:00', type: 'payment', text: money(x.amount) + ' fee payment received for ' + (p ? p.name : x.pupilId) + ' (' + x.method + ')' }; })
      .sort((a, b) => b.t.localeCompare(a.t));
  }
  function logAct(type, text) {
    store.activity.unshift({ t: new Date().toISOString(), type, text });
    if (store.activity.length > 300) store.activity.length = 300;
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.payments && s.register) {
        if (!s.results) { s.results = seedResults(); localStorage.setItem(KEY, JSON.stringify(s)); }
        return s;
      }
    } catch (e) {}
    return seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
  function seed() {
    const rnd = mulberry32(2026);
    const s = { payments: [], register: {}, results: seedResults() };
    // sample fee payments
    PUPILS.forEach((p, i) => {
      const fee = TERM_FEES[p.cls];
      const share = [1, 0.5, 0.75, 0, 0.25][i % 5];
      if (share > 0) {
        s.payments.push({ ref: 'RCP-' + (100000 + i), pupilId: p.id, amount: Math.round(fee * share),
          method: PAY_METHODS[i % 4], phone: '', date: '2026-09-' + pad(5 + (i % 15)), by: 'Pupil' });
      }
    });
    // sample registers for the past 10 school days
    const d = new Date(); let added = 0;
    while (added < 10) {
      d.setDate(d.getDate() - 1);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      added++;
      const iso = isoDate(d);
      CLASSES.forEach(cls => {
        for (let pi = 0; pi < PERIODS.length; pi++) {
          const rec = {};
          PUPILS.filter(p => p.cls === cls).forEach(p => {
            const r = rnd(); rec[p.id] = r < 0.9 ? 'P' : r < 0.95 ? 'L' : 'A';
          });
          s.register[iso + '|' + cls + '|' + (pi + 1)] = rec;
        }
      });
    }
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }

  /* ===================== FEES & ATTENDANCE LOGIC ===================== */
  const paidBy = id => store.payments.filter(x => x.pupilId === id).reduce((a, b) => a + b.amount, 0);
  const feeOf = p => TERM_FEES[p.cls];
  const balanceOf = p => Math.max(0, feeOf(p) - paidBy(p.id));
  function feeStatus(p) {
    const paid = paidBy(p.id), fee = feeOf(p);
    if (paid >= fee) return ['Cleared', 'b-green'];
    if (paid > 0) return ['Partial', 'b-amber'];
    return ['Unpaid', 'b-red'];
  }
  function attendanceFor(p) {
    const out = { P: 0, L: 0, A: 0, total: 0, bySubject: {}, log: [] };
    Object.keys(store.register).forEach(k => {
      const [date, cls, per] = k.split('|');
      if (cls !== p.cls) return;
      const st = store.register[k][p.id]; if (!st) return;
      const di = dayIndex(date); if (di < 0 || di > 4) return;
      const subj = slotSubject(cls, di, Number(per) - 1);
      out[st]++; out.total++;
      const b = out.bySubject[subj] || (out.bySubject[subj] = { P: 0, L: 0, A: 0, total: 0 });
      b[st]++; b.total++;
      out.log.push({ date, period: Number(per), subject: subj, st });
    });
    out.log.sort((a, b) => b.date.localeCompare(a.date) || a.period - b.period);
    out.pct = out.total ? Math.round(((out.P + out.L) / out.total) * 100) : 100;
    return out;
  }

  /* ===================== SESSION / NAV ===================== */
  let session = null;
  let view = 'dashboard';
  let regState = { date: isoDate(new Date()), cls: CLASSES[0], period: null };
  let feeFilter = { q: '', cls: 'all' };
  let resState = { cls: CLASSES[0] };

  const NAV = {
    pupil: [['dashboard', '🏠', 'Dashboard'], ['timetable', '🗓️', 'My Timetable'], ['fees', '💳', 'School Fees'], ['attendance', '✅', 'Period Register'], ['results', '📊', 'My Results'], ['calendar', '📅', 'Calendar']],
    teacher: [['dashboard', '🏠', 'Dashboard'], ['timetable', '🗓️', 'My Timetable'], ['register', '📝', 'Take Register'], ['results', '📊', 'Results'], ['ledger', '💳', 'Fees Ledger'], ['pupils', '👥', 'Pupils'], ['calendar', '📅', 'Calendar']],
    admin: [['dashboard', '🏛️', 'Overview'], ['a_fees', '💰', 'Fees Monitor'], ['a_attendance', '✅', 'Attendance'], ['a_results', '📊', 'Results'],
      ['a_staff', '👨‍🏫', 'Staff'], ['a_timetable', '🗓️', 'Timetables'], ['a_activity', '🕒', 'Activity Log'], ['calendar', '📅', 'Calendar']]
  };
  const TITLES = { dashboard: 'Dashboard', timetable: 'Timetable', fees: 'School Fees', attendance: 'Period Register', register: 'Take Register', ledger: 'Fees Ledger', pupils: 'Pupils', results: 'Results', calendar: 'Calendar',
    a_fees: 'Fees Monitor', a_attendance: 'Attendance Monitor', a_results: 'Academic Results', a_staff: 'Staff', a_timetable: 'School Timetables', a_activity: 'Activity Log' };

  const me = () => session.role === 'pupil' ? pupilById(session.id) : session.role === 'teacher' ? teacherById(session.id) : ADMINS.find(a => a.id === session.id);

  function boot() {
    try { session = JSON.parse(sessionStorage.getItem('lui_session')); } catch (e) { session = null; }
    if (session && me()) showApp(); else showLogin();
  }
  function showLogin() {
    $('#login-screen').classList.remove('hidden'); $('#app-shell').classList.add('hidden');
  }
  function showApp() {
    $('#login-screen').classList.add('hidden'); $('#app-shell').classList.remove('hidden');
    const u = me();
    $('#user-name').textContent = u.name;
    $('#user-avatar').textContent = initials(u.name);
    $('#user-role').textContent = session.role === 'pupil' ? 'Pupil • Grade ' + u.cls : session.role === 'teacher' ? 'Teacher • ' + u.subject : u.title;
    lastAnimKey = ''; view = 'dashboard'; renderNav(); render();
  }
  function renderNav() {
    $('#nav').innerHTML = NAV[session.role].map(([id, ico, label]) =>
      `<a data-view="${id}" class="${id === view ? 'active' : ''}"><span class="ico">${ico}</span>${label}</a>`).join('');
  }
  function go(v) { view = v; renderNav(); render(); $('#sidebar').classList.remove('open'); window.scrollTo(0, 0); }

  /* ===================== RENDER ROUTER ===================== */
  function render() {
    $('#page-title').textContent = TITLES[view] || 'Portal';
    const c = $('#content');
    const map = {
      pupil: { dashboard: pupilDashboard, timetable: timetableView, fees: pupilFees, attendance: pupilAttendance, results: pupilResults, calendar: calendarView },
      teacher: { dashboard: teacherDashboard, timetable: timetableView, register: registerView, ledger: ledgerView, pupils: pupilsView, results: resultsView, calendar: calendarView },
      admin: { dashboard: adminDashboard, a_fees: adminFees, a_attendance: adminAttendance, a_results: adminResults, a_staff: adminStaff, a_timetable: adminTimetable, a_activity: adminActivity, calendar: calendarView }
    };
    c.innerHTML = (map[session.role][view] || (() => ''))();
    afterRender();
  }

  /* ===================== TIMETABLE ===================== */
  function cellFor(day, pi) {
    if (session.role === 'pupil') {
      const subj = slotSubject(me().cls, day, pi);
      return { subj, who: teacherFor(subj).name, cls: me().cls };
    }
    const t = me();
    for (const cls of CLASSES) if (slotSubject(cls, day, pi) === t.subject) return { subj: t.subject, who: 'Class ' + cls, cls };
    return null;
  }
  function timetableView() {
    const { day, mins } = nowInfo();
    const cp = currentPeriodIdx();
    let rows = '';
    PERIODS.forEach((p, pi) => {
      rows += `<tr><td class="period-col">Period ${p.n}<small>${p.label}</small></td>` +
        DAYS.map((_, d) => {
          const c = cellFor(d, pi);
          const cls = (d === day ? 'today' : '') + (d === day && pi === cp ? ' now' : '');
          return `<td class="${cls}">${c ? `<div class="subj">${esc(c.subj)}</div><div class="who">${esc(c.who)}</div>` : '<span class="muted">Free</span>'}</td>`;
        }).join('') + '</tr>';
      if (p.n === BREAK_AFTER) rows += `<tr class="break"><td colspan="6">☕ Break • 10:10 – 10:40</td></tr>`;
    });
    const who = session.role === 'pupil' ? `Grade ${me().cls}` : me().name;
    return `<div class="card"><div class="card-head"><h3>Weekly Timetable — ${esc(who)} • ${SCHOOL.term} ${SCHOOL.year}</h3>
      <button class="btn btn-secondary btn-sm" data-act="print">🖨️ Print</button></div>
      <div class="table-wrap"><table class="tt"><thead><tr><th>Period</th>${DAYS.map((d, i) => `<th class="${i === day ? 'today' : ''}">${d}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted" style="margin:12px 0 0;font-size:13px">Today's column is highlighted; the lesson in progress is outlined.</p></div>`;
  }
  function todayLessons() {
    const { day } = nowInfo();
    if (day < 0 || day > 4) return [];
    return PERIODS.map((p, pi) => ({ p, pi, c: cellFor(day, pi) })).filter(x => x.c);
  }
  function lessonList(items) {
    if (!items.length) return '<div class="empty">No lessons today. Enjoy the weekend! 🎉</div>';
    const cp = currentPeriodIdx();
    return '<ul class="list">' + items.map(x => `<li><div><div class="t">${esc(x.c.subj)}</div><div class="s">${esc(x.c.who)} • ${x.p.label}</div></div>
      <div>${x.pi === cp ? '<span class="badge b-green live-badge">Now</span>' : `<span class="badge b-blue">P${x.p.n}</span>`}
      ${session.role === 'teacher' ? `<button class="btn btn-secondary btn-sm" data-act="reg-lesson" data-cls="${x.c.cls}" data-per="${x.p.n}">Register</button>` : ''}</div></li>`).join('') + '</ul>';
  }
  function noticesHtml() {
    return NOTICES.map(n => `<div class="notice"><strong>${esc(n.t)}</strong>${esc(n.d)}</div>`).join('');
  }

  /* ===================== PUPIL VIEWS ===================== */
  function pupilDashboard() {
    const p = me(), a = attendanceFor(p), bal = balanceOf(p), lessons = todayLessons();
    return `<div class="welcome"><h2>Welcome, ${esc(p.name.split(' ')[0])} 👋</h2><p>Grade ${p.cls} • ${SCHOOL.name} • ${SCHOOL.term} ${SCHOOL.year}</p>${liveBanner()}</div>
    <div class="grid grid-4" style="margin-bottom:22px">
      <div class="stat"><div class="label">Attendance</div><div class="value">${a.pct}%</div><div class="sub">${a.total} periods recorded</div></div>
      <div class="stat ${bal ? 'red' : ''}"><div class="label">Fee balance</div><div class="value">${money(bal)}</div><div class="sub">Term fee ${money(feeOf(p))}</div></div>
      <div class="stat gold"><div class="label">Lessons today</div><div class="value">${lessons.length}</div><div class="sub">${DAYS[nowInfo().day] || 'Weekend'}</div></div>
      ${resultsStat(p)}
    </div>
    <div class="grid grid-2"><div class="card"><h3>Today's lessons</h3>${lessonList(lessons)}</div>
    <div>${calendarCard()}<div class="card"><h3>Notices</h3>${noticesHtml()}</div></div></div>`;
  }

  function pupilFees() {
    const p = me(), fee = feeOf(p), paid = paidBy(p.id), bal = balanceOf(p), pct = Math.min(100, Math.round(paid / fee * 100));
    const pays = store.payments.filter(x => x.pupilId === p.id).sort((a, b) => b.date.localeCompare(a.date));
    const [st, cls] = feeStatus(p);
    return `<div class="grid grid-4" style="margin-bottom:22px">
      <div class="stat"><div class="label">Term fee</div><div class="value">${money(fee)}</div><div class="sub">${SCHOOL.term} ${SCHOOL.year}</div></div>
      <div class="stat blue"><div class="label">Total paid</div><div class="value">${money(paid)}</div><div class="sub">${pays.length} payment(s)</div></div>
      <div class="stat ${bal ? 'red' : ''}"><div class="label">Balance</div><div class="value">${money(bal)}</div><div class="sub"><span class="badge ${cls}">${st}</span></div></div>
      <div class="stat gold"><div class="label">Progress</div><div class="value">${pct}%</div><div class="progress ${pct < 50 ? 'bad' : pct < 100 ? 'warn' : ''}" style="margin-top:8px"><div style="width:${pct}%"></div></div></div></div>
    <div class="card"><div class="card-head"><h3>Payment history</h3>
      <button class="btn btn-primary" data-act="pay" ${bal ? '' : 'disabled'}>💳 Make a payment</button></div>
      ${pays.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Receipt</th><th>Method</th><th>Amount</th><th></th></tr></thead><tbody>
      ${pays.map(x => `<tr><td>${prettyDate(x.date)}</td><td>${x.ref}</td><td>${esc(x.method)}</td><td><strong>${money(x.amount)}</strong></td>
      <td><button class="btn btn-secondary btn-sm" data-act="receipt" data-ref="${x.ref}">Receipt</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No payments recorded yet.</div>'}</div>`;
  }

  function pupilAttendance() {
    const p = me(), a = attendanceFor(p);
    const subj = Object.keys(a.bySubject).sort().map(s => {
      const b = a.bySubject[s], pc = Math.round((b.P + b.L) / b.total * 100);
      return `<tr><td><strong>${esc(s)}</strong></td><td>${b.P}</td><td>${b.L}</td><td>${b.A}</td>
      <td style="min-width:140px"><div class="progress ${pc < 75 ? 'bad' : pc < 90 ? 'warn' : ''}"><div style="width:${pc}%"></div></div></td><td>${pc}%</td></tr>`;
    }).join('');
    const log = a.log.slice(0, 25).map(x => `<tr><td>${prettyDate(x.date)}</td><td>Period ${x.period}</td><td>${esc(x.subject)}</td>
      <td><span class="badge ${x.st === 'P' ? 'b-green' : x.st === 'L' ? 'b-amber' : 'b-red'}">${{ P: 'Present', L: 'Late', A: 'Absent' }[x.st]}</span></td></tr>`).join('');
    return `<div class="grid grid-4" style="margin-bottom:22px">
      <div class="stat"><div class="label">Overall attendance</div><div class="value">${a.pct}%</div></div>
      <div class="stat"><div class="label">Present</div><div class="value">${a.P}</div></div>
      <div class="stat gold"><div class="label">Late</div><div class="value">${a.L}</div></div>
      <div class="stat red"><div class="label">Absent</div><div class="value">${a.A}</div></div></div>
    <div class="card"><h3>Attendance by subject</h3><div class="table-wrap"><table><thead><tr><th>Subject</th><th>Present</th><th>Late</th><th>Absent</th><th>Rate</th><th></th></tr></thead><tbody>${subj || '<tr><td colspan="6" class="empty">No records yet</td></tr>'}</tbody></table></div></div>
    <div class="card"><h3>Recent period register</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Period</th><th>Subject</th><th>Status</th></tr></thead><tbody>${log || '<tr><td colspan="4" class="empty">No records yet</td></tr>'}</tbody></table></div></div>`;
  }

  /* ===================== TEACHER VIEWS ===================== */
  function teacherDashboard() {
    const t = me(), lessons = todayLessons(), today = nowInfo().iso;
    const pending = lessons.filter(x => !store.register[today + '|' + x.c.cls + '|' + x.p.n]).length;
    const outstanding = PUPILS.reduce((a, p) => a + balanceOf(p), 0);
    return `<div class="welcome"><h2>Good day, ${esc(t.name)} 👋</h2><p>${esc(t.subject)} Department${t.bursar ? ' • Bursar desk access' : ''} • ${SCHOOL.name}</p>${liveBanner()}</div>
    <div class="grid grid-4" style="margin-bottom:22px">
      <div class="stat"><div class="label">Lessons today</div><div class="value">${lessons.length}</div><div class="sub">${DAYS[nowInfo().day] || 'Weekend'}</div></div>
      <div class="stat gold"><div class="label">Registers pending</div><div class="value">${pending}</div><div class="sub">For today</div></div>
      <div class="stat blue"><div class="label">Pupils enrolled</div><div class="value">${PUPILS.length}</div><div class="sub">${CLASSES.length} classes</div></div>
      <div class="stat red"><div class="label">Fees outstanding</div><div class="value" style="font-size:21px">${money(outstanding)}</div><div class="sub">All classes</div></div></div>
    <div class="grid grid-2"><div class="card"><h3>Today's lessons</h3>${lessonList(lessons)}</div>
    <div>${calendarCard()}<div class="card"><h3>Notices</h3>${noticesHtml()}</div></div></div>`;
  }

  function teacherPeriodsFor(cls, iso) {
    const di = dayIndex(iso), t = me();
    if (di < 0 || di > 4) return [];
    return PERIODS.filter((p, pi) => slotSubject(cls, di, pi) === t.subject).map(p => p.n);
  }
  function registerView() {
    const opts = teacherPeriodsFor(regState.cls, regState.date);
    if (!opts.includes(regState.period)) regState.period = opts[0] || null;
    const pupils = PUPILS.filter(p => p.cls === regState.cls);
    let body = '';
    if (!regState.period) {
      body = `<div class="empty">You have no lesson with Class ${regState.cls} on ${prettyDate(regState.date)}.<br>Try another date or class.</div>`;
    } else {
      const key = regState.date + '|' + regState.cls + '|' + regState.period;
      const rec = store.register[key] || {};
      body = `<div class="table-wrap"><table><thead><tr><th>#</th><th>Pupil</th><th>ID</th><th>Status</th></tr></thead><tbody>` +
        pupils.map((p, i) => {
          const v = rec[p.id] || 'P';
          const seg = ['P', 'L', 'A'].map(s => `<input type="radio" name="st-${p.id}" id="${p.id}-${s}" value="${s}" ${v === s ? 'checked' : ''}><label class="${s.toLowerCase()}" for="${p.id}-${s}">${{ P: 'Present', L: 'Late', A: 'Absent' }[s]}</label>`).join('');
          return `<tr><td>${i + 1}</td><td><strong>${esc(p.name)}</strong></td><td>${p.id}</td><td><div class="seg" data-pupil="${p.id}">${seg}</div></td></tr>`;
        }).join('') + `</tbody></table></div>
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
          <button class="btn btn-primary" data-act="save-reg">Save register</button>
          <button class="btn btn-secondary" data-act="all-present">Mark all present</button>
          ${store.register[key] ? '<span class="badge b-green" style="align-self:center">Register saved</span>' : '<span class="badge b-amber" style="align-self:center">Not yet saved</span>'}</div>`;
    }
    return `<div class="card"><h3>Period register</h3><div class="toolbar">
      <div><label>Date</label><input type="date" id="reg-date" value="${regState.date}"></div>
      <div><label>Class</label><select id="reg-cls">${CLASSES.map(c => `<option ${c === regState.cls ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div><label>Period</label><select id="reg-per">${opts.length ? opts.map(n => `<option value="${n}" ${n === regState.period ? 'selected' : ''}>Period ${n} (${PERIODS[n - 1].label})</option>`).join('') : '<option>—</option>'}</select></div>
    </div>${body}</div>`;
  }

  function ledgerView() {
    const t = me();
    let list = PUPILS.filter(p => (feeFilter.cls === 'all' || p.cls === feeFilter.cls) &&
      (p.name.toLowerCase().includes(feeFilter.q.toLowerCase()) || p.id.toLowerCase().includes(feeFilter.q.toLowerCase())));
    const tot = list.reduce((a, p) => ({ fee: a.fee + feeOf(p), paid: a.paid + paidBy(p.id) }), { fee: 0, paid: 0 });
    return `<div class="grid grid-4" style="margin-bottom:22px">
      <div class="stat"><div class="label">Expected</div><div class="value" style="font-size:21px">${money(tot.fee)}</div></div>
      <div class="stat blue"><div class="label">Collected</div><div class="value" style="font-size:21px">${money(tot.paid)}</div></div>
      <div class="stat red"><div class="label">Outstanding</div><div class="value" style="font-size:21px">${money(tot.fee - tot.paid)}</div></div>
      <div class="stat gold"><div class="label">Collection rate</div><div class="value">${tot.fee ? Math.round(tot.paid / tot.fee * 100) : 0}%</div></div></div>
    <div class="card"><div class="card-head"><h3>Pupil fee ledger</h3>${t.bursar ? '' : '<span class="muted" style="font-size:13px">View only — payments are recorded by the Bursar</span>'}</div>
      <div class="toolbar"><div><label>Search</label><input id="fee-q" placeholder="Name or ID" value="${esc(feeFilter.q)}"></div>
      <div><label>Class</label><select id="fee-cls"><option value="all">All classes</option>${CLASSES.map(c => `<option ${feeFilter.cls === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
      <div class="table-wrap"><table><thead><tr><th>Pupil</th><th>Class</th><th>Fee</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map(p => { const [st, c] = feeStatus(p); return `<tr><td><strong>${esc(p.name)}</strong><br><span class="muted" style="font-size:12px">${p.id}</span></td><td>${p.cls}</td><td>${money(feeOf(p))}</td><td>${money(paidBy(p.id))}</td><td>${money(balanceOf(p))}</td>
      <td><span class="badge ${c}">${st}</span></td><td>${t.bursar && balanceOf(p) ? `<button class="btn btn-primary btn-sm" data-act="record" data-id="${p.id}">Record payment</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="7" class="empty">No pupils match.</td></tr>'}
      </tbody></table></div></div>`;
  }

  function pupilsView() {
    return CLASSES.map(c => `<div class="card"><h3>Class ${c} — ${PUPILS.filter(p => p.cls === c).length} pupils</h3><div class="table-wrap"><table><thead><tr><th>Name</th><th>Pupil ID</th><th>Attendance</th><th>Fees</th></tr></thead><tbody>
      ${PUPILS.filter(p => p.cls === c).map(p => { const [st, b] = feeStatus(p); return `<tr><td><strong>${esc(p.name)}</strong></td><td>${p.id}</td><td>${attendanceFor(p).pct}%</td><td><span class="badge ${b}">${st}</span></td></tr>`; }).join('')}
      </tbody></table></div></div>`).join('');
  }

  /* ===================== RESULTS ===================== */
  function seedResults() {
    const rnd = mulberry32(77), res = {};
    PUPILS.forEach(p => {
      const base = 42 + rnd() * 38; res[p.id] = {};
      SUBJECTS.forEach(s => { res[p.id][s] = Math.max(18, Math.min(98, Math.round(base + (rnd() - 0.5) * 34))); });
    });
    return res;
  }
  // Examinations-style grading: 1 (best) to 9
  function gradeOf(sc) {
    const g = sc >= 75 ? 1 : sc >= 70 ? 2 : sc >= 65 ? 3 : sc >= 60 ? 4 : sc >= 55 ? 5 : sc >= 50 ? 6 : sc >= 45 ? 7 : sc >= 40 ? 8 : 9;
    return { g, remark: g <= 2 ? 'Distinction' : g <= 4 ? 'Merit' : g <= 6 ? 'Credit' : g <= 8 ? 'Satisfactory' : 'Unsatisfactory',
      cls: g <= 2 ? 'b-green' : g <= 6 ? 'b-blue' : g <= 8 ? 'b-amber' : 'b-red' };
  }
  const scoresOf = id => store.results[id] || {};
  function classRanking(cls) {
    const rows = PUPILS.filter(p => p.cls === cls).map(p => {
      const v = Object.values(scoresOf(p.id)), total = v.reduce((a, b) => a + b, 0);
      return { p, total, n: v.length, avg: v.length ? total / v.length : 0 };
    }).sort((a, b) => b.total - a.total);
    rows.forEach((r, i) => r.pos = i && r.total === rows[i - 1].total ? rows[i - 1].pos : i + 1);
    return rows;
  }
  function resultsStat(p) {
    const rank = classRanking(p.cls), r = rank.find(x => x.p.id === p.id);
    return `<div class="stat blue"><div class="label">Term average</div><div class="value">${Math.round(r.avg)}%</div><div class="sub">Position ${r.pos} of ${rank.length}</div></div>`;
  }
  function pupilResults() {
    const p = me(), s = scoresOf(p.id), rank = classRanking(p.cls), r = rank.find(x => x.p.id === p.id);
    const entries = SUBJECTS.filter(x => s[x] !== undefined).map(x => ({ subj: x, sc: s[x] }));
    const best = entries.slice().sort((a, b) => b.sc - a.sc)[0];
    const passed = entries.filter(e => gradeOf(e.sc).g <= 8).length;
    const rows = entries.map(e => {
      const g = gradeOf(e.sc);
      return `<tr><td><strong>${esc(e.subj)}</strong></td><td>${esc(teacherFor(e.subj).name)}</td><td>${e.sc}%</td>
      <td style="min-width:130px"><div class="progress ${e.sc < 40 ? 'bad' : e.sc < 55 ? 'warn' : ''}"><div style="width:${e.sc}%"></div></div></td>
      <td><span class="badge ${g.cls}">Grade ${g.g}</span></td><td>${g.remark}</td></tr>`;
    }).join('');
    return `<div class="grid grid-4" style="margin-bottom:22px">
      <div class="stat"><div class="label">Average</div><div class="value">${Math.round(r.avg)}%</div><div class="sub">${r.n} subjects</div></div>
      <div class="stat gold"><div class="label">Class position</div><div class="value">${r.pos} / ${rank.length}</div><div class="sub">Class ${p.cls}</div></div>
      <div class="stat blue"><div class="label">Best subject</div><div class="value" style="font-size:19px">${best ? esc(best.subj) : '—'}</div><div class="sub">${best ? best.sc + '%' : ''}</div></div>
      <div class="stat"><div class="label">Subjects passed</div><div class="value">${passed} / ${entries.length}</div><div class="sub">Grade 8 or better</div></div></div>
    <div class="card"><div class="card-head"><h3>Report card — ${esc(p.name)} (${p.id}) • ${SCHOOL.term} ${SCHOOL.year}</h3><button class="btn btn-secondary btn-sm" data-act="print">🖨️ Print</button></div>
      <div class="table-wrap"><table><thead><tr><th>Subject</th><th>Teacher</th><th>Score</th><th></th><th>Grade</th><th>Remark</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty">No results published yet.</td></tr>'}</tbody></table></div>
      <p class="muted" style="font-size:13px;margin:12px 0 0">Grading: 1–2 Distinction • 3–4 Merit • 5–6 Credit • 7–8 Satisfactory • 9 Unsatisfactory</p></div>`;
  }
  const shortSubj = s => s.split(' ')[0];
  function resultsView() {
    const t = me(), cls = resState.cls, rank = classRanking(cls);
    const entry = rank.slice().sort((a, b) => a.p.name.localeCompare(b.p.name)).map(r => {
      const v = scoresOf(r.p.id)[t.subject];
      return `<tr><td><strong>${esc(r.p.name)}</strong></td><td>${r.p.id}</td>
      <td><input class="mark-in" type="number" min="0" max="100" data-pupil="${r.p.id}" value="${v === undefined ? '' : v}" placeholder="0–100"></td></tr>`;
    }).join('');
    const sheet = rank.map(r => {
      const s = scoresOf(r.p.id);
      return `<tr><td><strong>${r.pos}</strong></td><td><strong>${esc(r.p.name)}</strong></td>` +
        SUBJECTS.map(x => { const g = s[x] === undefined ? null : gradeOf(s[x]); return `<td${x === t.subject ? ' style="background:#eefaf4"' : ''}>${g ? `<span class="badge ${g.cls}">${s[x]}</span>` : '—'}</td>`; }).join('') +
        `<td>${r.total}</td><td><strong>${Math.round(r.avg)}%</strong></td></tr>`;
    }).join('');
    return `<div class="card"><div class="toolbar"><div><label>Class</label><select id="res-cls">${CLASSES.map(c => `<option ${c === cls ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
      <div class="card-head"><h3>Enter marks — ${esc(t.subject)} • Class ${cls}</h3></div>
      <div class="table-wrap"><table><thead><tr><th>Pupil</th><th>ID</th><th>Score (%)</th></tr></thead><tbody>${entry}</tbody></table></div>
      <div style="margin-top:16px"><button class="btn btn-primary" data-act="save-marks">Save marks</button></div></div>
    <div class="card"><div class="card-head"><h3>Class ${cls} results sheet — all pupils • ${SCHOOL.term} ${SCHOOL.year}</h3><button class="btn btn-secondary btn-sm" data-act="print">🖨️ Print</button></div>
      <div class="table-wrap"><table><thead><tr><th>Pos</th><th>Pupil</th>${SUBJECTS.map(x => `<th>${esc(shortSubj(x))}</th>`).join('')}<th>Total</th><th>Avg</th></tr></thead><tbody>${sheet}</tbody></table></div></div>`;
  }

  /* ===================== LIVE CLOCK, CALENDAR & ANIMATION ===================== */
  let calState = { y: new Date().getFullYear(), m: new Date().getMonth() };
  let lastAnimKey = '', lastPeriod = -2, tickCount = 0;
  const secsNow = () => { const d = new Date(); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(); };
  const fmtHMS = x => { x = Math.max(0, Math.floor(x)); const h = Math.floor(x / 3600); return (h ? h + ':' : '') + pad(Math.floor(x % 3600 / 60)) + ':' + pad(x % 60); };

  function liveBannerInner() {
    const day = new Date().getDay() - 1, sec = secsNow(), cp = currentPeriodIdx(), wk = day >= 0 && day <= 4;
    const row = (txt, right, pct) => `<div class="live-line"><span class="live-dot"></span>${txt}<span class="live-time">${right}</span></div>` +
      (pct === null ? '' : `<div class="live-bar"><div style="width:${pct}%"></div></div>`);
    if (!wk) return row('<strong>No lessons today</strong> • enjoy the weekend', '', null);
    if (cp >= 0) {
      const p = PERIODS[cp], pct = Math.min(100, Math.max(0, (sec - p.s * 60) / ((p.e - p.s) * 60) * 100));
      let line;
      if (session.role === 'admin') line = `Period ${p.n} in session • ${p.label}`;
      else { const c = cellFor(day, cp); line = c ? `Period ${p.n} • ${esc(c.subj)} • ${esc(c.who)}` : `Period ${p.n} • Free period`; }
      return row('<strong>LIVE</strong>&nbsp;' + line, 'ends in ' + fmtHMS(p.e * 60 - sec), pct);
    }
    if (sec >= 610 * 60 && sec < 640 * 60) return row('<strong>Break time</strong> ☕', 'lessons resume in ' + fmtHMS(640 * 60 - sec), Math.min(100, (sec - 610 * 60) / 18));
    if (sec < 450 * 60) return row('<strong>School opens at 07:30</strong>', 'first lesson in ' + fmtHMS(450 * 60 - sec), null);
    return row('<strong>School day complete</strong>', 'see you tomorrow', null);
  }
  const liveBanner = () => `<div class="live-banner" id="live-banner">${liveBannerInner()}</div>`;

  function tick() {
    const d = new Date(); tickCount++;
    const t = d.toLocaleTimeString('en-GB'), ds = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const ct = $('#clock-time'); if (ct) { ct.textContent = t; $('#clock-date').textContent = ds; }
    const hc = $('#hero-clock'); if (hc) hc.innerHTML = t + '<small>' + ds + '</small>';
    const bt = $('#big-time'); if (bt) { bt.textContent = t; $('#big-date').textContent = ds; }
    const hh = $('#hand-h');
    if (hh) {
      const H = d.getHours() % 12, M = d.getMinutes(), S = d.getSeconds();
      hh.style.transform = 'rotate(' + ((H + M / 60) * 30) + 'deg)';
      $('#hand-m').style.transform = 'rotate(' + ((M + S / 60) * 6) + 'deg)';
      $('#hand-s').style.transform = 'rotate(' + (S * 6) + 'deg)';
    }
    if (!session) return;
    const cp = currentPeriodIdx();
    if (cp !== lastPeriod) {
      const prev = lastPeriod; lastPeriod = cp;
      if (prev !== -2 && ['dashboard', 'timetable', 'a_timetable'].includes(view)) { render(); return; }
    }
    const lb = $('#live-banner'); if (lb) lb.innerHTML = liveBannerInner();
    if (tickCount % 20 === 0) { const bd = $('#live-board'); if (bd) bd.innerHTML = liveBoardHtml(); }
  }

  function animateNumbers(root) {
    root.querySelectorAll('.stat .value').forEach(el => {
      const txt = el.textContent, m = txt.match(/(\d[\d,]*\.?\d*)/); if (!m) return;
      const raw = m[1], target = parseFloat(raw.replace(/,/g, '')); if (!isFinite(target) || target === 0) return;
      const dec = (raw.split('.')[1] || '').length, pre = txt.slice(0, m.index), post = txt.slice(m.index + raw.length), t0 = performance.now();
      (function step(now) {
        const k = Math.min(1, (now - t0) / 800), v = target * (1 - Math.pow(1 - k, 3));
        el.textContent = pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + post;
        if (k < 1) requestAnimationFrame(step); else el.textContent = txt;
      })(t0);
    });
  }
  function afterRender() {
    const c = $('#content'), key = session.role + ':' + view;
    if (key !== lastAnimKey) { lastAnimKey = key; c.classList.remove('view-in'); void c.offsetWidth; c.classList.add('view-in'); animateNumbers(c); }
    tick();
  }

  function calendarInner() {
    const y = calState.y, m = calState.m, off = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(), t = new Date();
    let cells = '';
    for (let i = 0; i < off; i++) cells += '<span class="cal-empty"></span>';
    for (let d = 1; d <= n; d++) {
      const dow = (off + d - 1) % 7, today = d === t.getDate() && m === t.getMonth() && y === t.getFullYear();
      cells += `<span class="cal-day${dow >= 5 ? ' wkd' : ''}${today ? ' today' : ''}">${d}</span>`;
    }
    return `<div class="cal-head"><button class="btn btn-ghost btn-sm" data-act="cal-prev">&#8249;</button><strong>${MONTHS[m]} ${y}</strong><button class="btn btn-ghost btn-sm" data-act="cal-next">&#8250;</button></div>
      <div class="cal-grid">${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(x => `<span class="cal-dow">${x}</span>`).join('')}${cells}</div>
      <div style="text-align:center;margin-top:12px"><button class="btn btn-secondary btn-sm" data-act="cal-today">Today</button></div>`;
  }
  const calendarCard = () => `<div class="card" id="cal-card"><h3>Calendar</h3><div id="cal-body">${calendarInner()}</div></div>`;
  function analogClock() {
    let ticks = '';
    for (let i = 0; i < 12; i++) ticks += `<line x1="100" y1="14" x2="100" y2="${i % 3 === 0 ? 28 : 22}" stroke="#0b2a4a" stroke-width="${i % 3 === 0 ? 4 : 2}" transform="rotate(${i * 30} 100 100)"/>`;
    return `<svg class="analog" viewBox="0 0 200 200"><circle class="face" cx="100" cy="100" r="94"/>${ticks}
      <line id="hand-h" class="hand hh" x1="100" y1="100" x2="100" y2="56" stroke="#0b2a4a" stroke-width="6" stroke-linecap="round"/>
      <line id="hand-m" class="hand hh" x1="100" y1="100" x2="100" y2="34" stroke="#1b8a5a" stroke-width="4" stroke-linecap="round"/>
      <line id="hand-s" class="hand" x1="100" y1="116" x2="100" y2="26" stroke="#e0a526" stroke-width="2" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="6" fill="#0b2a4a"/></svg>`;
  }
  function calendarView() {
    const side = session.role === 'admin' ? '' : `<div class="card"><h3>Today's lessons</h3>${lessonList(todayLessons())}</div>`;
    return `<div class="grid grid-2"><div>${calendarCard()}${side}</div>
      <div class="card" style="text-align:center"><h3>School clock</h3>${analogClock()}<div class="big-time" id="big-time"></div><div class="muted" id="big-date"></div></div></div>`;
  }

  /* ===================== ADMIN (HEAD TEACHER) ===================== */
  let admState = { cls: CLASSES[0] };
  const ACT_BADGE = { payment: 'b-green', register: 'b-blue', marks: 'b-amber', login: 'b-gray' };
  const fmtDT = iso => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const pctOf = o => o && o.total ? Math.round((o.P + o.L) / o.total * 100) : 100;
  function attStats(filter) {
    const o = { P: 0, L: 0, A: 0, total: 0, perPupil: {}, perClass: {} };
    Object.keys(store.register).forEach(k => {
      const [date, cls] = k.split('|'); if (filter && !filter(date, cls)) return;
      const rec = store.register[k], pc = o.perClass[cls] || (o.perClass[cls] = { P: 0, L: 0, A: 0, total: 0 });
      Object.keys(rec).forEach(id => {
        const st = rec[id]; o[st]++; o.total++; pc[st]++; pc.total++;
        const pp = o.perPupil[id] || (o.perPupil[id] = { P: 0, L: 0, A: 0, total: 0 }); pp[st]++; pp.total++;
      });
    });
    o.pct = pctOf(o); return o;
  }
  function latestRegDate() { const today = isoDate(new Date()); return Object.keys(store.register).map(k => k.split('|')[0]).filter(d => d <= today).sort().pop() || null; }
  function registerProgressToday() {
    const { iso, day, mins } = nowInfo(); if (day < 0 || day > 4) return { taken: 0, expected: 0 };
    return { taken: Object.keys(store.register).filter(k => k.startsWith(iso + '|')).length, expected: PERIODS.filter(p => p.s <= mins).length * CLASSES.length };
  }
  function teacherLoad(t) {
    const { iso, day, mins } = nowInfo(), o = { week: 0, today: 0, due: 0, taken: 0 };
    CLASSES.forEach(cls => { for (let d = 0; d < 5; d++) for (let pi = 0; pi < PERIODS.length; pi++) {
      if (slotSubject(cls, d, pi) !== t.subject) continue; o.week++;
      if (d === day) { o.today++; if (PERIODS[pi].s <= mins) { o.due++; if (store.register[iso + '|' + cls + '|' + (pi + 1)]) o.taken++; } }
    } });
    return o;
  }
  function liveBoardHtml() {
    const { iso, day, mins } = nowInfo(), cp = currentPeriodIdx(), wk = day >= 0 && day <= 4;
    return '<div class="table-wrap"><table><thead><tr><th>Class</th><th>Now in session</th><th>Teacher</th><th>Register</th></tr></thead><tbody>' +
      CLASSES.map(cls => {
        if (wk && cp >= 0) {
          const sub = slotSubject(cls, day, cp), t = teacherFor(sub), done = !!store.register[iso + '|' + cls + '|' + (cp + 1)];
          return `<tr><td><strong>${cls}</strong></td><td>${esc(sub)} <span class="muted">(P${cp + 1})</span></td><td>${esc(t.name)}</td><td><span class="badge ${done ? 'b-green' : 'b-amber'}">${done ? 'Taken' : 'Pending'}</span></td></tr>`;
        }
        return `<tr><td><strong>${cls}</strong></td><td colspan="3" class="muted">${wk && mins >= 610 && mins < 640 ? 'Break time' : 'No lesson in session'}</td></tr>`;
      }).join('') + '</tbody></table></div>';
  }

  function adminDashboard() {
    const fee = PUPILS.reduce((a, p) => a + feeOf(p), 0), paid = PUPILS.reduce((a, p) => a + paidBy(p.id), 0);
    const ld = latestRegDate(), st = ld ? attStats(d => d === ld) : null, rp = registerProgressToday();
    const scores = PUPILS.flatMap(p => Object.values(scoresOf(p.id))), avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const debtors = PUPILS.filter(p => balanceOf(p) > 0).length;
    const bars = CLASSES.map(c => {
      const ps = PUPILS.filter(p => p.cls === c), f = ps.reduce((a, p) => a + feeOf(p), 0), pd = ps.reduce((a, p) => a + paidBy(p.id), 0), pc = Math.round(pd / f * 100);
      return `<li style="display:block"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="t">Class ${c}</span><span class="s">${money(pd)} of ${money(f)} • ${pc}%</span></div>
        <div class="progress ${pc < 50 ? 'bad' : pc < 100 ? 'warn' : ''}" style="margin-top:6px"><div style="width:${pc}%"></div></div></li>`;
    }).join('');
    const feed = store.activity.slice(0, 6).map(a => `<li><div><div class="t">${esc(a.text)}</div><div class="s">${fmtDT(a.t)}</div></div><span class="badge ${ACT_BADGE[a.type] || 'b-gray'}">${a.type}</span></li>`).join('');
    return `<div class="welcome"><h2>Good day, ${esc(me().name)} 👋</h2><p>Head Teacher • School-wide monitoring • ${SCHOOL.name} • ${SCHOOL.term} ${SCHOOL.year}</p>${liveBanner()}</div>
    <div class="grid grid-4" style="margin-bottom:22px">
      <div class="stat blue"><div class="label">Pupils</div><div class="value">${PUPILS.length}</div><div class="sub">${CLASSES.length} classes</div></div>
      <div class="stat blue"><div class="label">Teachers</div><div class="value">${TEACHERS.length}</div><div class="sub">${SUBJECTS.length} subjects</div></div>
      <div class="stat"><div class="label">Fees collected</div><div class="value" style="font-size:21px">${money(paid)}</div><div class="sub">of ${money(fee)}</div></div>
      <div class="stat red"><div class="label">Outstanding</div><div class="value" style="font-size:21px">${money(fee - paid)}</div><div class="sub">${debtors} pupils owing</div></div>
      <div class="stat"><div class="label">Attendance</div><div class="value">${st ? st.pct + '%' : '—'}</div><div class="sub">${ld ? 'Last register day ' + prettyDate(ld) : 'No records yet'}</div></div>
      <div class="stat gold"><div class="label">Registers today</div><div class="value">${rp.taken} / ${rp.expected}</div><div class="sub">taken so far</div></div>
      <div class="stat"><div class="label">School average</div><div class="value">${Math.round(avg)}%</div><div class="sub">All subjects</div></div>
      <div class="stat gold"><div class="label">Collection rate</div><div class="value">${fee ? Math.round(paid / fee * 100) : 0}%</div><div class="sub">${SCHOOL.term}</div></div></div>
    <div class="grid grid-2"><div>
      <div class="card"><h3><span class="live-dot"></span>Live school board</h3><div id="live-board">${liveBoardHtml()}</div></div>
      <div class="card"><h3>Fee collection by class</h3><ul class="list">${bars}</ul></div></div>
      <div>${calendarCard()}<div class="card"><h3>Recent activity</h3><ul class="list">${feed}</ul></div></div></div>`;
  }

  function adminFees() {
    const fee = PUPILS.reduce((a, p) => a + feeOf(p), 0), paid = PUPILS.reduce((a, p) => a + paidBy(p.id), 0);
    const byM = {}; store.payments.forEach(x => byM[x.method] = (byM[x.method] || 0) + x.amount);
    const pays = store.payments.slice().sort((a, b) => b.date.localeCompare(a.date) || b.ref.localeCompare(a.ref)).slice(0, 30);
    const owing = PUPILS.filter(p => balanceOf(p) > 0).sort((a, b) => balanceOf(b) - balanceOf(a)).slice(0, 10);
    const cls = CLASSES.map(c => {
      const ps = PUPILS.filter(p => p.cls === c), f = ps.reduce((a, p) => a + feeOf(p), 0), pd = ps.reduce((a, p) => a + paidBy(p.id), 0), pc = Math.round(pd / f * 100);
      return `<tr><td><strong>Class ${c}</strong></td><td>${money(f)}</td><td>${money(pd)}</td><td>${money(f - pd)}</td><td style="min-width:140px"><div class="progress ${pc < 50 ? 'bad' : pc < 100 ? 'warn' : ''}"><div style="width:${pc}%"></div></div></td><td>${pc}%</td></tr>`;
    }).join('');
    return `<div class="grid grid-4" style="margin-bottom:22px">
      <div class="stat"><div class="label">Expected</div><div class="value" style="font-size:21px">${money(fee)}</div></div>
      <div class="stat blue"><div class="label">Collected</div><div class="value" style="font-size:21px">${money(paid)}</div></div>
      <div class="stat red"><div class="label">Outstanding</div><div class="value" style="font-size:21px">${money(fee - paid)}</div></div>
      <div class="stat gold"><div class="label">Collection rate</div><div class="value">${fee ? Math.round(paid / fee * 100) : 0}%</div></div></div>
    <div class="card"><h3>Collection by class</h3><div class="table-wrap"><table><thead><tr><th>Class</th><th>Expected</th><th>Collected</th><th>Outstanding</th><th></th><th>Rate</th></tr></thead><tbody>${cls}</tbody></table></div></div>
    <div class="grid grid-2"><div class="card"><h3>Latest payments</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Pupil</th><th>Method</th><th>Amount</th><th></th></tr></thead><tbody>
      ${pays.map(x => { const p = pupilById(x.pupilId); return `<tr><td>${prettyDate(x.date)}</td><td>${esc(p ? p.name : x.pupilId)}</td><td>${esc(x.method)}${x.phone ? '<br><span class="muted" style="font-size:12px">' + esc(x.phone) + '</span>' : ''}</td><td><strong>${money(x.amount)}</strong></td><td><button class="btn btn-secondary btn-sm" data-act="receipt" data-ref="${x.ref}">Receipt</button></td></tr>`; }).join('')}
      </tbody></table></div></div>
    <div><div class="card"><h3>Collected by method</h3><ul class="list">${Object.keys(byM).map(k => `<li><span class="t">${esc(k)}</span><strong>${money(byM[k])}</strong></li>`).join('') || '<li class="muted">No payments yet</li>'}</ul></div>
    <div class="card"><h3>Largest balances</h3><ul class="list">${owing.map(p => `<li><div><div class="t">${esc(p.name)}</div><div class="s">Class ${p.cls}</div></div><span class="badge b-red">${money(balanceOf(p))}</span></li>`).join('') || '<li class="muted">All fees cleared 🎉</li>'}</ul></div></div></div>`;
  }

  function adminAttendance() {
    const all = attStats(), ld = latestRegDate(), last = ld ? attStats(d => d === ld) : null, rp = registerProgressToday();
    const rows = CLASSES.map(c => {
      const o = all.perClass[c] || { P: 0, L: 0, A: 0, total: 0 }, pc = pctOf(o);
      return `<tr><td><strong>Class ${c}</strong></td><td>${o.P}</td><td>${o.L}</td><td>${o.A}</td><td style="min-width:140px"><div class="progress ${pc < 80 ? 'bad' : pc < 90 ? 'warn' : ''}"><div style="width:${pc}%"></div></div></td><td>${pc}%</td></tr>`;
    }).join('');
    const low = PUPILS.map(p => ({ p, o: all.perPupil[p.id] })).filter(x => x.o && pctOf(x.o) < 90).sort((a, b) => pctOf(a.o) - pctOf(b.o)).slice(0, 10);
    const staff = TEACHERS.map(t => { const l = teacherLoad(t);
      return `<tr><td><strong>${esc(t.name)}</strong></td><td>${esc(t.subject)}</td><td>${l.today}</td><td>${l.taken} / ${l.due}</td><td><span class="badge ${l.taken >= l.due ? 'b-green' : 'b-amber'}">${l.due === 0 ? 'Nothing due' : l.taken >= l.due ? 'Up to date' : 'Pending'}</span></td></tr>`; }).join('');
    return `<div class="grid grid-4" style="margin-bottom:22px">
      <div class="stat"><div class="label">Overall attendance</div><div class="value">${all.pct}%</div><div class="sub">${all.total} records</div></div>
      <div class="stat blue"><div class="label">Latest school day</div><div class="value">${last ? last.pct + '%' : '—'}</div><div class="sub">${ld ? prettyDate(ld) : ''}</div></div>
      <div class="stat gold"><div class="label">Late (all time)</div><div class="value">${all.L}</div></div>
      <div class="stat red"><div class="label">Absent (all time)</div><div class="value">${all.A}</div></div></div>
    <div class="card"><h3>Attendance by class</h3><div class="table-wrap"><table><thead><tr><th>Class</th><th>Present</th><th>Late</th><th>Absent</th><th></th><th>Rate</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="grid grid-2"><div class="card"><h3><span class="live-dot"></span>Register status today (${rp.taken} of ${rp.expected} taken)</h3><div class="table-wrap"><table><thead><tr><th>Teacher</th><th>Subject</th><th>Lessons</th><th>Registers</th><th></th></tr></thead><tbody>${staff}</tbody></table></div></div>
    <div class="card"><h3>Pupils below 90% attendance</h3><ul class="list">${low.map(x => `<li><div><div class="t">${esc(x.p.name)}</div><div class="s">Class ${x.p.cls} • ${x.o.A} absent, ${x.o.L} late</div></div><span class="badge ${pctOf(x.o) < 80 ? 'b-red' : 'b-amber'}">${pctOf(x.o)}%</span></li>`).join('') || '<li class="muted">No pupils below 90% 🎉</li>'}</ul></div></div>`;
  }

  function adminResults() {
    const per = PUPILS.map(p => { const v = Object.values(scoresOf(p.id)); return { p, avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 }; });
    const clsRows = CLASSES.map(c => {
      const rk = classRanking(c), allSc = PUPILS.filter(p => p.cls === c).flatMap(p => Object.values(scoresOf(p.id))), pass = allSc.length ? Math.round(allSc.filter(v => gradeOf(v).g <= 8).length / allSc.length * 100) : 0;
      return `<tr><td><strong>Class ${c}</strong></td><td>${Math.round(rk.reduce((a, r) => a + r.avg, 0) / rk.length)}%</td><td>${pass}%</td><td>${esc(rk[0].p.name)} (${Math.round(rk[0].avg)}%)</td></tr>`;
    }).join('');
    const subj = SUBJECTS.map(x => { const v = PUPILS.map(p => scoresOf(p.id)[x]).filter(n => n !== undefined), a = v.length ? Math.round(v.reduce((s2, n) => s2 + n, 0) / v.length) : 0;
      return `<li style="display:block"><div style="display:flex;justify-content:space-between"><span class="t">${esc(x)}</span><span class="s">${a}% • ${esc(teacherFor(x).name)}</span></div><div class="progress ${a < 40 ? 'bad' : a < 55 ? 'warn' : ''}" style="margin-top:6px"><div style="width:${a}%"></div></div></li>`; }).join('');
    const top = per.slice().sort((a, b) => b.avg - a.avg).slice(0, 10), weak = per.filter(x => x.avg < 50).sort((a, b) => a.avg - b.avg).slice(0, 10);
    return `<div class="card"><h3>Class performance • ${SCHOOL.term} ${SCHOOL.year}</h3><div class="table-wrap"><table><thead><tr><th>Class</th><th>Average</th><th>Pass rate</th><th>Top pupil</th></tr></thead><tbody>${clsRows}</tbody></table></div></div>
    <div class="grid grid-2"><div class="card"><h3>Subject averages</h3><ul class="list">${subj}</ul></div>
    <div><div class="card"><h3>Top 10 pupils (school-wide)</h3><ul class="list">${top.map((x, i) => `<li><div><div class="t">${i + 1}. ${esc(x.p.name)}</div><div class="s">Class ${x.p.cls}</div></div><span class="badge b-green">${Math.round(x.avg)}%</span></li>`).join('')}</ul></div>
    <div class="card"><h3>Pupils needing support (below 50%)</h3><ul class="list">${weak.map(x => `<li><div><div class="t">${esc(x.p.name)}</div><div class="s">Class ${x.p.cls}</div></div><span class="badge b-red">${Math.round(x.avg)}%</span></li>`).join('') || '<li class="muted">None 🎉</li>'}</ul></div></div></div>`;
  }

  function adminStaff() {
    const rows = TEACHERS.map(t => { const l = teacherLoad(t);
      return `<tr><td><strong>${esc(t.name)}</strong><br><span class="muted" style="font-size:12px">${t.id}</span></td><td>${esc(t.subject)}</td><td>${t.bursar ? '<span class="badge b-blue">Bursar desk</span>' : 'Class teacher'}</td><td>${l.week}</td><td>${l.today}</td><td>${l.taken} / ${l.due}</td></tr>`; }).join('');
    return `<div class="grid grid-4" style="margin-bottom:22px"><div class="stat blue"><div class="label">Teaching staff</div><div class="value">${TEACHERS.length}</div></div>
      <div class="stat"><div class="label">Lessons per week</div><div class="value">${CLASSES.length * 5 * PERIODS.length}</div></div>
      <div class="stat gold"><div class="label">Classes</div><div class="value">${CLASSES.length}</div></div>
      <div class="stat"><div class="label">Subjects</div><div class="value">${SUBJECTS.length}</div></div></div>
    <div class="card"><h3>Teaching staff</h3><div class="table-wrap"><table><thead><tr><th>Teacher</th><th>Subject</th><th>Role</th><th>Lessons / week</th><th>Today</th><th>Registers (taken / due)</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function adminTimetable() {
    const { day } = nowInfo(), cp = currentPeriodIdx(); let rows = '';
    PERIODS.forEach((p, pi) => {
      rows += `<tr><td class="period-col">Period ${p.n}<small>${p.label}</small></td>` + DAYS.map((_, d) => {
        const sub = slotSubject(admState.cls, d, pi);
        return `<td class="${(d === day ? 'today' : '') + (d === day && pi === cp ? ' now' : '')}"><div class="subj">${esc(sub)}</div><div class="who">${esc(teacherFor(sub).name)}</div></td>`;
      }).join('') + '</tr>';
      if (p.n === BREAK_AFTER) rows += '<tr class="break"><td colspan="6">☕ Break • 10:10 – 10:40</td></tr>';
    });
    return `<div class="card"><div class="toolbar"><div><label>Class</label><select id="adm-cls">${CLASSES.map(c => `<option ${c === admState.cls ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div><button class="btn btn-secondary btn-sm" data-act="print">🖨️ Print</button></div></div>
      <div class="table-wrap"><table class="tt"><thead><tr><th>Period</th>${DAYS.map((d, i) => `<th class="${i === day ? 'today' : ''}">${d}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function adminActivity() {
    return `<div class="card"><h3>School activity log</h3><div class="table-wrap"><table><thead><tr><th>When</th><th>Type</th><th>Activity</th></tr></thead><tbody>
      ${store.activity.slice(0, 100).map(a => `<tr><td style="white-space:nowrap">${fmtDT(a.t)}</td><td><span class="badge ${ACT_BADGE[a.type] || 'b-gray'}">${a.type}</span></td><td>${esc(a.text)}</td></tr>`).join('')}
      </tbody></table></div></div>`;
  }

  /* ===================== MODALS ===================== */
  function openModal(title, bodyHtml, footHtml) {
    $('#modal-root').innerHTML = `<div class="modal-back" data-act="close-bg"><div class="modal" role="dialog">
      <div class="modal-head"><h3>${title}</h3><button class="x" data-act="close">&times;</button></div>
      <div class="modal-body">${bodyHtml}</div>${footHtml ? `<div class="modal-foot">${footHtml}</div>` : ''}</div></div>`;
  }
  function closeModal() { $('#modal-root').innerHTML = ''; document.body.classList.remove('print-receipt'); }

  function payModal(pupil, bursarMode) {
    const bal = balanceOf(pupil);
    openModal(bursarMode ? 'Record payment' : 'Pay school fees',
      `<p class="muted" style="margin-top:0">${esc(pupil.name)} • Grade ${pupil.cls} • Balance <strong>${money(bal)}</strong></p>
       <label>Payment method</label><div class="pay-methods">${(bursarMode ? ['Cash', ...PAY_METHODS] : PAY_METHODS).map((m, i) =>
        `<label class="opt"><input type="radio" name="pm" value="${m}" ${i === 0 ? 'checked' : ''}>${m}</label>`).join('')}</div>
       <div id="phone-wrap" class="${bursarMode ? 'hidden' : ''}"><label>Mobile money number</label>
         <input id="pay-phone" placeholder="${bursarMode ? '' : PAY_NETWORKS[PAY_METHODS[0]].ph}" inputmode="tel" autocomplete="off">
         <div id="phone-hint" class="hint">${bursarMode ? '' : momoHint(PAY_METHODS[0])}</div></div>
       <label>Amount (K)</label><input id="pay-amt" type="number" min="1" max="${bal}" step="0.01" value="${bal}">
       ${bursarMode ? '' : '<p class="muted" style="font-size:12.5px">Demo mode: this simulates a mobile money prompt. No real money is moved.</p>'}
       <div id="pay-err" class="form-error"></div>`,
      `<button class="btn btn-secondary" data-act="close">Cancel</button><button class="btn btn-primary" id="pay-go" data-act="pay-go" data-id="${pupil.id}" data-bursar="${bursarMode ? 1 : 0}">${bursarMode ? 'Save payment' : 'Pay now'}</button>`);
  }
  function showReceipt(ref) {
    const x = store.payments.find(p => p.ref === ref), p = pupilById(x.pupilId);
    const paid = paidBy(p.id);
    openModal('Payment receipt', `<div class="receipt"><h4>${SCHOOL.name}</h4><div class="sub">Official fee receipt • ${SCHOOL.term} ${SCHOOL.year}</div>
      <div class="row"><span>Receipt no.</span><strong>${x.ref}</strong></div>
      <div class="row"><span>Date</span><span>${prettyDate(x.date)}</span></div>
      <div class="row"><span>Pupil</span><span>${esc(p.name)} (${p.id})</span></div>
      <div class="row"><span>Class</span><span>Grade ${p.cls}</span></div>
      <div class="row"><span>Method</span><span>${esc(x.method)}</span></div>
      ${x.phone ? `<div class="row"><span>Mobile number</span><span>${esc(x.phone)}</span></div>` : ''}
      <div class="row"><span>Term balance after payment</span><span>${money(Math.max(0, feeOf(p) - paid))}</span></div>
      <div class="row total"><span>Amount paid</span><span>${money(x.amount)}</span></div></div>`,
      `<button class="btn btn-secondary" data-act="close">Close</button><button class="btn btn-primary" data-act="print-receipt">🖨️ Print</button>`);
  }
  function submitPayment(pupilId, bursarMode) {
    const p = pupilById(pupilId), bal = balanceOf(p);
    const method = ($('input[name=pm]:checked') || {}).value;
    const amt = parseFloat($('#pay-amt').value), phone = $('#pay-phone').value.trim();
    const err = $('#pay-err'); err.textContent = '';
    if (!(amt > 0)) return err.textContent = 'Enter a valid amount.';
    if (amt > bal) return err.textContent = 'Amount cannot exceed the balance of ' + money(bal) + '.';
    let fullPhone = '';
    if (PAY_NETWORKS[method]) { const v = validateMomo(method, phone); if (!v.ok) return err.textContent = v.msg; fullPhone = v.full; }
    const finish = () => {
      const ref = 'RCP-' + Date.now().toString().slice(-8);
      store.payments.push({ ref, pupilId, amount: Math.round(amt * 100) / 100, method, phone: fullPhone, date: isoDate(new Date()), by: bursarMode ? me().name : 'Pupil' });
      logAct('payment', money(amt) + ' fee payment for ' + p.name + ' (' + method + ') ' + (bursarMode ? 'recorded by ' + me().name : 'paid online'));
      save(); render(); showReceipt(ref); toast('Payment recorded successfully');
    };
    if (bursarMode) return finish();
    const btn = $('#pay-go'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Processing…';
    setTimeout(finish, 1500);
  }

  /* ===================== EVENTS ===================== */
  document.addEventListener('click', e => {
    const nav = e.target.closest('#nav a'); if (nav) return go(nav.dataset.view);
    const r = e.target.closest('#role-switch button');
    if (r) {
      document.querySelectorAll('#role-switch button').forEach(b => b.classList.toggle('active', b === r));
      const L = { pupil: ['Pupil ID', 'e.g. LSS26-001'], teacher: ['Teacher ID', 'e.g. T001'], admin: ['Admin ID', 'e.g. HT001'] }[r.dataset.role];
      $('#login-id-label').textContent = L[0];
      $('#login-id').placeholder = L[1]; return;
    }
    if (e.target.id === 'menu-btn') return $('#sidebar').classList.toggle('open');
    if (e.target.id === 'logout-btn') { sessionStorage.removeItem('lui_session'); session = null; showLogin(); return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'close-bg' && e.target !== b) return;
    switch (a) {
      case 'close': case 'close-bg': closeModal(); break;
      case 'print': window.print(); break;
      case 'print-receipt': document.body.classList.add('print-receipt'); window.print(); break;
      case 'pay': payModal(me(), false); break;
      case 'record': payModal(pupilById(b.dataset.id), true); break;
      case 'pay-go': submitPayment(b.dataset.id, b.dataset.bursar === '1'); break;
      case 'receipt': showReceipt(b.dataset.ref); break;
      case 'reg-lesson': regState.cls = b.dataset.cls; regState.period = Number(b.dataset.per); regState.date = nowInfo().iso; go('register'); break;
      case 'cal-prev': case 'cal-next': case 'cal-today': {
        if (a === 'cal-today') { const n = new Date(); calState = { y: n.getFullYear(), m: n.getMonth() }; }
        else {
          calState.m += a === 'cal-prev' ? -1 : 1;
          if (calState.m < 0) { calState.m = 11; calState.y--; } if (calState.m > 11) { calState.m = 0; calState.y++; }
        }
        const cb = $('#cal-body'); if (cb) cb.innerHTML = calendarInner(); break;
      }
      case 'save-marks': {
        const subj = me().subject; let bad = false;
        document.querySelectorAll('.mark-in').forEach(i => {
          const raw = i.value.trim(), id = i.dataset.pupil;
          if (raw === '') { if (store.results[id]) delete store.results[id][subj]; return; }
          const v = Number(raw);
          if (!(v >= 0 && v <= 100)) { bad = true; i.style.borderColor = 'var(--red)'; return; }
          (store.results[id] = store.results[id] || {})[subj] = Math.round(v);
        });
        if (bad) return toast('Scores must be between 0 and 100.', true);
        logAct('marks', me().name + ' updated ' + subj + ' marks for Class ' + resState.cls);
        save(); render(); toast('Marks saved for ' + subj + ', Class ' + resState.cls); break;
      }
      case 'all-present': document.querySelectorAll('.seg input[value=P]').forEach(i => i.checked = true); break;
      case 'save-reg': {
        const rec = {}; document.querySelectorAll('.seg').forEach(s => { const c = s.querySelector('input:checked'); rec[s.dataset.pupil] = c ? c.value : 'P'; });
        store.register[regState.date + '|' + regState.cls + '|' + regState.period] = rec;
        logAct('register', me().name + ' saved the register for Class ' + regState.cls + ', Period ' + regState.period + ' (' + me().subject + ', ' + prettyDate(regState.date) + ')');
        save(); render();
        toast('Register saved for Class ' + regState.cls + ', Period ' + regState.period); break;
      }
    }
  });

  document.addEventListener('change', e => {
    if (e.target.id === 'reg-date') { regState.date = e.target.value || regState.date; render(); }
    else if (e.target.id === 'reg-cls') { regState.cls = e.target.value; render(); }
    else if (e.target.id === 'reg-per') { regState.period = Number(e.target.value); render(); }
    else if (e.target.id === 'res-cls') { resState.cls = e.target.value; render(); }
    else if (e.target.id === 'adm-cls') { admState.cls = e.target.value; render(); }
    else if (e.target.id === 'fee-cls') { feeFilter.cls = e.target.value; render(); }
    else if (e.target.name === 'pm') {
      const v = e.target.value, n = PAY_NETWORKS[v];
      $('#phone-wrap').classList.toggle('hidden', !n);
      if (n) { $('#pay-phone').placeholder = n.ph; $('#phone-hint').textContent = momoHint(v); $('#pay-err').textContent = ''; }
    }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'fee-q') {
      feeFilter.q = e.target.value; const pos = e.target.selectionStart; render();
      const q = $('#fee-q'); q.focus(); q.setSelectionRange(pos, pos);
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  $('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    const role = $('#role-switch .active').dataset.role;
    const id = $('#login-id').value.trim().toUpperCase(), pin = $('#login-pin').value;
    const user = role === 'pupil' ? pupilById(id) : role === 'teacher' ? teacherById(id) : ADMINS.find(a => a.id === id);
    if (!user || pin !== (user.pin || '1234')) { $('#login-error').textContent = 'Invalid ID or PIN. Please try again.'; return; }
    $('#login-error').textContent = ''; $('#login-form').reset();
    session = { role, id }; sessionStorage.setItem('lui_session', JSON.stringify(session));
    logAct('login', user.name + ' signed in (' + (role === 'admin' ? 'Head Teacher' : role) + ')'); save();
    showApp();
  });

  setInterval(tick, 1000); tick();
  boot();
})();
