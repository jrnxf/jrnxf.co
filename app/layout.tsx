import { SocialLinks } from 'app/components'

import '~/styles/global.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head />
      <body className="bg-[#0f1c1e] text-zinc-100">
        <main className="flex flex-col justify-between max-w-5xl min-h-screen p-4 mx-auto sm:p-6">
          {children}
          <footer className="mt-8">
            <SocialLinks />
          </footer>
        </main>
      </body>
    </html>
  )
}
