// Loads the real @hugeicons/core-free-icons package (same one the repo uses) and renders icons the way @hugeicons/react does.
let mod = null;
export async function loadIcons() {
  if (mod) return mod;
  mod = await import("https://esm.sh/@hugeicons/core-free-icons@4.1.1");
  return mod;
}
export function renderIcon(
  React,
  icon,
  { size = 24, strokeWidth = 1.5, color = "currentColor", style } = {},
) {
  if (!icon) return null;
  return React.createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill: "none",
      color,
      style: { flexShrink: 0, ...style },
    },
    icon.map(([tag, attrs], i) =>
      React.createElement(tag, {
        key: i,
        ...attrs,
        stroke: attrs.stroke ?? color,
        strokeWidth: attrs.strokeWidth ?? strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    ),
  );
}
