import { Component, OnInit } from '@angular/core';
<<<<<<< HEAD

import { Api } from '../api.service';

@Component({
    selector: 'app-chofer',
    imports: [],
    templateUrl: './chofer.component.html',
    styleUrl: './chofer.component.css'
=======
import { CommonModule } from '@angular/common';
import { Api } from '../api.service';

@Component({
  selector: 'app-chofer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="chofer-shell">
      <header class="chofer-header">
        <div>
          <div class="chofer-badge">
            <span class="live-dot"></span>
            <span>MÓDULO OPERATIVO DE RUTA</span>
          </div>
          <h1 class="chofer-title">Mi Itinerario de Conducción</h1>
          <p class="chofer-desc">Consulta tus viajes asignados, estado de la unidad y lista oficial de pasajeros para el abordaje.</p>
        </div>

        @if (api.user(); as u) {
          <div class="driver-profile-card">
            <span class="driver-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
            </span>
            <div>
              <b>{{ u.nombre }}</b>
              <small>Conductor Autorizado · DNI {{ u.dni }}</small>
            </div>
          </div>
        }
      </header>

      <!-- Trips List -->
      @if (cargando) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Consultando asignaciones de ruta…</p>
        </div>
      } @else if (v.length) {
        <div class="driver-trips-grid">
          @for (x of v; track x.id) {
            <article class="driver-trip-card">
              <div class="dt-top">
                <div class="dt-time-badge">
                  <span class="dt-time">{{ x.hora_salida }}</span>
                  <small>{{ x.fecha_salida }}</small>
                </div>
                <span class="trip-status status-{{ x.estado.toLowerCase() }}">{{ x.estado }}</span>
              </div>

              <div class="dt-route">
                <b>{{ x.origen }} ⟶ {{ x.destino }}</b>
                <div class="dt-bus-meta">
                  <span>Bus {{ x.placa }} ({{ x.tipo_servicio }})</span>
                  <span>Distancia: {{ x.distancia_km }} km</span>
                </div>
              </div>

              <div class="dt-passengers-bar">
                <div class="pax-counter">
                  <b>{{ x.ocupados }}</b>
                  <small>pasajeros a bordo</small>
                </div>
                <div class="pax-actions">
                  <button type="button" class="btn-pax-view" (click)="verPasajeros(x)">
                    Ver Lista de Pasajeros
                  </button>
                  <a [href]="'/api/viajes/' + x.id + '/manifiesto'" class="btn-manifest-download">
                    Descargar Manifiesto CSV
                  </a>
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="empty-driver-card">
          <span class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="7" cy="18" r="1.5"></circle><circle cx="17" cy="18" r="1.5"></circle></svg>
          </span>
          <h3>No tienes viajes asignados en este momento</h3>
          <p>Tu coordinador de flota te asignará itinerarios cuando se programen nuevas salidas.</p>
        </div>
      }

      <!-- Passenger List Modal -->
      @if (manifiestoModal) {
        <div class="modal-backdrop" (click)="manifiestoModal = null">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <div>
                <span class="kicker">MANIFIESTO DE PASAJEROS</span>
                <h3>Viaje #{{ manifiestoModal.viaje.id }} · {{ manifiestoModal.viaje.origen }} ⟶ {{ manifiestoModal.viaje.destino }}</h3>
                <small>{{ manifiestoModal.viaje.fecha_salida }} {{ manifiestoModal.viaje.hora_salida }} · Bus {{ manifiestoModal.viaje.placa }}</small>
              </div>
              <button class="btn-close" (click)="manifiestoModal = null">Cerrar</button>
            </div>

            <div class="modal-content">
              @if (manifiestoModal.pasajeros?.length) {
                <table class="pax-table">
                  <thead>
                    <tr>
                      <th>Asiento</th>
                      <th>Pasajero</th>
                      <th>Documento</th>
                      <th>Teléfono</th>
                      <th>Código QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of manifiestoModal.pasajeros; track p.codigo_qr) {
                      <tr>
                        <td><b class="seat-pill">Asiento {{ p.numero_asiento }} (Piso {{ p.piso }})</b></td>
                        <td><b>{{ p.nombres }} {{ p.apellidos }}</b></td>
                        <td>{{ p.tipo_documento }} {{ p.numero_documento }}</td>
                        <td>{{ p.telefono || '—' }}</td>
                        <td><span class="qr-pill">{{ p.codigo_qr }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="empty-pax-notice">
                  Aún no hay pasajeros confirmados para esta salida.
                </div>
              }
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .chofer-shell {
      max-width: 1080px;
      margin: 0 auto;
      padding: 24px 0 60px;
    }
    .chofer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      padding-bottom: 22px;
      border-bottom: 1px solid #e2e8e4;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .chofer-badge {
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
    .chofer-title {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
    }
    .chofer-desc {
      font-size: 13px;
      color: #64748b;
    }
    .driver-profile-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .driver-avatar {
      font-size: 20px;
    }
    .driver-profile-card b {
      display: block;
      font-size: 13px;
      color: #0f172a;
    }
    .driver-profile-card small {
      font-size: 11px;
      color: #64748b;
    }

    .driver-trips-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .driver-trip-card {
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    }
    .dt-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .dt-time-badge {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .dt-time {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
    }
    .dt-time-badge small {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
    .trip-status {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 9999px;
    }
    .status-programado { background: #dcfce7; color: #15803d; }
    .status-abordando { background: #fef3c7; color: #b45309; }
    .status-en_ruta { background: #e0f2fe; color: #0369a1; }
    .status-finalizado { background: #f1f5f9; color: #64748b; }

    .dt-route {
      margin-bottom: 18px;
    }
    .dt-route b {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      display: block;
      margin-bottom: 4px;
    }
    .dt-bus-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
    }

    .dt-passengers-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 14px;
    }
    .pax-counter {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .pax-counter b {
      font-size: 22px;
      font-weight: 800;
      color: #059669;
    }
    .pax-counter small {
      font-size: 12px;
      color: #64748b;
    }
    .pax-actions {
      display: flex;
      gap: 10px;
    }
    .btn-pax-view {
      padding: 8px 14px;
      border-radius: 8px;
      background: #0f766e;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-pax-view:hover { background: #115e59; }
    .btn-manifest-download {
      padding: 8px 14px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #334155;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      border: 1px solid #cbd5e1;
    }
    .btn-manifest-download:hover { background: #e2e8f0; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      max-width: 820px;
      background: #fff;
      border-radius: 18px;
      padding: 24px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    }
    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .kicker {
      font-size: 9px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.1em;
      display: block;
      margin-bottom: 2px;
    }
    .modal-head h3 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .modal-head small {
      color: #64748b;
      font-size: 12px;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #94a3b8;
      cursor: pointer;
    }

    .pax-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .pax-table th {
      background: #f8fafc;
      padding: 10px 12px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    .pax-table td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .seat-pill {
      color: #0f766e;
      font-size: 12px;
    }
    .qr-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .empty-driver-card {
      text-align: center;
      padding: 56px 20px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px dashed #cbd5e1;
    }
    .empty-icon {
      font-size: 42px;
      display: block;
      margin-bottom: 12px;
    }
  `]
>>>>>>> 292f258bc7f547b31f9d482907d7d7304bb875b6
})
export class ChoferComponent implements OnInit {
  v: any[] = [];
  cargando = false;
  manifiestoModal: any = null;

  constructor(public api: Api) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.api.get<any[]>('/api/chofer/viajes').subscribe({
      next: res => {
        this.v = res || [];
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  verPasajeros(x: any): void {
    this.api.get(`/api/viajes/${x.id}/manifiesto?formato=json`).subscribe({
      next: (res: any) => {
        this.manifiestoModal = res;
      }
    });
  }
}
