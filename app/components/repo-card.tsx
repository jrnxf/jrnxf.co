type RepoCardProps = {
  repo: {
    url: string
    name: string
    description: string
    primaryLanguage: {
      color: string
      name: string
    }
    stargazerCount: number
  }
}

export const RepoCard = ({ repo }: RepoCardProps) => (
  <a
    href={repo.url}
    rel="noopener noreferrer"
    target="_blank"
    className="p-5 overflow-hidden rounded-lg shadow cursor-pointer bg-[#152528] focus:outline-none focus:ring-2 focus:ring-violet-400"
  >
    <div className="mb-2 text-lg font-semibold text-white truncate sm:text-xl">
      {repo.name}
    </div>
    <div className="mt-1 text-xs font-medium tracking-wide text-zinc-300 line-clamp-1 sm:text-sm">
      {repo.description}
    </div>
    <div className="flex mt-2 text-xs font-medium sm:mt-1 sm:text-sm text-zinc-400">
      <div className="flex items-center">
        <div
          style={{
            background: repo.primaryLanguage.color,
          }}
          className="w-3 h-3 mr-2 rounded-full"
        />
        <div className="mr-3 sm:mr-4">{repo.primaryLanguage.name}</div>
      </div>
      <div className="mr-8">
        <span className="mr-2">⭐️</span>
        {repo.stargazerCount}
      </div>
    </div>
  </a>
)
