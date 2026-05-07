# Petpack PRD

## Goal

Petpack should make Codex pet installation feel like installing an npm package: quick, scriptable, and easy to trust.

## V1 Scope

- Provide an npm CLI exposed as `petpack`.
- Use a GitHub-backed registry for pet metadata and assets.
- Install existing completed pet packages into the local Codex pets directory.
- Validate pet manifests and spritesheet dimensions before installing.
- Avoid pet generation, uploads, accounts, and paid registry features in v1.

## User Flow

```bash
npx petpack list
npx petpack preview firetail
npx petpack install firetail
```

Then in Codex:

```text
Settings -> Appearance / Pets -> Select Firetail -> /pet
```

## Pet Package Contract

```text
registry/
  index.json
  pets/
    firetail/
      pet.json
      spritesheet.webp
```

`pet.json`:

```json
{
  "id": "firetail",
  "displayName": "Firetail",
  "description": "A tiny friendly flame-tailed lizard companion.",
  "spritesheetPath": "spritesheet.webp"
}
```

The expected spritesheet size is 1536 x 1872 px.
