import test from "node:test";
import assert from "node:assert/strict";
import { RegistryClient } from "../src/registry.js";

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  });
}

test("RegistryClient fetches and validates registry", async () => {
  const client = new RegistryClient({
    registryUrl: "https://example.com/index.json",
    fetchImpl: async () =>
      jsonResponse({
        pets: [
          {
            id: "firetail",
            displayName: "Firetail",
            description: "A tiny pet.",
            assets: {
              manifest: "https://example.com/pet.json",
              spritesheet: "https://example.com/spritesheet.webp"
            }
          }
        ]
      })
  });

  const registry = await client.fetchRegistry();

  assert.equal(registry.pets[0].id, "firetail");
});

test("RegistryClient finds pets by slug", async () => {
  const client = new RegistryClient({
    registryUrl: "https://example.com/index.json",
    fetchImpl: async () =>
      jsonResponse({
        pets: [
          {
            id: "firetail",
            displayName: "Firetail",
            description: "A tiny pet.",
            assets: {
              manifest: "https://example.com/pet.json",
              spritesheet: "https://example.com/spritesheet.webp"
            }
          }
        ]
      })
  });

  assert.equal((await client.findPet("firetail")).displayName, "Firetail");
  assert.equal(await client.findPet("missing"), null);
});
