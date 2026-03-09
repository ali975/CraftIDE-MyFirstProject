# CraftIDE 0.2.16 Release Notes

We are excited to announce version `0.2.16` of CraftIDE! This release brings significant architectural improvements and new features focused on the creator experience, AI grounding, and delivery pipelines.

## Key Changes & New Features

* **Centralized Product Flow:** Refined the Welcome experience to better align with an idea-driven creator workflow. Included new informational cards for recommended routes, delivery pipelines, and required clarifications.
* **Guided Intake & Creator Routing:** Introduced new intake helpers to dynamically route users and present actionable delivery checklists based on their initial input.
* **AI Grounding & Common Minecraft Knowledge:** Added extensive knowledge packs for popular plugins (Vault, PlaceholderAPI, WorldGuard, Citizens, ProtocolLib, Folia). The AI now leverages a zombified Project Snapshot, indexed file lists, and API highlights for more accurate context.
* **No-Code Delivery Gate:** Implemented a central quality status state. Validation, build, and scenario outcomes are now connected to a strict delivery gate prior to release, visible within a new "Delivery Gate" panel.
* **Metrics & Journey Tracking:** Introduced comprehensive journey-based tracking for flow starts, validations, builds, scenarios, releases, and AI interactions to better understand the creator journey.
* **Main Process Restructuring:** Initiated the split of main process operations by introducing dedicated `graph-services.ts` and `build-release-services.ts` to manage IPC channels more efficiently.
* **Security Migration Initiation:** Took the first step towards a fully secure Electron environment by implementing `preload.ts` and establishing a transitional hook for `CraftIDEBridge`.
* **Packaging & Extension Alignment:** Improved the packaging scope to properly include the `extensions/` directory and corrected `product.json`.
* **Enhanced Testing:** Expanded test coverage for guided intake, delivery checklists, knowledge pack extraction, and telemetry generation.
* **Readiness & Telemetry UI:** Added new "Project Readiness" and "Creator Telemetry" panels to the visual builder. The application now tracks build success rates, scenario pass rates, and recommended route accuracy.
