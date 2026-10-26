import { Routes } from '@angular/router';
import { roleGuard } from './guards';
import { InicioComponent } from './inicio/inicio.component';
import { BuscarComponent } from './pasajero/buscar/buscar.component';
import { LoginComponent } from './pasajero/login/login.component';
import { MisViajesComponent } from './pasajero/mis-viajes/mis-viajes.component';
import { TaquillaComponent } from './taquilla/taquilla.component';
import { ChoferComponent } from './chofer/chofer.component';
import { AdminComponent } from './admin/panel/admin.component';
import { ReportesComponent } from './admin/reportes/reportes.component';
import { AdminReservasComponent } from './admin/reservas/reservas.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'pasajes', component: BuscarComponent },
  { path: 'login', component: LoginComponent },
  { path: 'mis-viajes', component: MisViajesComponent, canActivate: [roleGuard()] },
  { path: 'taquilla', component: TaquillaComponent, canActivate: [roleGuard(['TAQUILLERO', 'ADMIN'])] },
  { path: 'chofer', component: ChoferComponent, canActivate: [roleGuard(['CHOFER'])] },
  { path: 'admin', component: AdminComponent, canActivate: [roleGuard(['ADMIN'])] },
  { path: 'admin/reservas', component: AdminReservasComponent, canActivate: [roleGuard(['ADMIN'])] },
  { path: 'reportes', component: ReportesComponent, canActivate: [roleGuard(['ADMIN'])] },
  { path: '**', redirectTo: '' }
];
