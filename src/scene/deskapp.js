// The app around the voxel desk: the renderer, an orbit camera, picking, and the small panel the
// mug opens. `startDesk` returns a handle whose `destroy` undoes it all.

import * as THREE from "three";
import { buildDesk } from "./voxel.js";
import { markSVG } from "./mark.js";
import VOX_URL from "./jrnxf.vox?url";

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
.desk-p{margin:0;color:var(--p-muted,#b5b5b0);max-width:64ch}
.desk-p.big{font-size:18px;color:var(--p-fg,#ededeb)}
.desk-links{display:flex;flex-wrap:wrap;gap:8px}
.desk-links a{font:500 12px "Geist Mono",monospace;text-decoration:none;border:1px solid var(--p-line,#2a2a2e);border-radius:999px;padding:6px 11px}
.desk-links a:hover{border-color:var(--p-acc,#fb9890)}
.desk-mark{width:min(300px,70%);color:var(--p-fg,#ededeb)}.desk-mark svg{width:100%;height:auto;display:block}
@media (max-width:720px){.desk-panel{left:0;top:auto;bottom:0;transform:none;width:100%;max-height:82%;border-radius:18px 18px 0 0;box-shadow:0 -20px 40px -10px rgba(0,0,0,.6);animation:none}}
`;
const LABEL = { mug: "the mug · about" };

export function startDesk({ stage, backdrop = "white", onOpenChange }) {
  if (!document.getElementById("desk-css")) { const st = document.createElement("style"); st.id = "desk-css"; st.textContent = CSS; document.head.append(st); }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = () => innerWidth < 720;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  const pixelRatio = () => Math.min(devicePixelRatio || 1, phone() ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio());
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  stage.append(renderer.domElement);
  // the canvas owns touch gestures: one finger turns the room, two fingers zoom it
  renderer.domElement.style.touchAction = "none";
  const scene = new THREE.Scene();
  // the voxels load from the .vox file; until they arrive the stage stays empty
  let desk = null, targets = [], dead = false;
  fetch(VOX_URL).then((r) => { if (!r.ok) throw new Error(`jrnxf.vox: ${r.status}`); return r.arrayBuffer(); }).then((buf) => {
    if (dead) return;
    desk = buildDesk(THREE, buf, { shadows: true, backdrop });
    targets = Object.values(desk.hit);
    scene.add(desk.root);
    reframe(true);
  }).catch((e) => console.error(e));

  // ---------- camera ----------
  const R0 = 100;
  // the start views: a back three-quarter from the light side (A), over his shoulder at the screen (B),
  // low and large (C), and side on to the desk (D). r and look are null where the screen size decides.
  // center puts the scene's box in the middle of the viewport; B is a close-up, so it stays as framed.
  const DESK_LOOK = [32.5, 13, 14];
  const PRESETS = {
    A: { th: 2.28, ph: 1.17, r: null, look: null, center: true },
    B: { th: 0.3, ph: 1.1, r: 42, look: [31, 20, 8], center: false },
    C: { th: 2.28, ph: 1.5, r: 78, look: DESK_LOOK, center: true },
    D: { th: Math.PI / 2, ph: 1.45, r: 85, look: DESK_LOOK, center: true },
  };
  let preset = PRESETS.A;
  let sph = { r: R0, th: preset.th, ph: preset.ph }, goal = { ...sph };
  // the camera frames the desk and the sitter alone
  const look = new THREE.Vector3(...DESK_LOOK), lookGoal = look.clone();
  const fit = 0.8;
  const cam = new THREE.PerspectiveCamera(32, 1, 1, 1800);
  const LIM = { ph: [0.7, 1.55] };
  const aspect = () => stage.clientWidth / stage.clientHeight;
  // a tall screen backs the camera off so the whole desk fits, and looks a little higher
  const autoR = () => (aspect() < 1 ? Math.min(250, (R0 * fit) / aspect()) : R0);
  const autoY = () => (aspect() < 1 ? 15 : 13);
  // real zoom: the camera renders a smaller window of the view (setViewOffset), so every zoom level
  // is drawn at full resolution instead of the browser stretching a bitmap. v is the current window
  // (zoom factor + top-left corner as a fraction of the full view), g is where it is easing to
  const ZOOM = [1, 5];
  // home is where the window rests at zoom 1: it is chosen so the scene's box sits in the middle of the viewport
  const home = { x: 0, y: 0 };
  const v = { z: 1, x: 0, y: 0 }, g = { z: 1, x: 0, y: 0 };
  const corner = new THREE.Vector3();
  function computeHome() {
    home.x = home.y = 0;
    if (!desk?.framing || !preset.center) return;
    // project the box from the pose the camera is heading for, with no window, and measure where the voxels land
    cam.clearViewOffset();
    const { r, th, ph } = goal;
    cam.position.set(lookGoal.x + r * Math.sin(ph) * Math.sin(th), lookGoal.y + r * Math.cos(ph), lookGoal.z + r * Math.sin(ph) * Math.cos(th));
    cam.lookAt(lookGoal); cam.updateMatrixWorld();
    const ndc = [[Infinity, -Infinity], [Infinity, -Infinity]];
    for (const p of desk.framing) {
      corner.copy(p).project(cam);
      ndc[0][0] = Math.min(ndc[0][0], corner.x); ndc[0][1] = Math.max(ndc[0][1], corner.x);
      ndc[1][0] = Math.min(ndc[1][0], corner.y); ndc[1][1] = Math.max(ndc[1][1], corner.y);
    }
    // the window moves by the box centre's offset from the middle: right to bring it left, down to bring it up
    home.x = (ndc[0][0] + ndc[0][1]) / 4; home.y = -(ndc[1][0] + ndc[1][1]) / 4;
  }
  // snap puts the window straight on its new home; otherwise it eases there
  function reframe(snap) {
    computeHome();
    if (g.z === 1) { g.x = home.x; g.y = home.y; if (snap) { v.x = g.x; v.y = g.y; } }
    // computing the home cleared the window, so put it back
    applyView();
  }
  function setView(name) {
    const p = PRESETS[name];
    if (!p || openName) return;
    preset = p;
    goal.th = p.th; goal.ph = p.ph; goal.r = p.r ?? autoR();
    lookGoal.set(...(p.look ?? [DESK_LOOK[0], autoY(), DESK_LOOK[2]]));
    g.z = 1; reframe(false);
  }
  function zoomAt(factor, u, w) {
    const z = clamp(g.z * factor, ZOOM);
    // keep the point under the cursor (u, w as 0..1 across the stage) fixed while the window shrinks
    const cx = g.x + u / g.z, cy = g.y + w / g.z;
    const [hx, hy] = [home.x / z, home.y / z];
    g.z = z; g.x = clamp(cx - u / z, [hx, 1 - 1 / z + hx]); g.y = clamp(cy - w / z, [hy, 1 - 1 / z + hy]);
  }
  function applyView() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    if (v.z < 1.001 && Math.abs(v.x) < 1e-3 && Math.abs(v.y) < 1e-3) cam.clearViewOffset();
    else cam.setViewOffset(w, h, v.x * w, v.y * h, w / v.z, h / v.z);
  }
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    // re-read the pixel ratio so browser zoom (which changes it) redraws sharp
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    // a tall screen backs the camera off so the whole desk fits, and looks a little higher
    if (!openName && preset.r == null) { goal.r = sph.r = autoR(); lookGoal.y = look.y = autoY(); }
    cam.updateProjectionMatrix();
    computeHome();
    if (g.z === 1) { g.x = v.x = home.x; g.y = v.y = home.y; }
    applyView();
  }
  const ro = new ResizeObserver(resize);
  addEventListener("resize", resize);
  const place = () => { const { r, th, ph } = sph; cam.position.set(look.x + r * Math.sin(ph) * Math.sin(th), look.y + r * Math.cos(ph), look.z + r * Math.sin(ph) * Math.cos(th)); cam.lookAt(look); };

  // ---------- input ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const tip = document.createElement("div"); tip.className = "desk-tip"; stage.append(tip);
  const touches = new Map();
  let pinch = null, drag = null, lastMove = performance.now();
  const pick = (e) => { const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const h = ray.intersectObjects(targets)[0]; return h ? h.object.userData.name : null; };
  const el = renderer.domElement;
  const stageUV = (cx, cy) => { const r = el.getBoundingClientRect(); return [(cx - r.left) / r.width, (cy - r.top) / r.height]; };
  el.addEventListener("wheel", (e) => {
    if (openName) return;
    e.preventDefault();
    // pinch on a trackpad arrives as ctrl+wheel with small deltas; a plain wheel needs a gentler step
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const [u, w] = stageUV(e.clientX, e.clientY);
    zoomAt(Math.exp(-px * (e.ctrlKey ? 0.01 : 0.0015)), u, w);
  }, { passive: false });
  const pinchSpan = () => { const [a, b] = [...touches.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); el.setPointerCapture(e.pointerId);
      if (touches.size === 2 && !openName) { drag = null; pinched = true; pinch = pinchSpan(); return; }
    }
    drag = { x: e.clientX, y: e.clientY, moved: 0, th: goal.th, ph: goal.ph, touch: e.pointerType !== "mouse" }; if (!drag.touch) el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
    lastMove = performance.now();
    if (touches.has(e.pointerId)) {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && touches.size >= 2) {
        const now = pinchSpan(), [u, w] = stageUV(now.x, now.y);
        zoomAt(now.d / pinch.d, u, w);
        pinch = now;
      }
      if (pinched) return;
    }
    if (drag && !openName) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.hypot(dx, dy);
      goal.th = drag.th - dx * 0.005;
      goal.ph = clamp(drag.ph - dy * 0.004, LIM.ph);
    }
    if (e.pointerType === "mouse") setHover(pick(e), e);
  });
  // a pinch must not end in a tap that opens the mug, so it holds the drag shut until every finger is up
  let pinched = false;
  const endTouch = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; if (!touches.size) pinched = false; };
  el.addEventListener("pointerup", (e) => { const was = pinched; endTouch(e); const d = was ? null : drag; drag = null; if (d && d.moved < 6) { const n = pick(e); if (n) open(n); } });
  el.addEventListener("pointercancel", (e) => { endTouch(e); drag = null; });
  el.addEventListener("pointerleave", () => setHover(null));
  function setHover(n, e) {
    desk?.highlight(n && !openName ? n : null);
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
    panel.innerHTML = `${top}<div class="desk-mark">${markSVG()}</div><p class="desk-p big">Hi, I'm Colby. I build small, sharp tools for the terminal and the Mac, from a beach in northern Portugal.</p>
      <div class="desk-links"><a href="mailto:colby@jrnxf.co">colby@jrnxf.co</a><a href="https://github.com/jrnxf" target="_blank" rel="noopener">github</a><a href="https://instagram.com/jrn.xf" target="_blank" rel="noopener">instagram</a><a href="https://www.youtube.com/@jrnxf" target="_blank" rel="noopener">youtube</a><a href="https://twitter.com/jrn_xf" target="_blank" rel="noopener">twitter</a></div>`;
    panel.classList.add("on");
    panel.querySelector(".desk-x").onclick = close;
    panel.querySelector(".desk-x").focus({ preventScroll: true });
  }
  function close() { openName = null; panel.classList.remove("on"); panel.innerHTML = ""; onOpenChange?.(false); }

  // ---------- loop ----------
  // the room only renders while it is on screen, so scrolling past it costs nothing
  let raf = 0, visible = true, paused = false, sim = 0, lastNow = 0;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
  function frame(now) {
    raf = 0;
    if (!visible) return;
    // motion runs on its own clock so a pause freezes the sway, typing, steam and clock together
    if (!paused) sim += lastNow ? now - lastNow : 0;
    lastNow = now;
    if (!paused && !reduced && !drag && !openName && now - lastMove > 2500) goal.th += Math.sin(sim / 6000) * 0.0021;
    const k = reduced ? 1 : 0.08;
    const ease = (v, g, eps) => (Math.abs(g - v) < eps ? g : v + (g - v) * k);
    sph.r = ease(sph.r, goal.r, 0.01); sph.th = ease(sph.th, goal.th, 0.0004); sph.ph = ease(sph.ph, goal.ph, 0.0004);
    look.lerp(lookGoal, k);
    const zk = reduced ? 1 : 0.18, moved = Math.abs(g.z - v.z) > 1e-4 || Math.abs(g.x - v.x) > 1e-4 || Math.abs(g.y - v.y) > 1e-4;
    if (moved) { v.z += (g.z - v.z) * zk; v.x += (g.x - v.x) * zk; v.y += (g.y - v.y) * zk; if (Math.abs(g.z - v.z) <= 1e-4) Object.assign(v, g); applyView(); }
    place();
    desk?.update(sim, reduced);
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }
  resize(); ro.observe(stage); io.observe(stage);
  place(); raf = requestAnimationFrame(frame);

  function destroy() {
    cancelAnimationFrame(raf); raf = 0; visible = false; dead = true;
    ro.disconnect(); io.disconnect();
    removeEventListener("keydown", onKey); removeEventListener("resize", resize);
    desk?.root.traverse((o) => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
    renderer.dispose(); renderer.forceContextLoss();
    el.remove(); tip.remove(); panel.remove();
  }
  return { open, close, destroy, setView, setPaused: (p) => { paused = p; } };
}
const clamp = (v, [a, b]) => Math.max(a, Math.min(b, v));
