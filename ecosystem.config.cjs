const rootDir = __dirname
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"

module.exports = {
  apps: [
    {
      name: "intelliCure-frontend",
      cwd: rootDir,
      script: npmCommand,
      interpreter: "none",
      args: "run start:frontend",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "intelliCure-backend",
      cwd: rootDir,
      script: npmCommand,
      interpreter: "none",
      args: "run start:backend",
      env: {
        NODE_ENV: "production",
        PORT: "4002",
      },
    },
  ],
}