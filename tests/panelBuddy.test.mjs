// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  derivePanelLabelStock, pitchInFor, rowsFor, scaleSummary, buildScaleRulerHtml,
} from '../js/panelLabelStock.js';
import { buildPanelLabelStripSvg } from '../js/panelLabels.js';

test('Panel Label Stock Derivation', () => {
  const stock24 = derivePanelLabelStock({ portsPerRow: 24, rackUnits: 1, isBay: false });
  assert.equal(stock24.type.portsPerRow, 24);
  assert.equal(stock24.type.rackUnits, 1);
  assert.equal(stock24.cell.widthIn, 0.73);
  assert.equal(stock24.cell.heightIn, 0.39);

  const stock48Bay = derivePanelLabelStock({ portsPerRow: 48, rackUnits: 2, isBay: true });
  assert.equal(stock48Bay.cell.widthIn, 0.335);
  assert.ok(stock48Bay.name.includes('bay'));
});

test('Rows for Port Count', () => {
  assert.equal(rowsFor(24, 24), 1);
  assert.equal(rowsFor(48, 24), 2);
  assert.equal(rowsFor(30, 24), 2);
});

test('Scale Summary and Ruler', () => {
  const stock = derivePanelLabelStock({ portsPerRow: 24, rackUnits: 1, isBay: false });
  const summary = scaleSummary(stock);
  assert.ok(summary.includes('24-port'));
  assert.ok(summary.includes('1:1'));

  const ruler = buildScaleRulerHtml();
  assert.ok(ruler.includes('ruler'));
  assert.ok(ruler.includes('1 inch'));
});

test('SVG Strip Preview Generation', () => {
  const panel = {
    name: 'TEST-PANEL-01',
    ports: [
      { portNumber: 1, label: 'MIC-1', endpoint: 'DSP-01' },
      { portNumber: 2, label: 'MIC-2', endpoint: 'DSP-02' },
    ],
  };
  const stock = derivePanelLabelStock({ portsPerRow: 24, rackUnits: 1, isBay: false });
  const svg = buildPanelLabelStripSvg(panel, stock, { theme: 'dark' });

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('TEST-PANEL-01'));
  assert.ok(svg.includes('MIC-1'));
  assert.ok(svg.includes('DSP-01'));
  assert.ok(svg.endsWith('</svg>'));
});
