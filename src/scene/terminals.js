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

const C = { fg: "#d8d6d0", dim: "#7d7b76", green: "#8fd18a", yellow: "#e6c27a", red: "#ef8a80", blue: "#8ab4f0", pink: "#fb9890" };

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
      out.push([[String(i + 1).padStart(3) + " ", C.dim], [vis, /function|return|const|await|for|async/.test(vis) ? C.blue : C.fg]]);
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

export function paintTerminals(x, t) {
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#1f1d27"); g.addColorStop(1, "#34293a");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(0, 0, W, 18);
  const wins = windowsAt(t);
  wins.forEach((win, i) => {
    const top = i === wins.length - 1, e = 1 - (1 - win.scale) ** 3, s = 0.9 + 0.1 * e;
    const w = win.w * s, h = win.h * s, wx = win.x0 + (win.w - w) / 2, wy = win.y0 + (win.h - h) / 2;
    x.save(); x.globalAlpha = e;
    x.fillStyle = "rgba(0,0,0,.35)"; rr(x, wx + 3, wy + 6, w, h, 8); x.fill();
    x.fillStyle = top ? "#121214" : "#18181b"; rr(x, wx, wy, w, h, 8); x.fill();
    x.fillStyle = top ? "#26262b" : "#202024"; x.beginPath(); x.moveTo(wx + 8, wy); x.arcTo(wx + w, wy, wx + w, wy + 20, 8); x.lineTo(wx + w, wy + 20); x.lineTo(wx, wy + 20); x.arcTo(wx, wy, wx + w, wy, 8); x.closePath(); x.fill();
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, k) => { x.fillStyle = top ? c : "#4a4a50"; x.beginPath(); x.arc(wx + 12 + k * 13, wy + 10, 3.6, 0, 7); x.fill(); });
    x.fillStyle = "#8a8884"; x.font = `10px ${MONO}`; x.textAlign = "center"; x.fillText("zsh", wx + w / 2, wy + 14); x.textAlign = "left";
    x.beginPath(); x.rect(wx + 6, wy + 22, w - 12, h - 26); x.clip();
    x.font = `10.5px ${MONO}`;
    const rows = Math.floor((h - 30) / 14), lines = KINDS[win.kind](win.local, rows);
    lines.forEach((runs, r) => { let px = wx + 10; for (const [text, col] of runs) { x.fillStyle = col; x.fillText(text, px, wy + 36 + r * 14); px += x.measureText(text).width; } });
    if (top && Math.floor(t * 2.4) % 2 === 0) { x.fillStyle = C.fg; x.fillRect(wx + 10, wy + 27 + Math.min(lines.length, rows - 1) * 14, 6, 11); }
    x.restore();
  });
}
