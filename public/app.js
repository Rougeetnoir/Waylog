/* ── State ──────────────────────────────────────────────────────── */
const state = {
  trips: [],
  currentId: null,
  activeDay: 'all',
};

/* ── API ────────────────────────────────────────────────────────── */
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ── Helpers ────────────────────────────────────────────────────── */
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function trip() {
  return state.trips.find(t => t.id === state.currentId) || null;
}

// Get array of date strings (YYYY-MM-DD) for each day of the trip
function tripDays(t) {
  if (!t.startDate || !t.endDate) return [];
  const days = [];
  const start = new Date(t.startDate + 'T00:00:00');
  const end   = new Date(t.endDate   + 'T00:00:00');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// Day number within the trip (1-based), or 0 if not in range
function dayNumber(t, dateStr) {
  const days = tripDays(t);
  const idx = days.indexOf(dateStr);
  return idx === -1 ? 0 : idx + 1;
}

function formatDateCN(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weeks = ['周日','周一','周二','周三','周四','周五','周六'];
  return `${m}月${day}日（${weeks[d.getDay()]}）`;
}

function formatDateRange(s, e) {
  if (!s) return '';
  const fmt = d => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getMonth()+1}月${dt.getDate()}日`;
  };
  return e ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}

// Sort activities by date then time
function sortActivities(acts) {
  return [...acts].sort((a, b) => {
    const da = (a.date || '') + (a.time || '');
    const db = (b.date || '') + (b.time || '');
    return da.localeCompare(db);
  });
}

/* ── Init ───────────────────────────────────────────────────────── */
async function init() {
  state.trips = await api('GET', '/trips');
  // Restore last selected trip
  const savedId = localStorage.getItem('currentTripId');
  if (savedId && state.trips.find(t => t.id === savedId)) {
    state.currentId = savedId;
  } else if (state.trips.length > 0) {
    state.currentId = state.trips[0].id;
  }
  render();
}

/* ── Render ─────────────────────────────────────────────────────── */
function render() {
  renderSidebar();
  renderMain();
}

function renderSidebar() {
  const el = document.getElementById('tripList');
  if (state.trips.length === 0) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text3);padding:10px 8px;">还没有行程</div>';
    return;
  }
  el.innerHTML = state.trips.map(t => `
    <div class="trip-item ${t.id === state.currentId ? 'active' : ''}"
         onclick="selectTrip('${esc(t.id)}')">
      <div class="trip-item-name">${esc(t.name)}</div>
      <div class="trip-item-meta">${esc(t.destination || '—')} · ${formatDateRange(t.startDate, t.endDate) || '未设日期'}</div>
    </div>
  `).join('');
}

function renderMain() {
  const t = trip();
  const tripView   = document.getElementById('tripView');
  const emptyState = document.getElementById('emptyState');
  if (!t) {
    tripView.style.display   = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';
  tripView.style.display   = 'block';
  tripView.innerHTML = buildTripHTML(t);
}

function buildTripHTML(t) {
  const days = tripDays(t);
  return `
    ${renderTripHeader(t)}
    ${t.hotels.map(h => renderHotelCard(h, t.id)).join('')}
    ${t.flights.length ? `<div class="flights-section">${t.flights.map(f => renderFlightCard(f, t.id)).join('')}</div>` : ''}
    <div class="action-bar">
      <button class="btn-ghost" onclick="openActivityModal()">+ 添加行程</button>
      <button class="btn-ghost" onclick="openFlightModal()">+ 添加航班</button>
      <button class="btn-ghost" onclick="openHotelModal()">+ 添加住宿</button>
    </div>
    ${t.activities.length === 0 && t.hotels.length === 0 && t.flights.length === 0 ? `
      <div style="font-size:12px;color:var(--text3);padding:12px 0 8px;font-style:italic;">
        点击上方按钮开始添加内容
      </div>
    ` : ''}
    ${renderFilterBar(t, days)}
    ${renderLegend()}
    <div id="allDays">
      ${renderTimeline(t, days)}
    </div>
  `;
}

function renderTripHeader(t) {
  return `
    <div class="trip-header">
      <div>
        <h2 class="trip-title">${esc(t.name)}</h2>
        <div class="trip-meta">${formatDateRange(t.startDate, t.endDate) || '未设日期'}${t.destination ? ' · ' + esc(t.destination) : ''}</div>
      </div>
      <div class="trip-header-actions">
        <button class="btn-ghost" onclick="openTripModal('${esc(t.id)}')">编辑</button>
        <button class="btn-danger" onclick="confirmDeleteTrip('${esc(t.id)}')">删除</button>
      </div>
    </div>
  `;
}

function renderHotelCard(h, tripId) {
  const dateStr = h.checkIn && h.checkOut
    ? `${formatDateRange(h.checkIn, h.checkOut)}`
    : (h.checkIn ? `${formatDateCN(h.checkIn)} 入住` : '');
  return `
    <div class="hotel-info">
      <div class="hotel-info-body">
        <strong>🏨 ${esc(h.name)}</strong><br>
        ${dateStr ? `<span>${dateStr}</span>` : ''}
        ${h.address ? `<span> · ${esc(h.address)}</span>` : ''}
        ${h.note ? `<br><span style="opacity:.75">${esc(h.note)}</span>` : ''}
      </div>
      <div class="hotel-info-actions">
        <button class="icon-btn" onclick="openHotelModal('${esc(h.id)}')" title="编辑">✏️</button>
        <button class="icon-btn danger" onclick="deleteHotel('${esc(tripId)}','${esc(h.id)}')" title="删除">🗑</button>
      </div>
    </div>
  `;
}

function renderFlightCard(f, tripId) {
  const timeStr = [f.departureTime, f.arrivalTime].filter(Boolean).join(' → ');
  return `
    <div class="flight-card">
      <span style="font-size:16px">✈️</span>
      <div class="flight-route">
        <span class="flight-airport">${esc(f.fromAirport || '???')}</span>
        <span class="flight-arrow-icon" style="color:var(--text3)">→</span>
        <span class="flight-airport">${esc(f.toAirport || '???')}</span>
      </div>
      <div class="flight-meta">
        ${f.flightNo ? `<span class="flight-number">${esc(f.flightNo)}</span>` : ''}
        ${timeStr ? `<span class="flight-time">${esc(timeStr)}</span>` : ''}
        ${f.date ? `<span>${formatDateCN(f.date)}</span>` : ''}
        ${f.terminal ? `<span>航站楼 ${esc(f.terminal)}</span>` : ''}
      </div>
      <div class="flight-card-actions">
        <button class="icon-btn" onclick="openFlightModal('${esc(f.id)}')" title="编辑">✏️</button>
        <button class="icon-btn danger" onclick="deleteFlight('${esc(tripId)}','${esc(f.id)}')" title="删除">🗑</button>
      </div>
    </div>
  `;
}

function renderFilterBar(t, days) {
  const btns = days.map((d, i) => {
    const n = String(i + 1);
    return `<button class="filter-btn ${state.activeDay === n ? 'active' : ''}"
              onclick="setFilter('${n}')">Day ${n}</button>`;
  }).join('');
  return `
    <div class="filter-bar">
      <button class="filter-btn ${state.activeDay === 'all' ? 'active' : ''}" onclick="setFilter('all')">全部行程</button>
      ${btns}
    </div>
  `;
}

function renderLegend() {
  return `
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#1D9E75"></div>景点/活动</div>
      <div class="legend-item"><div class="legend-dot" style="background:#BA7517"></div>餐饮</div>
      <div class="legend-item"><div class="legend-dot" style="background:#7F77DD"></div>备注/提示</div>
      <div class="legend-item"><div class="legend-dot" style="background:#888;border-radius:2px"></div>交通</div>
    </div>
  `;
}

function renderTimeline(t, days) {
  if (days.length === 0) {
    // No date range set — show all activities without day grouping
    const acts = sortActivities(t.activities);
    if (acts.length === 0) return '';
    return `
      <div class="day-block">
        <div class="timeline">${acts.map(a => renderActivityItem(a, t.id)).join('')}</div>
      </div>
    `;
  }

  return days.map((dateStr, i) => {
    const n = i + 1;
    const visible = state.activeDay === 'all' || state.activeDay === String(n);
    const acts = sortActivities(t.activities.filter(a => a.date === dateStr));
    return `
      <div class="day-block" data-day="${n}" style="${visible ? '' : 'display:none'}">
        <div class="day-header">
          <div class="day-badge">Day ${n} · ${formatDateCN(dateStr)}</div>
          <button class="day-add-btn" onclick="openActivityModal(null,'${dateStr}')">+ 添加</button>
        </div>
        <div class="timeline">
          ${acts.length ? acts.map(a => renderActivityItem(a, t.id)).join('') : '<div class="empty-day">暂无行程 — 点击添加</div>'}
        </div>
      </div>
    `;
  }).join('');
}

function renderActivityItem(a, tripId) {
  const dotClass = { sight:'sight', food:'food', note:'note', transit:'', '':''}[a.type] || '';

  if (a.type === 'transit') {
    return `
      <div class="transit-item">
        <div class="transit-dot"></div>
        <div class="transit-inner">
          <div class="transit-line">
            ${a.vehicle ? `<span class="transit-tag">${esc(a.vehicle)}</span>` : ''}
            <span>${esc(a.name)}</span>
            ${a.duration ? `<span style="color:var(--text3)">${esc(a.duration)}</span>` : ''}
          </div>
          <div class="item-actions">
            <button onclick="openActivityModal('${esc(a.id)}')">编辑</button>
            <button class="del" onclick="deleteActivity('${esc(tripId)}','${esc(a.id)}')">删除</button>
          </div>
        </div>
      </div>
    `;
  }

  const timeDisplay = a.time ? (a.endTime ? `${a.time}–${a.endTime}` : a.time) : '';
  return `
    <div class="item">
      <div class="item-dot ${dotClass}"></div>
      <div class="item-inner">
        ${timeDisplay ? `<div class="item-time">${esc(timeDisplay)}</div>` : ''}
        <div class="item-name">
          ${esc(a.name)}
          ${a.pending ? '<span class="badge badge-pending">待确认</span>' : ''}
        </div>
        ${a.location ? `<div class="item-location">📍 ${esc(a.location)}</div>` : ''}
        ${a.memo ? `<div class="item-desc">${esc(a.memo)}</div>` : ''}
        <div class="item-actions">
          <button onclick="openActivityModal('${esc(a.id)}')">编辑</button>
          <button class="del" onclick="deleteActivity('${esc(tripId)}','${esc(a.id)}')">删除</button>
        </div>
      </div>
    </div>
  `;
}

/* ── Filter ─────────────────────────────────────────────────────── */
function setFilter(day) {
  state.activeDay = day;
  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === (day === 'all' ? '全部行程' : `Day ${day}`));
  });
  // Show/hide day blocks
  document.querySelectorAll('.day-block[data-day]').forEach(block => {
    const show = day === 'all' || block.dataset.day === day;
    block.style.display = show ? '' : 'none';
  });
}

/* ── Select trip ────────────────────────────────────────────────── */
function selectTrip(id) {
  state.currentId = id;
  state.activeDay = 'all';
  localStorage.setItem('currentTripId', id);
  render();
}

/* ── Modal system ───────────────────────────────────────────────── */
function showModal(title, bodyHTML, onSave) {
  const portal = document.getElementById('modalPortal');
  portal.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" onclick="closeModal()" aria-label="关闭">×</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal()">取消</button>
          <button class="btn-primary" id="modalSaveBtn">保存</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modalSaveBtn').onclick = onSave;
  // Close on backdrop click
  document.getElementById('modalBackdrop').addEventListener('click', e => {
    if (e.target.id === 'modalBackdrop') closeModal();
  });
  // Close on Escape
  document.addEventListener('keydown', escListener);
}

function escListener(e) {
  if (e.key === 'Escape') closeModal();
}

function closeModal() {
  document.getElementById('modalPortal').innerHTML = '';
  document.removeEventListener('keydown', escListener);
}

function val(id) {
  return document.getElementById(id)?.value?.trim() ?? '';
}

function checked(id) {
  return document.getElementById(id)?.checked ?? false;
}

function radioVal(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

/* ── Trip Modal ─────────────────────────────────────────────────── */
function openTripModal(editId) {
  const existing = editId ? state.trips.find(t => t.id === editId) : null;
  const title = existing ? '编辑行程' : '新建行程';
  const body = `
    <div class="form-row">
      <label class="form-label">行程名称 *</label>
      <input id="fTripName" class="form-input" placeholder="例：东京五日游" value="${esc(existing?.name ?? '')}" />
    </div>
    <div class="form-row">
      <label class="form-label">目的地</label>
      <input id="fTripDest" class="form-input" placeholder="例：日本东京" value="${esc(existing?.destination ?? '')}" />
    </div>
    <div class="form-row-2">
      <div>
        <label class="form-label">出发日期</label>
        <input id="fTripStart" type="date" class="form-input" value="${esc(existing?.startDate ?? '')}" />
      </div>
      <div>
        <label class="form-label">返回日期</label>
        <input id="fTripEnd" type="date" class="form-input" value="${esc(existing?.endDate ?? '')}" />
      </div>
    </div>
  `;
  showModal(title, body, async () => {
    const name = val('fTripName');
    if (!name) { alert('请输入行程名称'); return; }
    const payload = { name, destination: val('fTripDest'), startDate: val('fTripStart'), endDate: val('fTripEnd') };
    if (existing) {
      const updated = await api('PUT', `/trips/${existing.id}`, payload);
      const idx = state.trips.findIndex(t => t.id === updated.id);
      if (idx !== -1) state.trips[idx] = { ...state.trips[idx], ...updated };
    } else {
      const created = await api('POST', '/trips', payload);
      state.trips.push(created);
      state.currentId = created.id;
      localStorage.setItem('currentTripId', created.id);
    }
    state.activeDay = 'all';
    closeModal();
    render();
  });
  // Auto-focus
  setTimeout(() => document.getElementById('fTripName')?.focus(), 50);
}

/* ── Delete Trip ────────────────────────────────────────────────── */
function confirmDeleteTrip(id) {
  const t = state.trips.find(x => x.id === id);
  if (!confirm(`确定要删除「${t?.name}」吗？此操作不可恢复。`)) return;
  deleteTrip(id);
}

async function deleteTrip(id) {
  await api('DELETE', `/trips/${id}`);
  state.trips = state.trips.filter(t => t.id !== id);
  if (state.currentId === id) {
    state.currentId = state.trips[0]?.id ?? null;
    localStorage.setItem('currentTripId', state.currentId ?? '');
  }
  state.activeDay = 'all';
  render();
}

/* ── Flight Modal ───────────────────────────────────────────────── */
function openFlightModal(editId) {
  const t = trip();
  if (!t) return;
  const existing = editId ? t.flights.find(f => f.id === editId) : null;
  const title = existing ? '编辑航班' : '添加航班';
  const body = `
    <div class="ocr-section">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <label class="ocr-upload-label" for="fFlightImg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          上传订单截图自动识别
        </label>
        <input type="file" id="fFlightImg" accept="image/*" style="display:none" />
        <span id="fFlightOcrStatus" class="ocr-status" style="font-size:12px;"></span>
      </div>
    </div>
    <div class="form-row-2">
      <div>
        <label class="form-label">出发机场 (IATA)</label>
        <input id="fFlightFrom" class="form-input" placeholder="例：PVG" maxlength="10"
               value="${esc(existing?.fromAirport ?? '')}" />
      </div>
      <div>
        <label class="form-label">到达机场 (IATA)</label>
        <input id="fFlightTo" class="form-input" placeholder="例：NRT" maxlength="10"
               value="${esc(existing?.toAirport ?? '')}" />
      </div>
    </div>
    <div class="form-row-2">
      <div>
        <label class="form-label">航班号</label>
        <input id="fFlightNo" class="form-input" placeholder="例：JL001"
               value="${esc(existing?.flightNo ?? '')}" />
      </div>
      <div>
        <label class="form-label">航站楼</label>
        <input id="fFlightTerminal" class="form-input" placeholder="例：T1"
               value="${esc(existing?.terminal ?? '')}" />
      </div>
    </div>
    <div class="form-row">
      <label class="form-label">日期</label>
      <input id="fFlightDate" type="date" class="form-input"
             value="${esc(existing?.date ?? t.startDate ?? '')}" />
    </div>
    <div class="form-row-2">
      <div>
        <label class="form-label">起飞时间</label>
        <input id="fFlightDep" type="time" class="form-input"
               value="${esc(existing?.departureTime ?? '')}" />
      </div>
      <div>
        <label class="form-label">落地时间</label>
        <input id="fFlightArr" type="time" class="form-input"
               value="${esc(existing?.arrivalTime ?? '')}" />
      </div>
    </div>
    <div class="form-row">
      <label class="form-label">备注</label>
      <textarea id="fFlightNote" class="form-textarea" placeholder="例：提前网上值机，经济舱"
                style="min-height:56px">${esc(existing?.note ?? '')}</textarea>
    </div>
  `;
  showModal(title, body, async () => {
    const from = val('fFlightFrom').toUpperCase();
    const to   = val('fFlightTo').toUpperCase();
    if (!from || !to) { alert('请填写出发和到达机场'); return; }
    const payload = {
      fromAirport: from,
      toAirport: to,
      flightNo: val('fFlightNo'),
      terminal: val('fFlightTerminal'),
      date: val('fFlightDate'),
      departureTime: val('fFlightDep'),
      arrivalTime: val('fFlightArr'),
      note: val('fFlightNote'),
    };
    if (existing) {
      const updated = await api('PUT', `/trips/${t.id}/flights/${existing.id}`, payload);
      const idx = t.flights.findIndex(f => f.id === updated.id);
      if (idx !== -1) t.flights[idx] = updated;
    } else {
      const created = await api('POST', `/trips/${t.id}/flights`, payload);
      t.flights.push(created);
    }
    closeModal();
    renderMain();
  });
  setTimeout(() => {
    document.getElementById('fFlightFrom')?.focus();

    // ── OCR handler ──────────────────────────────────────────────
    document.getElementById('fFlightImg')?.addEventListener('change', async function () {
      const file = this.files?.[0];
      if (!file) return;

      const status = document.getElementById('fFlightOcrStatus');
      status.className = 'ocr-status loading';
      status.textContent = '识别中…';

      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/extract-flight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type || 'image/jpeg' }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || '识别失败');

        const d = json.data;
        const fill = (id, val) => {
          if (val == null || val === '') return;
          const el = document.getElementById(id);
          if (!el) return;
          el.value = val;
          el.classList.remove('field-autofilled');
          void el.offsetWidth; // reflow to restart animation
          el.classList.add('field-autofilled');
        };

        fill('fFlightFrom', d.fromAirport);
        fill('fFlightTo',   d.toAirport);
        fill('fFlightNo',   d.flightNo);
        fill('fFlightDate', d.date);
        fill('fFlightDep',  d.departureTime);
        fill('fFlightArr',  d.arrivalTime);
        fill('fFlightTerminal', d.terminal);

        status.className = 'ocr-status success';
        status.textContent = '✓ 识别成功，请确认后保存';
      } catch (err) {
        status.className = 'ocr-status error';
        status.textContent = '✗ ' + (err.message || '识别失败，请手动填写');
      }
    });
  }, 50);
}

/* ── Delete Flight ──────────────────────────────────────────────── */
async function deleteFlight(tripId, flightId) {
  if (!confirm('确定删除这条航班记录？')) return;
  await api('DELETE', `/trips/${tripId}/flights/${flightId}`);
  const t = state.trips.find(x => x.id === tripId);
  if (t) t.flights = t.flights.filter(f => f.id !== flightId);
  renderMain();
}

/* ── Hotel Modal ────────────────────────────────────────────────── */
function openHotelModal(editId) {
  const t = trip();
  if (!t) return;
  const existing = editId ? t.hotels.find(h => h.id === editId) : null;
  const title = existing ? '编辑住宿' : '添加住宿';
  const body = `
    <div class="form-row">
      <label class="form-label">酒店名称 *</label>
      <input id="fHotelName" class="form-input" placeholder="例：新桥 Section L"
             value="${esc(existing?.name ?? '')}" />
    </div>
    <div class="form-row">
      <label class="form-label">地址</label>
      <input id="fHotelAddr" class="form-input" placeholder="例：东京都港区新桥1-2-3"
             value="${esc(existing?.address ?? '')}" />
    </div>
    <div class="form-row-2">
      <div>
        <label class="form-label">入住日期</label>
        <input id="fHotelIn" type="date" class="form-input"
               value="${esc(existing?.checkIn ?? t.startDate ?? '')}" />
      </div>
      <div>
        <label class="form-label">退房日期</label>
        <input id="fHotelOut" type="date" class="form-input"
               value="${esc(existing?.checkOut ?? t.endDate ?? '')}" />
      </div>
    </div>
    <div class="form-row">
      <label class="form-label">备注</label>
      <textarea id="fHotelNote" class="form-textarea"
                placeholder="例：步行3分钟到新桥站，距银座线很近">${esc(existing?.note ?? '')}</textarea>
    </div>
  `;
  showModal(title, body, async () => {
    const name = val('fHotelName');
    if (!name) { alert('请输入酒店名称'); return; }
    const payload = {
      name,
      address: val('fHotelAddr'),
      checkIn: val('fHotelIn'),
      checkOut: val('fHotelOut'),
      note: val('fHotelNote'),
    };
    if (existing) {
      const updated = await api('PUT', `/trips/${t.id}/hotels/${existing.id}`, payload);
      const idx = t.hotels.findIndex(h => h.id === updated.id);
      if (idx !== -1) t.hotels[idx] = updated;
    } else {
      const created = await api('POST', `/trips/${t.id}/hotels`, payload);
      t.hotels.push(created);
    }
    closeModal();
    renderMain();
  });
  setTimeout(() => document.getElementById('fHotelName')?.focus(), 50);
}

/* ── Delete Hotel ───────────────────────────────────────────────── */
async function deleteHotel(tripId, hotelId) {
  if (!confirm('确定删除这条住宿记录？')) return;
  await api('DELETE', `/trips/${tripId}/hotels/${hotelId}`);
  const t = state.trips.find(x => x.id === tripId);
  if (t) t.hotels = t.hotels.filter(h => h.id !== hotelId);
  renderMain();
}

/* ── Activity Modal ─────────────────────────────────────────────── */
function openActivityModal(editId, prefillDate) {
  const t = trip();
  if (!t) return;
  const existing = editId ? t.activities.find(a => a.id === editId) : null;
  const title = existing ? '编辑行程项目' : '添加行程项目';

  const defaultDate = existing?.date ?? prefillDate ?? t.startDate ?? '';
  const defaultType = existing?.type ?? 'sight';

  const types = [
    { value: 'sight',   label: '景点/活动', color: '#1D9E75', dotClass: 'sight' },
    { value: 'food',    label: '餐饮',      color: '#BA7517', dotClass: 'food' },
    { value: 'transit', label: '交通',      color: '#888',    dotClass: 'transit' },
    { value: 'note',    label: '备注/提示', color: '#7F77DD', dotClass: 'note' },
  ];

  const typeRadios = types.map(tp => `
    <div class="type-option">
      <input type="radio" name="fActType" id="fActType_${tp.value}" value="${tp.value}"
             ${defaultType === tp.value ? 'checked' : ''} />
      <label for="fActType_${tp.value}">
        <span class="type-dot ${tp.dotClass}" style="background:${tp.color}"></span>
        ${tp.label}
      </label>
    </div>
  `).join('');

  const body = `
    <div class="form-row">
      <label class="form-label">类型</label>
      <div class="type-group">${typeRadios}</div>
    </div>
    <div class="form-row">
      <label class="form-label">名称/事项 *</label>
      <input id="fActName" class="form-input" placeholder="例：浅草寺参拜 / 乘坐新干线"
             value="${esc(existing?.name ?? '')}" />
    </div>

    <!-- Transit-specific field, toggled by JS -->
    <div id="fActTransitRow" class="form-row" style="display:none">
      <label class="form-label">交通方式</label>
      <input id="fActVehicle" class="form-input" placeholder="例：JR 山手线 / 地铁银座线 / 步行"
             value="${esc(existing?.vehicle ?? '')}" />
    </div>
    <div id="fActTransitDuration" class="form-row" style="display:none">
      <label class="form-label">耗时</label>
      <input id="fActDuration" class="form-input" placeholder="例：约20分钟 / 3站"
             value="${esc(existing?.duration ?? '')}" />
    </div>

    <div id="fActNonTransit">
      <div class="form-row">
        <label class="form-label">地点</label>
        <input id="fActLocation" class="form-input" placeholder="例：台东区浅草2-3-1"
               value="${esc(existing?.location ?? '')}" />
      </div>
      <div class="form-row-2">
        <div>
          <label class="form-label">日期</label>
          <input id="fActDate" type="date" class="form-input" value="${esc(defaultDate)}" />
        </div>
        <div>
          <label class="form-label">时间</label>
          <input id="fActTime" type="time" class="form-input" value="${esc(existing?.time ?? '')}" />
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">结束时间（可选）</label>
        <input id="fActEndTime" type="time" class="form-input" value="${esc(existing?.endTime ?? '')}" />
      </div>
    </div>

    <!-- Date for transit type -->
    <div id="fActTransitDate" class="form-row" style="display:none">
      <label class="form-label">日期</label>
      <input id="fActDate2" type="date" class="form-input" value="${esc(defaultDate)}" />
    </div>

    <div class="form-row">
      <label class="form-label">Memo / 备注</label>
      <textarea id="fActMemo" class="form-textarea"
                placeholder="例：需要提前购票，赶上15:00变身表演">${esc(existing?.memo ?? '')}</textarea>
    </div>
    <div class="form-row" id="fActPendingRow">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text2)">
        <input type="checkbox" id="fActPending" ${existing?.pending ? 'checked' : ''} />
        标记为「待确认」
      </label>
    </div>
  `;

  showModal(title, body, async () => {
    const name = val('fActName');
    if (!name) { alert('请输入名称/事项'); return; }
    const type = radioVal('fActType') || 'sight';
    const isTransit = type === 'transit';
    const date = isTransit ? val('fActDate2') : val('fActDate');
    const payload = {
      name,
      type,
      date,
      location: isTransit ? '' : val('fActLocation'),
      time: isTransit ? '' : val('fActTime'),
      endTime: isTransit ? '' : val('fActEndTime'),
      vehicle: isTransit ? val('fActVehicle') : '',
      duration: isTransit ? val('fActDuration') : '',
      memo: val('fActMemo'),
      pending: checked('fActPending'),
    };
    if (existing) {
      const updated = await api('PUT', `/trips/${t.id}/activities/${existing.id}`, payload);
      const idx = t.activities.findIndex(a => a.id === updated.id);
      if (idx !== -1) t.activities[idx] = updated;
    } else {
      const created = await api('POST', `/trips/${t.id}/activities`, payload);
      t.activities.push(created);
    }
    closeModal();
    renderMain();
    // Restore filter after re-render
    if (state.activeDay !== 'all') setFilter(state.activeDay);
  });

  // Toggle transit-specific fields
  function toggleTransitFields() {
    const isT = radioVal('fActType') === 'transit';
    document.getElementById('fActTransitRow').style.display      = isT ? '' : 'none';
    document.getElementById('fActTransitDuration').style.display = isT ? '' : 'none';
    document.getElementById('fActTransitDate').style.display     = isT ? '' : 'none';
    document.getElementById('fActNonTransit').style.display      = isT ? 'none' : '';
    document.getElementById('fActPendingRow').style.display      = isT ? 'none' : '';
  }

  setTimeout(() => {
    document.querySelectorAll('input[name="fActType"]').forEach(el => {
      el.addEventListener('change', toggleTransitFields);
    });
    toggleTransitFields();
    document.getElementById('fActName')?.focus();
  }, 50);
}

/* ── Delete Activity ────────────────────────────────────────────── */
async function deleteActivity(tripId, actId) {
  if (!confirm('确定删除这条行程？')) return;
  await api('DELETE', `/trips/${tripId}/activities/${actId}`);
  const t = state.trips.find(x => x.id === tripId);
  if (t) t.activities = t.activities.filter(a => a.id !== actId);
  renderMain();
  if (state.activeDay !== 'all') setFilter(state.activeDay);
}

/* ── Bootstrap ──────────────────────────────────────────────────── */
init().catch(console.error);
