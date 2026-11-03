// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { BlockBridge } from './blockBridge.js';
import {
  derivePanelLabelStock, scaleSummary, buildScaleRulerHtml,
  PORTS_PER_ROW_OPTIONS, RACK_UNIT_OPTIONS,
} from './panelLabelStock.js';
import { buildPanelLabelStripSvg } from './panelLabels.js';

export class PanelBuddyApp {
  constructor() {
    this.panel = {
      id: 'pnl_main_01',
      name: 'PP-AUDIO-01',
      room: 'MDF / RACK-01',
      portsPerRow: 24,
      rackUnits: 1,
      isBay: false,
      scribbleMode: 'inserts',
      ports: [],
    };

    this.zoom = 1;
    this.previewTheme = 'dark';

    this.bridge = new BlockBridge({
      name: 'Panel Buddy',
      type: 'panel',
      onBlockLoaded: (block, meta) => this.handleBlockLoaded(block, meta),
      onBlockChanged: () => {},
    });

    this.initElements();
    this.attachEvents();
    this.loadInitialData();
  }

  initElements() {
    this.btnOpen = document.getElementById('btn-open');
    this.btnSave = document.getElementById('btn-save');
    this.btnClose = document.getElementById('btn-close');
    this.btnSyncDiscovered = document.getElementById('btn-sync-discovered');

    this.inputPanelName = document.getElementById('input-panel-name');
    this.inputPanelRoom = document.getElementById('input-panel-room');
    this.chipsPpr = document.getElementById('chips-ppr');
    this.chipsRu = document.getElementById('chips-ru');
    this.chipsMode = document.getElementById('chips-mode');
    this.chkBay = document.getElementById('chk-bay');

    this.geometrySummary = document.getElementById('geometry-summary');
    this.previewStage = document.getElementById('preview-stage');
    this.portTableBody = document.getElementById('port-table-body');

    this.btnAddPort = document.getElementById('btn-add-port');
    this.btnGeneratePorts = document.getElementById('btn-generate-ports');
    this.btnExportCsv = document.getElementById('btn-export-csv');
    this.btnPrint = document.getElementById('btn-print');

    this.setupChips();
  }

  setupChips() {
    // Ports per row chips
    this.chipsPpr.innerHTML = '';
    PORTS_PER_ROW_OPTIONS.forEach(ppr => {
      const chip = document.createElement('div');
      chip.className = `chip ${this.panel.portsPerRow === ppr ? 'active' : ''}`;
      chip.dataset.ppr = ppr;
      chip.textContent = `${ppr} Ports`;
      chip.addEventListener('click', () => {
        this.panel.portsPerRow = ppr;
        this.updateChipsState();
        this.render();
        this.bridge.notifyChanged();
      });
      this.chipsPpr.appendChild(chip);
    });

    // Rack units chips
    this.chipsRu.innerHTML = '';
    RACK_UNIT_OPTIONS.forEach(ru => {
      const chip = document.createElement('div');
      chip.className = `chip ${this.panel.rackUnits === ru ? 'active' : ''}`;
      chip.dataset.ru = ru;
      chip.textContent = `${ru}U`;
      chip.addEventListener('click', () => {
        this.panel.rackUnits = ru;
        this.updateChipsState();
        this.render();
        this.bridge.notifyChanged();
      });
      this.chipsRu.appendChild(chip);
    });

    // Mode chips
    this.chipsMode.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.panel.scribbleMode = chip.dataset.mode;
        this.updateChipsState();
        this.render();
        this.bridge.notifyChanged();
      });
    });
  }

  updateChipsState() {
    this.chipsPpr.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.ppr, 10) === this.panel.portsPerRow);
    });
    this.chipsRu.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.ru, 10) === this.panel.rackUnits);
    });
    this.chipsMode.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.mode === this.panel.scribbleMode);
    });
    this.chkBay.checked = !!this.panel.isBay;
  }

  attachEvents() {
    this.btnOpen?.addEventListener('click', () => this.promptOpen());
    this.btnSave?.addEventListener('click', () => this.saveBlock());
    this.btnClose?.addEventListener('click', () => this.bridge.close());
    this.btnSyncDiscovered?.addEventListener('click', () => this.loadFromDiscoveredProject());

    this.inputPanelName.addEventListener('input', (e) => {
      this.panel.name = e.target.value;
      this.renderPreviewOnly();
      this.bridge.notifyChanged();
    });

    this.inputPanelRoom.addEventListener('input', (e) => {
      this.panel.room = e.target.value;
      this.bridge.notifyChanged();
    });

    this.chkBay.addEventListener('change', (e) => {
      this.panel.isBay = e.target.checked;
      this.render();
      this.bridge.notifyChanged();
    });

    this.btnAddPort?.addEventListener('click', () => {
      const nextNum = this.panel.ports.length + 1;
      this.panel.ports.push({
        portNumber: nextNum,
        label: `PORT ${nextNum}`,
        endpoint: 'DEV-01 / OUT-1',
        signal: 'ANALOG',
        connector: 'XLR-F',
      });
      this.render();
      this.bridge.notifyChanged();
    });

    this.btnGeneratePorts?.addEventListener('click', () => {
      const targetCount = this.panel.portsPerRow * (this.panel.rackUnits || 1);
      this.generatePorts(targetCount);
    });

    this.btnExportCsv?.addEventListener('click', () => this.exportCsv());
    this.btnPrint?.addEventListener('click', () => window.print());
  }

  loadInitialData() {
    this.loadFromDiscoveredProject().catch(() => {
      this.generateDefaultPanel();
    });
  }

  async loadFromDiscoveredProject() {
    try {
      const data = await this.bridge.fetchDiscoveredProject();
      if (data && (data.panels || data.patchPanels)) {
        const panels = data.panels || data.patchPanels;
        if (Array.isArray(panels) && panels.length > 0) {
          const first = panels[0];
          this.handleBlockLoaded(first, { title: first.name || first.panelLabel });
          return;
        }
      }
    } catch (_) {}
    this.generateDefaultPanel();
  }

  generateDefaultPanel() {
    this.panel.ports = [];
    for (let i = 1; i <= 24; i++) {
      this.panel.ports.push({
        portNumber: i,
        label: `CH ${i.toString().padStart(2, '0')}`,
        endpoint: `STAGEBOX / IN-${i}`,
        signal: i <= 16 ? 'MIC' : 'LINE',
        connector: 'XLR-F',
      });
    }
    this.render();
  }

  generatePorts(count) {
    this.panel.ports = [];
    for (let i = 1; i <= count; i++) {
      this.panel.ports.push({
        portNumber: i,
        label: `PORT ${i}`,
        endpoint: '',
        signal: 'ANALOG',
        connector: 'XLR',
      });
    }
    this.render();
    this.bridge.notifyChanged();
  }

  handleBlockLoaded(block, meta = {}) {
    if (!block) return;
    this.panel.id = block.id || this.panel.id;
    this.panel.name = block.name || block.panelLabel || this.panel.name;
    this.panel.room = block.room || (Array.isArray(block.roomPath) ? block.roomPath.join(' > ') : this.panel.room);
    this.panel.portsPerRow = block.portsPerRow || this.panel.portsPerRow;
    this.panel.rackUnits = block.rackUnits || this.panel.rackUnits;
    this.panel.isBay = !!block.isBay;
    this.panel.scribbleMode = block.scribbleMode || this.panel.scribbleMode;

    if (Array.isArray(block.ports)) {
      this.panel.ports = block.ports.map((p, idx) => ({
        portNumber: p.portNumber ?? (idx + 1),
        label: p.label || p.portLabel || `P${idx + 1}`,
        endpoint: p.endpoint || p.destination || p.outputTo || '',
        signal: p.signal || 'ANALOG',
        connector: p.connector || 'XLR',
      }));
    }

    this.inputPanelName.value = this.panel.name;
    this.inputPanelRoom.value = this.panel.room;
    this.updateChipsState();
    this.render();
  }

  saveBlock() {
    const stock = derivePanelLabelStock(this.panel, this.panel.scribbleMode, this.panel.rackUnits);
    const block = {
      type: 'panel',
      id: this.panel.id,
      name: this.panel.name,
      room: this.panel.room,
      portsPerRow: this.panel.portsPerRow,
      rackUnits: this.panel.rackUnits,
      isBay: this.panel.isBay,
      scribbleMode: this.panel.scribbleMode,
      geometry: stock,
      ports: this.panel.ports,
      timestamp: new Date().toISOString(),
    };
    this.bridge.saveBlock(block, {
      title: `${this.panel.name} (${this.panel.ports.length} ports)`,
      filename: `panel_${this.panel.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    });
  }

  render() {
    this.renderInputs();
    this.renderTable();
    this.renderPreviewOnly();
  }

  renderInputs() {
    this.inputPanelName.value = this.panel.name;
    this.inputPanelRoom.value = this.panel.room;
    this.updateChipsState();
  }

  renderTable() {
    this.portTableBody.innerHTML = '';
    this.panel.ports.forEach((port, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-idx"><input type="number" class="cell-input text-center" data-idx="${idx}" data-field="portNumber" value="${port.portNumber}"></td>
        <td><input type="text" class="cell-input" data-idx="${idx}" data-field="label" value="${port.label || ''}"></td>
        <td><input type="text" class="cell-input" data-idx="${idx}" data-field="endpoint" value="${port.endpoint || ''}"></td>
        <td><input type="text" class="cell-input" data-idx="${idx}" data-field="signal" value="${port.signal || ''}"></td>
        <td><input type="text" class="cell-input" data-idx="${idx}" data-field="connector" value="${port.connector || ''}"></td>
        <td class="col-actions">
          <button class="btn-icon btn-del-port" data-idx="${idx}" title="Delete Port">🗑</button>
        </td>
      `;
      this.portTableBody.appendChild(tr);
    });

    this.portTableBody.querySelectorAll('.cell-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        const f = e.target.dataset.field;
        this.panel.ports[i][f] = f === 'portNumber' ? parseInt(e.target.value, 10) : e.target.value;
        this.renderPreviewOnly();
        this.bridge.notifyChanged();
      });
    });

    this.portTableBody.querySelectorAll('.btn-del-port').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        this.panel.ports.splice(i, 1);
        this.render();
        this.bridge.notifyChanged();
      });
    });
  }

  renderPreviewOnly() {
    const stock = derivePanelLabelStock(this.panel, this.panel.scribbleMode, this.panel.rackUnits);
    this.geometrySummary.textContent = scaleSummary(stock);

    const svg = buildPanelLabelStripSvg(this.panel, stock, {
      theme: this.previewTheme,
      zoom: this.zoom,
    });

    const ruler = buildScaleRulerHtml();
    this.previewStage.innerHTML = svg + `<div class="ruler-container" style="margin-top:14px; width:100%; max-width:500px;">${ruler}</div>`;
  }

  exportCsv() {
    const headers = ['portNumber', 'label', 'endpoint', 'signal', 'connector'];
    const lines = [headers.join(',')];
    this.panel.ports.forEach(p => {
      const row = headers.map(h => `"${(p[h] || '').toString().replace(/"/g, '""')}"`);
      lines.push(row.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.panel.name}_ports.csv`;
    a.click();
  }

  promptOpen() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const parsed = JSON.parse(re.target.result);
          this.handleBlockLoaded(parsed, { title: file.name });
        } catch (err) {
          alert('Invalid JSON panel block');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.panelBuddy = new PanelBuddyApp();
  });
}
