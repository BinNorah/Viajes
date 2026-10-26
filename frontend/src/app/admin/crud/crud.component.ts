import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../../api.service';

@Component({
  selector: 'app-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crud.component.html',
  styleUrl: './crud.component.css'
})
export class CrudComponent implements OnChanges {
  @Input() configuracion: any;
  @Input() set cfg(valor: any) { this.configuracion = valor; }
  get cfg() { return this.configuracion; }

  @Output() accion = new EventEmitter<any>();

  filas: any[] = [];
  columnas: string[] = [];
  referencias: Record<string, any[]> = {};
  modelo: any = {};
  idEnEdicion: any = null;
  _filtroTexto = '';
  get filtroTexto(): string { return this._filtroTexto; }
  set filtroTexto(val: string) {
    this._filtroTexto = val;
    this.paginaActual = 1;
  }
  cargando = false;

  paginaActual = 1;
  tamanoPagina = 5;
  opcionesTamano = [5, 10, 20];

  constructor(private api: Api, private cdr: ChangeDetectorRef) {}

  get filasFiltradas(): any[] {
    if (!this.filtroTexto.trim()) return this.filas;
    const busqueda = this.filtroTexto.toLowerCase();
    return this.filas.filter(fila =>
      Object.values(fila).some(valor => String(valor || '').toLowerCase().includes(busqueda))
    );
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.filasFiltradas.length / this.tamanoPagina));
  }

  get filasPaginadas(): any[] {
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return this.filasFiltradas.slice(inicio, inicio + this.tamanoPagina);
  }

  get registroInicio(): number {
    if (!this.filasFiltradas.length) return 0;
    return (this.paginaActual - 1) * this.tamanoPagina + 1;
  }

  get registroFin(): number {
    return Math.min(this.paginaActual * this.tamanoPagina, this.filasFiltradas.length);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
  }

  ngOnChanges(): void {
    if (this.configuracion) {
      this.columnas = this.configuracion.cols || this.configuracion.fields?.map((f: any) => f.name) || [];
      this.nuevo();
      this.paginaActual = 1;
      setTimeout(() => this.cargar(), 0);
    }
  }

  cargar(): void {
    if (!this.configuracion) return;
    this.cargando = true;
    this.filas = [];
    this.cdr.markForCheck();

    // Load table records directly
    this.api.get<any[]>(this.configuracion.list).subscribe({
      next: lista => {
        this.filas = lista || [];
        if (!this.configuracion.cols && this.filas[0]) {
          this.columnas = Object.keys(this.filas[0]).filter(k => k !== 'password_hash');
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });

    // Load reference options for dropdowns independently
    const camposRef = (this.configuracion.fields || []).filter((f: any) => f.type === 'ref');
    for (const campo of camposRef) {
      this.api.get<any[]>('/api/admin/' + campo.ref).subscribe({
        next: refs => {
          this.referencias[campo.ref] = refs || [];
        }
      });
    }
  }

  referenciasPara(campo: any): any[] {
    const lista = this.referencias[campo.ref] || [];
    return campo.filter ? lista.filter(campo.filter) : lista;
  }

  nuevo(): void {
    this.idEnEdicion = null;
    this.modelo = {};
    for (const f of this.configuracion?.fields || []) {
      if (f.type === 'sel') this.modelo[f.name] = f.options[0];
    }
  }

  editar(fila: any): void {
    this.idEnEdicion = fila.id;
    this.modelo = { ...fila };
    delete this.modelo.password;
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  guardar(): void {
    const peticion = this.idEnEdicion 
      ? this.api.put(this.configuracion.item(this.idEnEdicion), this.modelo) 
      : this.api.post(this.configuracion.post, this.modelo);

    peticion.subscribe({
      next: () => {
        this.api.toast.success(this.idEnEdicion ? 'Registro actualizado con éxito.' : 'Registro creado con éxito.', 'Operación completada');
        this.nuevo();
        this.cargar();
      }
    });
  }

  registroAEliminar: any = null;
  eliminando = false;

  confirmarEliminar(fila: any): void {
    this.registroAEliminar = fila;
  }

  cancelarEliminacion(): void {
    this.registroAEliminar = null;
    this.eliminando = false;
  }

  ejecutarEliminar(): void {
    if (!this.registroAEliminar || this.eliminando) return;
    this.eliminando = true;
    const fila = this.registroAEliminar;
    this.api.delete(this.configuracion.item(fila.id)).subscribe({
      next: () => {
        this.api.toast.success(`Registro #${fila.id} eliminado correctamente.`, 'Registro eliminado');
        if (this.idEnEdicion === fila.id) {
          this.nuevo();
        }
        this.registroAEliminar = null;
        this.eliminando = false;
        this.cargar();
      },
      error: (err: any) => {
        const mensaje = err?.error?.error || 'No se pudo eliminar el registro seleccionado.';
        this.api.toast.error(mensaje, 'Error al eliminar');
        this.registroAEliminar = null;
        this.eliminando = false;
      }
    });
  }

  eliminar(fila: any): void {
    this.confirmarEliminar(fila);
  }

  borrar(fila: any): void {
    this.confirmarEliminar(fila);
  }

  accionPersonalizada(accion: any, fila: any): void {
    this.accion.emit({ ...accion, row: fila });
  }

  etiqueta(campo: string): string {
    const etiquetas: any = {
      terminal_origen_id: 'Terminal de Origen',
      terminal_destino_id: 'Terminal de Destino',
      nombre_agencia: 'Nombre de Agencia',
      distancia_km: 'Distancia (km)',
      duracion_horas: 'Duración (horas)',
      tipo_servicio: 'Tipo de Servicio',
      total_pisos: 'Pisos',
      capacidad_total: 'Capacidad',
      fecha_salida: 'Fecha de Salida',
      hora_salida: 'Hora de Salida',
      precio_base: 'Precio Base (S/)',
      chofer_id: 'Conductor Asignado',
      numero_asiento: 'N° Asiento',
      recargo_precio: 'Recargo (S/)',
      ubicacion: 'Ubicación',
      dni: 'DNI',
      nombres: 'Nombres',
      apellidos: 'Apellidos',
      correo: 'Correo Electrónico',
      telefono: 'Teléfono Móvil',
      activo: 'Estado Operativo',
      ocupacion_pct: 'Ocupación (%)'
    };
    return etiquetas[campo] || campo.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  opcion(opcionItem: any): string {
    const mapaOpciones: any = {
      ECONOMICO: 'Económico',
      EJECUTIVO: 'Ejecutivo',
      CAMA_160: 'Bus Cama 160°',
      VIP_180: 'VIP 180° Panorámico',
      ACTIVO: 'Activo',
      MANTENIMIENTO: 'Mantenimiento',
      BAJA: 'Fuera de Servicio',
      ADMIN: 'Administrador',
      TAQUILLERO: 'Taquillero',
      CHOFER: 'Conductor',
      CLIENTE: 'Cliente / Pasajero',
      VENTANA: 'Ventana',
      PASILLO: 'Pasillo',
      CENTRO: 'Centro'
    };
    return mapaOpciones[opcionItem] || String(opcionItem);
  }

  valor(valorItem: any, columna?: string): string {
    if (columna === 'activo') {
      if (valorItem === 1 || valorItem === '1') return 'Activo';
      if (valorItem === 0 || valorItem === '0') return 'Inactivo';
    }
    if (columna === 'ocupacion_pct') {
      return Math.round(Number(valorItem || 0)) + '%';
    }
    if (columna === 'precio_base') {
      return Number(valorItem || 0) > 0 ? 'S/ ' + Number(valorItem).toFixed(2) : '—';
    }
    if (columna === 'distancia_km') {
      return valorItem ? valorItem + ' km' : '—';
    }
    if (columna === 'duracion_horas') {
      return valorItem ? valorItem + ' hrs' : '—';
    }
    return valorItem == null || valorItem === '' ? '—' : String(valorItem);
  }
}
