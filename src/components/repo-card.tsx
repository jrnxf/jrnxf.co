import { HugeiconsIcon } from '@hugeicons/react'
import {
  StarIcon,
  GitForkIcon,
  ArrowUpRight01Icon,
} from '@hugeicons/core-free-icons'
import type { Repo } from '@/data/repos'

export function RepoCard({ repo }: { repo: Repo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate font-mono text-sm font-bold text-white">
          {repo.name}
        </h3>
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          size={14}
          className="mt-0.5 flex-shrink-0 text-neutral-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
        />
      </div>

      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-400">
        {repo.description}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-neutral-300">
            <HugeiconsIcon
              icon={StarIcon}
              size={12}
              className="text-neutral-400"
            />
            {repo.stars}
          </span>
          {repo.forks && (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <HugeiconsIcon icon={GitForkIcon} size={12} />
              {repo.forks}
            </span>
          )}
        </div>
        <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-400">
          {repo.language}
        </span>
      </div>
    </a>
  )
}
