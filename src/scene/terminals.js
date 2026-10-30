// The monitor's screen: a few terminal windows at work. Every so often one closes and another opens
// somewhere else, running something else. Nothing on it is a real product; it is just a busy desk.

const MONO = "Geist Mono, ui-monospace, monospace";
const W = 640, H = 360;

// a stable pseudo-random number in [0, 1) for a window slot and its generation
function rnd(a, b, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

// Colours of Cursor's default dark theme ("Cursor Dark"), taken from a copy of its theme file:
// https://github.com/BioHazard786/cursor-theme-vscode/blob/main/themes/cursor-dark.json (MIT).
// Editor and terminal backgrounds, the terminal's ANSI palette, selection and cursor, the tab and title
// bar chrome, and the syntax colours its editor uses (keyword, string, function, number, variable).
const CURSOR = {
  editorBg: "#181818", terminalBg: "#141414", chromeBg: "#141414", border: "#e4e4e413",
  fg: "#e4e4e4eb", faint: "#e4e4e442", comment: "#e4e4e45e", titleFg: "#e4e4e484",
  selection: "#40404099", lineHighlight: "#262626", cursor: "#e4e4e4eb",
  ansi: { black: "#242424", red: "#fc6b83", green: "#3fa266", yellow: "#d2943e", blue: "#81a1c1", magenta: "#b48ead", cyan: "#88c0d0", white: "#e4e4e4" },
  bright: { red: "#fc6b83", green: "#70b489", yellow: "#f1b467", blue: "#87a6c4", magenta: "#b48ead", cyan: "#88c0d0" },
  syntax: { keyword: "#82d2ce", string: "#e394dc", func: "#efb080", number: "#ebc88d", variable: "#d6d6dd", constant: "#aaa0fa" },
};

// the run colours the windows use, all from the theme above
const C = {
  fg: CURSOR.fg, dim: CURSOR.comment, green: CURSOR.bright.green, yellow: CURSOR.ansi.yellow, red: CURSOR.ansi.red,
  blue: CURSOR.ansi.blue, pink: CURSOR.ansi.magenta, cyan: CURSOR.ansi.cyan, number: CURSOR.syntax.number,
};

// what a terminal can be doing; each returns its lines ([text, colour] runs) at time t into its life
const KINDS = {
  build(t, n) {
    const steps = ["compiling core", "compiling render", "compiling net", "compiling cli", "linking", "running tests", "bundling assets", "writing dist"];
    const out = [[["$ ", C.pink], ["make build", C.fg]]];
    const k = Math.floor(t * 2.2);
    for (let i = 0; i < Math.min(k, n - 2); i++) {
      const s = steps[i % steps.length], done = i < k - 1;
      out.push([[done ? "  ✓ " : "  ◌ ", done ? C.green : C.yellow], [s, done ? C.dim : C.fg], [done ? `  ${(0.2 + rnd(i, 7) * 1.8).toFixed(1)}s` : "", C.dim]]);
    }
    if (k > n - 2) out.push([["  done in 4.8s", C.green]]);
    return out;
  },
  logs(t, n) {
    const paths = ["/", "/api/items", "/health", "/static/app.js", "/api/login", "/feed.xml", "/api/search?q=tide"];
    const out = [[["$ ", C.pink], ["tail -f server.log", C.fg]]];
    const k = Math.floor(t * 3);
    for (let i = Math.max(0, k - n + 2); i < k; i++) {
      const code = rnd(i, 3) > 0.9 ? 404 : 200, ms = Math.round(3 + rnd(i, 5) * 80);
      const s = String(10 + (i % 50)).padStart(2, "0");
      out.push([[`12:04:${s} `, C.dim], ["GET ", C.blue], [paths[Math.floor(rnd(i, 9) * paths.length)].padEnd(18), C.fg], [String(code), code === 200 ? C.green : C.red], [` ${ms}ms`, C.dim]]);
    }
    return out;
  },
  top(t, n) {
    const procs = ["node", "postgres", "redis", "nginx", "cargo", "zsh", "sshd", "vim"];
    const out = [[["  PID  NAME      CPU", C.dim]]];
    for (let i = 0; i < Math.min(procs.length, n - 1); i++) {
      const cpu = Math.max(0, Math.min(1, 0.15 + 0.5 * rnd(i, 1) + 0.25 * Math.sin(t * (1 + rnd(i, 2)) + i)));
      out.push([[` ${String(1200 + i * 37).padStart(4)}  ${procs[i].padEnd(9)} `, C.fg], ["█".repeat(Math.round(cpu * 10)), cpu > 0.7 ? C.red : cpu > 0.4 ? C.yellow : C.green], [" " + Math.round(cpu * 100) + "%", C.dim]]);
    }
    return out;
  },
  git(t, n) {
    const msgs = ["fix flaky test", "tidy up the config", "add retry on timeout", "bump deps", "faster startup", "handle empty input", "rename for clarity", "docs: usage"];
    const out = [[["$ ", C.pink], ["git log --oneline --graph", C.fg]]];
    const k = Math.min(n - 1, 1 + Math.floor(t * 4));
    for (let i = 0; i < k; i++) {
      const sha = Math.floor(rnd(i, 11) * 0xfffffff).toString(16).padStart(7, "0");
      out.push([[i % 3 === 2 ? "|\\ " : "* ", C.yellow], [sha + " ", C.yellow], [msgs[i % msgs.length], C.fg]]);
    }
    return out;
  },
  edit(t, n) {
    const code = ["function wait(ms) {", "  return new Promise((done) => {", "    setTimeout(done, ms);", "  });", "}", "", "async function main() {", "  for (const job of queue) {", "    await job.run();", "    await wait(200);", "  }", "}"];
    const shown = Math.floor(t * 18), out = [];
    let left = shown;
    for (let i = 0; i < Math.min(code.length, n - 1); i++) {
      const line = code[i], vis = line.slice(0, Math.max(0, left)); left -= line.length + 1;
      out.push([[String(i + 1).padStart(3) + " ", CURSOR.faint], [vis, /function|return|const|await|for|async/.test(vis) ? CURSOR.syntax.keyword : /\(|\)/.test(vis) ? CURSOR.syntax.variable : C.fg]]);
      if (left < 0) break;
    }
    out.push([["-- INSERT --", C.green]]);
    return out;
  },
  shell(t, n) {
    const cmds = [["ls", ["notes.md  src  build  README.md"]], ["cd src", []], ["wc -l *.js", ["  412 main.js", "  128 util.js", "  540 total"]], ["git status", ["On branch main", "nothing to commit, working tree clean"]]];
    const out = []; let clock = 0;
    for (const [cmd, res] of cmds) {
      const typeT = cmd.length * 0.09;
      if (t < clock) break;
      const typed = cmd.slice(0, Math.floor((t - clock) / 0.09));
      out.push([["~ ❯ ", C.pink], [typed, C.fg]]);
      clock += typeT + 0.4;
      if (t >= clock) for (const r of res) out.push([[r, C.dim]]);
      clock += 0.6;
    }
    return out.slice(-(n - 1));
  },
};
const KIND_NAMES = Object.keys(KINDS);

// three window slots, each on its own rhythm: open, work, close, a short gap, then a new window elsewhere
const SLOTS = [{ period: 13, off: 0 }, { period: 16.5, off: 5.2 }, { period: 19, off: 10.4 }];

function windowsAt(t) {
  const out = [];
  SLOTS.forEach((s, i) => {
    const tt = t + s.off, gen = Math.floor(tt / s.period), local = tt - gen * s.period;
    const life = s.period - 1.6;
    if (local > life + 0.25) return; // the gap between one window closing and the next opening
    const open = Math.min(1, local / 0.25), close = local > life ? 1 - (local - life) / 0.25 : 1;
    const w = 250 + Math.round(rnd(i, gen, 1) * 120), h = 150 + Math.round(rnd(i, gen, 2) * 80);
    const x0 = 12 + Math.round(rnd(i, gen, 3) * (W - w - 24)), y0 = 30 + Math.round(rnd(i, gen, 4) * (H - h - 40));
    out.push({ x0, y0, w, h, kind: KIND_NAMES[Math.floor(rnd(i, gen, 5) * KIND_NAMES.length)], local, born: t - local, scale: Math.min(open, close) });
  });
  return out.sort((a, b) => a.born - b.born);
}

// ---- wallpapers: TEMPORARY options to choose from, each drawn once on a canvas and kept ----

// ---- realistic topo: contour lines are the iso-lines of one smooth heightfield, traced with marching squares,
// so they never cross or touch; evenly spaced levels, every fifth one an index contour drawn heavier ----
function hash2(i, j, seed) { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(seed, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function valueNoise(x, y, seed) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(i, j, seed), b = hash2(i + 1, j, seed), c = hash2(i, j + 1, seed), d = hash2(i + 1, j + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, seed, octaves = 4) { let sum = 0, amp = 0.5, f = 1; for (let o = 0; o < octaves; o++) { sum += amp * valueNoise(x * f, y * f, seed + o * 17); amp /= 2; f *= 2; } return sum; }

function contours(x, height, { levels, color, indexColor, cell = 4 }) {
  const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1, hs = new Float32Array(cols * rows);
  let lo = Infinity, hi = -Infinity;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const v = height(i * cell / W, j * cell / H); hs[j * cols + i] = v; lo = Math.min(lo, v); hi = Math.max(hi, v); }
  for (let k = 1; k < levels; k++) {
    const level = lo + ((hi - lo) * k) / levels, index = k % 5 === 0;
    x.strokeStyle = index ? indexColor : color; x.lineWidth = index ? 1.5 : 0.8; x.beginPath();
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
      const tl = hs[j * cols + i], tr = hs[j * cols + i + 1], br = hs[(j + 1) * cols + i + 1], bl = hs[(j + 1) * cols + i];
      const px = i * cell, py = j * cell, at = (a, b) => (level - a) / (b - a);
      const pts = []; // crossings on the top, right, bottom and left edges, in that order
      if ((tl > level) !== (tr > level)) pts.push([0, px + at(tl, tr) * cell, py]);
      if ((tr > level) !== (br > level)) pts.push([1, px + cell, py + at(tr, br) * cell]);
      if ((bl > level) !== (br > level)) pts.push([2, px + at(bl, br) * cell, py + cell]);
      if ((tl > level) !== (bl > level)) pts.push([3, px, py + at(tl, bl) * cell]);
      const seg = (p, q) => { x.moveTo(p[1], p[2]); x.lineTo(q[1], q[2]); };
      if (pts.length === 2) seg(pts[0], pts[1]);
      else if (pts.length === 4) {
        // a saddle: the centre's side decides which corners are joined
        const centre = (tl + tr + br + bl) / 4 > level;
        if ((tl > level) === centre) { seg(pts[0], pts[1]); seg(pts[2], pts[3]); } else { seg(pts[0], pts[3]); seg(pts[1], pts[2]); }
      }
    }
    x.stroke();
  }
}
const mapBg = (x, bg) => { x.fillStyle = bg; x.fillRect(0, 0, W, H); };
const terrain = (name, bg, color, indexColor, levels, height) => ({ name, draw(x) { mapBg(x, bg); contours(x, height, { levels, color, indexColor }); } });

export const WALLPAPERS = [
  { name: "topo", draw(x) {
    x.fillStyle = "#16181a"; x.fillRect(0, 0, W, H); x.strokeStyle = "rgba(136,192,208,.14)"; x.lineWidth = 1;
    for (const [cx, cy, n, gap] of [[200, 170, 11, 17], [500, 250, 9, 15]]) for (let k = 1; k <= n; k++) {
      x.beginPath();
      for (let a = 0; a <= 64; a++) { const t = (a / 64) * Math.PI * 2, r = k * gap * (1 + .16 * Math.sin(3 * t + k * .35) + .09 * Math.sin(5 * t - k * .2)); x[a ? "lineTo" : "moveTo"](cx + r * 1.35 * Math.cos(t), cy + r * Math.sin(t)); }
      x.closePath(); x.stroke();
    }
  } },
  // a ridge with a valley either side: the crest of a folded noise, tilted across the map
  terrain("topo ridge", "#15181a", "rgba(212,148,62,.2)", "rgba(212,148,62,.42)", 40, (u, v) => {
    const warp = fbm(u * 2.2, v * 2.2, 3) * 0.5;
    return 1 - Math.abs(fbm(u * 2.4 + warp, v * 2.4 - warp, 11, 3) * 2 - 1) * 0.9 + 0.35 * (1 - u) + 0.15 * v;
  }),
  // one peak, steep in the middle and flattening out, with rough ground around it
  terrain("topo peak", "#14181a", "rgba(130,210,206,.2)", "rgba(130,210,206,.42)", 36, (u, v) => {
    const dx = (u - 0.52) * 1.78, dy = v - 0.5;
    return Math.exp(-(dx * dx + dy * dy) * 7) * 1.6 + 0.35 * fbm(u * 5, v * 5, 23);
  }),
  // low rolling hills: a few wide swells with no single summit
  terrain("topo hills", "#161815", "rgba(163,204,124,.2)", "rgba(163,204,124,.4)", 32, (u, v) => fbm(u * 3.1, v * 3.1, 5, 3)),
];
const drawn = [];
let wallpaperAt = 0;
export function selectWallpaper(i) { wallpaperAt = i; }
function wallpaperFor(i) {
  if (!drawn[i]) { const c = document.createElement("canvas"); c.width = W; c.height = H; WALLPAPERS[i].draw(c.getContext("2d")); drawn[i] = c; }
  return drawn[i];
}

export function paintTerminals(x, t) {
  x.drawImage(wallpaperFor(wallpaperAt), 0, 0);
  x.fillStyle = "rgba(20,20,20,.82)"; x.fillRect(0, 0, W, 18);
  const wins = windowsAt(t);
  wins.forEach((win, i) => {
    const top = i === wins.length - 1, e = 1 - (1 - win.scale) ** 3, s = 0.9 + 0.1 * e;
    const w = win.w * s, h = win.h * s, wx = win.x0 + (win.w - w) / 2, wy = win.y0 + (win.h - h) / 2;
    x.save(); x.globalAlpha = e;
    x.fillStyle = "rgba(0,0,0,.35)"; rr(x, wx + 3, wy + 6, w, h, 8); x.fill();
    x.fillStyle = top ? CURSOR.terminalBg : CURSOR.editorBg; rr(x, wx, wy, w, h, 8); x.fill();
    x.strokeStyle = CURSOR.border; x.lineWidth = 1; rr(x, wx + .5, wy + .5, w - 1, h - 1, 8); x.stroke();
    x.fillStyle = CURSOR.chromeBg; x.beginPath(); x.moveTo(wx + 8, wy); x.arcTo(wx + w, wy, wx + w, wy + 20, 8); x.lineTo(wx + w, wy + 20); x.lineTo(wx, wy + 20); x.arcTo(wx, wy, wx + w, wy, 8); x.closePath(); x.fill();
    x.fillStyle = CURSOR.border; x.fillRect(wx, wy + 20, w, 1);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, k) => { x.fillStyle = top ? c : CURSOR.faint; x.beginPath(); x.arc(wx + 12 + k * 13, wy + 10, 3.6, 0, 7); x.fill(); });
    x.fillStyle = CURSOR.titleFg; x.font = `10px ${MONO}`; x.textAlign = "center"; x.fillText("zsh", wx + w / 2, wy + 14); x.textAlign = "left";
    x.beginPath(); x.rect(wx + 6, wy + 22, w - 12, h - 26); x.clip();
    x.font = `10.5px ${MONO}`;
    const rows = Math.floor((h - 30) / 14), lines = KINDS[win.kind](win.local, rows);
    lines.forEach((runs, r) => { let px = wx + 10; for (const [text, col] of runs) { x.fillStyle = col; x.fillText(text, px, wy + 36 + r * 14); px += x.measureText(text).width; } });
    if (top && Math.floor(t * 2.4) % 2 === 0) { x.fillStyle = CURSOR.cursor; x.fillRect(wx + 10, wy + 27 + Math.min(lines.length, rows - 1) * 14, 6, 11); }
    x.restore();
  });
}
