export const socialLoginRequestsMock = {
    google: {
      getUserData: jest.fn().mockResolvedValue({ name: 'mock-username', email: 'mock-email' }),
      revokeToken: jest.fn().mockResolvedValue(true)
    },
    github: {
      getUserData: jest.fn(),
      getUserPrimaryEmail: jest.fn(),
      revokeToken: jest.fn()
    },
    linkedin: {
      getUser: jest.fn(),
      revokeToken: jest.fn()
    }
  }