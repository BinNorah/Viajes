import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../api.service';

export interface DestinoPopular {
  viajeId?: number;
  origen: string;
  destino: string;
  precio: number;
  horario?: string;
  fecha?: string;
  duracionAprox: string;
  frecuencia: string;
  categoria: string;
  descripcion: string;
  servicio?: string;
  asientosLibres?: number;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  ciudades: string[] = ['Lima', 'Huancayo', 'Ayacucho', 'Cusco'];
  origen = '';
  destino = '';
  fecha = '';
  fechaMinima = new Date().toISOString().split('T')[0];

  destinosPopulares: DestinoPopular[] = [
    {
      viajeId: 51,
      origen: 'Lima',
      destino: 'Huancayo',
      precio: 45,
      horario: '14:00',
      duracionAprox: '6h 30m',
      frecuencia: '5 salidas diarias',
      categoria: 'Sierra Central',
      servicio: 'CAMA 160°',
      asientosLibres: 44,
      descripcion: 'Recorrido panorámico por Ticlio hacia el Valle del Mantaro. Buses de 2 pisos con asientos reclinables.'
    },
    {
      viajeId: 65,
      origen: 'Lima',
      destino: 'Ayacucho',
      precio: 70,
      horario: '21:30',
      duracionAprox: '8h 00m',
      frecuencia: '6 salidas diarias',
      categoria: 'Ruta Histórica',
      servicio: 'VIP 180°',
      asientosLibres: 44,
      descripcion: 'Salidas nocturnas y diurnas hacia la Ciudad de las Iglesias. Climatización y confort premium.'
    },
    {
      viajeId: 70,
      origen: 'Huancayo',
      destino: 'Lima',
      precio: 45,
      horario: '09:00',
      duracionAprox: '6h 30m',
      frecuencia: '4 salidas diarias',
      categoria: 'Retorno Directo',
      servicio: 'CAMA 160°',
      asientosLibres: 44,
      descripcion: 'Llegada directa al Gran Terminal de Lima. Asientos reclinables y conectores USB individuales.'
    },
    {
      viajeId: 71,
      origen: 'Ayacucho',
      destino: 'Huancayo',
      precio: 40,
      horario: '16:30',
      duracionAprox: '7h 00m',
      frecuencia: '4 salidas diarias',
      categoria: 'Conexión Regional',
      servicio: 'CAMA 160°',
      asientosLibres: 44,
      descripcion: 'Conecta dos de los departamentos más emblemáticos de la sierra central con máxima seguridad y puntualidad.'
    }
  ];

  constructor(private api: Api, private router: Router) {}

  ngOnInit(): void {
    this.api.get<string[]>('/api/ciudades').subscribe({
      next: listaCiudades => {
        if (listaCiudades && listaCiudades.length) {
          this.ciudades = listaCiudades;
        }
      }
    });

    // Cargar salidas reales del backend para enlazar viajes exactos disponibles
    this.api.get<any[]>('/api/viajes').subscribe({
      next: viajes => {
        if (viajes && viajes.length) {
          for (const item of this.destinosPopulares) {
            const viajeReal = viajes.find(v => v.origen === item.origen && v.destino === item.destino);
            if (viajeReal) {
              item.viajeId = viajeReal.id;
              item.precio = viajeReal.precio_base;
              item.horario = viajeReal.hora_salida;
              item.fecha = viajeReal.fecha_salida;
              item.servicio = viajeReal.tipo_servicio;
              item.asientosLibres = viajeReal.asientos_libres;
            }
          }
        }
      }
    });
  }

  buscarPasajes(): void {
    const parametros: any = {};
    if (this.origen) parametros.origen = this.origen;
    if (this.destino) parametros.destino = this.destino;
    if (this.fecha) parametros.fecha = this.fecha;

    this.router.navigate(['/pasajes'], { queryParams: parametros });
  }

  irAViaje(destino: DestinoPopular): void {
    if (destino.viajeId) {
      this.router.navigate(['/pasajes'], {
        queryParams: { viajeId: destino.viajeId, origen: destino.origen, destino: destino.destino }
      });
    } else {
      this.router.navigate(['/pasajes'], {
        queryParams: { origen: destino.origen, destino: destino.destino }
      });
    }
  }
}
