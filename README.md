# CraftIDE

CraftIDE is a desktop IDE for Minecraft creators who want code, visual builders, test servers, and packaging in one place.

It targets Paper/Spigot plugins, Fabric mods, Forge mods, and Skript projects with an Electron + Monaco foundation and a workflow designed around rapid iteration.

## What CraftIDE Includes

- Monaco-based code editor for Java, YAML, Skript, and project files
- Visual Builder for flow-based plugin and mod logic
- No-code helper tools for GUI, commands, permissions, recipes, and media
- Local test server manager for build, deploy, run, and debug loops
- Image editor and Minecraft-focused utility pages
- English/Turkish UI support
- Official GitHub Releases based in-app update channel for installer builds

## Update Model

CraftIDE now supports GitHub-based in-app updates for packaged Windows installer builds.

- Updates are locked to the official release channel: `ali975/CraftIDE-MyFirstProject`
- Users do not need to revisit the GitHub Releases page for every new version
- User data is preserved during updates
- Portable builds remain available, but in-app auto update is intended for the installer build

User data is stored separately from the application files, so updating the app does not remove project state, settings, or `.craftide` data.

## Current Release Highlights

- Fixed the Visual Builder templates modal flow again
- Synced the packaged app icon and titlebar icon to `logo.png`
- Added GitHub Releases based in-app updater plumbing
- Kept official build verification and release-channel locking

## Development

```bash
git clone https://github.com/ali975/CraftIDE-MyFirstProject.git
cd CraftIDE-MyFirstProject/craftide
npm install
npm run dev
```

## Build

```bash
npm run dist
```

Main Windows outputs:

- `release/CraftIDE-Setup-0.2.6.exe`
- `release/CraftIDE-0.2.6.exe`

Optional direct GitHub publishing:

```bash
npm run dist:publish
```

This requires GitHub credentials or a valid `GH_TOKEN`.

## Project Structure

- `src/main` Electron main process, IPC, updater integration
- `src/renderer` renderer UI, editors, Visual Builder, tool pages
- `assets/icons` packaged Windows icon assets
- `release` generated installers and release metadata
- `tests` automated tests

## Official Distribution

- Official builds are published only from `ali975/CraftIDE-MyFirstProject`
- Forks must not be presented as official CraftIDE releases without permission
- Trademark and branding rules are documented in [TRADEMARK.md](./TRADEMARK.md)

## License

CraftIDE is licensed under `GNU AGPL-3.0-only`.
