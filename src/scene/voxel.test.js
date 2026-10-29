import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parseVox, splitParts, turnCap } from "./voxel.js";

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

test("the cap turns round and back without losing its brim", () => {
  const front = turnCap(parts.head, "front");
  expect(front).not.toBe(parts.head);
  expect(turnCap(parts.head, "back")).toBe(parts.head);
  const back = turnCap(front, "back");
  const key = (v) => v.at.map((n) => Math.round(n / 0.4)).join(",") + v.c;
  expect(new Set(back.map(key))).toEqual(new Set(parts.head.map(key)));
});
