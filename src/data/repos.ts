export interface Repo {
  name: string
  url: string
  description: string
  language: string
  languageColor: string
  stars: number
  forks?: number
}

export const pinnedRepos: Repo[] = [
  {
    name: 'thokr',
    url: 'https://github.com/jrnxf/thokr',
    description: 'sleek typing tui with visualized results and historical logging',
    language: 'Rust',
    languageColor: '#dea584',
    stars: 594,
    forks: 17,
  },
  {
    name: 'gh-eco',
    url: 'https://github.com/jrnxf/gh-eco',
    description: 'gh cli extension to explore the ecosystem',
    language: 'Go',
    languageColor: '#00ADD8',
    stars: 467,
    forks: 8,
  },
  {
    name: 'fsrx',
    url: 'https://github.com/jrnxf/fsrx',
    description: 'flow state reading in the terminal',
    language: 'Rust',
    languageColor: '#dea584',
    stars: 310,
    forks: 7,
  },
  {
    name: 'dot',
    url: 'https://github.com/jrnxf/dot',
    description: '#!/bin/shit',
    language: 'Lua',
    languageColor: '#6b6bb8',
    stars: 9,
  },
  {
    name: 'une.haus',
    url: 'https://github.com/jrnxf/une.haus',
    description: 'all things une',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 2,
  },
]
