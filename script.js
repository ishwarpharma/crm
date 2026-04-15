/* ══════════════════════════════════════════════════════════════
   script.js  —  IshwarCRM Dashboard
   Requires: users.js loaded before this in index.html
             Chart.js  loaded before this in index.html
   ══════════════════════════════════════════════════════════════ */

/* ── APP STATE ── */
let allData     = [];   // all rows visible to this user (restricted at login)
let currentUser = null; // logged-in user object from USERS
let chart       = null; // Chart.js instance

/* Dashboard filter state */
let selPeriod = '1m';
let selCo1    = '';     // Company filter 1
let selCo2    = '';     // Company filter 2 (optional)
let selArea   = '';
let selSM     = '';     // selected Sales Man (filter panel)
let selParty  = '';
let selItem   = '';


/* ══════════════════════════════════════
   LOGIN / LOGOUT
══════════════════════════════════════ */
function togglePw() {
  const el = document.getElementById('inp-pw');
  el.type = el.type === 'password' ? 'text' : 'password';
}

function attemptLogin() {
  const un  = document.getElementById('inp-un').value.trim().toUpperCase();
  const pw  = document.getElementById('inp-pw').value;
  const err = document.getElementById('login-err');

  const user = (typeof USERS !== 'undefined') ? USERS[un] : null;
  if (!user || user.password !== pw) {
    err.classList.remove('hidden');
    document.getElementById('inp-pw').value = '';
    return;
  }

  err.classList.add('hidden');
  currentUser = { username: un, ...user };

  /* Header sub-line: show what restrictions apply */
  document.getElementById('hdr-av').textContent = un.charAt(0);
  document.getElementById('hdr-co').textContent = buildAccessLabel(user);

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  loadCSV();
}

function buildAccessLabel(user) {
  const parts = [];
  if (user.companies) parts.push(user.companies.join(', '));
  else parts.push('All Companies');
  if (user.areas)    parts.push(user.areas.length === 1 ? user.areas[0] : user.areas.length + ' Areas');
  if (user.salesmen) parts.push(user.salesmen.join(', '));
  return parts.join(' · ');
}

/* Enter key on login */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' &&
      !document.getElementById('login-screen').classList.contains('hidden'))
    attemptLogin();
});

function logout() {
  currentUser = null;
  allData     = [];
  selPeriod = '1m'; selCo1 = ''; selCo2 = ''; selArea = ''; selSM = ''; selParty = ''; selItem = '';

  if (chart) { chart.destroy(); chart = null; }

  document.getElementById('inp-un').value = '';
  document.getElementById('inp-pw').value = '';
  document.getElementById('login-err').classList.add('hidden');

  document.querySelectorAll('.pb').forEach(b => b.classList.remove('active'));
  document.querySelector('.pb[data-p="1m"]').classList.add('active');
  ['co1','co2','area','sm'].forEach(k => clearSheetFilter(k, false));

  clearParty(false);
  clearItem(false);

  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}


/* ══════════════════════════════════════
   CSV LOADING & PARSING
══════════════════════════════════════ */
async function loadCSV() {
  showVeil(true);
  try {
    const res = await fetch('SWSA.csv');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    parseCSV(text);
    initDropdowns();
    renderAll();
  } catch (e) {
    alert('Could not load SWSA.csv.\nMake sure all 5 files are in the SAME folder.\n\n' + e.message);
  } finally {
    showVeil(false);
  }
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return;

  const header = csvLine(lines[0]);
  const col    = name => header.indexOf(name);

  const iSM    = col('Sales Men');
  const iDate  = col('Date');
  const iType  = col('Type');
  const iParty = col('Party Name');
  const iItem  = col('Item Name');
  const iQty   = col('Qty');
  const iRate  = col('Rate');
  const iDisc  = col('Discount');
  const iAmt   = col('Amount');
  const iCo    = col('Company Name');
  const iArea  = col('Area Name');
  const iBill  = col('Bill No#');

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln) continue;

    const c  = csvLine(ln);
    const co = (c[iCo] || '').trim();

    /* Skip blank, header-repeat, purely-numeric rows */
    if (!co || co === 'Company Name' || !isNaN(Number(co))) continue;

    const sm   = (c[iSM]    || '').trim();
    const area = (c[iArea]  || '').trim();

    /* ── USER ACCESS RESTRICTIONS ── */
    if (currentUser.companies && !currentUser.companies.includes(co))   continue;
    if (currentUser.areas     && !currentUser.areas.includes(area))     continue;
    if (currentUser.salesmen  && !currentUser.salesmen.includes(sm))    continue;

    rows.push({
      sm,
      bill:   (c[iBill]  || '').trim(),
      date:   parseDate((c[iDate] || '').trim()),
      type:   (c[iType]  || '').trim(),
      party:  (c[iParty] || '').trim(),
      item:   (c[iItem]  || '').trim(),
      qty:    parseFloat(c[iQty])  || 0,
      rate:   parseFloat(c[iRate]) || 0,
      disc:   parseFloat(c[iDisc]) || 0,
      amount: parseFloat(c[iAmt])  || 0,
      co,
      area,
    });
  }

  allData = rows;
}

/* Simple CSV splitter (handles quoted fields) */
function csvLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

/* Parse  dd-Mon-yy  OR  dd-mm-yyyy  OR  dd/mm/yyyy */
const MON = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,
  jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
};
function parseDate(s) {
  if (!s) return null;
  const p = s.split(/[-\/]/);
  if (p.length < 3) return null;
  const day = parseInt(p[0], 10);
  let month, year;
  if (isNaN(parseInt(p[1], 10))) {
    month = MON[p[1].toLowerCase().slice(0, 3)];
    year  = parseInt(p[2], 10);
    if (year < 100) year += year < 50 ? 2000 : 1900;
  } else {
    month = parseInt(p[1], 10) - 1;
    year  = parseInt(p[2], 10);
    if (year < 100) year += year < 50 ? 2000 : 1900;
  }
  if (isNaN(day) || month == null || isNaN(year)) return null;
  return new Date(year, month, day);
}


/* ══════════════════════════════════════
   SHEET SEARCH DATA — master lists
══════════════════════════════════════ */
let listCo   = [];   // all company names visible to user
let listArea = [];   // all areas
let listSM   = [];   // all salesmen

/* ══════════════════════════════════════
   DROPDOWN INIT
══════════════════════════════════════ */
function initDropdowns() {
  /* Companies */
  listCo = [...new Set(
    allData.map(r => r.co).filter(c => c && c !== 'Company Name')
  )].sort();

  /* Areas */
  listArea = [...new Set(
    allData.map(r => r.area).filter(a =>
      a && !a.startsWith('#') && a !== '..' && a !== 'Area Name'
    )
  )].sort();

  /* Sales Men — exclude discontinued X-prefix and SUSPENCE */
  listSM = [...new Set(
    allData.map(r => r.sm).filter(s =>
      s && s !== 'Sales Men' &&
      !s.toUpperCase().startsWith('X') &&
      !s.includes('SUSPENCE')
    )
  )].sort();
}


/* ══════════════════════════════════════
   PERIOD FILTER
══════════════════════════════════════ */
document.getElementById('pgrid').addEventListener('click', e => {
  const btn = e.target.closest('.pb');
  if (!btn) return;
  document.querySelectorAll('.pb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selPeriod = btn.dataset.p;
});

function applyPeriod(rows) {
  if (selPeriod === 'all') return rows;
  const now = new Date();
  let cut, cutEnd;

  if (selPeriod === '1m') {
    // This Month: 1st of current month → today (inclusive)
    cut    = new Date(now.getFullYear(), now.getMonth(), 1);
    cutEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // midnight tomorrow = includes today
    return rows.filter(r => r.date && r.date >= cut && r.date < cutEnd);

  } else if (selPeriod === 'lm') {
    // Last Month: 1st → last day of previous month
    cut    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    cutEnd = new Date(now.getFullYear(), now.getMonth(), 1); // midnight 1st of this month = end of last month
    return rows.filter(r => r.date && r.date >= cut && r.date < cutEnd);

  } else if (selPeriod === '3d') {
    // Last 3 Days: yesterday, day before, day before that (exclude today)
    cut    = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
    cutEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return rows.filter(r => r.date && r.date >= cut && r.date < cutEnd);

  } else if (selPeriod === '6m') {
    cut = new Date(now); cut.setMonth(cut.getMonth() - 6);
    return rows.filter(r => r.date && r.date >= cut);

  } else if (selPeriod === 'fy2526') {
    // Indian FY: 1 Apr 2025 – 31 Mar 2026
    cut    = new Date(2025, 3, 1);
    cutEnd = new Date(2026, 3, 1); // midnight 1 Apr 2026 = includes 31 Mar 2026
    return rows.filter(r => r.date && r.date >= cut && r.date < cutEnd);
  }

  return rows;
}


/* ══════════════════════════════════════
   BOTTOM SHEET
══════════════════════════════════════ */
function openSheet() {
  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('sheet').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeSheet() {
  document.getElementById('backdrop').classList.add('hidden');
  document.getElementById('sheet').classList.add('hidden');
  document.body.style.overflow = '';
}
function applySheet() {
  selCo1  = document.getElementById('co1-inp').dataset.val  || '';
  selCo2  = document.getElementById('co2-inp').dataset.val  || '';
  selArea = document.getElementById('area-inp').dataset.val || '';
  selSM   = document.getElementById('sm-inp').dataset.val   || '';
  closeSheet();
  renderAll();
}
function resetFilters() {
  selPeriod = '1m'; selCo1 = ''; selCo2 = ''; selArea = ''; selSM = ''; selParty = ''; selItem = '';
  document.querySelectorAll('.pb').forEach(b => b.classList.remove('active'));
  document.querySelector('.pb[data-p="1m"]').classList.add('active');
  ['co1','co2','area','sm'].forEach(k => clearSheetFilter(k, false));
  clearParty(false);
  clearItem(false);
  closeSheet();
  renderAll();
}


/* ══════════════════════════════════════
   SHEET SEARCH (Co1, Co2, Area, SM)
══════════════════════════════════════ */

/* Config for each sheet filter field */
const SHEET_CFG = {
  co1:  { list: () => listCo,   placeholder: 'All Companies',  icon: '🏭' },
  co2:  { list: () => listCo,   placeholder: '— None —',       icon: '🏭' },
  area: { list: () => listArea, placeholder: 'All Areas',       icon: '📍' },
  sm:   { list: () => listSM,   placeholder: 'All Sales Men',   icon: '👤' },
};

function onSheetSearch(key) {
  const inp  = document.getElementById(key + '-inp');
  const drop = document.getElementById(key + '-drop');
  const clr  = document.getElementById(key + '-clr');
  const q    = inp.value.trim();

  clr.classList.toggle('hidden', !inp.value);

  const list    = SHEET_CFG[key].list();
  const matches = fuzzySort(list, q).slice(0, 80);

  if (!matches.length) { drop.classList.add('hidden'); return; }

  drop.innerHTML = '';
  matches.forEach(name => {
    const d  = document.createElement('div');
    d.className = 'drop-item';
    const nm = document.createElement('span');
    nm.className = 'drop-name';
    nm.innerHTML = highlight(name, q);
    d.appendChild(nm);
    d.addEventListener('touchstart', e => { e.preventDefault(); selectSheetFilter(key, name); }, { passive: false });
    d.addEventListener('mousedown',  e => { e.preventDefault(); selectSheetFilter(key, name); });
    drop.appendChild(d);
  });
  drop.classList.remove('hidden');
}

function selectSheetFilter(key, value) {
  const inp = document.getElementById(key + '-inp');
  inp.value = value;
  inp.dataset.val = value;                        // store actual selected value
  document.getElementById(key + '-clr').classList.remove('hidden');
  document.getElementById(key + '-drop').classList.add('hidden');
  document.getElementById('sbox-' + key).classList.add('s-active');
}

function clearSheetFilter(key, doFocus = true) {
  const inp = document.getElementById(key + '-inp');
  inp.value = '';
  inp.dataset.val = '';
  document.getElementById(key + '-clr').classList.add('hidden');
  document.getElementById(key + '-drop').classList.add('hidden');
  document.getElementById('sbox-' + key).classList.remove('s-active');
  if (doFocus) inp.focus();
}

/* Close dropdowns when input loses focus */
['co1','co2','area','sm'].forEach(key => {
  document.getElementById(key + '-inp').addEventListener('blur', () => {
    setTimeout(() => document.getElementById(key + '-drop').classList.add('hidden'), 250);
  });
  /* If user types something but doesn't pick from dropdown, clear the stored val */
  document.getElementById(key + '-inp').addEventListener('input', () => {
    document.getElementById(key + '-inp').dataset.val = '';
    document.getElementById('sbox-' + key).classList.remove('s-active');
  });
});


/* ══════════════════════════════════════
   BADGE + CHIPS
══════════════════════════════════════ */
function updateBadge() {
  let n = 0;
  if (selPeriod !== '1m') n++;   // 1m = This Month = default, don't count it
  if (selCo1)    n++;
  if (selCo2)    n++;
  if (selArea)   n++;
  if (selSM)     n++;
  if (selParty)  n++;
  if (selItem)   n++;
  const el = document.getElementById('fbadge');
  if (n) { el.textContent = n; el.classList.remove('hidden'); }
  else   { el.classList.add('hidden'); }
}

function updateChips() {
  const row = document.getElementById('chips-row');
  row.innerHTML = '';

  const addChip = (label, onRemove) => {
    const c  = document.createElement('div'); c.className = 'chip';
    const lbl = document.createElement('span'); lbl.textContent = label;
    const x  = document.createElement('button'); x.className = 'chip-x'; x.textContent = '✕';
    x.setAttribute('aria-label', 'Remove ' + label);
    x.addEventListener('click', onRemove);
    c.appendChild(lbl); c.appendChild(x); row.appendChild(c);
  };

  if (selParty) addChip('Party: '   + truncate(selParty, 22), () => clearParty(true));
  if (selItem)  addChip('Item: '    + truncate(selItem,  22), () => clearItem(true));
  if (selCo1)   addChip('Co: '      + truncate(selCo1,  20), () => {
    selCo1 = ''; document.getElementById('co1-sel').value = ''; renderAll();
  });
  if (selCo2)   addChip('Co2: '     + truncate(selCo2,  20), () => {
    selCo2 = ''; document.getElementById('co2-sel').value = ''; renderAll();
  });
  if (selSM)    addChip('SM: '      + truncate(selSM,   22), () => {
    selSM = ''; document.getElementById('sm-sel').value = ''; renderAll();
  });
  if (selArea)  addChip('Area: '    + selArea, () => {
    selArea = ''; document.getElementById('area-sel').value = ''; renderAll();
  });
  if (selPeriod !== '1m') {
    const labels = { 'all': 'All Time', 'lm': 'Last Month', '3d': 'Last 3 Days', '6m': 'Last 6M', 'fy2526': 'FY 25-26' };
    addChip(labels[selPeriod] || selPeriod, () => {
      selPeriod = '1m';
      document.querySelectorAll('.pb').forEach(b => b.classList.remove('active'));
      document.querySelector('.pb[data-p="1m"]').classList.add('active');
      renderAll();
    });
  }

  row.classList.toggle('hidden', row.children.length === 0);
}


/* ══════════════════════════════════════
   MAIN FILTER + RENDER
══════════════════════════════════════ */
function getFiltered() {
  let d = applyPeriod(allData);
  // Company filter: if co1 set, show co1 (and co2 if also set)
  if (selCo1 && selCo2) d = d.filter(r => r.co === selCo1 || r.co === selCo2);
  else if (selCo1)      d = d.filter(r => r.co === selCo1);
  if (selArea)  d = d.filter(r => r.area  === selArea);
  if (selSM)    d = d.filter(r => r.sm    === selSM);
  if (selParty) d = d.filter(r => r.party === selParty);
  if (selItem)  d = d.filter(r => r.item  === selItem);
  return d;
}

function renderAll() {
  const data = getFiltered();
  renderKPIs(data);
  renderChart(data);
  renderTables(data);
  updateChips();
  updateBadge();
}


/* ══════════════════════════════════════
   KPIs
══════════════════════════════════════ */
function fmtMoney(n) {
  if (n >= 1e7)  return '₹' + (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5)  return '₹' + (n / 1e5).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + Math.round(n / 1000) + 'K';
  return '₹' + n.toFixed(0);
}
function fmtNum(n) {
  return n >= 1000 ? Math.round(n / 1000) + 'K' : n.toLocaleString('en-IN');
}

function renderKPIs(data) {
  const total   = data.reduce((s, r) => s + r.amount, 0);
  const parties = new Set(data.map(r => r.party).filter(Boolean)).size;
  const items   = new Set(data.map(r => r.item).filter(Boolean)).size;
  const bills   = new Set(data.map(r => r.bill).filter(Boolean)).size;

  document.getElementById('k-sales').textContent    = fmtMoney(total);
  document.getElementById('k-sales-sub').textContent = data.length.toLocaleString('en-IN') + ' transactions';
  document.getElementById('k-parties').textContent  = fmtNum(parties);
  document.getElementById('k-items').textContent    = fmtNum(items);
  document.getElementById('k-bills').textContent    = fmtNum(bills);
}


/* ══════════════════════════════════════
   CHART
══════════════════════════════════════ */
function buildMonthly(data) {
  const map = {};
  data.forEach(r => {
    if (!r.date) return;
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
    map[key] = (map[key] || 0) + r.amount;
  });
  const keys = Object.keys(map).sort();
  return {
    labels: keys.map(k => {
      const [y, m] = k.split('-');
      return new Date(+y, +m - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
    }),
    values: keys.map(k => map[k]),
  };
}

function renderChart(data) {
  const { labels, values } = buildMonthly(data);

  let ttl = 'Monthly Trend';
  if (selSM)     ttl = truncate(selSM, 28);
  if (selParty)  ttl = truncate(selParty, 28);
  if (selItem)   ttl = truncate(selItem, 28);

  document.getElementById('chart-ttl').textContent = ttl;
  document.getElementById('chart-tag').textContent = labels.length + ' months';

  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();

  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(37,99,235,.75)');
  grad.addColorStop(1, 'rgba(37,99,235,.15)');

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Sales',
        data: values,
        backgroundColor: values.map((_, i) =>
          i === values.length - 1 ? 'rgba(37,99,235,1)' : grad
        ),
        borderRadius: 5,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(37,99,235,.95)',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: c => fmtMoney(c.parsed.y) },
          backgroundColor: '#0d1b3e',
          titleColor: '#94a3b8',
          bodyColor: '#fff',
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'Sora'", size: 10 },
            color: '#94a3b8',
            maxRotation: 40,
            autoSkip: true,
            maxTicksLimit: 12,
          },
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { family: "'JetBrains Mono'", size: 10 },
            color: '#94a3b8',
            callback: v => fmtMoney(v),
          },
        },
      },
      animation: { duration: 350, easing: 'easeOutQuart' },
    },
  });
}


/* ══════════════════════════════════════
   TABLES
══════════════════════════════════════ */
function groupBy(data, key) {
  const map = {};
  data.forEach(r => {
    if (!r[key]) return;
    map[r[key]] = (map[r[key]] || 0) + r.amount;
  });
  return Object.entries(map)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function renderTables(data) {
  /* Party table */
  const pRows = groupBy(data, 'party');
  let pTitle = 'Party Sales';
  if (selItem)       pTitle = 'Parties — ' + truncate(selItem, 20);
  else if (selParty) pTitle = truncate(selParty, 26);
  document.getElementById('pty-ttl').textContent = pTitle;
  document.getElementById('pty-cnt').textContent = pRows.length + ' parties';
  fillTable('pty-body', pRows, 'party');

  /* Item table */
  const iRows = groupBy(data, 'item');
  let iTitle = 'Item Sales';
  if (selParty)     iTitle = 'Items — ' + truncate(selParty, 20);
  else if (selItem) iTitle = truncate(selItem, 26);
  document.getElementById('itm-ttl').textContent = iTitle;
  document.getElementById('itm-cnt').textContent = iRows.length + ' items';
  fillTable('itm-body', iRows, 'item');

  /* Company table */
  const coRows = groupBy(data, 'co');
  document.getElementById('co-ttl').textContent = 'Company Sales';
  document.getElementById('co-cnt').textContent = coRows.length + ' companies';
  fillTableSimple('co-body', coRows);

  /* Area table */
  const aRows = groupBy(data, 'area');
  document.getElementById('area-ttl').textContent = 'Area Sales';
  document.getElementById('area-cnt').textContent = aRows.length + ' areas';
  fillTableSimple('area-body', aRows);

  /* Sales Men table */
  const smRows = groupBy(data, 'sm').filter(r =>
    r.name && !r.name.toUpperCase().startsWith('X') && !r.name.includes('SUSPENCE')
  );
  document.getElementById('sm-ttl').textContent = 'Sales Men';
  document.getElementById('sm-cnt').textContent = smRows.length + ' salesmen';
  fillTableSimple('sm-body', smRows);
}

function fillTable(tbodyId, rows, type) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align:center;padding:28px;color:var(--text3);font-size:.8rem;">No data</td></tr>';
    return;
  }

  const active = type === 'party' ? selParty : selItem;

  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    if (row.name === active) tr.classList.add('row-sel');

    const td0 = document.createElement('td'); td0.textContent = i + 1;
    const td1 = document.createElement('td'); td1.textContent = row.name; td1.title = row.name;
    const td2 = document.createElement('td'); td2.textContent = fmtMoney(row.amount);

    tr.appendChild(td0); tr.appendChild(td1); tr.appendChild(td2);
    tr.addEventListener('click', () => {
      type === 'party' ? setParty(row.name) : setItem(row.name);
    });
    tbody.appendChild(tr);
  });
}


/* Simple table — no click drill, just display */
function fillTableSimple(tbodyId, rows) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';
  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align:center;padding:28px;color:var(--text3);font-size:.8rem;">No data</td></tr>';
    return;
  }
  rows.forEach((row, i) => {
    const tr  = document.createElement('tr');
    const td0 = document.createElement('td'); td0.textContent = i + 1;
    const td1 = document.createElement('td'); td1.textContent = row.name; td1.title = row.name;
    const td2 = document.createElement('td'); td2.textContent = fmtMoney(row.amount);
    tr.appendChild(td0); tr.appendChild(td1); tr.appendChild(td2);
    tbody.appendChild(tr);
  });
}


/* ══════════════════════════════════════
   SEARCH — PARTY
══════════════════════════════════════ */
function onPartyInput() {
  const v = document.getElementById('party-inp').value;
  document.getElementById('party-clr').classList.toggle('hidden', !v);
  document.getElementById('sbox-party').classList.toggle('s-active', !!selParty);
  showPartyDrop();
}

function showPartyDrop() {
  const q    = document.getElementById('party-inp').value.trim();
  const drop = document.getElementById('party-drop');

  /* Base = period + area + SM filtered, no party/item drill */
  const base = getBase();
  const pmap = {};
  base.forEach(r => { if (r.party) pmap[r.party] = (pmap[r.party] || 0) + r.amount; });

  const matches = fuzzySort(Object.keys(pmap), q).slice(0, 60);
  if (!matches.length) { drop.classList.add('hidden'); return; }

  drop.innerHTML = '';
  matches.forEach(name => {
    const d  = document.createElement('div'); d.className = 'drop-item';
    const nm = document.createElement('span'); nm.className = 'drop-name'; nm.innerHTML = highlight(name, q);
    const am = document.createElement('span'); am.className = 'drop-amt';  am.textContent = fmtMoney(pmap[name]);
    d.appendChild(nm); d.appendChild(am);
    d.addEventListener('touchstart', e => { e.preventDefault(); setParty(name); }, { passive: false });
    d.addEventListener('mousedown',  e => { e.preventDefault(); setParty(name); });
    drop.appendChild(d);
  });
  drop.classList.remove('hidden');
}

function setParty(name) {
  selParty = name; selItem = '';
  document.getElementById('party-inp').value = name;
  document.getElementById('party-clr').classList.remove('hidden');
  document.getElementById('sbox-party').classList.add('s-active');
  document.getElementById('party-drop').classList.add('hidden');
  document.getElementById('item-inp').value = '';
  document.getElementById('item-clr').classList.add('hidden');
  document.getElementById('sbox-item').classList.remove('s-active');
  renderAll();
}

function clearParty(doRender = true) {
  selParty = '';
  document.getElementById('party-inp').value = '';
  document.getElementById('party-clr').classList.add('hidden');
  document.getElementById('sbox-party').classList.remove('s-active');
  document.getElementById('party-drop').classList.add('hidden');
  if (doRender) renderAll();
}

document.getElementById('party-inp').addEventListener('blur', () => {
  setTimeout(() => document.getElementById('party-drop').classList.add('hidden'), 250);
});


/* ══════════════════════════════════════
   SEARCH — ITEM
══════════════════════════════════════ */
function onItemInput() {
  const v = document.getElementById('item-inp').value;
  document.getElementById('item-clr').classList.toggle('hidden', !v);
  showItemDrop();
}

function showItemDrop() {
  const q    = document.getElementById('item-inp').value.trim();
  const drop = document.getElementById('item-drop');

  const base = getBase();
  const imap = {};
  base.forEach(r => { if (r.item) imap[r.item] = (imap[r.item] || 0) + r.amount; });

  const matches = fuzzySort(Object.keys(imap), q).slice(0, 60);
  if (!matches.length) { drop.classList.add('hidden'); return; }

  drop.innerHTML = '';
  matches.forEach(name => {
    const d  = document.createElement('div'); d.className = 'drop-item';
    const nm = document.createElement('span'); nm.className = 'drop-name'; nm.innerHTML = highlight(name, q);
    const am = document.createElement('span'); am.className = 'drop-amt';  am.textContent = fmtMoney(imap[name]);
    d.appendChild(nm); d.appendChild(am);
    d.addEventListener('touchstart', e => { e.preventDefault(); setItem(name); }, { passive: false });
    d.addEventListener('mousedown',  e => { e.preventDefault(); setItem(name); });
    drop.appendChild(d);
  });
  drop.classList.remove('hidden');
}

function setItem(name) {
  selItem = name; selParty = '';
  document.getElementById('item-inp').value = name;
  document.getElementById('item-clr').classList.remove('hidden');
  document.getElementById('sbox-item').classList.add('s-active');
  document.getElementById('item-drop').classList.add('hidden');
  document.getElementById('party-inp').value = '';
  document.getElementById('party-clr').classList.add('hidden');
  document.getElementById('sbox-party').classList.remove('s-active');
  renderAll();
}

function clearItem(doRender = true) {
  selItem = '';
  document.getElementById('item-inp').value = '';
  document.getElementById('item-clr').classList.add('hidden');
  document.getElementById('sbox-item').classList.remove('s-active');
  document.getElementById('item-drop').classList.add('hidden');
  if (doRender) renderAll();
}

document.getElementById('item-inp').addEventListener('blur', () => {
  setTimeout(() => document.getElementById('item-drop').classList.add('hidden'), 250);
});


/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */

/* Base data = period + area + SM applied (no party/item drill)
   Used to populate search dropdowns */
function getBase() {
  let d = applyPeriod(allData);
  if (selCo1 && selCo2) d = d.filter(r => r.co === selCo1 || r.co === selCo2);
  else if (selCo1)      d = d.filter(r => r.co === selCo1);
  if (selArea) d = d.filter(r => r.area === selArea);
  if (selSM)   d = d.filter(r => r.sm   === selSM);
  return d;
}

/* Fuzzy search — sorted by match quality */
function fuzzySort(list, q) {
  if (!q) return list;
  const lq = q.toLowerCase();
  const scored = list.map(name => {
    const ln = name.toLowerCase();
    if (ln.startsWith(lq))  return { name, s: 3 };
    if (ln.includes(lq))    return { name, s: 2 };
    if (fuzzyMatch(ln, lq)) return { name, s: 1 };
    return null;
  }).filter(Boolean);
  scored.sort((a, b) => b.s - a.s);
  return scored.map(x => x.name);
}

function fuzzyMatch(str, q) {
  let qi = 0;
  for (let i = 0; i < str.length && qi < q.length; i++)
    if (str[i] === q[qi]) qi++;
  return qi === q.length;
}

function highlight(text, q) {
  if (!q) return escHtml(text);
  return escHtml(text).replace(
    new RegExp(`(${escRe(q)})`, 'gi'),
    '<mark>$1</mark>'
  );
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
function showVeil(on) {
  document.getElementById('veil').style.display = on ? 'flex' : 'none';
}
