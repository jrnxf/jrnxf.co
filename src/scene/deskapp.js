// The app around the voxel desk: the renderer, an orbit camera, and the small panel the page opens. `startDesk` returns a handle whose `destroy` undoes it all.

import * as THREE from "three";
import { buildDesk } from "./voxel.js";
import { markSVG } from "./mark.js";
import VOX_URL from "./jrnxf.vox?url";

const CSS = `
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
  renderer.toneMapping = THREE.NoToneMapping;
  stage.append(renderer.domElement);
  // the canvas owns touch gestures: one finger turns the room, two fingers zoom it
  renderer.domElement.style.touchAction = "none";
  const scene = new THREE.Scene();
  // the voxels load from the .vox file; until they arrive the stage stays empty
  let desk = null, dead = false;
  fetch(VOX_URL).then((r) => { if (!r.ok) throw new Error(`jrnxf.vox: ${r.status}`); return r.arrayBuffer(); }).then((buf) => {
    if (dead) return;
    desk = buildDesk(THREE, buf, { shadows: true, backdrop });
    scene.add(desk.root);
    if (preset.r == null) goal.r = sph.r = distance();
    reframe(true);
    startIntro();
  }).catch((e) => console.error(e));

  // ---------- camera ----------
  const R0 = 100;
  // the two views of the opening move: side on to the desk (D, where it starts) and over his shoulder at
  // the screen (B, where it rests). r and look are null where the screen size decides. center puts the
  // scene in the middle of the viewport; fit backs the camera off until the whole scene sits inside it
  // with a margin.
  const DESK_LOOK = [32.5, 13, 14];
  const PRESETS = {
    B: { th: 0.3, ph: 1.1, r: null, look: null, center: true, fit: true },
    D: { th: Math.PI / 2, ph: 1.45, r: 85, look: DESK_LOOK, center: true },
  };
  let preset = PRESETS.B;
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
  // where the voxels land on screen (as -1..1 extents) from the pose the camera is heading for at distance r, with no window
  function measure(r) {
    cam.clearViewOffset();
    const { th, ph } = goal;
    cam.position.set(lookGoal.x + r * Math.sin(ph) * Math.sin(th), lookGoal.y + r * Math.cos(ph), lookGoal.z + r * Math.sin(ph) * Math.cos(th));
    cam.lookAt(lookGoal); cam.updateMatrixWorld();
    const ndc = [[Infinity, -Infinity], [Infinity, -Infinity]];
    for (const p of desk.framing) {
      corner.copy(p).project(cam);
      ndc[0][0] = Math.min(ndc[0][0], corner.x); ndc[0][1] = Math.max(ndc[0][1], corner.x);
      ndc[1][0] = Math.min(ndc[1][0], corner.y); ndc[1][1] = Math.max(ndc[1][1], corner.y);
    }
    return ndc;
  }
  // the distance at which the whole scene fits with a margin: perspective is close to 1/r, so a few corrections settle it
  function fitR() {
    if (!desk?.framing) return autoR();
    let r = goal.r || R0;
    for (let i = 0; i < 5; i++) {
      const [[x0, x1], [y0, y1]] = measure(r);
      r = clamp((r * Math.max((x1 - x0) / 2, (y1 - y0) / 2)) / 0.8, [30, 400]);
    }
    return r;
  }
  const distance = () => (preset.r != null ? preset.r : preset.fit ? fitR() : autoR());
  function computeHome() {
    home.x = home.y = 0;
    if (!desk?.framing || !preset.center) return;
    const ndc = measure(goal.r);
    // the window moves by the scene centre's offset from the middle: right to bring it left, down to bring it up
    home.x = (ndc[0][0] + ndc[0][1]) / 4; home.y = -(ndc[1][0] + ndc[1][1]) / 4;
  }
  // snap puts the window straight on its new home; otherwise it eases there
  function reframe(snap) {
    computeHome();
    if (g.z === 1) { g.x = home.x; g.y = home.y; if (snap) { v.x = g.x; v.y = g.y; } }
    // computing the home cleared the window, so put it back
    applyView();
  }
  // The opening move: the scene starts side on (D) and one slow eased move takes the camera to the
  // zoomed-out over-the-shoulder view (B), where the sway takes over. Touching the scene cancels it.
  let intro = null;
  const INTRO_MS = 5000;
  const poseNow = () => ({ th: goal.th, ph: goal.ph, r: goal.r, look: lookGoal.clone(), hx: home.x, hy: home.y });
  function usePose(q) {
    sph.th = goal.th = q.th; sph.ph = goal.ph = q.ph; sph.r = goal.r = q.r;
    look.copy(q.look); lookGoal.copy(q.look);
    g.z = v.z = 1; g.x = v.x = q.hx; g.y = v.y = q.hy;
    applyView();
  }
  function startIntro() {
    if (reduced || intro) return;
    setView("D"); const a = poseNow();
    setView("B"); const b = poseNow();
    usePose(a);
    intro = { a, b, t0: null };
  }
  function stepIntro(now) {
    intro.t0 ??= now;
    const u = Math.min(1, (now - intro.t0) / INTRO_MS), e = u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;
    const { a, b } = intro, mix = (x, y) => x + (y - x) * e;
    usePose({ th: mix(a.th, b.th), ph: mix(a.ph, b.ph), r: mix(a.r, b.r), look: a.look.clone().lerp(b.look, e), hx: mix(a.hx, b.hx), hy: mix(a.hy, b.hy) });
    if (u === 1) intro = null;
  }
  function setView(name) {
    const p = typeof name === "string" ? PRESETS[name] : name;
    if (!p || openName) return;
    preset = p; intro = null;
    goal.th = p.th; goal.ph = p.ph;
    lookGoal.set(...(p.look ?? [DESK_LOOK[0], autoY(), DESK_LOOK[2]]));
    goal.r = distance();
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
    if (!openName) intro = null;
    if (!openName && preset.r == null) { if (!preset.look) lookGoal.y = look.y = autoY(); goal.r = sph.r = distance(); }
    cam.updateProjectionMatrix();
    computeHome();
    if (g.z === 1) { g.x = v.x = home.x; g.y = v.y = home.y; }
    applyView();
  }
  const ro = new ResizeObserver(resize);
  addEventListener("resize", resize);
  const place = () => { const { r, th, ph } = sph; cam.position.set(look.x + r * Math.sin(ph) * Math.sin(th), look.y + r * Math.cos(ph), look.z + r * Math.sin(ph) * Math.cos(th)); cam.lookAt(look); };

  // ---------- input ----------
  const touches = new Map();
  let pinch = null, drag = null, lastMove = performance.now();
  const el = renderer.domElement;
  const stageUV = (cx, cy) => { const r = el.getBoundingClientRect(); return [(cx - r.left) / r.width, (cy - r.top) / r.height]; };
  // a locked scene ignores the wheel and drags, so the page can scroll over it
  let locked = false;
  el.addEventListener("wheel", (e) => {
    if (openName || locked) return;
    intro = null;
    e.preventDefault();
    // pinch on a trackpad arrives as ctrl+wheel with small deltas; a plain wheel needs a gentler step
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const [u, w] = stageUV(e.clientX, e.clientY);
    zoomAt(Math.exp(-px * (e.ctrlKey ? 0.01 : 0.0015)), u, w);
  }, { passive: false });
  const pinchSpan = () => { const [a, b] = [...touches.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  el.addEventListener("pointerdown", (e) => {
    if (locked) return;
    intro = null;
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
  });
  // a pinch ends with the drag shut, so lifting the fingers one after the other does not read as a drag
  let pinched = false;
  const endTouch = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; if (!touches.size) pinched = false; };
  el.addEventListener("pointerup", (e) => { endTouch(e); drag = null; });
  el.addEventListener("pointercancel", (e) => { endTouch(e); drag = null; });
  el.style.cursor = "grab";
  const onKey = (e) => { if (e.key === "Escape" && openName) close(); };
  addEventListener("keydown", onKey);

  // ---------- panels ----------
  const panel = document.createElement("div"); panel.className = "desk-panel"; panel.setAttribute("role", "dialog"); stage.append(panel);
  let openName = null;
  function open(name) {
    if (openName === name) return;
    openName = name; onOpenChange?.(true);
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
  let raf = 0, visible = true, sim = 0, lastNow = 0, swayOff = 0, swayClock = 0, swaying = false;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
  function frame(now) {
    raf = 0;
    if (!visible) return;
    // motion runs on its own clock so a pause freezes the sway, typing, steam and clock together
    const dt = lastNow ? now - lastNow : 0;
    sim += dt;
    lastNow = now;
    // the sway swings evenly around wherever the view rests: each time it starts, it starts from zero
    if (intro) stepIntro(now);
    if (!intro && !reduced && !locked && preset.sway !== false && !drag && !openName && now - lastMove > 2500) {
      if (!swaying) { swaying = true; swayClock = 0; swayOff = 0; }
      swayClock += dt;
      const off = Math.sin(swayClock / 6000) * 0.4;
      goal.th += off - swayOff; swayOff = off;
    } else swaying = false;
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
    el.remove(); panel.remove();
  }
  return {
    open, close, destroy,
    // flies the camera to a pose ({ th, ph, r, look }), or home when none is given
    flyTo: (pose) => setView(pose ? { sway: false, center: false, ...pose } : "B"),
    setScreen: (s) => desk?.setScreen(s),
    setLocked: (v) => { locked = v; el.style.touchAction = v ? "pan-y" : "none"; el.style.cursor = v ? "" : "grab"; },
  };
}
const clamp = (v, [a, b]) => Math.max(a, Math.min(b, v));
