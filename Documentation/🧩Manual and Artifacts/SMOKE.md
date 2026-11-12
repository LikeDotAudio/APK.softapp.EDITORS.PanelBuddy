# Smoke test — EDITORS.PanelBuddy

Is `EDITORS.PanelBuddy` deployed? Written by `.apk.scripts/smoke.py` from the module's own shape; what each check means is in that script's header.

← [Wiki home](../README.md)

**❌ FAIL** — 2/3 checks, since 2026-11-12 00:16 EST

| Check | Target | Result | Detail |
|---|---|---|---|
| pushed | [APK.softapp.EDITORS.PanelBuddy](https://github.com/LikeDotAudio/APK.softapp.EDITORS.PanelBuddy.git) | ❌ | 1 commit(s) not pushed |
| web | [index.html](https://apk.audio/APK%3ASoftapps/EDITORS/EDITORS.PanelBuddy/index.html) | ✅ | HTTP 200 |
| app | `OS/Panel Buddy` → `PODS/POD.THIN/Softapps/EDITORS/EDITORS.PanelBuddy/index.html` | ✅ | present |

Re-run: `python3 .apk.scripts/smoke.py PODS/POD.THIN/Softapps/EDITORS/EDITORS.PanelBuddy`

<!-- smoke:sig aa22c571636b since 2026-11-12 00:16 EST -->
