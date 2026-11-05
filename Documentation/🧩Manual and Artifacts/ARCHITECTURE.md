# Architecture — EDITORS.PanelBuddy

← [Wiki home](../README.md)

| Module | Role |
|---|---|
| `js/panelBuddyApp.js` | The app: hardware model library, specs, view modes (faceplate, drill, scribble, rear, all), zoom and pan, connector palette and batch fill, port tables, Label Maker studio, export (SVG, DXF, CSV), the CAD bridge. |
| `js/cadPanelVisualizer.js` | `renderCadPanelSvg(panel, {viewMode})` — the panel in mm for each archetype (Bantam TT, long-frame jack, RJ45 data, 75 Ω video, D-series flange). |
| `js/cadConnectorSymbols.js` | The connector catalogue and icon symbols, `getConnectorMeta`, and the patchbay rule (`patchbayKind`, `connectorChoices`, `PATCHBAY_DEFAULT`). |
| `js/vocabulary.js` | The CAD's connector / signal vocabulary, narrowed by `config/vocabulary.json`. |
| `js/patchPanelVendorCatalog.js` | 2,174 vendor models → mechanical presets (`modelToMechanicalPreset`). |
| `js/patchLabelGeometryEngine.js`, `js/panelLabels.js`, `js/panelLabelStock.js` | Label geometry, the 1:1 print sheet, label stock. |
| `js/cadDxfGenerator.js` | AutoCAD R2000 DXF for fabrication. |
| `js/portTables.js` | The paired (patchbay) and linear schedules as APKTable tables. |
| `js/cadLikeAudioBridge.js` | Open in CAD / blocks over `cad.like.audio/host@1`. |

**Views.** `renderView(mode)` draws one view; the rear is the faceplate passed through `mirrorSvg` (a DOMParser transform: content in `translate(W,0) scale(-1,1)`, each `<text>` counter-flipped in place and its `text-anchor` swapped). `renderPreview` stacks `STACKED_VIEWS` for All Views. **Zoom** (`setZoom`, `applyZoom`, `setupZoom`): 1 = fit; above, each SVG is drawn at `base × zoom` px, anchored on the point under the cursor; drag pans.

**Tests:** `npm test` — block round trip through the CAD, port tables, vocabulary.
