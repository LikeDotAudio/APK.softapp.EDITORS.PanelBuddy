// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// Authentic 19-Inch EIA-310 CAD Panel Visualizer & Mechanical Blueprint Generator

import { CAD_CONNECTOR_SYMBOLS_SVG, getConnectorMeta } from './cadConnectorSymbols.js';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function renderCadPanelSvg(panel, options = {}) {
  const {
    viewMode = 'faceplate', // 'faceplate' | 'drill' | 'scribble'
    selectedPortIndex = null,
    zoom = 1,
  } = options;

  const ru = Math.max(1, parseInt(panel.rackUnits || 1, 10));
  const isWallPlate = panel.isWallPlate || panel.formFactor === 'wallplate';

  // 19-inch standard rack dimensions in millimeters
  const rackWidthMm = isWallPlate ? (panel.gangs === 2 ? 116 : panel.gangs === 4 ? 208 : 70) : 482.6;
  const rackHeightMm = isWallPlate ? 114.3 : ru * 44.45;
  const earWidthMm = isWallPlate ? 0 : 15.9;
  const usableWidthMm = rackWidthMm - earWidthMm * 2;

  const portsPerRow = Math.max(1, parseInt(panel.portsPerRow || 24, 10));
  const ports = Array.isArray(panel.ports) ? panel.ports : [];
  const numRows = Math.ceil(ports.length / portsPerRow) || 1;

  const svgParts = [];

  // 1. Defs containing CAD connector symbols
  svgParts.push('<defs>');
  svgParts.push(CAD_CONNECTOR_SYMBOLS_SVG);
  svgParts.push(`
    <linearGradient id="cad_chassis_finish" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#242428"/>
      <stop offset="3%" stop-color="#18181b"/>
      <stop offset="97%" stop-color="#141416"/>
      <stop offset="100%" stop-color="#0a0a0c"/>
    </linearGradient>
    <linearGradient id="cad_ear_bevel" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3f3f46"/>
      <stop offset="10%" stop-color="#27272a"/>
      <stop offset="90%" stop-color="#1c1c1f"/>
      <stop offset="100%" stop-color="#111113"/>
    </linearGradient>
    <radialGradient id="cad_screw_head" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#e4e4e7"/>
      <stop offset="40%" stop-color="#a1a1aa"/>
      <stop offset="100%" stop-color="#3f3f46"/>
    </radialGradient>
    <filter id="cad_select_glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#F4902C" flood-opacity="0.8"/>
    </filter>
  `);
  svgParts.push('</defs>');

  if (viewMode === 'drill') {
    // ── MECHANICAL DRILL & FABRICATION BLUEPRINT ────────────────────────
    svgParts.push(`<rect x="0" y="0" width="${rackWidthMm}" height="${rackHeightMm}" fill="#0d0e12" stroke="#2563eb" stroke-width="0.8"/>`);
    svgParts.push(`<rect x="${earWidthMm}" y="0" width="${usableWidthMm}" height="${rackHeightMm}" fill="none" stroke="#3b82f6" stroke-width="0.4" stroke-dasharray="3,2"/>`);

    // Blueprint grid watermark & title block
    svgParts.push(`<text x="24" y="6" fill="#38bdf8" font-size="3" font-family="monospace" font-weight="bold">FABRICATION BLUEPRINT: ${esc(panel.name || 'PATCH PANEL')} · ${ru}U EIA-310-D</text>`);
    svgParts.push(`<text x="${rackWidthMm - 24}" y="6" fill="#64748b" font-size="2.4" text-anchor="end" font-family="monospace">BORE: Ø24.0mm · M3 SCREWS: 19.05 x 24.0mm</text>`);

    // Rack ear mounting slots
    if (!isWallPlate) {
      [-1, 1].forEach(side => {
        const earX = side === -1 ? 7.95 : rackWidthMm - 7.95;
        for (let u = 0; u < ru; u++) {
          const uCenterY = u * 44.45 + 22.225;
          svgParts.push(`<ellipse cx="${earX}" cy="${uCenterY - 15.875}" rx="3.5" ry="5" fill="none" stroke="#38bdf8" stroke-width="0.5"/>`);
          svgParts.push(`<ellipse cx="${earX}" cy="${uCenterY + 15.875}" rx="3.5" ry="5" fill="none" stroke="#38bdf8" stroke-width="0.5"/>`);
          svgParts.push(`<line x1="${earX - 6}" y1="${uCenterY}" x2="${earX + 6}" y2="${uCenterY}" stroke="#64748b" stroke-width="0.2" stroke-dasharray="1,1"/>`);
        }
      });
    }

    // Drill centers for each port
    const rowSpacing = (rackHeightMm - 14) / numRows;
    const colSpacing = usableWidthMm / portsPerRow;

    ports.forEach((port, idx) => {
      const r = Math.floor(idx / portsPerRow);
      const c = idx % portsPerRow;
      const cx = earWidthMm + colSpacing * (c + 0.5);
      const cy = 10 + rowSpacing * (r + 0.5);

      // 24mm bore
      svgParts.push(`<circle cx="${cx}" cy="${cy}" r="12" fill="none" stroke="#38bdf8" stroke-width="0.6"/>`);
      // Crosshairs
      svgParts.push(`<line x1="${cx - 14}" y1="${cy}" x2="${cx + 14}" y2="${cy}" stroke="#0ea5e9" stroke-width="0.3" stroke-dasharray="2,1"/>`);
      svgParts.push(`<line x1="${cx}" y1="${cy - 14}" x2="${cx}" y2="${cy + 14}" stroke="#0ea5e9" stroke-width="0.3" stroke-dasharray="2,1"/>`);
      // M3 screw holes (standard Neutrik D: 19.05mm horizontal, 24.0mm vertical or diagonal)
      svgParts.push(`<circle cx="${cx - 9.5}" cy="${cy - 12}" r="1.6" fill="none" stroke="#ef4444" stroke-width="0.4"/>`);
      svgParts.push(`<circle cx="${cx + 9.5}" cy="${cy + 12}" r="1.6" fill="none" stroke="#ef4444" stroke-width="0.4"/>`);
      // Port ID
      svgParts.push(`<text x="${cx}" y="${cy + 1.2}" fill="#64748b" font-size="3" text-anchor="middle" font-family="monospace">${port.portNumber ?? (idx + 1)}</text>`);
    });

  } else if (viewMode === 'scribble') {
    // ── SCRIBBLE STRIP PAPER / INSERT PRINT VIEW ────────────────────────
    const stripHeightMm = Math.min(12, (rackHeightMm - 12) / numRows);
    svgParts.push(`<rect x="0" y="0" width="${rackWidthMm}" height="${rackHeightMm}" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.5"/>`);
    svgParts.push(`<text x="12" y="6" fill="#0f172a" font-size="3.5" font-weight="bold" font-family="sans-serif">${esc(panel.name || 'SCRIBBLE INSERT STRIPS')} · ${panel.ports.length} PORTS</text>`);

    const colWidth = usableWidthMm / portsPerRow;
    for (let r = 0; r < numRows; r++) {
      const sy = 10 + r * (stripHeightMm + 6);
      svgParts.push(`<rect x="${earWidthMm}" y="${sy}" width="${usableWidthMm}" height="${stripHeightMm}" fill="#f8fafc" stroke="#0f172a" stroke-width="0.6"/>`);

      for (let c = 0; c < portsPerRow; c++) {
        const pIdx = r * portsPerRow + c;
        const port = ports[pIdx];
        const sx = earWidthMm + c * colWidth;

        svgParts.push(`<line x1="${sx}" y1="${sy}" x2="${sx}" y2="${sy + stripHeightMm}" stroke="#94a3b8" stroke-width="0.4"/>`);

        if (port) {
          const num = port.portNumber ?? (pIdx + 1);
          const lbl = port.label || `P${num}`;
          const dest = port.endpoint || '';
          svgParts.push(`<text x="${sx + 1.5}" y="${sy + 3.2}" fill="#d97706" font-size="2.4" font-weight="bold" font-family="monospace">${num}</text>`);
          svgParts.push(`<text x="${sx + colWidth / 2}" y="${sy + 5.5}" fill="#0f172a" font-size="2.8" font-weight="bold" text-anchor="middle" font-family="sans-serif">${esc(lbl)}</text>`);
          if (dest) {
            svgParts.push(`<text x="${sx + colWidth / 2}" y="${sy + 9.5}" fill="#64748b" font-size="2.1" text-anchor="middle" font-family="sans-serif">${esc(dest)}</text>`);
          }
        }
      }
    }

  } else {
    // ── REALISTIC CAD 19-INCH HARDWARE FACEPLATE ───────────────────────
    // Main Chassis Plate
    svgParts.push(`<rect x="0" y="0" width="${rackWidthMm}" height="${rackHeightMm}" rx="2" fill="url(#cad_chassis_finish)" stroke="#2c2c2c" stroke-width="0.8"/>`);
    svgParts.push(`<rect x="0.8" y="0.8" width="${rackWidthMm - 1.6}" height="${rackHeightMm - 1.6}" rx="1.5" fill="none" stroke="#3f3f46" stroke-width="0.3"/>`);

    // Left and Right Rack Mounting Ears with Brushed Bevel & Oval Screws
    if (!isWallPlate) {
      svgParts.push(`<rect x="0" y="0" width="${earWidthMm}" height="${rackHeightMm}" fill="url(#cad_ear_bevel)" stroke="#2c2c2c" stroke-width="0.5"/>`);
      svgParts.push(`<rect x="${rackWidthMm - earWidthMm}" y="0" width="${earWidthMm}" height="${rackHeightMm}" fill="url(#cad_ear_bevel)" stroke="#2c2c2c" stroke-width="0.5"/>`);

      [-1, 1].forEach(side => {
        const earX = side === -1 ? 7.95 : rackWidthMm - 7.95;
        for (let u = 0; u < ru; u++) {
          const uCenterY = u * 44.45 + 22.225;
          [uCenterY - 15.875, uCenterY + 15.875].forEach(slotY => {
            // Oval slot cutout
            svgParts.push(`<rect x="${earX - 3.5}" y="${slotY - 4.5}" width="7" height="9" rx="3.5" fill="#09090b" stroke="#3f3f46" stroke-width="0.8"/>`);
            // Rack washer & screw head
            svgParts.push(`<circle cx="${earX}" cy="${slotY}" r="4.2" fill="url(#cad_screw_head)" stroke="#18181b" stroke-width="0.5"/>`);
            svgParts.push(`<rect x="${earX - 2.8}" y="${slotY - 0.5}" width="5.6" height="1" fill="#18181b"/>`);
          });
        }
      });
    }

    // Top Header Laser-engraved silkscreen brand
    svgParts.push(`<rect x="${earWidthMm + 4}" y="1.5" width="${usableWidthMm - 8}" height="5.5" rx="1" fill="#0f0f11" stroke="#2c2c2c" stroke-width="0.4"/>`);
    svgParts.push(`<circle cx="${earWidthMm + 8}" cy="4.2" r="1.4" fill="#F4902C"/>`);
    svgParts.push(`<text x="${earWidthMm + 12}" y="5.1" fill="#f4f4f5" font-size="2.6" font-weight="700" font-family="sans-serif">${esc(panel.name || 'PP-AUDIO-01')}</text>`);
    svgParts.push(`<text x="${earWidthMm + 45}" y="5.1" fill="#888888" font-size="2.1" font-family="sans-serif">${esc(panel.room || 'MDF RACK 01')} · ${ru}U EIA-310 · ${ports.length} PORTS</text>`);
    svgParts.push(`<text x="${rackWidthMm - earWidthMm - 6}" y="5.1" fill="#F4902C" font-size="2.2" font-weight="bold" text-anchor="end" font-family="monospace">APK.audio CAD</text>`);

    // Port Layout calculation
    const rowHeight = (rackHeightMm - 10) / numRows;
    const colWidth = usableWidthMm / portsPerRow;

    ports.forEach((port, idx) => {
      const r = Math.floor(idx / portsPerRow);
      const c = idx % portsPerRow;
      const cx = earWidthMm + colWidth * (c + 0.5);
      const cy = 8 + rowHeight * (r + 0.45);

      const isSelected = selectedPortIndex === idx;
      const connMeta = getConnectorMeta(port.connector || 'XLR-F');

      const portNum = port.portNumber ?? (idx + 1);
      const label = port.label || `P${portNum}`;
      const dest = port.endpoint || '';

      // Port Group with Interactive Events
      svgParts.push(`<g class="cad-panel-port" data-port-index="${idx}" data-port-num="${portNum}" style="cursor: pointer;">`);

      // D-Series Flange Plate (26mm x 31mm, scaled to fit row)
      const flangeW = Math.min(colWidth * 0.92, 26);
      const flangeH = Math.min(rowHeight * 0.72, 31);
      const flangeX = cx - flangeW / 2;
      const flangeY = cy - flangeH / 2;

      // Selection Glow or Standard Flange
      const filterAttr = isSelected ? 'filter="url(#cad_select_glow)"' : '';
      const strokeColor = isSelected ? '#F4902C' : '#3f3f46';
      const strokeW = isSelected ? '1.2' : '0.5';

      svgParts.push(`<rect x="${flangeX}" y="${flangeY}" width="${flangeW}" height="${flangeH}" rx="1.5" fill="#1f1f23" stroke="${strokeColor}" stroke-width="${strokeW}" ${filterAttr}/>`);

      // D-Flange M3 Mounting Screws (top-left & bottom-right)
      svgParts.push(`<circle cx="${flangeX + 2.4}" cy="${flangeY + 2.4}" r="1.1" fill="url(#cad_screw_head)" stroke="#18181b" stroke-width="0.3"/>`);
      svgParts.push(`<circle cx="${flangeX + flangeW - 2.4}" cy="${flangeY + flangeH - 2.4}" r="1.1" fill="url(#cad_screw_head)" stroke="#18181b" stroke-width="0.3"/>`);

      // Bore Hole
      const boreRadius = Math.min(flangeW, flangeH) * 0.42;
      svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${boreRadius}" fill="#09090b" stroke="#2c2c2c" stroke-width="0.6"/>`);

      // Authentic Vector CAD Connector Icon rendered inside the bore!
      const iconSize = boreRadius * 1.85;
      svgParts.push(`<use href="#cad-icon-${connMeta.id}" x="${cx - iconSize / 2}" y="${cy - iconSize / 2}" width="${iconSize}" height="${iconSize}"/>`);

      // Port Number Tag
      const numBadgeY = flangeY - 1.2;
      svgParts.push(`<text x="${cx}" y="${numBadgeY}" fill="${isSelected ? '#F4902C' : '#a1a1aa'}" font-size="2.2" font-weight="bold" text-anchor="middle" font-family="monospace">${portNum}</text>`);

      // Integrated Scribble Strip (below connector)
      const scribbleY = flangeY + flangeH + 0.5;
      const scribbleH = Math.max(4.5, rowHeight - flangeH - 3.5);
      svgParts.push(`<rect x="${flangeX}" y="${scribbleY}" width="${flangeW}" height="${scribbleH}" rx="0.8" fill="#0f0f11" stroke="#2c2c2c" stroke-width="0.3"/>`);

      // Primary Port Label
      svgParts.push(`<text x="${cx}" y="${scribbleY + 2.6}" fill="#f4f4f5" font-size="2.1" font-weight="bold" text-anchor="middle" font-family="sans-serif">${esc(label)}</text>`);

      // Destination / Endpoint Wire Tag
      if (dest && scribbleH > 5.5) {
        svgParts.push(`<text x="${cx}" y="${scribbleY + 5.1}" fill="#888888" font-size="1.6" text-anchor="middle" font-family="sans-serif">${esc(dest)}</text>`);
      }

      svgParts.push('</g>');
    });
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 ${rackWidthMm} ${rackHeightMm}"
         width="100%"
         height="100%"
         preserveAspectRatio="xMidYMid meet"
         role="img"
         aria-label="${esc(panel.name || 'CAD Patch Panel')}">
      ${svgParts.join('\n')}
    </svg>
  `;
}
