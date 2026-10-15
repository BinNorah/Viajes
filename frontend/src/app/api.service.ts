import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { catchError, firstValueFrom, tap, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError(e => { alert(e.error?.error || 'Error de comunicación'); return throwError(() => e); }));

@Injectable({ providedIn: 'root' })
export class Api {
  user = signal<any>(null);
  ready: Promise<any>;
  constructor(private http: HttpClient) {
    this.ready = firstValueFrom(this.http.get<any>('/api/me')).then(u => this.user.set(u)).catch(() => {});
  }
  get<T = any>(u: string) { return this.http.get<T>(u); }
  post<T = any>(u: string, b: any = {}) { return this.http.post<T>(u, b); }
  put<T = any>(u: string, b: any = {}) { return this.http.put<T>(u, b); }
  delete<T = any>(u: string) { return this.http.delete<T>(u); }
  login(correo: string, password: string) { return this.post('/api/login', { correo, password }).pipe(tap(u => this.user.set(u))); }
  registro(d: any) { return this.post('/api/registro', d).pipe(tap(u => this.user.set(u))); }
  logout() { return this.post('/api/logout').pipe(tap(() => this.user.set(null))); }
}
