module.exports = {
  testEnvironment: 'node',
  globalSetup: './tests/global.setup.js',
  globalTeardown: './tests/global.teardown.js',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {
    '^.+\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    'shared/**/*.js',
    'api/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};