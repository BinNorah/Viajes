import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { Api } from '../../api.service';
import { BoletoComponent } from '../../boleto/boleto.component';
import { DesgloseComponent } from '../../desglose/desglose.component';
import { MapaComponent } from '../../mapa/mapa.component';

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MapaComponent, DesgloseComponent, BoletoComponent],
  templateUrl: './buscar.component.html',
  styleUrl: './buscar.component.css'
})
export class BuscarComponent implements OnInit, OnDestroy {
  ciudades: string[] = ['Lima', 'Huancayo', 'Ayacucho', 'Cusco'];
  viajes: any[] = [];
  viajeSeleccionado: any = null;
  asientosSeleccionados: any[] = [];
  reservas: any[] = [];
  pasajeros: any[] = [];
  boletosEmitidos: any[] = [];

  filtro = {
    origen: '',
    destino: '',
    fecha: ''
  };

  tarjetaPago = {
    tarjeta: '',
    vencimiento: '',
    cvv: ''
  };

  tiempoRestante = '10:00';
  procesandoPago = false;
  cargando = false;
  fechaMinima = new Date().toISOString().split('T')[0];
  private timer: any = null;

  @ViewChild(MapaComponent) mapa?: MapaComponent;

  constructor(
    public api: Api,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get usuarioRegistrado(): boolean {
    return !!this.api.user();
  }

  ngOnInit(): void {
    this.api.get<string[]>('/api/ciudades').subscribe(c => {
      if (c && c.length) this.ciudades = c;
    });

    this.route.queryParams.subscribe(params => {
      let tieneFiltro = false;
      const viajeId = params['viajeId'] ? Number(params['viajeId']) : null;
      if (params['origen']) { this.filtro.origen = params['origen']; tieneFiltro = true; }
      if (params['destino']) { this.filtro.destino = params['destino']; tieneFiltro = true; }
      if (params['fecha']) { this.filtro.fecha = params['fecha']; tieneFiltro = true; }
      this.buscar(tieneFiltro, viajeId);
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  buscar(autoScroll = false, viajeIdParaSeleccionar: number | null = null): void {
    this.cargando = true;
    const params: any = {};
    if (this.filtro.origen) params.origen = this.filtro.origen;
    if (this.filtro.destino) params.destino = this.filtro.destino;
    if (this.filtro.fecha) params.fecha = this.filtro.fecha;

    const queryString = new URLSearchParams(params).toString();
    this.api.get<any[]>(`/api/viajes?${queryString}`).subscribe({
      next: lista => {
        this.viajes = lista || [];
        this.cargando = false;

        if (viajeIdParaSeleccionar) {
          const viajeExacto = this.viajes.find(v => v.id === viajeIdParaSeleccionar);
          if (viajeExacto) {
            this.seleccionarViaje(viajeExacto);
            return;
          } else {
            this.api.get<any>(`/api/viajes/${viajeIdParaSeleccionar}`).subscribe({
              next: v => {
                if (v && v.id) {
                  this.seleccionarViaje(v);
                }
              }
            });
          }
        }

        if (autoScroll) {
          setTimeout(() => {
            document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }


  seleccionarViaje(viaje: any): void {
    this.viajeSeleccionado = viaje;
    this.asientosSeleccionados = [];
    this.reservas = [];
    this.boletosEmitidos = [];
    setTimeout(() => {
      document.getElementById('selector-asientos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  onAsientosSeleccionados(asientos: any[]): void {
    this.asientosSeleccionados = asientos;
  }

  bloquearAsientos(): void {
    if (!this.usuarioRegistrado) {
      this.api.toast.info('Por favor inicia sesión para continuar con tu reserva.', 'Cuenta requerida');
      this.router.navigateByUrl('/login');
      return;
    }

    if (this.asientosSeleccionados.length === 0) {
      this.api.toast.warning('Selecciona al menos un asiento en el croquis.', 'Sin selección');
      return;
    }

    const ids = this.asientosSeleccionados.map(a => a.id);
    this.api.post('/api/reservas', { viaje_id: this.viajeSeleccionado.id, asientos_ids: ids }).subscribe({
      next: (respuesta: any) => {
        this.reservas = respuesta.reservas || [respuesta];
        const usuario = this.api.user();

        this.pasajeros = this.reservas.map((reserva: any, index: number) => ({
          id: reserva.id,
          asiento: reserva.numero_asiento,
          piso: reserva.piso,
          tipo_documento: 'DNI',
          numero_documento: (index === 0 && usuario?.dni) ? usuario.dni : '',
          nombres: (index === 0 && usuario?.nombre) ? usuario.nombre.split(' ')[0] : '',
          apellidos: (index === 0 && usuario?.nombre) ? usuario.nombre.split(' ').slice(1).join(' ') : '',
          telefono: (index === 0 && usuario?.telefono) ? usuario.telefono : ''
        }));

        this.api.toast.success(`${this.reservas.length} asiento(s) bloqueado(s) por 10 minutos.`, 'Reserva iniciada');
        this.mapa?.cargar();

        const expiracion = new Date(this.reservas[0].fecha_expiracion_bloqueo.replace(' ', 'T')).getTime();
        this.iniciarTemporizador(expiracion);
      }
    });
  }

  iniciarTemporizador(finTiempo: number): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      const segundosRestantes = Math.max(0, Math.floor((finTiempo - Date.now()) / 1000));
      const minutos = Math.floor(segundosRestantes / 60);
      const segundos = String(segundosRestantes % 60).padStart(2, '0');
      this.tiempoRestante = `${minutos}:${segundos}`;

      if (segundosRestantes <= 0) {
        clearInterval(this.timer);
        this.reservas = [];
        this.asientosSeleccionados = [];
        this.api.toast.warning('El tiempo de reserva expiró y los asientos fueron liberados.', 'Tiempo agotado');
        this.mapa?.cargar();
      }
    }, 500);
  }

  copiarContacto(): void {
    const telefonoPrincipal = this.pasajeros[0]?.telefono;
    if (!telefonoPrincipal) {
      this.api.toast.info('Ingresa un teléfono en el Pasajero 1 para copiarlo al resto.', 'Sin teléfono');
      return;
    }
    this.pasajeros.forEach(p => p.telefono = telefonoPrincipal);
    this.api.toast.success('Teléfono copiado a todos los pasajeros.', 'Datos actualizados');
  }

  pagar(): void {
    for (let i = 0; i < this.pasajeros.length; i++) {
      const p = this.pasajeros[i];
      if (!p.nombres?.trim() || !p.apellidos?.trim() || !p.numero_documento?.trim()) {
        this.api.toast.error(`Completa nombres, apellidos y documento del Pasajero ${i + 1} (Asiento #${p.asiento}).`, 'Datos incompletos');
        return;
      }
    }

    if (!this.tarjetaPago.tarjeta || !this.tarjetaPago.vencimiento || !this.tarjetaPago.cvv) {
      this.api.toast.error('Completa los datos de la tarjeta bancaria de prueba.', 'Pago incompleto');
      return;
    }

    this.procesandoPago = true;
    const payload = {
      boletos: this.pasajeros,
      tarjeta: this.tarjetaPago.tarjeta,
      cvv: this.tarjetaPago.cvv
    };

    this.api.post('/api/reservas/checkout', payload)
      .pipe(finalize(() => this.procesandoPago = false))
      .subscribe({
        next: (respuesta: any) => {
          if (this.timer) clearInterval(this.timer);
          this.boletosEmitidos = respuesta.boletos || [];
          this.reservas = [];
          this.asientosSeleccionados = [];
          this.viajeSeleccionado = null;
          this.api.toast.success(`¡Pago completado! Se han emitido ${this.boletosEmitidos.length} boleto(s).`, 'Compra exitosa');
          this.buscar();
          setTimeout(() => {
            document.getElementById('confirmacion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }
      });
  }

  cancelarReserva(): void {
    if (this.reservas.length === 0) return;
    const ids = this.reservas.map(r => r.id);
    this.api.post('/api/reservas/cancelar-lote', { boletos_ids: ids }).subscribe({
      next: () => {
        if (this.timer) clearInterval(this.timer);
        this.reservas = [];
        this.asientosSeleccionados = [];
        this.api.toast.info('Reservas canceladas y asientos liberados.', 'Reserva anulada');
        this.mapa?.cargar();
      }
    });
  }

  precioTotalReservas(): string {
    const total = this.reservas.reduce((acc, r) => acc + Number(r.precio_final || 0), 0);
    return total.toFixed(2);
  }

  listaAsientosTexto(): string {
    return this.asientosSeleccionados.map(a => '#' + a.numero_asiento).join(', ');
  }

  precio(valor: number): string { return Number(valor || 0).toFixed(2); }
  mes(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { month: 'short' }).replace('.', '').toUpperCase(); }
  dia(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit' }); }
  diaSemana(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '').toUpperCase(); }
  fechaLarga(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  servicio(tipo: string): string {
    const nombres: Record<string, string> = {
      ECONOMICO: 'Económico',
      EJECUTIVO: 'Ejecutivo',
      CAMA_160: 'Bus Cama 160°',
      VIP_180: 'VIP 180° Panorámico'
    };
    return nombres[tipo] || tipo;
  }

  esFecha(offsetDias: number): boolean {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + offsetDias);
    return this.filtro.fecha === fecha.toISOString().split('T')[0];
  }

  establecerFechaOffset(offsetDias: number): void {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + offsetDias);
    this.filtro.fecha = fecha.toISOString().split('T')[0];
    this.buscar();
  }

  limpiarFecha(): void {
    this.filtro.fecha = '';
    this.buscar();
  }

  resetFiltro(): void {
    this.filtro = { origen: '', destino: '', fecha: '' };
    this.buscar();
  }
}
