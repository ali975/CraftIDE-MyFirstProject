# CraftIDE

CraftIDE is a desktop IDE for Minecraft creators who want code, visual builders, test servers, and packaging in one place.

It targets Paper/Spigot plugins, Fabric mods, Forge mods, and Skript projects with an Electron + Monaco foundation and a workflow designed around rapid iteration.

## What CraftIDE Includes

- **Visual Builder V2**: A powerful node-based visual scripting engine (resembling Blueprint systems) featuring:
  - **True Branching & Logic**: Execute complex nested `if/else` logic visually.
  - **Dynamic Variables**: Manage global variables (Set/Get) directly via the node interface.
  - **Database Support**: Connect and execute queries to MySQL/SQLite visually.
  - **Custom Content**: Register items and blocks on Forge/Fabric natively without coding.
- Monaco-based code editor for Java, YAML, Skript, and project files
- AI Assistant to auto-fix errors and instantly generate complex code/logic
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

## Current Release Highlights (v0.2.15)

- **Massive Visual Builder Upgrade**: Added dynamic data ports, boolean (true/false) execution paths, and a brand new global **Variables Manager**.
- **Cross-Platform Native Blocks**: Integrated native node handlers for creating Custom Blocks & Items automatically on Fabric & Forge.
- **Database Nodes**: Added Database nodes to establish SQLite/MySQL connections and execute schema updates visually.
- **Improved Validations**: Added graph validations to visually flag isolated and broken nodes before generating code.
- Expanded the solution gallery with category and tag metadata for reusable local packs
- Added a creator-first welcome flow that turns plain-language Minecraft ideas into guided project drafts

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

- `release/CraftIDE-Setup-0.2.15.exe`
- `release/CraftIDE-0.2.15.exe`

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
