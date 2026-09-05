import type { GitHubRepo } from "@/lib/github";
import { ArrowUpRight01Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function RepoRow({ repo }: { repo: GitHubRepo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-b border-white/[0.08] text-[13px] text-neutral-400 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 sm:-mx-3 sm:px-3 sm:hover:bg-white/5"
    >
      {/* mobile (<640px): stacked */}
      <div className="flex min-h-11 flex-col gap-[5px] py-3.5 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-white">{repo.name}</span>
          <span className="flex items-center gap-2.5 text-xs text-neutral-500">
            <span>{repo.language}</span>
            <span className="flex items-center gap-[5px] text-neutral-300">
              <HugeiconsIcon icon={StarIcon} size={12} />
              {repo.stars}
            </span>
          </span>
        </div>
        <span className="truncate text-xs">{repo.description}</span>
      </div>

      {/* ≥640px: table row (language column only ≥1024px) */}
      <div className="hidden items-center gap-5 py-[13px] sm:grid sm:grid-cols-[150px_minmax(0,1fr)_72px_16px] lg:grid-cols-[150px_minmax(0,1fr)_110px_72px_16px]">
        <span className="font-bold text-white">{repo.name}</span>
        <span className="truncate">{repo.description}</span>
        <span className="hidden text-neutral-500 lg:block">{repo.language}</span>
        <span className="flex items-center justify-end gap-1.5 text-neutral-300">
          <HugeiconsIcon icon={StarIcon} size={12} />
          {repo.stars}
        </span>
        <span className="flex text-neutral-600">
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
        </span>
      </div>
    </a>
  );
}
