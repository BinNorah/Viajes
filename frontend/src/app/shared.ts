import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from './api.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="seat-map-container" aria-label="Croquis interactivo de asientos">
      <div class="map-header">
        <div class="seat-legend">
          <span class="legend-item"><i class="leg-box leg-free"></i> Libre</span>
          <span class="legend-item"><i class="leg-box leg-selected"></i> Seleccionado</span>
          <span class="legend-item"><i class="leg-box leg-blocked"></i> Reservado</span>
          <span class="legend-item"><i class="leg-box leg-occupied"></i> Ocupado</span>
        </div>

        @if (pisos.length > 1) {
          <div class="floor-selector">
            @for (p of pisos; track p) {
              <button type="button" 
                      class="floor-btn" 
                      [class.active]="pisoActivo === p"
                      (click)="pisoActivo = p">
                Piso {{ p }}
                <span class="floor-badge">{{ asientosPorPiso(p).length }} asientos</span>
              </button>
            }
          </div>
        }
      </div>

      @if (cargando) {
        <div class="map-loading">
          <div class="spinner"></div>
          <p>Cargando disponibilidad del bus en tiempo real…</p>
        </div>
      } @else {
        <!-- Bus Coach Frame -->
        <div class="bus-coach">
          <!-- Bus Front / Driver Cabin -->
          <div class="bus-cockpit">
            <div class="driver-wheel" title="Cabina del Conductor">
              <span class="wheel-icon">⎈</span>
              <span class="driver-label">CONDUCTOR</span>
            </div>
            <div class="bus-door">
              <span>PUERTA</span>
            </div>
          </div>

          <!-- Passenger Cabin -->
          <div class="bus-cabin">
            <div class="cabin-label">
              <span>PISO {{ pisoActivo }} · {{ pisoActivo === 1 ? 'PRIMER NIVEL' : 'SEGUNDO NIVEL PANORÁMICO' }}</span>
            </div>

            <div class="seats-rows-grid">
              @for (fila of filasPorPiso(pisoActivo); track fila) {
                <div class="seat-row">
                  <!-- Columna izquierda (1 y 2) -->
                  <div class="col-group">
                    @for (a of asientosEnFila(pisoActivo, fila, [1, 2]); track a.id) {
                      <button type="button"
                              class="seat-btn"
                              [class.is-free]="a.estado === 'LIBRE'"
                              [class.is-selected]="estaSeleccionado(a)"
                              [class.is-occupied]="a.estado === 'OCUPADO'"
                              [class.is-blocked]="a.estado === 'BLOQUEADO'"
                              [disabled]="a.estado !== 'LIBRE' && !a.mio"
                              (click)="seleccionar(a)"
                              [title]="'Asiento ' + a.numero_asiento + ' (' + a.ubicacion + ') - S/ ' + precioAsiento(a)">
                        <span class="seat-num">{{ a.numero_asiento }}</span>
                        <span class="seat-pos">{{ a.ubicacion.charAt(0) }}</span>
                        @if (estaSeleccionado(a)) {
                          <span class="seat-order-tag">{{ indiceSeleccion(a) + 1 }}</span>
                        }
                        @if (a.recargo_precio > 0) {
                          <span class="seat-vip" title="Asiento VIP">+S/{{ a.recargo_precio }}</span>
                        }
                      </button>
                    }
                  </div>

                  <!-- Pasillo central -->
                  <div class="aisle-lane" title="Pasillo">
                    <span class="aisle-num">{{ fila }}</span>
                  </div>

                  <!-- Columna derecha (3 y 4) -->
                  <div class="col-group">
                    @for (a of asientosEnFila(pisoActivo, fila, [3, 4]); track a.id) {
                      <button type="button"
                              class="seat-btn"
                              [class.is-free]="a.estado === 'LIBRE'"
                              [class.is-selected]="estaSeleccionado(a)"
                              [class.is-occupied]="a.estado === 'OCUPADO'"
                              [class.is-blocked]="a.estado === 'BLOQUEADO'"
                              [disabled]="a.estado !== 'LIBRE' && !a.mio"
                              (click)="seleccionar(a)"
                              [title]="'Asiento ' + a.numero_asiento + ' (' + a.ubicacion + ') - S/ ' + precioAsiento(a)">
                        <span class="seat-num">{{ a.numero_asiento }}</span>
                        <span class="seat-pos">{{ a.ubicacion.charAt(0) }}</span>
                        @if (estaSeleccionado(a)) {
                          <span class="seat-order-tag">{{ indiceSeleccion(a) + 1 }}</span>
                        }
                        @if (a.recargo_precio > 0) {
                          <span class="seat-vip" title="Asiento VIP">+S/{{ a.recargo_precio }}</span>
                        }
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        @if (seleccionados.length > 0) {
          <div class="selected-seat-bar">
            <div class="selected-left">
              <span class="check-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              <div>
                <b>{{ seleccionados.length === 1 ? '1 Asiento Seleccionado' : seleccionados.length + ' Asientos Seleccionados' }}</b>
                <div class="selected-seats-chips">
                  @for (s of seleccionados; track s.id) {
                    <span class="seat-pill-chip">
                      Asiento #{{ s.numero_asiento }} (Piso {{ s.piso }} · {{ s.ubicacion }})
                    </span>
                  }
                </div>
              </div>
            </div>
            <div class="selected-price">
              <small>Total a pagar ({{ seleccionados.length }} pasaje{{ seleccionados.length > 1 ? 's' : '' }})</small>
              <b>S/ {{ totalSeleccionados() }}</b>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .seat-map-container {
      padding: 16px;
      border-radius: 16px;
      background: #f8faf9;
      border: 1px solid #e2e8e4;
    }
    .map-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .seat-legend {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      font-size: 11px;
      color: #64748b;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .leg-box {
      width: 14px;
      height: 14px;
      border-radius: 4px;
      display: inline-block;
    }
    .leg-free { background: #e6f9f0; border: 1.5px solid #10b981; }
    .leg-selected { background: #0ea5e9; border: 1.5px solid #0284c7; box-shadow: 0 0 8px rgba(14, 165, 233, 0.4); }
    .leg-blocked { background: #fef3c7; border: 1.5px solid #f59e0b; }
    .leg-occupied { background: #f1f5f9; border: 1.5px solid #cbd5e1; }

    .floor-selector {
      display: flex;
      gap: 6px;
      background: #e2e8e5;
      padding: 4px;
      border-radius: 10px;
    }
    .floor-btn {
      padding: 6px 14px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .floor-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    .floor-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #64748b;
    }
    .floor-btn.active .floor-badge {
      background: #e0f2fe;
      color: #0369a1;
    }

    .bus-coach {
      max-width: 480px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 36px 36px 20px 20px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    .bus-cockpit {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #f1f5f9;
      border-bottom: 2px dashed #cbd5e1;
    }
    .driver-wheel {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #475569;
    }
    .wheel-icon {
      font-size: 20px;
      color: #0f172a;
    }
    .driver-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }
    .bus-door {
      padding: 4px 10px;
      border: 1.5px solid #94a3b8;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
    }

    .bus-cabin {
      padding: 20px 16px;
    }
    .cabin-label {
      text-align: center;
      margin-bottom: 16px;
    }
    .cabin-label span {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
    }

    .seats-rows-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .seat-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .col-group {
      display: flex;
      gap: 8px;
    }
    .aisle-lane {
      width: 28px;
      display: grid;
      place-items: center;
      height: 48px;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 6px,
        rgba(203, 213, 225, 0.4) 6px,
        rgba(203, 213, 225, 0.4) 12px
      );
      border-radius: 4px;
    }
    .aisle-num {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
    }

    .seat-btn {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .seat-num {
      font-size: 13px;
      font-weight: 800;
      line-height: 1;
    }
    .seat-pos {
      font-size: 9px;
      color: inherit;
      opacity: 0.75;
      margin-top: 2px;
    }
    .seat-vip {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #f59e0b;
      color: #fff;
      font-size: 8px;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }

    /* States */
    .seat-btn.is-free {
      background: #f0fdf4;
      border-color: #86efac;
      color: #166534;
    }
    .seat-btn.is-free:hover {
      background: #dcfce7;
      border-color: #22c55e;
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
    }

    .seat-btn.is-selected {
      background: #0284c7 !important;
      border-color: #0369a1 !important;
      color: #ffffff !important;
      transform: scale(1.06);
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    }
    .seat-order-tag {
      position: absolute;
      top: -6px;
      left: -6px;
      background: #0284c7;
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      border: 1.5px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.25);
      z-index: 2;
    }

    .seat-btn.is-occupied {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .seat-btn.is-blocked {
      background: #fffbeb;
      border-color: #fde68a;
      color: #b45309;
      cursor: not-allowed;
    }

    .selected-seat-bar {
      margin-top: 18px;
      padding: 14px 18px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0f766e, #115e59);
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      box-shadow: 0 8px 20px rgba(15, 118, 110, 0.25);
      animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes popIn {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .selected-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .check-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #d1fae5;
      color: #065f46;
      display: grid;
      place-items: center;
      font-weight: 800;
    }
    .selected-left b {
      display: block;
      font-size: 14px;
    }
    .selected-seats-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .seat-pill-chip {
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
    }
    .selected-price {
      text-align: right;
    }
    .selected-price small {
      display: block;
      color: #ccfbf1;
      font-size: 10px;
    }
    .selected-price b {
      font-size: 18px;
      font-weight: 800;
      color: #a7f3d0;
    }

    .map-loading {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #cbd5e1;
      border-top-color: #10b981;
      border-radius: 50%;
      margin: 0 auto 12px;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class MapaComponent implements OnInit {
  @Input() viajeId: number | string | null = null;
  @Input() maxSeleccion = 6;
  @Output() elegido = new EventEmitter<any>();
  @Output() elegidos = new EventEmitter<any[]>();

  asientos: any[] = [];
  seleccionados: any[] = [];
  cargando = false;
  pisoActivo = 1;

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (!this.viajeId) return;
    this.cargando = true;
    this.api.get<any>(`/api/viajes/${this.viajeId}/asientos`).subscribe({
      next: r => {
        this.asientos = r.asientos || [];
        this.cargando = false;
        if (this.pisos.length && !this.pisos.includes(this.pisoActivo)) {
          this.pisoActivo = this.pisos[0];
        }
        // Filtrar seleccionados que sigan libres o propios
        this.seleccionados = this.seleccionados.filter(s =>
          this.asientos.some(a => a.id === s.id && (a.estado === 'LIBRE' || a.mio))
        );
        this.elegido.emit(this.seleccionados[0] || null);
        this.elegidos.emit([...this.seleccionados]);
      },
      error: () => {
        this.cargando = false;
        this.asientos = [];
      }
    });
  }

  get pisos(): number[] {
    return [...new Set(this.asientos.map(a => Number(a.piso)))].sort((a, b) => a - b);
  }

  asientosPorPiso(piso: number): any[] {
    return this.asientos.filter(a => Number(a.piso) === piso);
  }

  filasPorPiso(piso: number): number[] {
    const filas = this.asientosPorPiso(piso).map(a => Number(a.fila));
    return [...new Set(filas)].sort((a, b) => a - b);
  }

  asientosEnFila(piso: number, fila: number, cols: number[]): any[] {
    return this.asientosPorPiso(piso)
      .filter(a => Number(a.fila) === fila && cols.includes(Number(a.columna)))
      .sort((a, b) => Number(a.columna) - Number(b.columna));
  }

  estaSeleccionado(a: any): boolean {
    return this.seleccionados.some(s => s.id === a.id);
  }

  indiceSeleccion(a: any): number {
    return this.seleccionados.findIndex(s => s.id === a.id);
  }

  seleccionar(a: any): void {
    if (a.estado !== 'LIBRE' && !a.mio) return;
    const idx = this.seleccionados.findIndex(s => s.id === a.id);
    if (idx >= 0) {
      this.seleccionados.splice(idx, 1);
    } else {
      if (this.seleccionados.length >= this.maxSeleccion) {
        this.api.toast.info(`Puedes seleccionar hasta un máximo de ${this.maxSeleccion} asientos por compra.`);
        return;
      }
      this.seleccionados.push(a);
    }
    this.elegido.emit(this.seleccionados[0] || null);
    this.elegidos.emit([...this.seleccionados]);
  }

  limpiarSeleccion(): void {
    this.seleccionados = [];
    this.elegido.emit(null);
    this.elegidos.emit([]);
  }

  totalSeleccionados(): string {
    const sum = this.seleccionados.reduce((acc, a) => {
      const p = Number(a?.precio_final || (Number(a?.precio_base || 0) + Number(a?.recargo_precio || 0)));
      return acc + p;
    }, 0);
    return sum.toFixed(2);
  }

  precioAsiento(a: any): string {
    return Number(a?.precio_final || (Number(a?.precio_base || 0) + Number(a?.recargo_precio || 0))).toFixed(2);
  }
}

@Component({
  selector: 'app-desglose',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fare-card">
      @if (asientos && asientos.length > 1) {
        <div class="fare-header-multi">
          <span class="fare-multi-title">Detalle de Pasajes ({{ asientos.length }} Asientos)</span>
        </div>
        @for (item of asientos; track item.id; let i = $index) {
          <div class="fare-row">
            <span>Pasajero {{ i + 1 }} · Asiento #{{ item.numero_asiento }} (Piso {{ item.piso }})</span>
            <b>S/ {{ numero(item.precio_final || (item.precio_base + item.recargo_precio)) }}</b>
          </div>
        }
      } @else if (a) {
        <div class="fare-row">
          <span>Tarifa Base de Ruta</span>
          <b>S/ {{ numero(a?.precio_base) }}</b>
        </div>
        <div class="fare-row" [class.highlight]="a?.recargo_precio > 0">
          <span>Recargo de Asiento ({{ a?.ubicacion || 'General' }})</span>
          <b>+ S/ {{ numero(a?.recargo_precio) }}</b>
        </div>
      }
      <div class="fare-total-row">
        <div>
          <span class="total-label">Total a Pagar</span>
          <small>Incluye tasas e impuestos de terminal</small>
        </div>
        <b class="total-amount">S/ {{ totalCalculado() }}</b>
      </div>
    </div>
  `,
  styles: [`
    .fare-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      margin: 14px 0;
    }
    .fare-header-multi {
      padding-bottom: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .fare-multi-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.03em;
    }
    .fare-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
      padding: 4px 0;
    }
    .fare-row b { color: #1e293b; }
    .fare-row.highlight { color: #d97706; }
    .fare-row.highlight b { color: #b45309; }
    .fare-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
    }
    .total-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .fare-total-row small {
      font-size: 10px;
      color: #94a3b8;
    }
    .total-amount {
      font-size: 20px;
      font-weight: 800;
      color: #059669;
    }
  `]
})
export class DesgloseComponent {
  @Input() a: any;
  @Input() asientos: any[] = [];

  numero(v: any): string { return Number(v || 0).toFixed(2); }

  totalCalculado(): string {
    if (this.asientos && this.asientos.length > 0) {
      const sum = this.asientos.reduce((acc, item) => {
        const p = Number(item?.precio_final || (Number(item?.precio_base || 0) + Number(item?.recargo_precio || 0)));
        return acc + p;
      }, 0);
      return sum.toFixed(2);
    }
    return this.numero(this.a?.precio_final || (Number(this.a?.precio_base || 0) + Number(this.a?.recargo_precio || 0)));
  }
}

@Component({
  selector: 'app-pasajero-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="passenger-fields-grid">
      <div class="field-item">
        <label>Tipo de Documento</label>
        <select name="tipo_documento" [(ngModel)]="p.tipo_documento">
          <option value="DNI">DNI (Documento Nacional de Identidad)</option>
          <option value="PASAPORTE">Pasaporte</option>
          <option value="CE">Carné de Extranjería</option>
        </select>
      </div>

      <div class="field-item">
        <label>Número de Documento *</label>
        <input name="numero_documento" 
               [(ngModel)]="p.numero_documento" 
               [placeholder]="p.tipo_documento === 'DNI' ? '8 dígitos' : 'Número de documento'"
               [maxlength]="p.tipo_documento === 'DNI' ? 8 : 15"
               required 
               autocomplete="off">
      </div>

      <div class="field-item">
        <label>Nombres *</label>
        <input name="nombres" [(ngModel)]="p.nombres" placeholder="Ej. Juan Carlos" required autocomplete="given-name">
      </div>

      <div class="field-item">
        <label>Apellidos *</label>
        <input name="apellidos" [(ngModel)]="p.apellidos" placeholder="Ej. Pérez Quispe" required autocomplete="family-name">
      </div>

      <div class="field-item field-full">
        <label>Teléfono Celular / WhatsApp</label>
        <input name="telefono" [(ngModel)]="p.telefono" type="tel" placeholder="Ej. 987654321" autocomplete="tel">
      </div>
    </div>
  `,
  styles: [`
    .passenger-fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 10px;
    }
    .field-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .field-full {
      grid-column: 1 / -1;
    }
    label {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }
    input, select {
      height: 40px;
      padding: 0 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      color: #0f172a;
      background: #ffffff;
      outline: none;
      transition: all 0.15s;
    }
    input:focus, select:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
    @media (max-width: 500px) {
      .passenger-fields-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PasajeroFormComponent {
  @Input() p: any = {};
}

@Component({
  selector: 'app-boleto',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="luxury-ticket">
      <!-- Left Main Stub -->
      <div class="ticket-main">
        <header class="ticket-top">
          <div class="ticket-brand">
            <span class="rp-tag">RP</span>
            <div>
              <b>Rutas del Perú</b>
              <small>BOLETO ELECTRÓNICO DE VIAJE</small>
            </div>
          </div>
          <div class="ticket-badge" [class.badge-paid]="b?.estado_pago === 'PAGADO'">
            {{ b?.estado_pago || 'PAGADO' }}
          </div>
        </header>

        <div class="ticket-route-banner">
          <div class="route-point">
            <small>ORIGEN</small>
            <h3>{{ b?.origen || 'LIMA' }}</h3>
            <span>{{ b?.fecha_salida }} · {{ b?.hora_salida }}</span>
          </div>

          <div class="route-arrow">
            <span>⟶</span>
            <small>{{ b?.tipo_servicio || 'CAMA 160°' }}</small>
          </div>

          <div class="route-point" style="text-align: right;">
            <small>DESTINO</small>
            <h3>{{ b?.destino || 'AYACUCHO' }}</h3>
            <span>Llegada directa</span>
          </div>
        </div>

        <div class="ticket-specs-grid">
          <div class="spec-cell">
            <small>PASAJERO</small>
            <b>{{ b?.nombres }} {{ b?.apellidos }}</b>
          </div>
          <div class="spec-cell">
            <small>DOCUMENTO</small>
            <b>{{ b?.tipo_documento }} {{ b?.numero_documento }}</b>
          </div>
          <div class="spec-cell">
            <small>BUS & ANDÉN</small>
            <b>{{ b?.placa || 'A1B-950' }}</b>
          </div>
          <div class="spec-cell">
            <small>TOTAL PAGADO</small>
            <b class="price-highlight">S/ {{ numero(b?.precio_final) }}</b>
          </div>
        </div>

        <div class="ticket-footer-info">
          <span>Presenta este boleto digital en tu celular o impreso al abordar.</span>
          <span>Boleto #{{ b?.id }} · {{ b?.fecha_emision }}</span>
        </div>
      </div>

      <!-- Perforated Tear Notch -->
      <div class="ticket-notch">
        <div class="notch-top"></div>
        <div class="dotted-line"></div>
        <div class="notch-bottom"></div>
      </div>

      <!-- Right QR Stub -->
      <div class="ticket-stub">
        <div class="stub-seat-box">
          <small>ASIENTO</small>
          <div class="seat-huge">{{ b?.numero_asiento || '01' }}</div>
          <span class="seat-floor">PISO {{ b?.piso || '1' }}</span>
        </div>

        <!-- Rendered Authentic 2D QR Code SVG -->
        <div class="qr-box">
          <svg viewBox="0 0 100 100" class="qr-svg" aria-label="Código QR del boleto">
            <!-- Position Detection Patterns (Top Left, Top Right, Bottom Left) -->
            <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f172a" />
            <rect x="9" y="9" width="20" height="20" rx="2" fill="#ffffff" />
            <rect x="13" y="13" width="12" height="12" rx="2" fill="#0f172a" />

            <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f172a" />
            <rect x="71" y="9" width="20" height="20" rx="2" fill="#ffffff" />
            <rect x="75" y="13" width="12" height="12" rx="2" fill="#0f172a" />

            <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f172a" />
            <rect x="9" y="71" width="20" height="20" rx="2" fill="#ffffff" />
            <rect x="13" y="75" width="12" height="12" rx="2" fill="#0f172a" />

            <!-- Timing Lines & Data Matrix Simulation -->
            <rect x="36" y="17" width="4" height="4" fill="#0f172a" />
            <rect x="44" y="17" width="4" height="4" fill="#0f172a" />
            <rect x="52" y="17" width="4" height="4" fill="#0f172a" />
            <rect x="60" y="17" width="4" height="4" fill="#0f172a" />

            <rect x="17" y="36" width="4" height="4" fill="#0f172a" />
            <rect x="17" y="44" width="4" height="4" fill="#0f172a" />
            <rect x="17" y="52" width="4" height="4" fill="#0f172a" />
            <rect x="17" y="60" width="4" height="4" fill="#0f172a" />

            <!-- Random/Data matrix bits -->
            <rect x="38" y="38" width="6" height="6" fill="#0f172a" />
            <rect x="48" y="38" width="8" height="4" fill="#0f172a" />
            <rect x="60" y="44" width="6" height="6" fill="#0f172a" />
            <rect x="40" y="50" width="8" height="8" fill="#0f172a" />
            <rect x="54" y="54" width="6" height="8" fill="#0f172a" />
            <rect x="68" y="68" width="8" height="6" fill="#0f172a" />
            <rect x="48" y="72" width="8" height="8" fill="#0f172a" />
            <rect x="78" y="40" width="6" height="12" fill="#0f172a" />
            <rect x="38" y="80" width="8" height="6" fill="#0f172a" />
            <rect x="78" y="78" width="8" height="8" fill="#0f172a" />
          </svg>
        </div>

        <div class="qr-code-text">{{ b?.codigo_qr || ('RP-' + b?.id) }}</div>

        <div class="ticket-actions noprint">
          <button type="button" class="btn-print" (click)="imprimir()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Imprimir Boleto
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .luxury-ticket {
      display: grid;
      grid-template-columns: 1fr auto 200px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 12px 36px -6px rgba(0,0,0,0.08);
      margin: 16px 0;
      position: relative;
    }
    .ticket-main {
      padding: 24px;
    }
    .ticket-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .ticket-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .rp-tag {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: #10b981;
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 13px;
    }
    .ticket-brand b {
      display: block;
      font-size: 14px;
      color: #0f172a;
    }
    .ticket-brand small {
      font-size: 9px;
      color: #64748b;
      letter-spacing: 0.08em;
    }
    .ticket-badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      background: #e2e8f0;
      color: #475569;
    }
    .badge-paid {
      background: #dcfce7;
      color: #15803d;
    }

    .ticket-route-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 18px;
    }
    .route-point small {
      font-size: 9px;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.1em;
    }
    .route-point h3 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 2px 0;
    }
    .route-point span {
      font-size: 11px;
      color: #64748b;
    }
    .route-arrow {
      text-align: center;
      color: #10b981;
      font-size: 22px;
    }
    .route-arrow small {
      display: block;
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      margin-top: -4px;
    }

    .ticket-specs-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .spec-cell small {
      display: block;
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 3px;
    }
    .spec-cell b {
      font-size: 13px;
      color: #1e293b;
    }
    .price-highlight {
      color: #059669 !important;
      font-size: 15px !important;
    }

    .ticket-footer-info {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }

    /* Perforated Notch */
    .ticket-notch {
      width: 20px;
      position: relative;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .notch-top {
      width: 20px;
      height: 10px;
      background: #f7f8f5;
      border-radius: 0 0 10px 10px;
    }
    .dotted-line {
      flex: 1;
      border-left: 2px dashed #cbd5e1;
    }
    .notch-bottom {
      width: 20px;
      height: 10px;
      background: #f7f8f5;
      border-radius: 10px 10px 0 0;
    }

    /* Stub */
    .ticket-stub {
      padding: 20px 16px;
      background: #fcfdfa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
    }
    .stub-seat-box small {
      font-size: 9px;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.1em;
    }
    .seat-huge {
      font-size: 32px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
      margin: 4px 0;
    }
    .seat-floor {
      font-size: 10px;
      font-weight: 700;
      color: #10b981;
    }

    .qr-box {
      width: 86px;
      height: 86px;
      padding: 4px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin: 10px 0 4px;
    }
    .qr-svg {
      width: 100%;
      height: 100%;
    }
    .qr-code-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      color: #64748b;
      word-break: break-all;
    }
    .btn-print {
      margin-top: 10px;
      padding: 7px 12px;
      border-radius: 8px;
      background: #0f172a;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-print:hover {
      background: #1e293b;
    }

    @media (max-width: 768px) {
      .luxury-ticket {
        grid-template-columns: 1fr;
      }
      .ticket-notch {
        display: none;
      }
      .ticket-specs-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class BoletoComponent {
  @Input() b: any;
  numero(v: any): string { return Number(v || 0).toFixed(2); }
  imprimir(): void { window.print(); }
}
