import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../api.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent implements OnInit {
  @Input() viajeId: number | string | null = null;
  @Input() maxSeleccion = 6;
  @Output() elegido = new EventEmitter<any>();
  @Output() elegidos = new EventEmitter<any[]>();

  asientos: any[] = [];
  seleccionados: any[] = [];
  cargando = false;
  pisoActivo = 1;

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (!this.viajeId) return;
    this.cargando = true;
    this.api.get<any>(`/api/viajes/${this.viajeId}/asientos`).subscribe({
      next: r => {
        this.asientos = r.asientos || [];
        this.cargando = false;
        if (this.pisos.length && !this.pisos.includes(this.pisoActivo)) {
          this.pisoActivo = this.pisos[0];
        }
        // Filtrar seleccionados que sigan libres o propios
        this.seleccionados = this.seleccionados.filter(s =>
          this.asientos.some(a => a.id === s.id && (a.estado === 'LIBRE' || a.mio))
        );
        this.elegido.emit(this.seleccionados[0] || null);
        this.elegidos.emit([...this.seleccionados]);
      },
      error: () => {
        this.cargando = false;
        this.asientos = [];
      }
    });
  }

  get pisos(): number[] {
    return [...new Set(this.asientos.map(a => Number(a.piso)))].sort((a, b) => a - b);
  }

  asientosPorPiso(piso: number): any[] {
    return this.asientos.filter(a => Number(a.piso) === piso);
  }

  filasPorPiso(piso: number): number[] {
    const filas = this.asientosPorPiso(piso).map(a => Number(a.fila));
    return [...new Set(filas)].sort((a, b) => a - b);
  }

  asientosEnFila(piso: number, fila: number, cols: number[]): any[] {
    return this.asientosPorPiso(piso)
      .filter(a => Number(a.fila) === fila && cols.includes(Number(a.columna)))
      .sort((a, b) => Number(a.columna) - Number(b.columna));
  }

  estaSeleccionado(a: any): boolean {
    return this.seleccionados.some(s => s.id === a.id);
  }

  indiceSeleccion(a: any): number {
    return this.seleccionados.findIndex(s => s.id === a.id);
  }

  seleccionar(a: any): void {
    if (a.estado !== 'LIBRE' && !a.mio) return;
    const idx = this.seleccionados.findIndex(s => s.id === a.id);
    if (idx >= 0) {
      this.seleccionados.splice(idx, 1);
    } else {
      if (this.seleccionados.length >= this.maxSeleccion) {
        this.api.toast.info(`Puedes seleccionar hasta un máximo de ${this.maxSeleccion} asientos por compra.`);
        return;
      }
      this.seleccionados.push(a);
    }
    this.elegido.emit(this.seleccionados[0] || null);
    this.elegidos.emit([...this.seleccionados]);
  }

  limpiarSeleccion(): void {
    this.seleccionados = [];
    this.elegido.emit(null);
    this.elegidos.emit([]);
  }

  totalSeleccionados(): string {
    const sum = this.seleccionados.reduce((acc, a) => {
      const p = Number(a?.precio_final || (Number(a?.precio_base || 0) + Number(a?.recargo_precio || 0)));
      return acc + p;
    }, 0);
    return sum.toFixed(2);
  }

  precioAsiento(a: any): string {
    return Number(a?.precio_final || (Number(a?.precio_base || 0) + Number(a?.recargo_precio || 0))).toFixed(2);
  }
}

@Component({
  selector: 'app-desglose',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './desglose.component.html',
  styleUrl: './desglose.component.css'
})
export class DesgloseComponent {
  @Input() a: any;
  @Input() asientos: any[] = [];

  numero(v: any): string { return Number(v || 0).toFixed(2); }

  totalCalculado(): string {
    if (this.asientos && this.asientos.length > 0) {
      const sum = this.asientos.reduce((acc, item) => {
        const p = Number(item?.precio_final || (Number(item?.precio_base || 0) + Number(item?.recargo_precio || 0)));
        return acc + p;
      }, 0);
      return sum.toFixed(2);
    }
    return this.numero(this.a?.precio_final || (Number(this.a?.precio_base || 0) + Number(this.a?.recargo_precio || 0)));
  }
}

@Component({
  selector: 'app-pasajero-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pasajero-form.component.html',
  styleUrl: './pasajero-form.component.css'
})
export class PasajeroFormComponent {
  @Input() p: any = {};
}

@Component({
  selector: 'app-boleto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boleto.component.html',
  styleUrl: './boleto.component.css'
})
export class BoletoComponent {
  @Input() b: any;
  numero(v: any): string { return Number(v || 0).toFixed(2); }
  imprimir(): void { window.print(); }
}
