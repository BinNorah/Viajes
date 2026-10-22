import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast-item" [class]="'toast-' + t.tipo">
          <div class="toast-icon">
            @switch (t.tipo) {
              @case ('success') {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              }
              @case ('error') {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              }
              @case ('warning') {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              }
              @default {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              }
            }
          </div>
          <div class="toast-content">
            @if (t.titulo) { <div class="toast-title">{{ t.titulo }}</div> }
            <div class="toast-message">{{ t.mensaje }}</div>
          </div>
          <button type="button" class="toast-close" (click)="toastService.remover(t.id)" aria-label="Cerrar notificación">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      background: #ffffff;
      color: #1e293b;
      box-shadow: 0 10px 30px -5px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
      animation: toastSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.2s ease;
    }
    @keyframes toastSlide {
      from { transform: translateX(30px) scale(0.95); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }
    .toast-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      font-size: 13px;
      font-weight: 800;
    }
    .toast-success .toast-icon { background: #dcfce7; color: #15803d; }
    .toast-error .toast-icon { background: #fee2e2; color: #b91c1c; }
    .toast-warning .toast-icon { background: #fef3c7; color: #b45309; }
    .toast-info .toast-icon { background: #e0f2fe; color: #0369a1; }

    .toast-success { border-left: 4px solid #22c55e; }
    .toast-error { border-left: 4px solid #ef4444; }
    .toast-warning { border-left: 4px solid #f59e0b; }
    .toast-info { border-left: 4px solid #0ea5e9; }

    .toast-content {
      flex: 1;
      min-width: 0;
      padding-top: 2px;
    }
    .toast-title {
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .toast-message {
      font-size: 12px;
      color: #475569;
      line-height: 1.45;
    }
    .toast-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 13px;
      padding: 4px;
      border-radius: 4px;
      line-height: 1;
      transition: color 0.15s;
    }
    .toast-close:hover { color: #334155; }
  `]
})
export class ToastsComponent {
  constructor(public toastService: ToastService) {}
}
