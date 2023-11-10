import Image from 'next/image'

import { RepoCard } from '~/components/repo-card'
import { gh_gql_client } from '~/lib/graphql/client'
import { GetUserFromGithub } from '~/lib/graphql/queries'

export const revalidate = 30 // cache for 30 seconds

async function getGhData() {
  return await gh_gql_client.request(GetUserFromGithub, { login: 'jrnxf' })
}

export default async function HomePage() {
  const { user } = await getGhData()

  return (
    <div className="w-full">
      <div className="flex flex-col items-center">
        <div className="flex items-center">
          <div className="relative mr-3 overflow-hidden rounded-lg h-14 w-14 sm:h-16 sm:w-16">
            {/* @ts-ignore – this type is fine. i think there is a bug in the ts compiler atm */}
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={256}
              height={256}
              priority
            />
          </div>
          <div className="flex flex-col items-start">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <a
              href="https://github.com/jrnxf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold rounded-md sm:text-base text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              @<span className="hover:underline">{user.login}</span>
            </a>
          </div>
        </div>
      </div>
      <div className="mt-4 sm:mt-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 ">
          {user?.pinnedItems?.nodes.map((repo: any) => (
            //  @ts-ignore – this type is fine. i think there is a bug in the ts compiler atm
            <RepoCard repo={repo} key={repo.id} />
          ))}
        </div>
      </div>
    </div>
  )
}
