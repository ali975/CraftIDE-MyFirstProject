# 🚀 CraftIDE v0.2.15 - Visual Builder V2: True Scripting & Database Power

This major update transforms the Visual Builder from a simple action chainer into a fully-fledged, branching visual scripting engine, bringing it closer to professional engines like Unreal Blueprints.

## 🌟 What's New?

### 🔀 True Branching & Execution Logic
We completely overhauled the core Abstract Syntax Tree (AST) compiler. Blocks like `IfElse` now feature true **branching execution ports** (`True` and `False`), allowing complex logical operations and conditional execution flows that generate clean, perfectly formatted nested if/else statements across all supported modding platforms.

### 🔌 Dynamic Data Ports
Nodes now support dynamic input/output ports. Logic flows through `<exec>` ports, while information flows through `<data>` ports, drastically increasing the versatility of what you can build.

### 🧮 Variables Manager & Panel
A new **Variables Manager** modal has been integrated directly into the Visual Builder workspace.
- **Global Variables**: Define project-wide variables with specific types (Text, Number, Boolean) and Default Values.
- **Dynamic Get/Set**: New `Get Variable` and `Set Variable` nodes allow you to read and mutate your variable pool dynamically during events.
- **Dynamic Variable Injections**: Variable nodes feature dynamic dropdown menus that populate automatically depending on the variables you declare in your project.

### 📦 Database Connection Blocks
You can now connect to SQL databases seamlessly from the visual graph:
- **DB Connect**: Open a connection to an SQLite or MySQL database securely.
- **Execute Schema / Update**: Run schema updates and queries straight from the builder interface. *(Currently implemented in Skript, with core definitions for Paper plugins).*

### 🛠️ Custom Content Registration (Forge/Fabric)
Added native node handlers for registering structural modding content on Forge and Fabric platforms natively without writing a single line of Java:
- **Fabric/Forge Register Item**: Register a custom item natively.
- **Fabric/Forge Register Block**: Register a custom block natively.

## 🐛 Fixes & Improvements
- Enforced strict Graph Validation: Generating code with unused or disconnected nodes will now trigger a warning, visually highlighting the orphaned nodes in red so you can fix your logic path before building.
- Overhauled parameter validation for parameters that require variable type inferences.
- Improved live simulation highlighting mechanics.
- Upgraded Skript block handlers for loops and mathematical assignments.
