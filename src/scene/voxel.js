// The desk, in voxels: me at a standing desk in a soft void, with terminals at work on the monitor.
// The voxels and their colours come from a MagicaVoxel .vox file (jrnxf.vox, edited in vxr); this
// module splits it into the parts that move and adds what a .vox cannot hold: the screens, the
// clock, the steam and the light. Written against three r128.

import { MARK } from "./mark.js";
import { paintTerminals } from "./terminals.js";

// one voxel is 0.4 scene units, the 2.5x density the captain chose
const S = 0.4;

// Reads a .vox file into world voxels: [x, y, z, paletteIndex] per voxel, .vox axes (z up), with each
// model moved by its transform's translation. Rotations are not read; vxr writes none.
export function parseVox(buf) {
  const v = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder();
  const id = (p) => String.fromCharCode(u8[p], u8[p + 1], u8[p + 2], u8[p + 3]);
  if (id(0) !== "VOX ") throw new Error("not a .vox file");
  const models = [], trn = new Map(), grp = new Map(), shp = new Map();
  let palette = null, size = null;
  let p = 8;
  const str = () => { const n = v.getInt32(p, true); p += 4; const s = dec.decode(u8.subarray(p, p + n)); p += n; return s; };
  const dict = () => { const n = v.getInt32(p, true), o = {}; p += 4; for (let i = 0; i < n; i++) { const k = str(); o[k] = str(); } return o; };
  const i32 = () => { const n = v.getInt32(p, true); p += 4; return n; };
  // MAIN holds every other chunk as its children
  for (let q = 20; q < u8.length;) {
    const cid = id(q), n = v.getInt32(q + 4, true), m = v.getInt32(q + 8, true);
    p = q + 12;
    if (cid === "SIZE") size = [i32(), i32(), i32()];
    else if (cid === "XYZI") { const c = i32(); models.push({ size, xyzi: u8.slice(p, p + c * 4) }); }
    else if (cid === "RGBA") palette = u8.slice(p, p + 1024);
    else if (cid === "nTRN") { const i = i32(); dict(); const child = i32(); i32(); i32(); const frames = i32(); const f = frames ? dict() : {}; trn.set(i, { child, t: (f._t || "0 0 0").split(" ").map(Number) }); }
    else if (cid === "nGRP") { const i = i32(); dict(); const c = i32(), kids = []; for (let k = 0; k < c; k++) kids.push(i32()); grp.set(i, kids); }
    else if (cid === "nSHP") { const i = i32(); dict(); i32(); shp.set(i, i32()); }
    q += 12 + n + (cid === "MAIN" ? 0 : m);
  }
  if (!palette) throw new Error("the .vox file has no palette");
  const out = [];
  const place = (mi, t) => {
    const { size: sz, xyzi } = models[mi];
    // a model's translation is its centre, rounded down
    const o = [0, 1, 2].map((a) => t[a] - Math.floor(sz[a] / 2));
    for (let i = 0; i < xyzi.length; i += 4) out.push([xyzi[i] + o[0], xyzi[i + 1] + o[1], xyzi[i + 2] + o[2], xyzi[i + 3]]);
  };
  const walk = (node, t) => {
    if (trn.has(node)) { const n = trn.get(node); walk(n.child, t.map((x, a) => x + n.t[a])); }
    else if (grp.has(node)) for (const k of grp.get(node)) walk(k, t);
    else if (shp.has(node)) place(shp.get(node), t);
  };
  if (trn.has(0)) walk(0, [0, 0, 0]); else models.forEach((_, mi) => place(mi, [0, 0, 0]));
  // palette entry i colours voxels with index i + 1
  const colour = (ci) => [palette[(ci - 1) * 4], palette[(ci - 1) * 4 + 1], palette[(ci - 1) * 4 + 2]];
  return { voxels: out, colour };
}

// a .vox voxel's centre in scene units: .vox is z-up with +y toward the monitor, three is y-up with
// -z toward the monitor; the quarter-voxel offsets keep the screen, clock and mark on their faces
export const toScene = ([x, y, z]) => [(x - 0.25) * S, (z + 0.25) * S, -(y + 0.25) * S];

// The front face of the voxels inside a box ([min, max] per axis, scene units): only the front-most layer
// (largest z), and of that layer only the rows as wide as its widest, so a stand or lip poking above or
// below the case is not part of the face. It is the box those voxels' outer faces span; the box given
// is just there to pick the object out.
export function frontFace(voxels, [x0, x1], [y0, y1], [z0, z1]) {
  const cells = voxels.map(toScene).filter(([x, y, z]) => x > x0 && x < x1 && y > y0 && y < y1 && z > z0 && z < z1);
  const zf = Math.max(...cells.map((c) => c[2])), front = cells.filter((c) => c[2] > zf - S / 2);
  const rows = new Map();
  for (const c of front) { const k = Math.round(c[1] / S); (rows.get(k) ?? rows.set(k, []).get(k)).push(c); }
  const widest = Math.max(...[...rows.values()].map((r) => r.length));
  const face = [...rows.values()].filter((r) => r.length >= widest * 0.8).flat();
  const xs = face.map((c) => c[0]), ys = face.map((c) => c[1]);
  return { x0: Math.min(...xs) - S / 2, x1: Math.max(...xs) + S / 2, y0: Math.min(...ys) - S / 2, y1: Math.max(...ys) + S / 2, z: zf + S / 2 };
}

// a screen laid on a face: inset on the left, right and top, and as tall as its aspect (width / height)
// says, or down to the same inset at the bottom without one. It sits a hair in front of the face.
export const SCREEN_LIFT = 0.01;
export function screenRect(face, inset, aspect, bottom = inset) {
  const w = face.x1 - face.x0 - 2 * inset, h = aspect ? w / aspect : face.y1 - face.y0 - inset - bottom;
  return { x0: face.x0 + inset, x1: face.x1 - inset, y1: face.y1 - inset, y0: face.y1 - inset - h, w, h, z: face.z + SCREEN_LIFT };
}

// the two screens' faces in the scene, picked out of the voxels by the box each object sits in
export const MONITOR_BOX = [[21, 41], [17, 29], [4, 5.8]];
export const CLOCK_BOX = [[40, 46], [15.5, 18], [5, 9]];
// the monitor's bezel: 0.3 on the sides and top, a little more along the bottom; the screen takes the rest of the face
export const MONITOR_INSET = 0.3, MONITOR_BOTTOM = 0.6, CLOCK_INSET = 0.2;

export const SKIN = ["#c98f68", "#b67b58"];
const hex = ([r, g, b]) => "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

// Sorts the voxels into the parts that move: the head (it sways) and each
// forearm (they type). Everything else stands still. Regions are in scene units.
export function splitParts(voxels, colour) {
  const parts = { body: [], head: [], left: [], right: [] };
  for (const vx of voxels) {
    const [x, y, z] = toScene(vx), c = hex(colour(vx[3]));
    const cell = { at: [x, y, z], c };
    // the head: everything above the neck, over the chair; the monitor is well in front of it
    if (y > 21.1 && x > 25 && x < 37 && z > 12) parts.head.push(cell);
    // the forearms and hands: skin in front of the elbows, at desk height
    else if (SKIN.includes(c) && y > 13.6 && y < 17 && z < 17.4 && x > 24 && x < 38) parts[x < 31 ? "left" : "right"].push(cell);
    else parts.body.push(cell);
  }
  return parts;
}

// one InstancedMesh of the visible cells only: a cell buried on all six sides is skipped. Every voxel
// is flat in its palette colour; the light alone makes one face differ from the next.
function voxMesh(THREE, cells, shadows, pivot = [0, 0, 0]) {
  const key = (a) => a.map((n) => Math.round(n / S)).join(",");
  const filled = new Set(cells.map((v) => key(v.at)));
  const shown = cells.filter(({ at: [x, y, z] }) => ![[S, 0, 0], [-S, 0, 0], [0, S, 0], [0, -S, 0], [0, 0, S], [0, 0, -S]].every(([a, b, c]) => filled.has(key([x + a, y + b, z + c]))));
  const n = shown.length;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(S, S, S), new THREE.MeshLambertMaterial({ color: 0xffffff }), n);
  const M = mesh.instanceMatrix.array, colors = new Float32Array(n * 3), tint = new THREE.Color();
  shown.forEach(({ at, c }, q) => {
    const o = q * 16;
    M[o] = 1; M[o + 5] = 1; M[o + 10] = 1; M[o + 15] = 1;
    M[o + 12] = at[0] - pivot[0]; M[o + 13] = at[1] - pivot[1]; M[o + 14] = at[2] - pivot[2];
    // every voxel gets exactly its palette colour; the palette is sRGB, the shading works in linear light
    tint.setHex(parseInt(c.slice(1), 16)).convertSRGBToLinear();
    colors[q * 3] = tint.r; colors[q * 3 + 1] = tint.g; colors[q * 3 + 2] = tint.b;
  });
  mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = shadows; mesh.receiveShadow = shadows;
  return mesh;
}

const centroid = (cells) => [0, 1, 2].map((a) => cells.reduce((s, v) => s + v.at[a], 0) / cells.length);

export function buildDesk(THREE, vox, { shadows = true, backdrop = "white" } = {}) {
  const root = new THREE.Group();
  const { voxels, colour } = parseVox(vox);
  const parts = splitParts(voxels, colour);
  root.add(voxMesh(THREE, parts.body, shadows));
  const bottom = Math.min(...voxels.map((v) => v[2])) * S + 0.1 - S / 2;

  // a void: no floor or walls, only a soft shadow on an invisible floor to stand the desk on
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.ShadowMaterial({ opacity: backdrop === "white" ? 0.14 : 0.5 }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.set(31, bottom, 14); catcher.receiveShadow = shadows; root.add(catcher);

  // the head sways a little as I read; each forearm pivots at its elbow, so the hands can type and
  // reach for the trackpad. A forearm's elbow is the middle of its back end.
  const head = new THREE.Group();
  // the eyes are their own little meshes so a blink can swap them for skin: the blue voxels of the face, and the same cells in skin
  // the lid is the shaded skin tone of the .vox (a touch darker than the face's own #c98f68), so a shut eye reads as a lid
  const EYE = "#34485f", LID = "#b67b58";
  const eyeCells = parts.head.filter((v) => v.c === EYE);
  head.add(voxMesh(THREE, parts.head.filter((v) => v.c !== EYE), shadows));
  const eyesOpen = voxMesh(THREE, eyeCells, shadows), eyesShut = voxMesh(THREE, eyeCells.map((v) => ({ ...v, c: LID })), shadows);
  eyesShut.visible = false; head.add(eyesOpen, eyesShut);
  root.add(head);
  const forearms = [];
  for (const [side, sx] of [["left", -1], ["right", 1]]) {
    const cells = parts[side];
    if (!cells.length) continue;
    const back = Math.max(...cells.map((v) => v.at[2]));
    const el = centroid(cells.filter((v) => v.at[2] > back - 1));
    const g = new THREE.Group(); g.position.set(...el); g.add(voxMesh(THREE, cells, shadows, el)); root.add(g);
    forearms.push({ g, sx, phase: Math.random() * 6 });
  }

  // screens: canvases drawn every frame or so, laid on the monitor's face and the clock's
  // the monitor's plane is derived from the screen face of its voxels, inset inside the bezel, filling the face down to the chin
  const monFace = frontFace(voxels, ...MONITOR_BOX), monRect = screenRect(monFace, MONITOR_INSET, undefined, MONITOR_BOTTOM);
  const mon = canvasPlane(THREE, 640, 360, monRect.w, monRect.h); mon.mesh.position.set((monRect.x0 + monRect.x1) / 2, monRect.y0 + monRect.h / 2, monRect.z); root.add(mon.mesh);
  // the jrnxf mark on the back of the monitor, in a soft grey, read from behind
  root.add(markPlane(THREE, 7, "#8a8782", [31, 22.8, 4.44]));

  // lights: from over the viewer's shoulder, bright and even, so the figure reads in full
  // white light and no tone mapping, so a palette colour reads as itself
  root.add(new THREE.HemisphereLight("#ffffff", backdrop === "white" ? "#a8a8a8" : "#2a2a2a", 0.75));
  const key = new THREE.DirectionalLight("#ffffff", 0.5);
  key.position.set(70, 52, 58); key.target.position.set(26, 0, 22); root.add(key, key.target);
  if (shadows) { key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const s = key.shadow.camera; s.left = -40; s.right = 40; s.top = 40; s.bottom = -40; s.near = 1; s.far = 160; key.shadow.bias = -0.0015; key.shadow.normalBias = 0.06; }

  // the flip clock's face: real Lisbon time, each card flips when its digits change
  // the plane is derived from the case's front-most layer of voxels, inset inside its edges and a hair
  // in front of it. Its canvas has the plane's own aspect, with the digits drawn centred inside it.
  const clockFace = frontFace(voxels, ...CLOCK_BOX), clockRect = screenRect(clockFace, CLOCK_INSET);
  const CW = Math.round((120 * clockRect.w) / clockRect.h);
  const clock = canvasPlane(THREE, CW, 120, clockRect.w, clockRect.h); clock.mesh.position.set((clockRect.x0 + clockRect.x1) / 2, clockRect.y0 + clockRect.h / 2, clockRect.z); root.add(clock.mesh);
  let shown = ["", "", ""], prev = ["", "", ""], flipAt = [0, 0, 0];
  function drawClock(now, reduced) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Lisbon", hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(new Date());
    const get = (type) => parts.find((q) => q.type === type)?.value ?? "";
    const t = [get("hour").replace(/^0/, ""), get("minute"), get("dayPeriod").toUpperCase()];
    const x = clock.ctx;
    x.fillStyle = "#0b0b0c"; x.fillRect(0, 0, CW, 120);
    x.save(); x.translate((CW - 256) / 2, 0);
    x.textAlign = "center"; x.textBaseline = "middle";
    const card = (i, cx, w) => {
      if (t[i] !== shown[i]) { prev[i] = shown[i] || t[i]; shown[i] = t[i]; flipAt[i] = now; }
      const ch = shown[i], old = prev[i], p = reduced ? 1 : Math.min(1, (now - flipAt[i]) / 420), flipping = ch !== old && p < 1, mid = cx + w / 2;
      x.font = "600 76px Helvetica Neue,Arial,sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillStyle = "#151517"; x.fillRect(cx, 10, w, 100);
      x.fillStyle = "#f4f2ee";
      x.save(); x.beginPath(); x.rect(cx, 10, w, 49); x.clip(); x.fillText(ch, mid, 62); x.restore();
      x.save(); x.beginPath(); x.rect(cx, 61, w, 49); x.clip(); x.fillText(flipping && p < 0.5 ? old : ch, mid, 62); x.restore();
      if (flipping) {
        const k2 = Math.cos(p * Math.PI), top = k2 > 0;
        x.save(); x.translate(cx, 60); x.scale(1, Math.abs(k2)); x.fillStyle = "#1c1c1f"; x.fillRect(0, top ? -50 : 0, w, 50);
        x.beginPath(); x.rect(0, top ? -50 : 0, w, 50); x.clip(); x.fillStyle = "#f4f2ee"; x.fillText(top ? old : ch, w / 2, 2); x.restore();
      }
      x.fillStyle = "#050506"; x.fillRect(cx, 59, w, 2);
    };
    card(0, 8, 112); card(1, 136, 112);
    // AM/PM sits small in the hour card's bottom-left corner, like a real flip clock
    shown[2] = t[2];
    x.font = "700 15px Helvetica Neue,Arial,sans-serif"; x.textAlign = "left"; x.textBaseline = "alphabetic";
    x.fillStyle = "#f4f2ee"; x.fillText(shown[2], 16, 102);
    x.fillStyle = "#101012"; x.fillRect(120, 0, 16, 120);
    x.restore();
    clock.tex.needsUpdate = true;
  }
  // the mug is wherever the coffee is; steam rises from it in soft puffs that drift and fade
  const coffee = parts.body.filter((v) => v.c === "#4a2c17");
  const [mx, my, mz] = coffee.length ? centroid(coffee) : [41.4, 15.7, 11.4];
  const steam = [];
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); root.add(m); steam.push({ m, off: i / 5 }); }
  function drawSteam(now, reduced) {
    for (const s2 of steam) {
      const t = reduced ? 0.4 + s2.off * 0.3 : ((now / 2600 + s2.off) % 1);
      s2.m.position.set(mx + Math.sin(t * 6 + s2.off * 9) * 0.35, my + 0.7 + t * 3.2, mz + Math.cos(t * 5 + s2.off * 7) * 0.25);
      s2.m.material.opacity = (reduced ? 0.25 : Math.sin(t * Math.PI) * 0.45);
      s2.m.scale.setScalar(0.7 + t * 1.1);
    }
  }
  // ---------- motion ----------
  let frames = 0, lastDraw = 0, screen = null;
  // a blink every 3-7 s, the eyes shut for about 135 ms, now and then twice in a row
  const BLINK = 135;
  let blinks = [], nextBlink = 3000 + Math.random() * 4000;
  function blink(now) {
    if (!blinks.length && now >= nextBlink) {
      blinks = [[now, now + BLINK]];
      if (Math.random() < 0.2) blinks.push([now + BLINK + 110, now + 2 * BLINK + 110]);
      nextBlink = blinks[blinks.length - 1][1] + 3000 + Math.random() * 4000;
    }
    if (blinks.length && now > blinks[blinks.length - 1][1]) blinks = [];
    const shut = blinks.some(([a, b]) => now >= a && now < b);
    eyesOpen.visible = !shut; eyesShut.visible = shut;
  }
  function update(now, reduced) {
    // some software WebGL drivers keep a new canvas texture blank after the scene is built; swapping in
    // a fresh texture once, after the first frames, makes the screen show reliably
    if (++frames === 6) { const old = mon.mesh.material.map, t = screenTexture(THREE, mon.canvas); mon.mesh.material.map = t; mon.tex = t; mon.mesh.material.needsUpdate = true; old.dispose(); }
    if (!reduced) {
      // typing in bursts: each hand taps on its own rhythm; every few seconds the right hand reaches for the trackpad
      const burst = Math.sin(now / 1900) > -0.35, reach = (now / 1000) % 9 > 7.4;
      for (const f of forearms) {
        const tap = burst ? Math.max(0, Math.sin(now / (f.sx < 0 ? 83 : 97) + f.phase)) : 0;
        const toPad = reach && f.sx > 0;
        f.g.rotation.x += ((toPad ? 0.02 : -tap * 0.035) - f.g.rotation.x) * 0.35;
        f.g.rotation.y += ((toPad ? -0.22 : Math.sin(now / 700 + f.phase) * 0.025) - f.g.rotation.y) * 0.12;
      }
      head.position.x = Math.sin(now / 4200) * 0.18;
      blink(now);
    }
    if (now - lastDraw > 66) { lastDraw = now; paintTerminals(mon.ctx, reduced ? 6 : now / 1000, screen); mon.tex.needsUpdate = true; drawClock(now, reduced); }
    drawSteam(now, reduced);
  }
  // a thinned scatter of the voxels, without the ground shadow, for framing the scene in the viewport
  const framing = voxels.filter((_, i) => i % 5 === 0).map((vx) => new THREE.Vector3(...toScene(vx)));
  return { root, update, framing, setScreen: (s) => { screen = s && { ...s, changedAt: performance.now() }; lastDraw = 0; } };
}

function markPlane(THREE, width, colour, [px, py, pz]) {
  const [vx, vy, vw, vh] = MARK.regular.vb.split(" ").map(Number);
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = Math.round((512 * vh) / vw);
  const x = canvas.getContext("2d"), s = 512 / vw;
  x.setTransform(s, 0, 0, s, -vx * s, -vy * s); x.fillStyle = colour; x.fill(new Path2D(MARK.regular.d), "evenodd");
  const tex = new THREE.CanvasTexture(canvas); tex.encoding = THREE.sRGBEncoding;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, (width * vh) / vw), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  mesh.position.set(px, py, pz); mesh.rotation.y = Math.PI;
  return mesh;
}
// A screen's texture is filtered with mipmaps and anisotropy, so fine detail (a dither, small type) is
// averaged rather than sampled point by point and holds still while the camera moves.
function screenTexture(THREE, canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 16;
  return tex;
}
function canvasPlane(THREE, cw, ch, w, h) {
  const canvas = document.createElement("canvas"); canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d");
  const tex = screenTexture(THREE, canvas);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  return { canvas, ctx, tex, mesh };
}
