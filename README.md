# EDITORS.PanelBuddy — Panel Buddy & 19″ Rack CAD Builder

**Wiki:** [Documentation/README.md](Documentation/README.md) — principles, architecture, delivery.

Design a 19″ rack panel, patchbay or wall plate to the millimetre, from any of 2,174 vendor models: its connectors, its normalling schedule, its scribble-strip labels printed 1:1, its drill blueprint and DXF for the CNC — and see its front and its back.

| | |
|---|---|
| **Opens** | the OS shell (Design → Hardware & Devices), or `index.html` standalone |
| **Writes** | a panel block to the CAD (`cad.like.audio/host@1`), SVG, DXF (AutoCAD R2000), CSV schedules, a 1:1 print sheet |
| **Build** | none — plain ES modules; `npm test` |
| **Ships** | baked into WEB.Frontend-Assets (`up-stack.sh WEB.Frontend-Assets`); public with apk.audio |

## Views

CAD Faceplate · Drill Blueprint · Scribble Inserts · **Rear (Mirror)** · **All Views** (front, rear, drill, scribble stacked) · Label Maker (the 1:1 mechanical studio). Zoom with − / % / +, the wheel or a pinch; drag to pan.

<!-- wiki:smoke -->
**Smoke test** — ✅ PASS 3/3 since 2026-11-04 21:30 EST — [results](Documentation/%F0%9F%A7%A9Manual%20and%20Artifacts/SMOKE.md)
<!-- /wiki:smoke -->
