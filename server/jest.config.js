module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    '!node_modules/**'
  ]
};
