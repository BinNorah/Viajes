import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { catchError, firstValueFrom, tap, throwError } from 'rxjs';
import { ToastService } from './toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError(e => {
      const msg = e.error?.error || e.message || 'Error de comunicación con el servidor';
      toast.error(msg, 'Error en la solicitud');
      return throwError(() => e);
    })
  );
};

@Injectable({ providedIn: 'root' })
export class Api {
  user = signal<any>(null);
  ready: Promise<any>;
  constructor(private http: HttpClient, public toast: ToastService) {
    this.ready = firstValueFrom(this.http.get<any>('/api/me')).then(u => this.user.set(u)).catch(() => {});
  }
  get<T = any>(u: string) { return this.http.get<T>(u); }
  post<T = any>(u: string, b: any = {}) { return this.http.post<T>(u, b); }
  put<T = any>(u: string, b: any = {}) { return this.http.put<T>(u, b); }
  delete<T = any>(u: string) { return this.http.delete<T>(u); }
  login(correo: string, password: string) { 
    return this.post('/api/login', { correo, password }).pipe(
      tap(u => {
        this.user.set(u);
        this.toast.success(`Bienvenido de nuevo, ${u.nombre}`, 'Sesión iniciada');
      })
    ); 
  }
  registro(d: any) { 
    return this.post('/api/registro', d).pipe(
      tap(u => {
        this.user.set(u);
        this.toast.success(`Cuenta creada con éxito. ¡Bienvenido, ${u.nombre}!`, 'Registro completado');
      })
    ); 
  }
  logout() { 
    return this.post('/api/logout').pipe(
      tap(() => {
        this.user.set(null);
        this.toast.info('Has cerrado sesión correctamente.', 'Hasta pronto');
      })
    ); 
  }
}

