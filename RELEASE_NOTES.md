## Highlights

- Added shared renderer utilities for translation, escaping, notifications, and mode normalization to reduce duplicated logic across large global scripts.
- Added a pure Visual Builder graph-to-code generation layer and new regression tests for plugin, Skript, Fabric, and Forge outputs.
- Added Monaco dirty-state tracking, reusable editor models, unsaved-close prompts, and app-close guards for text tabs to reduce data loss.
- Added a renderer-level global error boundary so uncaught renderer errors surface as notifications instead of failing silently.
- Fixed several user-visible mojibake strings in Visual Builder template defaults and example flows.
- Switched the YAML raw editor path to reuse the cached Monaco model instead of creating disposable models.

## Artifacts

- `CraftIDE-<version>.exe`
- `CraftIDE-Setup-<version>.exe`
- `latest.yml`
- `SHA256SUMS-<version>.txt`
- `CraftIDE-Setup-<version>.exe.blockmap`
