import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from './api.service';
import { ToastsComponent } from './toasts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(public api: Api, private router: Router) {}

  get usuarioActual() {
    return this.api.user;
  }

  salir(): void {
    this.api.logout().subscribe(() => this.router.navigateByUrl('/'));
  }

  esRutaPrivilegiada(): boolean {
    const url = this.router.url;
    return url.startsWith('/admin') || url.startsWith('/taquilla') || url.startsWith('/chofer') || url.startsWith('/reportes');
  }

  rolNombre(rol: string): string {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      TAQUILLERO: 'Taquilla',
      CHOFER: 'Conductor',
      CLIENTE: 'Pasajero'
    };
    return roles[rol] || rol;
  }
}
