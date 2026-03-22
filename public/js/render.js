// =====================================================
// SVG Lighthouse Renderer — 5 themes
// =====================================================

/**
 * Generate an inline SVG string for a lighthouse.
 * @param {string} theme - 'white' | 'red' | 'stripe' | 'stone' | 'amber'
 * @param {number} [w=120]  - SVG width
 * @param {number} [h=160]  - SVG height
 * @returns {string} SVG markup string
 */
export function lighthouseSVG(theme = 'white', w = 120, h = 160) {
  const themes = {
    white: {
      tower: '#e8f4fd',
      towerStroke: '#a0bcd4',
      base: '#cde0ef',
      lantern: '#ffe082',
      lanternRing: '#ffb300',
      cap: '#1a3350',
      beam: 'rgba(255,224,82,0.35)',
      sky: ['#0d2a4a', '#1a4a7a'],
      sea: ['#0a2540', '#0d3d6b'],
    },
    red: {
      tower: '#c0392b',
      towerStroke: '#922b21',
      base: '#922b21',
      lantern: '#ffe082',
      lanternRing: '#ffb300',
      cap: '#2c3e50',
      beam: 'rgba(255,240,100,0.3)',
      sky: ['#0d1f3a', '#1a3560'],
      sea: ['#061525', '#0c2f50'],
    },
    stripe: {
      tower: null, // uses stripes
      towerStroke: '#333',
      base: '#888',
      lantern: '#ffe082',
      lanternRing: '#e6a000',
      cap: '#222',
      beam: 'rgba(255,255,180,0.28)',
      sky: ['#0e2240', '#1b3d70'],
      sea: ['#08192e', '#0f3054'],
    },
    stone: {
      tower: '#b5a48a',
      towerStroke: '#8a7a62',
      base: '#8a7a62',
      lantern: '#ffe082',
      lanternRing: '#cc8800',
      cap: '#4a3a28',
      beam: 'rgba(255,220,80,0.28)',
      sky: ['#0f2030', '#1e3a58'],
      sea: ['#0a1e32', '#12324e'],
    },
    amber: {
      tower: '#e8a020',
      towerStroke: '#c07010',
      base: '#c07010',
      lantern: '#fff7a0',
      lanternRing: '#ffdd00',
      cap: '#2a1a00',
      beam: 'rgba(255,250,150,0.35)',
      sky: ['#0c1c32', '#1a3458'],
      sea: ['#091828', '#10304a'],
    },
  };

  const t = themes[theme] || themes.white;
  const cx = w / 2;

  // geometry
  const baseY = h * 0.85;
  const baseH = h * 0.07;
  const towerBotW = w * 0.32;
  const towerTopW = w * 0.2;
  const towerBot = baseY - baseH;
  const towerTop = h * 0.28;
  const towerH = towerBot - towerTop;
  const lanternY = towerTop;
  const lanternH = h * 0.1;
  const capR = towerTopW * 0.65;

  // sea wave y
  const seaY = baseY + baseH * 0.4;

  let svgParts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`];

  // defs
  svgParts.push(`<defs>
  <linearGradient id="sky${theme}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${t.sky[0]}"/>
    <stop offset="100%" stop-color="${t.sky[1]}"/>
  </linearGradient>
  <linearGradient id="sea${theme}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${t.sea[0]}"/>
    <stop offset="100%" stop-color="${t.sea[1]}"/>
  </linearGradient>
  <radialGradient id="beam${theme}" cx="50%" cy="0%" r="100%">
    <stop offset="0%" stop-color="${t.beam}"/>
    <stop offset="100%" stop-color="transparent"/>
  </radialGradient>
  <clipPath id="clip${theme}">
    <rect width="${w}" height="${h}"/>
  </clipPath>
</defs>`);

  svgParts.push(`<g clip-path="url(#clip${theme})">`);

  // sky
  svgParts.push(`<rect width="${w}" height="${h}" fill="url(#sky${theme})"/>`);

  // stars (small)
  const stars = [[10,8],[25,15],[38,6],[60,12],[75,5],[88,18],[100,9],[112,14],[18,30],[70,22],[95,28]];
  stars.forEach(([sx, sy]) => {
    const r = Math.random() * 0.8 + 0.4;
    svgParts.push(`<circle cx="${sx}" cy="${sy}" r="${r.toFixed(1)}" fill="white" opacity="0.7"/>`);
  });

  // light beam
  svgParts.push(`<polygon points="${cx},${lanternY + lanternH * 0.3} ${cx - w * 0.7},${h * 0.6} ${cx + w * 0.7},${h * 0.6}" fill="url(#beam${theme})" opacity="0.6"/>`);

  // tower body
  const txLeft = cx - towerTopW / 2;
  const txRight = cx + towerTopW / 2;
  const bxLeft = cx - towerBotW / 2;
  const bxRight = cx + towerBotW / 2;

  if (theme === 'stripe') {
    // clip tower and fill stripes
    const stripeCount = 8;
    const stripeH = towerH / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      const sy2 = towerTop + i * stripeH;
      const pct = i / (stripeCount - 1);
      const lLeft = txLeft + (bxLeft - txLeft) * pct;
      const lRight = txRight + (bxRight - txRight) * pct;
      const lLeft2 = txLeft + (bxLeft - txLeft) * ((i + 1) / (stripeCount - 1));
      const lRight2 = txRight + (bxRight - txRight) * ((i + 1) / (stripeCount - 1));
      const fill = i % 2 === 0 ? '#ffffff' : '#1a1a1a';
      svgParts.push(`<polygon points="${lLeft},${sy2} ${lRight},${sy2} ${lRight2},${sy2 + stripeH} ${lLeft2},${sy2 + stripeH}" fill="${fill}"/>`);
    }
  } else if (theme === 'stone') {
    // textured stone effect
    svgParts.push(`<polygon points="${txLeft},${towerTop} ${txRight},${towerTop} ${bxRight},${towerBot} ${bxLeft},${towerBot}" fill="${t.tower}" stroke="${t.towerStroke}" stroke-width="1"/>`);
    // mortar lines
    const rows = 6;
    for (let r2 = 1; r2 < rows; r2++) {
      const pct2 = r2 / rows;
      const y2 = towerTop + pct2 * towerH;
      const lx = txLeft + (bxLeft - txLeft) * pct2;
      const rx = txRight + (bxRight - txRight) * pct2;
      svgParts.push(`<line x1="${lx}" y1="${y2}" x2="${rx}" y2="${y2}" stroke="${t.towerStroke}" stroke-width="1" opacity="0.5"/>`);
    }
  } else {
    svgParts.push(`<polygon points="${txLeft},${towerTop} ${txRight},${towerTop} ${bxRight},${towerBot} ${bxLeft},${towerBot}" fill="${t.tower}" stroke="${t.towerStroke}" stroke-width="1"/>`);
  }

  // windows on tower
  const win1Y = towerTop + towerH * 0.35;
  const win2Y = towerTop + towerH * 0.65;
  [win1Y, win2Y].forEach((wy) => {
    const pct3 = (wy - towerTop) / towerH;
    const ww = 6 + (1 - pct3) * 2;
    svgParts.push(`<rect x="${cx - ww / 2}" y="${wy - 4}" width="${ww}" height="7" rx="3" fill="#ffe082" opacity="0.7"/>`);
  });

  // base
  svgParts.push(`<rect x="${cx - towerBotW * 0.6}" y="${towerBot}" width="${towerBotW * 1.2}" height="${baseH}" rx="3" fill="${t.base}"/>`);

  // lantern room (glass cylinder)
  const lw = towerTopW * 1.1;
  svgParts.push(`<rect x="${cx - lw / 2}" y="${lanternY}" width="${lw}" height="${lanternH}" rx="3" fill="${t.lantern}" opacity="0.9" stroke="${t.lanternRing}" stroke-width="1.5"/>`);

  // cap / dome
  svgParts.push(`<ellipse cx="${cx}" cy="${lanternY}" rx="${capR}" ry="${capR * 0.5}" fill="${t.cap}"/>`);
  svgParts.push(`<polygon points="${cx},${lanternY - capR * 1.6} ${cx - capR},${lanternY} ${cx + capR},${lanternY}" fill="${t.cap}"/>`);

  // gallery rail
  svgParts.push(`<line x1="${cx - lw / 2 - 2}" y1="${lanternY + lanternH}" x2="${cx + lw / 2 + 2}" y2="${lanternY + lanternH}" stroke="${t.lanternRing}" stroke-width="2"/>`);

  // sea
  svgParts.push(`<rect x="0" y="${seaY}" width="${w}" height="${h - seaY}" fill="url(#sea${theme})"/>`);
  // wave
  svgParts.push(`<path d="M0,${seaY} Q${w * 0.25},${seaY - 5} ${w * 0.5},${seaY} Q${w * 0.75},${seaY + 5} ${w},${seaY} L${w},${seaY + 6} L0,${seaY + 6}Z" fill="${t.sea[0]}" opacity="0.6"/>`);

  svgParts.push('</g></svg>');

  return svgParts.join('\n');
}

/**
 * Create an <img> or SVG element for a card image.
 * Falls back to SVG if no image URL / image fails to load.
 * @param {Object} lh - lighthouse data object
 * @param {boolean} [fullSize=false]
 * @returns {HTMLElement}
 */
export function makeCardImg(lh, fullSize = false) {
  const wrap = document.createElement('div');
  wrap.className = 'card-img';

  if (lh.image) {
    const img = document.createElement('img');
    img.alt = lh.nameCN;
    img.loading = 'lazy';
    img.src = lh.image;
    img.onerror = () => {
      img.remove();
      wrap.innerHTML = lighthouseSVG(lh.theme, fullSize ? 320 : 160, fullSize ? 280 : 180);
      wrap.querySelector('svg').style.cssText = 'width:100%;height:100%;';
    };
    wrap.appendChild(img);
  } else {
    wrap.innerHTML = lighthouseSVG(lh.theme, fullSize ? 320 : 160, fullSize ? 280 : 180);
    wrap.querySelector('svg').style.cssText = 'width:100%;height:100%;';
  }

  return wrap;
}

/**
 * Small thumbnail SVG string (for list/map rows).
 */
export function thumbSVG(theme) {
  return lighthouseSVG(theme, 72, 56);
}
