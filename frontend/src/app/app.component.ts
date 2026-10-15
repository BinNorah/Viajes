import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from './api.service';
@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="hd">
      <a class="brand" routerLink="/" aria-label="Rutas del Perú, inicio"><span class="brand-mark">RP</span><span class="brand-copy"><b>Rutas del Perú</b><small>TERMINAL DE VIAJES</small></span></a>
      <nav class="main-nav" aria-label="Navegación principal">
        <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}">Inicio</a>
        <a href="/pasajes" (click)="irAPasajes($event)">Pasajes</a>
        @if (api.user(); as u) {
          @if (u.rol != 'CHOFER') { <a routerLink="/mis-viajes" routerLinkActive="on">Mis viajes</a> }
          @if (u.rol == 'TAQUILLERO' || u.rol == 'ADMIN') { <a routerLink="/taquilla" routerLinkActive="on">Taquilla</a> }
          @if (u.rol == 'CHOFER') { <a routerLink="/chofer" routerLinkActive="on">Mis asignaciones</a> }
          @if (u.rol == 'ADMIN') { <a routerLink="/admin" routerLinkActive="on">Administración</a><a routerLink="/admin/reservas" routerLinkActive="on">Reservas</a><a routerLink="/reportes" routerLinkActive="on">Reportes</a> }
        }
      </nav>
      <div class="account-area">
        @if (api.user(); as u) { <span class="user-name">{{u.nombre}}</span><button class="account-button" (click)="salir()">Salir</button> }
        @else { <a class="account-button" routerLink="/login"><span aria-hidden="true">♙</span> Ingresar</a> }
      </div>
    </header>
    <main><router-outlet /></main>
    <footer class="site-footer"><div class="footer-inner"><a class="brand footer-brand" routerLink="/"><span class="brand-mark">RP</span><span class="brand-copy"><b>Rutas del Perú</b><small>VIAJA A TU MANERA</small></span></a><p>Tu próximo destino está más cerca.</p><span class="footer-copy">© 2026 Rutas del Perú · Proyecto de viajes interprovinciales</span></div></footer>
  `
})
export class AppComponent {
  constructor(public api: Api, private router: Router) {}
  salir(): void { this.api.logout().subscribe(() => this.router.navigateByUrl('/')); }
  irAPasajes(event: Event): void {
    event.preventDefault();
    const scroll = () => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (this.router.url.split('#')[0] !== '/pasajes') this.router.navigateByUrl('/pasajes').then(() => setTimeout(scroll, 80));
    else scroll();
  }
}





