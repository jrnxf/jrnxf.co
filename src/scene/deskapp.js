// The app around the voxel desk: the renderer, an orbit camera, picking, and the small panels the
// mug and the window open. `startDesk` returns a handle whose `destroy` undoes it all.

import * as THREE from "three";
import { buildDesk, lightForHour } from "./voxel.js";
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
.desk-x{all:unset;cursor:pointer;align-self:flex-start;font:500 12px "Geist Mono",monospace;color:var(--p-muted,#9a9a96);padding:6px 10px;border-radius:999px;border:1px solid var(--p-line,#2a2a2e)}
.desk-x:hover{color:var(--p-fg,#fff)}
.desk-x:focus-visible{outline:2px solid var(--p-acc,#fb9890);outline-offset:2px}
.desk-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.desk-h b{font:600 28px/1 Geist,sans-serif;letter-spacing:-.02em}
.desk-h span{color:var(--p-muted,#9a9a96);font:500 13px "Geist Mono",monospace}
.desk-p{margin:0;color:var(--p-muted,#b5b5b0);max-width:64ch}
.desk-p.big{font-size:18px;color:var(--p-fg,#ededeb)}
.desk-keys{display:flex;flex-wrap:wrap;gap:6px}
.desk-keys button{all:unset;cursor:pointer;font:500 12px "Geist Mono",monospace;color:var(--p-fg,#ededeb);background:var(--p-key,#1b1b1d);border:1px solid var(--p-line,#2a2a2e);border-radius:8px;padding:7px 10px;overflow-wrap:anywhere}
.desk-keys button:hover{border-color:var(--p-acc,#fb9890)}
.desk-keys button:focus-visible{outline:2px solid var(--p-acc,#fb9890);outline-offset:2px}
.desk-links{display:flex;flex-wrap:wrap;gap:8px}
.desk-links a{font:500 12px "Geist Mono",monospace;text-decoration:none;border:1px solid var(--p-line,#2a2a2e);border-radius:999px;padding:6px 11px}
.desk-links a:hover{border-color:var(--p-acc,#fb9890)}
.desk-mark{width:min(300px,70%);color:var(--p-fg,#ededeb)}.desk-mark svg{width:100%;height:auto;display:block}
@media (max-width:720px){.desk-panel{left:0;top:auto;bottom:0;transform:none;width:100%;max-height:82%;border-radius:18px 18px 0 0;box-shadow:0 -20px 40px -10px rgba(0,0,0,.6);animation:none}}
`;
const LABEL = { mug: "the mug · about", window: "the sea · northern Portugal, now" };
const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const lisbon = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
const lisbonH = () => { const [h, m] = lisbon().split(":").map(Number); return h + m / 60; };
// the room is built at 2.5 voxels per scene unit, the density the captain chose
const RES = 2.5;

export function startDesk({ stage, light = "golden", backdrop = null, onOpenChange }) {
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
  const desk = buildDesk(THREE, { light, shadows: true, res: RES, backdrop });
  scene.add(desk.root);

  // ---------- camera ----------
  const R0 = 108;
  let sph = { r: R0, th: 0.78, ph: 1.12 }, goal = { ...sph };
  const look = new THREE.Vector3(28.5, 13, 15), lookGoal = look.clone();
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
    if (drag && !openName) {
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
  const onKey = (e) => { if (e.key === "Escape" && openName) close(); };
  addEventListener("keydown", onKey);

  // ---------- panels ----------
  const panel = document.createElement("div"); panel.className = "desk-panel"; panel.setAttribute("role", "dialog"); stage.append(panel);
  let openName = null;
  function open(name) {
    if (openName === name) return;
    openName = name; setHover(null); onOpenChange?.(true);
    const top = `<div class="desk-top"><button class="desk-x" aria-label="Back to the desk">← back to the desk</button></div>`;
    if (name === "mug") {
      panel.innerHTML = `${top}<div class="desk-mark">${markSVG()}</div><p class="desk-p big">Hi, I'm Colby. I build small, sharp tools for the terminal and the Mac, from a beach in northern Portugal.</p>
        <div class="desk-links"><a href="mailto:colby@jrnxf.co">colby@jrnxf.co</a><a href="https://github.com/jrnxf" target="_blank" rel="noopener">github</a><a href="https://instagram.com/jrn.xf" target="_blank" rel="noopener">instagram</a><a href="https://www.youtube.com/@jrnxf" target="_blank" rel="noopener">youtube</a><a href="https://twitter.com/jrn_xf" target="_blank" rel="noopener">twitter</a></div>`;
    } else if (name === "window") {
      const now = lightForHour(lisbonH());
      panel.innerHTML = `${top}<div class="desk-h"><b>${lisbon()}</b><span>on this coast right now</span></div><p class="desk-p">The window looks west over the Atlantic. Change the light:</p>
        <div class="desk-keys">${["golden", "day", "night"].map((k) => `<button data-l="${k}">${k}${k === now ? " · now" : ""}</button>`).join("")}</div>`;
      panel.querySelectorAll("[data-l]").forEach((b) => b.addEventListener("click", () => setLight(b.dataset.l)));
    }
    panel.classList.add("on");
    panel.querySelector(".desk-x").onclick = close;
    panel.querySelector(".desk-x").focus({ preventScroll: true });
  }
  function close() { openName = null; panel.classList.remove("on"); panel.innerHTML = ""; onOpenChange?.(false); }
  function setLight(name) { desk.setLight(name); }

  // ---------- loop ----------
  // the room only renders while it is on screen, so scrolling past it costs nothing
  let raf = 0, visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
  function frame(now) {
    raf = 0;
    if (!visible) return;
    if (!reduced && !drag && !openName && now - lastMove > 2500) goal.th += Math.sin(now / 6000) * 0.0006;
    const k = reduced ? 1 : 0.08;
    const ease = (v, g, eps) => (Math.abs(g - v) < eps ? g : v + (g - v) * k);
    sph.r = ease(sph.r, goal.r, 0.01); sph.th = ease(sph.th, goal.th, 0.0004); sph.ph = ease(sph.ph, goal.ph, 0.0004);
    look.lerp(lookGoal, k);
    place();
    desk.viewFrom(cam.position); desk.update(now, reduced);
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }
  resize(); ro.observe(stage); io.observe(stage);
  place(); raf = requestAnimationFrame(frame);

  function destroy() {
    cancelAnimationFrame(raf); raf = 0; visible = false;
    ro.disconnect(); io.disconnect();
    removeEventListener("keydown", onKey);
    desk.root.traverse((o) => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
    renderer.dispose(); renderer.forceContextLoss();
    el.remove(); tip.remove(); panel.remove();
  }
  return { open, close, setLight, destroy };
}
const clamp = (v, [a, b]) => Math.max(a, Math.min(b, v));
