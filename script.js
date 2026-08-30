/* ══════════════════════════════════════════════════════════════
   script.js  —  IshwarCRM Dashboard
   Requires: users.js loaded before this in index.html
             Chart.js  loaded before this in index.html
   ══════════════════════════════════════════════════════════════ */

/* ── APP STATE ── */
let allData     = [];   // all rows visible to this user (restricted at login)
let currentUser = null; // logged-in user object from USERS
let chart       = null; // Chart.js instance
let swsaUpdatedAt = ''; // formatted date & time SWSA.csv was last modified on the server

/* Dashboard filter state */
let selPeriod = '1m';
let selCo1    = '';     // Company filter 1
let selCo2    = '';     // Company filter 2 (optional)
let selArea   = '';
let selSM     = '';     // selected Sales Man (filter panel)
let selParty  = '';
let selItem   = '';


/* ══════════════════════════════════════
   PIN LOGIN
══════════════════════════════════════ */
let pinValue = '';   // current PIN being entered

const LS_KEY = 'ishwarcrm_pin';  // localStorage key

/* ── Auto-login on page load if PIN saved on this device ── */
window.addEventListener('DOMContentLoaded', () => {
  // PWA gate check: if not installed, gate blocks everything — do nothing here.
  // The gate script (loaded after this) will hide login-screen. We only proceed
  // if running as an installed PWA (window.isInstalledPWA defined by gate script,
  // but since both run on DOMContentLoaded, we defer auto-login by one microtask).
  setTimeout(() => {
    // If gate is blocking, bail out — gate script manages visibility
    const gate = document.getElementById('pwa-gate');
    if (gate && !gate.classList.contains('hidden')) return;

    const savedPin = localStorage.getItem(LS_KEY);
    if (savedPin) {
      const entry = (typeof USERS !== 'undefined')
        ? Object.entries(USERS).find(([, u]) => u.pin === savedPin)
        : null;
      if (entry) {
        // Valid saved PIN — log in silently, skip PIN screen
        const [un, user] = entry;
        currentUser = { username: un, ...user };
        document.getElementById('hdr-co').textContent = user.displayName || un;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        loadCSV();
        return;
      } else {
        // Saved PIN no longer valid (user removed) — clear it
        localStorage.removeItem(LS_KEY);
      }
    }
    // No saved PIN — login screen already visible (revealed by gate check)
  }, 0);
});

function focusPin() {
  document.getElementById('pin-hidden').focus();
}

/* Called when hidden input changes (mobile keyboard) */
function onPinInput(val) {
  const digits = String(val).replace(/\D/g, '').slice(0, 6);
  pinValue = digits;
  updatePinDots();
  if (digits.length === 6) attemptLogin();
}

/* Called by on-screen keypad */
function padPress(digit) {
  if (pinValue.length >= 6) return;
  pinValue += digit;
  updatePinDots();
  if (pinValue.length === 6) attemptLogin();
}
function padDel() {
  pinValue = pinValue.slice(0, -1);
  updatePinDots();
  document.getElementById('login-err').classList.add('hidden');
}
function padClear() {
  pinValue = '';
  updatePinDots();
  document.getElementById('login-err').classList.add('hidden');
}

function updatePinDots() {
  for (let i = 0; i < 6; i++) {
    const dot = document.getElementById('pd' + i);
    dot.classList.toggle('filled', i < pinValue.length);
    dot.classList.remove('error');
  }
}

function shakeDots() {
  for (let i = 0; i < 6; i++) {
    document.getElementById('pd' + i).classList.add('error');
  }
  setTimeout(() => { pinValue = ''; updatePinDots(); }, 700);
}

function attemptLogin() {
  const err = document.getElementById('login-err');
  const pin = pinValue.trim();

  const entry = (typeof USERS !== 'undefined')
    ? Object.entries(USERS).find(([, u]) => u.pin === pin)
    : null;

  if (!entry) {
    err.classList.remove('hidden');
    shakeDots();
    const hi = document.getElementById('pin-hidden');
    if (hi) hi.value = '';
    return;
  }

  err.classList.add('hidden');
  const [un, user] = entry;
  currentUser = { username: un, ...user };

  // ── Save PIN to this device so next visit is automatic ──
  try { localStorage.setItem(LS_KEY, pin); } catch(e) {}

  document.getElementById('hdr-co').textContent = user.displayName || un;
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

/* Physical keyboard support on desktop */
document.addEventListener('keydown', e => {
  if (document.getElementById('login-screen').classList.contains('hidden')) return;
  if (e.key >= '0' && e.key <= '9') padPress(e.key);
  else if (e.key === 'Backspace')    padDel();
  else if (e.key === 'Escape')       padClear();
});

/* logout() removed — PIN is permanent once installed */


/* ══════════════════════════════════════
   CSV LOADING & PARSING
══════════════════════════════════════ */
async function loadCSV() {
  showVeil(true);
  try {
    const res = await fetch('swsa.csv', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    // Capture the file's actual last-modified date & time from the server
    // (Last-Modified header is always GMT — force display in India Standard Time)
    const lm = res.headers.get('Last-Modified');
    if (lm) {
      const d = new Date(lm);
      swsaUpdatedAt = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
        + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    } else {
      swsaUpdatedAt = '';
    }

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

  const header    = csvLine(lines[0]);
  const headerLC  = header.map(h => h.trim().toLowerCase());
  /* Accepts any number of alternate header names (old-format / new-format
     from the software provider) and returns the first one found. */
  const col = (...names) => {
    for (const n of names) {
      const idx = headerLC.indexOf(n.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const iSM    = col('Sales Men', 'SALESMEN');
  const iDate  = col('Date', 'C_DATE');
  const iType  = col('Type', 'TYPE2');
  const iParty = col('Party Name', 'PNAME');
  const iItem  = col('Item Name', 'NAME');
  const iQty   = col('Qty', 'QTY');
  const iRate  = col('Rate', 'RATE');
  const iDisc  = col('Discount', 'DISCOUNT');
  const iAmt   = col('Amount', 'AMOUNT');
  const iCo    = col('Company Name', 'COMPANY');
  const iArea  = col('Area Name', 'AREANAME');
  const iBill  = col('Bill No#', 'VCN');

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln) continue;

    const c  = csvLine(ln);
    const co = (c[iCo] || '').trim();

    /* Skip blank, header-repeat, purely-numeric rows */
    if (!co || co === 'Company Name' || co === 'COMPANY' || !isNaN(Number(co))) continue;

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
/* Shared period setter — keeps pgrid (sheet) + ppill (home) in sync */
function setPeriod(p) {
  selPeriod = p;
  document.querySelectorAll('.pb').forEach(b =>
    b.classList.toggle('active', b.dataset.p === p));
  document.querySelectorAll('.ppill').forEach(b =>
    b.classList.toggle('active', b.dataset.p === p));
  renderAll();
}

document.getElementById('pgrid').addEventListener('click', e => {
  const btn = e.target.closest('.pb');
  if (!btn) return;
  setPeriod(btn.dataset.p);
});

document.getElementById('period-pills').addEventListener('click', e => {
  const btn = e.target.closest('.ppill');
  if (!btn) return;
  setPeriod(btn.dataset.p);
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
  document.querySelectorAll('.ppill').forEach(b => b.classList.toggle('active', b.dataset.p === '1m'));
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

  const list = SHEET_CFG[key].list();
  // If blank → show ALL options so user can scroll & browse
  const matches = q ? fuzzySort(list, q) : list;

  if (!matches.length) { drop.classList.add('hidden'); return; }

  drop.innerHTML = '';
  matches.forEach(name => {
    const d  = document.createElement('div');
    d.className = 'drop-item sheet-drop-item';
    const nm = document.createElement('span');
    nm.className = 'drop-name';
    nm.innerHTML = highlight(name, q);
    d.appendChild(nm);

    /* ── SCROLL-SAFE TAP DETECTION ──
       Record touch start position. On touchend, only select
       if finger moved less than 8px — otherwise it was a scroll. */
    let touchStartY = null;
    d.addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    d.addEventListener('touchend', e => {
      if (touchStartY === null) return;
      const moved = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (moved < 8) {
        e.preventDefault();
        selectSheetFilter(key, name);
      }
      touchStartY = null;
    }, { passive: false });

    /* Mouse click for desktop */
    d.addEventListener('mousedown', e => {
      e.preventDefault();
      selectSheetFilter(key, name);
    });

    drop.appendChild(d);
  });
  drop.classList.remove('hidden');
}

function selectSheetFilter(key, value) {
  const inp = document.getElementById(key + '-inp');
  inp.value = value;
  inp.dataset.val = value;
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
    setTimeout(() => document.getElementById(key + '-drop').classList.add('hidden'), 300);
  });
  /* If user types something but doesn't pick, clear the stored val */
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
  if (selCo1)   addChip('Co: '   + truncate(selCo1,  20), () => toggleCo(selCo1));
  if (selCo2)   addChip('Co2: '  + truncate(selCo2,  20), () => { selCo2 = ''; const i = document.getElementById('co2-inp'); if(i){i.value='';i.dataset.val='';} renderAll(); });
  if (selSM)    addChip('SM: '   + truncate(selSM,   22), () => toggleSM(selSM));
  if (selArea)  addChip('Area: ' + selArea,               () => toggleArea(selArea));
  if (selPeriod !== '1m') {
    const labels = { 'all': 'All Time', 'lm': 'Last Month', '3d': 'Last 3 Days', '6m': 'Last 6M', 'fy2526': 'FY 25-26' };
    addChip(labels[selPeriod] || selPeriod, () => {
      setPeriod('1m');
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

  // Show file update date & time (from SWSA.csv's server Last-Modified) instead of no. of transactions
  document.getElementById('k-sales-sub').textContent = swsaUpdatedAt ? 'Updated ' + swsaUpdatedAt : data.length.toLocaleString('en-IN') + ' transactions';

//  changed above line to show SWSA.csv file update date & time instead of transaction count/last txn date.
//   document.getElementById('k-sales-sub').textContent = data.length.toLocaleString('en-IN') + ' transactions';
  
   
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
  if (selCo1)    ttl = truncate(selCo1, 28);
  if (selArea)   ttl = truncate(selArea, 28);
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
  const coRows = groupBy(data, 'co').sort((a, b) => a.name.localeCompare(b.name));
  document.getElementById('co-ttl').textContent = 'Company Sales';
  document.getElementById('co-cnt').textContent = coRows.length + ' companies';
  fillTableSimple('co-body', coRows, 'co');

  /* Area table */
  const aRows = groupBy(data, 'area');
  document.getElementById('area-ttl').textContent = 'Area Sales';
  document.getElementById('area-cnt').textContent = aRows.length + ' areas';
  fillTableSimple('area-body', aRows, 'area');

  /* Sales Men table */
  const smRows = groupBy(data, 'sm').filter(r =>
    r.name && !r.name.toUpperCase().startsWith('X') && !r.name.includes('SUSPENCE')
  ).sort((a, b) => a.name.localeCompare(b.name));
  document.getElementById('sm-ttl').textContent = 'Sales Men';
  document.getElementById('sm-cnt').textContent = smRows.length + ' salesmen';
  fillTableSimple('sm-body', smRows, 'sm');
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


/* Clickable table for co / area / sm — clicking applies that as a filter */
function fillTableSimple(tbodyId, rows, type) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';
  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align:center;padding:28px;color:var(--text3);font-size:.8rem;">No data</td></tr>';
    return;
  }
  const active = type === 'co' ? selCo1 : type === 'area' ? selArea : selSM;
  rows.forEach((row, i) => {
    const tr  = document.createElement('tr');
    tr.classList.add('row-clickable');
    if (row.name === active) tr.classList.add('row-sel');
    const td0 = document.createElement('td'); td0.textContent = i + 1;
    const td1 = document.createElement('td'); td1.textContent = row.name; td1.title = row.name;
    const td2 = document.createElement('td'); td2.textContent = fmtMoney(row.amount);
    tr.appendChild(td0); tr.appendChild(td1); tr.appendChild(td2);
    // Same touch-safe pattern as party/item rows
    let _tsY = null;
    tr.addEventListener('touchstart', e => { _tsY = e.touches[0].clientY; }, { passive: true });
    tr.addEventListener('touchend', e => {
      if (_tsY === null) return;
      if (Math.abs(e.changedTouches[0].clientY - _tsY) < 8) {
        e.preventDefault();
        if (type === 'co')   toggleCo(row.name);
        if (type === 'area') toggleArea(row.name);
        if (type === 'sm')   toggleSM(row.name);
      }
      _tsY = null;
    }, { passive: false });
    tr.addEventListener('mousedown', e => {
      e.preventDefault();
      if (type === 'co')   toggleCo(row.name);
      if (type === 'area') toggleArea(row.name);
      if (type === 'sm')   toggleSM(row.name);
    });
    tbody.appendChild(tr);
  });
}

/* Toggle functions — click same row again to deselect */
function toggleCo(name) {
  selCo1 = (selCo1 === name) ? '' : name;
  selCo2 = '';
  // Sync filter sheet inputs
  const inp1 = document.getElementById('co1-inp');
  if (inp1) { inp1.value = selCo1; inp1.dataset.val = selCo1; }
  const inp2 = document.getElementById('co2-inp');
  if (inp2) { inp2.value = ''; inp2.dataset.val = ''; }
  renderAll();
}
function toggleArea(name) {
  selArea = (selArea === name) ? '' : name;
  const inp = document.getElementById('area-inp');
  if (inp) { inp.value = selArea; inp.dataset.val = selArea; }
  renderAll();
}
function toggleSM(name) {
  selSM = (selSM === name) ? '' : name;
  const inp = document.getElementById('sm-inp');
  if (inp) { inp.value = selSM; inp.dataset.val = selSM; }
  renderAll();
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
