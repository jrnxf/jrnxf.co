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

// one InstancedMesh of the visible cells only: a cell buried on all six sides is skipped. Each voxel's
// colour moves by a small stable amount, so flat colours read as voxels in the light.
function voxMesh(THREE, cells, shadows, pivot = [0, 0, 0]) {
  const key = (a) => a.map((n) => Math.round(n / S)).join(",");
  const filled = new Set(cells.map((v) => key(v.at)));
  const shown = cells.filter(({ at: [x, y, z] }) => ![[S, 0, 0], [-S, 0, 0], [0, S, 0], [0, -S, 0], [0, 0, S], [0, 0, -S]].every(([a, b, c]) => filled.has(key([x + a, y + b, z + c]))));
  const n = shown.length;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(S, S, S), new THREE.MeshLambertMaterial({ color: 0xffffff }), n);
  const M = mesh.instanceMatrix.array, colors = new Float32Array(n * 3);
  shown.forEach(({ at, c }, q) => {
    const o = q * 16;
    M[o] = 1; M[o + 5] = 1; M[o + 10] = 1; M[o + 15] = 1;
    M[o + 12] = at[0] - pivot[0]; M[o + 13] = at[1] - pivot[1]; M[o + 14] = at[2] - pivot[2];
    const [i, j, l] = at.map((t) => Math.round(t / S));
    let h = Math.imul(i * 374761393 + j * 668265263 + l * 2147483647, 1274126177); h ^= h >>> 15;
    const f = 1 + (((h >>> 0) / 4294967296) - 0.5) * 0.06, nn = parseInt(c.slice(1), 16);
    colors[q * 3] = Math.min(1, (((nn >> 16) & 255) / 255) * f); colors[q * 3 + 1] = Math.min(1, (((nn >> 8) & 255) / 255) * f); colors[q * 3 + 2] = Math.min(1, ((nn & 255) / 255) * f);
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
  head.add(voxMesh(THREE, parts.head, shadows));
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
  const mon = canvasPlane(THREE, 640, 360, 18.2, 10.24); mon.mesh.position.set(31, 22.5, 5.8); root.add(mon.mesh);
  // the jrnxf mark on the back of the monitor, in a soft grey, read from behind
  root.add(markPlane(THREE, 7, "#8a8782", [31, 22.8, 4.44]));

  // lights: from over the viewer's shoulder, bright and even, so the figure reads in full
  root.add(new THREE.HemisphereLight("#ffe9d2", backdrop === "white" ? "#a08c78" : "#2a2624", 0.3));
  root.add(new THREE.AmbientLight("#ffe4c8", 0.05));
  const key = new THREE.DirectionalLight("#ffcf9e", 0.58);
  key.position.set(70, 52, 58); key.target.position.set(26, 0, 22); root.add(key, key.target);
  if (shadows) { key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const s = key.shadow.camera; s.left = -40; s.right = 40; s.top = 40; s.bottom = -40; s.near = 1; s.far = 160; key.shadow.bias = -0.0015; key.shadow.normalBias = 0.06; }

  // the flip clock's face: real Lisbon time, each card flips when its digits change
  const clock = canvasPlane(THREE, 256, 120, 4.6, 2.05); clock.mesh.position.set(43, 16.55, 8.02); root.add(clock.mesh);
  let shown = "", flipAt = 0, prev = "";
  function drawClock(now, reduced) {
    const t = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).replace(":", "");
    if (t !== shown) { prev = shown || t; shown = t; flipAt = now; }
    const x = clock.ctx, p = reduced ? 1 : Math.min(1, (now - flipAt) / 420);
    x.fillStyle = "#0b0b0c"; x.fillRect(0, 0, 256, 120);
    x.font = "600 76px Helvetica Neue,Arial,sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    const card = (i, cx) => {
      const ch = shown[i], old = prev[i], flipping = ch !== old && p < 1;
      x.fillStyle = "#151517"; x.fillRect(cx, 10, 56, 100);
      x.fillStyle = "#f4f2ee";
      x.save(); x.beginPath(); x.rect(cx, 10, 56, 49); x.clip(); x.fillText(ch, cx + 28, 62); x.restore();
      x.save(); x.beginPath(); x.rect(cx, 61, 56, 49); x.clip(); x.fillText(flipping && p < 0.5 ? old : ch, cx + 28, 62); x.restore();
      if (flipping) {
        const k2 = Math.cos(p * Math.PI), top = k2 > 0;
        x.save(); x.translate(cx, 60); x.scale(1, Math.abs(k2)); x.fillStyle = "#1c1c1f"; x.fillRect(0, top ? -50 : 0, 56, 50);
        x.beginPath(); x.rect(0, top ? -50 : 0, 56, 50); x.clip(); x.fillStyle = "#f4f2ee"; x.fillText(top ? old : ch, 28, 2); x.restore();
      }
      x.fillStyle = "#050506"; x.fillRect(cx, 59, 56, 2);
    };
    card(0, 4); card(1, 62); card(2, 138); card(3, 196);
    x.fillStyle = "#101012"; x.fillRect(120, 0, 16, 120);
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
  // click targets
  const hit = {};
  const target = (name, [x, y, z], [w, h, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x, y, z); m.userData.name = name; root.add(m); hit[name] = m; };
  target("mug", [mx + 0.2, my - 0.5, mz], [3.4, 2.8, 3]);
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xfb9890, transparent: true, opacity: 0.9 }));
  outline.visible = false; root.add(outline);

  // ---------- motion ----------
  let frames = 0, lastDraw = 0;
  function update(now, reduced) {
    // some software WebGL drivers keep a new canvas texture blank after the scene is built; swapping in
    // a fresh texture once, after the first frames, makes the screen show reliably
    if (++frames === 6) { const old = mon.mesh.material.map, t = new THREE.CanvasTexture(mon.canvas); t.encoding = THREE.sRGBEncoding; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; mon.mesh.material.map = t; mon.tex = t; mon.mesh.material.needsUpdate = true; old.dispose(); }
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
    }
    if (now - lastDraw > 66) { lastDraw = now; paintTerminals(mon.ctx, reduced ? 6 : now / 1000); mon.tex.needsUpdate = true; drawClock(now, reduced); }
    drawSteam(now, reduced);
  }
  function highlight(name) {
    if (!name) { outline.visible = false; return; }
    const m = hit[name]; outline.visible = true; outline.position.copy(m.position); outline.scale.copy(new THREE.Vector3(m.geometry.parameters.width + 0.6, m.geometry.parameters.height + 0.6, m.geometry.parameters.depth + 0.6));
  }
  return { root, hit, update, highlight };
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
function canvasPlane(THREE, cw, ch, w, h) {
  const canvas = document.createElement("canvas"); canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas); tex.encoding = THREE.sRGBEncoding; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  return { canvas, ctx, tex, mesh };
}
