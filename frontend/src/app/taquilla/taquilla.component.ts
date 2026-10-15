import { Component, OnInit, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../api.service';
import { BoletoComponent, DesgloseComponent, MapaComponent, PasajeroFormComponent } from '../shared';

@Component({
  selector: 'app-taquilla', standalone: true,
  imports: [FormsModule, NgTemplateOutlet, MapaComponent, DesgloseComponent, BoletoComponent, PasajeroFormComponent],
  template: `
  <ng-template #tabla let-l>
    @if (l.length) {
      <table><tr><th>#</th><th>Viaje</th><th>Asiento</th><th>Pasajero</th><th>Documento</th><th>Estado</th><th></th></tr>
      @for (b of l; track b.id) {
        <tr><td>{{b.id}}</td><td>{{b.origen}} → {{b.destino}} {{b.fecha_salida}} {{b.hora_salida}}</td><td>{{b.numero_asiento}}</td>
          <td>{{b.nombres}} {{b.apellidos}}</td><td>{{b.numero_documento}}</td><td>{{b.estado_pago}}</td>
          <td>@if (b.estado_pago == 'PAGADO') {
            <button class="b r" (click)="anular(b)">Anular</button>
            <button class="b" (click)="reenviar(b)">Reenviar</button>
            <button class="b" (click)="ver = b">Ver / imprimir</button> }</td></tr>
      }</table>
    } @else { <p>Sin boletos.</p> }
  </ng-template>

  <div class="card"><h2>Viajes de hoy</h2>
    @if (viajes.length) {
      <table><tr><th>Hora</th><th>Ruta</th><th>Bus</th><th>Libres</th><th></th></tr>
      @for (v of viajes; track v.id) {
        <tr><td>{{v.hora_salida}}</td><td>{{v.origen}} → {{v.destino}}</td><td>{{v.placa}}</td><td>{{v.asientos_libres}}</td>
          <td><button class="b" (click)="elegir(v)">Vender</button>
              <a [href]="'/api/viajes/' + v.id + '/manifiesto'">Manifiesto CSV</a></td></tr>
      }</table>
    } @else { <p>No hay salidas programadas para hoy.</p> }
  </div>
  <div class="card"><h3>Reimprimir / reenviar boleto</h3>
    <input [(ngModel)]="busca" placeholder="DNI/Pasaporte o código QR"><button class="b" (click)="buscarBol()">Buscar</button>
    <ng-container *ngTemplateOutlet="tabla; context: {$implicit: res}"></ng-container></div>

  @if (viaje) {
    <div class="card"><h3>Venta presencial · {{viaje.origen}} → {{viaje.destino}} {{viaje.hora_salida}}</h3>
      <app-mapa [viajeId]="viaje.id" (elegido)="asiento = $event"></app-mapa>
      @if (asiento) {
        <app-desglose [a]="asiento" /><app-pasajero-form [p]="p" />
        <select [(ngModel)]="metodo"><option>EFECTIVO</option><option>TARJETA</option></select>
        <button class="b g" (click)="vender()">Registrar venta</button>
      }
      @if (boleto) { <app-boleto [b]="boleto" /> }
    </div>
    <div class="card"><h3>Boletos del viaje</h3><ng-container *ngTemplateOutlet="tabla; context: {$implicit: lista}"></ng-container></div>
  }
  @if (ver) { <div class="card"><app-boleto [b]="ver" /></div> }`
})
export class TaquillaComponent implements OnInit {
  viajes: any[] = []; viaje: any = null; asiento: any = null; p: any = { tipo_documento: 'DNI' };
  metodo = 'EFECTIVO'; boleto: any = null; lista: any[] = []; busca = ''; res: any[] = []; ver: any = null;
  @ViewChild(MapaComponent) mapa?: MapaComponent;
  constructor(private api: Api) {}
  ngOnInit() { this.api.get<any[]>('/api/viajes?hoy=1').subscribe(v => this.viajes = v); }
  elegir(v: any) { this.viaje = v; this.asiento = null; this.boleto = null; this.cargarLista(); }
  cargarLista() { if (this.viaje) this.api.get<any[]>(`/api/viajes/${this.viaje.id}/boletos`).subscribe(l => this.lista = l); }
  vender() {
    this.api.post('/api/taquilla/venta', { viaje_id: this.viaje.id, asiento_id: this.asiento.id, metodo: this.metodo, pasajero: this.p })
      .subscribe(b => { this.boleto = b; this.asiento = null; this.p = { tipo_documento: 'DNI' }; this.cargarLista(); this.mapa?.cargar(); });
  }
  anular(b: any) {
    if (!confirm('¿Anular boleto ' + b.id + '? El asiento quedará libre.')) return;
    this.api.post('/api/taquilla/anular/' + b.id).subscribe(() => { this.cargarLista(); if (this.busca) this.buscarBol(); this.mapa?.cargar(); });
  }
  reenviar(b: any) {
    const correo = prompt('Correo destino (opcional)') || '';
    this.api.post(`/api/boletos/${b.id}/reenviar`, { correo }).subscribe(r => alert(r.mensaje));
  }
  buscarBol() {
    const q = encodeURIComponent(this.busca);
    this.api.get<any[]>(`/api/boletos?doc=${q}&qr=${q}`).subscribe(l => this.res = l);
  }
}
