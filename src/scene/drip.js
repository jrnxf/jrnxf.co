// A browser stand-in for drip's notch card, drawn to match drip's own look:
// one black shape with the notch, a drop that forms under it, stretches on a neck,
// breaks free and widens into a capsule. Kinds are looks only (ok, warn, fail, info);
// --stay, --yes/--no and --open are behavior. Not the real DripCore, just a mock.

const KINDS = {
  ok: { color: "#30d158", yes: "#248a3d", glyph: "check" },
  warn: { color: "#ff9f0a", yes: "#b25000", glyph: "excl" },
  fail: { color: "#ff453a", yes: "#d70015", glyph: "x" },
  info: { color: "#0a84ff", yes: "#0060df", glyph: "i" },
};

const GLYPH = {
  check: '<path d="M8.2 12.4l2.6 2.6 5-5.6" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round"/>',
  excl: '<path d="M12 7v6" stroke="#000" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1.4" fill="#000"/>',
  i: '<circle cx="12" cy="7.6" r="1.4" fill="#000"/><path d="M12 11v6.2" stroke="#000" stroke-width="2.4" stroke-linecap="round"/>',
};

// A neutral stand-in for an agent's app icon: a coral spark on a dark tile.
const AGENT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#1c1c1e"/><g stroke="#fb9890" stroke-width="2.1" stroke-linecap="round"><path d="M12 5v14M5 12h14M7.1 7.1l9.8 9.8M16.9 7.1l-9.8 9.8"/></g></svg>';

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let uid = 0;
const CSS = `
.dn-root{position:absolute;inset:0;pointer-events:none;overflow:hidden;--s:1;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.dn-goo{position:absolute;inset:0}
.dn-notch{position:absolute;top:0;background:#000;border-radius:0 0 calc(10px*var(--s)) calc(10px*var(--s))}
.dn-pill{position:absolute;background:#000}
.dn-content{position:absolute;display:flex;align-items:center;gap:calc(10px*var(--s));padding:calc(9px*var(--s)) calc(13px*var(--s)) calc(9px*var(--s)) calc(10px*var(--s));box-sizing:border-box;color:#fff;pointer-events:auto;cursor:pointer;opacity:0}
.dn-measure{position:absolute;visibility:hidden;left:0;top:0;opacity:1!important}.dn-free{width:max-content}.dn-free .dn-title,.dn-free .dn-detail{display:block}
.dn-icon{flex:none;width:calc(30px*var(--s));height:calc(30px*var(--s))}
.dn-icon svg{width:100%;height:100%;display:block}
.dn-text{min-width:0;display:flex;flex-direction:column;gap:calc(1px*var(--s))}
.dn-title{font-size:calc(14px*var(--s));font-weight:600;line-height:1.25;letter-spacing:-.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.dn-detail{font-size:calc(12px*var(--s));line-height:1.3;color:rgba(235,235,245,.6);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.dn-end{flex:none;display:flex;align-items:center;gap:calc(6px*var(--s));margin-left:calc(2px*var(--s))}
.dn-ring{width:calc(22px*var(--s));height:calc(22px*var(--s));display:block;transform:rotate(-90deg)}
.dn-dot{position:relative;width:calc(22px*var(--s));height:calc(22px*var(--s));display:grid;place-items:center}
.dn-dot i{width:calc(8px*var(--s));height:calc(8px*var(--s));border-radius:50%;background:#fff;display:block}
.dn-dot b{position:absolute;inset:0;margin:auto;width:calc(8px*var(--s));height:calc(8px*var(--s));border-radius:50%;background:rgba(255,255,255,.55);animation:dn-ping 2.4s cubic-bezier(.2,.6,.3,1) infinite}
@keyframes dn-ping{0%{transform:scale(1);opacity:.7}60%,100%{transform:scale(2.2);opacity:0}}
.dn-btn{font:inherit;font-size:calc(12.5px*var(--s));font-weight:600;color:#fff;border:0;border-radius:999px;padding:calc(6px*var(--s)) calc(11px*var(--s));cursor:pointer;white-space:nowrap;line-height:1.1}
.dn-btn.no,.dn-btn.open{background:rgba(255,255,255,.15)}
.dn-btn:hover{filter:brightness(1.15)}
.dn-mini{position:absolute;display:grid;place-items:center;color:#fff;font:600 calc(11px*var(--s))/1 -apple-system,system-ui,sans-serif;pointer-events:none}
@media (prefers-reduced-motion: reduce){.dn-dot b{animation:none;opacity:0}}
`;

export class Notch {
  // container: a positioned element the notch hangs from (its top edge is the "menu bar").
  constructor(container, { scale = 1, notchWidth = 184, notchHeight = 32, stackMax = 3, showNotch = true } = {}) {
    if (!document.getElementById("dn-css")) {
      const st = document.createElement("style"); st.id = "dn-css"; st.textContent = CSS; document.head.append(st);
    }
    this.id = ++uid;
    this.c = container;
    this.s = scale; this.nw = notchWidth * scale; this.nh = notchHeight * scale; this.stackMax = stackMax;
    this.cards = []; this.queue = [];
    const blur = 5 * scale;
    this.root = document.createElement("div");
    this.root.className = "dn-root";
    this.root.style.setProperty("--s", scale);
    this.root.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="dn-goo-${this.id}"><feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/></filter></svg>
      <div class="dn-goo" style="filter:url(#dn-goo-${this.id})"><div class="dn-notch" style="${showNotch ? "" : "opacity:0;"}width:${this.nw}px;height:${this.nh}px"></div></div>`;
    this.goo = this.root.querySelector(".dn-goo");
    this.notch = this.root.querySelector(".dn-notch");
    container.append(this.root);
    this.layoutNotch();
    new ResizeObserver(() => { this.layoutNotch(); this.layout(false); }).observe(container);
    this.gap = 12 * scale; this.top = this.nh + 7 * scale;
  }
  get cw() { return this.c.clientWidth; }
  layoutNotch() { this.notch.style.left = `${(this.cw - this.nw) / 2}px`; }

  // Shows a card; resolves to "yes", "no", "click", "open", "timeout" or "replaced".
  show(opts) {
    const o = { kind: "info", seconds: 4.5, ...opts };
    if (o.id) {
      const live = this.cards.find((c) => c.o.id === o.id && !c.leaving && !c.o.yes);
      if (live) return this.replace(live, o);
      const queued = this.queue.find((q) => q.o.id === o.id);
      if (queued) { queued.resolve("replaced"); queued.o = o; return new Promise((r) => (queued.resolve = r)); }
    }
    return new Promise((resolve) => {
      const job = { o, resolve };
      if (this.cards.filter((c) => !c.leaving).length < this.stackMax) this.enter(job); else this.queue.push(job);
    });
  }
  clear() { this.queue.forEach((q) => q.resolve("replaced")); this.queue = []; this.cards.slice().forEach((c) => this.leave(c, "replaced", true)); }

  build(o) {
    const k = KINDS[o.kind] || KINDS.info;
    const icon = o.icon === "agent" ? AGENT_ICON
      : `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${o.color || k.color}"/>${GLYPH[k.glyph]}</svg>`;
    let end = "";
    if (o.yes) end = `${o.no ? `<button class="dn-btn no" data-a="no">${esc(o.no)}</button>` : ""}<button class="dn-btn yes" data-a="yes" style="background:${k.yes}">${esc(o.yes)}</button>`;
    else if (o.open) end = `<button class="dn-btn open" data-a="open">${esc(o.button || "Open")}</button>`;
    else if (o.stay) end = `<span class="dn-dot" aria-label="waiting for you"><b></b><i></i></span>`;
    else {
      const ringColor = o.icon === "agent" ? "#fff" : k.color;
      const state = o.icon === "agent" ? `<g transform="rotate(90 12 12)">${GLYPH[k.glyph].replaceAll("#000", k.color)}</g>` : "";
      end = `<svg class="dn-ring" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="2.2"/><circle class="dn-arc" cx="12" cy="12" r="10" fill="none" stroke="${ringColor}" stroke-width="2.2" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"/>${state}</svg>`;
    }
    const el = document.createElement("div");
    el.className = "dn-content";
    el.setAttribute("role", "status");
    el.innerHTML = `<span class="dn-icon">${icon}</span><span class="dn-text"><span class="dn-title">${esc(o.title)}</span>${o.detail ? `<span class="dn-detail">${esc(o.detail)}</span>` : ""}</span><span class="dn-end">${end}</span>`;
    return el;
  }
  measure(el) {
    const max = Math.min(640 * this.s, this.cw - 16 * this.s);
    el.classList.add("dn-measure", "dn-free");
    el.style.maxWidth = `${max}px`;
    this.root.append(el);
    const w = Math.min(Math.ceil(el.getBoundingClientRect().width) + 1, max);
    el.classList.remove("dn-free");
    el.style.width = `${w}px`; el.style.maxWidth = "";
    const h = Math.max(Math.ceil(el.getBoundingClientRect().height), 50 * this.s);
    el.classList.remove("dn-measure");
    el.style.height = `${h}px`;
    return { w, h };
  }
  radius(h) { return h <= 56 * this.s ? h / 2 : 24 * this.s; }
  ys() {
    let y = this.top; const out = [];
    for (const c of this.cards) { out.push(y); if (!c.leaving) y += c.h + this.gap; }
    return out;
  }
  layout(animate = true) {
    const ys = this.ys();
    this.cards.forEach((c, i) => {
      if (c.leaving) return;
      const x = (this.cw - c.w) / 2, y = ys[i];
      for (const el of [c.pill, c.el]) {
        el.style.transition = animate && !reduced() ? "top .42s cubic-bezier(.32,1.25,.5,1), left .3s ease, width .42s cubic-bezier(.32,1.25,.5,1), height .42s cubic-bezier(.32,1.25,.5,1), border-radius .42s ease" : "none";
        el.style.left = `${x}px`; el.style.top = `${y}px`;
      }
      c.pill.style.width = `${c.w}px`; c.pill.style.height = `${c.h}px`; c.pill.style.borderRadius = `${this.radius(c.h)}px`;
      c.y = y;
    });
  }
  enter(job) {
    const { o } = job;
    const el = this.build(o);
    const { w, h } = this.measure(el);
    const pill = document.createElement("div"); pill.className = "dn-pill";
    this.goo.append(pill); this.root.append(el);
    const prev = this.cards.filter((c) => !c.leaving).at(-1);
    const c = { o, el, pill, w, h, resolve: job.resolve, leaving: false };
    this.cards.push(c);
    const y = this.ys()[this.cards.length - 1], x = (this.cw - w) / 2;
    const fromY = prev ? prev.y + prev.h : this.nh;
    const d = 22 * this.s, cx = this.cw / 2;
    Object.assign(pill.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${this.radius(h)}px` });
    Object.assign(el.style, { left: `${x}px`, top: `${y}px` });
    const done = () => { el.style.opacity = 1; this.arm(c); };
    if (reduced()) {
      pill.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }).onfinish = done;
    } else {
      const circ = (top, sx = 1, sy = 1) => ({ left: `${cx - (d * sx) / 2}px`, top: `${top}px`, width: `${d * sx}px`, height: `${d * sy}px`, borderRadius: `${d}px` });
      pill.animate([
        { ...circ(fromY - d * 0.9), offset: 0 },
        { ...circ(fromY + 2 * this.s, 0.9, 1.15), offset: 0.3, easing: "cubic-bezier(.5,0,.7,.4)" },
        { ...circ(y + (h - d) / 2, 1.08, 0.94), offset: 0.48, easing: "cubic-bezier(.2,.7,.3,1)" },
        { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${this.radius(h)}px`, offset: 1 },
      ], { duration: 820, easing: "cubic-bezier(.3,1.35,.45,1)" });
      el.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 260, delay: 520, easing: "ease-out", fill: "backwards" }).onfinish = done;
    }
    c.y = y;
    el.addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]")?.dataset.a;
      if (a === "open") return this.leave(c, "open");
      if (a) return this.leave(c, a);
      this.leave(c, o.yes ? "timeout" : "click");
    });
    el.addEventListener("pointerenter", () => { c.hover = true; c.timer?.pause(); });
    el.addEventListener("pointerleave", () => { c.hover = false; if (c.timer && c.timer.playState === "paused") c.timer.play(); });
  }
  arm(c) {
    const o = c.o;
    const timed = !(o.stay || o.yes) || o.timed;
    c.timer?.cancel();
    if (!timed) return;
    const arc = c.el.querySelector(".dn-arc");
    const target = arc || c.el;
    c.timer = target.animate(arc ? [{ strokeDashoffset: 0 }, { strokeDashoffset: 100 }] : [{ opacity: 1 }, { opacity: 1 }], { duration: o.seconds * 1000, fill: "forwards" });
    if (c.hover) c.timer.pause();
    c.timer.onfinish = () => this.leave(c, "timeout");
  }
  replace(c, o) {
    c.resolve("replaced");
    return new Promise((resolve) => {
      c.resolve = resolve; c.o = o;
      const el = this.build(o);
      const { w, h } = this.measure(el);
      const old = c.el;
      this.root.append(el);
      Object.assign(el.style, { left: `${(this.cw - w) / 2}px`, top: `${c.y}px` });
      c.el = el; c.w = w; c.h = h;
      el.addEventListener("click", (e) => {
        const a = e.target.closest("[data-a]")?.dataset.a;
        this.leave(c, a || (o.yes ? "timeout" : "click"));
      });
      el.addEventListener("pointerenter", () => { c.hover = true; c.timer?.pause(); });
      el.addEventListener("pointerleave", () => { c.hover = false; if (c.timer && c.timer.playState === "paused") c.timer.play(); });
      const t = reduced() ? 1 : 220;
      old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: t, fill: "forwards" }).onfinish = () => old.remove();
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: t, fill: "forwards" }).onfinish = () => { el.style.opacity = 1; };
      if (!reduced()) el.querySelector(".dn-icon").animate([{ transform: "scale(.4)" }, { transform: "scale(1.12)" }, { transform: "none" }], { duration: 420, easing: "ease-out" });
      this.layout(true);
      this.arm(c);
    });
  }
  leave(c, result, fast = false) {
    if (c.leaving) return;
    c.leaving = true; c.timer?.cancel();
    c.resolve(result);
    const finish = () => {
      c.pill.remove(); c.el.remove();
      this.cards = this.cards.filter((x) => x !== c);
      this.layout(true);
      const next = this.queue.shift();
      if (next) setTimeout(() => this.enter(next), reduced() ? 0 : 160);
    };
    if (reduced() || fast) {
      c.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fast ? 120 : 180, fill: "forwards" });
      c.pill.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fast ? 120 : 180, fill: "forwards" }).onfinish = finish;
      return;
    }
    const idx = this.cards.indexOf(c);
    const above = this.cards.slice(0, idx).filter((x) => !x.leaving).at(-1);
    const toY = above ? above.y + above.h - 22 * this.s : -22 * this.s;
    const d = 22 * this.s, cx = this.cw / 2;
    c.el.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.94)" }], { duration: 140, fill: "forwards" });
    c.pill.animate([
      { left: `${(this.cw - c.w) / 2}px`, top: `${c.y}px`, width: `${c.w}px`, height: `${c.h}px`, borderRadius: `${this.radius(c.h)}px` },
      { left: `${cx - d / 2}px`, top: `${c.y + (c.h - d) / 2}px`, width: `${d}px`, height: `${d}px`, borderRadius: `${d}px`, offset: 0.45, easing: "cubic-bezier(.5,0,.8,.5)" },
      { left: `${cx - d / 2}px`, top: `${toY}px`, width: `${d * 0.8}px`, height: `${d * 1.2}px`, borderRadius: `${d}px` },
    ], { duration: 560, delay: 60, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).onfinish = finish;
  }
}
export const DRIP_KINDS = KINDS;
