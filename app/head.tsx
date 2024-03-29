import { META_DEFAULTS } from '~/utils/constants'

export default function Head() {
  return (
    <>
      <title>jrnxf.co</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />

      <meta charSet="utf-8" />
      <meta name="theme-color" content="#000000" />
      <meta
        name="description"
        content={META_DEFAULTS.DESCRIPTION}
        key="description"
      />
      <meta
        property="og:image"
        content={META_DEFAULTS.OG_IMAGE}
        key="og:image"
      />
      <meta property="og:title" content="jrnxf.co" key="og:title" />
      <meta property="og:site_name" content="jrnxf.co" key="og:site_name" />
      <meta property="og:url" content="https://jrnxf.co" key="og:url" />
      <meta
        property="og:description"
        content={META_DEFAULTS.DESCRIPTION}
        key="og:description"
      />
      <meta property="og:type" content="website" />

      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon_x192.png" />
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌱</text></svg>"
      />
      {/* PWACompat is a library that brings the Web App Manifest to non-compliant browsers for better Progressive Web Apps. This mostly means creating splash screens and icons for Mobile Safari, as well as supporting IE/Edge's Pinned Sites feature. */}
      <script async src="https://unpkg.com/pwacompat" crossOrigin="anonymous" />
    </>
  )
}
