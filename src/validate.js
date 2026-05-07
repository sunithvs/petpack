const REQUIRED_MANIFEST_FIELDS = ["id", "displayName", "description", "spritesheetPath"];
const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function isSafeSlug(value) {
  return typeof value === "string" && SAFE_SLUG_RE.test(value);
}

export function validateSlug(slug) {
  if (!isSafeSlug(slug)) {
    throw new Error(
      `Invalid pet slug "${slug}". Use lowercase letters, numbers, and hyphens only.`
    );
  }
}

export function validateSafeRelativePath(value, fieldName) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }

  if (
    value.startsWith("/") ||
    value.startsWith("\\") ||
    value.includes("..") ||
    value.includes("\\")
  ) {
    throw new Error(`${fieldName} must be a safe relative path.`);
  }
}

export function validatePetManifest(manifest, expectedSlug) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("pet.json must contain a JSON object.");
  }

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (typeof manifest[field] !== "string" || manifest[field].trim() === "") {
      throw new Error(`pet.json is missing required field "${field}".`);
    }
  }

  validateSlug(manifest.id);

  if (expectedSlug && manifest.id !== expectedSlug) {
    throw new Error(`pet.json id "${manifest.id}" does not match requested pet "${expectedSlug}".`);
  }

  validateSafeRelativePath(manifest.spritesheetPath, "spritesheetPath");

  if (!manifest.spritesheetPath.endsWith(".webp")) {
    throw new Error("spritesheetPath must point to a .webp file.");
  }

  return manifest;
}

export function validateRegistryEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error("Registry entry must be an object.");
  }

  for (const field of ["id", "displayName", "description"]) {
    if (typeof entry[field] !== "string" || entry[field].trim() === "") {
      throw new Error(`Registry entry is missing required field "${field}".`);
    }
  }

  validateSlug(entry.id);

  if (entry.tags !== undefined && !Array.isArray(entry.tags)) {
    throw new Error(`Registry entry "${entry.id}" tags must be an array.`);
  }

  if (entry.assets === undefined || typeof entry.assets !== "object" || Array.isArray(entry.assets)) {
    throw new Error(`Registry entry "${entry.id}" must include assets.`);
  }

  for (const field of ["manifest", "spritesheet"]) {
    if (typeof entry.assets[field] !== "string" || entry.assets[field].trim() === "") {
      throw new Error(`Registry entry "${entry.id}" assets.${field} is required.`);
    }
  }

  return entry;
}

export function validateRegistry(registry) {
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    throw new Error("Registry must be a JSON object.");
  }

  if (!Array.isArray(registry.pets)) {
    throw new Error("Registry must include a pets array.");
  }

  return registry.pets.map(validateRegistryEntry);
}

export function readWebpDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 30) {
    return null;
  }

  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }

  const chunkType = buffer.toString("ascii", 12, 16);

  if (chunkType === "VP8X" && buffer.length >= 30) {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }

  if (chunkType === "VP8 " && buffer.length >= 30) {
    const startCode = buffer.toString("hex", 23, 26);
    if (startCode !== "9d012a") return null;
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }

  if (chunkType === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }

  return null;
}

export function validateSpritesheetDimensions(buffer) {
  const dimensions = readWebpDimensions(buffer);

  if (!dimensions) {
    return null;
  }

  if (dimensions.width !== 1536 || dimensions.height !== 1872) {
    throw new Error(
      `spritesheet.webp must be 1536x1872, received ${dimensions.width}x${dimensions.height}.`
    );
  }

  return dimensions;
}
