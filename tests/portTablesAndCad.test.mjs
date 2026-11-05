// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// ROAD-3486: the paired-table model, discovered endpoints, and the DXF
// hand-over to a popped-out CAD on its `ready`, once.

import test from 'node:test';
import assert from 'node:assert/strict';
import { pairedRows, applyPairedEdit, fillEndpointsFromThings } from '../js/portTables.js';
import { openInCadLikeAudio, CAD_HOST_PROTOCOL } from '../js/cadLikeAudioBridge.js';

test('paired rows: both rows exist, normalling edits land on both ports', () => {
  const panel = { portsPerRow: 3, ports: [] };
  const rows = pairedRows(panel);
  assert.equal(panel.ports.length, 6);
  assert.deepEqual(rows.map((r) => [r.topIdx, r.botIdx]), [[0, 3], [1, 4], [2, 5]]);
  applyPairedEdit(panel, rows[2], 'normalling', 'parallel');
  assert.equal(panel.ports[2].normalling, 'parallel');
  assert.equal(panel.ports[5].normalMode, 'parallel');
  assert.equal(applyPairedEdit(panel, rows[0], 'ch', 9), false, 'the channel number is not editable');
});

test('discovered endpoints: empty ones only, by MAC/serial, never a thing with only an IP', () => {
  const ports = [{ endpoint: '' }, { endpoint: 'KEEP' }, { endpoint: '' }, { endpoint: '' }];
  const things = [{ ips: ['10.0.0.9'] }, { mac: 'aa:bb:cc:dd:ee:01', name: 'amp-L' }, { serial: 'SN-2', vendor: 'ACME', model: 'X' }];
  assert.equal(fillEndpointsFromThings(ports, things), 2);
  assert.deepEqual(ports.map((p) => p.endpoint), ['amp-L', 'KEEP', 'ACME X', '']);
  assert.equal(ports[0].endpointId, 'aa:bb:cc:dd:ee:01');
  assert.equal(fillEndpointsFromThings(ports, things), 0, 'already wired things are not used twice');
});

test('Open in CAD: the DXF goes once, on the CAD window\'s own ready, at our origin; no timers', () => {
  const listeners = [];
  const posted = [];
  const cadWin = { postMessage: (m, o) => posted.push({ m, o }) };
  const win = {
    location: { href: 'http://bench:8080/apps/EDITORS.PanelBuddy/index.html', origin: 'http://bench:8080' },
    addEventListener: (t, fn) => listeners.push(fn),
    removeEventListener: (t, fn) => listeners.splice(listeners.indexOf(fn), 1),
    open: (url) => { win.opened = url; return cadWin; },
    File: class { constructor(parts, name, o) { this.name = name; this.text = parts.join(''); this.type = o.type; } },
    setTimeout: () => { throw new Error('no timers'); },
  };
  const fire = (data, source = cadWin, origin = 'http://bench:8080') => listeners.slice().forEach((fn) => fn({ data, source, origin }));
  const r = openInCadLikeAudio({ name: 'PP 1', formFactor: 'rack', rackUnits: 1, portsPerRow: 2, ports: [] }, { win });
  assert.match(win.opened, /EDITORS\.CAD\.Like\.audio\/dist\/index\.html#\/drawing\?host=panel$/);
  assert.equal(listeners.length, 1, 'listening before the window could say ready');
  fire({ protocol: CAD_HOST_PROTOCOL, type: 'ready' }, {});                     // another window
  fire({ protocol: CAD_HOST_PROTOCOL, type: 'ready' }, cadWin, 'http://evil');  // another origin
  fire({ type: 'ready' });                                                       // no protocol
  assert.equal(posted.length, 0);
  fire({ protocol: CAD_HOST_PROTOCOL, type: 'ready' });
  fire({ protocol: CAD_HOST_PROTOCOL, type: 'ready' });
  assert.equal(posted.length, 1, 'one floorplan, no resend');
  assert.equal(posted[0].o, 'http://bench:8080');
  assert.equal(posted[0].m.type, 'floorplan');
  assert.equal(posted[0].m.file.name, 'PP_1_fabrication.dxf');
  assert.match(posted[0].m.file.text, /SECTION/);
  assert.ok(r.sent());
  assert.equal(listeners.length, 0);
});
