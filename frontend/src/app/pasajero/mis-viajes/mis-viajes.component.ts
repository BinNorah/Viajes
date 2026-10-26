import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api } from '../../api.service';
import { BoletoComponent } from '../../boleto/boleto.component';

@Component({
  selector: 'app-mis-viajes',
  standalone: true,
  imports: [CommonModule, RouterLink, BoletoComponent],
  templateUrl: './mis-viajes.component.html',
  styleUrl: './mis-viajes.component.css'
})
export class MisViajesComponent implements OnInit {
  viajesProximos: any[] = [];
  viajesPasados: any[] = [];
  boletosAnulados: any[] = [];
  tabActiva = 'proximos';

  constructor(public api: Api) {}

  get usuarioActual() {
    return this.api.user;
  }

  ngOnInit(): void {
    const hoy = new Date().toISOString().slice(0, 10);
    this.api.get<any[]>('/api/mis-viajes').subscribe({
      next: boletos => {
        const validos = (boletos || []).filter(b => b.estado_pago !== 'ANULADO');
        this.viajesProximos = validos.filter(b => b.fecha_salida >= hoy);
        this.viajesPasados = validos.filter(b => b.fecha_salida < hoy);
        this.boletosAnulados = (boletos || []).filter(b => b.estado_pago === 'ANULADO');
      }
    });
  }
}
