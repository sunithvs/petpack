import test from "node:test";
import assert from "node:assert/strict";
import { readWebpDimensions, validatePetManifest, validateRegistry, validateSlug } from "../src/validate.js";

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

test("validateSlug accepts safe slugs", () => {
  assert.doesNotThrow(() => validateSlug("firetail"));
  assert.doesNotThrow(() => validateSlug("tiny-lizard-2"));
});

test("validateSlug rejects unsafe slugs", () => {
  assert.throws(() => validateSlug("../firetail"), /Invalid pet slug/);
  assert.throws(() => validateSlug("Firetail"), /Invalid pet slug/);
  assert.throws(() => validateSlug("fire_tail"), /Invalid pet slug/);
});

test("validatePetManifest accepts the Codex pet manifest shape", () => {
  const manifest = {
    id: "firetail",
    displayName: "Firetail",
    description: "A tiny friendly flame-tailed lizard companion.",
    spritesheetPath: "spritesheet.webp"
  };

  assert.equal(validatePetManifest(manifest, "firetail"), manifest);
});

test("validatePetManifest rejects missing fields and unsafe paths", () => {
  assert.throws(
    () => validatePetManifest({ id: "firetail", displayName: "Firetail" }, "firetail"),
    /description/
  );
  assert.throws(
    () =>
      validatePetManifest(
        {
          id: "firetail",
          displayName: "Firetail",
          description: "A tiny pet.",
          spritesheetPath: "../spritesheet.webp"
        },
        "firetail"
      ),
    /safe relative path/
  );
});

test("validateRegistry validates registry entries", () => {
  const pets = validateRegistry({
    pets: [
      {
        id: "firetail",
        displayName: "Firetail",
        description: "A tiny pet.",
        tags: ["lizard"],
        assets: {
          manifest: "https://example.com/pet.json",
          spritesheet: "https://example.com/spritesheet.webp"
        }
      }
    ]
  });

  assert.equal(pets.length, 1);
  assert.equal(pets[0].id, "firetail");
});

test("readWebpDimensions reads VP8X dimensions", () => {
  assert.deepEqual(readWebpDimensions(makeVp8xWebp()), { width: 1536, height: 1872 });
});
