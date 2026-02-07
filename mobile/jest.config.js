/** Jest config for Expo. Resolves @/ path alias to project root. */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'shared/**/*.{ts,tsx}',
    'features/**/*.{ts,tsx}',
    'entities/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
  ],
};
