## CraftIDE v0.1.1 — Comprehensive i18n Translation Fix

### ⚠️ Early Development Notice
> **This release is in active development.** While we've made significant progress, there may still be bugs, untranslated strings, or unexpected behavior. Please report issues on the [Issues](https://github.com/ali975/CraftIDE-MyFirstProject/issues) page.

### 🌐 What's New — Full Internationalization (i18n)

This release focuses on making the entire CraftIDE interface dynamically translatable. Previously, many UI elements were hardcoded in Turkish — now **all UI text** respects the language setting (English/Turkish).

#### Translation Fixes
- **Visual Builder**: ~80 block labels translated (e.g., `Oyuncu Girişi` → `Player Join`, `Blok Kırma` → `Block Break`)
- **VB Context Menu**: Category headers (`OLAYLAR` → `Events`, `KOŞULLAR` → `Conditions`, etc.)
- **VB Templates**: All 8 template names and descriptions now in English
- **GUI Builder**: Row labels, config panel labels, button text, and all notifications
- **Marketplace**: Empty state, card footers, publish/import notifications
- **Image Editor**: Toolbar buttons, tool tooltips, grid label, status bar, save/load messages
- **Recipe Creator**: All labels, buttons, and config panels
- **Permission Tree**: Title and all toolbar buttons
- **Command Tree**: Title and all toolbar buttons
- **Config Editor**: Title, Raw YAML button, Save button
- **Server Manager**: All buttons and labels
- **Terminal**: Greeting and working directory messages
- **MC Version Dropdown**: `(Son)` → `(Latest)` dynamically translated
- **Build Notifications**: Compiling, success, and error messages
- **Modal Dialogs**: Project name label

#### UI/UX Improvements
- **VB Toolbar Buttons**: Fixed SVG icons being stripped during translation — icons now preserved correctly
- **New Language System**: `applyStaticTranslations()` expanded to cover all UI sections

### 📥 Download
Download `CraftIDE.Setup.0.1.0.exe` below to install.

### 🐛 Known Issues
- Some deeply nested or dynamically generated strings may still appear in Turkish
- Visual Builder canvas navigation (pan/zoom) is basic
- Not all panels are resizable yet
- The application is a development preview — expect rough edges

### 🛠️ Technical Details
- **Platform**: Windows (Electron)
- **Node.js**: v18+
- **Electron**: v28.3.3
