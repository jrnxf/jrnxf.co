// A browser stand-in for okfs's Twin Pane page: a dense list on the left, what is under
// the cursor beside it, a status line below, the palette on Ctrl/Cmd K, and the five
// built-in themes from okfs's token contract. Not the real okfs, just a faithful mock.

const FONTS = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;800&family=Geist+Mono:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,600&display=swap";

const BASE = {
  light: { bg: "#fbfbfa", surface: "#ffffff", sunken: "#f3f3f1", fg: "#191918", muted: "#6b6b68", faint: "#8a8a86", line: "#e7e7e3", "line-strong": "#d0d0cb", accent: "#e8501c", "accent-fg": "#ffffff", "accent-soft": "#fdeee8", hover: "#f1f1ee", scrim: "rgb(20 20 18 / 0.36)", "kind-folder": "#5b7fd6", "kind-image": "#c05fb0", "kind-media": "#d9772b", "kind-doc": "#6b6b68", "kind-code": "#3f9b6c", "kind-data": "#b8922a", "kind-archive": "#8a6fd1", "syn-comment": "#9a9a95", "syn-keyword": "#c2410c", "syn-string": "#2f7d4f", "syn-number": "#7a5cc4", "syn-title": "#2563a8", "font-ui": '"Geist", ui-sans-serif, system-ui, sans-serif', "font-mono": '"Geist Mono", ui-monospace, Menlo, monospace', "font-prose": '"Geist", ui-sans-serif, system-ui, sans-serif', "font-display": '"Geist", ui-sans-serif, system-ui, sans-serif', text: "13.5px", weight: "400", "weight-strong": "600", tracking: "-0.006em", "label-case": "none", radius: "6px", "radius-lg": "10px", "line-w": "1px", density: "1", shadow: "0 1px 2px rgb(0 0 0 / 0.05), 0 12px 32px -8px rgb(0 0 0 / 0.18)", "shadow-tile": "0 0 0 1px #e7e7e3", "icon-set": "line", "icon-stroke": "1.5" },
  dark: { bg: "#0d0d0e", surface: "#151516", sunken: "#0a0a0b", fg: "#ededeb", muted: "#9a9a96", faint: "#76766f", line: "#232325", "line-strong": "#343437", accent: "#ff6a36", "accent-fg": "#160a04", "accent-soft": "#2a1710", hover: "#1b1b1d", scrim: "rgb(0 0 0 / 0.6)", "kind-folder": "#7c9cf0", "kind-image": "#d98bcb", "kind-media": "#f0975a", "kind-doc": "#9a9a96", "kind-code": "#63c08f", "kind-data": "#d9b44a", "kind-archive": "#a892ea", "syn-comment": "#6a6a66", "syn-keyword": "#ff8a5c", "syn-string": "#7fd1a0", "syn-number": "#b7a1f5", "syn-title": "#7fb4f0", shadow: "0 0 0 1px rgb(255 255 255 / 0.06), 0 16px 40px -8px rgb(0 0 0 / 0.7)" },
};

// The built-in themes, token for token from okfs's themes/ folder (syntax colors trimmed where unused).
export const THEMES = {
  default: { name: "Default", note: "The contract's own values.", light: {}, dark: {} },
  paper: { name: "Paper", note: "Warm, bookish, serif. Flat: no shadows, almost no radius.",
    light: { bg: "#f5f0e6", surface: "#fbf8f1", sunken: "#ece5d6", fg: "#2a2520", muted: "#6f665a", faint: "#8c8272", line: "#ddd4c2", "line-strong": "#c4b9a3", accent: "#2d6a4f", "accent-fg": "#fbf8f1", "accent-soft": "#dfe8dc", hover: "#ebe4d5", "kind-folder": "#2d6a4f", "kind-image": "#9c4f6b", "kind-media": "#b0622a", "kind-doc": "#6f665a", "kind-code": "#4f7a3a", "kind-data": "#8f7420", "kind-archive": "#5f5a8f", "syn-keyword": "#9c3d2a", "syn-string": "#2d6a4f", "syn-number": "#7a4f8f", "syn-title": "#2a5578", "font-ui": '"Newsreader", Georgia, serif', "font-prose": '"Newsreader", Georgia, serif', "font-display": '"Newsreader", Georgia, serif', text: "15px", tracking: "0", radius: "2px", "radius-lg": "3px", shadow: "0 0 0 1px #c4b9a3, 0 18px 40px -12px rgb(42 37 32 / 0.3)", "icon-stroke": "1.25" },
    dark: { bg: "#1b1815", surface: "#23201c", sunken: "#151310", fg: "#ebe3d5", muted: "#a3988a", faint: "#766d61", line: "#322d27", "line-strong": "#463f37", accent: "#8fc7a6", "accent-fg": "#14211a", "accent-soft": "#233029", hover: "#2a2621", "kind-folder": "#8fc7a6", "kind-image": "#d49ab0", "kind-media": "#e0a070", "kind-doc": "#a3988a", "kind-code": "#a8c98a", "kind-data": "#d4bb6a", "kind-archive": "#a9a4dc", "syn-keyword": "#e39a86", "syn-string": "#8fc7a6", "syn-number": "#c4a3d6", "syn-title": "#8fb8dc" } },
  terminal: { name: "Terminal", note: "Monospace everywhere, square corners, tight rows, no icons.",
    light: { bg: "#f2f5ec", surface: "#f9fbf5", sunken: "#e6ebdd", fg: "#10201a", muted: "#4d6157", faint: "#76877c", line: "#d3dccb", "line-strong": "#a9b8a4", accent: "#0b7a3e", "accent-fg": "#f9fbf5", "accent-soft": "#d5ebd6", hover: "#e6ebdd", "kind-folder": "#0b7a3e", "kind-image": "#8a3f8f", "kind-media": "#a5571a", "kind-doc": "#4d6157", "kind-code": "#0b7a3e", "kind-data": "#7d6a10", "kind-archive": "#4a4fa0", "font-ui": '"Geist Mono", ui-monospace, Menlo, monospace', "font-prose": '"Geist Mono", ui-monospace, Menlo, monospace', "font-display": '"Geist Mono", ui-monospace, Menlo, monospace', text: "12.5px", tracking: "0", "label-case": "uppercase", radius: "0px", "radius-lg": "0px", density: "0.84", shadow: "0 0 0 1px #10201a", "icon-set": "none" },
    dark: { bg: "#070b08", surface: "#0c120e", sunken: "#040705", fg: "#b9f2c9", muted: "#6fa883", faint: "#3f6b50", line: "#16271c", "line-strong": "#24422f", accent: "#3dff8f", "accent-fg": "#03130a", "accent-soft": "#0e2a19", hover: "#101c14", "kind-folder": "#3dff8f", "kind-image": "#f08af5", "kind-media": "#ffb454", "kind-doc": "#6fa883", "kind-code": "#3dff8f", "kind-data": "#f5e663", "kind-archive": "#8fa5ff", shadow: "0 0 0 1px #3dff8f" } },
  fjord: { name: "Fjord", note: "Cool and roomy: blue-grey surfaces, soft corners, solid icons.",
    light: { bg: "#eef2f6", surface: "#f8fafc", sunken: "#e2e8ef", fg: "#1c2733", muted: "#5a6b7d", faint: "#7a8a9b", line: "#d6dee7", "line-strong": "#bcc8d5", accent: "#2f6fb5", "accent-fg": "#ffffff", "accent-soft": "#dbe8f6", hover: "#e4eaf1", "kind-folder": "#2f6fb5", "kind-image": "#a05aa8", "kind-media": "#c9722f", "kind-doc": "#5a6b7d", "kind-code": "#2f8f7a", "kind-data": "#a8862a", "kind-archive": "#6a63c0", radius: "9px", "radius-lg": "16px", density: "1.14", text: "14px", shadow: "0 2px 4px rgb(28 39 51 / 0.06), 0 20px 44px -12px rgb(28 39 51 / 0.28)", "icon-set": "solid" },
    dark: { bg: "#1b222c", surface: "#232c38", sunken: "#161c24", fg: "#e3eaf2", muted: "#9aaabb", faint: "#5f7084", line: "#2e3947", "line-strong": "#40505f", accent: "#88c0f0", "accent-fg": "#0f1a26", "accent-soft": "#29394b", hover: "#293340", "kind-folder": "#88c0f0", "kind-image": "#d7a1dc", "kind-media": "#f0a878", "kind-doc": "#9aaabb", "kind-code": "#8fd6c2", "kind-data": "#e5c97a", "kind-archive": "#aba6f0", shadow: "0 0 0 1px #40505f, 0 20px 44px -12px rgb(0 0 0 / 0.6)" } },
  riso: { name: "Riso", note: "Deliberately loud. Two-ink print: thick outlines, hard offset shadows, capitals.",
    light: { bg: "#fff6d6", surface: "#ffffff", sunken: "#ffe45c", fg: "#16110d", muted: "#4a3f35", faint: "#8a7b6c", line: "#16110d", "line-strong": "#16110d", accent: "#ff2e88", "accent-fg": "#ffffff", "accent-soft": "#ffd1e6", hover: "#ffe45c", "kind-folder": "#0047ff", "kind-image": "#ff2e88", "kind-media": "#ff5b14", "kind-doc": "#16110d", "kind-code": "#00935a", "kind-data": "#0047ff", "kind-archive": "#7a1fd6", "syn-keyword": "#ff2e88", "syn-string": "#00935a", "syn-number": "#7a1fd6", "syn-title": "#0047ff", "font-display": '"Geist Mono", ui-monospace, Menlo, monospace', text: "14px", weight: "500", "weight-strong": "800", tracking: "0", "label-case": "uppercase", radius: "0px", "radius-lg": "0px", "line-w": "2px", density: "1.1", shadow: "6px 6px 0 #16110d, 0 0 0 2px #16110d", "icon-set": "solid" },
    dark: { bg: "#1a0933", surface: "#2a0f52", sunken: "#12052a", fg: "#fff7fd", muted: "#d2b6f2", faint: "#8d6bc0", line: "#ff5fb7", "line-strong": "#ff5fb7", accent: "#f4f74a", "accent-fg": "#1a0933", "accent-soft": "#4a1d8a", hover: "#3a1670", "kind-folder": "#5fe0ff", "kind-image": "#ff5fb7", "kind-media": "#ff9a3d", "kind-doc": "#fff7fd", "kind-code": "#6dfbaa", "kind-data": "#f4f74a", "kind-archive": "#c79bff", "syn-keyword": "#ff5fb7", "syn-string": "#6dfbaa", "syn-number": "#f4f74a", "syn-title": "#5fe0ff", shadow: "6px 6px 0 #ff5fb7, 0 0 0 2px #ff5fb7" } },
};

function tokens(theme, scheme) {
  const t = THEMES[theme] || THEMES.default;
  const v = scheme === "dark" ? { ...BASE.light, ...t.light, ...BASE.dark, ...t.dark } : { ...BASE.light, ...t.light };
  // Dark inherits the light block's type and shape tokens, as the contract's two blocks do.
  return v;
}

// A painted beach photo as an SVG data URL, so the mock has pictures without shipping any.
export function scene(p) {
  const [sky1, sky2, sun, sea1, sea2, land] = p.c;
  const w = 1800, h = 1200, hz = p.hz ?? 700;
  let lines = "";
  for (let i = 0; i < 26; i++) {
    const y = hz + 12 + i * i * 0.7 + i * 6, len = 420 - i * 9 + ((i * 53) % 90);
    lines += `<rect x="${p.sx - len / 2 + ((i * 37) % 60) - 30}" y="${y}" width="${len}" height="${2 + i * 0.25}" fill="${sun}" opacity="${0.75 - i * 0.025}"/>`;
  }
  const land1 = p.cliff ? `<path d="M0 ${hz - 160} C 140 ${hz - 190}, 260 ${hz - 120}, 380 ${hz - 70} S 560 ${hz - 10}, 640 ${hz} L0 ${hz}Z" fill="${land}"/>` : "";
  const light = p.lighthouse ? `<g transform="translate(250 ${hz - 250})"><path d="M-14 0 L14 0 L22 140 L-22 140Z" fill="#f4efe6"/><rect x="-22" y="40" width="44" height="18" fill="#c0392b"/><rect x="-22" y="96" width="44" height="18" fill="#c0392b"/><rect x="-16" y="-22" width="32" height="22" fill="#2b2b2b"/><path d="M0 -12 L-900 -140 L-900 60Z" fill="#fff6c8" opacity=".18"/></g>` : "";
  const rocks = p.rocks ? `<g fill="${land}">${[[300, 60, 90], [520, 30, 60], [1300, 80, 140], [1500, 40, 70], [900, 20, 40]].map(([x, hh, ww]) => `<ellipse cx="${x}" cy="${hz + 210}" rx="${ww}" ry="${hh}"/>`).join("")}</g>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient><linearGradient id="o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea1}"/><stop offset="1" stop-color="${sea2}"/></linearGradient><radialGradient id="g"><stop offset="0" stop-color="${sun}" stop-opacity=".55"/><stop offset="1" stop-color="${sun}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${hz}" fill="url(#s)"/><circle cx="${p.sx}" cy="${p.sy}" r="420" fill="url(#g)"/><circle cx="${p.sx}" cy="${p.sy}" r="${p.sr ?? 90}" fill="${sun}"/><rect y="${hz}" width="${w}" height="${h - hz}" fill="url(#o)"/>${lines}${land1}${light}${rocks}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const PHOTOS = {
  "dawn-patrol.jpg": { c: ["#2c3e6b", "#e9a3a0", "#ffd9b8", "#c98d97", "#3b3f6b", "#1f2340"], sx: 1200, sy: 690, cliff: true },
  "offshore-morning.jpg": { c: ["#5c9fd6", "#cfe7f2", "#fffbe8", "#3d8fb0", "#13425e", "#26443a"], sx: 600, sy: 260, sr: 70 },
  "lighthouse-dusk.jpg": { c: ["#1d1838", "#c86a7d", "#ffb37a", "#7a4a73", "#1d1838", "#14101f"], sx: 1300, sy: 700, sr: 70, lighthouse: true, cliff: true },
  "low-tide-rocks.jpg": { c: ["#9fb2b8", "#e7e2d6", "#fff4dc", "#8fa6a3", "#5d6b66", "#2d3331"], sx: 1400, sy: 300, sr: 60, rocks: true },
  "sunset-set.jpg": { c: ["#3a1440", "#ff7a3d", "#ffe08a", "#e0623d", "#2a1033", "#160a1c"], sx: 900, sy: 690, sr: 110 },
};

const md = (s) => s;
export const TREE = {
  name: "praia", type: "dir", children: [
    { name: "photos", type: "dir", mod: "Oct 22", children: Object.keys(PHOTOS).filter((n) => n !== "sunset-set.jpg").map((n, i) => ({ name: n, type: "image", size: [1.8, 2.1, 1.6, 2.4][i] * 1048576, mod: ["Oct 22", "Oct 19", "Oct 12", "Sep 30"][i] })) },
    { name: "boards", type: "dir", mod: "Sep 3", children: [
      { name: "quiver.json", type: "json", size: 412, mod: "Sep 3", body: `{\n  "quiver": [\n    { "board": "6'2 shortboard", "fins": "thruster", "for": "1-1.5m, clean" },\n    { "board": "9'1 log", "fins": "single", "for": "knee high, glassy" },\n    { "board": "5'8 fish", "fins": "twin", "for": "mushy summer days" }\n  ],\n  "wax": "cool water",\n  "wetsuit": "4/3 until june"\n}` },
      { name: "wax.csv", type: "csv", size: 188, mod: "Aug 14", body: "month,water_c,wax\njan,14,cold\napr,15,cool\njul,18,cool\noct,17,cool" },
    ] },
    { name: "src", type: "dir", mod: "10d", children: [
      { name: "tide.rs", type: "code", lang: "rust", size: 1240, mod: "10d", body: `// Height of the tide, in metres, t hours after high water.\n// Two highs a day, a semi-diurnal sea like the Atlantic coast.\nconst PERIOD: f64 = 12.42;\n\npub fn height(t: f64, range: f64) -> f64 {\n    let mean = 2.0;\n    mean + range / 2.0 * (t / PERIOD * std::f64::consts::TAU).cos()\n}\n\nfn main() {\n    for h in 0..13 {\n        println!("{h:>2}h  {:.2} m", height(h as f64, 3.1));\n    }\n}` },
      { name: "swell.ts", type: "code", lang: "ts", size: 860, mod: "12d", body: `// Is it worth paddling out? A very honest model.\nexport function worthIt(height: number, period: number, wind: "off" | "on") {\n  if (wind === "on") return false;\n  return height >= 0.8 && period >= 9;\n}\n\nconsole.log(worthIt(1.2, 11, "off")); // true` },
    ] },
    { name: "README.md", type: "md", size: 512, mod: "Oct 20", body: md(`# Praia\n\nPhotos, tide tables and a surf log from one beach on the north coast of Portugal.\n\n- \`photos/\` - one keeper per session\n- \`boards/\` - the quiver, and what wax for which month\n- \`src/\` - the scripts that turn readings into a tide\n\nServed with \`okfs ~/praia\`.`) },
    { name: "forecast.json", type: "json", size: 623, mod: "today", body: `{\n  "spot": "beach break, north coast",\n  "swell": { "height_m": 1.4, "period_s": 11, "from": "NW" },\n  "wind": { "kts": 6, "from": "E", "offshore": true },\n  "tide": { "high": "07:42", "low": "13:55" },\n  "verdict": "go"\n}` },
    { name: "season-2026.zip", type: "zip", size: 5.7 * 1048576, mod: "12d", entries: ["season-2026/", "season-2026/log.csv", "season-2026/best-of/", "season-2026/best-of/01.jpg", "season-2026/best-of/02.jpg", "season-2026/notes.md"] },
    { name: "sunset-set.jpg", type: "image", size: 1.9 * 1048576, mod: "Oct 21" },
    { name: "surf-log.md", type: "md", size: 887, mod: "4d", body: md(`# Surf log\n\n## Oct 21, evening\n\nChest high, offshore, the sandbar finally back after the storm. Three good lefts and one I will think about all week.\n\n## Oct 19, dawn\n\nGlassy and small. Log day. Dolphins past the second peak.\n\n> Best session is the one you paddle out for.`) },
    { name: "tide-table.csv", type: "csv", size: 990, mod: "May 19", body: "date,high,m,low,m\nOct 23,07:42,3.4,13:55,0.6\nOct 24,08:21,3.3,14:36,0.7\nOct 25,09:03,3.1,15:20,0.9\nOct 26,09:50,2.9,16:10,1.1\nOct 27,10:45,2.7,17:09,1.3" },
    { name: "waves.wav", type: "audio", size: 172 * 1024, mod: "Jun 9" },
  ],
};
(function link(dir, path) {
  dir.path = path;
  for (const c of dir.children || []) { c.parent = dir; c.path = path + c.name + (c.type === "dir" ? "/" : ""); if (c.type === "dir") link(c, c.path); }
})(TREE, "/");

const KIND = { dir: "folder", image: "image", audio: "media", md: "doc", json: "data", csv: "data", code: "code", zip: "archive" };
const ICON = {
  folder: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2h9A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>',
  image: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><circle cx="9.5" cy="9.5" r="1.8"/><path d="M5 18l5-5 3 3 2.5-2.5L20 18"/>',
  media: '<path d="M10 17.5V6l9-2v11.5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
  doc: '<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9 12h6M9 15.5h6"/>',
  data: '<rect x="4" y="4.5" width="16" height="15" rx="2"/><path d="M4 9.5h16M10 9.5v10"/>',
  code: '<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M10.5 12.5l-2 2 2 2M13.5 12.5l2 2-2 2"/>',
  archive: '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5v11h14v-11M10 12h4"/>',
};
const sizeOf = (n) => n == null ? "" : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1048576).toFixed(1)} MB`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function renderMd(src) {
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  const out = []; let list = false;
  for (const line of src.split("\n")) {
    if (/^- /.test(line)) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${inline(line.slice(2))}</li>`); continue; }
    if (list) { out.push("</ul>"); list = false; }
    if (/^# /.test(line)) out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (/^## /.test(line)) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (/^> /.test(line)) out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push("</ul>");
  return out.join("");
}
function highlight(src, lang) {
  const kw = lang === "rust" ? /\b(const|pub|fn|let|for|in|as|use|mut|return)\b/g : /\b(export|function|return|if|const|let|import|from)\b/g;
  return src.split("\n").map((line) => {
    const ci = line.indexOf("//");
    const code = ci >= 0 ? line.slice(0, ci) : line, com = ci >= 0 ? line.slice(ci) : "";
    let h = esc(code)
      .replace(/(&quot;[^&]*?&quot;|"[^"]*")/g, "\u0001s$1\u0002")
      .replace(kw, "\u0001k$1\u0002")
      .replace(/\b(\d+(\.\d+)?)\b/g, "\u0001n$1\u0002");
    h = h.replace(/\u0001([skn])(.*?)\u0002/g, (_, t, x) => `<span class="${t}">${x}</span>`);
    return h + (com ? `<span class="c">${esc(com)}</span>` : "");
  });
}
function highlightJson(src) {
  return src.split("\n").map((l) => esc(l)
    .replace(/(&quot;|")([^"&]+)(&quot;|")(\s*:)/g, '<span class="t">"$2"</span>$4')
    .replace(/:\s*(&quot;|")([^"&]*)(&quot;|")/g, ': <span class="s">"$2"</span>')
    .replace(/:\s*(-?\d+(\.\d+)?|true|false)/g, ': <span class="n">$1</span>'));
}

const CSS = `
:host{all:initial;display:block;position:relative;container-type:inline-size;outline:none}
.app{position:absolute;inset:0;display:grid;grid-template-rows:auto 1fr auto;background:var(--bg);color:var(--fg);font-family:var(--font-ui);font-size:var(--text);font-weight:var(--weight);letter-spacing:var(--tracking);overflow:hidden;-webkit-font-smoothing:antialiased;transition:background .25s,color .25s}
.top{display:flex;align-items:center;gap:calc(14px*var(--density));padding:calc(10px*var(--density)) 14px;border-bottom:var(--line-w) solid var(--line);min-width:0}
.brand{display:flex;align-items:center;gap:8px;font-family:var(--font-display);font-weight:var(--weight-strong);font-size:1.08em;flex:none}
.brand svg{width:18px;height:18px}
.crumb{font-family:var(--font-display);font-weight:var(--weight-strong);color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.crumb span{color:var(--faint);font-weight:var(--weight)}
.find{margin-left:auto;display:flex;align-items:center;gap:8px;border:var(--line-w) solid var(--line-strong);background:var(--surface);color:var(--faint);border-radius:var(--radius);padding:5px 6px 5px 9px;cursor:pointer;font:inherit;min-width:0}
.find svg{width:14px;height:14px;flex:none}
.find .lbl{white-space:nowrap}
kbd{font-family:var(--font-mono);font-size:.82em;border:var(--line-w) solid var(--line-strong);border-radius:calc(var(--radius) * .6);padding:1px 5px;color:var(--muted);background:var(--sunken);white-space:nowrap}
.ib{background:none;border:0;color:var(--muted);cursor:pointer;display:grid;place-items:center;padding:4px;border-radius:var(--radius)}
.ib:hover{background:var(--hover);color:var(--fg)}
.ib svg{width:17px;height:17px}
.main{display:grid;grid-template-columns:minmax(min(290px,46%),36%) minmax(0,1fr);min-height:0}
.list{border-right:var(--line-w) solid var(--line);display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--bg)}
.head,.row{display:grid;grid-template-columns:22px minmax(0,1fr) 4.6em 4.2em;align-items:center;gap:10px;padding:0 14px}
.head{height:calc(34px*var(--density));color:var(--faint);font-size:.88em;text-transform:var(--label-case);border-bottom:var(--line-w) solid var(--line)}
.head .r,.row .r{text-align:right;font-family:var(--font-mono);font-size:.88em}
.rows{overflow:auto;flex:1;min-height:0;scrollbar-width:thin}
.row{height:calc(34px*var(--density));cursor:pointer;position:relative;color:var(--fg);border-radius:0}
.row .r{color:var(--faint)}
.row:hover{background:var(--hover)}
.row.on{background:var(--accent-soft)}
.row.on::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent)}
.row .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ic{width:17px;height:17px;display:block}
.ic svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:var(--icon-stroke);stroke-linecap:round;stroke-linejoin:round}
.solid .ic svg{fill:currentColor;fill-opacity:.22}
.noicons .ic{visibility:hidden;width:0}
.noicons .head,.noicons .row{grid-template-columns:0 minmax(0,1fr) 4.6em 4.2em}
.readme{border-top:var(--line-w) solid var(--line);padding:12px 16px;max-height:34%;overflow:auto;font-family:var(--font-prose);color:var(--fg);flex:none}
.readme .lab{color:var(--faint);font-size:.85em;margin-bottom:6px;text-transform:var(--label-case)}
.pv{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg)}
.pvh{display:flex;align-items:center;gap:10px;padding:0 14px;height:calc(40px*var(--density));border-bottom:var(--line-w) solid var(--line);min-width:0}
.pvh .nm{font-weight:var(--weight-strong);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none;max-width:55%}
.pvh .meta{font-family:var(--font-mono);font-size:.84em;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.pvh .tg{margin-left:auto;font-family:var(--font-mono);font-size:.8em;color:var(--muted);border:var(--line-w) solid var(--line-strong);border-radius:var(--radius);padding:2px 7px;cursor:pointer;background:var(--surface);white-space:nowrap}
.body{flex:1;min-height:0;overflow:auto;position:relative}
.img{position:absolute;inset:16px;display:flex;align-items:center;justify-content:center}
.img img{max-width:100%;max-height:100%;min-width:0;min-height:0;object-fit:contain;border-radius:calc(var(--radius) * .5);box-shadow:var(--shadow-tile);display:block}
.prose{font-family:var(--font-prose);padding:18px 22px;line-height:1.6;max-width:62ch}
.prose h1{font-family:var(--font-display);font-size:1.7em;margin:.1em 0 .5em;line-height:1.15;letter-spacing:-.01em;font-weight:var(--weight-strong)}
.prose h2{font-family:var(--font-display);font-size:1.12em;margin:1.3em 0 .3em;font-weight:var(--weight-strong)}
.prose p,.prose ul{margin:.5em 0}.prose ul{padding-left:1.2em}
.prose code{font-family:var(--font-mono);font-size:.88em;background:var(--sunken);padding:1px 5px;border-radius:calc(var(--radius) * .6)}
.prose blockquote{margin:1em 0;padding-left:12px;border-left:3px solid var(--accent);color:var(--muted)}
.src{font-family:var(--font-mono);font-size:.9em;line-height:1.65;padding:14px 0;margin:0;counter-reset:l;white-space:pre}
.src div{padding:0 16px 0 0;display:flex}
.src div::before{counter-increment:l;content:counter(l);width:3.2em;flex:none;text-align:right;padding-right:16px;color:var(--faint);opacity:.7}
.src .k{color:var(--syn-keyword)}.src .s{color:var(--syn-string)}.src .n{color:var(--syn-number)}.src .c{color:var(--syn-comment);font-style:italic}.src .t{color:var(--syn-title)}
.wrap .src{white-space:pre-wrap}
table{border-collapse:collapse;font-family:var(--font-mono);font-size:.9em;margin:14px 16px}
th,td{padding:6px 14px 6px 0;text-align:left;border-bottom:var(--line-w) solid var(--line);white-space:nowrap}
th{color:var(--faint);font-weight:var(--weight);text-transform:var(--label-case)}
.cols{display:flex;height:100%}
.col{flex:0 0 min(260px,50%);border-right:var(--line-w) solid var(--line);overflow:auto}
.col .row{grid-template-columns:22px minmax(0,1fr) 4.6em;padding:0 12px}
.wave{padding:28px 22px;display:flex;flex-direction:column;gap:18px}
.wave svg{width:100%;height:120px}
.wave .play{align-self:flex-start;display:flex;gap:8px;align-items:center;font:inherit;background:var(--accent);color:var(--accent-fg);border:0;border-radius:var(--radius);padding:7px 12px;cursor:pointer}
.zip{padding:12px 0}
.zip div{padding:4px 18px;font-family:var(--font-mono);font-size:.9em;color:var(--muted)}
.status{display:flex;align-items:center;gap:10px;padding:0 12px;height:calc(32px*var(--density));border-top:var(--line-w) solid var(--line);font-family:var(--font-mono);font-size:.84em;color:var(--muted);white-space:nowrap;min-width:0}
.mode{background:var(--accent);color:var(--accent-fg);font-weight:600;padding:2px 7px;border-radius:calc(var(--radius) * .6);letter-spacing:.04em;font-size:.88em}
.hints{margin-left:auto;display:flex;gap:12px;overflow:hidden}
.hints span{display:flex;gap:4px;align-items:center}
.scrim{position:absolute;inset:0;background:var(--scrim);display:none;align-items:flex-start;justify-content:center;padding-top:9%;z-index:5}
.scrim.on{display:flex}
.pal{width:min(560px,92%);background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);overflow:hidden;border:var(--line-w) solid var(--line)}
.pal input{all:unset;box-sizing:border-box;width:100%;padding:13px 16px;font-family:var(--font-ui);font-size:1.08em;color:var(--fg);border-bottom:var(--line-w) solid var(--line)}
.pal input::placeholder{color:var(--faint)}
.pal .sec{padding:8px 16px 4px;color:var(--faint);font-size:.82em;text-transform:var(--label-case)}
.pal .it{display:flex;align-items:center;gap:10px;padding:7px 16px;cursor:pointer;min-width:0}
.pal .it .p{color:var(--faint);font-family:var(--font-mono);font-size:.84em;margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.pal .it.on{background:var(--accent-soft)}
.pal .it > span:first-child{white-space:nowrap;flex:none}
.pal .it mark{background:none;color:var(--accent);font-weight:var(--weight-strong)}
.pal .res{max-height:300px;overflow:auto;padding-bottom:6px}
.keys{width:min(460px,92%);background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);padding:14px 18px;display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:.92em;border:var(--line-w) solid var(--line)}
.over{display:none}
@container (max-width: 620px){
  .main{grid-template-columns:minmax(0,1fr)}
  .pv{display:none}
  .find .lbl,.find kbd,.hints{display:none}
  .find{padding:6px}
  .over.on{display:flex;position:absolute;inset:0;z-index:4;flex-direction:column;background:var(--bg)}
  .over .bar{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-top:var(--line-w) solid var(--line)}
  .over .bar button{font:inherit;background:var(--surface);color:var(--fg);border:var(--line-w) solid var(--line-strong);border-radius:var(--radius);padding:7px 12px;cursor:pointer}
  .head,.row{grid-template-columns:22px minmax(0,1fr) 4.4em}
  .noicons .head,.noicons .row{grid-template-columns:0 minmax(0,1fr) 4.4em}
  .head .m,.row .m{display:none}
}
`;

const LOGO = '<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M60,24 A8,8 0 0 1 68,32 V224 A8,8 0 0 1 60,232 A36,36 0 0 1 24,196 V60 A36,36 0 0 1 60,24 Z M90,24 H118 A8,8 0 0 1 126,32 V224 A8,8 0 0 1 118,232 H90 A8,8 0 0 1 82,224 V32 A8,8 0 0 1 90,24 Z" fill="currentColor"/><path d="M148,24 H196 A36,36 0 0 1 232,60 V196 A36,36 0 0 1 196,232 H148 A8,8 0 0 1 140,224 V32 A8,8 0 0 1 148,24 Z" fill="var(--accent)"/></svg>';

export function mountOkfs(host, { theme = "default", scheme = "dark", start = 0, autofocus = false, keys = true, tree = TREE, rootName = "praia", brand = null, accent = null, findLabel = "Find anything" } = {}) {
  (function link(dir, path) { dir.path = path; for (const c of dir.children || []) { c.parent = dir; c.path = path + c.name + (c.type === "dir" ? "/" : ""); if (c.type === "dir") link(c, c.path); } })(tree, "/");
  if (!document.getElementById("okfs-fonts")) {
    const l = document.createElement("link"); l.id = "okfs-fonts"; l.rel = "stylesheet"; l.href = FONTS; document.head.append(l);
  }
  const root = host.attachShadow({ mode: "open" });
  host.tabIndex = 0;
  const st = { theme, scheme, dir: tree, cur: start, rendered: {}, wrap: false, pal: false, q: "", pi: 0, keysOpen: false, over: false, previewTheme: null };
  const subs = new Set();
  const emit = (ev) => subs.forEach((f) => f(ev, st));

  root.innerHTML = `<style>${CSS}</style><div class="app"></div>`;
  const app = root.querySelector(".app");

  const items = () => st.dir.children;
  const curItem = () => items()[st.cur];
  const kindOf = (it) => it.kind || KIND[it.type] || "doc";
  const icon = (it) => `<span class="ic" style="color:var(--kind-${kindOf(it)})"><svg viewBox="0 0 24 24">${ICON[kindOf(it)]}</svg></span>`;
  const rowHTML = (it, i, on, cols = true) => `<div class="row${on ? " on" : ""}" data-i="${i}">${icon(it)}<span class="nm">${esc(it.name)}</span><span class="r">${it.type === "dir" ? it.children.length : sizeOf(it.size)}</span>${cols ? `<span class="r m">${it.mod}</span>` : ""}</div>`;

  function previewBody(it) {
    if (!it) return "";
    if (it.preview) return `<div class="custom" style="position:absolute;inset:0"></div>`;
    const showRendered = st.rendered[it.type] ?? (it.type === "csv");
    if (it.type === "dir") {
      const first = it.children[0];
      return `<div class="cols"><div class="col">${it.children.map((c, i) => rowHTML(c, i, i === 0, false)).join("")}</div>${first && first.type === "dir" ? `<div class="col">${first.children.map((c) => rowHTML(c, 0, false, false)).join("")}</div>` : first ? `<div style="flex:1;min-width:0;position:relative">${first.type === "image" ? `<div class="img"><img alt="" src="${scene(PHOTOS[first.name])}"></div>` : ""}</div>` : ""}</div>`;
    }
    if (it.type === "image") return `<div class="img"><img alt="${esc(it.name)}" src="${scene(PHOTOS[it.name])}"></div>`;
    if (it.type === "md") return showRendered ? `<div class="prose">${renderMd(it.body)}</div>` : `<pre class="src">${it.body.split("\n").map((l) => `<div>${esc(l) || " "}</div>`).join("")}</pre>`;
    if (it.type === "code") return `<pre class="src">${highlight(it.body, it.lang).map((l) => `<div>${l || " "}</div>`).join("")}</pre>`;
    if (it.type === "json") return `<pre class="src">${highlightJson(it.body).map((l) => `<div>${l || " "}</div>`).join("")}</pre>`;
    if (it.type === "csv") {
      if (!showRendered) return `<pre class="src">${it.body.split("\n").map((l) => `<div>${esc(l)}</div>`).join("")}</pre>`;
      const [h, ...r] = it.body.split("\n").map((l) => l.split(","));
      return `<table><thead><tr>${h.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${r.map((x) => `<tr>${x.map((y) => `<td>${esc(y)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
    if (it.type === "audio") {
      let bars = ""; for (let i = 0; i < 90; i++) { const hh = 12 + Math.abs(Math.sin(i * 0.37) * 40 + Math.sin(i * 1.9) * 18); bars += `<rect x="${i * 6.6}" y="${60 - hh / 2}" width="3.4" height="${hh}" rx="1.7" fill="var(--kind-media)" opacity="${i < 30 ? 1 : 0.4}"/>`; }
      return `<div class="wave"><svg viewBox="0 0 594 120" preserveAspectRatio="none">${bars}</svg><button class="play">▶ waves.wav · 0:42</button></div>`;
    }
    if (it.type === "zip") return `<div class="zip">${it.entries.map((e) => `<div>${esc(e)}</div>`).join("")}</div>`;
    return "";
  }
  function meta(it) {
    if (!it) return "";
    if (it.meta) return it.meta;
    if (it.type === "image") return `1800 × 1200 · ${sizeOf(it.size)} · 2026-${it.mod === "Oct 21" ? "10-21 19:12" : "10-22 07:31"}`;
    if (it.type === "dir") return `${it.children.length} items`;
    return `${sizeOf(it.size)} · ${it.mod}`;
  }
  const hasSource = (it) => it && ["md", "csv"].includes(it.type);

  function render() {
    const t = st.previewTheme || st.theme;
    for (const [k, x] of Object.entries(tokens(t, st.scheme))) host.style.setProperty(`--${k}`, x);
    if (accent) { host.style.setProperty("--accent", accent); host.style.setProperty("--accent-soft", st.scheme === "dark" ? "rgb(251 152 144 / 0.13)" : "rgb(251 152 144 / 0.22)"); host.style.setProperty("--accent-fg", "#160a04"); }
    const iconSet = (THEMES[t][st.scheme === "dark" ? "dark" : "light"]["icon-set"]) || THEMES[t].light["icon-set"] || "line";
    app.className = `app ${iconSet === "solid" ? "solid" : iconSet === "none" ? "noicons" : ""}`;
    const it = curItem();
    const readme = st.dir.children.find((c) => c.name === "README.md");
    const total = st.dir.children.reduce((a, c) => a + (c.size || 0), 0);
    app.innerHTML = `
      <div class="top"><span class="brand">${brand || `${LOGO}<span>okfs</span>`}</span><span class="crumb">${st.dir.path === "/" ? rootName : `<span>${rootName} / ${st.dir.parent.path === "/" ? "" : esc(st.dir.parent.path.slice(1))}</span>${esc(st.dir.name)}`}</span>
        <button class="find" data-act="pal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><span class="lbl">${findLabel}</span><kbd>Ctrl K</kbd></button>
        <button class="ib" data-act="theme" title="Light or dark (t)"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg></button></div>
      <div class="main">
        <div class="list"><div class="head"><span></span><span>Name ↑</span><span class="r">Size</span><span class="r m">Mod.</span></div>
          <div class="rows">${st.dir.parent ? "" : ""}${items().map((c, i) => rowHTML(c, i, i === st.cur)).join("")}</div>
          ${readme ? `<div class="readme"><div class="lab">README.md</div><div class="prose" style="padding:0">${renderMd(readme.body)}</div></div>` : ""}</div>
        <div class="pv${st.wrap ? " wrap" : ""}"><div class="pvh">${it ? icon(it) : ""}<span class="nm">${esc(it?.name)}</span><span class="meta">${meta(it)}</span>${hasSource(it) ? `<button class="tg" data-act="r">${(st.rendered[it.type] ?? it.type === "csv") ? "rendered" : "source"} · r</button>` : ""}</div><div class="body">${previewBody(it)}</div></div>
      </div>
      <div class="status"><span class="mode">${st.pal ? "FIND" : "BROWSE"}</span><span>${items().length} items · ${sizeOf(total)} · by name</span>
        <span class="hints"><span><kbd>j</kbd><kbd>k</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>r</kbd> source</span><span><kbd>t</kbd> theme</span><span><kbd>?</kbd> keys</span></span></div>
      <div class="over${st.over ? " on" : ""}"><div class="pvh">${it ? icon(it) : ""}<span class="nm">${esc(it?.name)}</span><span class="meta">${meta(it)}</span></div><div class="body">${st.over ? previewBody(it) : ""}</div><div class="bar"><button data-act="prev">‹ previous</button><button data-act="close">list</button><button data-act="next">next ›</button></div></div>
      <div class="scrim${st.pal ? " on" : ""}" data-act="scrim">${st.pal ? paletteHTML() : ""}</div>
      <div class="scrim${st.keysOpen ? " on" : ""}" data-act="scrim">${st.keysOpen ? `<div class="keys">${[["j k", "move down and up"], ["↵ l", "open the folder"], ["h ⌫", "up one folder"], ["r", "rendered or source"], ["w", "wrap long lines"], ["Ctrl K", "find anything; > for commands"], ["t", "light or dark"], ["?", "show the keys"]].map(([k, d]) => `<kbd style="justify-self:start">${k}</kbd><span>${d}</span>`).join("")}</div>` : ""}</div>`;
    const cu = app.querySelector(".pv .custom"), co = app.querySelector(".over .custom");
    if (it?.preview) { if (cu && host.clientWidth > 620) it.preview(cu, api); if (co && st.over) it.preview(co, api); }
    const on = app.querySelector(".rows .row.on");
    if (on) { const box = on.parentElement; if (on.offsetTop < box.scrollTop) box.scrollTop = on.offsetTop; else if (on.offsetTop + on.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = on.offsetTop + on.offsetHeight - box.clientHeight; }
    if (st.pal) { const inp = app.querySelector(".pal input"); inp.value = st.q; inp.focus({ preventScroll: true }); inp.setSelectionRange(st.q.length, st.q.length); }
  }

  function allFiles(d = tree, out = []) { for (const c of d.children) { out.push(c); if (c.type === "dir") allFiles(c, out); } return out; }
  function matches() {
    const q = st.q.trim();
    if (q.startsWith(">")) {
      const cq = q.slice(1).trim().toLowerCase();
      const cmds = [...Object.entries(THEMES).map(([k, v]) => ({ cmd: "theme", arg: k, label: `Theme: ${v.name}`, sub: v.note })), { cmd: "scheme", label: "Light or dark", sub: "t" }, { cmd: "keys", label: "Show the keys", sub: "?" }];
      return cmds.filter((c) => c.label.toLowerCase().includes(cq));
    }
    if (!q) return allFiles().filter((f) => f.type !== "dir").sort((a, b) => (a.mod === "today" ? -1 : 0)).slice(0, 6).map((f) => ({ file: f }));
    const ql = q.toLowerCase();
    return allFiles().map((f) => {
      const s = f.path.toLowerCase(); let i = 0, hits = [];
      for (let j = 0; j < s.length && i < ql.length; j++) if (s[j] === ql[i]) { hits.push(j); i++; }
      return i === ql.length ? { file: f, hits, score: hits.at(-1) - hits[0] } : null;
    }).filter(Boolean).sort((a, b) => a.score - b.score).slice(0, 8);
  }
  function paletteHTML() {
    const ms = matches(); st.pi = Math.min(st.pi, Math.max(ms.length - 1, 0));
    const isCmd = st.q.trim().startsWith(">");
    const mark = (p, hits = []) => [...p].map((ch, i) => hits.includes(i) ? `<mark>${esc(ch)}</mark>` : esc(ch)).join("");
    return `<div class="pal" role="dialog"><input placeholder="Find any file in ${rootName}, or > for commands" aria-label="Find"><div class="sec">${isCmd ? "Commands" : st.q ? `${ms.length} matches` : "Recently changed"}</div><div class="res">${ms.map((m, i) => m.cmd
      ? `<div class="it${i === st.pi ? " on" : ""}" data-pi="${i}"><span>${esc(m.label)}</span><span class="p">${esc(m.sub)}</span></div>`
      : `<div class="it${i === st.pi ? " on" : ""}" data-pi="${i}">${icon(m.file)}<span class="nm">${mark(m.file.name, (m.hits || []).map((h) => h - (m.file.path.length - m.file.name.length - (m.file.type === "dir" ? 1 : 0))))}</span><span class="p">${esc(m.file.parent.path)}</span></div>`).join("") || `<div class="it" style="color:var(--faint)">No file matches</div>`}</div></div>`;
  }
  function choose(i) {
    const m = matches()[i]; if (!m) return;
    if (m.cmd === "theme") { st.theme = m.arg; st.previewTheme = null; emit({ type: "theme", theme: m.arg }); }
    else if (m.cmd === "scheme") { st.scheme = st.scheme === "dark" ? "light" : "dark"; emit({ type: "scheme" }); }
    else if (m.cmd === "keys") { st.keysOpen = true; }
    else if (m.file) { goto(m.file.path); }
    st.pal = false; st.q = ""; st.previewTheme = null; render(); host.focus({ preventScroll: true });
  }
  function goto(path) {
    const f = allFiles().find((x) => x.path === path); if (!f) return;
    st.dir = f.type === "dir" ? f : f.parent;
    st.cur = f.type === "dir" ? 0 : st.dir.children.indexOf(f);
    emit({ type: "goto", path }); render();
  }
  const api = {
    host, state: st,
    on(f) { subs.add(f); return () => subs.delete(f); },
    move(d) { st.cur = Math.max(0, Math.min(items().length - 1, st.cur + d)); emit({ type: "move", item: curItem() }); render(); },
    select(name) { const i = items().findIndex((c) => c.name === name); if (i >= 0) { st.cur = i; emit({ type: "move", item: curItem() }); render(); } },
    open() { const it = curItem(); if (it?.type === "dir") { st.dir = it; st.cur = 0; emit({ type: "open", item: it }); render(); } else if (host.clientWidth <= 620) { st.over = true; render(); } },
    back() { if (st.over) { st.over = false; return render(); } if (st.dir.parent) { const from = st.dir; st.dir = st.dir.parent; st.cur = st.dir.children.indexOf(from); emit({ type: "back" }); render(); } },
    toggleSource() { const it = curItem(); if (hasSource(it)) { st.rendered[it.type] = !(st.rendered[it.type] ?? it.type === "csv"); emit({ type: "source", rendered: st.rendered[it.type] }); render(); } },
    setTheme(t) { st.theme = t; st.previewTheme = null; emit({ type: "theme", theme: t }); render(); },
    setScheme(s) { st.scheme = s; emit({ type: "scheme" }); render(); },
    palette(open = true, q = "") { st.pal = open; st.q = q; st.pi = 0; emit({ type: "palette", open }); render(); },
    type(q) { st.q = q; st.pi = 0; render(); },
    goto, choose, render,
    keys(open) { st.keysOpen = open; render(); },
  };

  app.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    const row = e.target.closest(".list .row");
    const pit = e.target.closest("[data-pi]");
    if (pit) return choose(+pit.dataset.pi);
    if (act === "scrim" && e.target.classList.contains("scrim")) { st.pal = false; st.keysOpen = false; st.previewTheme = null; return render(); }
    if (act === "pal") return api.palette(true);
    if (act === "theme") return api.setScheme(st.scheme === "dark" ? "light" : "dark");
    if (act === "r") return api.toggleSource();
    if (act === "prev") { api.move(-1); st.over = true; return render(); }
    if (act === "next") { api.move(1); st.over = true; return render(); }
    if (act === "close") { st.over = false; return render(); }
    if (row) {
      const i = +row.dataset.i;
      if (i === st.cur || host.clientWidth <= 620) { st.cur = i; api.open(); } else { st.cur = i; emit({ type: "move", item: curItem() }); render(); }
      host.focus({ preventScroll: true });
    }
  });
  app.addEventListener("dblclick", (e) => { if (e.target.closest(".list .row")) api.open(); });
  app.addEventListener("mouseover", (e) => {
    const pit = e.target.closest("[data-pi]"); if (!pit || !st.pal) return;
    const m = matches()[+pit.dataset.pi];
    if (m?.cmd === "theme" && st.previewTheme !== m.arg) { st.pi = +pit.dataset.pi; st.previewTheme = m.arg; render(); }
  });
  app.addEventListener("input", (e) => { if (e.target.matches(".pal input")) { st.q = e.target.value; st.pi = 0; render(); } });
  host.addEventListener("keydown", (e) => {
    if (!keys) return;
    if (st.pal) {
      const ms = matches();
      if (e.key === "Escape") { st.pal = false; st.previewTheme = null; render(); host.focus({ preventScroll: true }); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { st.pi = (st.pi + (e.key === "ArrowDown" ? 1 : -1) + ms.length) % Math.max(ms.length, 1); const m = ms[st.pi]; st.previewTheme = m?.cmd === "theme" ? m.arg : null; render(); }
      else if (e.key === "Enter") choose(st.pi);
      else return;
      e.preventDefault(); e.stopPropagation(); return;
    }
    const tgt = e.composedPath()[0];
    if (tgt && /^(INPUT|TEXTAREA|BUTTON|A)$/.test(tgt.tagName) && tgt !== host) { if (!(tgt.tagName === "BUTTON" || tgt.tagName === "A") || e.key === "Enter" || e.key === " ") return; }
    if (st.keysOpen) { st.keysOpen = false; render(); e.preventDefault(); return; }
    const k = e.key;
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "k") api.palette(true);
    else if (k === "j" || k === "ArrowDown") api.move(1);
    else if (k === "k" || k === "ArrowUp") api.move(-1);
    else if (k === "Enter" || k === "l" || k === "ArrowRight") api.open();
    else if (k === "h" || k === "Backspace" || k === "-" || k === "ArrowLeft" || k === "Escape") api.back();
    else if (k === "r") api.toggleSource();
    else if (k === "w") { st.wrap = !st.wrap; render(); }
    else if (k === "t") api.setScheme(st.scheme === "dark" ? "light" : "dark");
    else if (k === "Home") { st.cur = 0; render(); }
    else if (k === "End") { st.cur = items().length - 1; render(); }
    else if (k === "?") api.keys(true);
    else return;
    e.preventDefault(); e.stopPropagation();
  });
  render();
  if (autofocus) host.focus({ preventScroll: true });
  return api;
}
