# ⛏️ CraftIDE — Minecraft Development Studio

> AI-powered VS Code fork for Minecraft plugin and Skript development

CraftIDE is a specialized IDE built on top of VS Code, designed to make Minecraft plugin development accessible to everyone — from beginners who've never written code to experienced developers who want powerful tooling.

## ✨ Features

- 🧠 **Synergistic AI Network (CoreAIManager)** — Not just a chat bot! The AI is aware of your active files, visual builder state, and server terminal.
- 🗣️ **Text-to-Node Blueprinting** — Ask the side-panel chat to build a plugin, and it will draw the node diagram visually on your canvas in real-time.
- 🩹 **Auto-Healing IDE** — The Test Server intercepts Java crash logs and passes them directly to the AI, which generates instant fixes and explanations.
- ⚖️ **Game Design Balance Checked** — The Visual Node builder is monitored in the background; the AI tutor will warn you if your requested item logic is OP or breaks server economy!
- 🎨 **Visual Plugin Builder** — Drag & drop node-based plugin creation for Paper, Fabric, Forge, and Skript.
- 🧪 **Integrated Test Server** — Download, run, and test Spigot/Paper/Fabric/Forge servers with one click without leaving the IDE.
- 📚 **Live API Reference & Tutor** — Need help with a block? Click the '💡' icon on any node for instant AI context.

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
