import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../api.service';

@Component({
  selector: 'app-admin-reservas', standalone: true, imports: [FormsModule],
  template: `
    <section class="card reservations-admin">
      <div class="admin-heading"><div><span class="section-kicker">GESTIÓN COMERCIAL</span><h2>Reservas y ventas</h2><p>Consulta las reservas creadas desde la web y las ventas de taquilla.</p></div><button class="b" (click)="actualizar()" [disabled]="cargando">{{cargando ? 'Actualizando…' : '↻ Actualizar'}}</button></div>
      <div class="reservation-stats"><div><span>Registros</span><b>{{reservas.length}}</b></div><div><span>Pagados</span><b>{{pagados}}</b></div><div><span>Pendientes</span><b>{{pendientes}}</b></div><div><span>Anulados</span><b>{{anulados}}</b></div></div>
      <div class="reservation-filters"><label>Buscar<input [(ngModel)]="busqueda" placeholder="Pasajero, ruta, DNI, QR o boleto"></label><label>Estado<select [(ngModel)]="estado"><option value="TODOS">Todos los estados</option><option value="PAGADO">Pagados</option><option value="BLOQUEADO">Pendientes</option><option value="ANULADO">Anulados</option></select></label><span>{{filtradas.length}} resultados</span></div>
      @if (cargando) {<div class="reservation-empty">Cargando las reservas…</div>}
      @else if (filtradas.length) {
        <div class="reservations-table-wrap"><table><thead><tr><th>Boleto</th><th>Pasajero</th><th>Viaje</th><th>Asiento</th><th>Venta</th><th>Importe</th><th>Estado</th><th>Registro</th></tr></thead><tbody>
          @for (r of filtradas; track r.id) {<tr><td><b>#{{r.id}}</b><small>{{r.codigo_qr || 'Aún sin QR'}}</small></td><td><b>{{r.nombres}} {{r.apellidos}}</b><small>{{r.tipo_documento}} {{r.numero_documento}} · {{r.telefono || 'Sin teléfono'}}</small></td><td><b>{{r.origen}} → {{r.destino}}</b><small>{{r.fecha_salida}} · {{r.hora_salida}} · {{r.placa}} ({{servicio(r.tipo_servicio)}})</small></td><td><b>{{r.numero_asiento}}</b><small>Piso {{r.piso}}</small></td><td><span class="sale-channel">{{r.canal}}</span><small>{{r.vendedor || 'Venta web'}}</small></td><td><b>S/ {{precio(r.precio_final)}}</b></td><td><span class="reservation-status" [class]="'reservation-status status-' + r.estado_pago.toLowerCase()">{{estadoTexto(r.estado_pago)}}</span></td><td>{{fechaHora(r.fecha_emision)}}</td></tr>}
        </tbody></table></div>
      } @else {<div class="reservation-empty"><b>No hay reservas para mostrar</b><span>Prueba cambiando el estado o el texto de búsqueda.</span></div>}
    </section>
  `,
  styles: [`
    :host{display:block}.reservations-admin{padding:24px}.admin-heading{display:flex;align-items:center;justify-content:space-between;gap:18px}.admin-heading h2{margin:0;color:#1b3129;font:800 27px Manrope,sans-serif;letter-spacing:-.05em}.admin-heading p{margin:7px 0 0;color:#7b8982;font-size:12px}.reservation-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0;padding:14px;border:1px solid #e8ede8;border-radius:11px;background:#fafbf9}.reservation-stats>div{display:grid;gap:5px;padding:5px 13px;border-right:1px solid #e4eae4}.reservation-stats>div:last-child{border:0}.reservation-stats span{color:#839087;font-size:10px}.reservation-stats b{color:#234b3a;font:800 22px Manrope,sans-serif}.reservation-filters{display:flex;align-items:end;gap:12px;margin-bottom:15px}.reservation-filters label{display:grid;gap:5px;color:#63756a;font-size:10px;font-weight:700}.reservation-filters input,.reservation-filters select{height:38px;min-width:200px;margin:0}.reservation-filters>span{margin:0 0 10px auto;color:#8a968e;font-size:10px}.reservations-table-wrap{overflow:auto;border:1px solid #e5ebe5;border-radius:10px}.reservations-table-wrap table{min-width:950px;margin:0;border:0;font-size:11px}.reservations-table-wrap th{white-space:nowrap}.reservations-table-wrap td{vertical-align:top}.reservations-table-wrap td b,.reservations-table-wrap td small{display:block}.reservations-table-wrap td b{color:#33483c}.reservations-table-wrap td small{max-width:220px;margin-top:4px;color:#89958e;font-size:9px;overflow-wrap:anywhere}.sale-channel{display:inline-block;padding:4px 7px;border-radius:5px;background:#edf4e9;color:#4b7654;font-size:9px;font-weight:800}.reservation-status{display:inline-block;padding:5px 8px;border-radius:20px;font-size:9px;font-weight:800;white-space:nowrap}.status-pagado{background:#e3f3e4;color:#327146}.status-bloqueado{background:#fff1d2;color:#91651d}.status-anulado{background:#f8e5e2;color:#a14a40}.reservation-empty{display:grid;justify-items:center;gap:6px;padding:38px;color:#819087;font-size:11px}.reservation-empty b{color:#40564a;font-size:13px}@media(max-width:650px){.reservations-admin{padding:16px}.admin-heading{align-items:flex-start;flex-direction:column}.reservation-stats{grid-template-columns:repeat(2,1fr);gap:5px}.reservation-stats>div:nth-child(2){border:0}.reservation-filters{align-items:stretch;flex-direction:column}.reservation-filters input,.reservation-filters select{min-width:0;width:100%}.reservation-filters>span{margin:0}}
  `]
})
export class AdminReservasComponent implements OnInit {
  reservas: any[] = [];
  busqueda = '';
  estado = 'TODOS';
  cargando = false;
  constructor(private api: Api) {}
  ngOnInit(): void { this.actualizar(); }
  actualizar(): void { this.cargando = true; this.api.get<any[]>('/api/admin/reservas').subscribe({ next: filas => { this.reservas = filas; this.cargando = false; }, error: () => this.cargando = false }); }
  get filtradas(): any[] {
    const texto = this.busqueda.trim().toLocaleLowerCase();
    return this.reservas.filter(r => (this.estado === 'TODOS' || r.estado_pago === this.estado) && (!texto || [r.id, r.codigo_qr, r.nombres, r.apellidos, r.numero_documento, r.origen, r.destino, r.placa, r.canal, r.vendedor].some(x => String(x || '').toLocaleLowerCase().includes(texto))));
  }
  get pagados(): number { return this.reservas.filter(r => r.estado_pago === 'PAGADO').length; }
  get pendientes(): number { return this.reservas.filter(r => r.estado_pago === 'BLOQUEADO').length; }
  get anulados(): number { return this.reservas.filter(r => r.estado_pago === 'ANULADO').length; }
  precio(valor: number): string { return Number(valor || 0).toFixed(2); }
  servicio(tipo: string): string { return ({ ECONOMICO: 'Económico', EJECUTIVO: 'Ejecutivo', CAMA_160: 'Bus cama', VIP_180: 'VIP' } as any)[tipo] || tipo; }
  estadoTexto(estado: string): string { return ({ PAGADO: 'Pagado', BLOQUEADO: 'Pendiente', ANULADO: 'Anulado' } as any)[estado] || estado; }
  fechaHora(fecha: string): string { return fecha ? new Date(`${fecha.replace(' ', 'T')}`).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
}

