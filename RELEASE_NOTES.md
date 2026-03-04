## What's New in v0.2.3: License + Branding + Icon Update

This release focuses on legal clarity and distribution hygiene while keeping CraftIDE fully open source.

### Legal and Distribution
- License changed to `GNU AGPL-3.0-only`.
- Added `TRADEMARK.md` to protect project name/logo/brand identity.
- Added `NOTICE` file with copyright and brand-policy references.
- README and README-TR now include:
  - official vs unofficial distribution rules,
  - trademark usage boundaries,
  - AGPL compliance reminder.

### App Icon and Packaging
- Added app icon set under `assets/icons/` (multi-size PNG + Windows `.ico`).
- Updated Electron runtime window icon to use `assets/icons/icon-256.png`.
- Updated `electron-builder` config to package and apply `assets/icons/craftide.ico` for:
  - Windows portable executable,
  - NSIS installer and uninstaller.
- Added post-build checksum generation (`release/SHA256SUMS-<version>.txt`) including `app.asar` hash.

### Anti-Resale Hardening (Open Source Compatible)
- Added `Official Build Verification` panel in Settings.
- Local binary now verifies `app.asar` hash against official release checksums.
- Update checks are hard-locked to official GitHub channel `ali975/CraftIDE-MyFirstProject`.

### Versioning
- App version bumped from `0.2.2` to `0.2.3`.

### Important Note
AGPL allows commercial distribution, but trademark policy restricts brand misuse.
Unofficial forks must use different branding and clearly state they are unofficial.

