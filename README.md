# Deezify

Deezify is a small Bun-based patcher that modifies the Deezer desktop `app.asar` to inject a custom script and enable developer mode.

## Features

- Backs up the original `app.asar` before patching (with timestamped folders).
- Extracts Deezer's `app.asar`, injects a script tag into `build/index.html`, and writes a bundled `deezify.js` payload.
- Enables Deezer's developer mode by rewriting the relevant JavaScript.

## Requirements

- **OS**: Currently only Windows is supported (uses `%LOCALAPPDATA%\\Programs\\deezer-desktop`).
- **Runtime**: [Bun](https://bun.sh) `>= 1.3.x`.
- **Node/npm**: Only needed for installing dependencies, not for running the CLI.

## Installation

Clone the repository and install dependencies:

```bash
bun install
```

Build the CLI and browser payload:

```bash
bun run build
```

This outputs compiled files into `dist/` and wires the CLI entry at `dist/cli.js`.

## Usage

### Patch Deezer

From the project root, run:

```bash
bun run patch
```

This will:

1. Locate the Deezer installation under `%LOCALAPPDATA%\\Programs\\deezer-desktop`.
2. Extract `resources\\app.asar` into a temporary folder.
3. Inject a `<script src="./deezify.js"></script>` tag into `build/index.html`.
4. Write the bundled `deezify.js` script into the extracted build folder.
5. Enable developer mode by rewriting Deezer's JS bundle.
6. Repack the folder into `app.asar` and overwrite the original.

If you prefer to execute the compiled CLI directly:

```bash
cd dist
bun run .\\cli.js
```

Once published globally (e.g. via `npm` or `bun`), you can also use the `deezify` binary defined in `package.json`.

## Backups

Backups are stored under the system-specific data directory returned by `env-paths` for the app name `Deezify`. On Windows this is typically something like:

```text
C:\\Users\\<you>\\AppData\\Roaming\\Deezify\\<YYMM.DD.HHMM>[-patched]\\app.asar
```

- `-patched` is appended if the current `app.asar` already contains the injected `deezify.js` script.

## Development

- Source entrypoints:
  - CLI: `src/cli.ts`
  - Injected script: `src/inject/main.ts`
- Build script: `build.ts` (uses Bun's `build()` API).
- Utility helpers in `src/utils/` handle Deezer install path discovery, backup, and dev-mode bypass.

Run ESLint (with auto-fix) over the sources:

```bash
bun run validate
```

## Limitations

- Only Deezer desktop on Windows (default installation path) is supported.
- Other platforms (macOS, Linux) are not implemented in `install-path.ts`.
- Use at your own risk; patching `app.asar` may be against Deezer's terms of service.
