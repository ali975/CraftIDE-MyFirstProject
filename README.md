# CraftIDE

AI-assisted Minecraft development studio built on Electron + Monaco.

CraftIDE provides code editor, visual/no-code builders, test server automation, and packaging in one desktop app for Paper/Spigot, Fabric, Forge, and Skript workflows.

## What's New (Root Revision Sprint)

- Visual Builder top region is now vertically resizable (`84px` to `360px`) with persisted height (`craftide.vb.topRegionHeight`).
- Visual Builder toolbar was redesigned to single-line priority actions + `More` menu for secondary actions.
- Empty-canvas pan supports `Left Mouse Drag` (plus legacy `Middle Mouse` and `Alt+Left` compatibility).
- `Browse Templates` button and templates modal integration were fixed.
- 12 new Visual Builder templates added across Plugin/Fabric/Forge/Skript.
- Visual Builder EN/TR dynamic i18n coverage expanded for toolbar/no-code UI/node parameter labels.
- New centralized keyboard shortcut system added:
  - global + context registry,
  - conflict warning,
  - per-command reset + reset-all,
  - settings UI integration.
- Explorer `New File / New Folder` was rebuilt with in-app quick create (no browser `prompt()` dependency).
- Image Editor critical parse/runtime break was fixed; init/open/draw/save flow stabilized.
- Test Server version list became dynamic by server type via IPC `server:list-versions` with cache + fallback.
- Triangle sidebar icon now opens dedicated `Minecraft Tools Hub` page (`mc-tools://`).

## Feature Highlights

- Visual Builder for node-based plugin/mod/script logic.
- No-code extension layer with validation and behavior packs.
- Integrated test server manager for local workflow.
- Image editor and additional Minecraft tool pages.
- Dynamic EN/TR localization system.

## Build and Run

```bash
git clone https://github.com/ali975/CraftIDE-MyFirstProject.git
cd CraftIDE-MyFirstProject/craftide
npm install
npm run dev
```

Build distributable:

```bash
npm run dist
```

Main output:

- `release/CraftIDE Setup 0.2.0.exe`
- `release/CraftIDE 0.2.0.exe`

## Release/Distribution Rule

Per project rule, run `npm run dist` after each main update package before publishing release artifacts.

## Repository Structure (Core)

- `src/main` Electron main process + IPC
- `src/renderer` UI, Visual Builder, editor integrations
- `release` generated installer/artifacts
- `tests` unit tests

## License

MIT
