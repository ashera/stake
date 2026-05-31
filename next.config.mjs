import { execSync } from "node:child_process";

// Version stamp shown in the footer. Computed at build time and inlined via env.
// build number = git commit count (auto-increments each commit); commit = short
// SHA. Falls back to Railway's git env var (and "dev") when git isn't available.
function git(args, fallback) {
  try {
    return execSync(`git ${args}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return fallback;
  }
}

const railwaySha = (process.env.RAILWAY_GIT_COMMIT_SHA || "").slice(0, 7);
const COMMIT_ID = git("rev-parse --short HEAD", railwaySha || "dev");
const BUILD_NUMBER = git("rev-list --count HEAD", "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BUILD_NUMBER,
    COMMIT_ID,
    BUILT_AT: new Date().toISOString().slice(0, 10),
  },
};

export default nextConfig;
