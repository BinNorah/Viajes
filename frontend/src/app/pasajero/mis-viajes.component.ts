import { Component, OnInit } from '@angular/core';
import { Api } from '../api.service';
import { BoletoComponent } from '../shared';
@Component({
  selector: 'app-mis-viajes', standalone: true, imports: [BoletoComponent],
  template: `
  <div class="card"><h3>Próximos viajes</h3>@for (b of proximos; track b.id) {<app-boleto [b]="b" /><br>} @empty {<p>Sin registros.</p>}</div>
  <div class="card"><h3>Viajes pasados</h3>@for (b of pasados; track b.id) {<app-boleto [b]="b" /><br>} @empty {<p>Sin registros.</p>}</div>
  <div class="card"><h3>Anulados / expirados</h3>@for (b of anulados; track b.id) {<app-boleto [b]="b" /><br>} @empty {<p>Sin registros.</p>}</div>`
})
export class MisViajesComponent implements OnInit {
  proximos: any[] = []; pasados: any[] = []; anulados: any[] = [];
  constructor(private api: Api) {}
  ngOnInit() {
    const hoy = new Date().toISOString().slice(0, 10);
    this.api.get<any[]>('/api/mis-viajes').subscribe(b => {
      const ok = b.filter(x => x.estado_pago != 'ANULADO');
      this.proximos = ok.filter(x => x.fecha_salida >= hoy); this.pasados = ok.filter(x => x.fecha_salida < hoy);
      this.anulados = b.filter(x => x.estado_pago == 'ANULADO');
    });
  }
}
