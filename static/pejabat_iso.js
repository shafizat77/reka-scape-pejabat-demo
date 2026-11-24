// =============================================================================
// Pejabat Maya REKA SCAPE - paparan ISOMETRIK 2D dengan watak pixel
// Watak: 'Claude Office' oleh W17ANT, lesen MIT (static/sprites/claude-office/LICENSE)
// =============================================================================
(function () {
// ============================================================================
// Pejabat isometrik (latar: static/pejabat_latar.png, watak dilukis di atasnya)
// Koordinat dalam piksel gambar 1920x1080.
// ============================================================================
const cv = $("cv"), g = cv.getContext("2d");
const W = cv.width, H = cv.height;
const BG = new Image(); BG.src = "static/pejabat_latar.png";
// Gambar dikecilkan sedikit & diletak di tengah supaya bahagian atas bangunan tidak terpotong
const VIEW = { s: 0.86, ox: 1920 * 0.07, oy: 112 };

// ---------------------------------------------------------------------------
// Peta laluan pejalan kaki (koordinat piksel gambar 1920x1080).
// Staf hanya berjalan di sepanjang garis antara titik ini: lorong, lobi, tangga, tingkat atas.
// ---------------------------------------------------------------------------
const NODES = {
  // Kaunter & lobi
  J: [265, 672], JA: [222, 668], JL: [188, 764], LB1: [229, 834], LB2: [342, 903], LB3: [482, 929], LB4: [596, 852], LB5: [640, 782],
  // Tangga (bawah -> pelantar -> atas)
  S0: [591, 693], S1: [442, 546], S2: [346, 502], S3: [425, 426], S4: [500, 374],
  // Tingkat atas (depan bilik mesyuarat)
  U0: [555, 368], U1: [607, 381], U2: [642, 393], U3: [774, 399], U4: [905, 372], U5: [1027, 333],
  // Lorong tengah (antara baris meja)
  W0: [713, 744], A1: [743, 723], A2: [822, 708], A3: [907, 688], A4: [996, 659], A5: [1081, 632], A6: [1166, 602], A7: [1278, 571],
  // Lorong hadapan (depan baris meja bawah)
  FW0: [675, 902], FW1: [789, 929], F1: [867, 878], F2: [956, 854], F3: [1045, 831], F4: [1135, 805], F5: [1219, 781], F6: [1304, 756], F7: [1385, 734],
  // Sebelah kanan & pantri
  EN1: [1372, 582], EN2: [1404, 668], LG0: [1477, 709], K0: [1666, 723],
  // Tempat duduk / berdiri
  D_website: [741, 697], D_video: [821, 683], D_perancang_bandar: [906, 663], D_jualan_online: [995, 634],
  D_sewa_rumah: [1080, 607], D_grafik: [1165, 576],
  D_3d: [865, 825], D_baju: [954, 801], D_caption: [1044, 779], D_surat: [1133, 754], D_telegram: [1218, 729],
  R_chair1: [351, 868], R_chair2: [535, 863], R_sofa1: [1530, 684], R_sofa2: [1600, 699], R_kitchen: [1708, 664],
  R_meet1: [721, 372], R_meet2: [826, 376], R_meet3: [927, 350], R_window: [1030, 330],
};
const EDGES = [
  ["J", "JA"], ["JA", "JL"], ["JL", "LB1"], ["LB1", "LB2"], ["LB2", "LB3"], ["LB3", "LB4"], ["LB4", "LB5"], ["LB2", "R_chair1"], ["LB4", "R_chair2"],
  ["LB5", "S0"], ["S0", "S1"], ["S1", "S2"], ["S2", "S3"], ["S3", "S4"], ["S4", "U0"],
  ["U0", "U1"], ["U1", "U2"], ["U2", "U3"], ["U3", "U4"], ["U4", "U5"],
  ["U2", "R_meet1"], ["U3", "R_meet2"], ["U4", "R_meet3"], ["U5", "R_window"],
  ["LB5", "W0"], ["W0", "A1"], ["A1", "A2"], ["A2", "A3"], ["A3", "A4"], ["A4", "A5"], ["A5", "A6"], ["A6", "A7"],
  ["LB5", "FW0"], ["LB4", "FW0"], ["FW0", "FW1"], ["FW1", "F1"], ["F1", "F2"], ["F2", "F3"], ["F3", "F4"], ["F4", "F5"], ["F5", "F6"], ["F6", "F7"],
  ["A7", "EN1"], ["EN1", "EN2"], ["EN2", "F7"], ["EN2", "LG0"], ["LG0", "R_sofa1"], ["R_sofa1", "R_sofa2"], ["LG0", "K0"], ["K0", "R_kitchen"],
  ["A1", "D_website"], ["A2", "D_video"], ["A3", "D_perancang_bandar"], ["A4", "D_jualan_online"], ["A5", "D_sewa_rumah"], ["A6", "D_grafik"],
  ["F1", "D_3d"], ["F2", "D_baju"], ["F3", "D_caption"], ["F4", "D_surat"], ["F5", "D_telegram"],
];
const ADJ = {};
for (const [a, b] of EDGES) {
  const d = Math.hypot(NODES[a][0] - NODES[b][0], NODES[a][1] - NODES[b][1]);
  (ADJ[a] = ADJ[a] || []).push([b, d]); (ADJ[b] = ADJ[b] || []).push([a, d]);
}
function shortestPath(from, to) {          // Dijkstra kecil
  const dist = { [from]: 0 }, prev = {}, todo = new Set(Object.keys(NODES));
  while (todo.size) {
    let u = null; for (const n of todo) if (dist[n] !== undefined && (u === null || dist[n] < dist[u])) u = n;
    if (u === null || u === to) break;
    todo.delete(u);
    for (const [v, w] of ADJ[u] || []) if (dist[u] + w < (dist[v] ?? Infinity)) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  const out = []; for (let n = to; n; n = prev[n]) { out.unshift(n); if (n === from) break; }
  return out[0] === from ? out : [from, to];
}

// Tempat duduk setiap staf (nod), dan bilik khas
const SEAT = { penyambut: "J" };
for (const id of ["website", "video", "perancang_bandar", "jualan_online", "sewa_rumah", "grafik", "3d", "baju", "caption", "surat", "telegram"]) SEAT[id] = "D_" + id;
const PRIVATE = {   // bilik sendiri: tidak keluar dari bilik. spots = laluan kecil dalam bilik
  lead:      { home: [1430, 222], spots: [[[1334, 206]], [[1334, 206], [1290, 284]], [[1515, 240]]], label: "PEJABAT CEO" },
  penasihat: { home: [1100, 218], spots: [[[1060, 252]], [[1170, 272]], [[1150, 232]]], label: "PEJABAT PENASIHAT" },
};
const REST_NODES = ["R_chair1", "R_chair2", "R_sofa1", "R_sofa2", "R_kitchen", "R_meet1", "R_meet2", "R_meet3", "R_window"];
const DESKS = {};   // untuk cahaya monitor
for (const [id, n] of Object.entries(SEAT)) DESKS[id] = NODES[n];
for (const [id, r] of Object.entries(PRIVATE)) DESKS[id] = r.home;

const people = {};
function syncPeople() {
  for (const s of STATE.staff) {
    let p = people[s.id];
    if (!p) {
      const pr = PRIVATE[s.id];
      const [x, y] = pr ? pr.home : NODES[SEAT[s.id]] || [960, 900];
      p = people[s.id] = { id: s.id, x, y, path: [], node: pr ? null : SEAT[s.id], mode: "desk",
                           wanderAt: performance.now() + 8000 + Math.random() * 40000 };
    }
    p.info = s;
    if (s.state === "sibuk" && p.mode !== "desk" && p.mode !== "going_desk") goDesk(p);
  }
}
function walkTo(p, target) {               // ikut laluan sahaja
  const route = shortestPath(p.node, target).slice(1).map(n => [...NODES[n], n]);
  const [hx, hy] = NODES[p.node];           // kembali ke titik terakhir dahulu jika di tengah laluan
  p.path = Math.hypot(p.x - hx, p.y - hy) > 1 ? [[hx, hy, p.node], ...route] : route;
}
function goDesk(p) {
  const pr = PRIVATE[p.id];
  if (pr) {
    const back = (p.privRoute || []).slice(0, -1).reverse().map(([x, y]) => [x, y, null]);
    p.path = [...back, [...pr.home, null]]; p.privRoute = null; p.mode = "going_desk"; return;
  }
  walkTo(p, SEAT[p.id]); p.mode = "going_desk";
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(r)},${c(gg)},${c(b)})`;
}

// ---------------------------------------------------------------------------
// Watak pixel: "Claude Office" oleh W17ANT (lesen MIT) - static/sprites/claude-office/
// ---------------------------------------------------------------------------
const SPRITE_OF = {
  lead: "employee-3", penasihat: "Frontend-dev-1", penyambut: "employee-2",
  website: "dev-1", video: "Me-1", perancang_bandar: "Claude-1", jualan_online: "dev-2",
  sewa_rumah: "security-audit-1", grafik: "Frontend-dev-1", "3d": "explore-1", baju: "employee-1",
  caption: "employee-2", surat: "security-audit-1", telegram: "Me-1",
};
const SPR_BASE = "static/sprites/claude-office/";
const SPR = {};          // nama -> { fl, fr, rl, rr, walk: { fl:[4], fr:[4], rl:[4] } }
function loadImg(src) { const i = new Image(); i.src = src; return i; }
for (const n of new Set(Object.values(SPRITE_OF))) {
  const s = SPR[n] = { walk: {} };
  for (const d of ["front-left", "front-right", "rear-left", "rear-right"]) s[d] = loadImg(`${SPR_BASE}${n}-${d}.png`);
  for (const d of ["front-left", "front-right", "rear-left"]) s.walk[d] = [1, 2, 3, 4].map(k => loadImg(`${SPR_BASE}${n}-${d}-walk${k}.webp`));
}
const ready = (img) => img && img.complete && img.naturalWidth > 0;
const SPR_H = 118;       // tinggi watak (piksel gambar latar)

function facing(p) {
  // arah ikut pergerakan di skrin; duduk di meja = menghadap penonton
  if (p.path.length && (Math.abs(p.vx) + Math.abs(p.vy)) > 0.01) {
    p.lastDir = (p.vy >= 0 ? "front-" : "rear-") + (p.vx >= 0 ? "right" : "left");
  } else if (p.mode === "desk") p.lastDir = PRIVATE[p.id] ? "front-right" : "front-left";
  return p.lastDir || "front-left";
}

const SCALE = 1.0;
function drawPerson(p, t) {
  const s = p.info, sp = SPR[SPRITE_OF[p.id]];
  const walking = p.path.length > 0, busy = s.state === "sibuk" && !walking;
  const seated = !walking && p.mode === "desk";
  const dir = facing(p);
  // bayang & cincin status
  g.fillStyle = "rgba(0,0,0,.30)"; g.beginPath(); g.ellipse(p.x, p.y, 20, 7, 0, 0, Math.PI * 2); g.fill();
  if (s.state === "sibuk") {
    g.strokeStyle = `rgba(255,200,60,${0.55 + 0.35 * Math.sin(t / 250)})`; g.lineWidth = 3;
    g.beginPath(); g.ellipse(p.x, p.y, 27, 10, 0, 0, Math.PI * 2); g.stroke();
  }
  if (!sp) return;
  // pilih bingkai: berjalan = 4 bingkai; belakang-kanan = belakang-kiri diterbalikkan
  let img, flip = false;
  if (walking) {
    const frameNo = Math.floor(t / 140 + hashId(p.id)) % 4;
    if (dir === "rear-right") { img = sp.walk["rear-left"][frameNo]; flip = true; }
    else img = sp.walk[dir][frameNo];
    if (!ready(img)) { img = sp[dir]; flip = false; }
  } else img = sp[dir];
  if (!ready(img)) return;
  const h = SPR_H, w = h * img.naturalWidth / img.naturalHeight;
  // duduk: hanya bahagian atas badan (kaki tersembunyi di belakang meja), sedikit ke bawah
  const cropFrac = seated ? 0.6 : 1;
  const bob = walking ? 0 : (busy ? Math.sin(t / 120) * 1.2 : Math.sin(t / 900 + hashId(p.id)) * 0.8);
  const dh = h * cropFrac, top = p.y - h + (seated ? h * 0.22 : 0) + bob;
  g.save();
  g.imageSmoothingEnabled = true;
  if (flip) { g.translate(p.x, 0); g.scale(-1, 1); g.translate(-p.x, 0); }
  g.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight * cropFrac, p.x - w / 2, top, w, dh);
  g.restore();
}
function hashId(id) { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }

function bubble(p) {
  const s = p.info; if (s.state !== "sibuk" || p.path.length) return;
  const text = s.task.length > 34 ? s.task.slice(0, 33) + "..." : s.task;
  g.font = "600 17px system-ui, sans-serif";
  const w = Math.max(70, g.measureText(text).width + 22), x = p.x - w / 2, y = p.y - (p.mode === "desk" && !p.path.length ? 128 : 165);
  g.fillStyle = "rgba(255,255,255,.96)"; g.beginPath(); g.roundRect(x, y, w, 30, 10); g.fill();
  g.beginPath(); g.moveTo(p.x - 7, y + 30); g.lineTo(p.x, y + 39); g.lineTo(p.x + 7, y + 30); g.fill();
  g.fillStyle = "#1d2430"; g.fillText(text, x + 11, y + 21);
}
function label(p) {
  const s = p.info, busy = s.state === "sibuk";
  g.font = "700 16px system-ui, sans-serif";
  const w = g.measureText(s.name).width + 16, x = p.x - w / 2, y = p.y + 10;
  g.fillStyle = busy ? "rgba(255,196,60,.97)" : "rgba(20,26,36,.82)";
  g.beginPath(); g.roundRect(x, y, w, 22, 11); g.fill();
  g.fillStyle = busy ? "#1d2430" : "#fff"; g.fillText(s.name, x + 8, y + 16);
}
function monitorGlow(t) {
  for (const s of STATE.staff) {
    if (s.state !== "sibuk") continue;
    const d = DESKS[s.id]; if (!d) continue;
    const a = 0.25 + 0.15 * Math.sin(t / 200);
    const r = g.createRadialGradient(d[0] + 22, d[1] - 70, 2, d[0] + 22, d[1] - 70, 55);
    r.addColorStop(0, `rgba(120,220,255,${a})`); r.addColorStop(1, "rgba(120,220,255,0)");
    g.fillStyle = r; g.fillRect(d[0] - 40, d[1] - 130, 125, 120);
  }
}

function stepPerson(p, dt, now) {
  if (p.path.length) {
    const [tx, ty, node] = p.path[0], dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), v = 0.11 * dt;
    p.vx = dx; p.vy = dy;
    if (d <= v) { p.x = tx; p.y = ty; if (node) p.node = node; p.path.shift(); }
    else { p.x += dx / d * v; p.y += dy / d * v; }
    if (!p.path.length) {
      if (p.mode === "going_desk") { p.mode = "desk"; p.wanderAt = now + 30000 + Math.random() * 60000; }
      if (p.mode === "going_rest") { p.mode = "rest"; p.backAt = now + 10000 + Math.random() * 20000; }
    }
    return;
  }
  if (p.info.state !== "rehat") return;
  const pr = PRIVATE[p.id];
  if (pr) {                                   // Ejat & Zahra: bergerak dalam bilik sendiri sahaja
    if (p.mode === "desk" && now > p.wanderAt) {
      const route = pr.spots[Math.floor(Math.random() * pr.spots.length)];
      p.path = route.map(([x, y]) => [x, y, null]); p.privRoute = route; p.mode = "going_rest";
    } else if (p.mode === "rest" && now > p.backAt) goDesk(p);
    return;
  }
  if (p.id === "penyambut") return;           // Jasmin kekal di kaunter
  if (p.mode === "desk" && now > p.wanderAt) {
    const taken = new Set(Object.values(people).map(q => q.path.length ? q.path[q.path.length - 1][2] : q.node));
    const free = REST_NODES.filter(n => !taken.has(n));
    if (!free.length) { p.wanderAt = now + 20000; return; }
    walkTo(p, free[Math.floor(Math.random() * free.length)]); p.mode = "going_rest";
  } else if (p.mode === "rest" && now > p.backAt) goDesk(p);
}

function roomSigns() {
  for (const r of Object.values(PRIVATE)) {
    const [x, y] = r.home;
    g.font = "800 15px system-ui, sans-serif";
    const w = g.measureText(r.label).width + 18;
    g.fillStyle = "rgba(10,16,40,.78)"; g.beginPath(); g.roundRect(x - w / 2, y - 190, w, 24, 6); g.fill();
    g.fillStyle = "#ffd166"; g.fillText(r.label, x - w / 2 + 9, y - 173);
  }
}

// Lembutkan tepi gambar supaya bercantum dengan latar (tiada bingkai segi empat)
function fadeEdges() {
  const F = 140, c0 = "rgba(6,16,28,1)", c1 = "rgba(6,16,28,0)";
  const edges = [[0, 0, 0, F, 0, 0, W, F], [0, H, 0, H - F, 0, H - F, W, F], [0, 0, F, 0, 0, 0, F, H], [W, 0, W - F, 0, W - F, 0, F, H]];
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of edges) {
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.fillRect(rx, ry, rw, rh);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(now - last, 100); last = now;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "rgb(6,16,28)"; g.fillRect(0, 0, W, H);
  if (!(BG.complete && BG.naturalWidth)) {
    g.fillStyle = "#cfd8e3"; g.font = "600 40px system-ui, sans-serif"; g.textAlign = "center";
    g.fillText("Memuatkan pejabat...", W / 2, H / 2); g.textAlign = "start";
    requestAnimationFrame(frame); return;
  }
  g.setTransform(VIEW.s, 0, 0, VIEW.s, VIEW.ox, VIEW.oy);
  g.drawImage(BG, 0, 0, W, H);
  fadeEdges();
  const d = new Date();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "rgba(10,16,40,.75)"; g.beginPath(); g.roundRect(24, 22, 330, 64, 14); g.fill();
  g.fillStyle = "#ffd166"; g.font = "800 26px system-ui, sans-serif"; g.fillText("REKA SCAPE", 42, 58);
  g.fillStyle = "#cfd8e3"; g.font = "600 17px system-ui, sans-serif";
  g.fillText(d.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" }) + "  ·  Pejabat Maya", 42, 78);
  g.setTransform(VIEW.s, 0, 0, VIEW.s, VIEW.ox, VIEW.oy);
  if (STATE) {
    monitorGlow(now);
    roomSigns();
    const list = Object.values(people).filter(p => p.info);
    list.forEach(p => stepPerson(p, dt, now));
    list.sort((a, b) => a.y - b.y).forEach(p => drawPerson(p, now));
    list.forEach(label);
    list.forEach(bubble);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Tooltip bila klik/hover watak
function hit(ev) {
  const r = cv.getBoundingClientRect(), sx = ((ev.clientX - r.left) * W / r.width - VIEW.ox) / VIEW.s, sy = ((ev.clientY - r.top) * H / r.height - VIEW.oy) / VIEW.s;
  return Object.values(people).find(p => p.info && Math.abs(p.x - sx) < 26 && sy > p.y - 120 && sy < p.y + 34);
}
function showTip(ev) {
  const p = hit(ev), tip = $("tip");
  if (!p) { tip.style.display = "none"; return; }
  const s = p.info, r = cv.parentElement.getBoundingClientRect();
  tip.innerHTML = `<b>${esc(s.name)}</b> — ${esc(s.role)}<br>${s.state === "sibuk" ? "🟡 " + esc(s.task) : (p.mode.includes("rest") ? "☕ Sedang rehat" : "⚪ Rehat di meja")}<br><span class="muted">Siap hari ini: ${s.done_today}</span>`;
  tip.style.display = "block";
  tip.style.left = Math.min(ev.clientX - r.left + 12, r.width - 250) + "px";
  tip.style.top = (ev.clientY - r.top + 12) + "px";
}
cv.addEventListener("mousemove", showTip);
cv.addEventListener("click", showTip);
cv.addEventListener("mouseleave", () => $("tip").style.display = "none");

window.officeIso = { sync: () => syncPeople(), people, walkTo, NODES };
if (STATE) syncPeople();
})();
