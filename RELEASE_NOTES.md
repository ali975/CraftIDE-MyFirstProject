## Highlights

- Fixed the official update panel so every build checks the locked GitHub release channel instead of relying only on `electron-updater`.
- Added manual asset selection for `Auto`, `Setup`, and `Portable` flows, with portable builds opening the correct release asset instead of failing silently.
- Moved updater and integrity verification messaging to locale keys so renderer status text no longer depends on regex-based translation patches.
- Expanded dynamic localization coverage and added locale parity checks plus an i18n audit script for renderer regressions.
- Upgraded the Visual Builder context menu with block search, category filters, favorites, recent blocks, and metadata-driven parameter editors.
- Standardized release preparation with checksum validation, release manifest generation, English release notes, and a Windows GitHub release workflow.
