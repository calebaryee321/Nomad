module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
  },
};
