import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../api.service';
import { CrudComponent } from './crud.component';

const TIPOS = ['ECONOMICO', 'EJECUTIVO', 'CAMA_160', 'VIP_180'];
const ESTV = ['PROGRAMADO', 'ABORDANDO', 'EN_RUTA', 'FINALIZADO', 'CANCELADO'];
const term = (r: any) => r.ciudad + ' - ' + r.nombre_agencia;
const mk = (k: string, c: any) => ({ list: '/api/admin/' + k, post: '/api/admin/' + k, item: (i: any) => `/api/admin/${k}/${i}`, ...c });

const ENTS: any = {
  terminales: mk('terminales', { title: 'Terminales y agencias', fields: [
    { name: 'ciudad' }, { name: 'nombre_agencia' }, { name: 'direccion' }, { name: 'activo', type: 'sel', options: [1, 0] }] }),
  rutas: mk('rutas', { title: 'Rutas', fields: [
    { name: 'terminal_origen_id', type: 'ref', ref: 'terminales', label: term },
    { name: 'terminal_destino_id', type: 'ref', ref: 'terminales', label: term },
    { name: 'distancia_km', type: 'number' }, { name: 'duracion_horas', type: 'number' }] }),
  buses: mk('buses', { title: 'Flota de buses', acciones: [{ tipo: 'asientos', label: 'Configurar asientos' }], fields: [
    { name: 'placa' }, { name: 'marca' }, { name: 'modelo' }, { name: 'tipo_servicio', type: 'sel', options: TIPOS },
    { name: 'total_pisos', type: 'sel', options: [1, 2] }, { name: 'capacidad_total', type: 'number' },
    { name: 'estado', type: 'sel', options: ['ACTIVO', 'MANTENIMIENTO', 'BAJA'] }] }),
  viajes: mk('viajes', { title: 'Programación de viajes', del: 'Cancelar', acciones: [{ tipo: 'manifiesto', label: 'Manifiesto' }],
    cols: ['id', 'origen', 'destino', 'fecha_salida', 'hora_salida', 'placa', 'chofer', 'precio_base', 'estado', 'ocupacion_pct'], fields: [
    { name: 'ruta_id', type: 'ref', ref: 'rutas', label: (r: any) => r.origen + ' → ' + r.destino },
    { name: 'bus_id', type: 'ref', ref: 'buses', label: (r: any) => r.placa },
    { name: 'chofer_id', type: 'ref', ref: 'usuarios', label: (r: any) => r.nombres + ' ' + r.apellidos, filter: (r: any) => r.rol == 'CHOFER' },
    { name: 'fecha_salida', type: 'date' }, { name: 'hora_salida', type: 'time' }, { name: 'precio_base', type: 'number' },
    { name: 'estado', type: 'sel', options: ESTV }] }),
  usuarios: mk('usuarios', { title: 'Usuarios y roles', fields: [
    { name: 'dni' }, { name: 'nombres' }, { name: 'apellidos' }, { name: 'correo' }, { name: 'telefono' },
    { name: 'rol', type: 'sel', options: ['ADMIN', 'TAQUILLERO', 'CHOFER', 'CLIENTE'] }, { name: 'password', type: 'password' }] }),
};

@Component({
  selector: 'app-admin', standalone: true, imports: [FormsModule, RouterLink, CrudComponent],
  template: `
    <section class="admin-page">
      <header class="admin-welcome"><div><span class="admin-eyebrow">CENTRO DE CONTROL</span><h1>Administración</h1><p>Gestiona la operación diaria de Rutas del Perú desde un solo lugar.</p></div><div class="admin-date"><span>HOY</span><b>{{hoy}}</b></div></header>
      <nav class="admin-tabs" aria-label="Secciones de administración">
        <button type="button" [class.active]="seccion === 'resumen'" (click)="abrirResumen()"><span>▦</span> Resumen</button>
        @for (k of keys; track k) { <button type="button" [class.active]="seccion === k" (click)="abrir(k)"><span>{{icono(k)}}</span>{{ents[k].title}}</button> }
        <a routerLink="/admin/reservas"><span>▤</span>Reservas</a><a routerLink="/reportes"><span>◷</span>Reportes</a>
      </nav>
      @if (seccion === 'resumen') {
        <div class="admin-overview"><div class="overview-intro"><div><span class="admin-eyebrow">VISTA GENERAL</span><h2>Operación de transporte</h2><p>Indicadores actuales registrados en el sistema.</p></div><button type="button" class="admin-refresh" (click)="cargarResumen()" [disabled]="cargando">{{cargando ? 'Actualizando…' : '↻ Actualizar datos'}}</button></div>
          <div class="admin-stat-grid">@for (m of metricas; track m.key) {<button type="button" class="admin-stat" (click)="abrir(m.key)"><span class="stat-icon">{{m.icon}}</span><span class="stat-label">{{m.label}}</span><b>{{m.value}}</b><small>{{m.note}}</small></button>}</div>
          <div class="admin-bottom-grid"><section class="admin-panel"><div class="panel-heading"><div><span class="admin-eyebrow">ACCESO RÁPIDO</span><h3>Tareas frecuentes</h3></div></div><div class="quick-actions"><button type="button" (click)="abrir('viajes')"><span>＋</span><div><b>Programar salida</b><small>Crear o actualizar viajes</small></div><i>→</i></button><button type="button" (click)="abrir('buses')"><span>▰</span><div><b>Administrar flota</b><small>Buses, capacidad y asientos</small></div><i>→</i></button><a routerLink="/admin/reservas"><span>▤</span><div><b>Revisar reservas</b><small>Ventas web y de taquilla</small></div><i>→</i></a><a routerLink="/reportes"><span>◷</span><div><b>Ver reportes</b><small>Ventas y ocupación</small></div><i>→</i></a></div></section>
          <aside class="admin-panel system-panel"><span class="admin-eyebrow">ESTADO DEL SISTEMA</span><h3>Resumen operativo</h3><div class="system-row"><span><i class="status-dot"></i>Viajes programados</span><b>{{programados}}</b></div><div class="system-row"><span><i class="status-dot"></i>Buses activos</span><b>{{busesActivos}}</b></div><div class="system-row"><span><i class="status-dot"></i>Personal registrado</span><b>{{personal}}</b></div><p>Los valores se actualizan al consultar el backend.</p></aside></div>
        </div>
      } @else {
        @if (bus) {<section class="admin-panel seat-generator"><div><span class="admin-eyebrow">CONFIGURACIÓN DE FLOTA</span><h2>Asientos de {{bus.placa}}</h2><p>Genera el croquis del bus con filas, pisos y recargos.</p></div><div class="generator-fields"><label>Filas piso 1<input type="number" min="1" [(ngModel)]="g.filas1"></label><label>Recargo piso 1<input type="number" min="0" [(ngModel)]="g.recargo1"></label><label>Filas piso 2<input type="number" min="0" [(ngModel)]="g.filas2"></label><label>Recargo piso 2<input type="number" min="0" [(ngModel)]="g.recargo2"></label><button type="button" class="admin-primary" (click)="generar()">Generar asientos</button></div></section>}
        <app-crud [cfg]="cfg" (accion)="onAccion($event)"></app-crud>
      }
    </section>`,
  styles: [`
    :host{display:block}.admin-page{max-width:1180px;margin:0 auto;padding:27px 0 46px;color:#1d322b}.admin-welcome{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:4px 2px 22px}.admin-eyebrow{display:block;color:#7d9385;font-size:9px;font-weight:800;letter-spacing:.16em}.admin-welcome h1{margin:6px 0;font:800 clamp(27px,3vw,36px)/1.1 Manrope,sans-serif;letter-spacing:-.055em}.admin-welcome p,.overview-intro p,.seat-generator p{margin:0;color:#7c8b82;font-size:12px}.admin-date{display:grid;gap:4px;text-align:right}.admin-date span{color:#91a096;font-size:9px;font-weight:800;letter-spacing:.13em}.admin-date b{font:700 13px Manrope,sans-serif;color:#345b47}.admin-tabs{display:flex;gap:5px;overflow-x:auto;margin-bottom:20px;padding:6px;border:1px solid #e6ece6;border-radius:12px;background:#fff;box-shadow:0 6px 20px #193c2708}.admin-tabs button,.admin-tabs a{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;padding:10px 12px;border:0;border-radius:8px;background:transparent;color:#62756b;text-decoration:none;font:700 10px 'DM Sans',sans-serif;cursor:pointer}.admin-tabs button span,.admin-tabs a span{color:#57816a;font-size:14px}.admin-tabs button:hover,.admin-tabs a:hover{background:#f3f7f1;color:#28543d}.admin-tabs .active{background:#174d43;color:#fff}.admin-tabs .active span{color:#d5ed83}.admin-overview{display:grid;gap:16px}.overview-intro{display:flex;align-items:end;justify-content:space-between;gap:15px}.overview-intro h2,.seat-generator h2{margin:5px 0;font:800 21px Manrope,sans-serif;letter-spacing:-.04em}.admin-refresh{padding:9px 12px;border:1px solid #dbe6dd;border-radius:8px;background:#fff;color:#315a43;font-size:10px;font-weight:700;cursor:pointer}.admin-refresh:hover{background:#f2f7ef}.admin-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.admin-stat{position:relative;display:grid;justify-items:start;gap:7px;min-height:145px;padding:17px;border:1px solid #e5ebe4;border-radius:13px;background:#fff;text-align:left;box-shadow:0 8px 24px #18382a08;transition:transform .15s,box-shadow .15s;cursor:pointer}.admin-stat:hover{transform:translateY(-2px);box-shadow:0 12px 28px #18382a12}.stat-icon{width:31px;height:31px;display:grid;place-items:center;border-radius:9px;background:#eef5e9;color:#347050;font-size:16px}.stat-label{color:#75867b;font-size:10px;font-weight:700}.admin-stat>b{color:#203a2d;font:800 27px Manrope,sans-serif;letter-spacing:-.04em}.admin-stat>small{color:#95a096;font-size:9px}.admin-bottom-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:14px}.admin-panel{padding:19px;border:1px solid #e5ebe4;border-radius:13px;background:#fff;box-shadow:0 8px 24px #18382a08}.admin-panel h3{margin:5px 0 0;color:#243c30;font:800 16px Manrope,sans-serif}.quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:15px}.quick-actions>button,.quick-actions>a{display:flex;align-items:center;gap:10px;min-width:0;padding:11px;border:1px solid #edf0eb;border-radius:9px;background:#fbfcfa;color:#344b3c;text-align:left;text-decoration:none;cursor:pointer}.quick-actions>button:hover,.quick-actions>a:hover{border-color:#cbdccb;background:#f5f8f2}.quick-actions>button>span,.quick-actions>a>span{width:29px;height:29px;flex:none;display:grid;place-items:center;border-radius:8px;background:#edf4e9;color:#3d7650}.quick-actions div{display:grid;gap:3px;min-width:0}.quick-actions b{font-size:10px}.quick-actions small{color:#8b978f;font-size:9px}.quick-actions i{margin-left:auto;color:#7e9986;font-style:normal}.system-row{display:flex;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid #edf0eb;color:#64766b;font-size:10px}.system-row span{display:flex;align-items:center;gap:8px}.system-row b{color:#355b45}.status-dot{width:7px;height:7px;border-radius:50%;background:#59a678}.system-panel>p{margin:13px 0 0;color:#9aa49c;font-size:9px;line-height:1.5}.seat-generator{margin-bottom:14px}.generator-fields{display:flex;align-items:end;gap:9px;flex-wrap:wrap;margin-top:15px}.generator-fields label{display:grid;gap:5px;color:#708078;font-size:10px;font-weight:700}.generator-fields input{width:110px}.admin-primary{height:38px;padding:0 14px;border:0;border-radius:8px;background:#174d43;color:#fff;font-size:10px;font-weight:700;cursor:pointer}.admin-primary:hover{background:#286c56}@media(max-width:760px){.admin-page{padding:18px 0 34px}.admin-welcome{align-items:flex-start}.admin-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-bottom-grid{grid-template-columns:1fr}.quick-actions{grid-template-columns:1fr}.overview-intro{align-items:flex-start;flex-direction:column}.admin-tabs button,.admin-tabs a{padding:9px}.generator-fields label{flex:1 1 40%}.generator-fields input{width:100%}}
  `]
})
export class AdminComponent implements OnInit {
  ents = ENTS; keys = Object.keys(ENTS); cfg: any = ENTS.terminales; seccion = 'resumen'; bus: any = null;
  hoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  cargando = false; viajesTotal = 0; programados = 0; busesActivos = 0; terminalesTotal = 0; personal = 0;
  metricas: any[] = [];
  g: any = { filas1: 6, recargo1: 25, filas2: 6, recargo2: 0 };
  constructor(private api: Api) {}
  ngOnInit(): void { this.cargarResumen(); }
  cargarResumen(): void {
    this.cargando = true;
    forkJoin({ terminales: this.api.get<any[]>('/api/admin/terminales'), buses: this.api.get<any[]>('/api/admin/buses'), viajes: this.api.get<any[]>('/api/admin/viajes'), usuarios: this.api.get<any[]>('/api/admin/usuarios') }).subscribe({
      next: d => {
        this.terminalesTotal = d.terminales.length; this.busesActivos = d.buses.filter(x => x.estado === 'ACTIVO').length;
        this.viajesTotal = d.viajes.length; this.programados = d.viajes.filter(x => x.estado === 'PROGRAMADO').length;
        this.personal = d.usuarios.filter(x => x.rol !== 'CLIENTE').length;
        this.metricas = [
          { key: 'terminales', icon: '⌖', label: 'Terminales y agencias', value: this.terminalesTotal, note: 'Puntos de atención' },
          { key: 'buses', icon: '▰', label: 'Buses activos', value: this.busesActivos, note: `${d.buses.length} unidades registradas` },
          { key: 'viajes', icon: '⇢', label: 'Viajes programados', value: this.programados, note: `${this.viajesTotal} salidas en el sistema` },
          { key: 'usuarios', icon: '♙', label: 'Personal', value: this.personal, note: 'Cuentas con acceso operativo' }
        ]; this.cargando = false;
      }, error: () => { this.cargando = false; }
    });
  }
  abrirResumen(): void { this.seccion = 'resumen'; this.bus = null; }
  abrir(k: string): void { this.seccion = k; this.cfg = this.ents[k]; this.bus = null; }
  icono(k: string): string { return ({ terminales: '⌖', rutas: '⇢', buses: '▰', viajes: '◷', usuarios: '♙' } as any)[k] || '•'; }
  onAccion(e: any): void {
    if (e.tipo === 'manifiesto') window.open(`/api/viajes/${e.row.id}/manifiesto`);
    if (e.tipo === 'asientos') {
      this.bus = e.row;
      this.cfg = { title: 'Asientos del bus ' + e.row.placa, list: `/api/admin/buses/${e.row.id}/asientos`, post: `/api/admin/buses/${e.row.id}/asientos`, item: (i: any) => '/api/admin/asientos/' + i, fields: [
        { name: 'numero_asiento', type: 'number' }, { name: 'piso', type: 'sel', options: [1, 2] }, { name: 'fila', type: 'number' }, { name: 'columna', type: 'number' },
        { name: 'ubicacion', type: 'sel', options: ['VENTANA', 'PASILLO', 'CENTRO'] }, { name: 'recargo_precio', type: 'number' }] };
    }
  }
  generar(): void { this.api.post(`/api/admin/buses/${this.bus.id}/asientos/generar`, this.g).subscribe((r: any) => { alert('Asientos creados: ' + r.total); this.cfg = { ...this.cfg }; this.cargarResumen(); }); }
}

