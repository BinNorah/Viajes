import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Api } from '../../api.service';
import { CrudComponent } from '../crud/crud.component';

const TIPOS_SERVICIO = ['ECONOMICO', 'EJECUTIVO', 'CAMA_160', 'VIP_180'];
const formatoTerminal = (registro: any) => registro.ciudad + ' - ' + registro.nombre_agencia;
const crearConfigCrud = (clave: string, config: any) => ({
  list: '/api/admin/' + clave,
  post: '/api/admin/' + clave,
  item: (id: any) => `/api/admin/${clave}/${id}`,
  ...config
});

const ENTIDADES: any = {
  terminales: crearConfigCrud('terminales', {
    title: 'Terminales y Agencias',
    cols: ['id', 'ciudad', 'nombre_agencia', 'direccion', 'activo'],
    fields: [
      { name: 'ciudad' },
      { name: 'nombre_agencia' },
      { name: 'direccion' },
      { name: 'activo', type: 'sel', options: [1, 0] }
    ]
  }),
  rutas: crearConfigCrud('rutas', {
    title: 'Rutas Interprovinciales',
    cols: ['id', 'origen', 'destino', 'distancia_km', 'duracion_horas'],
    fields: [
      { name: 'terminal_origen_id', type: 'ref', ref: 'terminales', label: formatoTerminal },
      { name: 'terminal_destino_id', type: 'ref', ref: 'terminales', label: formatoTerminal },
      { name: 'distancia_km', type: 'number' },
      { name: 'duracion_horas', type: 'number' }
    ]
  }),
  buses: crearConfigCrud('buses', {
    title: 'Flota de Buses',
    acciones: [{ tipo: 'asientos', label: 'Configurar Asientos' }],
    cols: ['id', 'placa', 'marca', 'modelo', 'tipo_servicio', 'total_pisos', 'capacidad_total', 'estado'],
    fields: [
      { name: 'placa' },
      { name: 'marca' },
      { name: 'modelo' },
      { name: 'tipo_servicio', type: 'sel', options: TIPOS_SERVICIO },
      { name: 'total_pisos', type: 'sel', options: [1, 2] },
      { name: 'capacidad_total', type: 'number' },
      { name: 'estado', type: 'sel', options: ['ACTIVO', 'MANTENIMIENTO', 'BAJA'] }
    ]
  }),
  viajes: crearConfigCrud('viajes', {
    title: 'Programación de Salidas',
    cols: ['id', 'origen', 'destino', 'fecha_salida', 'hora_salida', 'placa', 'chofer', 'precio_base', 'estado', 'ocupacion_pct'],
    fields: [
      { name: 'ruta_id', type: 'ref', ref: 'rutas', label: (r: any) => r.origen + ' → ' + r.destino },
      { name: 'bus_id', type: 'ref', ref: 'buses', label: (r: any) => r.placa + ' (' + r.marca + ' ' + (r.modelo || '') + ')' },
      { name: 'chofer_id', type: 'ref', ref: 'usuarios', label: (r: any) => r.nombres + ' ' + r.apellidos, filter: (r: any) => r.rol === 'CHOFER' },
      { name: 'fecha_salida', type: 'date' },
      { name: 'hora_salida', type: 'time' },
      { name: 'precio_base', type: 'number' },
      { name: 'estado', type: 'sel', options: ['PROGRAMADO', 'ABORDANDO', 'EN_RUTA', 'FINALIZADO', 'CANCELADO'] }
    ]
  }),
  usuarios: crearConfigCrud('usuarios', {
    title: 'Personal & Pasajeros',
    cols: ['id', 'dni', 'nombres', 'apellidos', 'correo', 'telefono', 'rol'],
    fields: [
      { name: 'dni' },
      { name: 'nombres' },
      { name: 'apellidos' },
      { name: 'correo' },
      { name: 'telefono' },
      { name: 'password', type: 'password', labelText: 'Contraseña (nueva)' },
      { name: 'rol', type: 'sel', options: ['ADMIN', 'TAQUILLERO', 'CHOFER', 'CLIENTE'] }
    ]
  })
};

import { catchError, forkJoin, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminReservasComponent } from '../reservas/reservas.component';
import { ReportesComponent } from '../reportes/reportes.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CrudComponent, AdminReservasComponent, ReportesComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  entidades = ENTIDADES;
  clavesEntidades = Object.keys(ENTIDADES);
  configuracionCrud: any = ENTIDADES.viajes;
  seccionActiva = 'resumen';
  busSeleccionado: any = null;

  cargando = false;
  salidasTotales = 0;
  salidasProgramadas = 0;
  busesActivos = 0;
  busesTotal = 0;
  capacidadTotal = 0;
  terminalesTotal = 0;
  personalOperativo = 0;
  totalVentas = '0.00';
  boletosTotal = 0;

  generadorConfig = {
    filas1: 3,
    recargo1: 25,
    filas2: 9,
    recargo2: 0
  };

  constructor(
    public api: Api,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
    this.route.queryParams.subscribe(params => {
      if (params['seccion']) {
        this.abrirSeccion(params['seccion']);
      }
    });
  }

  cargarResumen(): void {
    this.cargando = true;
    forkJoin({
      terminales: this.api.get<any[]>('/api/admin/terminales').pipe(catchError(() => of([]))),
      buses: this.api.get<any[]>('/api/admin/buses').pipe(catchError(() => of([]))),
      viajes: this.api.get<any[]>('/api/admin/viajes').pipe(catchError(() => of([]))),
      usuarios: this.api.get<any[]>('/api/admin/usuarios').pipe(catchError(() => of([]))),
      ventas: this.api.get<any>('/api/reportes/ventas').pipe(catchError(() => of({ total: { total: 0, boletos: 0 } })))
    }).subscribe({
      next: datos => {
        this.terminalesTotal = datos.terminales?.length || 0;
        this.busesTotal = datos.buses?.length || 0;
        this.busesActivos = datos.buses?.filter((x: any) => x.estado === 'ACTIVO').length || 0;
        this.capacidadTotal = datos.buses?.reduce((acc: number, b: any) => acc + (b.capacidad_total || 0), 0) || 0;
        this.salidasTotales = datos.viajes?.length || 0;
        this.salidasProgramadas = datos.viajes?.filter((x: any) => x.estado === 'PROGRAMADO').length || 0;
        this.personalOperativo = datos.usuarios?.filter((x: any) => x.rol !== 'CLIENTE').length || 0;

        if (datos.ventas?.total) {
          this.totalVentas = Number(datos.ventas.total.total || 0).toFixed(2);
          this.boletosTotal = datos.ventas.total.boletos || 0;
        }

        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  abrirResumen(): void {
    this.seccionActiva = 'resumen';
    this.busSeleccionado = null;
    this.cargarResumen();
  }

  abrirSeccion(seccion: string): void {
    this.seccionActiva = seccion;
    this.busSeleccionado = null;
    if (this.entidades[seccion]) {
      this.configuracionCrud = this.entidades[seccion];
    }
  }

  abrirEntidad(clave: string): void {
    this.abrirSeccion(clave);
  }

  tituloSeccionActiva(): string {
    const titulos: Record<string, string> = {
      resumen: 'Panel de Control · Resumen General',
      viajes: 'Gestión de Salidas · Itinerarios de Flota',
      buses: 'Flota de Buses · Unidades y Asientos',
      rutas: 'Rutas Interprovinciales · Corredores Viales',
      terminales: 'Terminales y Agencias · Sedes Operativas',
      usuarios: 'Personal & Pasajeros · Cuentas y Roles',
      reservas: 'Gestión de Reservas & Boletos Emitidos',
      reportes: 'Reportes Estadísticos & Recaudación Financiera'
    };
    return titulos[this.seccionActiva] || 'Administración General';
  }

  cerrarSesion(): void {
    this.api.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  limpiarBloqueos(): void {
    this.api.post('/api/admin/clean-locks').subscribe({
      next: (res: any) => {
        this.api.toast.success(res.mensaje || 'Bloqueos liberados', 'Mantenimiento');
        this.cargarResumen();
      }
    });
  }

  onAccionCrud(evento: any): void {
    if (evento.tipo === 'asientos') {
      this.busSeleccionado = evento.row;
      this.configuracionCrud = {
        title: `Asientos del bus ${evento.row.placa} (${evento.row.marca} ${evento.row.modelo || ''})`,
        list: `/api/admin/buses/${evento.row.id}/asientos`,
        post: `/api/admin/buses/${evento.row.id}/asientos`,
        item: (id: any) => '/api/admin/asientos/' + id,
        fields: [
          { name: 'numero_asiento', type: 'number' },
          { name: 'piso', type: 'sel', options: [1, 2] },
          { name: 'fila', type: 'number' },
          { name: 'columna', type: 'number' },
          { name: 'ubicacion', type: 'sel', options: ['VENTANA', 'PASILLO', 'CENTRO'] },
          { name: 'recargo_precio', type: 'number' }
        ]
      };
    }
  }

  generarAsientos(): void {
    this.api.post(`/api/admin/buses/${this.busSeleccionado.id}/asientos/generar`, this.generadorConfig).subscribe({
      next: (res: any) => {
        this.api.toast.success(`Se generaron ${res.total} asientos correctamente para el bus ${this.busSeleccionado.placa}.`, 'Croquis generado');
        this.configuracionCrud = { ...this.configuracionCrud };
        this.cargarResumen();
      }
    });
  }
}
