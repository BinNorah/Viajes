import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
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
      next: respuesta => {
        this.asientos = respuesta.asientos || [];
        this.cargando = false;
        if (this.pisos.length && !this.pisos.includes(this.pisoActivo)) {
          this.pisoActivo = this.pisos[0];
        }
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

  asientosEnFila(piso: number, fila: number, columnas: number[]): any[] {
    return this.asientosPorPiso(piso)
      .filter(a => Number(a.fila) === fila && columnas.includes(Number(a.columna)))
      .sort((a, b) => Number(a.columna) - Number(b.columna));
  }

  estaSeleccionado(asiento: any): boolean {
    return this.seleccionados.some(s => s.id === asiento.id);
  }

  indiceSeleccion(asiento: any): number {
    return this.seleccionados.findIndex(s => s.id === asiento.id);
  }

  seleccionar(asiento: any): void {
    if (asiento.estado !== 'LIBRE' && !asiento.mio) return;
    const indice = this.seleccionados.findIndex(s => s.id === asiento.id);
    if (indice >= 0) {
      this.seleccionados.splice(indice, 1);
    } else {
      if (this.seleccionados.length >= this.maxSeleccion) {
        this.api.toast.info(`Puedes seleccionar hasta un máximo de ${this.maxSeleccion} asientos por compra.`);
        return;
      }
      this.seleccionados.push(asiento);
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
    const suma = this.seleccionados.reduce((acumulado, asiento) => {
      const precio = Number(asiento?.precio_final || (Number(asiento?.precio_base || 0) + Number(asiento?.recargo_precio || 0)));
      return acumulado + precio;
    }, 0);
    return suma.toFixed(2);
  }

  precioAsiento(asiento: any): string {
    return Number(asiento?.precio_final || (Number(asiento?.precio_base || 0) + Number(asiento?.recargo_precio || 0))).toFixed(2);
  }
}
