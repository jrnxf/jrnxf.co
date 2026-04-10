interface Env {
  GITHUB_TOKEN: string;
}

const OWNER = 'jrnxf';
const REPOS = ['thokr', 'gh-eco', 'fsrx', 'dot', 'une.haus'];
const CACHE_TTL = 600;

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const results = await Promise.all(
    REPOS.map(async (name) => {
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${name}`, {
        headers: {
          Authorization: `token ${env.GITHUB_TOKEN}`,
          'User-Agent': 'jrnxf-worker',
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Record<string, unknown>;
      return {
        name: data.name,
        url: data.html_url,
        description: data.description ?? '',
        language: data.language ?? '',
        stars: data.stargazers_count,
        forks: data.forks_count,
      };
    }),
  );

  return new Response(JSON.stringify(results.filter(Boolean)), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_TTL}`,
    },
  });
};
