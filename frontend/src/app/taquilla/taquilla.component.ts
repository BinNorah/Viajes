import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../api.service';
import { BoletoComponent } from '../boleto/boleto.component';
import { DesgloseComponent } from '../desglose/desglose.component';
import { MapaComponent } from '../mapa/mapa.component';

@Component({
  selector: 'app-taquilla',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MapaComponent, DesgloseComponent, BoletoComponent],
  templateUrl: './taquilla.component.html',
  styleUrl: './taquilla.component.css'
})
export class TaquillaComponent implements OnInit {
  viajes: any[] = [];
  viajeSeleccionado: any = null;
  asientoSeleccionado: any = null;
  pasajero: any = { tipo_documento: 'DNI' };
  metodoPago = 'EFECTIVO';
  efectivoRecibido: number | null = null;
  boletoEmitido: any = null;
  terminoBusqueda = '';
  resultadosBoletos: any[] = [];
  cargando = false;
  busquedaRealizada = false;

  @ViewChild(MapaComponent) mapa?: MapaComponent;

  constructor(public api: Api, private router: Router) {}

  get usuarioActual() {
    return this.api.user;
  }

  cerrarSesion(): void {
    this.api.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  ngOnInit(): void {
    this.cargarHoy();
  }

  cargarHoy(): void {
    this.cargando = true;
    this.api.get<any[]>('/api/viajes?hoy=1').subscribe({
      next: lista => {
        this.viajes = lista || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  seleccionarViaje(viaje: any): void {
    this.viajeSeleccionado = viaje;
    this.asientoSeleccionado = null;
    this.boletoEmitido = null;
    this.efectivoRecibido = null;
    setTimeout(() => {
      document.getElementById('pos-asientos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  calcularVuelto(): string {
    const total = Number(this.asientoSeleccionado?.precio_final || 0);
    const recibido = Number(this.efectivoRecibido || 0);
    return Math.max(0, recibido - total).toFixed(2);
  }

  registrarVenta(): void {
    if (!this.pasajero.nombres || !this.pasajero.apellidos || !this.pasajero.numero_documento) {
      this.api.toast.error('Completa los datos del pasajero antes de emitir.', 'Datos faltantes');
      return;
    }

    this.api.post('/api/taquilla/venta', {
      viaje_id: this.viajeSeleccionado.id,
      asiento_id: this.asientoSeleccionado.id,
      metodo: this.metodoPago,
      pasajero: this.pasajero
    }).subscribe({
      next: (nuevoBoleto: any) => {
        this.boletoEmitido = nuevoBoleto;
        this.api.toast.success(`Boleto #${nuevoBoleto.id} emitido con éxito. Asiento ${this.asientoSeleccionado.numero_asiento}.`, 'Venta registrada');
        this.asientoSeleccionado = null;
        this.pasajero = { tipo_documento: 'DNI' };
        this.efectivoRecibido = null;
        this.cargarHoy();
        this.mapa?.cargar();
      }
    });
  }

  anularBoleto(boleto: any): void {
    if (!confirm(`¿Confirmas la anulación del boleto #${boleto.id}? El asiento quedará libre inmediatamente.`)) return;
    this.api.post(`/api/taquilla/anular/${boleto.id}`).subscribe({
      next: () => {
        this.api.toast.info(`Boleto #${boleto.id} anulado. Asiento liberado.`, 'Boleto anulado');
        this.cargarHoy();
        if (this.terminoBusqueda) this.buscarBoletos();
        this.mapa?.cargar();
      }
    });
  }

  buscarBoletos(): void {
    if (!this.terminoBusqueda.trim()) return;
    const query = encodeURIComponent(this.terminoBusqueda.trim());
    this.api.get<any[]>(`/api/boletos?doc=${query}&qr=${query}`).subscribe({
      next: lista => {
        this.resultadosBoletos = lista || [];
        this.busquedaRealizada = true;
      }
    });
  }
}
