// Gully Cricket: the 3pm gully, the kids and the batting loop. Rules live in logic.js.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const W = 360, H = 640, CX = 180, HZ = 230, BASE = 560, LANE = 190, UNIT = 120, ZFAR = 2.4;
const DPR = Math.min(devicePixelRatio || 1, 3);
const FONT = '"Trebuchet MS", Verdana, sans-serif';
cv.width = W * DPR; cv.height = H * DPR; ctx.scale(DPR, DPR);

// World: x across the lane (-1..1, wall to wall), z down the lane (0 batter, 1 bowler), y up.
const P = (x, z, y = 0) => { const s = 1 / (1 + z * 2.2); return { x: CX + x * LANE * s, y: HZ + (BASE - HZ) * s - y * UNIT * s, s }; };
const lerp = (a, b, u) => a + (b - a) * u;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function poly(g, pts, fill) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.fillStyle = fill; g.fill(); }
function blob(g, x, y, rx, ry, fill) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fillStyle = fill; g.fill(); }
function box(g, x, y, w, h, r, fill) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); g.fillStyle = fill; g.fill(); } // square corners before iOS 16
function line(g, x1, y1, x2, y2) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
const wallQuad = (side, z1, z2, y1, y2) => [P(side, z1, y1), P(side, z2, y1), P(side, z2, y2), P(side, z1, y2)];
const floorQuad = (x1, x2, z1, z2) => [P(x1, z1), P(x2, z1), P(x2, z2), P(x1, z2)];

// ---------- the gully, painted once ----------
const bg = document.createElement('canvas');
bg.width = cv.width; bg.height = cv.height;
(function drawScene(g) {
  g.scale(DPR, DPR);
  const sky = g.createLinearGradient(0, 0, 0, 290);
  sky.addColorStop(0, '#86c0e6'); sky.addColorStop(1, '#f7e6bb');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sun = g.createRadialGradient(70, 0, 0, 70, 0, 170);
  sun.addColorStop(0, 'rgba(255,246,205,.95)'); sun.addColorStop(1, 'rgba(255,246,205,0)');
  g.fillStyle = sun; g.fillRect(0, 0, W, 240);

  // far end: other buildings, a water tank, a tree, the compound wall and gate
  g.fillStyle = '#cdbba3'; g.fillRect(146, 150, 40, 140);
  g.fillStyle = '#b9a88f'; g.fillRect(186, 185, 30, 100);
  box(g, 154, 136, 14, 15, 4, '#2b2b2b');
  g.fillStyle = '#9c8c77';
  for (let y = 160; y < 250; y += 16) for (let x = 152; x < 182; x += 11) g.fillRect(x, y, 5, 8);
  poly(g, [P(-1, ZFAR), P(1, ZFAR), P(1, ZFAR, 0.9), P(-1, ZFAR, 0.9)], '#b98f6f');
  poly(g, [P(-0.3, ZFAR), P(0.3, ZFAR), P(0.3, ZFAR, 0.8), P(-0.3, ZFAR, 0.8)], '#566b76');
  blob(g, 201, 258, 15, 12, '#5f8f4c'); blob(g, 190, 263, 10, 8, '#6fa257');

  // the lane
  poly(g, floorQuad(-1, 1, -0.3, ZFAR), '#c4ae8b');
  [[0.45, 0.35, 0.3], [-0.3, 1.2, 0.4], [0.25, 1.8, 0.35], [-0.55, 0.12, 0.25]].forEach(([x, z, r]) => {
    const p = P(x, z); blob(g, p.x, p.y, r * LANE * p.s, r * 40 * p.s, 'rgba(120,100,75,.22)');
  });
  poly(g, floorQuad(-1, -0.93, -0.3, ZFAR), '#8e7b63'); poly(g, floorQuad(0.93, 1, -0.3, ZFAR), '#8e7b63'); // gutters
  poly(g, floorQuad(-1, -0.15, -0.3, ZFAR), 'rgba(60,45,85,.2)'); // left block's afternoon shadow
  g.strokeStyle = 'rgba(255,255,255,.75)';
  [0, 1].forEach(z => { const a = P(-0.42, z), b = P(0.42, z); g.lineWidth = 3 * a.s; line(g, a.x, a.y, b.x, b.y); }); // chalk creases

  // apartment blocks: [side, z1, z2, height, paint]
  const CLOTH = ['#e2463f', '#f4f1e6', '#2f7fd1', '#f2b632', '#e55b9a'];
  [[-1, -0.3, 0.7, 5, '#e8d59a'], [-1, 0.7, 1.5, 4.2, '#e3aa9a'], [-1, 1.5, ZFAR, 4.8, '#a9cfc4'],
   [1, -0.3, 0.5, 5, '#bfd8a8'], [1, 0.5, 1.6, 4.6, '#efe0b8'], [1, 1.6, ZFAR, 4, '#d9a58c']].forEach(([side, z1, z2, h, paint], n) => {
    poly(g, wallQuad(side, z1, z2, 0, h), paint);
    poly(g, wallQuad(side, z1, z2, 0, 0.3), 'rgba(90,70,50,.3)'); // grimy plinth
    for (let f = 0, yb; (yb = 0.6 + f * 1.15) + 0.8 < h; f++)
      for (let z = z1 + 0.1, i = 0; z + 0.22 < z2; z += 0.34, i++) {
        const k = (n * 7 + f * 3 + i * 5) % 6;
        poly(g, wallQuad(side, z - 0.02, z + 0.22, yb - 0.03, yb + 0.63), 'rgba(255,255,255,.55)');
        poly(g, wallQuad(side, z, z + 0.2, yb, yb + 0.6), k % 2 ? '#3f5f68' : '#2c444c');
        if (k < 2) { // balcony rail with washing hung out
          poly(g, wallQuad(side, z - 0.05, z + 0.25, yb - 0.1, yb + 0.22), 'rgba(70,60,55,.75)');
          for (let j = 0; j < 3; j++) poly(g, wallQuad(side, z - 0.02 + j * 0.08, z + 0.04 + j * 0.08, yb - 0.24, yb + 0.2), CLOTH[(k + j + f + n) % 5]);
        }
      }
    if (side < 0) poly(g, wallQuad(side, z1, z2, 0, h), 'rgba(55,40,85,.24)'); // shaded side
    const a = P(side, z2), b = P(side, z2, h);
    g.strokeStyle = 'rgba(60,45,35,.45)'; g.lineWidth = 1.5; line(g, a.x, a.y, b.x, b.y);
  });

  // cable wires across the lane, crows, and a kite that never came down
  g.strokeStyle = '#2e2a2a'; g.lineWidth = 1;
  const mids = [[0.3, 4.6], [0.9, 3.3], [1.5, 3]].map(([z, y]) => {
    const a = P(-1, z, y), b = P(1, z, y - 0.2), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(mx, my + 16, b.x, b.y); g.stroke();
    return [mx, my + 8];
  });
  [-34, -20, 26].forEach(dx => { const x = mids[0][0] + dx, y = mids[0][1] - 4; blob(g, x, y, 5, 3.5, '#161616'); blob(g, x + 4, y - 3, 2.5, 2.5, '#161616'); });
  const [kx, ky] = mids[1];
  poly(g, [{ x: kx + 12, y: ky }, { x: kx + 18, y: ky + 8 }, { x: kx + 12, y: ky + 18 }, { x: kx + 6, y: ky + 8 }], '#e55b9a');
  g.strokeStyle = '#e55b9a'; line(g, kx + 12, ky + 18, kx + 9, ky + 28);

  scooter(g);
  g.fillStyle = 'rgba(255,180,80,.07)'; g.fillRect(0, 0, W, H); // warm 3pm wash
})(bg.getContext('2d'));

function scooter(g) {
  const p = P(-0.82, 0.3);
  g.save(); g.translate(p.x, p.y); g.scale(p.s * 1.3, p.s * 1.3);
  blob(g, 4, 0, 46, 6, 'rgba(40,30,55,.3)');
  blob(g, -28, -11, 11, 11, '#222'); blob(g, 28, -11, 11, 11, '#222');
  blob(g, -28, -11, 4, 4, '#999'); blob(g, 28, -11, 4, 4, '#999');
  g.beginPath(); g.moveTo(-44, -18); g.quadraticCurveTo(-46, -44, -22, -44); g.lineTo(-4, -40); g.lineTo(0, -22);
  g.lineTo(20, -22); g.lineTo(30, -58); g.lineTo(36, -58); g.lineTo(30, -14); g.lineTo(-40, -14); g.closePath();
  g.fillStyle = '#8fb5c9'; g.fill();
  box(g, -38, -51, 34, 8, 4, '#3a2a20');
  g.strokeStyle = '#333'; g.lineWidth = 3; g.lineCap = 'round'; line(g, 24, -66, 40, -64);
  blob(g, 37, -55, 4, 4, '#f5e9a8');
  g.restore();
}

// ---------- kids ----------
const SKIN = ['#c68b5e', '#b5774a', '#d49a6a', '#a86b42'], SHORTS = ['#3b3f58', '#6b4a2e', '#2f5d50', '#4a4a4a'];
const SHIRT = ['#e2463f', '#2f7fd1', '#f2b632', '#3aa66a', '#8e5bc4', '#ef7f2e', '#e55b9a'];
const INK = '#2a1c12', HAIRC = ['#1d1612', '#3a2114', '#5a1f1f'];
const look = i => ({ skin: SKIN[i % 4], shirt: SHIRT[i % 7], shorts: SHORTS[i % 4], hair: i % 4, hairC: HAIRC[i % 3] });

// A big cartoon head centred on 0,0 (radius about 20), shared by the kids and the aunty.
// k: skin, hair (0 curly, 1 spiky, 2 bowl cut, 3 side part, 4 bun), hairC, back, bindi,
// expr: normal | happy | sad | smug | shock | angry
function head(g, k) {
  const e = k.expr || 'normal', ink = () => { g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke(); };
  g.lineCap = g.lineJoin = 'round';
  blob(g, -20, 3, 5, 6, k.skin); ink(); blob(g, 20, 3, 5, 6, k.skin); ink();
  blob(g, 0, 0, 21, 19, k.skin); ink();
  g.fillStyle = k.hairC; g.beginPath();
  if (k.back) g.arc(0, -1, 20.5, Math.PI * 0.8, Math.PI * 0.2);
  else if (k.hair === 1) [[-21, -5], [-17, -22], [-10, -15], [-4, -26], [3, -16], [10, -25], [15, -14], [21, -5], [12, -11], [-12, -11]].forEach(([x, y]) => g.lineTo(x, y));
  else if (k.hair === 3) { g.moveTo(-21, -6); g.quadraticCurveTo(-18, -25, 2, -21); g.lineTo(7, -30); g.lineTo(10, -20); g.quadraticCurveTo(21, -18, 21, -6); g.quadraticCurveTo(8, -16, -8, -9); }
  else if (k.hair) g.ellipse(0, -9, 21.5, 12, 0, Math.PI, 0);
  g.fill();
  if (k.hair === 4) blob(g, 0, -24, 9, 8, k.hairC);
  if (!k.hair) for (let a = k.back ? 0.75 : 1.05; a <= (k.back ? 2.25 : 1.96); a += 0.13) blob(g, Math.cos(a * Math.PI) * 17, Math.sin(a * Math.PI) * 15 - 3, 7.5, 7.5, k.hairC); // curls
  if (k.back) return;

  blob(g, -13, 8, 4.5, 3, 'rgba(230,90,90,.35)'); blob(g, 13, 8, 4.5, 3, 'rgba(230,90,90,.35)'); // blush
  if (k.bindi) blob(g, 0, -9, 1.8, 1.8, '#c0272d');
  [-1, 1].forEach(sd => {
    const x = sd * 8, shut = e === 'happy' || e === 'sad';
    g.strokeStyle = INK; g.lineWidth = 2.2;
    if (shut) { // squeezed shut: laughing arcs, or crying with tears
      g.beginPath(); e === 'happy' ? g.arc(x, 1, 5, Math.PI, 0) : g.arc(x, -3, 5, 0, Math.PI); g.stroke();
      if (e === 'sad') blob(g, x + sd * 2, 6, 2.2, 4, '#7ec8f0');
    } else {
      const r = e === 'shock' ? 7.5 : 6;
      blob(g, x, -1, r, r + 1, '#fff'); ink();
      blob(g, x + (e === 'smug' ? 2.5 : 0), e === 'smug' ? 1.5 : -1, e === 'shock' ? 1.6 : 2.4, e === 'shock' ? 1.6 : 2.6, INK);
      if (e === 'smug') { g.fillStyle = k.skin; g.fillRect(x - 7.2, -9.5, 14.4, 8.5); g.strokeStyle = INK; line(g, x - 6, -1, x + 6, -1); } // heavy lids
    }
    const by = e === 'shock' ? -14 : -11, t = e === 'angry' ? 3 : e === 'sad' ? -3 : 0; // brows: inner end drops when angry
    g.lineWidth = 2.6; line(g, x - 5, by + sd * t, x + 5, by - sd * t);
  });
  g.lineWidth = 2.2; g.strokeStyle = INK;
  if (e === 'happy') { // wide open grin with teeth
    g.beginPath(); g.arc(0, 7, 8, 0, Math.PI); g.closePath(); g.fillStyle = '#7a1f1f'; g.fill(); ink();
    g.fillStyle = '#fff'; g.fillRect(-5.5, 7.6, 11, 2.6);
  } else if (e === 'shock') { blob(g, 0, 11, 3.5, 4.5, '#7a1f1f'); ink(); }
  else {
    g.beginPath();
    if (e === 'sad') { g.moveTo(-6, 12); g.quadraticCurveTo(-3, 7, 0, 11); g.quadraticCurveTo(3, 14, 6, 10); } // wobbly lip
    else if (e === 'angry') g.arc(0, 15, 5, Math.PI * 1.15, Math.PI * 1.85);
    else if (e === 'smug') { g.moveTo(-5, 10); g.quadraticCurveTo(2, 14, 7, 7); }
    else g.arc(0, 8, 5, 0.3, Math.PI - 0.3);
    g.stroke();
  }
}

function kid(k) {
  if (vz(k.z) < -0.35) return; // behind the camera
  const p = V(k.x, k.z), g = ctx, sw = k.pose === 'run' ? Math.sin(now / 55) * 9 : 0;
  g.save(); g.translate(p.x, p.y); g.scale(p.s * 1.3, p.s * 1.3 * (k.pose === 'crouch' ? 0.85 : 1));
  blob(g, batting ? 9 : -9, 1, 22, 6, 'rgba(40,30,55,.28)');
  g.lineCap = 'round';
  const ink = () => { g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke(); };
  const limb = (x1, y1, x2, y2) => { g.strokeStyle = INK; g.lineWidth = 9; line(g, x1, y1, x2, y2); g.strokeStyle = k.skin; g.lineWidth = 5.5; line(g, x1, y1, x2, y2); };
  const fl = [-6 + sw, -3 - Math.max(0, sw) * 0.6], fr = [6 - sw, -3 - Math.max(0, -sw) * 0.6];
  limb(-6, -26, ...fl); limb(6, -26, ...fr);
  [fl, fr].forEach(f => { blob(g, f[0], f[1] + 3, 7, 3, '#27408b'); ink(); }); // chappals
  box(g, -12, -38, 24, 15, 5, k.shorts); ink();
  const [lx, ly, rx, ry] = { run: [-17 - sw * 0.6, -40, 17 + sw * 0.6, -40], bowl: [-17, -38, 12, -104], catch: [-24, -98, 24, -98], bat: [6, -42, 10, -45] }[k.pose] || [-17, -34, 17, -34];
  limb(-12, -56, lx, ly); limb(12, -56, rx, ry);
  box(g, -13, -62, 26, 28, 8, k.shirt); ink();
  g.save(); g.translate(0, -78); head(g, k); g.restore(); // small body, big head
  if (k.bat !== undefined) { g.translate(8, -44); g.rotate(k.bat); box(g, 0, -2.5, 14, 5, 2, '#5a3d28'); ink(); box(g, 12, -6, 35, 12, 3, '#dba85c'); ink(); }
  g.restore();
}

function crate(tilt) { // the wicket; pivots on its bottom-right corner when bowled
  const p = V(0, -0.07), g = ctx;
  blob(g, p.x + 4, p.y, 34 * p.s, 5 * p.s, 'rgba(40,30,55,.28)');
  g.save(); g.translate(p.x + 27 * p.s, p.y); g.scale(p.s, p.s); g.rotate(tilt * 1.3); g.translate(-27, 0);
  box(g, -27, -48, 54, 48, 4, '#2c5fb3'); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
  box(g, -27, -48, 54, 8, 3, '#4f86de');
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) box(g, -22 + i * 11.5, -35 + j * 16, 8, 11, 2, '#1b3c78');
  g.restore();
}

// ---------- sound: a tiny synth, so there are no audio files to load ----------
let ac = null, muted = false;

function tone(f, dur, type = 'square', vol = 0.1, slide = 0, delay = 0) { // slide: end pitch as a multiple of f
  if (!ac || muted) return;
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur);
}

function thud(dur, vol, cut) { // filtered noise burst: bat on ball, crate falling over
  if (!ac || muted) return;
  const n = ac.sampleRate * dur | 0, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = buf; f.type = 'lowpass'; f.frequency.value = cut; g.gain.value = vol;
  src.connect(f).connect(g).connect(ac.destination); src.start();
}

const jingle = (notes, type = 'square') => notes.forEach((f, i) => tone(f, 0.17, type, 0.09, 0, i * 0.1));

// ---------- match ----------
// Everything below works in pitch coords: z 0 = the batter's crate, z 1 = the bowler's brick.
// Batting is seen from behind the batter; bowling is the same gully seen from the bowler's end.
const FIELD = [{ x: 0.08, z: 1 }, { x: -0.7, z: 0.62 }, { x: 0.72, z: 0.5 }, { x: -0.5, z: 1.35 }, { x: 0.55, z: 1.55 }]; // [0] bowls
const COVERS = FIELD.map(f => clamp(f.x / f.z, -1, 1));
const KEEPER = { x: 0.42, z: -0.1 };
const MSG = { six: 'CHHAKKA!', four: 'CHAUKA!', one: 'EK RUN', dot: 'DOT BALL', miss: 'MISS!', caught: 'CATCH OUT!', house: 'OUT!', bowled: 'BOWLED!' };
const POOL = ['Bittu', 'Billu', 'Pappu', 'Golu', 'Chintu', 'Monu', 'Sonu', 'Tinku', 'Bunty', 'Guddu', 'Chhotu', 'Raju', 'Lallu', 'Pintu', 'Bablu', 'Munna'];
const WEATHER = { Dhoop: ['kadak dhoop'], Dhool: ['dhool bhari hawa', 'rgba(235,190,120,.22)'], Badal: ['badal aur boonda-baandi', 'rgba(70,85,110,.28)'] };
const AUNTY = { skin: '#c68b5e', shirt: '#b8336a', hair: 4, hairC: '#1d1612', bindi: true };
const nameEl = document.getElementById('name');

let now = 0, t0 = 0, mode = 'title', ball = null, swing = null, out = null, who = -1, aim = null, auntySide = 0; // auntySide: which wall's window she is scolding from
let mine = [], opp = [], weather = 'Dhoop', call = '', coin = '';
const PLAY = ['aim', 'runup', 'flight', 'hit', 'result']; // a ball is live; every other mode is a menu
let batting = true, first = 'bat', inn = 0, scores = [], st = { runs: 0, wkts: 0, balls: 0, log: [] };
const vz = z => batting ? z : 1 - z;
const V = (x, z, y) => batting ? P(x, z, y) : P(-x, 1 - z, y);
const setMode = m => { mode = m; t0 = now; nameEl.hidden = m !== 'title'; };
const onStumps = () => Math.abs(ball.line) < 0.14;
const target = () => inn ? scores[0].runs + 1 : 0;
const meter = () => 0.5 - 0.5 * Math.cos((now - t0) / 450 * Math.PI); // bowling speed, swings 0..1
const pm = () => Math.random() < 0.5 ? -1 : 1;
const bowlerName = () => batting ? opp[(st.balls / 6 | 0) % 7] : mine[0]; // their bowler changes every over, you bowl all of yours
const batterName = () => (batting ? mine : opp)[Math.min(st.wkts, 6)];

function newMatch() { // fresh teams and weather, then the toss
  const me = nameEl.value.trim() || 'Chintu';
  try { localStorage.gullyName = me; } catch {}
  const pool = POOL.filter(n => n.toLowerCase() !== me.toLowerCase()).sort(() => Math.random() - 0.5);
  mine = [me, ...pool.slice(0, 6)]; opp = pool.slice(6, 13);
  weather = Object.keys(WEATHER)[Math.random() * 3 | 0];
  scores = []; inn = 0; st = { runs: 0, wkts: 0, balls: 0, log: [] }; // nothing left over from the last match
  setMode('toss');
}

function startInnings(i) {
  inn = i; batting = (i === 0) === (first === 'bat');
  st = scores[i] = { runs: 0, wkts: 0, balls: 0, log: [] };
  newBall();
}

function newBall() {
  swing = out = aim = null; who = -1; auntySide = 0;
  if (!batting) return setMode('aim'); // the player bowls when ready
  ball = { T: 750 + Math.random() * 400, line: (Math.random() * 2 - 1) * 0.3, zb: 0.25 + Math.random() * 0.2, x: 0, y: 0, z: 1 };
  setMode('runup');
}

function setAim(x, y) { // drag anywhere: across = line, up the screen = fuller. Screen right is pitch -x from this end.
  aim = { line: -clamp((x - CX) / 150, -1, 1) * 0.3, zb: lerp(0.08, 0.6, clamp((y - 260) / 300, 0, 1)) };
}

function release() { // the AI batter's fate is settled as the ball leaves the hand
  const speed = meter();
  ball = { T: lerp(1150, 700, speed), line: aim.line, zb: aim.zb, x: 0, y: 0, z: 1 };
  out = aiOutcome(aim.line, aim.zb, speed, Math.random());
  // where the shot goes; fielded and caught balls go to the fielders the camera can see
  ball.d = { six: Math.random() * 0.5 - 0.25, four: pm() * (0.4 + Math.random() * 0.35), house: pm() * 0.9, one: pm() * 0.68 }[out] ?? COVERS[Math.random() * 3 | 0];
  aim = null; setMode('runup');
}

function flight(z) { // where the bowled ball is at depth z; it pitches at zb
  const b = ball, v = (b.zb - z) / b.zb;
  b.z = z; b.x = lerp(0.08, b.line, 1 - z);
  b.y = z > b.zb ? 0.95 * (1 - ((1 - z) / (1 - b.zb)) ** 2) : 0.5 * v * (1.7 - 0.7 * v);
}

function tap(x) {
  const el = performance.now() - t0;
  if (mode === 'title') return newMatch();
  if (mode === 'toss') { call = x < CX ? 'Seedha' : 'Ulta'; coin = pm() < 0 ? 'Seedha' : 'Ulta'; return setMode('flip'); }
  if (mode === 'choose') { first = x < CX ? 'bat' : 'bowl'; return startInnings(0); }
  if ((mode === 'lost' || mode === 'break') && el > 700) return startInnings(mode === 'lost' ? 0 : 1);
  if (mode === 'over' && el > 700) return newMatch(); // straight into the next match, same name, new teams
  if (mode !== 'flight' || !batting || swing) return;
  const d = clamp((x - CX) / 150, -1, 1);
  out = shotOutcome(Math.abs(el - ball.T), d, onStumps(), Math.random(), COVERS);
  swing = { t: now, d, hit: out !== 'bowled' && out !== 'miss' };
  if (!swing.hit) tone(300, 0.15, 'sine', 0.08, 0.4); // swish
}

function startHit() {
  flight(0);
  thud(0.06, 0.5, 2500); tone(180, 0.08, 'triangle', 0.25, 0.5); // bat on ball
  const b = ball, d = swing.d;
  who = COVERS.reduce((m, c, i) => Math.abs(c - d) < Math.abs(COVERS[m] - d) ? i : m, 0);
  const f = FIELD[who];
  b.from = { x: b.x, z: 0, y: b.y }; b.hitT = now;
  [b.to, b.peak, b.dur] = {
    six: [{ x: d * 2, z: 4.5, y: 2.5 }, 2.2, 1400],
    four: [{ x: clamp(d * 1.5, -0.9, 0.9), z: ZFAR, y: 0.05 }, 0, 900],
    one: [{ x: d * 0.8, z: 1.1, y: 0.05 }, 0.15, 1100],
    dot: [{ x: f.x, z: f.z, y: 0.1 }, 0.1, 450],
    caught: [{ x: f.x, z: f.z, y: 1.2 }, 1.6, 1100],
    house: [{ x: Math.sign(d), z: 0.85, y: 2 }, 1, 800],
  }[out];
  setMode('hit');
}

function finish(o) {
  out = o;
  const w = OUTS.includes(o);
  if (o === 'bowled') thud(0.25, 0.5, 900);
  if (!w && !(RUNS[o] > 1)) tone(o === 'one' ? 660 : 200, 0.1, 'triangle', 0.1);
  else if (w !== batting) jingle(o === 'four' ? [523, 659, 784] : [523, 659, 784, 1047]); // good news for you: boundary hit or wicket taken
  else jingle([392, 330, 262, 196], 'sawtooth');
  if (o === 'house') auntySide = Math.sign(ball.to.x);
  applyBall(st, o); setMode('result');
}

function frame(t) {
  requestAnimationFrame(frame); // booked first, so one bad frame can never freeze the game for good
  const gap = t - now; // the page was hidden (a call, another app): the ball must not fly on without the player
  if (gap > 250) { t0 += gap; if (ball && ball.hitT) ball.hitT += gap; }
  now = t;
  const el = now - t0, b = ball;
  if (mode === 'flip' && el > 1300) { // toss lost: the other captain picks
    thud(0.08, 0.4, 1200);
    if (call === coin) setMode('choose'); else { first = pm() < 0 ? 'bat' : 'bowl'; setMode('lost'); }
  } else if (mode === 'runup' && el > (batting ? 900 : 500)) setMode('flight');
  else if (mode === 'flight') {
    if (!batting && !swing && el >= b.T - 120) swing = { t: now, d: b.d, hit: out !== 'bowled' }; // AI batter swings
    if (swing && swing.hit && el >= b.T) startHit();
    else {
      flight(Math.max(-0.1, 1 - el / b.T)); // the ball stops at the crate, but a late swing can still reach it
      if (!b.pitched && b.z <= b.zb) { b.pitched = true; tone(140, 0.05, 'sine', 0.15, 0.6); }
      if (el > b.T + SWING_MS) finish(out || shotOutcome(1e9, 0, onStumps(), 0, COVERS));
    }
  } else if (mode === 'hit') {
    const u = Math.min(1, el / b.dur);
    b.x = lerp(b.from.x, b.to.x, u); b.z = lerp(b.from.z, b.to.z, u);
    b.y = lerp(b.from.y, b.to.y, u) + b.peak * Math.sin(Math.PI * u);
    if (u >= 1) finish(out);
  } else if (mode === 'result' && el > 1400) inningsOver(st, target()) ? setMode(inn ? 'over' : 'break') : newBall();
  draw();
}

// ---------- drawing a frame ----------
function text(t, y, size, col = '#fff', x = CX) {
  const g = ctx; g.font = `bold ${size}px ${FONT}`; g.textAlign = 'center'; g.lineJoin = 'round';
  g.lineWidth = Math.max(3, size / 5); g.strokeStyle = '#2a1c12'; g.strokeText(t, x, y, W - 24);
  g.fillStyle = col; g.fillText(t, x, y, W - 24);
}

function hud() {
  const g = ctx; box(g, 8, 8, W - 16, 52, 10, 'rgba(26,40,33,.9)');
  g.textAlign = 'left'; g.fillStyle = '#b9d6c4'; g.font = `bold 10px ${FONT}`; g.fillText(`${batterName()} vs ${bowlerName()}`.toUpperCase(), 20, 20);
  g.fillStyle = '#f6f0dc'; g.font = `bold 24px ${FONT}`; g.fillText(`${st.runs}/${st.wkts}`, 20, 42);
  g.textAlign = 'right'; g.font = `bold 13px ${FONT}`; g.fillText(`${st.balls / 6 | 0}.${st.balls % 6} / ${OVERS} ov`, W - 20, 23);
  const n = st.balls % 6 || Math.min(st.balls, 6); // this over's balls
  g.textAlign = 'center'; g.font = `bold 10px ${FONT}`;
  st.log.slice(st.balls - n).forEach((o, i) => {
    const x = W - 28 - (n - 1 - i) * 20, w = OUTS.includes(o);
    blob(g, x, 44, 8, 8, w ? '#d8453a' : RUNS[o] > 1 ? '#d9a514' : '#4a6357');
    g.fillStyle = '#fff'; g.fillText(w ? 'W' : RUNS[o] || '•', x, 44.5);
  });
  // the chase line belongs to live play only, not the result screen of a failed chase
  if (inn && PLAY.includes(mode) && st.runs < target()) text(`Chahiye ${target() - st.runs} run, ${OVERS * 6 - st.balls} ball mein`, 76, 14, '#ffd23f');
}

function buttons(l, r) { // every two-way choice: tap the left or right half
  box(ctx, 20, 500, 152, 64, 14, '#2f7fd1'); box(ctx, 188, 500, 152, 64, 14, '#3aa66a');
  text(l, 533, 22, '#fff', 96); text(r, 533, 22, '#fff', 264);
}

function tossPack(a, y) { // an empty pouch off the street. cos(a) > 0 lands label up (seedha), otherwise the silver back (ulta)
  const g = ctx, c = Math.cos(a), front = c > 0;
  g.save(); g.translate(CX, y); g.rotate(-0.25); g.scale(1, Math.max(0.08, Math.abs(c)));
  g.beginPath(); // sachet with crimped, zigzag ends
  for (let i = 0; i <= 8; i++) g.lineTo(-40 + i * 10, -62 + (i % 2 ? 6 : 0));
  for (let i = 8; i >= 0; i--) g.lineTo(-40 + i * 10, 62 - (i % 2 ? 6 : 0));
  g.closePath(); g.fillStyle = front ? '#1f5fc4' : '#c9ced6'; g.fill();
  g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  g.strokeStyle = front ? '#184a99' : '#a9afb9'; g.lineWidth = 2; line(g, -37, -48, 37, -48); line(g, -37, 48, 37, 48);
  if (front) { // made-up brand, so no real trademark is used
    blob(g, 0, -4, 31, 21, '#f4d03f'); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#c0272d'; g.textAlign = 'center'; g.font = `bold 13px ${FONT}`; g.fillText('DHAMAAL', 0, -4);
    g.fillStyle = '#f4d03f'; g.font = `bold 9px ${FONT}`; g.fillText('MEETHA MASALA', 0, 32);
  } else line(g, 0, -46, 0, 46); // back seam
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(-34, -40); g.lineTo(-18, -40); g.lineTo(-34, 30); g.closePath(); g.fill(); // foil shine
  g.restore();
}

function aunty(side) { // leans out of the window the ball went into
  const g = ctx, p = V(side, 0.85, 1.72);
  poly(g, [V(side, 0.7, 1.6), V(side, 1, 1.6), V(side, 1, 2.5), V(side, 0.7, 2.5)], '#22363d');
  g.save(); g.translate(p.x, p.y); g.scale(p.s * 1.3, p.s * 1.3); g.lineCap = 'round';
  g.strokeStyle = INK; g.lineWidth = 9; line(g, 13, 0, 26, -24); g.strokeStyle = AUNTY.skin; g.lineWidth = 5.5; line(g, 13, 0, 26, -24); // one hand up, scolding
  box(g, -16, -8, 32, 32, 8, AUNTY.shirt); g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke();
  g.strokeStyle = '#f2b632'; g.lineWidth = 4; line(g, -10, 20, 10, -4); // pallu
  g.translate(0, -24); head(g, { ...AUNTY, expr: 'angry' });
  g.restore();
}

function draw() {
  const g = ctx, el = now - t0, live = mode === 'hit' || mode === 'result';
  if (batting) g.drawImage(bg, 0, 0, W, H);
  else { g.save(); g.scale(-1, 1); g.drawImage(bg, -W, 0, W, H); g.restore(); } // the lane from the other end
  g.textBaseline = 'middle';
  const E = []; // everything standing in the lane, painted far to near
  const hitU = mode === 'hit' ? Math.min(1, el / ball.dur) : 1;
  const wkt = mode === 'result' && OUTS.includes(out), big = mode === 'result' && RUNS[out] > 1;
  const fexpr = wkt ? 'happy' : big ? 'sad' : 'normal', bexpr = wkt ? 'sad' : big ? 'happy' : 'normal'; // fielding side's faces, batting side's
  FIELD.forEach((f, i) => {
    let { x, z } = f, pose;
    if (i === 0 && mode === 'aim') z = 1.15; // waiting at the top of a short run-up
    if (i === 0 && mode === 'runup') { z = batting ? 1.3 - 0.3 * Math.min(1, el / 900) : 1.15 - 0.15 * Math.min(1, el / 500); pose = 'run'; }
    if (i === 0 && mode === 'flight' && el < 260) pose = 'bowl';
    if (live && who === i && out === 'one') { x = lerp(x, ball.to.x, hitU); z = lerp(z, ball.to.z, hitU); if (hitU < 1) pose = 'run'; }
    if (live && who === i && out === 'caught' && hitU > 0.6) pose = 'catch';
    if (wkt && !pose) pose = 'catch'; // a wicket: everyone's arms go up
    E.push({ z, f: () => kid({ x, z, pose, expr: i === 0 && mode === 'runup' ? 'smug' : fexpr, back: !batting, ...look(i || batting ? i + 2 : 0) }) }); // red shirt is always you
  });
  const ran = live && out === 'one' ? clamp((now - ball.hitT) / 1000, 0, 1) : 0;
  const e = swing ? Math.min(1, (now - swing.t) / 140) : 0, vd = swing ? (batting ? swing.d : -swing.d) : 0;
  const bat = lerp(1.25, !swing ? 1.25 : vd < -0.3 ? 3.75 : vd > 0.3 ? -0.8 : -1.5, e);
  const bz = lerp(0.02, 1, ran);
  E.push({ z: bz, f: () => kid({ x: -0.17, z: bz, back: batting, pose: ran > 0 && ran < 1 ? 'run' : 'bat', bat, expr: bexpr, ...look(st.wkts + (batting ? 0 : 2)) }) });
  E.push({ z: -0.07, f: () => crate(out === 'bowled' && mode === 'result' ? Math.min(1, el / 250) : 0) });
  E.push({ z: -0.1, f: () => kid({ ...KEEPER, back: batting, pose: 'crouch', expr: fexpr, ...look(1) }) });
  E.push({ z: 1, f: () => { const p = V(0.2, 1); box(g, p.x - 19 * p.s, p.y - 16 * p.s, 38 * p.s, 19 * p.s, 2 * p.s, '#a8452f'); } }); // brick at the bowler's end
  if (mode === 'flight' || mode === 'hit' || (mode === 'result' && !['six', 'four', 'house'].includes(out)))
    E.push({ z: ball.z, f: () => {
      if (vz(ball.z) < -0.35) return;
      const p = V(ball.x, ball.z, ball.y), q = V(ball.x, ball.z), r = Math.max(1.8, 6.5 * p.s);
      blob(g, q.x, q.y, 7 * q.s, 2.5 * q.s, 'rgba(40,30,55,.3)');
      blob(g, p.x, p.y, r, r, '#d9ea3f'); g.strokeStyle = '#6b7a12'; g.lineWidth = 1; g.stroke();
    } });
  if (auntySide && mode === 'result') aunty(auntySide);
  E.sort((a, b) => vz(b.z) - vz(a.z)).forEach(o => o.f());

  const tint = WEATHER[weather][1];
  if (tint) { g.fillStyle = tint; g.fillRect(0, 0, W, H); }
  if (weather === 'Badal') { // light drizzle
    g.strokeStyle = 'rgba(220,230,245,.45)'; g.lineWidth = 1;
    for (let i = 0; i < 40; i++) { const x = (i * 97 + now * 0.05) % W, y = (i * 53 + now * 0.5) % H; line(g, x, y, x - 3, y + 10); }
  }
  if (mine.length) hud();
  if (mode === 'aim') {
    if (aim) { // where the ball will pitch
      const p = V(lerp(0.08, aim.line, 1 - aim.zb), aim.zb);
      g.beginPath(); g.ellipse(p.x, p.y, 16 * p.s + 4, 6 * p.s + 2, 0, 0, 7); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      blob(g, p.x, p.y, 3, 1.5, '#d8453a');
    } else { text('Drag to aim', 440, 18); text('Release to bowl', 464, 18); }
    const m = meter(), grad = g.createLinearGradient(0, 500, 0, 300);
    grad.addColorStop(0, '#4fae5a'); grad.addColorStop(0.6, '#e6b422'); grad.addColorStop(1, '#d8453a');
    box(g, 326, 296, 22, 208, 11, 'rgba(26,40,33,.9)'); box(g, 331, 300, 12, 200, 6, grad);
    box(g, 324, 497 - 194 * m, 26, 6, 3, '#fff');
    text('FAST', 284, 11, '#fff', 337); text('SLOW', 516, 11, '#fff', 337);
  }
  if (mode === 'result') {
    const pop = Math.min(1, el / 150), bad = OUTS.includes(out) === batting; // a wicket is good news when you bowl
    text(MSG[out], 130, 22 + 22 * pop, OUTS.includes(out) || RUNS[out] > 1 ? (bad ? '#ff6a5c' : '#ffd23f') : '#fff');
  }
  if (!PLAY.includes(mode)) { g.fillStyle = 'rgba(20,14,10,.6)'; g.fillRect(0, 0, W, H); }
  const blink = 0.6 + 0.4 * Math.sin(now / 300);
  if (mode === 'title') {
    text('GULLY', 130, 60, '#ffd23f'); text('CRICKET', 188, 60, '#ffd23f');
    text('Dopahar ke 3 baje. Gully mein match!', 236, 15);
    text('BATTING: tap where you want to hit,', 292, 14); text('when the ball reaches you.', 312, 14);
    text('BOWLING: drag to aim the ball,', 346, 14); text('release when the speed bar is high.', 366, 14);
    text('Balcony mein gayi = OUT', 404, 14, '#ffb0a6');
    text('Tumhara naam', 460, 15);
  }
  if (mode === 'toss' || mode === 'flip' || mode === 'choose' || mode === 'lost') {
    const u = mode === 'flip' ? Math.min(1, el / 1300) : mode === 'toss' ? 0 : 1;
    text('TOSS', 112, 44, '#ffd23f'); text(`Aaj ka mausam: ${WEATHER[weather][0]}`, 150, 13);
    text(`${mine[0]} ki team`, 190, 16, '#c9f0a8'); text(mine.slice(1).join(', '), 210, 11);
    text(`${opp[0]} ki team`, 242, 16, '#ffb0a6'); text(opp.slice(1).join(', '), 262, 11);
    tossPack(u * Math.PI * (coin === 'Ulta' ? 7 : 6), 356 - 70 * Math.sin(Math.PI * u));
    if (mode === 'toss') { text('Pudiya uchhlegi. Kya bologe?', 458, 17); buttons('SEEDHA', 'ULTA'); }
    if (mode === 'choose') { text(`${coin} aaya! Toss tumhara.`, 446, 18, '#ffd23f'); text('Pehle kya karoge?', 472, 15); buttons('BATTING', 'BOWLING'); }
    if (mode === 'lost') { text(`${coin} aaya! Toss ${opp[0]} ka.`, 446, 18, '#ff6a5c'); text(`Unhone pehle ${first === 'bat' ? 'bowling' : 'batting'} li.`, 472, 15); }
  }
  if (mode === 'break') {
    text('INNINGS KHATAM!', 190, 30, '#ffd23f'); text(`${st.runs}/${st.wkts}`, 258, 64);
    text(`Target: ${st.runs + 1}`, 330, 24); text(first === 'bat' ? 'Ab tumhari bowling' : 'Ab tumhari batting', 366, 16);
  }
  if (mode === 'over') {
    const [a, b] = scores, you = first === 'bat' ? a : b, they = first === 'bat' ? b : a, v = verdict(scores, first);
    text({ tie: 'TIE!', won: 'JEET GAYE!', lost: 'HAAR GAYE...' }[v.result], 190, 40, { tie: '#fff', won: '#ffd23f', lost: '#ff6a5c' }[v.result]);
    text(v.margin ? `${v.margin} se` : 'kal phir se', 232, 18);
    text(`${mine[0]} ki team  ${you.runs}/${you.wkts}`, 300, 22); text(`${opp[0]} ki team  ${they.runs}/${they.wkts}`, 336, 22);
  }
  const cta = { title: 'TAP TO TOSS', lost: 'TAP TO CONTINUE', break: 'TAP TO CONTINUE', over: 'TAP FOR NEW MATCH' }[mode];
  if (cta) { g.globalAlpha = blink; text(cta, mode === 'title' ? 578 : 540, 24); g.globalAlpha = 1; }
}

const at = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H]; };
cv.addEventListener('pointerdown', ev => {
  ac ||= new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); // browsers only allow sound after a touch
  if (!PLAY.includes(mode)) tone(880, 0.04, 'square', 0.05);
  const [x, y] = at(ev); mode === 'aim' ? setAim(x, y) : tap(x);
});
cv.addEventListener('pointermove', ev => { if (aim && mode === 'aim') setAim(...at(ev)); });
cv.addEventListener('pointerup', () => { if (aim && mode === 'aim') release(); });
cv.addEventListener('pointercancel', () => { aim = null; });
nameEl.addEventListener('keydown', ev => { if (ev.key === 'Enter') newMatch(); });
const muteEl = document.getElementById('mute');
function setMute(m) {
  muted = m; muteEl.textContent = m ? '🔇' : '🔊'; muteEl.setAttribute('aria-pressed', m);
  try { localStorage.gullyMute = m ? 1 : ''; } catch {}
}
muteEl.addEventListener('click', () => setMute(!muted));
try { nameEl.value = localStorage.gullyName || ''; setMute(!!localStorage.gullyMute); } catch {}
requestAnimationFrame(frame);
