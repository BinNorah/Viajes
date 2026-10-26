import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../api.service';

@Component({
  selector: 'app-chofer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './chofer.component.html',
  styleUrl: './chofer.component.css'
})
export class ChoferComponent implements OnInit {
  viajes: any[] = [];
  cargando = false;
  manifiestoModal: any = null;

  constructor(public api: Api, private router: Router) {}

  get usuarioActual() {
    return this.api.user;
  }

  cerrarSesion(): void {
    this.api.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  ngOnInit(): void {
    this.cargarViajes();
  }

  cargarViajes(): void {
    this.cargando = true;
    this.api.get<any[]>('/api/chofer/viajes').subscribe({
      next: respuesta => {
        this.viajes = respuesta || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  verPasajeros(viaje: any): void {
    this.api.get(`/api/viajes/${viaje.id}/manifiesto?formato=json`).subscribe({
      next: (respuesta: any) => {
        this.manifiestoModal = respuesta;
      }
    });
  }

  cerrarManifiesto(): void {
    this.manifiestoModal = null;
  }
}
