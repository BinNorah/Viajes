import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from './api.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  template: `
    <div class="seat-map" aria-label="Mapa de asientos">
      <div class="seat-legend"><span><i class="seat free"></i> Libre</span><span><i class="seat selected"></i> Elegido</span><span><i class="seat occupied"></i> Ocupado</span><span><i class="seat blocked"></i> Reservado</span></div>
      @if (cargando) { <p>Cargando mapa de asientos…</p> }
      @else {
        @for (piso of pisos; track piso) {
          <section class="bus-floor"><h4>{{ pisos.length > 1 ? 'Piso ' + piso : 'Asientos disponibles' }}</h4>
            <div class="seat-grid">
              @for (a of asientosPorPiso(piso); track a.id) {
                <button type="button" class="seat-button" [class.is-selected]="seleccionado?.id === a.id" [class.is-occupied]="a.estado === 'OCUPADO'" [class.is-blocked]="a.estado === 'BLOQUEADO'" [disabled]="a.estado !== 'LIBRE' && !a.mio" [attr.aria-label]="'Asiento ' + a.numero_asiento + ', ' + a.estado" (click)="seleccionar(a)">
                  <span>{{ a.numero_asiento }}</span><small>{{ a.ubicacion || '' }}</small>
                </button>
              }
            </div>
          </section>
        } @empty { <p>No hay asientos disponibles para este viaje.</p> }
      }
    </div>`
})
export class MapaComponent implements OnInit {
  @Input() viajeId: number | string | null = null;
  @Output() elegido = new EventEmitter<any>();
  asientos: any[] = [];
  seleccionado: any = null;
  cargando = false;
  constructor(private api: Api) {}
  ngOnInit(): void { this.cargar(); }
  cargar(): void {
    if (!this.viajeId) return;
    this.cargando = true;
    this.api.get<any>(`/api/viajes/${this.viajeId}/asientos`).subscribe({
      next: r => { this.asientos = r.asientos || []; this.cargando = false; if (this.seleccionado && !this.asientos.some(a => a.id === this.seleccionado.id && a.estado === 'LIBRE')) { this.seleccionado = null; this.elegido.emit(null); } },
      error: () => { this.cargando = false; this.asientos = []; }
    });
  }
  get pisos(): number[] { return [...new Set(this.asientos.map(a => Number(a.piso)))].sort((a, b) => a - b); }
  asientosPorPiso(piso: number): any[] { return this.asientos.filter(a => Number(a.piso) === piso); }
  seleccionar(a: any): void { if (a.estado !== 'LIBRE' && !a.mio) return; this.seleccionado = a; this.elegido.emit(a); }
}

@Component({
  selector: 'app-desglose', standalone: true,
  template: `<div class="fare-breakdown"><div><span>Tarifa base</span><b>S/ {{numero(a?.precio_base)}}</b></div><div><span>Recargo de asiento</span><b>S/ {{numero(a?.recargo_precio)}}</b></div><div class="fare-total"><span>Total</span><b>S/ {{numero(a?.precio_final)}}</b></div></div>`
})
export class DesgloseComponent {
  @Input() a: any;
  numero(v: any): string { return Number(v || 0).toFixed(2); }
}

@Component({
  selector: 'app-pasajero-form', standalone: true, imports: [FormsModule],
  template: `<div class="passenger-form">
    <label>Tipo de documento<select name="tipo_documento" [(ngModel)]="p.tipo_documento"><option value="DNI">DNI</option><option value="PASAPORTE">Pasaporte</option><option value="CE">Carné de extranjería</option></select></label>
    <label>Número de documento<input name="numero_documento" [(ngModel)]="p.numero_documento" required autocomplete="off"></label>
    <label>Nombres<input name="nombres" [(ngModel)]="p.nombres" required autocomplete="given-name"></label>
    <label>Apellidos<input name="apellidos" [(ngModel)]="p.apellidos" required autocomplete="family-name"></label>
    <label>Teléfono<input name="telefono" [(ngModel)]="p.telefono" type="tel" autocomplete="tel"></label>
  </div>`
})
export class PasajeroFormComponent {
  @Input() p: any = {};
}

@Component({
  selector: 'app-boleto', standalone: true,
  template: `<article class="ticket-card">
    <header><span class="ticket-brand">RUTAS DEL PERÚ</span><span class="ticket-status">{{b?.estado_pago || 'PAGADO'}}</span></header>
    <div class="ticket-route"><div><small>ORIGEN</small><b>{{b?.origen || '—'}}</b><span>{{b?.hora_salida || ''}}</span></div><strong aria-hidden="true">→</strong><div><small>DESTINO</small><b>{{b?.destino || '—'}}</b><span>{{b?.fecha_salida || ''}}</span></div></div>
    <div class="ticket-details"><span>Pasajero <b>{{b?.nombres}} {{b?.apellidos}}</b></span><span>Documento <b>{{b?.tipo_documento}} {{b?.numero_documento}}</b></span><span>Asiento <b>{{b?.numero_asiento || '—'}}</b></span><span>Servicio <b>{{b?.tipo_servicio || '—'}}</b></span><span>Código <b>{{b?.codigo_qr || ('BOL-' + b?.id)}}</b></span><span>Total <b>S/ {{numero(b?.precio_final)}}</b></span></div>
    <button type="button" class="ticket-print" (click)="imprimir()">Imprimir boleto</button>
  </article>`
})
export class BoletoComponent {
  @Input() b: any;
  numero(v: any): string { return Number(v || 0).toFixed(2); }
  imprimir(): void { window.print(); }
}
