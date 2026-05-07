# Petpack

Petpack is an npm CLI for installing Codex digital pets from a GitHub-backed registry.

```bash
npx petpack list
npx petpack install firetail
npx petpack preview firetail
npx petpack doctor
```

## How It Works

Petpack fetches pet metadata from `registry/index.json`, downloads the selected pet package, validates it, and installs it into Codex:

```text
~/.codex/pets/<pet-slug>/
  pet.json
  spritesheet.webp
```

If `CODEX_HOME` is set, Petpack installs into:

```text
$CODEX_HOME/pets/<pet-slug>/
```

## Commands

```bash
petpack list
petpack ls
petpack install <pet> [--force]
petpack add <pet> [--force]
petpack preview <pet>
petpack doctor
```

## Registry

The default registry URL is:

```text
https://raw.githubusercontent.com/sunithvs/petpack/main/registry/index.json
```

Override it during development:

```bash
PETPACK_REGISTRY_URL=http://localhost:8000/registry/index.json petpack list
```

## Enable An Installed Pet

After installation:

1. Open Codex Settings.
2. Go to Appearance / Pets.
3. Select the new pet.
4. Use `/pet` to wake it.

## Development

```bash
npm test
node ./bin/petpack.js doctor
```
