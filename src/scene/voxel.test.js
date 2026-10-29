import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { CLOCK_BOX, CLOCK_INSET, MONITOR_BOX, MONITOR_INSET, SCREEN_LIFT, frontFace, parseVox, screenRect, splitParts, toScene } from "./voxel.js";

const file = readFileSync(new URL("./jrnxf.vox", import.meta.url));
const { voxels, colour } = parseVox(file.buffer.slice(file.byteOffset, file.byteOffset + file.length));
const parts = splitParts(voxels, colour);

test("every voxel lands in exactly one part", () => {
  expect(voxels.length).toBeGreaterThan(20000);
  expect(parts.body.length + parts.head.length + parts.left.length + parts.right.length).toBe(voxels.length);
});

test("the head and both forearms are found", () => {
  expect(parts.head.length).toBeGreaterThan(1000);
  expect(parts.left.length).toBeGreaterThan(50);
  expect(parts.right.length).toBeGreaterThan(50);
});

// a screen's four corners in the scene, as the plane is built: centred on its rect, facing +z
const corners = (r) => [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]].map(([x, y]) => [x, y, r.z]);

for (const [name, box, inset, aspect] of [["monitor", MONITOR_BOX, MONITOR_INSET, 640 / 360], ["clock", CLOCK_BOX, CLOCK_INSET, undefined]]) {
  test(`the ${name} screen lies inside its face and a hair in front of it`, () => {
    const face = frontFace(voxels, ...box), rect = screenRect(face, inset, aspect);
    const eps = 1e-9;
    for (const [x, y, z] of corners(rect)) {
      expect(x).toBeGreaterThan(face.x0 + inset - eps);
      expect(x).toBeLessThan(face.x1 - inset + eps);
      expect(y).toBeGreaterThan(face.y0 - eps);
      expect(y).toBeLessThan(face.y1 - inset + eps);
      expect(z - face.z).toBeCloseTo(SCREEN_LIFT, 9);
    }
  });

  test(`the ${name} face is a solid rectangle of voxels, with nothing poking out of it`, () => {
    const face = frontFace(voxels, ...box);
    const [[x0, x1], [y0, y1], [z0, z1]] = box;
    const inFace = voxels.map(toScene).filter(([x, y, z]) => x > face.x0 && x < face.x1 && y > face.y0 && y < face.y1 && z > face.z - 0.4 && z < face.z && x > x0 && x < x1 && y > y0 && y < y1 && z > z0 && z < z1);
    expect(inFace.length).toBe(Math.round(((face.x1 - face.x0) / 0.4) * ((face.y1 - face.y0) / 0.4)));
  });

  test(`the ${name} face is the outer side of its front layer of voxels`, () => {
    const face = frontFace(voxels, ...box);
    const [[x0, x1], [y0, y1], [z0, z1]] = box;
    const cells = voxels.map(toScene).filter(([x, y, z]) => x > x0 && x < x1 && y > y0 && y < y1 && z > z0 && z < z1);
    // nothing in the box stands in front of the face, and every voxel of the front layer at its height lies within its box
    expect(Math.max(...cells.map((c) => c[2])) + 0.2).toBeCloseTo(face.z, 9);
    for (const [x, y, z] of cells.filter((c) => c[2] + 0.2 > face.z - 1e-9 && c[1] > face.y0 && c[1] < face.y1)) {
      expect(x).toBeGreaterThan(face.x0);
      expect(x).toBeLessThan(face.x1);
      expect(y).toBeGreaterThan(face.y0);
      expect(y).toBeLessThan(face.y1);
      expect(z).toBeLessThan(face.z);
    }
  });
}
