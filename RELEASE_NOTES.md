## Highlights

- Fixed the GitHub Actions release workflow so publishing works with the default `secrets.GITHUB_TOKEN` and no longer requires a manual `GH_TOKEN` secret.
- Fixed Visual Builder UTF-8 corruption in card headers, labels, emoji actions, and template fallbacks that previously rendered mojibake in the UI.
- Centralized UTF-8-safe file, JSON, and IPC normalization to keep Turkish characters and emoji text stable across renderer, main process, and packaged builds.
- Switched locale catalog loading to explicit UTF-8 reads and added mojibake fallback tracing for dynamic translations.
- Added automated UTF-8 smoke, JSON translation load, and IPC roundtrip tests to prevent future encoding regressions.

## Artifacts

- `CraftIDE-<version>.exe`
- `CraftIDE-Setup-<version>.exe`
- `latest.yml`
- `SHA256SUMS-<version>.txt`
- `CraftIDE-Setup-<version>.exe.blockmap`
