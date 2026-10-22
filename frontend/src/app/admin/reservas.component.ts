import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../api.service';
import { BoletoComponent } from '../shared';

@Component({
  selector: 'app-admin-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, BoletoComponent],
  template: `
    <section class="reservas-shell">
      <header class="reservas-top-header">
        <div>
          <span class="kicker">CONTROL DE VENTAS Y PASAJEROS</span>
          <h1 class="reservas-title">Gestión de Boletos y Reservas</h1>
          <p class="reservas-desc">Seguimiento de compras en línea, ventas de taquilla física y estado de pagos.</p>
        </div>
        <button class="btn-refresh" (click)="actualizar()" [disabled]="cargando">
          <span>{{ cargando ? 'Actualizando…' : '↻ Actualizar Datos' }}</span>
        </button>
      </header>

      <!-- Stat Counters -->
      <div class="stats-counters-grid">
        <div class="counter-card" (click)="estado = 'TODOS'">
          <span class="counter-label">Total Registros</span>
          <b class="counter-val">{{ reservas.length }}</b>
          <small>Boletos y bloqueos</small>
        </div>
        <div class="counter-card card-paid" (click)="estado = 'PAGADO'">
          <span class="counter-label">Pagados / Confirmados</span>
          <b class="counter-val">{{ pagados }}</b>
          <small>Suma: S/ {{ totalPagado }}</small>
        </div>
        <div class="counter-card card-blocked" (click)="estado = 'BLOQUEADO'">
          <span class="counter-label">Bloqueos Temporales</span>
          <b class="counter-val">{{ pendientes }}</b>
          <small>En proceso de compra</small>
        </div>
        <div class="counter-card card-canceled" (click)="estado = 'ANULADO'">
          <span class="counter-label">Anulados / Expirados</span>
          <b class="counter-val">{{ anulados }}</b>
          <small>Asientos liberados</small>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar-box">
        <div class="search-input-group">
          <span class="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input [(ngModel)]="busqueda" placeholder="Buscar por pasajero, DNI, código QR, ruta o vendedor…">
        </div>

        <div class="filter-group">
          <label>Filtrar Estado:</label>
          <select [(ngModel)]="estado">
            <option value="TODOS">Todos los estados</option>
            <option value="PAGADO">Pagados</option>
            <option value="BLOQUEADO">Pendientes (Bloqueados)</option>
            <option value="ANULADO">Anulados</option>
          </select>
        </div>

        <span class="results-badge">{{ filtradas.length }} resultados</span>
      </div>

      <!-- Table of Bookings -->
      @if (cargando) {
        <div class="loading-state-box">
          <div class="spinner"></div>
          <p>Consultando registros de boletos…</p>
        </div>
      } @else if (filtradas.length) {
        <div class="reservations-table-wrapper">
          <table class="reservations-table">
            <thead>
              <tr>
                <th>Boleto</th>
                <th>Pasajero & Doc</th>
                <th>Ruta & Itinerario</th>
                <th>Asiento</th>
                <th>Canal</th>
                <th>Importe</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (r of filtradas; track r.id) {
                <tr>
                  <td>
                    <span class="ticket-id-tag">#{{ r.id }}</span>
                    <small class="qr-code-sub">{{ r.codigo_qr || 'Sin QR' }}</small>
                  </td>
                  <td>
                    <b class="passenger-name">{{ r.nombres }} {{ r.apellidos }}</b>
                    <small class="passenger-meta">{{ r.tipo_documento }}: {{ r.numero_documento }} · {{ r.telefono || 'Sin tlf' }}</small>
                  </td>
                  <td>
                    <b class="route-info">{{ r.origen }} ⟶ {{ r.destino }}</b>
                    <small class="route-meta">{{ r.fecha_salida }} · {{ r.hora_salida }} · Bus {{ r.placa }}</small>
                  </td>
                  <td>
                    <span class="seat-badge">Asiento {{ r.numero_asiento }}</span>
                    <small class="floor-sub">Piso {{ r.piso }}</small>
                  </td>
                  <td>
                    <span class="channel-chip channel-{{ r.canal.toLowerCase() }}">{{ r.canal }}</span>
                    <small class="vendor-sub">{{ r.vendedor }}</small>
                  </td>
                  <td>
                    <b class="price-value">S/ {{ precio(r.precio_final) }}</b>
                  </td>
                  <td>
                    <span class="status-chip status-{{ r.estado_pago.toLowerCase() }}">
                      {{ estadoTexto(r.estado_pago) }}
                    </span>
                  </td>
                  <td>
                    <button type="button" class="btn-view-ticket" (click)="verBoleto(r)">
                      Ver Boleto
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty-state-box">
          <span class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          </span>
          <h3>No se encontraron boletos</h3>
          <p>Prueba cambiando los términos de búsqueda o el filtro de estado.</p>
        </div>
      }

      <!-- Modal to View Ticket -->
      @if (boletoSeleccionado) {
        <div class="ticket-modal-backdrop" (click)="boletoSeleccionado = null">
          <div class="ticket-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-top">
              <h3>Boleto Digital #{{ boletoSeleccionado.id }}</h3>
              <button type="button" class="btn-close-modal" (click)="boletoSeleccionado = null">Cerrar</button>
            </div>
            <app-boleto [b]="boletoSeleccionado"></app-boleto>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .reservas-shell {
      max-width: 1260px;
      margin: 0 auto;
      padding: 24px 0 60px;
    }
    .reservas-top-header {
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
    .reservas-title {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
    }
    .reservas-desc {
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
    }
    .btn-refresh:hover { background: #f8fafc; border-color: #94a3b8; }

    .stats-counters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .counter-card {
      padding: 18px 20px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e2e8e4;
      cursor: pointer;
      transition: all 0.15s;
    }
    .counter-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(0,0,0,0.06);
    }
    .counter-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      display: block;
      margin-bottom: 4px;
    }
    .counter-val {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      display: block;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .counter-card small {
      font-size: 11px;
      color: #94a3b8;
    }
    .card-paid .counter-val { color: #15803d; }
    .card-blocked .counter-val { color: #b45309; }
    .card-canceled .counter-val { color: #b91c1c; }

    .toolbar-box {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #ffffff;
      padding: 14px 18px;
      border: 1px solid #e2e8e4;
      border-radius: 12px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .search-input-group {
      flex: 1;
      min-width: 260px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0 12px;
      height: 40px;
    }
    .search-input-group input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 13px;
      color: #0f172a;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-group label {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
    }
    .filter-group select {
      height: 40px;
      padding: 0 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 12px;
      color: #0f172a;
      background: #fff;
    }
    .results-badge {
      font-size: 11px;
      color: #64748b;
      margin-left: auto;
      font-weight: 600;
    }

    .reservations-table-wrapper {
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 14px;
      overflow-x: auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    }
    .reservations-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .reservations-table th {
      background: #f8fafc;
      padding: 12px 14px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8e4;
      text-align: left;
    }
    .reservations-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .reservations-table tr:hover td {
      background: #f8fafc;
    }
    .ticket-id-tag {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #0284c7;
      background: #f0f9ff;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }
    .qr-code-sub {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 3px;
    }
    .passenger-name {
      display: block;
      color: #0f172a;
      font-size: 13px;
    }
    .passenger-meta {
      display: block;
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .route-info {
      display: block;
      color: #0f172a;
      font-size: 13px;
    }
    .route-meta {
      display: block;
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .seat-badge {
      display: inline-block;
      font-weight: 800;
      font-size: 12px;
      color: #0f766e;
      background: #f0fdf4;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .floor-sub {
      display: block;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .channel-chip {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .channel-web { background: #e0f2fe; color: #0369a1; }
    .channel-taquilla { background: #fef3c7; color: #b45309; }
    .vendor-sub {
      display: block;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .price-value {
      font-size: 14px;
      font-weight: 800;
      color: #064e3b;
    }
    .status-chip {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .status-pagado { background: #dcfce7; color: #15803d; }
    .status-bloqueado { background: #fef3c7; color: #b45309; }
    .status-anulado { background: #fee2e2; color: #b91c1c; }

    .btn-view-ticket {
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #fff;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-view-ticket:hover {
      background: #0f172a;
      color: #fff;
      border-color: #0f172a;
    }

    /* Modal Backdrop */
    .ticket-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 20px;
      animation: fadeIn 0.2s;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .ticket-modal-card {
      width: 100%;
      max-width: 760px;
      background: #fff;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .modal-top h3 {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .btn-close-modal {
      background: none;
      border: none;
      font-size: 18px;
      color: #94a3b8;
      cursor: pointer;
    }

    .loading-state-box, .empty-state-box {
      text-align: center;
      padding: 48px;
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8e4;
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
export class AdminReservasComponent implements OnInit {
  reservas: any[] = [];
  busqueda = '';
  estado = 'TODOS';
  cargando = false;
  boletoSeleccionado: any = null;

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.actualizar();
  }

  actualizar(): void {
    this.cargando = true;
    this.api.get<any[]>('/api/admin/reservas').subscribe({
      next: filas => {
        this.reservas = filas || [];
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  get filtradas(): any[] {
    const texto = this.busqueda.trim().toLocaleLowerCase();
    return this.reservas.filter(r => {
      const matchEstado = this.estado === 'TODOS' || r.estado_pago === this.estado;
      const matchTexto = !texto || [
        r.id, r.codigo_qr, r.nombres, r.apellidos, r.numero_documento,
        r.origen, r.destino, r.placa, r.canal, r.vendedor
      ].some(x => String(x || '').toLocaleLowerCase().includes(texto));
      return matchEstado && matchTexto;
    });
  }

  get pagados(): number { return this.reservas.filter(r => r.estado_pago === 'PAGADO').length; }
  get pendientes(): number { return this.reservas.filter(r => r.estado_pago === 'BLOQUEADO').length; }
  get anulados(): number { return this.reservas.filter(r => r.estado_pago === 'ANULADO').length; }

  get totalPagado(): string {
    const sum = this.reservas
      .filter(r => r.estado_pago === 'PAGADO')
      .reduce((acc, r) => acc + (Number(r.precio_final) || 0), 0);
    return sum.toFixed(2);
  }

  verBoleto(r: any): void {
    this.boletoSeleccionado = r;
  }

  precio(valor: number): string { return Number(valor || 0).toFixed(2); }
  estadoTexto(estado: string): string {
    const map: Record<string, string> = { PAGADO: 'Pagado', BLOQUEADO: 'Pendiente', ANULADO: 'Anulado' };
    return map[estado] || estado;
  }
}
