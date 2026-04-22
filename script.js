let DATASET = [];

const METRICS = [
  { key: 'electricity_kwh_2020',    label: 'Electricity kWh 2020',    short: 'Electricity', color: '#4cc9f0' },
  { key: 'gas_kwh_2020',            label: 'Gas kWh 2020',            short: 'Gas',         color: '#ffb454' },
  { key: 'renewable_chp_kwh_2020',  label: 'Renewable/CHP kWh 2020',  short: 'Renew/CHP',   color: '#55d6a1' },
  { key: 'total_kwh',               label: 'Total kWh 2020',          short: 'Total',       color: '#b794f6' },
  { key: 'energy_intensity_kwh_m2', label: 'Energy Intensity kWh/m²', short: 'Intensity',   color: '#ff6ba8' }
];

let activeMetric = METRICS[0];
let ascendingSort = true;

const chartRoot  = document.getElementById('chartRoot');
const labelsRoot = document.getElementById('labelsRoot');
const axesRoot   = document.getElementById('axesRoot');
const metricBtns = document.getElementById('metricButtonsRoot');
const viewerRoot = document.getElementById('viewerRoot');
const vpStrip    = document.getElementById('vpStrip');
const sortLabel  = document.getElementById('sortLabel');
const camera     = document.getElementById('camera');
const vpName     = document.getElementById('vpName');
const vpMetric   = document.getElementById('vpMetric');
const vpRef      = document.getElementById('vpRef');
const vpValue    = document.getElementById('vpValue');
const vpGia      = document.getElementById('vpGia');
const vpTotal    = document.getElementById('vpTotal');
const statusEl   = document.getElementById('status');

const safe = v => Number.isFinite(v) ? v : 0;

const fmt = (v, d = 0) => new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: d,
  maximumFractionDigits: d
}).format(v ?? 0);

const clear = el => {
  while (el.firstChild) el.removeChild(el.firstChild);
};

const sortBy = (key, asc) => {
  return [...DATASET].sort((a, b) =>
    asc ? safe(a[key]) - safe(b[key]) : safe(b[key]) - safe(a[key])
  );
};

function makeEl(tag, attrs) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function buildMetricButtons() {
  clear(metricBtns);

  const btnW = 1.85;
  const gap = 0.22;
  const totalW = METRICS.length * btnW + (METRICS.length - 1) * gap;

  METRICS.forEach((m, i) => {
    const x = -totalW / 2 + btnW / 2 + i * (btnW + gap);
    const isActive = m.key === activeMetric.key;

    const btn = document.createElement('a-entity');
    btn.setAttribute('position', `${x} -0.18 0.01`);

    const bg = makeEl('a-plane', {
      class: 'interactive',
      width: String(btnW),
      height: '0.48',
      position: '0 0 0',
      material: `color:${isActive ? m.color : '#122133'}; opacity:0.97; shader:flat; side:double`
    });

    const lbl = makeEl('a-text', {
      value: m.short,
      width: String(btnW * 1.55),
      align: 'center',
      color: isActive ? '#041018' : '#eef6fb',
      position: '0 -0.01 0.01'
    });

    bg.addEventListener('mouseenter', () => {
      bg.setAttribute('material', `color:${isActive ? m.color : '#ec3b83'}; opacity:0.97; shader:flat; side:double`);
    });

    bg.addEventListener('mouseleave', () => {
      bg.setAttribute('material', `color:${isActive ? m.color : '#122133'}; opacity:0.97; shader:flat; side:double`);
    });

    bg.addEventListener('click', () => {
      activeMetric = m;
      buildMetricButtons();
      buildChart(ascendingSort);
    });

    btn.appendChild(bg);
    btn.appendChild(lbl);
    metricBtns.appendChild(btn);
  });
}

function orientViewer() {
  const vis = viewerRoot.getAttribute('visible');
  if (vis !== true && vis !== 'true') return;

  const vp = new THREE.Vector3();
  const cam = new THREE.Vector3();

  viewerRoot.object3D.getWorldPosition(vp);
  camera.object3D.getWorldPosition(cam);

  const yaw = Math.atan2(cam.x - vp.x, cam.z - vp.z) * 180 / Math.PI;
  viewerRoot.setAttribute('rotation', `0 ${yaw} 0`);
}

function showViewer(item, barEl, barH) {
  const pos = barEl.getAttribute('position');
  const camPos = new THREE.Vector3();
  camera.object3D.getWorldPosition(camPos);

  const dx = camPos.x - pos.x;
  const dz = camPos.z - pos.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;

  viewerRoot.setAttribute('position', `${pos.x + (dx / len) * 0.4} ${barH + 1.35} ${pos.z + (dz / len) * 0.4}`);
  viewerRoot.setAttribute('visible', 'true');

  vpStrip.setAttribute('material', `color:${activeMetric.color}; opacity:1; shader:flat`);
  vpName.setAttribute('value', item.building_name);
  vpMetric.setAttribute('value', 'Metric: ' + activeMetric.label);
  vpRef.setAttribute('value', 'Ref: ' + item.building_ref);
  vpValue.setAttribute('value', 'Value: ' + fmt(safe(item[activeMetric.key]), activeMetric.key === 'energy_intensity_kwh_m2' ? 1 : 0));
  vpGia.setAttribute('value', 'GIA: ' + fmt(safe(item.gia_m2), 0) + ' m²');
  vpTotal.setAttribute('value', 'Total: ' + fmt(safe(item.total_kwh), 0) + ' kWh');

  orientViewer();
}

function buildAxes(startX, startZ, cols, rows, maxH, maxV) {
  clear(axesRoot);

  const gap = 1.44;
  const xLen = (cols - 1) * gap + 1.0;
  const zLen = (rows - 1) * gap + 1.0;
  const frontZ = startZ + zLen + 0.25;

  axesRoot.appendChild(makeEl('a-box', {
    position: `0 0.04 ${frontZ}`,
    width: String(xLen),
    height: '0.03',
    depth: '0.03',
    color: '#fff600'
  }));

  axesRoot.appendChild(makeEl('a-box', {
    position: `${startX - 0.5} 0.04 ${startZ + zLen / 2 - 0.5}`,
    width: '0.03',
    height: '0.03',
    depth: String(zLen),
    color: 'e60026'
  }));

  axesRoot.appendChild(makeEl('a-box', {
    position: `${startX - 0.5} ${maxH / 2} ${frontZ}`,
    width: '0.03',
    height: String(maxH),
    depth: '0.03',
    color: '#e60026'
  }));

  for (let i = 0; i <= 5; i++) {
    const y = (maxH / 5) * i;
    const v = (maxV / 5) * i;

    axesRoot.appendChild(makeEl('a-box', {
      position: `${startX - 0.4} ${y} ${frontZ}`,
      width: '0.18',
      height: '0.015',
      depth: '0.015',
      color: '#7fff008'
    }));

    axesRoot.appendChild(makeEl('a-text', {
      value: fmt(v, activeMetric.key === 'energy_intensity_kwh_m2' ? 1 : 0),
      position: `${startX - 0.7} ${y - 0.02} ${frontZ}`,
      width: '7.5',
      color: '#00ff00',
      align: 'right'
    }));
  }

  axesRoot.appendChild(makeEl('a-text', {
    value: `${activeMetric.short}`,
    position: `${startX - 0.5} ${maxH + 0.5} ${frontZ}`,
    width: '9.5',
    color: '#4cc9f0',
    align: 'center'
  }));

  axesRoot.appendChild(makeEl('a-text', {
    value: 'Building Order',
    position: `6.50 0.3 ${startZ + zLen + 1.0}`,
    width: '12',
    color: '#ffb454',
    align: 'center'
  }));

  axesRoot.appendChild(makeEl('a-text', {
    value: 'Building Rows',
    position: `${startX - 2.5} 1.35 ${startZ + zLen / 2.5}`,
    rotation: '-10 80 0',
    width: '16',
    color: '#e4007c',
    align: 'center'
  }));
}

function buildChart(ascending = true) {
  clear(chartRoot);
  clear(labelsRoot);
  viewerRoot.setAttribute('visible', 'false');

  if (!DATASET.length) {
    sortLabel.setAttribute('value', 'No data loaded');
    return;
  }

  const data = sortBy(activeMetric.key, ascending);
  const n = data.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const gap = 1.44;
  const startX = -((cols - 1) * gap) / 2;
  const startZ = -10.0 - ((rows - 1) * gap) / 2;
  const maxV = Math.max(...data.map(d => safe(d[activeMetric.key])), 1);
  const maxH = 5.9;
  const base = 0.16;

  sortLabel.setAttribute(
    'value',
    `All ${n} buildings · sorted ${ascending ? 'low to high' : 'high to low'} · Metric: ${activeMetric.label}`
  )
  sortLabel.setAttribute('position', '9 1.5 -1.5')
  sortLabel.setAttribute('rotation', '10 -60 0');

  buildAxes(startX, startZ, cols, rows, maxH, maxV);

  data.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const visualRow=(rows - 1) -  row;
    const x = startX + col * gap;
    const z = startZ + visualRow * gap;
    const h = base + (safe(item[activeMetric.key]) / maxV) * maxH;

    const bar = makeEl('a-box', {
      class: 'interactive',
      position: `${x} ${h / 2} ${z}`,
      width: '0.78',
      depth: '0.78',
      height: String(h),
      color: activeMetric.color,
      material: 'metalness:0.10; roughness:0.50',
      shadow: 'cast:true'
    });

    bar.addEventListener('mouseenter', () => {
      bar.setAttribute('scale', '1.05 1 1.05');
    });

    bar.addEventListener('mouseleave', () => {
      bar.setAttribute('scale', '1 1 1');
    });

    bar.addEventListener('click', () => {
      showViewer(item, bar, h);
    });

    chartRoot.appendChild(bar);

    const name = item.building_name.length > 15
      ? item.building_name.slice(0, 15) + '…'
      : item.building_name;

    labelsRoot.appendChild(makeEl('a-text', {
      value: name,
      position: `${x} 0.05 ${z + 0.56}`,
      rotation: '-90 0 0',
      width: '1.85',
      color: '#93aabd',
      align: 'center'
    }));
  });
}

async function loadData() {
  try {
    statusEl.textContent = 'Loading dataset...';

    const response = await fetch('buildings_energy_2020.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!Array.isArray(json)) {
      throw new Error('JSON file must contain an array of building objects.');
    }

    DATASET = json;

    buildMetricButtons();
    buildChart(ascendingSort);

    statusEl.textContent = 'Desktop: drag to look · WASD to move · click bars/buttons | VR: controller ray to select';
  } catch (error) {
    console.error('Dataset load failed:', error);
    sortLabel.setAttribute('value', 'Dataset failed to load');
    statusEl.textContent = 'Failed to load buildings_energy_2020.json';
  }
}

(function tick() {
  orientViewer();
  requestAnimationFrame(tick);
})();

loadData();