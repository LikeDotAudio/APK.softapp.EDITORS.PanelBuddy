# Principles — EDITORS.PanelBuddy

The rules Panel Buddy keeps, each with the code that keeps it.

← [Wiki home](../README.md)

| Principle | Kept by | Where it breaks |
|---|---|---|
| **Millimetres are the truth.** Every dimension is EIA-310 / vendor geometry in mm (pitch P, datum X₀, window H, strip W); the 1:1 print carries a calibration ruler. | `js/patchLabelGeometryEngine.js`, `js/panelLabelStock.js`, `js/cadPanelVisualizer.js` | — |
| **The hardware decides the jacks.** A patchbay (Bantam, long-frame Jack or Video model) takes patchbay jacks only — TT Bantam, Long Frame 1/4″, 75 Ω video midsize / mini, blank — in the palette, the table, drops and Fill All; picking the model fits its own jack to every port. Other hardware keeps the whole catalogue. | `patchbayKind`, `connectorChoices`, `PATCHBAY_DEFAULT` (`js/cadConnectorSymbols.js`); `allowedConnectors`, `isAllowedConnector`, `applyHardwareModel` (`js/panelBuddyApp.js`) | — |
| **The back is the front, seen from behind.** The rear view is the faceplate mirrored left-right (port 1 on the right), text flipped back so it reads. | `mirrorSvg`, `renderView('rear')` (`js/panelBuddyApp.js`) | — |
| **Robertson screws only.** Every drawn screw is square-drive — rack ears and D-flanges; never slotted, never Phillips. | the ear and flange screws in `js/cadPanelVisualizer.js` | — |
| **One drawing, every view.** Faceplate, drill, scribble and rear are the same panel; All Views stacks them and Export SVG writes them as one drawing in mm. | `STACKED_VIEWS`, `stackSvgs` (`js/panelBuddyApp.js`) | — |
| **The vocabulary is the CAD's.** Connectors and signal formats come from the CAD's catalogue, narrowed and extended by config. | `js/vocabulary.js`, `config/vocabulary.json` (ROAD-3501) | — |
| **One client for the CAD.** Blocks and DXF go over `cad.like.audio/host@1`. | `js/cadLikeAudioBridge.js` | — |
| **No build, no dependencies.** | `package.json` (only `"test"`) | — |
