interface Env {
  GITHUB_TOKEN: string
}

const OWNER = 'jrnxf'
const REPOS = ['thokr', 'gh-eco', 'fsrx', 'dot', 'une.haus']
const CORS_ORIGIN = 'https://jrnxf.co' // also covers api.jrnxf.co since worker serves directly
const CACHE_TTL = 600 // 10 minutes

export default <ExportedHandler<Env>>{
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? ''
    const allowedOrigins = [CORS_ORIGIN, 'http://localhost:5173']
    const corsOrigin = allowedOrigins.includes(origin) ? origin : CORS_ORIGIN

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)

    if (url.pathname !== '/repos') {
      return new Response('Not found', { status: 404, headers: corsHeaders })
    }

    const results = await Promise.all(
      REPOS.map(async (name) => {
        const res = await fetch(
          `https://api.github.com/repos/${OWNER}/${name}`,
          {
            headers: {
              Authorization: `token ${env.GITHUB_TOKEN}`,
              'User-Agent': 'jrnxf-worker',
              Accept: 'application/vnd.github.v3+json',
            },
          },
        )
        if (!res.ok) return null
        const data = (await res.json()) as Record<string, unknown>
        return {
          name: data.name,
          url: data.html_url,
          description: data.description ?? '',
          language: data.language ?? '',
          stars: data.stargazers_count,
          forks: data.forks_count,
        }
      }),
    )

    return new Response(JSON.stringify(results.filter(Boolean)), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
      },
    })
  },
}
