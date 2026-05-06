const path = require("path")

const rootDir = __dirname

module.exports = {
  apps: [
    {
      name: "intelliCure-frontend",
      cwd: rootDir,
      script: "npm.cmd",
      args: "run dev:frontend",
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "intelliCure-backend",
      cwd: path.join(rootDir, "AI DOC Backend"),
      script: "npm.cmd",
      args: "start",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
}