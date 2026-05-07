import { getRegistryUrl } from "./config.js";
import { validateRegistry } from "./validate.js";

async function fetchOk(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, options);

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return response;
}

export class RegistryClient {
  constructor({ registryUrl = getRegistryUrl(), fetchImpl = fetch } = {}) {
    this.registryUrl = registryUrl;
    this.fetchImpl = fetchImpl;
  }

  async fetchRegistry() {
    const response = await fetchOk(this.fetchImpl, this.registryUrl);
    const registry = await response.json();
    const pets = validateRegistry(registry);
    return { ...registry, pets };
  }

  async findPet(slug) {
    const registry = await this.fetchRegistry();
    return registry.pets.find((pet) => pet.id === slug) || null;
  }

  async fetchJson(url) {
    const response = await fetchOk(this.fetchImpl, url);
    return response.json();
  }

  async fetchBuffer(url) {
    const response = await fetchOk(this.fetchImpl, url);
    return Buffer.from(await response.arrayBuffer());
  }

  async checkRemoteFile(url) {
    const response = await this.fetchImpl(url, { method: "HEAD" });
    if (response.status === 405 || response.status === 501) {
      const fallback = await this.fetchImpl(url, { method: "GET" });
      return fallback.ok;
    }
    return response.ok;
  }
}
