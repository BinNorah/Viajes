import { Component, OnInit } from '@angular/core';
import { Api } from '../api.service';
@Component({
  selector: 'app-chofer', standalone: true,
  template: `<div class="card"><h2>Mis viajes asignados</h2>
    @if (v.length) {
      <table><tr><th>Fecha</th><th>Hora</th><th>Ruta</th><th>Bus</th><th>Estado</th><th>Pasajeros</th><th></th></tr>
      @for (x of v; track x.id) {
        <tr><td>{{x.fecha_salida}}</td><td>{{x.hora_salida}}</td><td>{{x.origen}} → {{x.destino}}</td><td>{{x.placa}}</td>
          <td>{{x.estado}}</td><td>{{x.ocupados}}</td><td><a [href]="'/api/viajes/' + x.id + '/manifiesto'">Manifiesto</a></td></tr>
      }</table>
    } @else { <p>Sin viajes asignados.</p> }</div>`
})
export class ChoferComponent implements OnInit {
  v: any[] = [];
  constructor(private api: Api) {}
  ngOnInit() { this.api.get<any[]>('/api/chofer/viajes').subscribe(v => this.v = v); }
}
