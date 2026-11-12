// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

/* PanelBuddyApp, part: The drawing on the stage: zoom and pan, the rear mirror, one view or All Three stacked.
   Mixed into PanelBuddyApp.prototype by js/panelBuddyApp.js (ROAD-3766). */

import { getConnectorMeta } from './cadConnectorSymbols.js';
import { renderCadPanelSvg } from './cadPanelVisualizer.js';

// The views "All Three" stacks, top to bottom.
export const STACKED_VIEWS = [
  { mode: 'faceplate', title: '🎛️ CAD Faceplate · Front' },
  { mode: 'rear', title: '🔁 Rear · mirror of the front' },
  { mode: 'drill', title: '📐 Drill Blueprint' },
  { mode: 'scribble', title: '🏷️ Scribble Inserts' },
];

// Several CAD drawings as one SVG, stacked in their own (mm) units with a gap.
export function stackSvgs(svgs, gapMm = 20) {
  let y = 0;
  let width = 0;
  const parts = svgs.map(str => {
    const vb = /viewBox="([^"]+)"/.exec(str)?.[1].trim().split(/\s+/).map(Number) || [0, 0, 482.6, 44.45];
    const [, , w, h] = vb;
    const inner = str.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    const out = `<svg x="0" y="${y}" width="${w}" height="${h}" viewBox="${vb.join(' ')}">${inner}</svg>`;
    y += h + gapMm;
    width = Math.max(width, w);
    return out;
  });
  const height = Math.max(0, y - gapMm);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm">${parts.join('\n')}</svg>`;
}

export class PanelBuddyView {
  // ZOOM: 1 = fit the stage; above that the drawing is drawn larger and the
  // stage scrolls. Wheel zooms the single view (Ctrl/pinch zooms anywhere);
  // drag empty stage to pan.
  setZoom(z, anchor = null) {
    const stage = this.previewStage;
    const old = this.zoom;
    this.zoom = Math.min(16, Math.max(1, Math.round(z * 100) / 100));
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
    // Keep the point under the cursor (or the stage centre) where it is.
    const sr = stage.getBoundingClientRect();
    const ax = anchor ? anchor.x : sr.left + sr.width / 2;
    const ay = anchor ? anchor.y : sr.top + sr.height / 2;
    const hit = document.elementFromPoint(ax, ay);
    const el = (hit && stage.contains(hit) && hit.closest('#preview-stage > svg, #preview-stage > .view-pane'))
      || stage.querySelector(':scope > svg, :scope > .view-pane');
    const b0 = el?.getBoundingClientRect();
    this.applyZoom();
    if (el && old !== this.zoom) {
      const fx = (ax - b0.left) / Math.max(1, b0.width);
      const fy = (ay - b0.top) / Math.max(1, b0.height);
      const b1 = el.getBoundingClientRect();
      stage.scrollLeft += b1.left + fx * b1.width - ax;
      stage.scrollTop += b1.top + fy * b1.height - ay;
    }
  }

  applyZoom() {
    const stage = this.previewStage;
    const zoomed = this.zoom > 1;
    stage.classList.toggle('zoomed', zoomed);
    const base = Math.max(200, stage.clientWidth - 40);
    stage.querySelectorAll(':scope > svg, :scope > .view-pane').forEach(el => {
      el.style.width = zoomed ? `${Math.round(base * this.zoom)}px` : '';
    });
  }

  setupZoom() {
    const stage = this.previewStage;
    const bar = document.getElementById('zoom-controls');
    this.zoomLabel = document.getElementById('zoom-level');
    bar?.querySelector('[data-zoom="in"]')?.addEventListener('click', () => this.setZoom(this.zoom * 1.25));
    bar?.querySelector('[data-zoom="out"]')?.addEventListener('click', () => this.setZoom(this.zoom / 1.25));
    this.zoomLabel?.addEventListener('click', () => this.setZoom(1));

    stage.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey || this.viewMode !== 'all')) return;
      e.preventDefault();
      this.setZoom(this.zoom * Math.exp(-e.deltaY * 0.001), { x: e.clientX, y: e.clientY });
    }, { passive: false });

    stage.addEventListener('mousedown', (e) => {
      if (this.zoom <= 1 || e.target.closest('.cad-panel-port') || (e.button !== 0 && e.button !== 1)) return;
      e.preventDefault();
      const sx = e.clientX; const sy = e.clientY;
      const sl = stage.scrollLeft; const st = stage.scrollTop;
      stage.style.cursor = 'grabbing';
      const move = (m) => { stage.scrollLeft = sl - (m.clientX - sx); stage.scrollTop = st - (m.clientY - sy); };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        stage.style.cursor = '';
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });
    window.addEventListener('resize', () => this.applyZoom());
  }

  // The back of the panel is the front seen from behind: the whole drawing
  // mirrored left-right (port 1 ends up on the right), with every piece of text
  // flipped back in place so it still reads.
  mirrorSvg(svgStr) {
    if (typeof DOMParser === 'undefined') return svgStr;
    const doc = new DOMParser().parseFromString(svgStr.trim(), 'image/svg+xml');
    const root = doc.documentElement;
    if (!root || root.nodeName !== 'svg') return svgStr;
    const vb = (root.getAttribute('viewBox') || '0 0 0 0').split(/\s+/).map(Number);
    const NS = 'http://www.w3.org/2000/svg';
    const g = doc.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${2 * vb[0] + vb[2]},0) scale(-1,1)`);
    [...root.childNodes].forEach(n => {
      if (n.nodeName === 'defs' || n.nodeName === 'style') return;
      g.appendChild(n);
    });
    root.appendChild(g);
    g.querySelectorAll('text').forEach(t => {
      const x = parseFloat(t.getAttribute('x')) || 0;
      const prev = t.getAttribute('transform') || '';
      t.setAttribute('transform', `translate(${2 * x},0) scale(-1,1) ${prev}`.trim());
      // Text anchored at an edge must now run the other way from that edge.
      const anchor = t.getAttribute('text-anchor') || 'start';
      if (anchor !== 'middle') t.setAttribute('text-anchor', anchor === 'end' ? 'start' : 'end');
    });
    return new XMLSerializer().serializeToString(root);
  }

  renderView(mode, interactive = true) {
    if (mode === 'rear') {
      return {
        svg: this.mirrorSvg(renderCadPanelSvg({ ...this.panel, name: `${this.panel.name || ''} · REAR` }, {
          viewMode: 'faceplate',
          selectedPortIndex: interactive ? this.selectedPortIndex : null,
          zoom: 1,
        })),
      };
    }
    return {
      svg: renderCadPanelSvg(this.panel, {
        viewMode: mode,
        selectedPortIndex: interactive ? this.selectedPortIndex : null,
        zoom: 1,
      }),
    };
  }

  renderPreview() {
    const stacked = this.viewMode === 'all';
    this.previewStage.classList.toggle('stacked', stacked);
    const views = stacked ? STACKED_VIEWS : [{ mode: this.viewMode, title: '' }];
    const rendered = views.map(v => ({ ...v, ...this.renderView(v.mode) }));
    this.previewStage.innerHTML = rendered.map(v => stacked
      ? `<section class="view-pane" data-pane="${v.mode}"><div class="view-pane-title">${v.title}</div>${v.svg}</section>`
      : v.svg).join('');

    this.applyZoom();

    // Attach interactive click and drag-and-drop listeners to all CAD ports
    this.previewStage.querySelectorAll('.cad-panel-port').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.portIndex, 10);
        if (!isNaN(idx)) {
          this.selectPort(idx);
        }
      });

      // Drag port to shuffle / swap positions
      el.addEventListener('dragstart', (e) => {
        const idx = parseInt(el.dataset.portIndex, 10);
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'PANEL_PORT_DRAG',
          fromIndex: idx
        }));
        e.dataTransfer.effectAllowed = 'move';
      });

      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        el.classList.add('drag-over');
      });

      el.addEventListener('dragleave', () => {
        el.classList.remove('drag-over');
      });

      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        const targetIdx = parseInt(el.dataset.portIndex, 10);
        if (isNaN(targetIdx)) return;

        try {
          const payload = JSON.parse(e.dataTransfer.getData('application/json'));
          if (payload.type === 'CONNECTOR_PALETTE_ITEM') {
            // Drop connector from palette onto port
            if (!this.isAllowedConnector(payload.connectorId)) return;
            this.panel.ports[targetIdx].connector = getConnectorMeta(payload.connectorId).label;
            this.selectPort(targetIdx);
            this.render();
            this.changed();
          } else if (payload.type === 'PANEL_PORT_DRAG') {
            // Drag port onto another port to shuffle/swap positions
            const fromIdx = payload.fromIndex;
            if (fromIdx !== undefined && fromIdx !== targetIdx) {
              this.swapOrMovePorts(fromIdx, targetIdx);
            }
          }
        } catch (_) {}
      });
    });
  }
}
