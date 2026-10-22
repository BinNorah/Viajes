import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api } from '../api.service';
import { BoletoComponent } from '../shared';

@Component({
  selector: 'app-mis-viajes',
  standalone: true,
  imports: [CommonModule, RouterLink, BoletoComponent],
  template: `
    <section class="mis-viajes-shell">
      <header class="mis-viajes-header">
        <div>
          <span class="kicker">PORTAL DEL PASAJERO</span>
          <h1 class="page-title">Mis Boletos y Viajes</h1>
          <p class="page-desc">Consulta tus itinerarios programados, descarga tus boletos con código QR y revisa tu historial.</p>
        </div>

        @if (api.user(); as u) {
          <div class="user-summary-card">
            <span class="user-avatar-circle">{{ u.nombre.charAt(0) }}</span>
            <div>
              <b>{{ u.nombre }}</b>
              <small>DNI {{ u.dni }} · Pasajero frecuente</small>
            </div>
          </div>
        }
      </header>

      <!-- Category Filter Tabs -->
      <div class="filter-tabs-row">
        <button type="button" 
                class="tab-chip" 
                [class.active]="tabActiva === 'proximos'" 
                (click)="tabActiva = 'proximos'">
          <span>Próximos Viajes</span>
          <span class="count-pill">{{ proximos.length }}</span>
        </button>

        <button type="button" 
                class="tab-chip" 
                [class.active]="tabActiva === 'pasados'" 
                (click)="tabActiva = 'pasados'">
          <span>Viajes Realizados</span>
          <span class="count-pill">{{ pasados.length }}</span>
        </button>

        <button type="button" 
                class="tab-chip" 
                [class.active]="tabActiva === 'anulados'" 
                (click)="tabActiva = 'anulados'">
          <span>Cancelados / Expirados</span>
          <span class="count-pill">{{ anulados.length }}</span>
        </button>
      </div>

      <!-- Tab 1: Próximos Viajes -->
      @if (tabActiva === 'proximos') {
        <div class="tickets-view">
          @for (b of proximos; track b.id) {
            <div class="ticket-wrapper">
              <div class="ticket-status-bar">
                <span class="departure-countdown">Salida el {{ b.fecha_salida }} a las {{ b.hora_salida }} hrs</span>
                <span class="boarding-badge">Confirmado para abordar</span>
              </div>
              <app-boleto [b]="b"></app-boleto>
            </div>
          } @empty {
            <div class="empty-travels-card">
              <span class="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </span>
              <h3>No tienes viajes próximos programados</h3>
              <p>Tu próximo destino te espera. Elige tu ruta y reserva con anticipación.</p>
              <a routerLink="/" class="btn-book-travel">
                Buscar Pasajes Disponibles →
              </a>
            </div>
          }
        </div>
      }

      <!-- Tab 2: Pasados -->
      @if (tabActiva === 'pasados') {
        <div class="tickets-view">
          @for (b of pasados; track b.id) {
            <div class="ticket-wrapper past-ticket">
              <div class="ticket-status-bar past-bar">
                <span>Viaje completado · {{ b.fecha_salida }}</span>
                <span>Finalizado</span>
              </div>
              <app-boleto [b]="b"></app-boleto>
            </div>
          } @empty {
            <div class="empty-travels-card">
              <span class="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </span>
              <h3>No hay viajes anteriores registrados</h3>
              <p>Tus compras completadas aparecerán en esta sección como historial.</p>
            </div>
          }
        </div>
      }

      <!-- Tab 3: Anulados -->
      @if (tabActiva === 'anulados') {
        <div class="tickets-view">
          @for (b of anulados; track b.id) {
            <div class="ticket-wrapper canceled-ticket">
              <div class="ticket-status-bar canceled-bar">
                <span>Reserva anulada / expirada</span>
                <span>No válido para viaje</span>
              </div>
              <app-boleto [b]="b"></app-boleto>
            </div>
          } @empty {
            <div class="empty-travels-card">
              <span class="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              <h3>No tienes reservas anuladas</h3>
              <p>Todas tus compras se encuentran en estado activo.</p>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .mis-viajes-shell {
      max-width: 1080px;
      margin: 0 auto;
      padding: 24px 0 60px;
    }
    .mis-viajes-header {
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
    .page-title {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
    }
    .page-desc {
      font-size: 13px;
      color: #64748b;
    }
    .user-summary-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e2e8e4;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .user-avatar-circle {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #10b981;
      color: #fff;
      font-weight: 800;
      font-size: 15px;
      display: grid;
      place-items: center;
    }
    .user-summary-card b {
      display: block;
      font-size: 13px;
      color: #0f172a;
    }
    .user-summary-card small {
      font-size: 11px;
      color: #64748b;
    }

    .filter-tabs-row {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .tab-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-chip:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .tab-chip.active {
      background: #064e3b;
      color: #ffffff;
      border-color: #064e3b;
      box-shadow: 0 4px 12px rgba(6, 78, 59, 0.2);
    }
    .count-pill {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 9999px;
      background: rgba(0, 0, 0, 0.08);
    }
    .tab-chip.active .count-pill {
      background: rgba(255, 255, 255, 0.25);
      color: #fff;
    }

    .tickets-view {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .ticket-wrapper {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #e2e8e4;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }
    .ticket-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #f0fdf4;
      border-bottom: 1px solid #bbf7d0;
      font-size: 12px;
      font-weight: 700;
      color: #166534;
    }
    .boarding-badge {
      font-size: 11px;
      background: #dcfce7;
      color: #15803d;
      padding: 3px 10px;
      border-radius: 9999px;
    }
    .past-bar {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #64748b;
    }
    .canceled-bar {
      background: #fef2f2;
      border-color: #fecaca;
      color: #b91c1c;
    }

    .empty-travels-card {
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
    .empty-travels-card h3 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .empty-travels-card p {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 20px;
    }
    .btn-book-travel {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 10px;
      background: #10b981;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
      transition: all 0.15s;
    }
    .btn-book-travel:hover {
      background: #059669;
      transform: translateY(-1px);
    }
  `]
})
export class MisViajesComponent implements OnInit {
  proximos: any[] = [];
  pasados: any[] = [];
  anulados: any[] = [];
  tabActiva = 'proximos';

  constructor(public api: Api) {}

  ngOnInit(): void {
    const hoy = new Date().toISOString().slice(0, 10);
    this.api.get<any[]>('/api/mis-viajes').subscribe({
      next: b => {
        const ok = (b || []).filter(x => x.estado_pago !== 'ANULADO');
        this.proximos = ok.filter(x => x.fecha_salida >= hoy);
        this.pasados = ok.filter(x => x.fecha_salida < hoy);
        this.anulados = (b || []).filter(x => x.estado_pago === 'ANULADO');
      }
    });
  }
}
