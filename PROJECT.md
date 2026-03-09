# CraftIDE — Project Status

> Last updated: 2025 — Roadmap Slice: Shared Readiness + Telemetry Surfacing

## What CraftIDE Is

CraftIDE is a guided Minecraft creator platform built on Electron. A non-technical user can:

1. Type an idea on the Welcome screen
2. Be routed into the right creator flow (Visual Builder, GUI Shop, Quest, NPC, etc.)
3. Build and validate a working plugin/mod/skript through a no-code pipeline
4. Release a packaged artifact with checksums and manual-check guidance

---

## Current Architecture

```
src/main/          — TypeScript (compiled via tsc → dist/main/)
  main.ts          — Electron entry, window creation
  preload.ts       — Bridge stub for future contextIsolation migration
  ipc.ts           — IPC handler registration
  graph-services.ts        — NL→graph, graph validation
  build-release-services.ts — Build runner, artifact finder, release packager

src/renderer/      — Plain JavaScript (loaded directly in renderer)
  app.js           — Main renderer logic, tab lifecycle, welcome flow hooks
  welcome-flow.js  — Welcome screen preview, route rendering, store subscription
  no-code-suite.js — No-code delivery pipeline (validate, build, scenario, release)
  creator-metrics.js       — Journey tracking + aggregate telemetry
  state-store.js   — Central renderer state (CraftIDEStore)
  ai-manager.js    — LLM provider wrapper
  phase-completion-suite.js — Designer panels (quest, npc, region, loot, economy)

src/shared/        — Shared JS (renderer + Node tests)
  creator-brief.js          — Intake, routing, delivery checklist helpers
  minecraft-guidance.js     — Knowledge packs, prompt preamble, quality gate,
                              release delivery summary, project readiness snapshot
```

---

## Implemented Features (cumulative)

### 2.1 Welcome → Creator Flow
- Welcome screen routes ideas to the correct designer
- Route preview, questions-to-confirm, delivery pipeline visible before builder opens

### 2.2 Guided Intake & Creator Routing
- `buildGuidedIntake()`, `buildDeliveryChecklist()` in `creator-brief.js`
- Audience / outcome / trigger inference

### 2.3 AI Grounding & Minecraft Knowledge
- `minecraft-guidance.js`: knowledge packs (Vault, PlaceholderAPI, WorldGuard, Citizens, ProtocolLib, Folia)
- Prompt context injection from project snapshot and graph summary

### 2.4 No-Code Delivery Gate
- Validation → Build → Scenario → Release as a quality-gated pipeline
- Scenario ideas auto-seeded from prompt

### 2.5 Metrics & Journey Tracking
- `creator-metrics.js`: journey start/step/finish with localStorage
- Steps: flow start, validation, build, scenario, release, AI chat

### 2.6 Main Process Modularisation
- `graph-services.ts` — NL→graph, validateGraphShape
- `build-release-services.ts` — runBuild, findJarArtifact, createReleasePackage

### 2.7 Security Migration Start
- `preload.ts` added; `CraftIDEBridge` stub wired into `main.ts`
- App still in legacy mode (contextIsolation off)

### 2.8 Packaging Alignment
- `product.json` cleaned; `package.json` build scope includes `extensions/**/*`

### 2.9 Tests (prior)
- `tests/creator-brief.test.js` — intake, routing, delivery checklist
- `tests/minecraft-guidance.test.js` — preamble, quality gate, scenario ideas

---

## Roadmap Slice Implemented This Session

### Shared Project Readiness + Telemetry Surfacing

**Files modified:**

| File | Change |
|------|--------|
| `src/shared/minecraft-guidance.js` | Added `buildReleaseDeliverySummary()` and `buildProjectReadinessSnapshot()` |
| `src/renderer/creator-metrics.js` | Added `getFirstWorkingBuildTime`, `getBuildSuccessRate`, `getScenarioPassRate`, `getManualFixRate`, `getRecommendedRouteAccuracy`, `aggregateTelemetry` |
| `src/renderer/state-store.js` | Added `creator.readiness` default state slice |
| `src/renderer/no-code-suite.js` | Sync quality status to CraftIDEStore; capture scenario failure reasons; `renderReadinessPanel` and `renderTelemetryPanel`; expanded release output (artifact, checksums, manual checks, next step); `getReadiness()` on public API; finish journey on successful release; new UI panels for readiness + telemetry |
| `src/renderer/welcome-flow.js` | Delivery card reads `CraftIDEStore.creator.readiness` when populated; subscribes to store updates for live re-render |
| `src/renderer/app.js` | `openWelcomeCreatorPath` records `recommendedRoute` in `creator_path_opened`; `launchWelcomeIdeaFlow` records `recommendedRoute` in `welcome_ai_flow` |

**Tests added:**

| File | Coverage |
|------|----------|
| `tests/minecraft-guidance.test.js` | Extended with `buildReleaseDeliverySummary` and `buildProjectReadinessSnapshot` tests |
| `tests/creator-metrics.test.js` | All aggregate telemetry helpers with mock metrics |
| `tests/graph-services.test.js` | `normalizeGraphMode`, `localNlGraph`, `validateGraphShape` (requires dist build) |
| `tests/build-release-services.test.js` | `extractCompileErrors`, `findJarArtifact`, `findSkriptArtifact`, `hashFileSha256`, `createReleasePackage` (requires dist build) |

### Documentation Update

- `YAPILAN_YENILIKLER_OZETI.md` created as a standalone summary of all completed innovations recorded in `YAPILANveYAPILACAKLAR.md`

---

## Open Issues / Still To Do

### 3.1 Security Hardening
- Migrate renderer to `contextIsolation: true`, remove `require('electron')` from renderer files
- Implement `CraftIDEBridge` IPC wrappers fully

### 3.2 Renderer Modularisation
- Split `app.js` into shell + feature modules
- Split `no-code-suite.js` further (quality gate, scenario runner, etc.)

### 3.3 AI Domain Intelligence
- Deepen knowledge packs with version-aware hints and anti-pattern library
- Connect agent context to active platform/version/dependency profile

### 3.4 `vb:nl2graph` Hybrid LLM Layer
- Add LLM candidate graph generation with `validateGraphShape` normalisation fallback

### 3.5 Delivery Pipeline UX Completion
- Already progressed significantly in this slice
- Remaining: unified "Ship Flow" panel across Welcome + VB + Release

### 3.6 Extension Strategy Decision
- Decide: Electron-only product vs. real extension host
- Clean up `extensions/` accordingly

### 3.7 E2E Coverage
- Welcome → Builder → Graph → Build → Scenario → Release smoke test
- Telemetry panel visible and accurate

---

## Critical Files

- `src/main/main.ts`, `preload.ts`, `ipc.ts`
- `src/main/graph-services.ts`, `build-release-services.ts`
- `src/renderer/app.js`, `no-code-suite.js`, `welcome-flow.js`
- `src/renderer/creator-metrics.js`, `state-store.js`
- `src/shared/creator-brief.js`, `minecraft-guidance.js`

---

## Note for Next AI

- Do not break the `Welcome → NoCode → Delivery Gate` pipeline — it is the product's spine.
- Build on top of what exists; avoid large rewrites.
- `contextIsolation` migration is the highest-risk change — do it incrementally.
- Extension strategy must be decided before large extension integration work.
- Tests in `tests/graph-services.test.js` and `tests/build-release-services.test.js` require `npm run build:main` first.
