import { ShaderBackground } from '@/components/particle-field';
import { RepoCard } from '@/components/repo-card';
import { SocialLinks } from '@/components/social-links';
import { fetchPinnedRepos, type GitHubRepo } from '@/lib/github';
import { Location01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useState } from 'react';

const AVATAR_URL = '/avatar.jpg';

function Sidebar() {
  return (
    <aside className="flex flex-col items-center text-center xs:flex-row xs:items-center xs:text-left xs:gap-5 xl:flex-col xl:items-start xl:gap-0">
      <img
        src={AVATAR_URL}
        alt="Colby Thomas"
        width={260}
        height={260}
        className="sm:size-30 size-26 shrink-0 rounded-full border border-white/10 object-cover xl:size-48 grayscale"
        loading="eager"
        fetchPriority="high"
      />

      <div className="mt-4 flex flex-col xs:mt-0 xl:mt-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white">colby thomas</h1>
        <a
          href="https://github.com/jrnxf"
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-xs sm:text-sm font-medium text-neutral-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-md"
        >
          @jrnxf
        </a>

        <div className="mt-1 xs:text-xs flex items-center gap-1.5 text-sm text-neutral-400 xl:mt-2">
          <HugeiconsIcon icon={Location01Icon} size={14} />
          vila chã, portugal
        </div>

        <div className="mt-2 xl:mt-4">
          <SocialLinks />
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);

  useEffect(() => {
    void fetchPinnedRepos().then(setRepos);
  }, []);

  return (
    <>
      <ShaderBackground />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col xl:flex-row xl:gap-12 gap-8 px-4 py-4 sm:px-6 xl:py-16">
        <Sidebar />

        <main className="flex-1 min-w-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {repos.map((repo) => (
              <RepoCard key={repo.name} repo={repo} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
