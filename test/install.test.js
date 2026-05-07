import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { installPet, listInstalledPets } from "../src/install.js";

function makeVp8xWebp(width = 1536, height = 1872) {
  const buffer = Buffer.alloc(30);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(22, 4);
  buffer.write("WEBP", 8, "ascii");
  buffer.write("VP8X", 12, "ascii");
  buffer.writeUInt32LE(10, 16);
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);
  return buffer;
}

function makeClient() {
  const entry = {
    id: "firetail",
    displayName: "Firetail",
    description: "A tiny friendly flame-tailed lizard companion.",
    assets: {
      manifest: "https://example.com/firetail/pet.json",
      spritesheet: "https://example.com/firetail/spritesheet.webp"
    }
  };

  return {
    async findPet(slug) {
      return slug === "firetail" ? entry : null;
    },
    async fetchJson() {
      return {
        id: "firetail",
        displayName: "Firetail",
        description: "A tiny friendly flame-tailed lizard companion.",
        spritesheetPath: "spritesheet.webp"
      };
    },
    async fetchBuffer() {
      return makeVp8xWebp();
    }
  };
}

test("installPet writes pet files into CODEX_HOME", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "petpack-"));
  const env = { CODEX_HOME: tempDir };

  const result = await installPet({ slug: "firetail", client: makeClient(), env });

  assert.equal(result.installDir, path.join(tempDir, "pets", "firetail"));
  assert.equal(
    JSON.parse(await fs.readFile(path.join(result.installDir, "pet.json"), "utf8")).id,
    "firetail"
  );
  assert.equal((await fs.stat(path.join(result.installDir, "spritesheet.webp"))).isFile(), true);
  assert.deepEqual(await listInstalledPets(env), ["firetail"]);
});

test("installPet refuses overwrite unless force is passed", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "petpack-"));
  const env = { CODEX_HOME: tempDir };

  await installPet({ slug: "firetail", client: makeClient(), env });

  await assert.rejects(
    () => installPet({ slug: "firetail", client: makeClient(), env }),
    /already installed/
  );

  await assert.doesNotReject(() =>
    installPet({ slug: "firetail", client: makeClient(), env, force: true })
  );
});
