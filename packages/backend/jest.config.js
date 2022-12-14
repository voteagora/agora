/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/src/setupTests.ts"],
  reporters: ["default", ["jest-junit", { outputDirectory: "dist/reports" }]],
};
