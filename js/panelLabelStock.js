// Part of the APK.audio project — http://APK.audio — Anthony Kuzub
// MIT Licence. Free, for everyone, for ever.

export const MM_PER_INCH = 25.4;
export const PANEL_W_IN = 19.0;
export const USABLE_W_IN = 17.75;
export const INCHES_PER_U = 1.75;

export const PITCH_IN_BY_PPR = {
  16: 1.0,
  24: 0.739, // Standard AVP / Maxxum 24-port pitch
  32: 0.554,
  48: 0.369
};

export const BAY48_PITCH_IN = 0.355; // 48-point video bay split pitch

export const SCRIBBLE_H_IN = {
  inserts: 0.39, // Default slide-in paper/mylar insert strip
  etched: 0.50   // Laser etched designation band
};

export const roundIn = (inches) => Math.round(inches * 1000) / 1000;
export const roundMm = (mm) => Math.round(mm * 100) / 100;
export const inToMm = (inches) => inches * MM_PER_INCH;

export function pitchInFor(portsPerRow, isBay = false) {
  if (isBay && portsPerRow === 48) return BAY48_PITCH_IN;
  return PITCH_IN_BY_PPR[portsPerRow] ?? (USABLE_W_IN / Math.max(1, portsPerRow));
}

export function derivePanelLabelStock(type, scribbleMode = 'inserts', rows = 1) {
  const portsPerRow = Math.max(1, Math.round(type.portsPerRow) || 24);
  const rackUnits = type.rackUnits > 0 ? type.rackUnits : 1;
  const safeRows = Math.max(1, Math.round(rows) || 1);

  const pitchIn = pitchInFor(portsPerRow, type.isBay);
  const panelHIn = INCHES_PER_U * rackUnits;
  const rowHeightIn = panelHIn / safeRows;
  const bandIn = Math.min(SCRIBBLE_H_IN[scribbleMode] || 0.39, rowHeightIn * 0.7);

  const rowFillPct = (portsPerRow * pitchIn / USABLE_W_IN) * 100;

  return {
    id: `p${portsPerRow}-u${String(rackUnits).replace('.', '_')}${type.isBay ? '-bay' : ''}-${scribbleMode}`,
    name: `${portsPerRow}-port ${type.isBay ? 'bay' : 'panel'} · ${rackUnits}U · ${roundIn(pitchIn)}″ pitch`,
    type: { portsPerRow, rackUnits, isBay: !!type.isBay },
    scribbleMode,
    cell: {
      widthIn: roundIn(pitchIn),
      heightIn: roundIn(bandIn),
      widthMm: roundMm(inToMm(pitchIn)),
      heightMm: roundMm(inToMm(bandIn))
    },
    strip: {
      widthIn: roundIn(USABLE_W_IN),
      widthMm: roundMm(inToMm(USABLE_W_IN)),
      cellsPerRow: portsPerRow
    },
    panel: {
      widthIn: roundIn(PANEL_W_IN),
      heightIn: roundIn(panelHIn),
      rows: safeRows
    },
    overflowPct: Math.round(Math.max(0, rowFillPct - 100) * 100) / 100
  };
}
