import { HugeiconsIcon } from '@hugeicons/react'
import { Location01Icon } from '@hugeicons/core-free-icons'
import { pinnedRepos } from '@/data/repos'
import { SocialLinks } from '@/components/social-links'
import { RepoCard } from '@/components/repo-card'
import { ShaderBackground } from '@/components/particle-field'

const AVATAR_URL = '/avatar.jpg'

function Sidebar() {
  return (
    <aside className="flex flex-col items-center text-center xs:flex-row xs:items-center xs:text-left xs:gap-5 lg:flex-col lg:items-start lg:gap-0">
      <img
        src={AVATAR_URL}
        alt="Colby Thomas"
        width={260}
        height={260}
        className="size-36 min-h-36 min-w-36 shrink-0 rounded-full border border-white/10 object-cover lg:size-64 lg:min-h-64 lg:min-w-64 grayscale"
        loading="eager"
        fetchPriority="high"
      />

      <div className="mt-4 flex flex-col xs:mt-0 lg:mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Colby Thomas
        </h1>
        <a
          href="https://github.com/jrnxf"
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-sm font-medium text-neutral-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-md"
        >
          @jrnxf
        </a>

        <p className="mt-2 text-sm leading-relaxed text-neutral-400 lg:mt-4">
          should probably be sleeping
        </p>

        <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-400 lg:mt-2">
          <HugeiconsIcon icon={Location01Icon} size={14} />
          Vila Chã, Portugal
        </div>

        <div className="mt-2 lg:mt-4">
          <SocialLinks />
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <>
      <ShaderBackground />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col lg:flex-row gap-10 px-4 py-10 sm:px-6 lg:py-16">
        <div className="lg:sticky lg:top-16 lg:self-start lg:w-72 lg:shrink-0">
          <Sidebar />
        </div>

        <main className="flex-1 min-w-0 @container">
          <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
            {pinnedRepos.map((repo) => (
              <RepoCard key={repo.name} repo={repo} />
            ))}
          </div>
        </main>
      </div>
    </>
  )
}
