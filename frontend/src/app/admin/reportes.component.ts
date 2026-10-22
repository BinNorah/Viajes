import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
<<<<<<< HEAD

import { Api } from '../api.service';

@Component({
    selector: 'app-reportes',
    imports: [FormsModule],
    templateUrl: './reportes.component.html',
    styleUrl: './reportes.component.css'
=======
import { CommonModule } from '@angular/common';
import { Api } from '../api.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="reports-shell">
      <header class="reports-header-bar">
        <div>
          <span class="kicker">INTELIGENCIA DE NEGOCIO & REPORTES</span>
          <h1 class="reports-title">Análisis Comercial y Operativo</h1>
          <p class="reports-desc">Seguimiento de ingresos por ventas, participación de taquillas y porcentaje de ocupación de buses.</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-refresh" (click)="consultarTodo()" [disabled]="cargando">
            <span>{{ cargando ? 'Actualizando datos…' : '↻ Actualizar Reportes' }}</span>
          </button>
        </div>
      </header>

      <!-- Sales Card -->
      <section class="metric-panel sales-panel">
        <div class="panel-top-row">
          <div>
            <span class="kicker">RENDIMIENTO FINANCIERO</span>
            <h2>Ventas por Periodo</h2>
            <p>Filtra las transacciones registradas entre fechas determinadas.</p>
          </div>
          <div class="currency-tag">Soles (PEN)</div>
        </div>

        <!-- Date Range Filter Form -->
        <form class="date-filter-form" (ngSubmit)="ventas()">
          <div class="filter-field">
            <label>Fecha Desde:</label>
            <input type="date" name="desde" [(ngModel)]="desde" required>
          </div>
          <div class="filter-field">
            <label>Fecha Hasta:</label>
            <input type="date" name="hasta" [(ngModel)]="hasta" required [min]="desde">
          </div>
          <div class="filter-buttons">
            <button type="submit" class="btn-filter-submit" [disabled]="cargando">
              <span>{{ cargando ? 'Consultando…' : 'Consultar Rango' }}</span>
              <span>→</span>
            </button>
            <button type="button" class="btn-preset" (click)="setMesActual()">Este Mes</button>
            <button type="button" class="btn-preset" (click)="setUltimos7Dias()">Últimos 7 días</button>
          </div>
        </form>

        @if (rep) {
          <div class="sales-results-grid">
            <!-- Total Revenue Box -->
            <div class="revenue-summary-box">
              <span class="rev-label">INGRESOS DEL PERIODO</span>
              <div class="rev-amount">S/ {{ dinero(rep.total?.total) }}</div>
              <div class="rev-details">
                <span class="detail-pill"><b>{{ rep.total?.boletos || 0 }}</b> boletos emitidos</span>
                <span class="detail-pill">Ticket Promedio: <b>S/ {{ ticketPromedio() }}</b></span>
              </div>
            </div>

            <!-- Sellers Breakdown -->
            <div class="sellers-breakdown-box">
              <div class="sellers-header">
                <b>Ventas por Canal & Vendedor</b>
                <small>{{ rep.por_taquillero?.length || 0 }} canales activos</small>
              </div>

              <div class="sellers-list">
                @for (x of rep.por_taquillero; track x.taquillero) {
                  <div class="seller-item">
                    <div class="seller-meta">
                      <b>{{ x.taquillero || 'Venta Web (Portal)' }}</b>
                      <span>{{ x.boletos }} boletos · <b>S/ {{ dinero(x.total) }}</b></span>
                    </div>
                    <div class="meter-track">
                      <div class="meter-fill" [style.width.%]="participacion(x.total)"></div>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-inline-msg">
                    <span>Sin ventas registradas en el periodo seleccionado.</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </section>

      <!-- Fleet Occupancy Card -->
      <section class="metric-panel occupancy-panel">
        <div class="panel-top-row">
          <div>
            <span class="kicker">OPTIMIZACIÓN DE FLOTA</span>
            <h2>Ocupación de Salidas Activas</h2>
            <p>Control de asientos vendidos versus capacidad máxima por cada unidad programada.</p>
          </div>
          <div class="count-tag">{{ ocup.length }} viajes registrados</div>
        </div>

        @if (ocup.length) {
          <div class="table-scroll-wrap">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Viaje</th>
                  <th>Itinerario / Ruta</th>
                  <th>Fecha y Hora</th>
                  <th>Unidad Bus</th>
                  <th>Estado</th>
                  <th style="min-width: 180px;">Ocupación</th>
                </tr>
              </thead>
              <tbody>
                @for (x of ocup; track x.id) {
                  <tr>
                    <td><span class="trip-id-tag">#{{ x.id }}</span></td>
                    <td>
                      <b class="route-name">{{ x.origen }} ⟶ {{ x.destino }}</b>
                    </td>
                    <td>
                      <div>{{ fecha(x.fecha_salida) }}</div>
                      <small class="time-sub">{{ x.hora_salida }} hrs</small>
                    </td>
                    <td>
                      <span class="bus-tag">Bus {{ x.placa }}</span>
                    </td>
                    <td>
                      <span class="state-chip state-{{ (x.estado || '').toLowerCase() }}">
                        {{ x.estado }}
                      </span>
                    </td>
                    <td>
                      <div class="occupancy-progress-cell">
                        <div class="occupancy-numbers">
                          <b>{{ porcentaje(x.ocupacion_pct) }}%</b>
                          <small>{{ x.ocupados }} / {{ x.asientos_total }} asientos</small>
                        </div>
                        <div class="occupancy-bar-track">
                          <div class="occupancy-bar-fill" 
                               [class.high-occupancy]="porcentaje(x.ocupacion_pct) > 75"
                               [style.width.%]="porcentaje(x.ocupacion_pct)"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="report-empty-state">
            <span class="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </span>
            <b>No hay salidas registradas</b>
            <p>Cuando programes viajes en el panel de administración, la ocupación aparecerá aquí automáticamente.</p>
          </div>
        }
      </section>
    </section>
  `,
  styles: [`
    .reports-shell {
      max-width: 1260px;
      margin: 0 auto;
      padding: 24px 0 60px;
    }
    .reports-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      padding-bottom: 22px;
      border-bottom: 1px solid #e2e8e4;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .kicker {
      font-size: 9px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.1em;
      display: block;
      margin-bottom: 4px;
    }
    .reports-title {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
    }
    .reports-desc {
      font-size: 13px;
      color: #64748b;
    }
    .btn-refresh {
      padding: 9px 16px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-refresh:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .metric-panel {
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    }
    .panel-top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
    }
    .panel-top-row h2 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .panel-top-row p {
      font-size: 12px;
      color: #64748b;
    }
    .currency-tag, .count-tag {
      font-size: 11px;
      font-weight: 800;
      background: #ecfdf5;
      color: #047857;
      padding: 4px 10px;
      border-radius: 9999px;
    }

    .date-filter-form {
      display: flex;
      align-items: flex-end;
      gap: 14px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .filter-field label {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }
    .filter-field input {
      height: 38px;
      padding: 0 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      color: #0f172a;
      background: #fff;
    }
    .filter-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-filter-submit {
      height: 38px;
      padding: 0 16px;
      border-radius: 8px;
      background: #0f766e;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
    }
    .btn-filter-submit:hover { background: #115e59; }
    .btn-preset {
      height: 38px;
      padding: 0 12px;
      border: 1px solid #cbd5e1;
      background: #fff;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
    }
    .btn-preset:hover { background: #f1f5f9; }

    .sales-results-grid {
      display: grid;
      grid-template-columns: 1fr 1.6fr;
      gap: 20px;
    }
    @media (max-width: 800px) {
      .sales-results-grid { grid-template-columns: 1fr; }
    }

    .revenue-summary-box {
      padding: 24px;
      border-radius: 14px;
      background: linear-gradient(135deg, #f0fdf4, #e6f9f0);
      border: 1px solid #bbf7d0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .rev-label {
      font-size: 10px;
      font-weight: 800;
      color: #15803d;
      letter-spacing: 0.1em;
      margin-bottom: 6px;
    }
    .rev-amount {
      font-size: 38px;
      font-weight: 900;
      color: #064e3b;
      letter-spacing: -0.04em;
      line-height: 1.1;
      margin-bottom: 12px;
    }
    .rev-details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .detail-pill {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.8);
      padding: 4px 10px;
      border-radius: 6px;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .sellers-breakdown-box {
      padding: 20px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .sellers-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #0f172a;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .sellers-header small { color: #64748b; }
    .sellers-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .seller-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .seller-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #1e293b;
    }
    .seller-meta small { color: #64748b; }
    .meter-track {
      height: 8px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }
    .meter-fill {
      height: 100%;
      background: #10b981;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }
    .empty-inline-msg {
      padding: 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }

    /* Table */
    .table-scroll-wrap {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .report-table th {
      background: #f8fafc;
      padding: 12px 14px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    .report-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .report-table tr:hover td {
      background: #f8fafc;
    }
    .trip-id-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      color: #0284c7;
      background: #f0f9ff;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .route-name {
      color: #0f172a;
      font-size: 13px;
    }
    .time-sub {
      color: #94a3b8;
      font-size: 11px;
    }
    .bus-tag {
      font-size: 12px;
      color: #475569;
    }
    .state-chip {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .state-programado { background: #dcfce7; color: #15803d; }
    .state-cancelado { background: #fee2e2; color: #b91c1c; }
    .state-finalizado { background: #f1f5f9; color: #64748b; }
    .state-en_ruta { background: #e0f2fe; color: #0369a1; }

    .occupancy-progress-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .occupancy-numbers {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    .occupancy-numbers b { color: #0f172a; }
    .occupancy-numbers small { color: #64748b; }
    .occupancy-bar-track {
      height: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }
    .occupancy-bar-fill {
      height: 100%;
      background: #0ea5e9;
      border-radius: 9999px;
      transition: width 0.3s;
    }
    .high-occupancy { background: #10b981; }

    .report-empty-state {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
    .report-empty-state .empty-icon {
      font-size: 32px;
      display: block;
      margin-bottom: 8px;
    }
  `]
>>>>>>> 292f258bc7f547b31f9d482907d7d7304bb875b6
})
export class ReportesComponent implements OnInit {
  desde = this.primerDiaMes();
  hasta = this.hoyISO();
  rep: any = null;
  ocup: any[] = [];
  cargando = false;

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.consultarTodo();
  }

  consultarTodo(): void {
    this.ventas();
    this.api.get<any[]>('/api/reportes/ocupacion').subscribe(o => this.ocup = o || []);
  }

  ventas(): void {
    if (!this.desde || !this.hasta || this.hasta < this.desde) return;
    this.cargando = true;
    this.api.get<any>(`/api/reportes/ventas?desde=${encodeURIComponent(this.desde)}&hasta=${encodeURIComponent(this.hasta)}`).subscribe({
      next: r => {
        this.rep = r;
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  ticketPromedio(): string {
    const total = Number(this.rep?.total?.total || 0);
    const boletos = Number(this.rep?.total?.boletos || 0);
    if (!boletos) return '0.00';
    return (total / boletos).toFixed(2);
  }

  setMesActual(): void {
    this.desde = this.primerDiaMes();
    this.hasta = this.hoyISO();
    this.ventas();
  }

  setUltimos7Dias(): void {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    this.desde = d.toISOString().slice(0, 10);
    this.hasta = this.hoyISO();
    this.ventas();
  }

  dinero(v: any): string { return Number(v || 0).toFixed(2); }
  porcentaje(v: any): number { return Math.max(0, Math.min(100, Math.round(Number(v || 0)))); }
  participacion(v: any): number {
    const max = Math.max(0, ...(this.rep?.por_taquillero || []).map((x: any) => Number(x.total || 0)));
    return max ? this.porcentaje(Number(v || 0) / max * 100) : 0;
  }
  fecha(v: string): string {
    return v ? new Date(`${v}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  }
  private hoyISO(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  private primerDiaMes(): string {
    return this.hoyISO().slice(0, 8) + '01';
  }
}
