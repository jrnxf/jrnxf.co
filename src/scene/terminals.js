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

// ---- wallpapers: TEMPORARY set of line-based options to choose from, each drawn once on a canvas and kept ----
const ink = (x, bg, line, width = 1) => { x.fillStyle = bg; x.fillRect(0, 0, W, H); x.strokeStyle = line; x.lineWidth = width; x.beginPath(); };
const grid = (x, step, ox = 0, oy = 0) => {
  for (let i = ox % step; i <= W; i += step) { x.moveTo(i + .5, 0); x.lineTo(i + .5, H); }
  for (let j = oy % step; j <= H; j += step) { x.moveTo(0, j + .5); x.lineTo(W, j + .5); }
};

export const WALLPAPERS = [
  { name: "grid", draw(x) { ink(x, "#17181b", "rgba(228,228,228,.07)"); grid(x, 32); x.stroke(); } },
  { name: "topo", draw(x) {
    ink(x, "#16181a", "rgba(136,192,208,.14)");
    x.stroke();
    for (const [cx, cy, n, gap] of [[200, 170, 11, 17], [500, 250, 9, 15]]) for (let k = 1; k <= n; k++) {
      x.beginPath();
      for (let a = 0; a <= 64; a++) { const t = (a / 64) * Math.PI * 2, r = k * gap * (1 + .16 * Math.sin(3 * t + k * .35) + .09 * Math.sin(5 * t - k * .2)); x[a ? "lineTo" : "moveTo"](cx + r * 1.35 * Math.cos(t), cy + r * Math.sin(t)); }
      x.closePath(); x.stroke();
    }
  } },
  { name: "dot grid", draw(x) {
    x.fillStyle = "#17181b"; x.fillRect(0, 0, W, H); x.fillStyle = "rgba(228,228,228,.2)";
    for (let i = 16; i < W; i += 24) for (let j = 12; j < H; j += 24) x.fillRect(i - 1, j - 1, 2, 2);
  } },
  { name: "isometric", draw(x) {
    // three families of lines at 90, 30 and 150 degrees make the isometric lattice
    ink(x, "#16181b", "rgba(228,228,228,.07)"); const dx = 28, rise = W * Math.tan(Math.PI / 6), sp = dx / Math.cos(Math.PI / 6);
    for (let i = 0; i <= W; i += dx) { x.moveTo(i + .5, 0); x.lineTo(i + .5, H); }
    for (let c = -rise; c < H + rise; c += sp) { x.moveTo(0, c); x.lineTo(W, c + rise); x.moveTo(0, c + rise); x.lineTo(W, c); }
    x.stroke();
  } },
  { name: "blueprint", draw(x) {
    ink(x, "#14293f", "rgba(170,210,255,.10)"); grid(x, 16); x.stroke();
    x.strokeStyle = "rgba(170,210,255,.22)"; x.beginPath(); grid(x, 80, 0, 0); x.stroke();
    x.strokeStyle = "rgba(170,210,255,.3)"; x.lineWidth = 1.25; x.strokeRect(14.5, 14.5, W - 29, H - 29);
  } },
  { name: "graph paper", draw(x) {
    ink(x, "#1a1c1a", "rgba(143,210,150,.06)"); grid(x, 10); x.stroke();
    x.strokeStyle = "rgba(143,210,150,.16)"; x.beginPath(); grid(x, 50); x.stroke();
  } },
  { name: "halftone lines", draw(x) {
    // horizontal lines that swell and thin along a slow wave, like a halftone screen
    x.fillStyle = "#16171a"; x.fillRect(0, 0, W, H); x.fillStyle = "rgba(228,228,228,.16)";
    for (let j = 8; j < H; j += 10) for (let i = 0; i < W; i += 2) { const k = .5 + .5 * Math.sin(i / 46 + j / 70), t = 0.4 + 2.4 * k * (.5 + .5 * Math.cos(j / 60 - i / 120)); x.fillRect(i, j - t / 2, 2, t); }
  } },
  { name: "hex grid", draw(x) {
    ink(x, "#17181b", "rgba(228,228,228,.08)"); const r = 22, h = r * Math.sqrt(3);
    for (let row = -1; row * h * .5 < H + h; row++) for (let col = -1; col * r * 1.5 < W + r * 2; col++) {
      const cx = col * r * 1.5, cy = row * h + (col % 2 ? h / 2 : 0);
      for (let k = 0; k < 6; k++) { const a = (Math.PI / 3) * k; x[k ? "lineTo" : "moveTo"](cx + r * Math.cos(a), cy + r * Math.sin(a)); }
      x.closePath();
    }
    x.stroke();
  } },
  { name: "contour waves", draw(x) {
    // stacked contour lines along a rolling surface
    ink(x, "#15171a", "rgba(130,210,206,.16)");
    for (let k = 0; k < 28; k++) {
      x.beginPath();
      for (let i = 0; i <= W; i += 4) { const y = 30 + k * 11 + 16 * Math.sin(i / 70 + k * .22) + 10 * Math.sin(i / 31 - k * .35); x[i ? "lineTo" : "moveTo"](i, y); }
      x.stroke();
    }
  } },
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
