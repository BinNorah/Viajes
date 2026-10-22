import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'success' | 'error' | 'info' | 'warning';
  titulo?: string;
  mensaje: string;
  duracion?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private contador = 0;

  mostrar(mensaje: string, tipo: 'success' | 'error' | 'info' | 'warning' = 'info', titulo?: string, duracion = 4000): void {
    const id = ++this.contador;
    const nuevo: Toast = { id, tipo, titulo, mensaje, duracion };
    this.toasts.update(lista => [...lista, nuevo]);

    if (duracion > 0) {
      setTimeout(() => this.remover(id), duracion);
    }
  }

  success(mensaje: string, titulo = 'Éxito'): void {
    this.mostrar(mensaje, 'success', titulo);
  }

  error(mensaje: string, titulo = 'Atención'): void {
    this.mostrar(mensaje, 'error', titulo, 5000);
  }

  info(mensaje: string, titulo = 'Información'): void {
    this.mostrar(mensaje, 'info', titulo);
  }

  warning(mensaje: string, titulo = 'Aviso'): void {
    this.mostrar(mensaje, 'warning', titulo, 4500);
  }

  remover(id: number): void {
    this.toasts.update(lista => lista.filter(t => t.id !== id));
  }
}
