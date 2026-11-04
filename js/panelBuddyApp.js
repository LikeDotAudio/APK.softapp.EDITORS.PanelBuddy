// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// Authentic 19-Inch EIA Rack Panel CAD Builder with True Vector Connectors

import { BlockBridge } from './blockBridge.js';
import { CAD_CONNECTOR_CATALOG, getConnectorMeta } from './cadConnectorSymbols.js';
import { renderCadPanelSvg } from './cadPanelVisualizer.js';

export class PanelBuddyApp {
  constructor() {
    this.panel = {
      id: 'pnl_main_01',
      name: 'PP-AUDIO-01',
      room: 'MDF / RACK-01 · U14',
      formFactor: 'rack', // 'rack' | 'wallplate'
      portsPerRow: 24,
      rackUnits: 1,
      ports: [],
    };

    this.selectedPortIndex = 0;
    this.viewMode = 'faceplate'; // 'faceplate' | 'drill' | 'scribble'
    this.zoom = 1;

    this.bridge = new BlockBridge({
      name: 'Panel Buddy',
      type: 'panel',
      onBlockLoaded: (block, meta) => this.handleBlockLoaded(block, meta),
      onBlockChanged: () => {},
    });

    this.initElements();
    this.attachEvents();
    this.setupChips();
    this.setupConnectorPalette();
    this.loadInitialData();
  }

  initElements() {
    this.btnOpen = document.getElementById('btn-open');
    this.btnSave = document.getElementById('btn-save');
    this.btnClose = document.getElementById('btn-close');
    this.btnSyncDiscovered = document.getElementById('btn-sync-discovered');

    this.inputPanelName = document.getElementById('input-panel-name');
    this.inputPanelRoom = document.getElementById('input-panel-room');
    this.chipsForm = document.getElementById('chips-form');
    this.chipsRu = document.getElementById('chips-ru');
    this.chipsPpr = document.getElementById('chips-ppr');
    this.chipsView = document.getElementById('chips-view');

    this.connectorPalette = document.getElementById('connector-palette');
    this.geometrySummary = document.getElementById('geometry-summary');
    this.previewStage = document.getElementById('preview-stage');
    this.portTableBody = document.getElementById('port-table-body');
    this.tableStatusLabel = document.getElementById('table-status-label');

    this.btnAddPort = document.getElementById('btn-add-port');
    this.btnGeneratePorts = document.getElementById('btn-generate-ports');
    this.btnExportCsv = document.getElementById('btn-export-csv');
    this.btnExportSvg = document.getElementById('btn-export-svg');
    this.btnPrint = document.getElementById('btn-print');

    this.btnBatchXlrF = document.getElementById('btn-batch-xlrf');
    this.btnBatchEthercon = document.getElementById('btn-batch-ethercon');
    this.btnBatchBnc = document.getElementById('btn-batch-bnc');
    this.btnBatchSplit = document.getElementById('btn-batch-split');
  }

  setupChips() {
    // Form Factor
    this.chipsForm.querySelectorAll('.chip').forEach(c => {
      c.addEventListener('click', () => {
        this.panel.formFactor = c.dataset.form;
        this.updateChipsState();
        this.render();
        this.bridge.notifyChanged();
      });
    });

    // Rack units
    const ruOptions = [1, 2, 3, 4];
    this.chipsRu.innerHTML = '';
    ruOptions.forEach(ru => {
      const chip = document.createElement('div');
      chip.className = `chip ${this.panel.rackUnits === ru ? 'active' : ''}`;
      chip.dataset.ru = ru;
      chip.textContent = `${ru}U (${(ru * 1.75).toFixed(2)}″)`;
      chip.addEventListener('click', () => {
        this.panel.rackUnits = ru;
        this.updateChipsState();
        this.render();
        this.bridge.notifyChanged();
      });
      this.chipsRu.appendChild(chip);
    });

    // Ports per row
    const pprOptions = [8, 12, 16, 24, 32, 48];
    this.chipsPpr.innerHTML = '';
    pprOptions.forEach(ppr => {
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

    // View Modes
    this.chipsView.querySelectorAll('.chip').forEach(c => {
      c.addEventListener('click', () => {
        this.viewMode = c.dataset.view;
        this.chipsView.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        this.renderPreview();
      });
    });
  }

  setupConnectorPalette() {
    this.connectorPalette.innerHTML = '<span style="font-size:10px; font-weight:700; color:var(--osc-text-muted); margin-right:4px;">CAD CONNECTORS:</span>';

    CAD_CONNECTOR_CATALOG.forEach(conn => {
      const btn = document.createElement('button');
      btn.className = 'conn-palette-btn';
      btn.dataset.connId = conn.id;
      btn.title = `${conn.desc} (${conn.category})`;
      btn.innerHTML = `<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${conn.color};"></span><span>${conn.label}</span>`;
      btn.addEventListener('click', () => {
        this.applyConnectorToSelected(conn.id);
      });
      this.connectorPalette.appendChild(btn);
    });
  }

  updateChipsState() {
    this.chipsForm.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.form === this.panel.formFactor);
    });
    this.chipsRu.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.ru, 10) === this.panel.rackUnits);
    });
    this.chipsPpr.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.ppr, 10) === this.panel.portsPerRow);
    });
  }

  attachEvents() {
    this.btnOpen?.addEventListener('click', () => this.promptOpen());
    this.btnSave?.addEventListener('click', () => this.saveBlock());
    this.btnClose?.addEventListener('click', () => this.bridge.close());
    this.btnSyncDiscovered?.addEventListener('click', () => this.loadFromDiscoveredProject());

    this.inputPanelName.addEventListener('input', (e) => {
      this.panel.name = e.target.value;
      this.renderPreview();
      this.bridge.notifyChanged();
    });

    this.inputPanelRoom.addEventListener('input', (e) => {
      this.panel.room = e.target.value;
      this.renderPreview();
      this.bridge.notifyChanged();
    });

    this.btnAddPort?.addEventListener('click', () => {
      const nextNum = this.panel.ports.length + 1;
      this.panel.ports.push({
        portNumber: nextNum,
        label: `PORT ${nextNum}`,
        endpoint: 'STAGE / BOX-01',
        signal: 'Analog Audio',
        connector: 'XLR-F',
      });
      this.selectedPortIndex = this.panel.ports.length - 1;
      this.render();
      this.bridge.notifyChanged();
    });

    this.btnGeneratePorts?.addEventListener('click', () => {
      const targetCount = this.panel.portsPerRow * (this.panel.rackUnits || 1);
      this.generatePorts(targetCount);
    });

    this.btnBatchXlrF?.addEventListener('click', () => this.batchSetConnector('XLR-F'));
    this.btnBatchEthercon?.addEventListener('click', () => this.batchSetConnector('EtherCON'));
    this.btnBatchBnc?.addEventListener('click', () => this.batchSetConnector('BNC'));
    this.btnBatchSplit?.addEventListener('click', () => this.batchSplitInOut());

    this.btnExportCsv?.addEventListener('click', () => this.exportCsv());
    this.btnExportSvg?.addEventListener('click', () => this.exportCadSvg());
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
        endpoint: i <= 16 ? `STAGEBOX A / IN-${i}` : `FOH CONSOLE / OUT-${i - 16}`,
        signal: i <= 16 ? 'Mic Analog' : 'Line Analog',
        connector: i <= 16 ? 'XLR-F' : 'XLR-M',
      });
    }
    this.selectedPortIndex = 0;
    this.render();
  }

  generatePorts(count) {
    this.panel.ports = [];
    for (let i = 1; i <= count; i++) {
      this.panel.ports.push({
        portNumber: i,
        label: `PORT ${i}`,
        endpoint: '',
        signal: 'Analog Audio',
        connector: 'XLR-F',
      });
    }
    this.selectedPortIndex = 0;
    this.render();
    this.bridge.notifyChanged();
  }

  applyConnectorToSelected(connectorId) {
    if (this.selectedPortIndex === null || !this.panel.ports[this.selectedPortIndex]) {
      this.selectedPortIndex = 0;
    }
    const meta = getConnectorMeta(connectorId);
    if (!meta) return;

    this.panel.ports[this.selectedPortIndex].connector = meta.label;
    this.render();
    this.bridge.notifyChanged();
  }

  batchSetConnector(connType) {
    this.panel.ports.forEach(p => { p.connector = connType; });
    this.render();
    this.bridge.notifyChanged();
  }

  batchSplitInOut() {
    const half = Math.floor(this.panel.ports.length / 2);
    this.panel.ports.forEach((p, idx) => {
      if (idx < half) {
        p.connector = 'XLR-F';
        p.signal = 'Audio In';
      } else {
        p.connector = 'XLR-M';
        p.signal = 'Audio Out';
      }
    });
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
    this.panel.formFactor = block.formFactor || this.panel.formFactor;

    if (Array.isArray(block.ports)) {
      this.panel.ports = block.ports.map((p, idx) => ({
        portNumber: p.portNumber ?? (idx + 1),
        label: p.label || p.portLabel || `P${idx + 1}`,
        endpoint: p.endpoint || p.destination || p.outputTo || '',
        signal: p.signal || 'Analog Audio',
        connector: p.connector || 'XLR-F',
      }));
    }

    this.inputPanelName.value = this.panel.name;
    this.inputPanelRoom.value = this.panel.room;
    this.updateChipsState();
    this.render();
  }

  render() {
    this.renderPreview();
    this.renderTable();
    this.updateGeometrySummary();
  }

  renderPreview() {
    const svgContent = renderCadPanelSvg(this.panel, {
      viewMode: this.viewMode,
      selectedPortIndex: this.selectedPortIndex,
      zoom: this.zoom,
    });

    this.previewStage.innerHTML = svgContent;

    // Attach click listeners to all CAD ports
    this.previewStage.querySelectorAll('.cad-panel-port').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = parseInt(el.dataset.portIndex, 10);
        if (!isNaN(idx)) {
          this.selectPort(idx);
        }
      });
    });
  }

  selectPort(idx) {
    if (idx < 0 || idx >= this.panel.ports.length) return;
    this.selectedPortIndex = idx;
    this.renderPreview();

    // Highlight row in table and scroll into view
    this.portTableBody.querySelectorAll('tr').forEach((tr, rIdx) => {
      tr.classList.toggle('selected', rIdx === idx);
      if (rIdx === idx) {
        tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    const p = this.panel.ports[idx];
    if (this.tableStatusLabel && p) {
      this.tableStatusLabel.textContent = `Selected Port #${p.portNumber ?? (idx + 1)}: ${p.label} (${p.connector})`;
    }
  }

  renderTable() {
    this.portTableBody.innerHTML = '';

    this.panel.ports.forEach((port, idx) => {
      const tr = document.createElement('tr');
      if (this.selectedPortIndex === idx) tr.classList.add('selected');

      tr.addEventListener('click', (e) => {
        if (!['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
          this.selectPort(idx);
        }
      });

      // #
      const tdNum = document.createElement('td');
      tdNum.className = 'col-idx text-center';
      tdNum.innerHTML = `<span style="font-weight:bold; color:var(--osc-accent-primary); font-family:var(--font-mono);">${port.portNumber ?? (idx + 1)}</span>`;
      tr.appendChild(tdNum);

      // Connector select
      const tdConn = document.createElement('td');
      tdConn.className = 'col-conn';
      const selConn = document.createElement('select');
      selConn.className = 'cell-select';
      CAD_CONNECTOR_CATALOG.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.label;
        opt.textContent = `${c.label} (${c.desc.split(' ')[0]})`;
        if (port.connector === c.label || port.connector === c.id) opt.selected = true;
        selConn.appendChild(opt);
      });
      selConn.addEventListener('change', (e) => {
        port.connector = e.target.value;
        this.renderPreview();
        this.bridge.notifyChanged();
      });
      tdConn.appendChild(selConn);
      tr.appendChild(tdConn);

      // Label
      const tdLbl = document.createElement('td');
      const inputLbl = document.createElement('input');
      inputLbl.type = 'text';
      inputLbl.className = 'cell-input';
      inputLbl.value = port.label || '';
      inputLbl.addEventListener('focus', () => { this.selectedPortIndex = idx; this.renderPreview(); });
      inputLbl.addEventListener('input', (e) => {
        port.label = e.target.value;
        this.renderPreview();
        this.bridge.notifyChanged();
      });
      tdLbl.appendChild(inputLbl);
      tr.appendChild(tdLbl);

      // Endpoint
      const tdEnd = document.createElement('td');
      const inputEnd = document.createElement('input');
      inputEnd.type = 'text';
      inputEnd.className = 'cell-input';
      inputEnd.value = port.endpoint || '';
      inputEnd.placeholder = 'e.g. STAGE / IN-1';
      inputEnd.addEventListener('focus', () => { this.selectedPortIndex = idx; this.renderPreview(); });
      inputEnd.addEventListener('input', (e) => {
        port.endpoint = e.target.value;
        this.renderPreview();
        this.bridge.notifyChanged();
      });
      tdEnd.appendChild(inputEnd);
      tr.appendChild(tdEnd);

      // Signal format
      const tdSig = document.createElement('td');
      const inputSig = document.createElement('input');
      inputSig.type = 'text';
      inputSig.className = 'cell-input';
      inputSig.value = port.signal || 'Analog Audio';
      inputSig.addEventListener('input', (e) => {
        port.signal = e.target.value;
        this.bridge.notifyChanged();
      });
      tdSig.appendChild(inputSig);
      tr.appendChild(tdSig);

      // Actions
      const tdAct = document.createElement('td');
      tdAct.className = 'col-actions';
      const btnDel = document.createElement('button');
      btnDel.className = 'btn-icon';
      btnDel.title = 'Remove port';
      btnDel.textContent = '🗑️';
      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        this.panel.ports.splice(idx, 1);
        if (this.selectedPortIndex >= this.panel.ports.length) {
          this.selectedPortIndex = Math.max(0, this.panel.ports.length - 1);
        }
        this.render();
        this.bridge.notifyChanged();
      });
      tdAct.appendChild(btnDel);
      tr.appendChild(tdAct);

      this.portTableBody.appendChild(tr);
    });
  }

  updateGeometrySummary() {
    const isWp = this.panel.formFactor === 'wallplate';
    const w = isWp ? 'Wall Plate' : '19.0″ (482.6mm)';
    const h = isWp ? 'Standard Gang' : `${this.panel.rackUnits}U (${(this.panel.rackUnits * 44.45).toFixed(1)}mm)`;
    const count = this.panel.ports.length;
    this.geometrySummary.textContent = `${w} · ${h} · ${count} CAD Connectors`;
  }

  saveBlock() {
    const block = {
      type: 'panel',
      id: this.panel.id,
      name: this.panel.name,
      room: this.panel.room,
      formFactor: this.panel.formFactor,
      portsPerRow: this.panel.portsPerRow,
      rackUnits: this.panel.rackUnits,
      ports: this.panel.ports,
    };
    this.bridge.saveBlock(block, { filename: `panel_${this.panel.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}` });
  }

  exportCsv() {
    const headers = ['Port Number', 'Connector', 'Port Label', 'Destination', 'Signal Format'];
    const rows = this.panel.ports.map(p => [
      p.portNumber,
      `"${p.connector || 'XLR'}"`,
      `"${p.label || ''}"`,
      `"${p.endpoint || ''}"`,
      `"${p.signal || ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.panel.name || 'patch_panel'}_schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportCadSvg() {
    const svgStr = renderCadPanelSvg(this.panel, {
      viewMode: this.viewMode,
      selectedPortIndex: null,
      zoom: 1,
    });
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.panel.name || 'patch_panel'}_cad_${this.viewMode}.svg`;
    a.click();
    URL.revokeObjectURL(url);
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
        } catch (_) {
          alert('Invalid panel JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.panelBuddyApp = new PanelBuddyApp();
  });
}
