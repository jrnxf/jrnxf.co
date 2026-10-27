// The app around the voxel desk: the renderer, an orbit camera, picking, and the panels that hold
// the real drip and okfs walkthroughs. `startDesk` returns a handle whose `destroy` undoes it all.

import * as THREE from "three";
import { buildDesk, lightForHour } from "./voxel.js";
import { Notch } from "./drip.js";
import { mountOkfs, THEMES } from "./okfs.js";
import { markSVG } from "./mark.js";

const CSS = `
.desk-tip{position:absolute;z-index:5;pointer-events:none;font:500 12px "Geist Mono",ui-monospace,monospace;color:var(--tip-fg,#1d1a16);background:var(--tip-bg,rgba(243,236,223,.94));padding:6px 10px;border-radius:999px;opacity:0;transform:translateY(4px);transition:opacity .15s,transform .15s;white-space:nowrap}
.desk-tip.on{opacity:1;transform:none}
.desk-panel{position:absolute;z-index:6;display:none;flex-direction:column;gap:12px;overflow:auto;color:var(--p-fg,#ededeb);background:var(--p-bg,#0d0d0e);font:14px/1.5 Geist,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.desk-panel.on{display:flex}
.desk-panel{left:50%;top:50%;transform:translate(-50%,-50%);width:min(860px,calc(100% - 32px));max-height:calc(100% - 32px);padding:20px 22px;border-radius:18px;box-shadow:0 0 0 10px #1b1b1d,0 0 0 11px #3a3a3e,0 40px 80px -20px rgba(0,0,0,.7);animation:deskIn .35s cubic-bezier(.2,.8,.2,1)}
@keyframes deskIn{from{opacity:0;transform:translate(-50%,-48%) scale(.96)}}
@media (prefers-reduced-motion:reduce){.desk-panel{animation:none!important}}
.desk-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.desk-sw{display:inline-flex;gap:2px;padding:3px;border-radius:999px;border:1px solid var(--p-line,#2a2a2e)}
.desk-sw button{all:unset;cursor:pointer;font:500 12px "Geist Mono",monospace;color:var(--p-muted,#9a9a96);padding:5px 11px;border-radius:999px}
.desk-sw button[aria-pressed=true]{background:var(--p-fg,#ededeb);color:var(--p-bg,#0d0d0e)}
.desk-sw button:focus-visible{outline:2px solid var(--p-acc,#fb9890);outline-offset:2px}
.desk-x{all:unset;cursor:pointer;align-self:flex-start;font:500 12px "Geist Mono",monospace;color:var(--p-muted,#9a9a96);padding:6px 10px;border-radius:999px;border:1px solid var(--p-line,#2a2a2e)}
.desk-x:hover{color:var(--p-fg,#fff)}
.desk-x:focus-visible{outline:2px solid var(--p-acc,#fb9890);outline-offset:2px}
.desk-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.desk-h b{font:600 28px/1 Geist,sans-serif;letter-spacing:-.02em}
.desk-h span{color:var(--p-muted,#9a9a96);font:500 13px "Geist Mono",monospace}
.desk-p{margin:0;color:var(--p-muted,#b5b5b0);max-width:64ch}
.desk-p.big{font-size:18px;color:var(--p-fg,#ededeb)}
.desk-p code{font:500 12.5px "Geist Mono",monospace;color:var(--p-acc,#fb9890)}
.desk-screen{position:relative;flex:none;height:200px;border-radius:12px;overflow:hidden;background:#000;box-shadow:inset 0 0 0 1px #2a2a2e}
.desk-wp{position:absolute;inset:0;background:linear-gradient(#1f3a5c,#6f93b3 55%,#2f6688 56%,#12324a)}
.desk-out{font:500 12px "Geist Mono",monospace;color:var(--p-muted,#8a8a86);min-height:1.4em;overflow-wrap:anywhere}
.desk-keys{display:flex;flex-wrap:wrap;gap:6px}
.desk-keys button{all:unset;cursor:pointer;font:500 12px "Geist Mono",monospace;color:var(--p-fg,#ededeb);background:var(--p-key,#1b1b1d);border:1px solid var(--p-line,#2a2a2e);border-radius:8px;padding:7px 10px;overflow-wrap:anywhere}
.desk-keys button:hover{border-color:var(--p-acc,#fb9890)}
.desk-keys button:focus-visible{outline:2px solid var(--p-acc,#fb9890);outline-offset:2px}
.desk-pane{flex:none;height:min(420px,52vh);border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px var(--p-line,#2a2a2e)}
.desk-foot{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;font:500 12px "Geist Mono",monospace}
.desk-foot code{background:var(--p-key,#1b1b1d);padding:6px 10px;border-radius:6px}
.desk-foot a,.desk-links a{color:var(--p-fg,#ededeb)}
.desk-links{display:flex;flex-wrap:wrap;gap:8px}
.desk-links a{font:500 12px "Geist Mono",monospace;text-decoration:none;border:1px solid var(--p-line,#2a2a2e);border-radius:999px;padding:6px 11px}
.desk-links a:hover{border-color:var(--p-acc,#fb9890)}
.desk-mark{width:min(300px,70%);color:var(--p-fg,#ededeb)}.desk-mark svg{width:100%;height:auto;display:block}
@media (max-width:720px){.desk-panel{left:0;top:auto;bottom:0;transform:none;width:100%;max-height:82%;border-radius:18px 18px 0 0;box-shadow:0 -20px 40px -10px rgba(0,0,0,.6);animation:none}.desk-screen{height:170px}}
`;
const LABEL = { monitor: "the monitor · drip and okfs", mug: "the mug · about", poster: "the poster · about", window: "the sea · northern Portugal, now" };
const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const lisbon = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
const lisbonH = () => { const [h, m] = lisbon().split(":").map(Number); return h + m / 60; };
// the room is built at 2.5 voxels per scene unit, the density the captain chose
const RES = 2.5;

export function startDesk({ stage, light = "golden", onOpenChange }) {
  if (!document.getElementById("desk-css")) { const st = document.createElement("style"); st.id = "desk-css"; st.textContent = CSS; document.head.append(st); }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = () => innerWidth < 720;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone() ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  stage.append(renderer.domElement);
  // a vertical swipe still scrolls the page on touch; a sideways drag turns the room
  renderer.domElement.style.touchAction = "pan-y";
  const scene = new THREE.Scene();
  const desk = buildDesk(THREE, { light, shadows: true, res: RES });
  scene.add(desk.root);

  // ---------- camera ----------
  const R0 = 108;
  let sph = { r: R0, th: 0.78, ph: 1.12 }, goal = { ...sph }, flying = null;
  const look = new THREE.Vector3(25, 13, 15), lookGoal = look.clone();
  const cam = new THREE.PerspectiveCamera(32, 1, 1, 1800);
  const LIM = { ph: [0.9, 1.42] };
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    // a tall screen backs the camera off so the whole desk fits, and looks a little higher
    if (!openName) { goal.r = sph.r = w / h < 1 ? Math.min(250, (R0 * 0.98) / (w / h)) : R0; lookGoal.y = look.y = w / h < 1 ? 19 : 13; }
    cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  const place = () => { const { r, th, ph } = sph; cam.position.set(look.x + r * Math.sin(ph) * Math.sin(th), look.y + r * Math.cos(ph), look.z + r * Math.sin(ph) * Math.cos(th)); cam.lookAt(look); };

  // ---------- input ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const targets = Object.values(desk.hit);
  const tip = document.createElement("div"); tip.className = "desk-tip"; stage.append(tip);
  let drag = null, lastMove = performance.now();
  const pick = (e) => { const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const h = ray.intersectObjects(targets)[0]; return h ? h.object.userData.name : null; };
  const el = renderer.domElement;
  el.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0, th: goal.th, ph: goal.ph, touch: e.pointerType !== "mouse" }; if (!drag.touch) el.setPointerCapture(e.pointerId); });
  el.addEventListener("pointermove", (e) => {
    lastMove = performance.now();
    if (drag && !flying && !openName) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.hypot(dx, dy);
      goal.th = drag.th - dx * 0.005;
      // on touch the vertical swipe belongs to the page, so only a mouse tilts the camera
      if (!drag.touch) goal.ph = clamp(drag.ph - dy * 0.004, LIM.ph);
    }
    if (e.pointerType === "mouse") setHover(pick(e), e);
  });
  el.addEventListener("pointerup", (e) => { const d = drag; drag = null; if (d && d.moved < 6) { const n = pick(e); if (n) open(n); } });
  el.addEventListener("pointercancel", () => (drag = null));
  el.addEventListener("pointerleave", () => setHover(null));
  function setHover(n, e) {
    desk.highlight(n && !openName ? n : null);
    el.style.cursor = n ? "pointer" : "grab";
    if (n && e && !openName) { const b = stage.getBoundingClientRect(); tip.textContent = LABEL[n]; tip.style.left = `${e.clientX - b.left + 14}px`; tip.style.top = `${e.clientY - b.top + 14}px`; tip.classList.add("on"); }
    else tip.classList.remove("on");
  }
  const onKey = (e) => { if (e.key === "Escape" && openName && !(pane && pane.state.pal)) close(); };
  addEventListener("keydown", onKey);

  // ---------- panels ----------
  const panel = document.createElement("div"); panel.className = "desk-panel"; panel.setAttribute("role", "dialog"); stage.append(panel);
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
  let openName = null, notch = null, pane = null, saved = null;
  // the monitor shows drip or okfs in turn; opening it opens the panel of whichever is on screen
  function open(name) {
    const tool = name === "monitor" ? desk.screen : name;
    if (openName === tool) return;
    if (openName) closeNow();
    openName = tool; setHover(null); onOpenChange?.(true);
    if (tool === "drip" || tool === "okfs") desk.setScreen(tool, true);
    const pose = desk.poses[tool === "drip" || tool === "okfs" ? "monitor" : tool];
    if (pose) { saved = { sph: { ...goal }, look: lookGoal.clone() }; fly(pose, () => render(tool)); }
    else render(tool);
  }
  function fly(pose, then) {
    if (reduced) { flying = null; look.set(...pose.look); lookGoal.copy(look); const d = new THREE.Vector3(...pose.pos).sub(look); sph = { r: d.length(), th: Math.atan2(d.x, d.z), ph: Math.acos(d.y / d.length()) }; goal = { ...sph }; then?.(); return; }
    const from = { pos: cam.position.clone(), look: look.clone() }, to = { pos: new THREE.Vector3(...pose.pos), look: new THREE.Vector3(...pose.look) }, t0 = performance.now();
    flying = (now) => {
      const t = Math.min(1, (now - t0) / 900), e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      cam.position.lerpVectors(from.pos, to.pos, e); look.lerpVectors(from.look, to.look, e); cam.lookAt(look);
      if (t >= 1) { flying = null; lookGoal.copy(look); const d = cam.position.clone().sub(look); sph = { r: d.length(), th: Math.atan2(d.x, d.z), ph: Math.acos(d.y / d.length()) }; goal = { ...sph }; then?.(); }
    };
  }
  function render(name) {
    if (openName !== name) return;
    const sw = (on) => `<div class="desk-sw" role="group" aria-label="Screen">${["drip", "okfs"].map((t) => `<button data-sw="${t}" aria-pressed="${t === on}">${t}</button>`).join("")}</div>`;
    const top = `<div class="desk-top"><button class="desk-x" aria-label="Back to the desk">← back to the desk</button>${name === "drip" || name === "okfs" ? sw(name) : ""}</div>`;
    if (name === "drip") {
      panel.innerHTML = `${top}<div class="desk-h"><b>drip</b><span>the notch, finally useful</span></div><p class="desk-p">A Mac command-line tool that shows a brief native card from the notch, or from the top edge of a screen without one, when a command or a coding agent finishes or needs you. No permissions; it returns at once.</p>
        <div class="desk-screen" id="dripScreen"><div class="desk-wp"></div></div><div class="desk-out" id="dripOut">press a command</div>
        <div class="desk-keys">${[["ok", 'drip ok "build finished"'], ["run", "drip run make test"], ["stay", 'drip fail "deploy failed" --stay'], ["yes", 'drip warn "Deploy to prod?" --yes Deploy --no Cancel'], ["id", "drip info deploying --id deploy"], ["agent", "drip setup claude"]].map(([k, l]) => `<button data-k="${k}">${esc(l)}</button>`).join("")}</div>
        <div class="desk-foot"><code>brew install jrnxf/tap/drip</code><a href="https://drip.jrnxf.co" target="_blank" rel="noopener">drip.jrnxf.co ↗</a><a href="https://github.com/jrnxf/drip" target="_blank" rel="noopener">source ↗</a></div>`;
      notch = new Notch(panel.querySelector("#dripScreen"), { scale: phone() ? 0.7 : 0.82, notchWidth: 150, notchHeight: 26 });
      const out = panel.querySelector("#dripOut");
      const show = (c) => { desk.laptopCard(c); return notch.show(c); };
      const K = {
        ok: () => show({ kind: "ok", title: "build finished", detail: "make test: 246 passed in 3.2s" }),
        run: () => { out.textContent = "running make test..."; later(() => { out.textContent = "exit 0 · drip exits with the command's own status"; notch && show({ kind: "ok", title: "make test finished", detail: "3m 12s" }); }, 900); },
        stay: () => show({ kind: "fail", title: "deploy failed", detail: "staging: health check timed out after 30s", stay: true }),
        yes: async () => { out.textContent = "waiting for your answer..."; const r = await show({ kind: "warn", title: "Deploy to prod?", detail: "v1.4.0", yes: "Deploy", no: "Cancel" }); out.textContent = r === "yes" ? "exit 0 · ./deploy.sh runs" : r === "no" ? "exit 1 · nothing deploys" : "exit 5 · no button was clicked"; },
        id: () => { show({ kind: "info", title: "deploying", detail: "api 1.4.2 to production", id: "deploy", seconds: 8 }); later(() => notch && show({ kind: "ok", title: "deployed", detail: "same --id: changed in place", id: "deploy" }), 2000); },
        agent: () => { out.textContent = "added Notification, Stop and StopFailure hooks to ~/.claude/settings.json"; show({ kind: "info", icon: "agent", title: "my-app needs you", detail: "Claude needs your permission to use Bash", stay: true, id: "claude:1" }); later(() => notch && show({ kind: "ok", icon: "agent", title: "my-app is done", detail: "Fixed the flaky test and pushed the branch.", id: "claude:1" }), 2800); },
      };
      panel.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => { out.textContent = b.textContent; K[b.dataset.k](); }));
      later(() => notch && K.ok(), reduced ? 0 : 400);
    } else if (name === "okfs") {
      panel.innerHTML = `${top}<div class="desk-h"><b>okfs</b><span>ok file server</span></div><p class="desk-p">A web file browser in one Rust binary: a dense list, a preview of whatever is under the cursor, and a search of every name in the tree. Read only and loopback only by default. Click it, then <code>j</code> <code>k</code>, <code>Ctrl K</code>, <code>r</code>.</p>
        <div class="desk-pane" id="okPane"></div><div class="desk-keys themes">${Object.keys(THEMES).map((k) => `<button data-t="${k}">--theme ${k}</button>`).join("")}</div>
        <div class="desk-foot"><code>brew install jrnxf/tap/okfs</code><a href="https://okfs.jrnxf.co/demo/" target="_blank" rel="noopener">try the demo ↗</a><a href="https://github.com/jrnxf/okfs" target="_blank" rel="noopener">source ↗</a></div>`;
      pane = mountOkfs(panel.querySelector("#okPane"), { theme: "default", scheme: "dark" });
      pane.select("sunset-set.jpg");
      panel.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => pane.setTheme(b.dataset.t)));
    } else if (name === "mug" || name === "poster") {
      panel.innerHTML = `${top}<div class="desk-mark">${markSVG()}</div><p class="desk-p big">Hi, I'm Colby. I build small, sharp tools for the terminal and the Mac, from a beach in northern Portugal.</p>
        <p class="desk-p">On the desk: one monitor that switches between <b>drip</b> and <b>okfs</b>. Click it.</p>
        <div class="desk-links"><a href="mailto:colby@jrnxf.co">colby@jrnxf.co</a><a href="https://github.com/jrnxf" target="_blank" rel="noopener">github</a><a href="https://instagram.com/jrn.xf" target="_blank" rel="noopener">instagram</a><a href="https://www.youtube.com/@jrnxf" target="_blank" rel="noopener">youtube</a><a href="https://twitter.com/jrn_xf" target="_blank" rel="noopener">twitter</a></div>`;
    } else if (name === "window") {
      const now = lightForHour(lisbonH());
      panel.innerHTML = `${top}<div class="desk-h"><b>${lisbon()}</b><span>on this coast right now</span></div><p class="desk-p">The window looks west over the Atlantic. Change the light:</p>
        <div class="desk-keys">${["golden", "day", "night"].map((k) => `<button data-l="${k}">${k}${k === now ? " · now" : ""}</button>`).join("")}</div>`;
      panel.querySelectorAll("[data-l]").forEach((b) => b.addEventListener("click", () => setLight(b.dataset.l)));
    }
    panel.classList.add("on");
    panel.querySelector(".desk-x").onclick = close;
    panel.querySelectorAll("[data-sw]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.sw === openName) return; notch?.clear(); notch = null; pane = null; openName = b.dataset.sw; desk.setScreen(openName, true); render(openName); }));
    panel.querySelector(".desk-x").focus({ preventScroll: true });
  }
  function closeNow() { desk.setScreen(desk.screen, false); panel.classList.remove("on"); notch?.clear(); notch = null; pane = null; panel.innerHTML = ""; }
  function close() {
    const was = openName; openName = null; closeNow(); onOpenChange?.(false);
    if (saved && (desk.poses[was] || was === "drip" || was === "okfs")) {
      const s = saved; saved = null;
      const p = new THREE.Vector3(s.look.x + s.sph.r * Math.sin(s.sph.ph) * Math.sin(s.sph.th), s.look.y + s.sph.r * Math.cos(s.sph.ph), s.look.z + s.sph.r * Math.sin(s.sph.ph) * Math.cos(s.sph.th));
      fly({ pos: p.toArray(), look: s.look.toArray() });
    }
  }
  function setLight(name) { desk.setLight(name); }

  // ---------- ambient work on the monitor ----------
  const AMBIENT = [
    { kind: "ok", title: "make test finished", detail: "3m 12s" },
    { kind: "info", icon: "agent", title: "my-app needs you", detail: "Claude needs your permission to use Bash", stay: true, id: "claude:a" },
    { kind: "ok", icon: "agent", title: "my-app is done", detail: "Fixed the flaky test and pushed the branch.", id: "claude:a" },
    { kind: "warn", title: "Deploy to prod?", detail: "v1.4.0", yes: "Deploy", no: "Cancel" },
    { kind: "ok", title: "deployed", detail: "api 1.4.2 in 48s" },
  ];
  let ai = 0;
  const ambient = () => { if (!openName) desk.laptopCard(AMBIENT[ai++ % AMBIENT.length]); };
  later(ambient, 1200);
  const ambientTimer = setInterval(ambient, 6500);

  // ---------- loop ----------
  // the room only renders while it is on screen, so scrolling past it costs nothing
  let raf = 0, visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
  function frame(now) {
    raf = 0;
    if (!visible) return;
    if (flying) flying(now);
    else {
      if (!reduced && !drag && !openName && now - lastMove > 2500) goal.th += Math.sin(now / 6000) * 0.0006;
      const k = reduced ? 1 : 0.08;
      const ease = (v, g, eps) => (Math.abs(g - v) < eps ? g : v + (g - v) * k);
      sph.r = ease(sph.r, goal.r, 0.01); sph.th = ease(sph.th, goal.th, 0.0004); sph.ph = ease(sph.ph, goal.ph, 0.0004);
      look.lerp(lookGoal, k);
      place();
    }
    desk.viewFrom(cam.position); desk.update(now, reduced);
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }
  resize(); ro.observe(stage); io.observe(stage);
  place(); raf = requestAnimationFrame(frame);

  function destroy() {
    cancelAnimationFrame(raf); raf = 0; visible = false;
    ro.disconnect(); io.disconnect();
    clearInterval(ambientTimer); for (const t of timers) clearTimeout(t); timers.clear();
    removeEventListener("keydown", onKey);
    notch?.clear();
    desk.root.traverse((o) => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
    renderer.dispose(); renderer.forceContextLoss();
    el.remove(); tip.remove(); panel.remove();
  }
  return { open, close, setLight, destroy };
}
const clamp = (v, [a, b]) => Math.max(a, Math.min(b, v));
