import { Component, OnInit, ViewChild } from '@angular/core';
<<<<<<< HEAD

import { FormsModule } from '@angular/forms';
import { Api } from '../api.service';
import { BoletoComponent, DesgloseComponent, MapaComponent, PasajeroFormComponent } from '../shared/shared';

@Component({
    selector: 'app-taquilla',
    standalone: true,
    imports: [FormsModule, MapaComponent, DesgloseComponent, BoletoComponent, PasajeroFormComponent],
    templateUrl: './taquilla.component.html',
    styleUrl: './taquilla.component.css'
=======
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../api.service';
import { BoletoComponent, DesgloseComponent, MapaComponent, PasajeroFormComponent } from '../shared';

@Component({
  selector: 'app-taquilla',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaComponent, DesgloseComponent, BoletoComponent, PasajeroFormComponent],
  template: `
    <section class="taquilla-shell">
      <!-- POS Header -->
      <header class="taquilla-header">
        <div>
          <div class="pos-badge">
            <span class="live-dot"></span>
            <span>MÓDULO DE VENTAS EN VENTANILLA (POS)</span>
          </div>
          <h1 class="pos-title">Terminal de Taquilla</h1>
          <p class="pos-desc">Emisión presencial de pasajes, cobro en efectivo o tarjeta y reimpresión de comprobantes.</p>
        </div>

        @if (api.user(); as u) {
          <div class="cashier-chip">
            <span class="cashier-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            </span>
            <div>
              <b>{{ u.nombre }}</b>
              <small>Operador de Taquilla · Turno Activo</small>
            </div>
          </div>
        }
      </header>

      <!-- Main Layout: Departures & Ticket Lookup -->
      <div class="taquilla-grid">
        <!-- Left: Today's Trips -->
        <div class="pos-panel">
          <div class="panel-top">
            <div>
              <span class="kicker">PROGRAMACIÓN INMEDIATA</span>
              <h2>Salidas Programadas de Hoy</h2>
            </div>
            <button type="button" class="btn-pos-refresh" (click)="cargarHoy()" [disabled]="cargando">
              Refrescar
            </button>
          </div>

          @if (viajes.length) {
            <div class="trips-pos-list">
              @for (v of viajes; track v.id) {
                <div class="trip-pos-item" [class.is-selected]="viaje?.id === v.id">
                  <div class="trip-pos-time">
                    <span class="pos-time">{{ v.hora_salida }}</span>
                    <small>Salida</small>
                  </div>
                  <div class="trip-pos-route">
                    <b>{{ v.origen }} ⟶ {{ v.destino }}</b>
                    <small>Bus {{ v.placa }} · {{ v.tipo_servicio }}</small>
                  </div>
                  <div class="trip-pos-seats">
                    <span class="seats-count">{{ v.asientos_libres }}</span>
                    <small>libres</small>
                  </div>
                  <div class="trip-pos-actions">
                    <button type="button" class="btn-sell" (click)="elegir(v)">
                      {{ viaje?.id === v.id ? 'Seleccionado' : 'Vender Pasaje' }}
                    </button>
                    <a [href]="'/api/viajes/' + v.id + '/manifiesto'" class="btn-manifest" title="Descargar Manifiesto CSV">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    </a>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-pos-card">
              <span class="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="7" cy="18" r="1.5"></circle><circle cx="17" cy="18" r="1.5"></circle></svg>
              </span>
              <p>No hay salidas programadas para el día de hoy.</p>
            </div>
          }
        </div>

        <!-- Right: Ticket Lookup & Management -->
        <div class="pos-panel">
          <div class="panel-top">
            <div>
              <span class="kicker">BÚSQUEDA RÁPIDA</span>
              <h2>Consultar o Reimprimir Boleto</h2>
            </div>
          </div>

          <form class="lookup-form" (ngSubmit)="buscarBol()">
            <div class="lookup-input-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input [(ngModel)]="busca" name="busca" placeholder="Ingresa DNI, Pasaporte o código QR…">
            </div>
            <button type="submit" class="btn-lookup">Buscar</button>
          </form>

          <!-- Search Results -->
          @if (res.length) {
            <div class="lookup-results-list">
              <div class="results-header">Se encontraron {{ res.length }} boletos:</div>
              @for (b of res; track b.id) {
                <div class="lookup-ticket-card">
                  <div class="lt-meta">
                    <b>Boleto #{{ b.id }} · Asiento {{ b.numero_asiento }}</b>
                    <span>{{ b.nombres }} {{ b.apellidos }} ({{ b.numero_documento }})</span>
                    <small>{{ b.origen }} ⟶ {{ b.destino }} · {{ b.fecha_salida }} {{ b.hora_salida }}</small>
                  </div>
                  <div class="lt-actions">
                    <span class="status-tag tag-{{ b.estado_pago.toLowerCase() }}">{{ b.estado_pago }}</span>
                    <button type="button" class="btn-sm" (click)="ver = b">Ver / Imprimir</button>
                    @if (b.estado_pago === 'PAGADO') {
                      <button type="button" class="btn-sm btn-void" (click)="anular(b)">Anular</button>
                    }
                  </div>
                </div>
              }
            </div>
          } @else if (buscado) {
            <div class="empty-lookup-hint">
              No se encontraron boletos con ese documento o código.
            </div>
          }
        </div>
      </div>

      <!-- Live Seat Map & Checkout Modal for Counter Sale -->
      @if (viaje) {
        <section class="counter-sale-section" id="pos-asientos">
          <div class="counter-sale-header">
            <div>
              <span class="kicker">VENTA PRESENCIAL EN VENTANILLA</span>
              <h2>{{ viaje.origen }} ⟶ {{ viaje.destino }} ({{ viaje.hora_salida }})</h2>
              <p>Bus {{ viaje.placa }} · {{ viaje.tipo_servicio }} · Tarifa base: S/ {{ viaje.precio_base }}</p>
            </div>
            <button class="btn-close-sale" (click)="viaje = null">Cerrar venta</button>
          </div>

          <div class="counter-sale-grid">
            <!-- Seat selector -->
            <div class="counter-map-card">
              <app-mapa [viajeId]="viaje.id" (elegido)="asiento = $event"></app-mapa>
            </div>

            <!-- Cashier Passenger & Payment Form -->
            <div class="counter-checkout-card">
              @if (asiento) {
                <div class="cashier-step-block">
                  <h3>1. Asiento Seleccionado</h3>
                  <app-desglose [a]="asiento"></app-desglose>

                  <h3 style="margin-top:16px;">2. Datos del Pasajero</h3>
                  <app-pasajero-form [p]="p"></app-pasajero-form>

                  <h3 style="margin-top:16px;">3. Forma de Cobro</h3>
                  <div class="payment-method-toggle">
                    <button type="button" 
                            class="method-btn" 
                            [class.active]="metodo === 'EFECTIVO'"
                            (click)="metodo = 'EFECTIVO'">
                      Efectivo en Ventanilla
                    </button>
                    <button type="button" 
                            class="method-btn" 
                            [class.active]="metodo === 'TARJETA'"
                            (click)="metodo = 'TARJETA'">
                      Tarjeta / POS Físico
                    </button>
                  </div>

                  @if (metodo === 'EFECTIVO') {
                    <div class="cash-calc-box">
                      <div class="calc-row">
                        <label>Efectivo Recibido (S/):</label>
                        <input type="number" step="1" [(ngModel)]="efectivoRecibido" placeholder="0.00">
                      </div>
                      <div class="change-due">
                        <span>Vuelto a entregar:</span>
                        <b>S/ {{ calcularVuelto() }}</b>
                      </div>
                    </div>
                  }

                  <button class="btn-confirm-pos-sale" (click)="vender()">
                    <span>Registrar Venta (S/ {{ asiento.precio_final }})</span>
                  </button>
                </div>
              } @else {
                <div class="select-seat-prompt">
                  <span class="prompt-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"></rect><circle cx="9" cy="9" r="1.5"></circle></svg>
                  </span>
                  <b>Selecciona un asiento libre en el mapa</b>
                  <p>Haz clic sobre un asiento verde para iniciar la venta en ventanilla.</p>
                </div>
              }
            </div>
          </div>
        </section>
      }

      <!-- Ticket Display Modal -->
      @if (ver || boleto) {
        <div class="pos-modal-overlay" (click)="ver = null; boleto = null">
          <div class="pos-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-top">
              <h3>Boleto Emitido #{{ (ver || boleto).id }}</h3>
              <button type="button" class="btn-close-modal" (click)="ver = null; boleto = null">Cerrar</button>
            </div>
            <app-boleto [b]="ver || boleto"></app-boleto>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .taquilla-shell {
      max-width: 1260px;
      margin: 0 auto;
      padding: 24px 0 60px;
    }
    .taquilla-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      padding-bottom: 22px;
      border-bottom: 1px solid #e2e8e4;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .pos-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
    }
    .pos-title {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
    }
    .pos-desc {
      font-size: 13px;
      color: #64748b;
    }
    .cashier-chip {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .cashier-avatar {
      font-size: 20px;
    }
    .cashier-chip b {
      display: block;
      font-size: 13px;
      color: #0f172a;
    }
    .cashier-chip small {
      font-size: 11px;
      color: #64748b;
    }

    .taquilla-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    @media (max-width: 900px) {
      .taquilla-grid { grid-template-columns: 1fr; }
    }

    .pos-panel {
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    }
    .panel-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
    }
    .kicker {
      font-size: 9px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.1em;
      display: block;
      margin-bottom: 3px;
    }
    .panel-top h2 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .btn-pos-refresh {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-pos-refresh:hover { background: #f8fafc; }

    .trips-pos-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .trip-pos-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      transition: all 0.15s;
    }
    .trip-pos-item:hover {
      background: #ffffff;
      border-color: #cbd5e1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .trip-pos-item.is-selected {
      background: #f0fdf4;
      border-color: #10b981;
    }
    .trip-pos-time {
      text-align: center;
      min-width: 50px;
    }
    .pos-time {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      display: block;
    }
    .trip-pos-time small {
      font-size: 9px;
      color: #64748b;
    }
    .trip-pos-route {
      flex: 1;
      min-width: 0;
    }
    .trip-pos-route b {
      display: block;
      font-size: 13px;
      color: #0f172a;
    }
    .trip-pos-route small {
      font-size: 11px;
      color: #64748b;
    }
    .trip-pos-seats {
      text-align: center;
    }
    .seats-count {
      font-size: 16px;
      font-weight: 800;
      color: #059669;
      display: block;
    }
    .trip-pos-seats small {
      font-size: 9px;
      color: #64748b;
    }
    .trip-pos-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-sell {
      padding: 8px 14px;
      border-radius: 8px;
      background: #0f766e;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-sell:hover { background: #115e59; }
    .btn-manifest {
      padding: 7px 10px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #475569;
      text-decoration: none;
      font-size: 12px;
    }
    .btn-manifest:hover { background: #e2e8f0; }

    .lookup-form {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }
    .lookup-input-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0 12px;
      height: 40px;
    }
    .lookup-input-wrap input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 12px;
      color: #0f172a;
    }
    .btn-lookup {
      padding: 0 16px;
      border-radius: 8px;
      background: #0f172a;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      border: none;
      cursor: pointer;
    }

    .lookup-results-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .results-header {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
    }
    .lookup-ticket-card {
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .lt-meta b {
      display: block;
      font-size: 12px;
      color: #0f172a;
    }
    .lt-meta span {
      display: block;
      font-size: 11px;
      color: #475569;
    }
    .lt-meta small {
      font-size: 10px;
      color: #94a3b8;
    }
    .lt-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .status-tag {
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .tag-pagado { background: #dcfce7; color: #15803d; }
    .tag-bloqueado { background: #fef3c7; color: #b45309; }
    .tag-anulado { background: #fee2e2; color: #b91c1c; }
    .btn-sm {
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #fff;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-void {
      color: #b91c1c;
      border-color: #fecaca;
      background: #fff5f5;
    }

    /* Counter sale section */
    .counter-sale-section {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.06);
      margin-top: 24px;
    }
    .counter-sale-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .counter-sale-header h2 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .counter-sale-header p {
      font-size: 12px;
      color: #64748b;
    }
    .btn-close-sale {
      padding: 6px 14px;
      border: 1px solid #cbd5e1;
      background: #fff;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }

    .counter-sale-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
    }
    @media (max-width: 850px) {
      .counter-sale-grid { grid-template-columns: 1fr; }
    }
    .counter-checkout-card {
      padding: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
    }
    .counter-checkout-card h3 {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .payment-method-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 14px;
    }
    .method-btn {
      padding: 10px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      background: #fff;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .method-btn.active {
      border-color: #10b981;
      background: #f0fdf4;
      color: #065f46;
    }

    .cash-calc-box {
      padding: 12px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      margin-bottom: 16px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .calc-row label {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }
    .calc-row input {
      width: 110px;
      height: 34px;
      padding: 0 8px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 700;
      text-align: right;
    }
    .change-due {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #0f172a;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
    }
    .change-due b {
      font-size: 16px;
      color: #059669;
    }

    .btn-confirm-pos-sale {
      width: 100%;
      height: 44px;
      border-radius: 10px;
      background: #10b981;
      color: #fff;
      font-size: 13px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 18px;
      transition: background 0.15s;
    }
    .btn-confirm-pos-sale:hover { background: #059669; }

    .select-seat-prompt {
      text-align: center;
      padding: 50px 20px;
      color: #64748b;
    }
    .prompt-icon {
      font-size: 36px;
      display: block;
      margin-bottom: 10px;
    }

    .empty-pos-card, .empty-lookup-hint {
      text-align: center;
      padding: 30px;
      color: #64748b;
      font-size: 12px;
    }

    /* Modal */
    .pos-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 20px;
    }
    .pos-modal-card {
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
    .btn-close-modal {
      background: none;
      border: none;
      font-size: 18px;
      color: #94a3b8;
      cursor: pointer;
    }
  `]
>>>>>>> 292f258bc7f547b31f9d482907d7d7304bb875b6
})
export class TaquillaComponent implements OnInit {
  viajes: any[] = [];
  viaje: any = null;
  asiento: any = null;
  p: any = { tipo_documento: 'DNI' };
  metodo = 'EFECTIVO';
  efectivoRecibido: number | null = null;
  boleto: any = null;
  busca = '';
  res: any[] = [];
  ver: any = null;
  cargando = false;
  buscado = false;
  @ViewChild(MapaComponent) mapa?: MapaComponent;

  constructor(public api: Api) {}

  ngOnInit(): void {
    this.cargarHoy();
  }

  cargarHoy(): void {
    this.cargando = true;
    this.api.get<any[]>('/api/viajes?hoy=1').subscribe({
      next: v => {
        this.viajes = v || [];
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  elegir(v: any): void {
    this.viaje = v;
    this.asiento = null;
    this.boleto = null;
    this.efectivoRecibido = null;
    setTimeout(() => {
      document.getElementById('pos-asientos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  calcularVuelto(): string {
    const total = Number(this.asiento?.precio_final || 0);
    const rec = Number(this.efectivoRecibido || 0);
    return Math.max(0, rec - total).toFixed(2);
  }

  vender(): void {
    if (!this.p.nombres || !this.p.apellidos || !this.p.numero_documento) {
      this.api.toast.error('Completa los datos del pasajero antes de emitir.', 'Datos faltantes');
      return;
    }

    this.api.post('/api/taquilla/venta', {
      viaje_id: this.viaje.id,
      asiento_id: this.asiento.id,
      metodo: this.metodo,
      pasajero: this.p
    }).subscribe({
      next: b => {
        this.boleto = b;
        this.api.toast.success(`Boleto #${b.id} emitido con éxito. Asiento ${this.asiento.numero_asiento}.`, 'Venta registrada');
        this.asiento = null;
        this.p = { tipo_documento: 'DNI' };
        this.efectivoRecibido = null;
        this.cargarHoy();
        this.mapa?.cargar();
      }
    });
  }

  anular(b: any): void {
    if (!confirm(`¿Confirmas la anulación del boleto #${b.id}? El asiento quedará libre inmediatamente.`)) return;
    this.api.post(`/api/taquilla/anular/${b.id}`).subscribe({
      next: () => {
        this.api.toast.info(`Boleto #${b.id} anulado. Asiento liberado.`, 'Boleto anulado');
        this.cargarHoy();
        if (this.busca) this.buscarBol();
        this.mapa?.cargar();
      }
    });
  }

  buscarBol(): void {
    if (!this.busca.trim()) return;
    const q = encodeURIComponent(this.busca.trim());
    this.api.get<any[]>(`/api/boletos?doc=${q}&qr=${q}`).subscribe({
      next: l => {
        this.res = l || [];
        this.buscado = true;
      }
    });
  }
}
