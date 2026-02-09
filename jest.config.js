export default {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/src/**/*.test.js'],
  verbose: true,
  moduleNameMapper: {
    '^(\\.\\.\\.?\\/.+)\\.js$': '$1',
  },
};