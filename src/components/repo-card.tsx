import type { GitHubRepo } from "@/lib/github";
import { ArrowUpRight, GitFork, Star } from "lucide-react";

export function RepoCard({ repo }: { repo: GitHubRepo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 p-4 backdrop-blur-sm transition-[translate,border-color,background-color] duration-300 ease-out hover:-translate-y-1 focus-visible:-translate-y-1 hover:border-white/[0.12] focus-visible:border-white/[0.12] hover:bg-black/50 focus-visible:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate font-mono text-sm font-bold text-white">{repo.name}</h3>
        <ArrowUpRight
          size={14}
          className="mt-0.5 flex-shrink-0 text-neutral-600 transition-[translate,color] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:text-white"
        />
      </div>

      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-400 truncate">
        {repo.description}
      </p>

      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-neutral-300">
            <Star size={12} className="text-neutral-300" />
            {repo.stars}
          </span>
          {repo.forks > 0 && (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <GitFork size={12} />
              {repo.forks}
            </span>
          )}
        </div>
        <span className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
          {repo.language}
        </span>
      </div>
    </a>
  );
}
