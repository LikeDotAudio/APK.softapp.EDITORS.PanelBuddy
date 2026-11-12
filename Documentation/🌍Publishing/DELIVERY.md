# Delivery — EDITORS.PanelBuddy

← [Wiki home](../README.md)

- **No build.** Plain ES modules. **Test:** `npm test`.
- **Ship locally:** baked into WEB.Frontend-Assets — `bash PODS/POD.manager/MANAGER.Docktor/K8/up-stack.sh WEB.Frontend-Assets`; `http://localhost:8080/Softapps/EDITORS/EDITORS.PanelBuddy/`.
- **Ship publicly:** with apk.audio — `python3 .apk.scripts/deploy_all.py --site apk.audio`.
- **Commit and sync:** `python3 .apk.scripts/deploy_all.py --no-deploy`.

## Delivered 2026-11-04

Patchbays limited to patchbay jacks (TT Bantam, Long Frame 1/4″, video midsize / mini) with the model's own jack fitted to every port; Rear (Mirror) and All Views; zoom and pan; Robertson screws everywhere (9997792).

## Delivered 2026-11-11 – 2026-11-12

From this repository's own commits (the commit message is the record):

- vendor: apk-contracts web bundle refreshed from contracts/generated/web (report.ts: LogLine + ProblemRecord, System/Problems family) (`6086d47`)
- vendor/apk-softapp: re-vendored — every problem card is reported through the SDK (ROAD-3695 step 2) (`9eb20b1`)
- vendor: apk-contracts web bundle refreshed from contracts/generated/web (five report codes, ROAD-3695; unit-gate, ROAD-3684) (`9ee3382`)
- re-vendor apk-contracts web bundle: contracts 2.4.0 retires APK.audio/Tests/{suite} (ROAD-3729) (`11070de`)

## Releases
- **Released `2.0.0`, tag `v2.0.0`** (2026-11-05, ROAD-3452, the owner's V2) — no SDK pin; every manifest says 2.0.0; GitHub release `v2.0.0`.
