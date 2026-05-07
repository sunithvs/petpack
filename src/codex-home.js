import os from "node:os";
import path from "node:path";

export function resolveCodexHome(env = process.env) {
  return env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

export function resolvePetsDir(env = process.env) {
  return path.join(resolveCodexHome(env), "pets");
}

export function resolvePetInstallDir(slug, env = process.env) {
  return path.join(resolvePetsDir(env), slug);
}
