# Handoff: jrnxf.co terminal redesign (option 1a + mobile 3a/3b)

## Overview

Redesign of the jrnxf.co landing page as a full-screen "terminal" over the existing WebGL noise shader. Same content as today (name, handle, location, socials, five GitHub repos) plus a one-line bio and a mail CTA. The shader now reacts to the cursor/touch.

## About the design files

`Redesign.dc.html`, `shader.js`, `repos.js`, `icons.js` are **HTML design references**, not production code. Recreate them in the existing codebase (TanStack Start + React 19 + Tailwind v4, Geist via @fontsource, @hugeicons/react). Option **1a** is the desktop target; **3a/3b** show the mobile layout. Ignore 1b, 1c, 2a–2c.

## Fidelity

High-fidelity. Match sizes, colors and spacing below exactly.

## Repo mapping

- `src/App.tsx` — replace Sidebar + card grid with the terminal layout below.
- `src/components/repo-card.tsx` — replace with a `RepoRow` (table row on desktop, stacked on mobile).
- `src/components/particle-field.tsx` — add mouse uniforms (see "Shader changes"). Keep the inline boot script pattern.
- `src/components/social-links.tsx` — keep; render at 16px with gap 22px inside the `open` line.
- `src/lib/github.ts` — unchanged; sort repos by stars desc in App.
- `src/index.css` — add `@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}`.

## Layout (desktop, ≥1024px)

Full viewport, `font-mono` everywhere, background #000 with the fixed shader canvas behind (z-0). Content: `relative z-10 min-h-dvh flex flex-col`, padding `40px 56px 48px` (`pt-10 px-14 pb-12`).

1. **Status line** — `flex justify-between text-xs text-neutral-500 tracking-[0.02em]`: left `colby@jrnxf ~`, right `vila chã, portugal · wet+1`.
2. **Prompt `whoami`** — `mt-14 flex gap-3 text-sm text-neutral-400`; the `❯` glyph is the accent color.
3. **Identity block** — `mt-4 pl-[26px] flex flex-col gap-2.5`:
   - h1 `colby thomas`: 40px / line-height 1 / 700 / #fff / letter-spacing -0.02em.
   - `@jrnxf` link inline after the name (`items-baseline gap-4`), 14px, #737373, hover #fff → https://github.com/jrnxf.
   - Bio p: 14px, line-height 1.7, #a1a1a1, max-width 560px. **Placeholder copy — replace:** "software engineer. i build small, fast tools for the terminal and the web, mostly in rust, go and typescript."
4. **Prompt `ls ~/repos --sort stars`** — `mt-11`, same prompt styling.
5. **Repo table** — `mt-3.5 ml-[26px] flex flex-col border-t border-white/[0.08]`. Each row is an `<a target=_blank>`:
   - grid `150px minmax(0,1fr) 110px 72px 16px`, `gap-5 items-center`, padding `13px 12px`, `mx-[-12px]`, `border-b border-white/[0.08]`, 13px, #a1a1a1; hover bg `rgba(255,255,255,0.05)`, 150ms.
   - cells: name (700, #fff) · description (truncate) · language (#737373) · stars right-aligned with `StarIcon` 12px, #d4d4d4 · `ArrowUpRight01Icon` 14px #525252.
6. **Footer block** — `mt-auto flex flex-col gap-4`, three prompt lines (14px):
   - `❯ mail  hi@jrnxf.co` — link #fff with 1px bottom border in accent; hover text accent. **Replace the address.**
   - `❯ open  [5 social icons]` — icons 16px, gap 22px, #737373 → hover #fff, ml-1.
   - `❯ ▍` — cursor: inline-block 9×17px #e5e5e5, `animation: blink 1.1s steps(1) infinite`.

## Layout (mobile, <640px) — 3a/3b

One column, padding `22px` horizontally, safe-area top. Status line shortens to `vila chã, pt`. h1 30px/1.05. Bio 13px/1.7. Prompt indent 22px. Repo rows become stacked: line 1 `name` (700 #fff) … `lang · ★ stars` (12px), line 2 description (12px, truncate); rows ≥44px tall, padding 14px 0. `mail` becomes a full-width 48px bordered button (`border-white/[0.14] rounded-lg bg-black/40`, arrow in accent on the right). `open` becomes a 5-column grid of 48px bordered square buttons (`border-white/10 rounded-lg bg-black/40`, icons 20px #a1a1a1). Cursor line last. Between 640 and 1024px keep the desktop structure but drop the language column and let descriptions truncate.

## Interactions

- All repo/social/mail links open in new tab (`rel=noopener noreferrer`), same focus ring as today (`focus-visible:ring-2 ring-white/20`).
- Row hover: background fade 150ms. Link hover: color 150–200ms.
- Shader: pointer position warps and brightens the field (below). On touch devices use `pointermove`/`touchmove` on the body; no hover fallbacks needed.
- Optional: type the prompt commands on first load (not in the mock; skip unless wanted).

## Shader changes (particle-field.tsx)

Add uniforms `uMouse` (vec2, 0–1, y up) and `uMouseStrength` (float, 0–1). After computing `uvA`:

```glsl
vec2 m=vec2(uMouse.x*aspect,uMouse.y);
vec2 dm=uvA-m;float dist=length(dm);
float pull=exp(-dist*dist*6.0)*uMouseStrength;
uvA+=normalize(dm+1e-4)*pull*0.35;
uvA+=vec2(snoise(vec3(uvA*3.0,t*0.3)),snoise(vec3(uvA*3.0+7.0,t*0.3)))*pull*0.25;
```

and after `intensity*=0.30;` add `intensity+=pull*0.28;`. In the boot script: init `uMouse=(-10,-10)`, `uMouseStrength=0`; on `pointermove` set target = (clientX/innerWidth, 1-clientY/innerHeight), strength 1; on `pointerleave` strength 0; each frame lerp position by 0.08 and strength by 0.06 before drawing. Full reference fragment shader is in `shader.js` in this folder.

## Design tokens

- Background #000. Text: #fff (primary), #e5e5e5 (cursor), #d4d4d4 (stars), #a1a1a1 (body), #737373 (muted), #525252 (arrow).
- Accent: `oklch(0.78 0.12 25)` (coral) — prompt glyph, mail underline, mobile arrow. Add as `--color-accent` in `@theme`.
- Hairlines: `rgba(255,255,255,0.08)`; mobile button borders 0.10–0.14.
- Type: Geist Mono 400/700 (Geist Sans no longer used on this page — you can drop those font loads). Sizes 11/12/13/14/40 desktop; 11/12/13/14/30 mobile.
- Radii: 8px (mobile buttons). No shadows.

## Assets

- Avatar is not used in 1a (kept in 2b only). Icons: @hugeicons/core-free-icons — StarIcon, ArrowUpRight01Icon, GithubIcon, Linkedin01Icon, InstagramIcon, NewTwitterIcon, YoutubeIcon.

## Files

- `Redesign.dc.html` — all options; 1a is the desktop target, 3a/3b the mobile mocks.
- `shader.js` — ported shader with the interactive uniforms.
- `repos.js`, `icons.js` — data/icon helpers for the mock only.
