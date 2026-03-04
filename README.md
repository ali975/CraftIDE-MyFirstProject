# ⛏️ CraftIDE — Minecraft Development Studio

> AI-powered VS Code fork for Minecraft plugin and Skript development

CraftIDE is a specialized IDE built on top of VS Code, designed to make Minecraft plugin development accessible to everyone — from beginners who've never written code to experienced developers who want powerful tooling.

## ✨ Features & Architecture

- 🚀 **Full Production Pipeline** — CraftIDE is no longer just a code-generator. It's an entire pipeline covering design, validation, packaging, and documentation!
- 🧠 **Synergistic AI Network (CoreAIManager)** — The AI acts as your partner. It's aware of your active files, visual builder state, and server terminal.
- 🗣️ **One-Step NL to Code (Text-to-Node)** — Enter natural language, and CraftIDE will automatically map it to a node diagram, compile the code, and build the JAR.
- 🩹 **Auto-Healing IDE (One-Click Fix)** — The Test Server intercepts Java crash logs and passes them directly to the AI, creating guaranteed one-click fixes for broken code!
- 🎨 **Enhanced Visual Plugin Builder** — Drag & drop node-based creation for Paper, Fabric, Forge, and Skript with undo/redo (Ctrl+Z/Y), friendly block labels, and behavior panels.
- 🛠️ **Dedicated Content Designers** — Specialized tools for Mob Design, Scoreboard/HUD, Config Editing, Custom Recipes, Partical Canvas, and NPC Dialogue Generation.
- 🧪 **Integrated Test Server & Offline Fallback** — Download, run, and test servers with one click. Strong offline-first capabilities for local environments.
- 📚 **Live API Reference & 30+ Templates** — Need help with a block? Click '💡'. Or just load one of our 30+ ready-to-use template blueprints from the Marketplace!

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/craftide/craftide.git
cd craftide

# Install dependencies
npm install

# Start development
npm run dev

# Build final executable
npm run dist
```

## 📦 Extensions (Internal Context)

| Extension | Description |
|-----------|-------------|
| `craftide-core` | Theme, welcome view, base utilities |
| `craftide-ai` | Synergistic AI Agent system |
| `craftide-minecraft` | Project templates, API reference, Skript support |
| `craftide-visual` | Visual plugin builder, AST compiler |
| `craftide-testserver` | Embedded Minecraft test server |

## 🌍 Internationalization
CraftIDE supports multiple languages via the internal engine, defaulting to English.

## 🚀 About the Project
This project is a Windows application built to make Minecraft development accessible to literally anyone. It provides a purely functional environment where you can create custom **plugins, mods, and scripts without needing to know a single line of code**.

* **Core Purpose:** I wanted to completely remove the technical hurdles of syntax and rote memorization. This way, you can focus on what actually matters: your creative ideas and the logical design behind your gameplay mechanics.
* **Development & Future:** I've been developing this independently for quite some time, focusing heavily on making the user experience as smooth and structured as possible. This is an actively maintained passion project! I'm fully committed to constantly releasing updates, tweaking the mechanics, and adding new features to keep it a tool you can rely on.

## 👨‍💻 About the Developer
Hi! I'm a university student in Turkey, currently studying Mathematics Education. More than anything, I have a massive passion for building cool, meaningful tools and systems from absolute scratch.

* **My Drive:** Being a student comes with its own set of financial constraints and everyday challenges, but despite the limited resources, I'm fiercely dedicated to bringing this project to life.
* **My Philosophy:** I see software development a lot like mathematics—it's not just a bunch of rigid rules to memorize, but a playground for logical exploration and building things piece by piece.

This repository might not have thousands of stars (yet!), but it represents my deep commitment to learning, solving problems, and creating things people can enjoy. I'm always super open to feedback, ideas, or contributions!

## 📄 License
MIT License.
