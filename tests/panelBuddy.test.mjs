import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePanelLabelStock, pitchInFor, roundIn } from '../js/panelLabelStock.js';

test('PanelBuddy derives physical scribble strip dimensions for standard 24-port panel', () => {
  const stock24 = derivePanelLabelStock({ portsPerRow: 24, rackUnits: 1, isBay: false }, 'inserts');
  assert.equal(stock24.type.portsPerRow, 24);
  assert.equal(stock24.cell.widthIn, 0.739); // AVP standard pitch
  assert.equal(stock24.cell.heightIn, 0.39); // Inserts height
  assert.equal(stock24.strip.widthIn, 17.75); // Standard usable width
  assert.equal(stock24.panel.widthIn, 19.0); // 19-inch rack width
  assert.equal(stock24.panel.heightIn, 1.75); // 1U
});

test('PanelBuddy derives 48-point video bay split pitch', () => {
  const bayPitch = pitchInFor(48, true);
  assert.equal(roundIn(bayPitch), 0.355);

  const nonBayPitch = pitchInFor(48, false);
  assert.equal(roundIn(nonBayPitch), 0.369);
});
