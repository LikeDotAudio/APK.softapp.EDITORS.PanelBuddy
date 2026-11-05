# Smoke test — EDITORS.PanelBuddy

Is `EDITORS.PanelBuddy` deployed? Written by `.apk.scripts/smoke.py` from the module's own shape; what each check means is in that script's header.

← [Wiki home](../README.md)

**✅ PASS** — 3/3 checks, since 2026-11-04 21:30 EST

| Check | Target | Result | Detail |
|---|---|---|---|
| pushed | [APK.softapp.EDITORS.PanelBuddy](https://github.com/LikeDotAudio/APK.softapp.EDITORS.PanelBuddy.git) | ✅ | HEAD is on origin |
| web | [index.html](https://apk.audio/APK%3ASoftapps/EDITORS/EDITORS.PanelBuddy/index.html) | ✅ | HTTP 200 |
| app | `OS/Panel Buddy` → `PODS/POD.THIN/Softapps/EDITORS/EDITORS.PanelBuddy/index.html` | ✅ | present |

Re-run: `python3 .apk.scripts/smoke.py PODS/POD.THIN/Softapps/EDITORS/EDITORS.PanelBuddy`

<!-- smoke:sig 191c91111005 since 2026-11-04 21:30 EST -->
