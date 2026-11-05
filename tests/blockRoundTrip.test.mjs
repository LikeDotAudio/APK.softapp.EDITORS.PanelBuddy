// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// ROAD-3486: the panel block in and out over cad.like.audio/host@1 through the
// vendored apk-softapp client, driving the app's OWN handleBlockLoaded /
// toBlock / saveBlock (no DOM: the renderers are stubbed); the paired-table
// model; the DXF hand-over to a popped-out CAD on its `ready`, once.

import test from 'node:test';
import assert from 'node:assert/strict';
import { world, ORIGIN } from './softappWorld.mjs';
import { PanelBuddyApp } from '../js/panelBuddyApp.js';
import { pairedRows, applyPairedEdit } from '../js/portTables.js';

const P = 'cad.like.audio/host@1';
const BLOCK = {
  type: 'patch_panel', id: 'pp9', name: 'PP-9', portsPerRow: 2, rackUnits: 1,
  pairs: [{ ch: 1, topLabel: 'A1', bottomLabel: 'B1', normalling: 'full' }, { ch: 2, topLabel: 'A2', bottomLabel: 'B2' }],
};

/** The app's own methods on a panel with no page around it. */
function headlessApp(w) {
  const app = Object.create(PanelBuddyApp.prototype);
  app.panel = { id: 'x', name: 'PP-AUDIO-01', room: 'R', formFactor: 'rack', portsPerRow: 24, rackUnits: 2, ports: [] };
  app.tableMode = 'paired';
  app.selectedPortIndex = 0;
  for (const k of ['render', 'renderPreview', 'updateChipsState', 'setupConnectorPalette', 'renderBatchButtons']) app[k] = () => {};
  app.host = w.S.connectHost({
    editor: 'Panel Buddy',
    blockType: 'panel',
    onLoad: (block, meta) => app.handleBlockLoaded(block, meta),
    onRequest: () => ({ block: app.toBlock(), meta: app.blockMeta() }),
  });
  return app;
}

test('in the CAD: editorReady, load, an edit, request → blockSave with the edited panel, to our origin only', () => {
  const w = world();
  const app = headlessApp(w);
  assert.equal(w.toParent[0].m.type, 'editorReady');
  assert.equal(w.toParent[0].o, ORIGIN);
  w.fire({ protocol: P, type: 'load', block: BLOCK, meta: { blockName: 'PP-9' } });
  assert.equal(app.panel.name, 'PP-9');
  assert.equal(app.panel.ports.length, 4);
  const rows = pairedRows(app.panel);
  assert.ok(applyPairedEdit(app.panel, rows[1], 'bottomEndpoint', 'DAW / IN-2'));   // an edit in the paired table
  w.fire({ protocol: P, type: 'request' });
  const save = w.toParent.at(-1);
  assert.equal(save.m.type, 'blockSave');
  assert.equal(save.o, ORIGIN);
  assert.equal(save.m.block.name, 'PP-9');
  assert.equal(save.m.block.pairs[1].bottomEndpoint, 'DAW / IN-2');
  assert.equal(save.m.block.pairs[0].normalling, 'full');
  assert.equal(save.m.meta.filename, 'panel_pp_9');
  assert.equal(w.downloads.length, 0, 'no download when the CAD holds the block');
});

test('a stranger, or the old private APK_LOAD_BLOCK, changes nothing', () => {
  const w = world();
  const app = headlessApp(w);
  w.fire({ protocol: P, type: 'load', block: BLOCK }, { source: {} });
  w.fire({ protocol: P, type: 'load', block: BLOCK }, { origin: 'http://evil' });
  w.fire({ type: 'APK_LOAD_BLOCK', block: BLOCK });
  assert.equal(app.panel.name, 'PP-AUDIO-01');
});

test('standalone: Save downloads the panel as .json', () => {
  const w = world({ framed: false });
  const app = headlessApp(w);
  app.handleBlockLoaded(BLOCK, {});
  app.saveBlock();
  assert.equal(w.downloads[0].name, 'panel_pp_9.json');
  assert.equal(JSON.parse(w.downloads[0].text).pairs.length, 2);
});
