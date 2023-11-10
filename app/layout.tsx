import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { SocialLinks } from '~/components/social-links'
import '~/styles/global.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head />
      <body className="bg-[#0f1c1e] text-zinc-100">
        <main className="flex flex-col justify-between max-w-5xl min-h-screen p-4 mx-auto sm:p-6">
          {children}
          <footer className="mt-8">
            {/* @ts-ignore – this type is fine. i think there is a bug in the ts compiler atm */}
            <SocialLinks />
          </footer>
        </main>
      </body>
    </html>
  )
}
