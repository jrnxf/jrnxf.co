import { gql } from 'graphql-request'

export const GetUserFromGithub = gql`
  query GetUserFromGithub($login: String!) {
    user(login: $login) {
      login
      avatarUrl
      name
      pinnedItems(first: 6) {
        nodes {
          ... on Repository {
            id
            name
            url
            stargazerCount
            description
            primaryLanguage {
              name
              color
            }
            openGraphImageUrl
            usesCustomOpenGraphImage
          }
        }
      }
    }
  }
`
