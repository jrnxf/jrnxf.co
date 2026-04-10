/// <reference types="vite/client" />
import type { ReactNode } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "@/index.css?url";
import geistSans400 from "@fontsource/geist-sans/latin-400.css?url";
import geistSans500 from "@fontsource/geist-sans/latin-500.css?url";
import geistSans600 from "@fontsource/geist-sans/latin-600.css?url";
import geistSans700 from "@fontsource/geist-sans/latin-700.css?url";
import geistMono700 from "@fontsource/geist-mono/latin-700.css?url";
import geistSans400Woff2 from "@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff2?url";
import geistSans500Woff2 from "@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff2?url";
import geistSans600Woff2 from "@fontsource/geist-sans/files/geist-sans-latin-600-normal.woff2?url";
import geistSans700Woff2 from "@fontsource/geist-sans/files/geist-sans-latin-700-normal.woff2?url";
import geistMono700Woff2 from "@fontsource/geist-mono/files/geist-mono-latin-700-normal.woff2?url";
import { SHADER_BOOT_SCRIPT } from "@/components/particle-field";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "jrnxf.co" },
      { name: "description", content: "the internet nook of colby thomas" },
      { name: "theme-color", content: "#09090b" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "jrnxf.co" },
      {
        property: "og:description",
        content: "the internet nook of colby thomas",
      },
      { property: "og:url", content: "https://jrnxf.co" },
      { property: "og:site_name", content: "jrnxf.co" },
      {
        property: "og:image",
        content:
          "https://avatars.githubusercontent.com/u/21346716?u=792c3f32b15ac3e6427894e576c45d29220f4b26&v=4",
      },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "jrnxf.co" },
      {
        name: "twitter:description",
        content: "the internet nook of colby thomas",
      },
      {
        name: "twitter:image",
        content:
          "https://avatars.githubusercontent.com/u/21346716?u=792c3f32b15ac3e6427894e576c45d29220f4b26&v=4",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: geistSans400 },
      { rel: "stylesheet", href: geistSans500 },
      { rel: "stylesheet", href: geistSans600 },
      { rel: "stylesheet", href: geistSans700 },
      { rel: "stylesheet", href: geistMono700 },
      {
        rel: "preload",
        href: geistSans400Woff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: geistSans500Woff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: geistSans600Woff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: geistSans700Woff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: geistMono700Woff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "preload", href: "/avatar.webp", as: "image", type: "image/webp" },
      {
        rel: "icon",
        href: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌱</text></svg>",
      },
      { rel: "apple-touch-icon", href: "/icon_x192.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{ background: "#000" }}>
      <head>
        <HeadContent />
      </head>
      <body>
        <canvas
          id="dither-bg"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
          aria-hidden="true"
        />
        <script dangerouslySetInnerHTML={{ __html: SHADER_BOOT_SCRIPT }} />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
