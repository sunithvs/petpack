import { constants } from "node:fs";
import fs from "node:fs/promises";
import { getRegistryUrl } from "./config.js";
import { resolveCodexHome, resolvePetsDir } from "./codex-home.js";
import { installPet, listInstalledPets, pathExists } from "./install.js";
import { RegistryClient } from "./registry.js";
import { validateSlug } from "./validate.js";

function printHelp() {
  console.log(`Petpack

Usage:
  petpack list
  petpack install <pet> [--force]
  petpack preview <pet>
  petpack doctor

Aliases:
  petpack ls
  petpack add <pet> [--force]

Environment:
  PETPACK_REGISTRY_URL  Override the GitHub registry URL
  CODEX_HOME            Override the Codex home directory`);
}

function parseOptions(args) {
  const options = { force: false };
  const positional = [];

  for (const arg of args) {
    if (arg === "--force" || arg === "-f") {
      options.force = true;
    } else {
      positional.push(arg);
    }
  }

  return { positional, options };
}

export async function run(argv = process.argv.slice(2), context = {}) {
  const { positional, options } = parseOptions(argv);
  const command = positional[0];
  const slug = positional[1];
  const env = context.env || process.env;
  const client =
    context.client || new RegistryClient({ registryUrl: getRegistryUrl(env), fetchImpl: context.fetchImpl });

  switch (command) {
    case undefined:
      await listPets(client);
      return;

    case "help":
    case "--help":
    case "-h":
      printHelp();
      return;

    case "list":
    case "ls":
      await listPets(client);
      return;

    case "install":
    case "add":
      if (!slug) {
        throw new Error(`Usage: petpack ${command} <pet> [--force]`);
      }
      await installCommand(slug, client, options, env);
      return;

    case "preview":
      if (!slug) {
        throw new Error("Usage: petpack preview <pet>");
      }
      await previewPet(slug, client);
      return;

    case "doctor":
      await doctor(env);
      return;

    default:
      throw new Error(`Unknown command "${command}". Run petpack help.`);
  }
}

async function listPets(client) {
  const registry = await client.fetchRegistry();

  if (registry.pets.length === 0) {
    console.log("No pets found in the registry.");
    return;
  }

  for (const pet of registry.pets) {
    console.log(`${pet.id.padEnd(18)} ${pet.displayName} - ${pet.description}`);
  }
}

async function installCommand(slug, client, options, env) {
  const result = await installPet({ slug, client, force: options.force, env });

  console.log(`Installed ${result.manifest.displayName} to ${result.installDir}`);
  console.log("");
  console.log("To enable it in Codex:");
  console.log("1. Open Codex Settings.");
  console.log("2. Go to Appearance / Pets.");
  console.log(`3. Select ${result.manifest.displayName}.`);
  console.log("4. Use /pet to wake it.");
}

async function previewPet(slug, client) {
  validateSlug(slug);
  const entry = await client.findPet(slug);

  if (!entry) {
    throw new Error(`Pet "${slug}" was not found in the registry.`);
  }

  const manifestOk = await client.checkRemoteFile(entry.assets.manifest);
  const spritesheetOk = await client.checkRemoteFile(entry.assets.spritesheet);

  console.log(`${entry.displayName} (${entry.id})`);
  console.log(entry.description);
  if (entry.creator) console.log(`Creator: ${entry.creator}`);
  if (Array.isArray(entry.tags) && entry.tags.length > 0) console.log(`Tags: ${entry.tags.join(", ")}`);
  console.log(`pet.json: ${entry.assets.manifest} ${manifestOk ? "[ok]" : "[missing]"}`);
  console.log(`spritesheet.webp: ${entry.assets.spritesheet} ${spritesheetOk ? "[ok]" : "[missing]"}`);
  if (entry.assets.preview) console.log(`preview: ${entry.assets.preview}`);
}

async function doctor(env) {
  const codexHome = resolveCodexHome(env);
  const petsDir = resolvePetsDir(env);
  const installedPets = await listInstalledPets(env);

  console.log(`Node: ${process.version}`);
  console.log(`Registry: ${getRegistryUrl(env)}`);
  console.log(`Codex home: ${codexHome}`);
  console.log(`Pets directory: ${petsDir}`);
  console.log(`Pets directory exists: ${(await pathExists(petsDir)) ? "yes" : "no"}`);

  try {
    await fs.mkdir(petsDir, { recursive: true });
    await fs.access(petsDir, constants.W_OK);
    console.log("Pets directory writable: yes");
  } catch {
    console.log("Pets directory writable: no");
  }

  console.log(`Installed pets: ${installedPets.length > 0 ? installedPets.join(", ") : "none"}`);
}
