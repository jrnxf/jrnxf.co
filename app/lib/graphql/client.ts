import { GraphQLClient } from 'graphql-request'

export const gh_gql_client = new GraphQLClient(
  'https://api.github.com/graphql',
).setHeaders({
  Authorization: `bearer ${process.env.PERSONAL_GITHUB_TOKEN}`,
})
