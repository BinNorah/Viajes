import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../../api.service';
import { BoletoComponent } from '../../boleto/boleto.component';

@Component({
  selector: 'app-admin-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, BoletoComponent],
  templateUrl: './reservas.component.html',
  styleUrl: './reservas.component.css'
})
export class AdminReservasComponent implements OnInit {
  reservas: any[] = [];
  busquedaTexto = '';
  estadoFiltro = 'TODOS';
  cargando = false;
  boletoSeleccionado: any = null;

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.actualizar();
  }

  actualizar(): void {
    this.cargando = true;
    this.api.get<any[]>('/api/admin/reservas').subscribe({
      next: lista => {
        this.reservas = lista || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  get reservasFiltradas(): any[] {
    const texto = this.busquedaTexto.trim().toLowerCase();
    return this.reservas.filter(r => {
      const coincideEstado = this.estadoFiltro === 'TODOS' || r.estado_pago === this.estadoFiltro;
      const coincideTexto = !texto || [
        r.id, r.codigo_qr, r.nombres, r.apellidos, r.numero_documento,
        r.origen, r.destino, r.placa, r.canal, r.vendedor
      ].some(campo => String(campo || '').toLowerCase().includes(texto));
      return coincideEstado && coincideTexto;
    });
  }

  get totalPagados(): number {
    return this.reservas.filter(r => r.estado_pago === 'PAGADO').length;
  }

  get totalPendientes(): number {
    return this.reservas.filter(r => r.estado_pago === 'BLOQUEADO').length;
  }

  get totalAnulados(): number {
    return this.reservas.filter(r => r.estado_pago === 'ANULADO').length;
  }

  get totalRecaudado(): string {
    const suma = this.reservas
      .filter(r => r.estado_pago === 'PAGADO')
      .reduce((acumulado, r) => acumulado + (Number(r.precio_final) || 0), 0);
    return suma.toFixed(2);
  }

  verBoleto(reserva: any): void {
    this.boletoSeleccionado = reserva;
  }

  formatearPrecio(valor: any): string {
    return Number(valor || 0).toFixed(2);
  }

  estadoTexto(estado: string): string {
    const nombres: Record<string, string> = {
      PAGADO: 'Pagado',
      BLOQUEADO: 'Pendiente',
      ANULADO: 'Anulado'
    };
    return nombres[estado] || estado;
  }
}
