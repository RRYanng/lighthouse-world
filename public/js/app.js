// =====================================================
// 世界灯塔集 — Main App Logic
// =====================================================
import { LIGHTHOUSES, REGIONS, STATUS_LABELS } from './data.js';
import { lighthouseSVG, makeCardImg, thumbSVG } from './render.js';

// ── State ────────────────────────────────────────────────
let filtered = [...LIGHTHOUSES];
let activeRegion = 'all';
let viewMode = 'grid'; // 'grid' | 'list' | 'map'
let map = null;
let mapMarkers = [];
const AI_CACHE_PREFIX = 'lh_ai_';

// ── DOM refs ─────────────────────────────────────────────
const searchEl = document.getElementById('search');
const regionFilter = document.getElementById('region-filter');
const statusFilter = document.getElementById('status-filter');
const gridView = document.getElementById('grid-view');
const listView = document.getElementById('list-view');
const mapView = document.getElementById('map-view');
const resultCount = document.getElementById('result-count');
const viewBtns = document.querySelectorAll('.view-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalEl = document.getElementById('modal');
const pillsContainer = document.getElementById('region-pills');

// ── Hero canvas stars + beam ─────────────────────────────
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Generate stars
  const stars = Array.from({ length: 220 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.75,
    r: Math.random() * 1.4 + 0.3,
    a: Math.random(),
    speed: Math.random() * 0.008 + 0.002,
    phase: Math.random() * Math.PI * 2,
  }));

  let beamAngle = -0.5;
  let t = 0;

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Stars
    stars.forEach(s => {
      s.a = 0.15 + 0.25 * Math.sin(t * s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a.toFixed(2)})`;
      ctx.fill();
    });

    // Sweeping light beam from center bottom
    beamAngle = -Math.PI / 2 + 0.6 * Math.sin(t * 0.012);
    const bx = W * 0.5, by = H * 0.92;
    const beamLen = H * 1.4;
    const beamSpread = 0.12;
    const bx1 = bx + Math.cos(beamAngle - beamSpread) * beamLen;
    const by1 = by + Math.sin(beamAngle - beamSpread) * beamLen;
    const bx2 = bx + Math.cos(beamAngle + beamSpread) * beamLen;
    const by2 = by + Math.sin(beamAngle + beamSpread) * beamLen;

    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, beamLen);
    grad.addColorStop(0, 'rgba(255,240,80,0.18)');
    grad.addColorStop(0.4, 'rgba(255,230,60,0.06)');
    grad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx1, by1);
    ctx.lineTo(bx2, by2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    t++;
    requestAnimationFrame(draw);
  }
  draw();
}

// ── Filter + Search ───────────────────────────────────────
function applyFilters() {
  const q = searchEl.value.trim().toLowerCase();
  const region = regionFilter.value;
  const status = statusFilter.value;

  filtered = LIGHTHOUSES.filter(lh => {
    if (activeRegion !== 'all' && lh.region !== activeRegion) return false;
    if (region && lh.region !== region) return false;
    if (status && lh.status !== status) return false;
    if (q) {
      return (
        lh.nameCN.includes(q) ||
        lh.nameEN.toLowerCase().includes(q) ||
        lh.country.includes(q) ||
        lh.location.includes(q) ||
        (lh.tags || []).some(tag => tag.includes(q))
      );
    }
    return true;
  });

  updateResultCount();
  renderCurrent();
}

function updateResultCount() {
  resultCount.textContent = `找到 ${filtered.length} 座灯塔`;
}

// ── Render ────────────────────────────────────────────────
function renderCurrent() {
  if (viewMode === 'grid') renderGrid();
  else if (viewMode === 'list') renderList();
  else renderMap();
}

function renderGrid() {
  gridView.innerHTML = '';
  if (filtered.length === 0) {
    gridView.innerHTML = `<div class="empty-state"><div class="empty-icon">🔭</div><p>没有找到符合条件的灯塔</p><small>请尝试调整搜索条件</small></div>`;
    return;
  }
  filtered.forEach((lh, i) => {
    const card = document.createElement('div');
    card.className = 'lh-card';
    card.style.animationDelay = `${Math.min(i * 0.04, 0.5)}s`;

    const imgWrap = makeCardImg(lh);
    const badge = document.createElement('div');
    badge.className = `card-badge badge-${lh.status}`;
    badge.textContent = STATUS_LABELS[lh.status] || lh.status;
    imgWrap.appendChild(badge);

    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = `
      <div class="card-name-cn">${lh.nameCN}</div>
      <div class="card-name-en">${lh.nameEN}</div>
      <div class="card-meta">
        <span class="meta-chip">🌍 ${lh.country}</span>
        <span class="meta-chip">📐 ${lh.height}m</span>
        <span class="meta-chip">📅 ${lh.year > 0 ? lh.year + '年' : Math.abs(lh.year) + '年前'}</span>
      </div>
      ${lh.tags?.length ? `<div class="card-tags">${lh.tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
    `;

    card.appendChild(imgWrap);
    card.appendChild(body);
    card.addEventListener('click', () => openModal(lh));
    gridView.appendChild(card);
  });
}

function renderList() {
  listView.innerHTML = '';
  if (filtered.length === 0) {
    listView.innerHTML = `<div class="empty-state"><div class="empty-icon">🔭</div><p>没有找到符合条件的灯塔</p></div>`;
    return;
  }
  filtered.forEach((lh, i) => {
    const row = document.createElement('div');
    row.className = 'lh-row';
    row.style.animationDelay = `${Math.min(i * 0.03, 0.4)}s`;

    // thumb
    const thumb = document.createElement('div');
    thumb.className = 'row-thumb';
    if (lh.image) {
      const img = document.createElement('img');
      img.src = lh.image;
      img.alt = lh.nameCN;
      img.loading = 'lazy';
      img.onerror = () => { img.remove(); thumb.innerHTML = thumbSVG(lh.theme); };
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = thumbSVG(lh.theme);
    }

    const info = document.createElement('div');
    info.className = 'row-info';
    info.innerHTML = `
      <div class="row-name-cn">${lh.nameCN}</div>
      <div class="row-name-en">${lh.nameEN}</div>
      <div class="row-meta">
        <span class="meta-chip">🌍 ${lh.country}</span>
        <span class="meta-chip">📐 ${lh.height}m</span>
        <span class="meta-chip">📅 ${lh.year > 0 ? lh.year + '年' : Math.abs(lh.year) + '年前'}</span>
        <span class="meta-chip">${REGIONS.find(r => r.key === lh.region)?.emoji || ''} ${lh.region}</span>
      </div>
    `;

    const right = document.createElement('div');
    right.className = 'row-right';
    right.innerHTML = `<span class="card-badge badge-${lh.status}">${STATUS_LABELS[lh.status] || lh.status}</span>`;

    row.appendChild(thumb);
    row.appendChild(info);
    row.appendChild(right);
    row.addEventListener('click', () => openModal(lh));
    listView.appendChild(row);
  });
}

// ── Map ───────────────────────────────────────────────────
function renderMap() {
  if (!map) {
    map = L.map('map-view', { zoomControl: true, scrollWheelZoom: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
  }

  // Clear old markers
  mapMarkers.forEach(m => m.remove());
  mapMarkers = [];

  if (filtered.length === 0) return;

  const bounds = [];

  filtered.forEach(lh => {
    const svgStr = lighthouseSVG(lh.theme, 36, 48);
    const icon = L.divIcon({
      className: '',
      html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6))" title="${lh.nameCN}">${svgStr}</div>`,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -50],
    });

    const marker = L.marker([lh.lat, lh.lng], { icon })
      .bindPopup(`
        <div style="font-family:'Source Serif 4',serif;min-width:160px">
          <div style="font-weight:700;color:#ffe082;font-size:1rem">${lh.nameCN}</div>
          <div style="color:#999;font-size:0.75rem;font-style:italic">${lh.nameEN}</div>
          <div style="margin-top:0.4rem;font-size:0.8rem;color:#ccc">${lh.country} · ${lh.height}m · ${lh.year > 0 ? lh.year + '年' : Math.abs(lh.year) + '年前'}</div>
          <button onclick="window.__openModal('${lh.id}')" style="margin-top:0.5rem;padding:0.3rem 0.7rem;background:#ffb300;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;font-family:inherit">查看详情</button>
        </div>
      `, { maxWidth: 240 });

    marker.addTo(map);
    mapMarkers.push(marker);
    bounds.push([lh.lat, lh.lng]);
  });

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }
}

// Global helper for map popup buttons
window.__openModal = (id) => {
  const lh = LIGHTHOUSES.find(l => l.id === id);
  if (lh) openModal(lh);
};

// ── Modal ─────────────────────────────────────────────────
function openModal(lh) {
  const modal = modalEl;
  modal.innerHTML = '';

  // Hero image
  const heroDiv = document.createElement('div');
  heroDiv.className = 'modal-hero';

  if (lh.image) {
    const img = document.createElement('img');
    img.src = lh.image;
    img.alt = lh.nameCN;
    img.onerror = () => {
      img.remove();
      const svgDiv = document.createElement('div');
      svgDiv.className = 'modal-hero-svg';
      svgDiv.style.background = 'linear-gradient(135deg,#0d2040,#1a3a60)';
      svgDiv.innerHTML = lighthouseSVG(lh.theme, 280, 260);
      svgDiv.querySelector('svg').style.cssText = 'width:auto;height:100%;';
      heroDiv.insertBefore(svgDiv, heroDiv.firstChild);
    };
    heroDiv.appendChild(img);
  } else {
    const svgDiv = document.createElement('div');
    svgDiv.className = 'modal-hero-svg';
    svgDiv.style.cssText = 'background:linear-gradient(135deg,#0d2040,#1a3a60);display:flex;align-items:flex-end;justify-content:center;';
    svgDiv.innerHTML = lighthouseSVG(lh.theme, 280, 260);
    svgDiv.querySelector('svg').style.cssText = 'width:auto;height:100%;';
    heroDiv.appendChild(svgDiv);
  }

  const heroOverlay = document.createElement('div');
  heroOverlay.className = 'modal-hero-overlay';
  heroDiv.appendChild(heroOverlay);

  // Close btn
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '✕';
  closeBtn.setAttribute('aria-label', '关闭');
  closeBtn.addEventListener('click', closeModal);

  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';

  const openStatus = lh.open ? '✅ 对外开放' : '🚫 不对公众开放';
  const yearStr = lh.year > 0 ? `${lh.year} 年` : `公元前 ${Math.abs(lh.year)} 年`;

  body.innerHTML = `
    <div class="modal-title-cn">${lh.nameCN}</div>
    <div class="modal-title-en">${lh.nameEN}</div>
    <div class="modal-info-grid">
      <div class="info-cell"><div class="info-label">国家 / 地区</div><div class="info-val">${lh.country}</div></div>
      <div class="info-cell"><div class="info-label">所在地</div><div class="info-val">${lh.location}</div></div>
      <div class="info-cell"><div class="info-label">建造年份</div><div class="info-val">${yearStr}</div></div>
      <div class="info-cell"><div class="info-label">塔高</div><div class="info-val">${lh.height} 米</div></div>
      <div class="info-cell"><div class="info-label">类型</div><div class="info-val">${lh.type}</div></div>
      <div class="info-cell"><div class="info-label">运营状态</div><div class="info-val badge-${lh.status}">${STATUS_LABELS[lh.status] || lh.status}</div></div>
      <div class="info-cell"><div class="info-label">参观</div><div class="info-val">${openStatus}</div></div>
      <div class="info-cell"><div class="info-label">坐标</div><div class="info-val" style="font-size:0.82rem">${lh.lat.toFixed(4)}°, ${lh.lng.toFixed(4)}°</div></div>
    </div>
    <div class="modal-ai-section" id="modal-ai">
      <div class="ai-label">Claude AI 介绍</div>
      <div class="ai-loading"><div class="spinner"></div><span>正在为您生成灯塔故事…</span></div>
    </div>
    ${lh.tags?.length ? `<div class="modal-tags">${lh.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
    <div class="modal-actions">
      <a class="btn" href="https://www.google.com/maps?q=${lh.lat},${lh.lng}" target="_blank" rel="noopener">🗺 Google 地图</a>
      <button class="btn" onclick="window.__copyCoords(${lh.lat},${lh.lng})">📋 复制坐标</button>
      <a class="btn" href="https://en.wikipedia.org/wiki/${encodeURIComponent(lh.nameEN.replace(/ /g, '_'))}" target="_blank" rel="noopener">📖 Wikipedia</a>
    </div>
  `;

  modal.appendChild(closeBtn);
  modal.appendChild(heroDiv);
  modal.appendChild(body);

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Load AI description
  loadAIDescription(lh);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ── AI Description ────────────────────────────────────────
async function loadAIDescription(lh) {
  const aiSection = document.getElementById('modal-ai');
  if (!aiSection) return;

  const cacheKey = AI_CACHE_PREFIX + lh.id;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    showAIText(aiSection, cached);
    return;
  }

  try {
    const res = await fetch('/api/lighthouse-detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nameCN: lh.nameCN,
        nameEN: lh.nameEN,
        country: lh.country,
        year: lh.year,
        height: lh.height,
        type: lh.type,
        location: lh.location,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.description) {
      localStorage.setItem(cacheKey, data.description);
      showAIText(aiSection, data.description);
    } else {
      throw new Error('Empty response');
    }
  } catch (err) {
    if (aiSection) {
      aiSection.innerHTML = `<div class="ai-label">Claude AI 介绍</div><div class="ai-text" style="color:var(--text-dim);font-style:normal">暂无 AI 简介（请确认服务器已配置 ANTHROPIC_API_KEY）</div>`;
    }
  }
}

function showAIText(container, text) {
  container.innerHTML = `<div class="ai-label">Claude AI 介绍</div><div class="ai-text">${text}</div>`;
}

// Global helper
window.__copyCoords = (lat, lng) => {
  navigator.clipboard.writeText(`${lat}, ${lng}`).then(() => {
    alert('坐标已复制：' + lat + ', ' + lng);
  });
};

// ── View switching ─────────────────────────────────────────
function setView(mode) {
  viewMode = mode;
  gridView.style.display = mode === 'grid' ? 'grid' : 'none';
  listView.style.display = mode === 'list' ? 'flex' : 'none';
  mapView.style.display = mode === 'map' ? 'block' : 'none';
  viewBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.view === mode));
  renderCurrent();
  if (mode === 'map') {
    setTimeout(() => map && map.invalidateSize(), 100);
  }
}

// ── Region pills ──────────────────────────────────────────
function buildPills() {
  REGIONS.forEach(r => {
    const pill = document.createElement('button');
    pill.className = 'pill' + (r.key === 'all' ? ' active' : '');
    pill.textContent = `${r.emoji} ${r.labelCN}`;
    pill.dataset.key = r.key;
    pill.addEventListener('click', () => {
      activeRegion = r.key;
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      applyFilters();
    });
    pillsContainer.appendChild(pill);
  });
}

// ── Init ──────────────────────────────────────────────────
function init() {
  initHeroCanvas();
  buildPills();

  // Event listeners
  searchEl.addEventListener('input', applyFilters);
  regionFilter.addEventListener('change', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Scroll arrow
  document.querySelector('.hero-scroll')?.addEventListener('click', () => {
    document.getElementById('controls').scrollIntoView({ behavior: 'smooth' });
  });

  // Initial render
  applyFilters();
  setView('grid');
}

document.addEventListener('DOMContentLoaded', init);
