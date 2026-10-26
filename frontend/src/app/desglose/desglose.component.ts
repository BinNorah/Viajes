import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-desglose',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './desglose.component.html',
  styleUrl: './desglose.component.css'
})
export class DesgloseComponent {
  @Input() asiento: any;
  @Input() set a(valor: any) { this.asiento = valor; }
  get a() { return this.asiento; }

  @Input() asientos: any[] = [];

  formatearNumero(valor: any): string {
    return Number(valor || 0).toFixed(2);
  }

  numero(valor: any): string {
    return this.formatearNumero(valor);
  }

  calcularTotal(): string {
    if (this.asientos && this.asientos.length > 0) {
      const suma = this.asientos.reduce((acc, item) => {
        const precio = Number(item.precio_final || (Number(item.precio_base || 0) + Number(item.recargo_precio || 0)));
        return acc + precio;
      }, 0);
      return suma.toFixed(2);
    }
    const precioBase = Number(this.asiento?.precio_base || 0);
    const recargo = Number(this.asiento?.recargo_precio || 0);
    return Number(this.asiento?.precio_final || (precioBase + recargo)).toFixed(2);
  }
}
