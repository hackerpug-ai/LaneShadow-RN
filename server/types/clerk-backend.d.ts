declare module '@clerk/backend' {
  export type ClerkClient = {
    users: {
      updateUser: (
        userId: string,
        params: {
          firstName?: string
          lastName?: string
          emailAddress?: string
        },
      ) => Promise<any>
      getUser: (userId: string) => Promise<any>
    }
  }

  export function createClerkClient(params: { secretKey: string }): ClerkClient
}
