import { HugeiconsIcon } from '@hugeicons/react'
import {
  StarIcon,
  GitForkIcon,
  ArrowUpRight01Icon,
} from '@hugeicons/core-free-icons'
import type { Repo } from '@/data/repos'

export function CardDesign4({ repo }: { repo: Repo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Gradient top bar */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${repo.languageColor}, ${repo.languageColor}66)`,
        }}
      />
      <div className="px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-white">
              {repo.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">
              {repo.description}
            </p>
          </div>
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            size={14}
            className="ml-2 mt-0.5 flex-shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-400"
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-xs font-medium text-zinc-300">
              <HugeiconsIcon
                icon={StarIcon}
                size={12}
                className="text-amber-500/70"
              />
              {repo.stars}
            </span>
            {repo.forks && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <HugeiconsIcon icon={GitForkIcon} size={12} />
                {repo.forks}
              </span>
            )}
          </div>
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{
              backgroundColor: `${repo.languageColor}18`,
              color: repo.languageColor,
            }}
          >
            {repo.language}
          </span>
        </div>
      </div>
    </a>
  )
}
