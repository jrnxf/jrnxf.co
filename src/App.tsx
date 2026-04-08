import { lazy, Suspense } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Location01Icon } from '@hugeicons/core-free-icons'
import { pinnedRepos } from '@/data/repos'
import { SocialLinks } from '@/components/social-links'
import { RepoCard } from '@/components/repo-card'

const ShaderBackground = lazy(() =>
  import('@/components/particle-field').then((m) => ({
    default: m.ShaderBackground,
  })),
)

const AVATAR_URL = '/avatar.jpg'

function Hero() {
  return (
    <header className="flex flex-col items-center text-center">
      <div className="group relative">
        <img
          src={AVATAR_URL}
          alt="Colby Thomas"
          width={260}
          height={260}
          className="relative h-28 w-28 rounded-full border border-white/10 object-cover sm:h-36 sm:w-36 grayscale"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Colby Thomas
      </h1>
      <a
        href="https://github.com/jrnxf"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
      >
        @jrnxf
      </a>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
        should probably be sleeping
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-sm text-neutral-400">
        <HugeiconsIcon
          icon={Location01Icon}
          size={14}
        />
        Vila Cha, Portugal
      </div>

      <div className="mt-6">
        <SocialLinks />
      </div>
    </header>
  )
}

export default function App() {
  return (
    <>
      <Suspense>
        <ShaderBackground />
      </Suspense>
      <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-16 sm:px-6 sm:py-24">
        <Hero />

        <section className="mt-14 sm:mt-20">
          <h2 className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Open Source
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedRepos.map((repo) => (
              <RepoCard key={repo.name} repo={repo} />
            ))}
          </div>
        </section>

        <footer className="mt-auto pt-20 text-center text-[11px] text-neutral-600">
          built with questionable sleep habits
        </footer>
      </main>
    </>
  )
}
