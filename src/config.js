export const DEFAULT_REGISTRY_URL =
  "https://raw.githubusercontent.com/sunithvs/petpack/main/registry/index.json";

export function getRegistryUrl(env = process.env) {
  return env.PETPACK_REGISTRY_URL || DEFAULT_REGISTRY_URL;
}
