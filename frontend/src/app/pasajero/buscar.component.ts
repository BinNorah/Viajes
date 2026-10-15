import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { Api } from '../api.service';
import { BoletoComponent, DesgloseComponent, MapaComponent, PasajeroFormComponent } from '../shared';

@Component({
  selector: 'app-buscar', standalone: true,
  imports: [FormsModule, RouterLink, MapaComponent, DesgloseComponent, BoletoComponent, PasajeroFormComponent],
  template: `
    <section class="hero" id="inicio">
      <div class="hero-copy">
        <span class="eyebrow"><span class="eyebrow-dot"></span> Conectamos destinos, acercamos personas</span>
        <h1>Tu próximo viaje<br><em>empieza aquí.</em></h1>
        <p>Encuentra tu ruta, elige tu asiento y recibe tu boleto electrónico en unos pocos pasos.</p>
        <div class="hero-points"><span>✓ Salidas disponibles en tiempo real</span><span>✓ Asiento elegido por ti</span></div>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="sun"></div><div class="mountain mountain-back"></div><div class="mountain mountain-front"></div><div class="road"></div><div class="art-label"><span>PERÚ</span><small>Hay un destino esperándote</small></div></div>

      <form class="search-panel" id="buscar" (ngSubmit)="buscar()">
        <div class="search-heading"><div><span class="section-kicker">RESERVA EN LÍNEA</span><h2>¿A dónde quieres ir?</h2></div><span class="step-note"><b>01</b> / 03 · Buscar viaje</span></div>
        <div class="search-fields">
          <label class="search-field"><span>ORIGEN</span><span class="field-control"><span class="field-icon">⌖</span><select name="origen" [(ngModel)]="f.origen"><option value="">Cualquier ciudad</option>@for (c of ciudades; track c) {<option [value]="c">{{c}}</option>}</select></span></label>
          <button class="swap-button" type="button" aria-label="Intercambiar origen y destino" title="Intercambiar ciudades" (click)="intercambiar()">⇄</button>
          <label class="search-field"><span>DESTINO</span><span class="field-control"><span class="field-icon">◎</span><select name="destino" [(ngModel)]="f.destino"><option value="">Cualquier ciudad</option>@for (c of ciudades; track c) {<option [value]="c">{{c}}</option>}</select></span></label>
          <label class="search-field date-field"><span>FECHA DE VIAJE</span><span class="field-control"><span class="field-icon">▦</span><input name="fecha" type="date" [min]="fechaMinima" [(ngModel)]="f.fecha"></span></label>
          <button class="search-submit" type="submit" [disabled]="cargando"><span>{{cargando ? 'Buscando…' : 'Buscar viajes'}}</span><span aria-hidden="true">→</span></button>
        </div>
        @if (f.origen && f.origen === f.destino) {<p class="form-hint">El origen y el destino deben ser ciudades distintas.</p>}
      </form>
    </section>

    <section class="results-section" id="resultados">
      <div class="section-heading"><div><span class="section-kicker">PLANIFICA TU RUTA</span><h2>Salidas disponibles</h2><p>Compara horarios y tarifas para encontrar el viaje ideal.</p></div><label class="sort-control">Ordenar por <select [(ngModel)]="f.orden" (change)="buscar()"><option value="hora">Próxima salida</option><option value="precio">Menor precio</option></select></label></div>
      @if (cargando) {<div class="empty-state"><span class="loading-dot"></span><p>Consultando salidas disponibles…</p></div>}
      @else if (viajes.length) {
        <p class="results-count">{{viajes.length}} {{viajes.length === 1 ? 'salida encontrada' : 'salidas encontradas'}}</p>
        <div class="trip-list">
          @for (v of viajes; track v.id) {
            <article class="trip-card">
              <div class="trip-date"><span>{{mes(v.fecha_salida)}}</span><b>{{dia(v.fecha_salida)}}</b><small>{{diaSemana(v.fecha_salida)}}</small></div>
              <div class="trip-route"><div class="route-city"><b>{{v.origen}}</b><span>{{v.hora_salida}}</span></div><div class="route-line"><span>{{v.duracion_horas}} h</span><i></i><small>{{v.distancia_km}} km</small></div><div class="route-city destination"><b>{{v.destino}}</b><span>Ver itinerario</span></div></div>
              <div class="trip-service"><span class="service-icon">▰</span><div><b>{{servicio(v.tipo_servicio)}}</b><small>Bus {{v.placa}}</small></div></div>
              <div class="trip-seats"><span class="seat-indicator" [class.few-seats]="v.asientos_libres < 5"></span><b>{{v.asientos_libres}}</b><small>asientos libres</small></div>
              <div class="trip-price"><small>Desde</small><b>S/ {{precio(v.precio_base)}}</b><button class="trip-button" (click)="elegir(v)">Elegir asiento <span>→</span></button></div>
            </article>
          }
        </div>
      } @else if (consultado) {
        <div class="empty-state"><span class="empty-icon">⌕</span><h3>No encontramos salidas</h3><p>Prueba con otra fecha o selecciona diferentes ciudades.</p><button class="text-button" (click)="limpiarBusqueda()">Ver todas las salidas →</button></div>
      }
    </section>

    <section class="benefits-section"><div class="section-heading"><div><span class="section-kicker">VIAJAR ES MÁS SIMPLE</span><h2>Todo listo para tu viaje</h2></div></div><div class="benefit-grid"><article class="benefit-card"><span class="benefit-icon icon-route">⌖</span><div><h3>Encuentra tu ruta</h3><p>Consulta horarios, duración y precios de las salidas disponibles.</p></div><span class="benefit-number">01</span></article><article class="benefit-card"><span class="benefit-icon icon-seat">▦</span><div><h3>Elige tu asiento</h3><p>Revisa el mapa del bus y selecciona el lugar que prefieras.</p></div><span class="benefit-number">02</span></article><article class="benefit-card"><span class="benefit-icon icon-ticket">✓</span><div><h3>Recibe tu boleto</h3><p>Al completar la compra, obtén tu boleto electrónico con código QR.</p></div><span class="benefit-number">03</span></article></div></section>

    @if (viaje) {
      <section class="booking-section" id="seleccion-asiento"><div class="booking-title"><span class="section-kicker">TU VIAJE</span><h2>{{viaje.origen}} <span>→</span> {{viaje.destino}}</h2><p>{{fechaLarga(viaje.fecha_salida)}} · Salida {{viaje.hora_salida}} · {{servicio(viaje.tipo_servicio)}}</p></div><div class="booking-layout"><div class="card seat-card"><div class="card-heading"><div><span class="section-kicker">PASO 2 DE 3</span><h3>Selecciona tu asiento</h3></div><button class="text-button" (click)="cerrarViaje()">← Volver a salidas</button></div><app-mapa [viajeId]="viaje.id" (elegido)="asiento = $event"></app-mapa>@if (asiento && !reserva) {<div class="fare-summary"><div><span>Asiento {{asiento.numero_asiento}} · Piso {{asiento.piso}}</span><b>S/ {{precio(asiento.precio_final)}}</b></div><app-desglose [a]="asiento"/>@if (usuarioRegistrado) {<button class="primary-wide" (click)="bloquear()">Continuar con este asiento <span>→</span></button>} @else {<div class="register-gate"><b>Inicia sesión para reservar</b><p>La compra está disponible para pasajeros con cuenta.</p><a routerLink="/login">Ingresar o crear cuenta <span>→</span></a></div>}</div>}</div><aside class="card trip-summary"><span class="section-kicker">RESUMEN DEL VIAJE</span><h3>{{viaje.origen}} <span>→</span> {{viaje.destino}}</h3><div class="summary-row"><span>Fecha</span><b>{{fechaLarga(viaje.fecha_salida)}}</b></div><div class="summary-row"><span>Hora de salida</span><b>{{viaje.hora_salida}}</b></div><div class="summary-row"><span>Servicio</span><b>{{servicio(viaje.tipo_servicio)}}</b></div><div class="summary-total"><span>Precio desde</span><b>S/ {{precio(viaje.precio_base)}}</b></div><p class="secure-note"><span>♧</span> Tu asiento se reserva temporalmente mientras completas los datos.</p></aside></div>
        @if (reserva) {<div class="card checkout-card"><div class="checkout-header"><div><span class="section-kicker">PASO 3 DE 3</span><h3>Completa tu compra</h3></div><div class="reservation-clock"><small>Tiempo para completar</small><b class="timer">{{resta}}</b></div></div>@if (expirada) {<p class="notice notice-error">La reserva expiró y el asiento fue liberado. Elige otro asiento para continuar.</p>}<div class="checkout-grid"><div><h4>Datos del pasajero</h4><app-pasajero-form [p]="p"/></div><div class="payment-demo"><h4>Pago de demostración</h4><p>Este proyecto simula el pago. No ingreses datos de una tarjeta real.</p><label>Número de tarjeta<input [(ngModel)]="tj.tarjeta" placeholder="4242 4242 4242 0000" inputmode="numeric" autocomplete="cc-number"></label><div class="payment-row"><label>Vencimiento<input [(ngModel)]="tj.vencimiento" placeholder="MM/AA" autocomplete="cc-exp"></label><label>CVV<input [(ngModel)]="tj.cvv" placeholder="•••" type="password" autocomplete="cc-csc"></label></div><button class="primary-wide" (click)="pagar()">Pagar S/ {{precio(reserva.precio_final)}} <span>→</span></button></div></div><button class="text-button cancel-booking" (click)="cancelar()">Cancelar esta reserva</button></div>}
      </section>
    }
    @if (boleto) {<section class="card confirmation-card"><span class="section-kicker">COMPRA COMPLETADA</span><h2>¡Buen viaje!</h2><p>Tu boleto electrónico está listo. Puedes guardarlo o imprimirlo.</p><app-boleto [b]="boleto"/></section>}
  `
})
export class BuscarComponent implements OnInit, OnDestroy {
  ciudades: string[] = [];
  f: any = { origen: '', destino: '', fecha: '', orden: 'hora' };
  viajes: any[] = [];
  viaje: any = null;
  asiento: any = null;
  reserva: any = null;
  resta = '10:00';
  expirada = false;
  cargando = false;
  consultado = false;
  fechaMinima = this.fechaLocal();
  t: any;
  p: any = { tipo_documento: 'DNI' };
  tj: any = {};
  boleto: any = null;
  @ViewChild(MapaComponent) mapa?: MapaComponent;

  constructor(private api: Api, private router: Router) {}

  ngOnInit(): void {
    this.api.get<string[]>('/api/ciudades').subscribe(c => this.ciudades = c);
    this.buscar();
  }

  ngOnDestroy(): void { clearInterval(this.t); }

  buscar(): void {
    if (this.f.origen && this.f.origen === this.f.destino) return;
    this.cargando = true;
    const filtros: any = { ...this.f };
    if (!filtros.fecha) delete filtros.fecha;
    if (!filtros.origen) delete filtros.origen;
    if (!filtros.destino) delete filtros.destino;
    this.api.get<any[]>('/api/viajes?' + new URLSearchParams(filtros).toString())
      .pipe(finalize(() => this.cargando = false))
      .subscribe(v => { this.viajes = v; this.consultado = true; });
  }

  intercambiar(): void { const origen = this.f.origen; this.f.origen = this.f.destino; this.f.destino = origen; }
  limpiarBusqueda(): void { this.f = { origen: '', destino: '', fecha: '', orden: 'hora' }; this.buscar(); }
  elegir(v: any): void { this.reset(); this.viaje = v; setTimeout(() => document.getElementById('seleccion-asiento')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }
  cerrarViaje(): void { this.reset(); this.viaje = null; }
  reset(): void { clearInterval(this.t); this.asiento = null; this.reserva = null; this.boleto = null; this.expirada = false; this.resta = '10:00'; }

  get usuarioRegistrado(): boolean { return this.api.user()?.rol === 'CLIENTE'; }

  bloquear(): void {
    if (!this.usuarioRegistrado) { this.router.navigateByUrl('/login'); return; }
    this.api.post('/api/reservas', { viaje_id: this.viaje.id, asiento_id: this.asiento.id }).subscribe(r => {
      this.reserva = r; this.mapa?.cargar();
      const fin = new Date(r.fecha_expiracion_bloqueo.replace(' ', 'T')).getTime();
      this.t = setInterval(() => {
        const s = Math.max(0, Math.floor((fin - Date.now()) / 1000));
        this.resta = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
        if (!s) { clearInterval(this.t); this.expirada = true; this.reserva = null; this.asiento = null; this.mapa?.cargar(); }
      }, 500);
    });
  }

  pagar(): void {
    this.api.put(`/api/reservas/${this.reserva.id}/pasajero`, this.p)
      .pipe(switchMap(() => this.api.post(`/api/reservas/${this.reserva.id}/pagar`, this.tj)))
      .subscribe(b => { clearInterval(this.t); this.boleto = b; this.reserva = null; this.viaje = null; this.asiento = null; this.buscar(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); });
  }

  cancelar(): void {
    this.api.delete(`/api/reservas/${this.reserva.id}`).subscribe(() => { this.reset(); this.mapa?.cargar(); });
  }

  precio(valor: number): string { return Number(valor || 0).toFixed(2); }
  mes(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { month: 'short' }).replace('.', '').toUpperCase(); }
  dia(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit' }); }
  diaSemana(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''); }
  fechaLarga(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }); }
  servicio(tipo: string): string { return ({ ECONOMICO: 'Económico', EJECUTIVO: 'Ejecutivo', CAMA_160: 'Bus cama 160°', VIP_180: 'VIP 180°' } as any)[tipo] || tipo; }
  private fechaLocal(): string { const hoy = new Date(); hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset()); return hoy.toISOString().slice(0, 10); }
}

