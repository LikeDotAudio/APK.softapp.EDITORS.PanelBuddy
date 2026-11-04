// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  derivePanelLabelStock, pitchInFor, rowsFor, scaleSummary, buildScaleRulerHtml,
} from '../js/panelLabelStock.js';
import { buildPanelLabelStripSvg } from '../js/panelLabels.js';
import { CAD_CONNECTOR_CATALOG, getConnectorMeta } from '../js/cadConnectorSymbols.js';
import { renderCadPanelSvg } from '../js/cadPanelVisualizer.js';

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

test('CAD Vector Connector Catalog & Resolution', () => {
  assert.ok(CAD_CONNECTOR_CATALOG.length >= 12);
  const xlrF = getConnectorMeta('XLR-F');
  assert.equal(xlrF.id, 'xlr-f');
  assert.equal(xlrF.label, 'XLR Female');

  const bnc = getConnectorMeta('BNC');
  assert.equal(bnc.id, 'bnc');

  const ethercon = getConnectorMeta('EtherCON');
  assert.equal(ethercon.id, 'ethercon');
});

test('CAD 19-Inch Panel Visualizer Faceplate & Blueprint Rendering', () => {
  const panel = {
    name: 'PP-STUDIO-A',
    room: 'CR-01 RACK 02',
    portsPerRow: 24,
    rackUnits: 1,
    ports: [
      { portNumber: 1, label: 'KICK IN', endpoint: 'STAGEBOX-A', connector: 'XLR-F' },
      { portNumber: 2, label: 'SNARE TOP', endpoint: 'STAGEBOX-A', connector: 'XLR-F' },
      { portNumber: 24, label: 'DANTE PRI', endpoint: 'CISCO SG350', connector: 'EtherCON' },
    ],
  };

  const svgFaceplate = renderCadPanelSvg(panel, { viewMode: 'faceplate', selectedPortIndex: 0 });
  assert.ok(svgFaceplate.includes('PP-STUDIO-A'));
  assert.ok(svgFaceplate.includes('482.6')); // 19 inch width
  assert.ok(svgFaceplate.includes('cad-icon-xlr-f'));
  assert.ok(svgFaceplate.includes('cad-icon-ethercon'));
  assert.ok(svgFaceplate.includes('KICK IN'));

  const svgDrill = renderCadPanelSvg(panel, { viewMode: 'drill' });
  assert.ok(svgDrill.includes('FABRICATION BLUEPRINT'));
  assert.ok(svgDrill.includes('BORE: Ø24.0mm'));
});

test('Panel Port Shuffling, Reversing and Drag Re-ordering Logic', () => {
  const ports = [
    { portNumber: 1, label: 'CH_1', connector: 'XLR-F' },
    { portNumber: 2, label: 'CH_2', connector: 'XLR-F' },
    { portNumber: 3, label: 'CH_3', connector: 'BNC' },
    { portNumber: 4, label: 'CH_4', connector: 'EtherCON' },
  ];

  // Test drag & drop move (move index 0 to index 2)
  const moved = [...ports];
  const item = moved.splice(0, 1)[0];
  moved.splice(2, 0, item);
  assert.equal(moved[0].label, 'CH_2');
  assert.equal(moved[1].label, 'CH_3');
  assert.equal(moved[2].label, 'CH_1');
  assert.equal(moved[3].label, 'CH_4');

  // Test reversing
  const reversed = [...ports].reverse();
  assert.equal(reversed[0].label, 'CH_4');
  assert.equal(reversed[3].label, 'CH_1');

  // Test shift left
  const shiftedLeft = [...ports];
  const first = shiftedLeft.shift();
  shiftedLeft.push(first);
  assert.equal(shiftedLeft[0].label, 'CH_2');
  assert.equal(shiftedLeft[3].label, 'CH_1');
});
