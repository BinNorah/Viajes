import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Api } from '../api.service';

@Component({
  selector: 'app-crud', standalone: true, imports: [FormsModule],
  template: `
    <section class="crud-card">
      <header class="crud-heading"><div><span class="crud-kicker">GESTIÓN DE DATOS</span><h2>{{cfg.title}}</h2><p>Completa el formulario y guarda para mantener actualizado el sistema.</p></div><span class="crud-count">{{rows.length}} registros</span></header>
      <form class="crud-form" (ngSubmit)="guardar()"><div class="crud-fields">
        @for (f of cfg.fields; track f.name) {
          <label class="crud-field"><span>{{etiqueta(f.labelText || f.name)}}</span>
            @switch (f.type) {
              @case ('sel') { <select [name]="f.name" [(ngModel)]="model[f.name]">@for (o of f.options; track o) {<option [ngValue]="o">{{opcion(o)}}</option>}</select> }
              @case ('ref') { <select [name]="f.name" [(ngModel)]="model[f.name]"><option [ngValue]="null">Selecciona…</option>@for (r of refsFor(f); track r.id) {<option [ngValue]="r.id">{{f.label(r)}}</option>}</select> }
              @default { <input [name]="f.name" [type]="f.type || 'text'" [(ngModel)]="model[f.name]" [placeholder]="'Ingresa ' + etiqueta(f.name).toLowerCase()"> }
            }
          </label>
        }
      </div><div class="crud-actions"><button type="submit" class="crud-save">{{editId ? 'Guardar cambios' : '＋ Crear registro'}}</button><button type="button" class="crud-clear" (click)="nuevo()">Limpiar formulario</button></div></form>
      <div class="crud-list-heading"><div><span class="crud-kicker">REGISTROS</span><h3>Listado</h3></div><label class="crud-search"><span>⌕</span><input name="buscar" [(ngModel)]="busqueda" placeholder="Buscar en la tabla…"></label></div>
      @if (filtradas.length) {<div class="crud-table-wrap"><table><thead><tr>@for (c of cols; track c) {<th>{{etiqueta(c)}}</th>}<th>Acciones</th></tr></thead><tbody>
        @for (r of filtradas; track r.id) {<tr>@for (c of cols; track c) {<td>{{valor(r[c])}}</td>}<td><div class="crud-row-actions"><button type="button" class="row-edit" (click)="editar(r)">Editar</button><button type="button" class="row-delete" (click)="borrar(r)">{{cfg.del || 'Eliminar'}}</button>@for (a of cfg.acciones || []; track a.tipo) {<button type="button" class="row-extra" (click)="accion.emit({tipo: a.tipo, row: r})">{{a.label}}</button>}</div></td></tr>}
      </tbody></table></div>} @else {<div class="crud-empty"><b>{{rows.length ? 'No hay coincidencias' : 'Aún no hay registros'}}</b><span>{{rows.length ? 'Prueba con otro término.' : 'Crea el primer registro con el formulario de arriba.'}}</span></div>}
    </section>`,
  styles: [`
    :host{display:block}.crud-card{padding:21px;border:1px solid #e4ebe4;border-radius:14px;background:#fff;box-shadow:0 9px 30px #18382a09}.crud-heading,.crud-list-heading{display:flex;align-items:center;justify-content:space-between;gap:15px}.crud-kicker{display:block;color:#809286;font-size:9px;font-weight:800;letter-spacing:.15em}.crud-heading h2,.crud-list-heading h3{margin:5px 0;color:#20392c;font:800 19px Manrope,sans-serif;letter-spacing:-.035em}.crud-heading p{margin:0;color:#829087;font-size:11px}.crud-count{padding:7px 10px;border-radius:99px;background:#eff5ed;color:#4f7457;font-size:9px;font-weight:700;white-space:nowrap}.crud-form{margin-top:18px;padding:15px;border:1px solid #e8eee7;border-radius:11px;background:#fafbf9}.crud-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.crud-field{display:grid;gap:5px;min-width:0;color:#62766a;font-size:10px;font-weight:700}.crud-field input,.crud-field select{width:100%;height:37px;min-height:37px;margin:0;padding:7px 9px;font-size:11px}.crud-actions{display:flex;gap:8px;margin-top:13px}.crud-save,.crud-clear,.row-edit,.row-delete,.row-extra{min-height:33px;padding:0 11px;border:1px solid transparent;border-radius:7px;font-size:9px;font-weight:700;cursor:pointer}.crud-save{background:#174d43;color:#fff}.crud-save:hover{background:#286c56}.crud-clear{border-color:#dfe7df;background:#fff;color:#5f7366}.crud-clear:hover{background:#f1f5ef}.crud-list-heading{margin:21px 0 10px}.crud-list-heading h3{margin-bottom:0;font-size:15px}.crud-search{display:flex;align-items:center;gap:6px;width:min(270px,55%);height:34px;padding:0 9px;border:1px solid #e2e9e2;border-radius:8px;background:#fff;color:#718279}.crud-search input{width:100%;height:100%;min-height:0;margin:0;padding:0;border:0;outline:0;background:transparent;font-size:10px}.crud-table-wrap{overflow:auto;border:1px solid #e7ece6;border-radius:9px}.crud-table-wrap table{min-width:680px;margin:0;border:0;font-size:10px}.crud-table-wrap th{padding:10px;background:#f5f7f3;color:#718176;font-size:9px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}.crud-table-wrap td{padding:9px 10px;color:#56685d;vertical-align:middle}.crud-row-actions{display:flex;gap:5px;white-space:nowrap}.row-edit{background:#edf4ea;color:#426e4b}.row-edit:hover{background:#dfeddc}.row-delete{background:#fbefed;color:#a25247}.row-delete:hover{background:#f5dfdb}.row-extra{background:#eef2f5;color:#4f6876}.row-extra:hover{background:#e2eaf0}.crud-empty{display:grid;justify-items:center;gap:5px;padding:28px;border:1px dashed #dce5dc;border-radius:9px;color:#87948b;font-size:10px}.crud-empty b{color:#53695a;font-size:12px}@media(max-width:760px){.crud-card{padding:15px}.crud-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.crud-heading,.crud-list-heading{align-items:flex-start}.crud-list-heading{flex-direction:column}.crud-search{width:100%}}@media(max-width:460px){.crud-fields{grid-template-columns:1fr}.crud-heading p{max-width:230px}.crud-actions>*{flex:1}}
  `]
})
export class CrudComponent implements OnChanges {
  @Input() cfg: any; @Output() accion = new EventEmitter<any>();
  rows: any[] = []; refs: any = {}; model: any = {}; editId: any = null; cols: string[] = []; busqueda = '';
  constructor(private api: Api) {}
  ngOnChanges(): void { this.cargar(); }
  get filtradas(): any[] { const q = this.busqueda.trim().toLocaleLowerCase(); return q ? this.rows.filter(r => this.cols.some(c => String(r[c] ?? '').toLocaleLowerCase().includes(q))) : this.rows; }
  refsFor(f: any): any[] { return (this.refs[f.ref] || []).filter(f.filter || (() => true)); }
  cargar(): void {
    if (!this.cfg) return;
    const reqs: any = { rows: this.api.get(this.cfg.list) };
    for (const f of this.cfg.fields) if (f.type === 'ref') reqs['r_' + f.ref] = this.api.get('/api/admin/' + f.ref);
    forkJoin(reqs).subscribe((r: any) => {
      this.rows = r.rows || [];
      for (const k of Object.keys(r)) if (k.startsWith('r_')) this.refs[k.slice(2)] = r[k];
      this.cols = this.cfg.cols || (this.rows[0] ? Object.keys(this.rows[0]).filter(k => k !== 'password_hash') : this.cfg.fields.map((f: any) => f.name));
      this.nuevo();
    });
  }
  nuevo(): void { this.editId = null; this.model = {}; for (const f of this.cfg.fields) if (f.type === 'sel') this.model[f.name] = f.options[0]; }
  editar(r: any): void { this.editId = r.id; this.model = { ...r }; delete this.model.password; }
  guardar(): void { const o = this.editId ? this.api.put(this.cfg.item(this.editId), this.model) : this.api.post(this.cfg.post, this.model); o.subscribe(() => this.cargar()); }
  borrar(r: any): void { if (confirm('¿Confirmas esta acción?')) this.api.delete(this.cfg.item(r.id)).subscribe(() => this.cargar()); }
  etiqueta(v: string): string { const labels: any = { terminal_origen_id: 'Terminal de origen', terminal_destino_id: 'Terminal de destino', nombre_agencia: 'Nombre de agencia', distancia_km: 'Distancia (km)', duracion_horas: 'Duración (horas)', tipo_servicio: 'Tipo de servicio', total_pisos: 'Número de pisos', capacidad_total: 'Capacidad', fecha_salida: 'Fecha de salida', hora_salida: 'Hora de salida', precio_base: 'Precio base', chofer_id: 'Conductor', numero_asiento: 'Número de asiento', recargo_precio: 'Recargo', ubicacion: 'Ubicación', dni: 'DNI', nombres: 'Nombres', apellidos: 'Apellidos', correo: 'Correo electrónico', telefono: 'Teléfono', activo: 'Estado' }; return labels[v] || v.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase()); }
  opcion(v: any): string { return ({ ECONOMICO: 'Económico', EJECUTIVO: 'Ejecutivo', CAMA_160: 'Bus cama 160°', VIP_180: 'VIP 180°', ACTIVO: 'Activo', MANTENIMIENTO: 'Mantenimiento', BAJA: 'Fuera de servicio', ADMIN: 'Administrador', TAQUILLERO: 'Taquillero', CHOFER: 'Conductor', CLIENTE: 'Cliente', VENTANA: 'Ventana', PASILLO: 'Pasillo', CENTRO: 'Centro' } as any)[v] || String(v); }
  valor(v: any): string { if (v === 1) return 'Activo'; if (v === 0) return 'Inactivo'; return v == null ? '—' : String(v); }
}
