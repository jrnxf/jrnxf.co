// A voxel room: a person at their desk by a window onto the sea, with terminals at work on the
// monitor. Written against three r128.

import { MARK } from "./mark.js";
import { paintTerminals } from "./terminals.js";

const LIGHTS = {
  golden: { sky: ["#3a3f73", "#f0a37c", "#ffd9a8"], sun: "#ffc98a", sunPos: [0.62, 0.62], sea: ["#a86a73", "#3a3456"], hemi: ["#ffe2c4", "#3a2e34", 0.36], key: ["#ffb070", 2.1], amb: 0.05, lamp: 0, night: 0 },
  day: { sky: ["#5c9fd6", "#bfe0f2", "#e8f4f8"], sun: "#fffbe8", sunPos: [0.7, 0.18], sea: ["#3d8fb0", "#13425e"], hemi: ["#e8f2ff", "#4a4440", 0.55], key: ["#fff4e0", 1.2], amb: 0.1, lamp: 0, night: 0 },
  night: { sky: ["#03050c", "#0d1530", "#1d2650"], sun: "#efeadf", sunPos: [0.3, 0.2], sea: ["#141c36", "#05080f"], hemi: ["#3a4a7a", "#141018", 0.25], key: ["#8aa0ff", 0.2], amb: 0.05, lamp: 1.6, night: 1 },
};
export function lightForHour(h) { return h >= 21 || h < 6.5 ? "night" : h >= 17 || h < 8.5 ? "golden" : "day"; }

// A voxel grid at `k` voxels per scene unit. Shapes are written in scene units, so the room
// keeps its size at every resolution and only gets finer; round things get rounder.
export function makeVox(k, [bx0, by0, bz0], [bx1, by1, bz1]) {
  const nx = Math.ceil((bx1 - bx0) * k), ny = Math.ceil((by1 - by0) * k), nz = Math.ceil((bz1 - bz0) * k);
  const data = new Uint32Array(nx * ny * nz);
  const idx = (i, j, l) => (i * ny + j) * nz + l;
  const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const shade = ([r, g, b], jit) => { const f = 1 + (Math.random() - 0.5) * jit * 2; const c = (v) => Math.max(0, Math.min(255, Math.round(v * f))); return 0x1000000 | (c(r) << 16) | (c(g) << 8) | c(b); };
  // a scene unit cell x spans [x - 0.5, x + 0.5]; fine cell i has its centre at (i + 0.5) / k - 0.5 + bx0
  const range = (a0, a1, o, n) => [Math.max(0, Math.round((a0 - o) * k)), Math.min(n, Math.round((a1 + 1 - o) * k))];
  const centre = (i, o) => (i + 0.5) / k - 0.5 + o;
  const api = {
    k,
    // fills the unit cells x0..x1 (inclusive), as the coarse room was drawn
    box(x0, y0, z0, x1, y1, z1, c, jit = 0.035) {
      const base = rgb(c), [i0, i1] = range(x0, x1, bx0, nx), [j0, j1] = range(y0, y1, by0, ny), [l0, l1] = range(z0, z1, bz0, nz);
      for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) for (let l = l0; l < l1; l++) data[idx(i, j, l)] = shade(base, jit);
    },
    del(x0, y0, z0, x1, y1, z1) {
      const [i0, i1] = range(x0, x1, bx0, nx), [j0, j1] = range(y0, y1, by0, ny), [l0, l1] = range(z0, z1, bz0, nz);
      for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) for (let l = l0; l < l1; l++) data[idx(i, j, l)] = 0;
    },
    // fills every fine cell whose centre passes `fn(x, y, z)`, inside a unit-cell bounding box; fn may return a colour
    fill(x0, y0, z0, x1, y1, z1, fn, c, jit = 0.035) {
      const base = c && rgb(c), [i0, i1] = range(x0, x1, bx0, nx), [j0, j1] = range(y0, y1, by0, ny), [l0, l1] = range(z0, z1, bz0, nz);
      for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) for (let l = l0; l < l1; l++) {
        const r = fn(centre(i, bx0), centre(j, by0), centre(l, bz0));
        if (r) data[idx(i, j, l)] = shade(typeof r === "string" ? rgb(r) : base, jit);
      }
    },
    // one InstancedMesh of the visible cells only: a cell buried on all six sides is skipped
    mesh(THREE, shadows) {
      const filled = (i, j, l) => i >= 0 && j >= 0 && l >= 0 && i < nx && j < ny && l < nz && data[idx(i, j, l)] !== 0;
      const out = [];
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let l = 0; l < nz; l++) {
        const v = data[idx(i, j, l)]; if (!v) continue;
        if (filled(i + 1, j, l) && filled(i - 1, j, l) && filled(i, j + 1, l) && filled(i, j - 1, l) && filled(i, j, l + 1) && filled(i, j, l - 1)) continue;
        out.push(i, j, l, v);
      }
      const n = out.length / 4, s = 1 / k;
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshLambertMaterial({ color: 0xffffff }), n);
      const M = mesh.instanceMatrix.array, colors = new Float32Array(n * 3);
      for (let q = 0; q < n; q++) {
        const o = q * 16, i = out[q * 4], j = out[q * 4 + 1], l = out[q * 4 + 2], v = out[q * 4 + 3];
        M[o] = 1; M[o + 5] = 1; M[o + 10] = 1; M[o + 15] = 1;
        M[o + 12] = centre(i, bx0); M[o + 13] = centre(j, by0); M[o + 14] = centre(l, bz0);
        colors[q * 3] = ((v >> 16) & 255) / 255; colors[q * 3 + 1] = ((v >> 8) & 255) / 255; colors[q * 3 + 2] = (v & 255) / 255;
      }
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = shadows; mesh.receiveShadow = shadows;
      return mesh;
    },
  };
  return api;
}
// distance from point p to the segment a-b, all [x, y, z]
export function segDist(p, a, b) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2)));
  return Math.hypot(ap[0] - ab[0] * t, ap[1] - ab[1] * t, ap[2] - ab[2] * t);
}

export const HEAD_COLORS = { skin: "#c98f68", skinShade: "#b67b58", stubble: "#84603f", hair: "#3a2a1f", hairHi: "#4a3627", cap: "#3d3936", capShade: "#34302d" };

// The face, as numbers. The defaults are face 11, Strong Brow, which the captain chose in round 21; the face lab varies them.
export const FACE = {
  rx: 2.36, ryTop: 2.95, ryLow: 3.3, rz: 2.62, // half-width, half-height above and below the centre, half-depth
  jawStart: 0.6, jawTaper: 0.1, // where the jaw starts to narrow below the centre, and how fast
  square: 0.7, // how much squarer the lower front of the face is than the skull
  front: 0.93, // below 1, the front of the face is flatter than the back of the skull
  cheek: 0, // extra width at the cheekbones
  capLift: 0.45, // raises the cap's band off the forehead
  // the features are counted in voxels at the 2.5x density, and scale with the density
  eyeY: 25.0, eye: "#2c5a8c", // the height of the eyes' bottom row; a deep blue
  eyeW: 2, eyeH: 1, eyeIn: 1, // columns wide, rows tall, and empty columns between each eye and the nose column
  browGap: 0, browH: 1, browIn: 1, browOut: 1, browDroop: 0, browRidge: 1, // rows above the eyes, rows tall, columns past the eye inside and out, rows the outer end drops, voxels it stands proud
  noseDrop: 0, noseLen: 3, noseW: 0, noseOut: 2, // rows below the eyes it starts, rows long, extra columns each side, voxels proud at the tip
  mouthGap: 1, mouthW: 1, // rows below the nose, columns each side of the middle
};

// head: a rounded skull, ears that stand out a little, short stubble along the jaw, blue eyes, hair and a cap
export function headVoxels(Hd, C, cap = "back") {
  const f = FACE;
  const cx = 24.5 + (Math.round(6.5 * Hd.k - 0.5) + 0.5) / Hd.k;
  const k = Hd.k, n = (v) => Math.round((v * k) / 2.5), n1 = (v) => Math.max(1, n(v));
  const y0 = 18 - 0.5 + 0.5 / k, rowOf = (y) => Math.round((y - y0) * k), yOf = (r) => y0 + r / k;
  const eyeB = rowOf(f.eyeY), eyeT = eyeB + n1(f.eyeH) - 1, g = n(f.eyeIn), w = n1(f.eyeW);
  const browB = eyeT + 1 + n(f.browGap), browT = browB + n1(f.browH) - 1;
  const noseT = eyeB - 1 - n(f.noseDrop), noseB = noseT - n1(f.noseLen) + 1, mouthR = noseB - 1 - n(f.mouthGap);
  const mouthY = yOf(mouthR), mouthHalf = (n(f.mouthW) + 0.5) / k;
  const hc = [cx, 25.0, 23.4], hp = 2.6, band = 25.7 + f.capLift;
  const shapeRound = (dx, dy, dz) => {
    const ry = dy < 0 ? f.ryLow : f.ryTop;
    const jaw = dy < -f.jawStart ? 1 + (-dy - f.jawStart) * f.jawTaper : 1;
    const cheek = 1 + f.cheek * Math.exp(-(((dy + 0.35) / 0.75) ** 2));
    const q = dy < 0 && dz < 0 ? hp + Math.min(1, -dy / 1.6) * Math.min(1, -dz / 1.2) * f.square : hp;
    return ((Math.abs(dx) * jaw / (f.rx * cheek)) ** q + (Math.abs(dy) / ry) ** q + (Math.abs(dz) * (dy < -0.6 ? 1 + (-dy - 0.6) * 0.04 : 1) / f.rz) ** q) ** (1 / q);
  };
  // in profile the front of the face is flatter than the back of the skull
  const shape = (dx, dy, dz) => (dz < 0 ? shapeRound(dx, dy, dz * f.front) : shapeRound(dx, dy, dz * 1.03));
  const eHead = (x, y, z) => shape(x - hc[0], y - hc[1], z - hc[2]);
  Hd.fill(29, 20, 22, 33, 23, 25, (x, y, z) => Math.hypot(x - cx, z - 24.1) < 1.25, C.skin, 0.02);
  Hd.fill(28, 20, 20, 34, 29, 27, (x, y, z) => {
    if (eHead(x, y, z) >= 1) return null;
    const back = Math.min(1, Math.max(0, (z - 21.2) / 2.4)), top = mouthY + 0.25 + back ** 0.8 * (24.35 - mouthY - 0.25);
    const jaw = z < 24.1 && y < top && !(Math.abs(x - cx) < mouthHalf + 0.05 && y > mouthY - 0.25);
    // under the cap, the back and sides of the skull are hair, so no skin shows between the band and the hair
    if (y < band + 0.2 && ((z >= 24.15 && y > 22.8) || (Math.abs(x - cx) > 1.6 && ((z >= 22.5 && y > 24.4) || (z >= 21.8 && y > 25.5))))) return Math.sin(Math.atan2(x - cx, z - 23.4) * 7 + y * 1.3) > 0.45 ? C.hairHi : C.hair;
    return jaw ? (((x * 7 + y * 13 + z * 5) | 0) % 4 ? C.stubble : C.skinShade) : C.skin;
  }, C.skin, 0.02);
  const near = (x, y, z, c, r) => ((x - c[0]) / r[0]) ** 2 + ((y - c[1]) / r[1]) ** 2 + ((z - c[2]) / r[2]) ** 2 < 1;
  // the features sit on the face's surface, wherever the face shape puts it, placed voxel by voxel around the nose column
  const fz = new Map();
  const frontZ = (x, y) => { const key = x + "," + y; if (!fz.has(key)) { let z = 99; for (let t = 19; t < 23.4; t += 0.02) if (eHead(x, y, t) < 1) { z = t; break; } fz.set(key, z); } return fz.get(key); };
  Hd.fill(28, 21, 19, 34, 27, 23, (x, y, z) => {
    const c = 1 / k, d = z - frontZ(x, y), ac = Math.abs(Math.round((x - cx) * k)), row = rowOf(y);
    // the nose stands out of the face, furthest at its tip
    if (ac <= n(f.noseW) && row <= noseT && row >= noseB) { const out = Math.max(1, Math.round((n1(f.noseOut) * (noseT - row + 1)) / (noseT - noseB + 1))); if (d >= -out * c - 1e-6 && d < c) return C.skinShade; }
    if (ac > g - n(f.browIn) && ac <= g + w + n(f.browOut)) { const drop = ac > g + w ? n(f.browDroop) : 0; if (row >= browB - drop && row <= browT - drop && d >= -n(f.browRidge) * c - 1e-6 && d < c) return C.hairHi; }
    if (d < 0 || d >= c) return null;
    if (ac > g && ac <= g + w && row >= eyeB && row <= eyeT) return f.eye;
    if (row === mouthR && ac <= n(f.mouthW)) return "#8a5444";
    return null;
  }, C.skin, 0.02);
  for (const sx of [-1, 1]) Hd.fill(27, 23, 22, 35, 27, 25, (x, y, z) => (((x - (cx + sx * 2.45)) / 0.42) ** 2 + ((y - 25) / 0.95) ** 2 + ((z - 23.7) / 0.62) ** 2 < 1 ? C.skinShade : null), C.skinShade, 0.02);
  // flowing hair, growing out: it comes out from under the cap all round the sides, frames the ears (above,
  // behind and below them, never in front), falls past the nape to the shoulders and lifts away in waves
  Hd.fill(26, 19, 20, 36, 28, 30, (x, y, z) => {
    if (y > band + 0.15) return null;
    const side = Math.abs(x - cx) > 1.6;
    if (z < (side ? 22.5 : 24.15)) return null;
    if (((Math.abs(x - cx) - 2.45) / 0.46) ** 2 + ((y - 24.8) / 0.85) ** 2 + ((z - 23.55) / 0.55) ** 2 < 1) return null;
    if (y < band - 0.25 && z < 23.4) return null;
    if (z < 22.6) return null;
    const yc = Math.max(y, 23.4), e = shape(x - cx, yc - hc[1], z - hc[2]);
    const drop = Math.max(0, 26.0 - y), ang = Math.atan2(x - cx, z - 23.4);
    const wave = 0.18 * Math.sin(y * 2.2 + ang * 5) + 0.1 * Math.sin(ang * 13 + y * 0.7);
    const outer = 1.1 + drop * 0.05 + wave * 0.4;
    if (e < 0.97 || e > outer) return null;
    const hem = (z < 24.3 ? 22.6 : 21.4) + 0.3 * Math.sin(ang * 4.3 + 1.1) + Math.abs(x - cx) * 0.1;
    if (y < hem) return null;
    return Math.sin(ang * 7 + y * 1.3) > 0.45 ? C.hairHi : C.hair;
  }, C.hair, 0.04);
  // a cap: a dome that hugs the head, with the brim over the nape (worn backwards) or over the eyes
  Hd.fill(27, 25, 20, 35, 30, 27, (x, y, z) => {
    if (y < band) return null;
    const e = (Math.abs((x - cx) / (f.rx + 0.32)) ** hp + Math.abs((y - 25) / (f.ryTop + 0.22)) ** hp + Math.abs((z - 23.4) / 2.96) ** hp) ** (1 / hp); if (e > 1) return null;
    const ang = Math.atan2(z - 23.4, x - cx), seam = e > 0.9 && Math.abs(((ang / (Math.PI / 3)) % 1 + 1) % 1 - 0.5) > 0.47;
    return seam ? C.capShade : C.cap;
  }, C.cap, 0.02);
  Hd.fill(28, 23, 18, 34, 28, 29, (x, y, z) => {
    const dz = cap === "front" ? 20.95 - z : z - 25.85; if (dz < 0 || dz > 2.5) return null;
    const half = 2.0 * Math.sqrt(Math.max(0, 1 - (dz / 2.55) ** 2)); if (Math.abs(x - cx) > half) return null;
    const by = 26.0 + f.capLift - dz * 0.2 - 0.95 * ((x - cx) / 2.0) ** 2;
    return Math.abs(y - by) < 0.19 ? C.capShade : null;
  }, C.cap, 0.02);
}

export function buildDesk(THREE, { light = "golden", shadows = true, res = 2.5, backdrop = null, cap = "back" } = {}) {
  const C = { wall: "#e9e1d3", floor: "#b98a5e", floor2: "#a97a50", desk: "#2a1a10", legs: "#161618", metal: "#2b2b2e", alu: "#c9c9cc", ...HEAD_COLORS, shirt: "#fffefc", shirtRib: "#f4f2ee", sweater: "#ad7646", sweaterRib: "#99653a", pants: "#c9b38a", pantsCuff: "#d8c49e", cork: "#c49a68", strap: "#4a3326", sock: "#f4f2ec", shoe: "#1d1d20", chairFrame: "#26262a", mesh: "#3c3c41", mesh2: "#2a2a2f", plant: "#4f8a4a", pot: "#d9cbb4", mug: "#f3ecdf", tire: "#1b1b1d", rim: "#c9c9cc", uni: "#fb9890", frame: "#f3ecdf" };
  const root = new THREE.Group();
  const k = Math.max(1, Math.min(4, Math.round(res * 2) / 2));
  const V = makeVox(k, [1, -4, -1], [62, 36, 41]);
  const { box, del, fill } = V;
  // the room spans x 2 to 60, centred on the desk at x 31
  const X0 = 2, X1 = 60, D = 40, H = 34;
  // room: floor planks and a back wall with a window; no side wall, so the room stays open on the left
  if (!backdrop) for (let z = 0; z < D; z++) box(X0, 0, z, X1, 0, z, Math.floor(z / 4) % 2 ? C.floor : C.floor2, 0.05);
  // the back wall is a separate mesh, hidden when the camera is behind it, so the room orbits 360°
  const BW = makeVox(k, [1, 0, -1], [62, 36, 4]);
  BW.box(X0, 1, 0, X1, H, 0, C.wall, 0.02);
  // the window, framed, with a mullion
  const wx0 = 19, wx1 = 43, wy0 = 15, wy1 = 30;
  BW.del(wx0, wy0, 0, wx1, wy1, 0);
  BW.box(wx0 - 1, wy0 - 1, 0, wx1 + 1, wy0 - 1, 1, C.frame, 0.01); BW.box(wx0 - 1, wy1 + 1, 0, wx1 + 1, wy1 + 1, 1, C.frame, 0.01);
  BW.box(wx0 - 1, wy0, 0, wx0 - 1, wy1, 1, C.frame, 0.01); BW.box(wx1 + 1, wy0, 0, wx1 + 1, wy1, 1, C.frame, 0.01);
  BW.box(31, wy0, 0, 31, wy1, 0, C.frame, 0.01); BW.box(wx0, 23, 0, wx1, 23, 0, C.frame, 0.01);
  BW.box(wx0 - 2, wy0 - 2, 1, wx1 + 2, wy0 - 2, 3, C.frame, 0.01); // sill
  // a standing desk: a dark walnut top in planks on two slim black legs, each centred on a slim foot that runs front to back
  for (let x = 14; x <= 48; x += 5) box(x, 13, 2, Math.min(48, x + 4), 13, 15, C.desk, 0.04);
  const legZ = 8.5;
  for (const lx of [17, 45]) {
    fill(lx - 1, 2, 7, lx + 1, 11, 10, (x, y, z) => Math.abs(x - lx) < 0.7 && Math.abs(z - legZ) < 0.7, C.legs, 0.01);
    fill(lx - 1, 12, 4, lx + 1, 12, 13, (x, y, z) => Math.abs(x - lx) < 0.7 && Math.abs(z - legZ) < 4.6 && y > 11.8, C.legs, 0.01);
    fill(lx - 1, 1, 3, lx + 1, 1, 14, (x, y, z) => Math.abs(x - lx) < 0.7 && Math.abs(z - legZ) < 5.2, C.legs, 0.01);
  }
  fill(18, 10, 8, 44, 11, 9, (x, y, z) => Math.abs(z - legZ) < 0.35 && Math.abs(y - 11) < 0.35, C.legs, 0.01);
  // one monitor, centred on a stand
  box(29, 14, 6, 33, 14, 9, C.legs, 0.01); box(31, 15, 6, 31, 17, 6, C.legs, 0.01); box(22, 17, 5, 40, 28, 5, C.legs, 0.01);
  // a keyboard and a mouse within reach
  fill(25, 14, 11, 37, 14, 14, (x, y, z) => (Math.abs(x - 31) < 5.3 && z > 11.2 && z < 13.6 ? (((x * 2 + 100) | 0) % 2 && ((z * 2 + 100) | 0) % 2 && z > 11.5 && z < 13.3 && Math.abs(x - 31) < 5 ? "#c9c6bf" : "#e2dfd8") : null), "#e2dfd8", 0.01);
  fill(37, 14, 11, 40, 14, 14, (x, y, z) => (((x - 38.6) / 0.62) ** 2 + ((z - 12.5) / 0.95) ** 2 < 1 ? "#e2dfd8" : null), "#e2dfd8", 0.01);
  // a smaller mug, closer to the keyboard; steam rises from it
  const mugC = [41.4, 11.4];
  fill(40, 14, 9, 44, 16, 13, (x, y, z) => { const r = Math.hypot(x - mugC[0], z - mugC[1]); return r < 1.05 && y < 16.3 && !(r < 0.72 && y > 15.7) ? C.mug : null; }, C.mug, 0.02);
  fill(40, 15.7, 10, 43, 15.7, 12, (x, y, z) => Math.hypot(x - mugC[0], z - mugC[1]) < 0.72, "#4a2c17", 0);
  fill(42, 14, 10, 44, 16, 12, (x, y, z) => Math.abs(Math.hypot(x - (mugC[0] + 1.05), y - 15.15) - 0.5) < 0.2 && Math.abs(z - mugC[1]) < 0.22 && x > mugC[0] + 1.0, C.mug, 0.02);
  // a working flip clock to the right of the monitor (its face is a canvas, drawn below)
  fill(40, 14, 5, 46, 14, 9, (x, y, z) => (Math.abs(x - 43) < 2.4 && Math.abs(z - 7) < 1.2 && y < 13.5 + 0.8 ? "#38220f" : null), "#38220f", 0.03);
  fill(40, 14, 5, 46, 18, 9, (x, y, z) => { const r = Math.hypot(y - 16.55, z - 7.0); if (Math.abs(x - 43) < 0.3 && y > 13.5 + 0.8 && y < 18.0 && z > 6.1 && z < 7.7) return "#101012"; return Math.abs(x - 43) < 2.3 && Math.abs(x - 43) > 0.32 && r < 1.05 && z < 7.75 ? (r > 0.92 ? "#0b0b0c" : "#151517") : null; }, "#151517", 0.01);
  // a bonsai: a shallow glazed pot, a twisting trunk and flat cloud pads of leaves
  fill(15, 14, 4, 21, 15, 9, (x, y, z) => (Math.abs(x - 18) < 2.5 - (y > 14.6 ? 0 : 0.15) && Math.abs(z - 6.5) < 1.6 ? (y > 14.7 && Math.abs(x - 18) < 2.2 && Math.abs(z - 6.5) < 1.3 ? "#5b4636" : "#2f4a5a") : null), "#2f4a5a", 0.02);
  const trunk = [[18, 15, 6.5], [17.4, 16.6, 6.2], [18.3, 18.0, 6.6], [19.3, 19.1, 6.3], [18.6, 20.2, 6.0]];
  fill(15, 15, 4, 21, 21, 9, (x, y, z) => { for (let i = 0; i < trunk.length - 1; i++) if (segDist([x, y, z], trunk[i], trunk[i + 1]) < 0.42 - i * 0.05) return "#5a4030"; return null; }, "#5a4030", 0.04);
  for (const [cx, cy, cz, rx] of [[16.4, 18.3, 6.4, 1.3], [19.8, 19.4, 6.6, 1.3], [18.4, 21.0, 6.1, 1.6], [17.6, 17.1, 7.2, 0.9]]) fill(14, 16, 4, 22, 22, 9, (x, y, z) => (((x - cx) / rx) ** 2 + ((y - cy) / 0.6) ** 2 + ((z - cz) / (rx * 0.85)) ** 2 < 1 + Math.sin(x * 5.1 + z * 4.3) * 0.15 ? (y > cy + 0.15 ? "#4b7a3a" : "#365c2c") : null), "#4f8a4a", 0.08);
  // no lamp
  // the person sits closer to the desk; the chair moves with them, in a grid of its own
  const NEAR = 2.4, CH = makeVox(k, [24, -1, 15], [39, 22, 32]);
  // an Aeron-style chair: a curved mesh back with a gap above the seat, arms, a gas lift and a five-leg base on casters
  const chairMesh = (x, y) => ((Math.floor(x * 2) + Math.floor(y * 2)) % 2 ? C.mesh : C.mesh2);
  CH.fill(27, 8, 19, 35, 9, 26, (x, y, z) => (Math.abs(x - 31) < 3.4 - Math.max(0, z - 24) * 0.3 ? (y > 8.6 ? chairMesh(x, z) : C.chairFrame) : null), C.mesh, 0.02);
  CH.fill(26, 12, 25, 36, 17, 30, (x, y, z) => {
    const w = 3.9 - Math.max(0, y - 15.5) * 0.35 - Math.max(0, 13 - y) * 0.4, zc = 27.6 - ((x - 31) ** 2) / 11 + (y - 12) * 0.1;
    if (Math.abs(x - 31) > w || Math.abs(z - zc) > 0.45) return null;
    return Math.abs(x - 31) > w - 0.5 || y > 16.6 || y < 12.4 ? C.chairFrame : chairMesh(x, y);
  }, C.mesh, 0.02);
  CH.fill(30, 9, 26, 32, 13, 28, (x, y, z) => segDist([x, y, z], [31, 9.4, 25.8], [31, 12.6, 27.4]) < 0.5, C.chairFrame, 0.01);
  for (const ax of [27, 35]) { CH.fill(ax - 1, 9, 21, ax + 1, 13, 25, (x, y, z) => segDist([x, y, z], [ax, 9.5, 24], [ax, 12.4, 23]) < 0.45 || (Math.abs(y - 12.8) < 0.4 && Math.abs(x - ax) < 0.6 && z > 20.5 && z < 24.5), C.chairFrame, 0.01); }
  CH.fill(30, 2, 22, 32, 8, 24, (x, y, z) => Math.hypot(x - 31, z - 23) < (y > 5 ? 0.45 : 0.65), C.metal, 0.01);
  for (let n = 0; n < 5; n++) {
    const a = -Math.PI / 2 + (n * 2 * Math.PI) / 5, ex = 31 + Math.cos(a) * 5, ez = 23 + Math.sin(a) * 5;
    CH.fill(25, 1, 17, 37, 3, 29, (x, y, z) => segDist([x, y, z], [31, 2, 23], [ex, 1.5, ez]) < 0.5, C.chairFrame, 0.01);
    CH.fill(Math.floor(ex) - 1, 0, Math.floor(ez) - 1, Math.ceil(ex) + 1, 1, Math.ceil(ez) + 1, (x, y, z) => Math.hypot(x - ex, y - 0.9, z - ez) < 0.6, "#111113", 0);
  }
  const roomMesh = V.mesh(THREE, shadows), backWall = new THREE.Group();
  backWall.add(BW.mesh(THREE, shadows));
  root.add(roomMesh, backWall);
  // a void: no floor or walls, only a soft shadow on an invisible floor to stand the desk on
  if (backdrop) {
    backWall.visible = false;
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.ShadowMaterial({ opacity: backdrop === "white" ? 0.14 : 0.5 }));
    catcher.rotation.x = -Math.PI / 2; catcher.position.set(31, 0.5, 14); catcher.receiveShadow = shadows; root.add(catcher);
  }
  const chairVox = CH.mesh(THREE, shadows); chairVox.position.z = -NEAR; root.add(chairVox);

  // the person, in their own groups so they can move
  const person = new THREE.Group(), arms = new THREE.Group(), head = new THREE.Group();
  const P = makeVox(k, [24, -1, 12], [39, 24, 30]), A = makeVox(k, [24, 11, 10], [39, 21, 26]), Hd = makeVox(k, [25, 18, 18], [38, 31, 31]);
  const ell = (q, c, r) => ((q[0] - c[0]) / r[0]) ** 2 + ((q[1] - c[1]) / r[1]) ** 2 + ((q[2] - c[2]) / r[2]) ** 2;
  // torso in the sweater: rounded, a waist, a chest and sloped shoulders, leaning a little toward the desk
  P.fill(26, 11, 20, 36, 21, 27, (x, y, z) => {
    if (y < 11.6 || y > 20.7) return null;
    const t = (y - 11.6) / 9.1, cz = 23.7 - t * 0.35;
    const wx = 2.75 + 0.55 * Math.sin(Math.min(1, t * 1.25) * Math.PI / 2) + 0.55 * Math.max(0, t - 0.7) / 0.3 - 1.5 * Math.max(0, t - 0.9) ** 2 / 0.01 * 0.1;
    const wz = 1.95 + 0.3 * Math.sin(t * Math.PI * 0.8);
    // the chest is shallower in front than the back is behind, so the profile stays flat
    const v = (Math.abs(x - 31) / (wx + 0.3)) ** 2.5 + (Math.abs(z - cz) / (z < cz ? wz * 0.8 - 0.4 * Math.min(1, Math.max(0, (t - 0.5) / 0.25)) : wz)) ** 2.5;
    if (v > 1 + 0.07 * Math.sin(y * 3.1 + x * 1.7) * (1 - t)) return null;
    const shoulder = Math.max(0, Math.abs(x - 31) - 1.4) * 0.42; if (y > 20.7 - shoulder) return null;
    return y < 12.3 ? C.shirtRib : C.shirt;
  }, C.shirt, 0.025);
  for (const sx of [-1, 1]) P.fill(27, 17, 20, 36, 21, 26, (x, y, z) => (ell([x, y, z], [31 + sx * 3.35, 19.1, 22.95], [1.3, 1.25, 1.35]) < 1 ? C.shirt : null), C.shirt, 0.025);
  P.fill(29, 19, 22, 33, 23, 26, (x, y, z) => { const r = Math.hypot(x - 31, z - 23.9); return y > 20.1 && y < 20.7 && r < 1.35 ? C.shirtRib : y >= 20.7 && r < 1.0 ? C.skin : null; }, C.skin, 0.02);
  // khaki trousers: hips, thighs along the seat, shins down, the hems rolled above the ankles
  P.fill(27, 9, 21, 35, 13, 26, (x, y, z) => (ell([x, y, z], [31, 11.3, 23.7], [3.0, 1.35, 2.0]) < 1 ? C.pants : null), C.pants, 0.025);
  for (const sx of [-1, 1]) {
    const hip = [31 + sx * 1.5, 10.9, 23.2], knee = [31 + sx * 1.75, 10.6, 17.7], ankle = [31 + sx * 1.75, 2.0, 18.3];
    P.fill(27, 0, 15, 35, 13, 25, (x, y, z) => {
      const q = [x, y, z];
      if (segDist(q, hip, knee) < 1.05 - (23.2 - z) * 0.02) return C.pants;
      const s = segDist(q, knee, ankle), along = (knee[1] - y) / (knee[1] - ankle[1]);
      if (y > 3.6 && s < 0.98 - along * 0.15) return C.pants;
      if (y > 2.9 && y <= 3.6 && s < 1.0) return C.pantsCuff;
      if (y > 1.0 && y <= 2.9 && s < 0.5) return C.skin;
      return null;
    }, C.pants, 0.025);
    // white sneakers: a rubber sole with a grey stripe, a rounded toe box, a heel collar and laces
    const fx = 31 + sx * 1.75, heelZ = 18.75, toeZ = 15.0;
    const footW = (z) => 0.58 + 0.16 * Math.sin(Math.min(1, Math.max(0, (heelZ - z) / (heelZ - toeZ))) * Math.PI * 0.85);
    P.fill(27, 0, 14, 35, 3, 20, (x, y, z) => {
      const dx = Math.abs(x - fx);
      if (z < toeZ - 0.15 || z > heelZ + 0.15 || dx > footW(z) + 0.06) return null;
      if (y < 0.45) return y < 0.18 ? "#cfcac1" : "#f6f4f0";
      const t = (heelZ - z) / (heelZ - toeZ), hgt = 0.5 + 0.95 * Math.min(1, (1 - t) * 1.6) - (t > 0.82 ? (t - 0.82) * 1.6 : 0);
      if (y > 0.45 + hgt || dx > footW(z)) return null;
      if (Math.abs(y - 0.55) < 0.1) return "#bdb8ae";
      if (t > 0.2 && t < 0.62 && dx < 0.24 && y > 0.45 + hgt - 0.22) return Math.sin(z * 14) > 0 ? "#e6e2da" : "#f8f7f4";
      return "#f2f0ec";
    }, "#f2f0ec", 0.015);
  }
  // arms in the sweater: upper arms hang close to the body, forearms rest toward the MacBook; each forearm
  // and hand is its own group pivoting at the elbow, so the hands can type and reach for the trackpad
  const forearms = [];
  for (const sx of [-1, 1]) {
    const sh = [31 + sx * 3.45, 18.8, 22.9], el = [31 + sx * 3.75, 15.5, 20.0], wr = [31 + sx * 2.7, 15.0, 14.4 + 2.4], hand = [31 + sx * 2.25, 14.8, 12.9 + 2.4];
    A.fill(26, 13, 18, 36, 20, 25, (x, y, z) => { const q = [x, y, z], d = segDist(q, sh, el); if (d < 1.0 && ((q[1] - el[1]) / (sh[1] - el[1])) > 0.42) return C.shirt; return d < 0.72 ? C.skin : null; }, C.shirt, 0.025);
    const F = makeVox(k, [25, 13, 9], [38, 17, 23]);
    F.fill(26, 13, 10, 37, 17, 22, (x, y, z) => {
      const q = [x, y, z], d = segDist(q, el, wr);
      if (d < 0.72 - Math.max(0, 20.6 - z) * 0.02) return C.skin;
      if (ell(q, hand, [0.62, 0.3, 0.95]) < 1) return C.skin;
      if (segDist(q, wr, hand) < 0.42) return C.skin;
      const fing = [hand[0] - 0.42, hand[0] - 0.14, hand[0] + 0.14, hand[0] + 0.42];
      for (const fxx of fing) if (segDist(q, [fxx, hand[1], hand[2] - 0.6], [fxx, hand[1] - 0.25, hand[2] - 1.35]) < 0.13) return C.skinShade;
      return null;
    }, C.skin, 0.02);
    const g = new THREE.Group(); g.position.set(...el); const m = F.mesh(THREE, shadows); m.position.set(-el[0], -el[1], -el[2]); g.add(m);
    forearms.push({ g, sx, phase: Math.random() * 6 });
  }
  headVoxels(Hd, C, cap);
  person.add(P.mesh(THREE, shadows)); arms.add(A.mesh(THREE, shadows)); head.add(Hd.mesh(THREE, shadows));
  head.position.y = -0.3; head.position.z = -0.35;
  person.position.z = -NEAR;
  person.add(arms, head); forearms.forEach((f) => person.add(f.g)); root.add(person);

  // screens: canvases drawn every frame or so
  const mon = canvasPlane(THREE, 640, 360, 18.2, 10.24); mon.mesh.position.set(31, 22.5, 5.8); root.add(mon.mesh);
  // the jrnxf mark on the back of the monitor, in a soft grey, read from behind
  root.add(markPlane(THREE, 7, "#8a8782", [31, 22.8, 4.44]));
  // the view out of the window
  const view = canvasPlane(THREE, 512, 288, 30, 17); view.mesh.position.set(31, 22.5, -0.62); backWall.add(view.mesh);

  // golden hour: a soft beam from the window, and the warm patch it leaves on the floor
  const beamTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const x = c.getContext("2d"); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "rgba(255,200,130,.9)"); g.addColorStop(1, "rgba(255,200,130,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 256); const t = new THREE.CanvasTexture(c); return t; })();
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(24, 30), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  beam.position.set(31, 14, 13); beam.rotation.x = -0.62; beam.visible = false;
  const patchTex = (() => { const c = document.createElement("canvas"); c.width = 128; c.height = 128; const x = c.getContext("2d"); const g = x.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, "rgba(255,190,120,.85)"); g.addColorStop(1, "rgba(255,190,120,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), new THREE.MeshBasicMaterial({ map: patchTex, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  patch.rotation.x = -Math.PI / 2; patch.position.set(32, 2.05, 28); root.add(patch);
  // lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7); root.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.2); root.add(amb);
  const key = new THREE.DirectionalLight(0xffffff, 1);
  key.position.set(36, 46, -40); key.target.position.set(26, 0, 22); root.add(key, key.target);
  if (shadows) { key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const s = key.shadow.camera; s.left = -40; s.right = 40; s.top = 40; s.bottom = -40; s.near = 1; s.far = 160; key.shadow.bias = -0.0015; key.shadow.normalBias = 0.06; }
  const lamp = new THREE.PointLight(0xffb36b, 0, 40, 1.6); lamp.position.set(31, 23, 10); root.add(lamp);
  const glow = new THREE.PointLight(0x9fc4ff, 0, 26, 2); glow.position.set(30, 21, 12); root.add(glow);

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
  // steam: soft puffs that rise from the mug, drift and fade
  const steam = [];
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); root.add(m); steam.push({ m, off: i / 5 }); }
  function drawSteam(now, reduced) {
    for (const s2 of steam) {
      const t = reduced ? 0.4 + s2.off * 0.3 : ((now / 2600 + s2.off) % 1);
      s2.m.position.set(mugC[0] + Math.sin(t * 6 + s2.off * 9) * 0.35, 16.4 + t * 3.2, mugC[1] + Math.cos(t * 5 + s2.off * 7) * 0.25);
      s2.m.material.opacity = (reduced ? 0.25 : Math.sin(t * Math.PI) * 0.45);
      s2.m.scale.setScalar(0.7 + t * 1.1);
    }
  }
  // click targets
  const hit = {};
  const target = (name, x0, y0, z0, x1, y1, z1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1), new THREE.MeshBasicMaterial({ visible: false })); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.userData.name = name; root.add(m); hit[name] = m; };
  target("mug", 40, 13, 10, 43, 17, 13); if (!backdrop) target("window", wx0, wy0, -1, wx1, wy1, 1);
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xfb9890, transparent: true, opacity: 0.9 }));
  outline.visible = false; root.add(outline);

  // ---------- the view, and the light ----------
  let L = LIGHTS[light];
  function drawView(now, reduced) {
    const x = view.ctx, w = 512, h = 288, hz = h * 0.62;
    const g = x.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, L.sky[0]); g.addColorStop(0.75, L.sky[1]); g.addColorStop(1, L.sky[2]);
    x.fillStyle = g; x.fillRect(0, 0, w, hz);
    if (L.night) { x.fillStyle = "#fff"; for (let i = 0; i < 40; i++) x.fillRect((i * 97) % w, (i * 53) % (hz * 0.8), 1, 1); }
    const sx = w * L.sunPos[0], sy = h * L.sunPos[1];
    const rg = x.createRadialGradient(sx, sy, 0, sx, sy, 110); rg.addColorStop(0, L.sun + "aa"); rg.addColorStop(1, L.sun + "00"); x.fillStyle = rg; x.fillRect(0, 0, w, hz);
    x.fillStyle = L.sun; x.beginPath(); x.arc(sx, sy, L.night ? 12 : 18, 0, 7); x.fill();
    const sg = x.createLinearGradient(0, hz, 0, h); sg.addColorStop(0, L.sea[0]); sg.addColorStop(1, L.sea[1]); x.fillStyle = sg; x.fillRect(0, hz, w, h - hz);
    x.fillStyle = L.sun; for (let i = 0; i < 16; i++) { const y = hz + 3 + i * i * 0.35 + i * 3; const len = (14 + i * 4) * (0.6 + 0.4 * Math.sin((reduced ? 0 : now / 500) + i * 1.7)); x.globalAlpha = 0.7 - i * 0.035; x.fillRect(sx - len / 2, y, len, 1.5); }
    x.globalAlpha = 1;
    x.fillStyle = L.night ? "#05070c" : "rgba(40,30,50,.55)"; x.beginPath(); x.moveTo(w * 0.72, hz); x.quadraticCurveTo(w * 0.86, hz - 22, w, hz - 26); x.lineTo(w, hz); x.fill();
    x.fillStyle = L.night ? "#cfc7b8" : "#f4efe6"; x.fillRect(w * 0.9, hz - 46, 5, 22); x.fillStyle = "#c0392b"; x.fillRect(w * 0.9, hz - 38, 5, 3);
    if (L.night) { const a = reduced ? 0.4 : now / 1500; x.fillStyle = `rgba(255,236,180,${0.22 * Math.abs(Math.cos(a))})`; x.beginPath(); x.moveTo(w * 0.9 + 2, hz - 44); x.lineTo(0, hz - 70 - Math.sin(a) * 30); x.lineTo(0, hz - 30 - Math.sin(a) * 30); x.fill(); }
    view.tex.needsUpdate = true;
  }
  function setLight(name) {
    light = name; L = LIGHTS[name];
    hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
    key.color.set(L.key[0]); key.intensity = L.key[1]; amb.intensity = L.amb;
    lamp.intensity = L.lamp; glow.intensity = L.night ? 0.9 : 0;
    if (name === "golden") key.position.set(40, 42, -58); else if (name === "day") key.position.set(18, 70, -36); else key.position.set(20, 40, -40);
    patch.visible = name === "golden" && !backdrop;
    // in a void the light comes from over the viewer's shoulder, bright and even, so the figure reads in full
    if (backdrop) {
      hemi.color.set("#ffe9d2"); hemi.groundColor.set(backdrop === "white" ? "#a08c78" : "#2a2624"); hemi.intensity = 0.3;
      key.color.set("#ffcf9e"); key.intensity = 0.58; key.position.set(70, 52, 58); amb.color.set("#ffe4c8"); amb.intensity = 0.05;
    }
  }
  setLight(light);

  // ---------- motion ----------
  let frames = 0, lastDraw = 0;
  function update(now, reduced) {
    // some software WebGL drivers keep a new canvas texture blank after the room is rebuilt; swapping in a
    // fresh texture once, after the first frames, makes the screen show reliably
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
    if (now - lastDraw > 66) { lastDraw = now; paintTerminals(mon.ctx, reduced ? 6 : now / 1000); mon.tex.needsUpdate = true;
      drawView(now, reduced); drawClock(now, reduced); }
    drawSteam(now, reduced);
  }
  function highlight(name) {
    if (!name) { outline.visible = false; return; }
    const m = hit[name]; outline.visible = true; outline.position.copy(m.position); outline.scale.copy(new THREE.Vector3(m.geometry.parameters.width + 0.6, m.geometry.parameters.height + 0.6, m.geometry.parameters.depth + 0.6));
  }
  // hides a wall while the camera is behind it
  function viewFrom(p) { backWall.visible = !backdrop && p.z > 1.5; }
  // turns the cap round: the head is rebuilt with the brim on the other side
  function setCap(dir) {
    const old = head.children.find((o) => o.isInstancedMesh);
    const H2 = makeVox(k, [25, 18, 18], [38, 31, 31]); headVoxels(H2, C, dir);
    head.add(H2.mesh(THREE, shadows));
    if (old) { head.remove(old); old.geometry.dispose(); old.material.dispose(); }
  }
  return { root, hit, update, viewFrom, setLight, setCap, highlight };
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
