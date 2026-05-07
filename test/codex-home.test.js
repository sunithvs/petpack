import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { resolveCodexHome, resolvePetInstallDir, resolvePetsDir } from "../src/codex-home.js";

test("resolveCodexHome uses CODEX_HOME when set", () => {
  assert.equal(resolveCodexHome({ CODEX_HOME: "/tmp/custom-codex" }), "/tmp/custom-codex");
});

test("resolveCodexHome falls back to ~/.codex", () => {
  assert.equal(resolveCodexHome({}), path.join(os.homedir(), ".codex"));
});

test("resolvePetInstallDir appends pets and slug", () => {
  const env = { CODEX_HOME: "/tmp/custom-codex" };
  assert.equal(resolvePetsDir(env), "/tmp/custom-codex/pets");
  assert.equal(resolvePetInstallDir("firetail", env), "/tmp/custom-codex/pets/firetail");
});
