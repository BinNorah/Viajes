import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../../api.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  fechaDesde = this.primerDiaMes();
  fechaHasta = this.hoyISO();
  reporteVentas: any = null;
  reporteOcupacion: any[] = [];
  cargando = false;

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.consultarTodo();
  }

  consultarTodo(): void {
    this.consultarVentas();
    this.api.get<any[]>('/api/reportes/ocupacion').subscribe(lista => this.reporteOcupacion = lista || []);
  }

  consultarVentas(): void {
    if (!this.fechaDesde || !this.fechaHasta || this.fechaHasta < this.fechaDesde) return;
    this.cargando = true;
    this.api.get<any>(`/api/reportes/ventas?desde=${encodeURIComponent(this.fechaDesde)}&hasta=${encodeURIComponent(this.fechaHasta)}`).subscribe({
      next: respuesta => {
        this.reporteVentas = respuesta;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  ticketPromedio(): string {
    const total = Number(this.reporteVentas?.total?.total || 0);
    const boletos = Number(this.reporteVentas?.total?.boletos || 0);
    if (!boletos) return '0.00';
    return (total / boletos).toFixed(2);
  }

  setMesActual(): void {
    this.fechaDesde = this.primerDiaMes();
    this.fechaHasta = this.hoyISO();
    this.consultarVentas();
  }

  setUltimos7Dias(): void {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 7);
    fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
    this.fechaDesde = fecha.toISOString().slice(0, 10);
    this.fechaHasta = this.hoyISO();
    this.consultarVentas();
  }

  dinero(valor: any): string {
    return Number(valor || 0).toFixed(2);
  }

  porcentaje(valor: any): number {
    return Math.max(0, Math.min(100, Math.round(Number(valor || 0))));
  }

  participacion(valor: any): number {
    const maximo = Math.max(0, ...(this.reporteVentas?.por_taquillero || []).map((x: any) => Number(x.total || 0)));
    return maximo ? this.porcentaje(Number(valor || 0) / maximo * 100) : 0;
  }

  private hoyISO(): string {
    const fecha = new Date();
    fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
    return fecha.toISOString().slice(0, 10);
  }

  private primerDiaMes(): string {
    return this.hoyISO().slice(0, 8) + '01';
  }
}
