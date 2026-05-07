import fs from "node:fs/promises";
import path from "node:path";
import { resolvePetInstallDir } from "./codex-home.js";
import {
  validatePetManifest,
  validateSlug,
  validateSpritesheetDimensions
} from "./validate.js";

export async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function installPet({ slug, client, force = false, env = process.env }) {
  validateSlug(slug);

  const entry = await client.findPet(slug);
  if (!entry) {
    throw new Error(`Pet "${slug}" was not found in the registry.`);
  }

  const manifest = validatePetManifest(await client.fetchJson(entry.assets.manifest), slug);
  const spritesheet = await client.fetchBuffer(entry.assets.spritesheet);
  validateSpritesheetDimensions(spritesheet);

  const installDir = resolvePetInstallDir(slug, env);

  if ((await pathExists(installDir)) && !force) {
    throw new Error(`Pet "${slug}" is already installed. Re-run with --force to overwrite it.`);
  }

  const spritesheetPath = path.join(installDir, manifest.spritesheetPath);
  await fs.mkdir(path.dirname(spritesheetPath), { recursive: true });
  await fs.writeFile(path.join(installDir, "pet.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(spritesheetPath, spritesheet);

  return { entry, manifest, installDir };
}

export async function listInstalledPets(env = process.env) {
  const petsDir = path.dirname(resolvePetInstallDir("placeholder", env));

  try {
    const entries = await fs.readdir(petsDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
