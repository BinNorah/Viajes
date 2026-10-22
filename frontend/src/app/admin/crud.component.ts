import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Api } from '../api.service';

@Component({
  selector: 'app-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="crud-container">
      <header class="crud-header">
        <div>
          <span class="crud-kicker">GESTIÓN Y MANTENIMIENTO</span>
          <h2 class="crud-title">{{ cfg.title }}</h2>
          <p class="crud-subtitle">Administra los registros y actualiza la información en la base de datos.</p>
        </div>
        <span class="crud-counter-badge">{{ rows.length }} registros totales</span>
      </header>

      <!-- Form Card -->
      <form class="crud-form-card" (ngSubmit)="guardar()">
        <div class="form-card-title">
          <span class="form-action-tag">{{ editId ? 'Modo Edición' : 'Nuevo Registro' }}</span>
          @if (editId) {
            <small class="editing-id">Editando ID #{{ editId }}</small>
          }
        </div>

        <div class="crud-fields-grid">
          @for (f of cfg.fields; track f.name) {
            <div class="form-field">
              <label>{{ etiqueta(f.labelText || f.name) }}</label>
              @switch (f.type) {
                @case ('sel') {
                  <select [name]="f.name" [(ngModel)]="model[f.name]">
                    @for (o of f.options; track o) {
                      <option [ngValue]="o">{{ opcion(o) }}</option>
                    }
                  </select>
                }
                @case ('ref') {
                  <select [name]="f.name" [(ngModel)]="model[f.name]">
                    <option [ngValue]="null">Selecciona una opción…</option>
                    @for (r of refsFor(f); track r.id) {
                      <option [ngValue]="r.id">{{ f.label(r) }}</option>
                    }
                  </select>
                }
                @default {
                  <input [name]="f.name" 
                         [type]="f.type || 'text'" 
                         [(ngModel)]="model[f.name]" 
                         [placeholder]="'Ingresa ' + etiqueta(f.name).toLowerCase()">
                }
              }
            </div>
          }
        </div>

        <div class="crud-form-actions">
          <button type="submit" class="btn-crud-save">
            <span>{{ editId ? 'Guardar Cambios' : 'Crear Registro' }}</span>
          </button>
          <button type="button" class="btn-crud-clear" (click)="nuevo()">
            Limpiar Formulario
          </button>
        </div>
      </form>

      <!-- Table Header & Search -->
      <div class="table-toolbar">
        <div>
          <h3>Listado de Registros</h3>
          <p>Consulta, filtra y edita elementos existentes en tiempo real.</p>
        </div>
        <div class="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input name="buscar" [(ngModel)]="busqueda" placeholder="Buscar en la tabla…">
        </div>
      </div>

      <!-- Table -->
      @if (filtradas.length) {
        <div class="crud-table-wrap">
          <table class="crud-table">
            <thead>
              <tr>
                @for (c of cols; track c) {
                  <th>{{ etiqueta(c) }}</th>
                }
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (r of filtradas; track r.id) {
                <tr [class.row-editing]="editId === r.id">
                  @for (c of cols; track c) {
                    <td>
                      @if (c === 'id') {
                        <span class="id-tag">#{{ r[c] }}</span>
                      } @else if (c === 'estado') {
                        <span class="status-chip status-{{ String(r[c] || '').toLowerCase() }}">
                          {{ opcion(r[c]) }}
                        </span>
                      } @else if (c === 'ocupacion_pct') {
                        <b>{{ Math.round(r[c] || 0) }}%</b>
                      } @else {
                        {{ valor(r[c]) }}
                      }
                    </td>
                  }
                  <td style="text-align: right;">
                    <div class="row-actions-group">
                      <button type="button" class="btn-action btn-edit" (click)="editar(r)" title="Editar registro">
                        Editar
                      </button>
                      <button type="button" class="btn-action btn-delete" (click)="borrar(r)" title="Eliminar registro">
                        {{ cfg.del || 'Eliminar' }}
                      </button>
                      @for (a of cfg.acciones || []; track a.tipo) {
                        <button type="button" class="btn-action btn-extra" (click)="accion.emit({tipo: a.tipo, row: r})">
                          {{ a.label }}
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="crud-empty-card">
          <span class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </span>
          <b>{{ rows.length ? 'No hay coincidencias con la búsqueda' : 'Aún no hay registros en esta sección' }}</b>
          <p>{{ rows.length ? 'Prueba con otro término de búsqueda.' : 'Crea el primer registro usando el formulario de arriba.' }}</p>
        </div>
      }
    </section>
  `,
  styles: [`
    .crud-container {
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    }
    .crud-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 12px;
    }
    .crud-kicker {
      font-size: 9px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.1em;
      display: block;
      margin-bottom: 4px;
    }
    .crud-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .crud-subtitle {
      font-size: 12px;
      color: #64748b;
    }
    .crud-counter-badge {
      font-size: 11px;
      font-weight: 800;
      background: #ecfdf5;
      color: #047857;
      padding: 5px 12px;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
    }

    .crud-form-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .form-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .form-action-tag {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
    }
    .editing-id {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: #0284c7;
      background: #e0f2fe;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .crud-fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 16px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .form-field label {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }
    .form-field input, .form-field select {
      height: 38px;
      padding: 0 10px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      background: #ffffff;
      color: #0f172a;
      outline: none;
      transition: all 0.15s;
    }
    .form-field input:focus, .form-field select:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }

    .crud-form-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn-crud-save {
      padding: 9px 18px;
      border-radius: 8px;
      background: #0f766e;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-crud-save:hover { background: #115e59; }
    .btn-crud-clear {
      padding: 9px 14px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #64748b;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-crud-clear:hover { background: #f1f5f9; color: #0f172a; }

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .table-toolbar h3 {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .table-toolbar p {
      font-size: 11px;
      color: #64748b;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0 12px;
      height: 36px;
      min-width: 240px;
    }
    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 12px;
      color: #0f172a;
    }

    .crud-table-wrap {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .crud-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .crud-table th {
      background: #f8fafc;
      padding: 11px 14px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    .crud-table td {
      padding: 11px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .crud-table tr:hover td {
      background: #f8fafc;
    }
    .row-editing td {
      background: #f0fdf4 !important;
    }

    .id-tag {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #0284c7;
      background: #f0f9ff;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .status-chip {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .status-activo, .status-programado { background: #dcfce7; color: #15803d; }
    .status-mantenimiento, .status-abordando { background: #fef3c7; color: #b45309; }
    .status-baja, .status-cancelado { background: #fee2e2; color: #b91c1c; }

    .row-actions-group {
      display: inline-flex;
      gap: 6px;
    }
    .btn-action {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s;
    }
    .btn-edit { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
    .btn-edit:hover { background: #dcfce7; }
    .btn-delete { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
    .btn-delete:hover { background: #fee2e2; }
    .btn-extra { background: #f0f9ff; border-color: #bae6fd; color: #0284c7; }
    .btn-extra:hover { background: #e0f2fe; }

    .crud-empty-card {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
    .crud-empty-card .empty-icon {
      font-size: 32px;
      display: block;
      margin-bottom: 8px;
    }
  `]
})
export class CrudComponent implements OnChanges {
  @Input() cfg: any;
  @Output() accion = new EventEmitter<any>();

  rows: any[] = [];
  refs: any = {};
  model: any = {};
  editId: any = null;
  cols: string[] = [];
  busqueda = '';
  Math = Math;
  String = String;

  constructor(private api: Api) {}

  ngOnChanges(): void {
    this.cargar();
  }

  get filtradas(): any[] {
    const q = this.busqueda.trim().toLocaleLowerCase();
    return q ? this.rows.filter(r => this.cols.some(c => String(r[c] ?? '').toLocaleLowerCase().includes(q))) : this.rows;
  }

  refsFor(f: any): any[] {
    return (this.refs[f.ref] || []).filter(f.filter || (() => true));
  }

  cargar(): void {
    if (!this.cfg) return;
    const reqs: any = { rows: this.api.get(this.cfg.list) };
    for (const f of this.cfg.fields) {
      if (f.type === 'ref') reqs['r_' + f.ref] = this.api.get('/api/admin/' + f.ref);
    }
    forkJoin(reqs).subscribe((r: any) => {
      this.rows = r.rows || [];
      for (const k of Object.keys(r)) {
        if (k.startsWith('r_')) this.refs[k.slice(2)] = r[k];
      }
      this.cols = this.cfg.cols || (this.rows[0] ? Object.keys(this.rows[0]).filter(k => k !== 'password_hash') : this.cfg.fields.map((f: any) => f.name));
      this.nuevo();
    });
  }

  nuevo(): void {
    this.editId = null;
    this.model = {};
    for (const f of this.cfg.fields) {
      if (f.type === 'sel') this.model[f.name] = f.options[0];
    }
  }

  editar(r: any): void {
    this.editId = r.id;
    this.model = { ...r };
    delete this.model.password;
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  guardar(): void {
    const o = this.editId ? this.api.put(this.cfg.item(this.editId), this.model) : this.api.post(this.cfg.post, this.model);
    o.subscribe({
      next: () => {
        this.api.toast.success(this.editId ? 'Registro actualizado con éxito.' : 'Registro creado con éxito.', 'Operación completada');
        this.cargar();
      }
    });
  }

  borrar(r: any): void {
    if (confirm(`¿Confirmas la eliminación/cancelación del registro #${r.id}?`)) {
      this.api.delete(this.cfg.item(r.id)).subscribe({
        next: () => {
          this.api.toast.info('Registro procesado exitosamente.', 'Registro eliminado');
          this.cargar();
        }
      });
    }
  }

  etiqueta(v: string): string {
    const labels: any = {
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
    return labels[v] || v.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
  }

  opcion(v: any): string {
    const map: any = {
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
    return map[v] || String(v);
  }

  valor(v: any): string {
    if (v === 1) return 'Activo';
    if (v === 0) return 'Inactivo';
    return v == null ? '—' : String(v);
  }
}
