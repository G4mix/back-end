export const prismaClient = {
    user: {
      findByEmail: jest.fn(),
      findOAuthUser: jest.fn(),
      linkOAuthProvider: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }
  