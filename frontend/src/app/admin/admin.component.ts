import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Api } from '../api.service';
import { CrudComponent } from './crud.component';

const TIPOS = ['ECONOMICO', 'EJECUTIVO', 'CAMA_160', 'VIP_180'];
const ESTV = ['PROGRAMADO', 'ABORDANDO', 'EN_RUTA', 'FINALIZADO', 'CANCELADO'];
const term = (r: any) => r.ciudad + ' - ' + r.nombre_agencia;
const mk = (k: string, c: any) => ({ list: '/api/admin/' + k, post: '/api/admin/' + k, item: (i: any) => `/api/admin/${k}/${i}`, ...c });

const ENTS: any = {
  terminales: mk('terminales', {
    title: 'Terminales y Agencias',
    fields: [
      { name: 'ciudad' },
      { name: 'nombre_agencia' },
      { name: 'direccion' },
      { name: 'activo', type: 'sel', options: [1, 0] }
    ]
  }),
  rutas: mk('rutas', {
    title: 'Rutas Interprovinciales',
    fields: [
      { name: 'terminal_origen_id', type: 'ref', ref: 'terminales', label: term },
      { name: 'terminal_destino_id', type: 'ref', ref: 'terminales', label: term },
      { name: 'distancia_km', type: 'number' },
      { name: 'duracion_horas', type: 'number' }
    ]
  }),
  buses: mk('buses', {
    title: 'Flota de Buses',
    acciones: [{ tipo: 'asientos', label: 'Configurar Asientos' }],
    fields: [
      { name: 'placa' },
      { name: 'marca' },
      { name: 'modelo' },
      { name: 'tipo_servicio', type: 'sel', options: TIPOS },
      { name: 'total_pisos', type: 'sel', options: [1, 2] },
      { name: 'capacidad_total', type: 'number' },
      { name: 'estado', type: 'sel', options: ['ACTIVO', 'MANTENIMIENTO', 'BAJA'] }
    ]
  }),
  viajes: mk('viajes', {
    title: 'Programación de Salidas',
    del: 'Cancelar',
    acciones: [
      { tipo: 'manifiesto', label: 'Manifiesto CSV' },
      { tipo: 'manifiesto_view', label: 'Ver Manifiesto' }
    ],
    cols: ['id', 'origen', 'destino', 'fecha_salida', 'hora_salida', 'placa', 'chofer', 'precio_base', 'estado', 'ocupacion_pct'],
    fields: [
      { name: 'ruta_id', type: 'ref', ref: 'rutas', label: (r: any) => r.origen + ' → ' + r.destino },
      { name: 'bus_id', type: 'ref', ref: 'buses', label: (r: any) => r.placa + ' (' + r.marca + ' ' + (r.modelo || '') + ')' },
      { name: 'chofer_id', type: 'ref', ref: 'usuarios', label: (r: any) => r.nombres + ' ' + r.apellidos, filter: (r: any) => r.rol === 'CHOFER' },
      { name: 'fecha_salida', type: 'date' },
      { name: 'hora_salida', type: 'time' },
      { name: 'precio_base', type: 'number' },
      { name: 'estado', type: 'sel', options: ESTV }
    ]
  }),
  usuarios: mk('usuarios', {
    title: 'Usuarios y Permisos',
    fields: [
      { name: 'dni' },
      { name: 'nombres' },
      { name: 'apellidos' },
      { name: 'correo' },
      { name: 'telefono' },
      { name: 'rol', type: 'sel', options: ['ADMIN', 'TAQUILLERO', 'CHOFER', 'CLIENTE'] },
      { name: 'password', type: 'password' }
    ]
  })
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CrudComponent],
  template: `
    <section class="admin-shell">
      <!-- Admin Top Header -->
      <header class="admin-header-bar">
        <div>
          <div class="admin-breadcrumb">
            <span class="badge-dot"></span>
            <span>CENTRO DE OPERACIONES Y ADMINISTRACIÓN</span>
          </div>
          <h1 class="admin-page-title">Panel de Control Ejecutivo</h1>
          <p class="admin-page-desc">Supervisa la flota, itinerarios, ventas y personal de Rutas del Perú en tiempo real.</p>
        </div>

        <div class="admin-header-right">
          <div class="admin-date-box">
            <span class="date-label">FECHA OPERATIVA</span>
            <b>{{ hoy }}</b>
          </div>
        </div>
      </header>

      <!-- Navigation Tabs -->
      <nav class="admin-nav-tabs">
        <button type="button" 
                class="tab-btn" 
                [class.active]="seccion === 'resumen'" 
                (click)="abrirResumen()">
          <span class="tab-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </span>
          <span>Resumen Ejecutivo</span>
        </button>

        @for (k of keys; track k) {
          <button type="button" 
                  class="tab-btn" 
                  [class.active]="seccion === k" 
                  (click)="abrir(k)">
            <span>{{ ents[k].title }}</span>
          </button>
        }

        <div class="tabs-separator"></div>

        <a routerLink="/admin/reservas" class="tab-btn tab-link">
          <span class="tab-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          </span>
          <span>Boletos & Reservas</span>
        </a>

        <a routerLink="/reportes" class="tab-btn tab-link">
          <span class="tab-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </span>
          <span>Reportes & Ventas</span>
        </a>

        <a href="http://127.0.0.1:5000/dashboard" target="_blank" rel="noopener noreferrer" class="tab-btn tab-link server-tab">
          <span class="tab-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </span>
          <span>Consola Servidor API</span>
        </a>
      </nav>

      <!-- Section: Executive Summary -->
      @if (seccion === 'resumen') {
        <div class="executive-summary-view">
          <!-- Top Row Controls -->
          <div class="overview-toolbar">
            <div>
              <h2>Métricas Clave de Transporte</h2>
              <p>Métricas operativas del servicio de transporte en tiempo real.</p>
            </div>
            <div class="toolbar-actions">
              <button type="button" class="btn-refresh" (click)="cargarResumen()" [disabled]="cargando">
                <span>{{ cargando ? 'Actualizando datos…' : 'Sincronizar' }}</span>
              </button>
              <button type="button" class="btn-clean-locks" (click)="limpiarBloqueos()">
                <span>Liberar Bloqueos Vencidos</span>
              </button>
            </div>
          </div>

          <!-- KPI Cards Grid -->
          <div class="kpi-cards-grid">
            <div class="kpi-metric-card" (click)="abrir('viajes')">
              <div class="kpi-card-top">
                <span class="kpi-icon-box" style="background:#e0f2fe; color:#0284c7;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </span>
                <span class="kpi-pill">Operación</span>
              </div>
              <div class="kpi-number">{{ programados }}</div>
              <div class="kpi-title">Salidas Programadas</div>
              <div class="kpi-subtext">{{ viajesTotal }} viajes en total registrados</div>
            </div>

            <div class="kpi-metric-card" (click)="abrir('buses')">
              <div class="kpi-card-top">
                <span class="kpi-icon-box" style="background:#dcfce7; color:#15803d;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="7" cy="18" r="1.5"></circle><circle cx="17" cy="18" r="1.5"></circle></svg>
                </span>
                <span class="kpi-pill">Flota</span>
              </div>
              <div class="kpi-number">{{ busesActivos }} / {{ busesTotal }}</div>
              <div class="kpi-title">Buses Activos</div>
              <div class="kpi-subtext">{{ capacidadTotal }} asientos totales en circulación</div>
            </div>

            <div class="kpi-metric-card" routerLink="/admin/reservas">
              <div class="kpi-card-top">
                <span class="kpi-icon-box" style="background:#fef3c7; color:#b45309;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </span>
                <span class="kpi-pill">Ingresos</span>
              </div>
              <div class="kpi-number">S/ {{ totalVentas }}</div>
              <div class="kpi-title">Ventas Confirmadas</div>
              <div class="kpi-subtext">{{ boletosTotal }} boletos pagados en el periodo</div>
            </div>

            <div class="kpi-metric-card" (click)="abrir('usuarios')">
              <div class="kpi-card-top">
                <span class="kpi-icon-box" style="background:#f3e8ff; color:#7e22ce;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </span>
                <span class="kpi-pill">Personal</span>
              </div>
              <div class="kpi-number">{{ personal }}</div>
              <div class="kpi-title">Personal Operativo</div>
              <div class="kpi-subtext">Administradores, taquilleros y conductores</div>
            </div>

            <div class="kpi-metric-card" (click)="abrir('terminales')">
              <div class="kpi-card-top">
                <span class="kpi-icon-box" style="background:#ffedd5; color:#c2410c;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </span>
                <span class="kpi-pill">Red</span>
              </div>
              <div class="kpi-number">{{ terminalesTotal }}</div>
              <div class="kpi-title">Terminales & Agencias</div>
              <div class="kpi-subtext">Puntos de atención a nivel nacional</div>
            </div>
          </div>

          <!-- Bottom Grid: Quick Operations + Analytics Preview -->
          <div class="analytics-panels-grid">
            <!-- Left: Quick Actions & Operational Shortcuts -->
            <div class="analytics-panel">
              <div class="panel-header">
                <div>
                  <span class="panel-kicker">ACCESO INMEDIATO</span>
                  <h3>Gestión y Acciones Frecuentes</h3>
                </div>
              </div>

              <div class="quick-tasks-list">
                <button type="button" class="task-card" (click)="abrir('viajes')">
                  <span class="task-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </span>
                  <div>
                    <b>Programar Nueva Salida</b>
                    <small>Crear itinerario, asignar bus, conductor y tarifa base</small>
                  </div>
                  <span class="task-arrow">→</span>
                </button>

                <button type="button" class="task-card" (click)="abrir('buses')">
                  <span class="task-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="7" cy="18" r="1.5"></circle><circle cx="17" cy="18" r="1.5"></circle></svg>
                  </span>
                  <div>
                    <b>Gestionar Flota y Asientos</b>
                    <small>Registrar unidades y generar croquis de asientos</small>
                  </div>
                  <span class="task-arrow">→</span>
                </button>

                <a routerLink="/admin/reservas" class="task-card">
                  <span class="task-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                  </span>
                  <div>
                    <b>Control de Boletos y Reservas</b>
                    <small>Consultar ventas web y de taquilla en tiempo real</small>
                  </div>
                  <span class="task-arrow">→</span>
                </a>

                <a routerLink="/reportes" class="task-card">
                  <span class="task-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  </span>
                  <div>
                    <b>Reportes Financieros y Ocupación</b>
                    <small>Análisis de ingresos por periodo y ocupación de buses</small>
                  </div>
                  <span class="task-arrow">→</span>
                </a>

                <a href="http://127.0.0.1:5000/dashboard" target="_blank" rel="noopener noreferrer" class="task-card admin-backend-card">
                  <span class="task-icon dev-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                  </span>
                  <div>
                    <b>Consola Técnica del Backend & API</b>
                    <small>Métricas del servidor Flask, directorio de endpoints y base SQLite</small>
                  </div>
                  <span class="task-arrow">↗</span>
                </a>
              </div>
            </div>

            <!-- Right: System Health & Quick Status -->
            <div class="analytics-panel">
              <div class="panel-header">
                <div>
                  <span class="panel-kicker">ESTADO OPERACIONAL</span>
                  <h3>Diagnóstico del Servicio</h3>
                </div>
                <span class="health-tag">OPERATIVO</span>
              </div>

              <div class="health-metrics-list">
                <div class="health-row">
                  <span><i class="dot green-dot"></i> Servicio de Reservas</span>
                  <b>Activo y Sincronizado</b>
                </div>
                <div class="health-row">
                  <span><i class="dot green-dot"></i> Pasarela de Pagos</span>
                  <b>Cifrada y Segura (TLS 1.3)</b>
                </div>
                <div class="health-row">
                  <span><i class="dot green-dot"></i> Control de Concurrencia</span>
                  <b>Bloqueo temporal 10 min activo</b>
                </div>
                <div class="health-row">
                  <span><i class="dot green-dot"></i> Protección de Asientos</span>
                  <b>Validación atómica en tiempo real</b>
                </div>
                <div class="health-row">
                  <span><i class="dot green-dot"></i> Emisión Electrónica</span>
                  <b>Normativa MTC / QR Oficial</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      } 
      <!-- Section: Entity CRUD -->
      @else {
        <!-- Bus seat generator banner if bus selected -->
        @if (bus) {
          <div class="seat-generator-card">
            <div class="generator-header">
              <div>
                <span class="kicker">CONFIGURACIÓN DE CROQUIS</span>
                <h2>Generador de Asientos para Bus {{ bus.placa }}</h2>
                <p>Tipo de Servicio: <b>{{ bus.tipo_servicio }}</b> · Marca: {{ bus.marca }} {{ bus.modelo }}</p>
              </div>
              <button class="btn-close-generator" (click)="bus = null">Volver a buses</button>
            </div>

            <div class="generator-form-row">
              <label>Filas Piso 1:
                <input type="number" min="1" max="15" [(ngModel)]="g.filas1">
              </label>
              <label>Recargo Piso 1 (S/):
                <input type="number" min="0" step="5" [(ngModel)]="g.recargo1">
              </label>
              <label>Filas Piso 2:
                <input type="number" min="0" max="15" [(ngModel)]="g.filas2">
              </label>
              <label>Recargo Piso 2 (S/):
                <input type="number" min="0" step="5" [(ngModel)]="g.recargo2">
              </label>
              <button type="button" class="btn-generate-seats" (click)="generar()">
                Generar Croquis Automático
              </button>
            </div>
          </div>
        }

        <app-crud [cfg]="cfg" (accion)="onAccion($event)"></app-crud>
      }
    </section>
  `,
  styles: [`
    .admin-shell {
      max-width: 1260px;
      margin: 0 auto;
      padding: 24px 0 60px;
    }
    .admin-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      padding-bottom: 22px;
      border-bottom: 1px solid #e2e8e4;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .admin-breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
    }
    .admin-page-title {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
    }
    .admin-page-desc {
      font-size: 13px;
      color: #64748b;
    }
    .admin-header-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .admin-date-box {
      text-align: right;
    }
    .date-label {
      display: block;
      font-size: 9px;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.1em;
    }
    .admin-date-box b {
      font-size: 13px;
      color: #0f172a;
    }
    .backend-core-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 10px;
      background: #0f172a;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.15s;
    }
    .backend-core-btn:hover {
      background: #1e293b;
      transform: translateY(-1px);
    }

    .admin-nav-tabs {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 6px;
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      white-space: nowrap;
      text-decoration: none;
      transition: all 0.15s;
    }
    .tab-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .tab-btn.active {
      background: #064e3b;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(6, 78, 59, 0.2);
    }
    .tab-icon {
      font-size: 14px;
    }
    .tabs-separator {
      width: 1px;
      background: #cbd5e1;
      margin: 4px 4px;
    }
    .tab-link {
      color: #0284c7;
    }

    /* Executive summary */
    .overview-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .overview-toolbar h2 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .overview-toolbar p {
      font-size: 12px;
      color: #64748b;
    }
    .toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .btn-refresh, .btn-clean-locks {
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
    }
    .btn-refresh:hover, .btn-clean-locks:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .kpi-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-metric-card {
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .kpi-metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.07);
      border-color: #94a3b8;
    }
    .kpi-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .kpi-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      font-size: 18px;
    }
    .kpi-pill {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }
    .kpi-number {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
    }
    .kpi-title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }
    .kpi-subtext {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
    }

    .analytics-panels-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 20px;
    }
    @media (max-width: 900px) {
      .analytics-panels-grid { grid-template-columns: 1fr; }
    }
    .analytics-panel {
      padding: 24px;
      background: #ffffff;
      border: 1px solid #e2e8e4;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
    }
    .panel-kicker {
      font-size: 9px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.1em;
      display: block;
      margin-bottom: 3px;
    }
    .panel-header h3 {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .health-tag {
      font-size: 11px;
      font-weight: 800;
      background: #dcfce7;
      color: #15803d;
      padding: 4px 10px;
      border-radius: 9999px;
    }

    .quick-tasks-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .task-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
      color: #1e293b;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
    }
    .task-card:hover {
      background: #ffffff;
      border-color: #059669;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.08);
      transform: translateX(3px);
    }
    .task-icon {
      font-size: 20px;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #ffffff;
      display: grid;
      place-items: center;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .task-card div {
      flex: 1;
      text-align: left;
    }
    .task-card b {
      display: block;
      font-size: 13px;
      color: #0f172a;
    }
    .task-card small {
      font-size: 11px;
      color: #64748b;
    }
    .task-arrow {
      color: #94a3b8;
      font-weight: 700;
      font-size: 16px;
    }

    .health-metrics-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .health-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      background: #f8fafc;
      font-size: 12px;
    }
    .health-row span {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #475569;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .green-dot {
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    }
    .health-row b {
      color: #0f172a;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
    }

    .system-box-cta {
      padding: 14px;
      border-radius: 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .system-box-cta p {
      font-size: 11px;
      color: #166534;
      margin-bottom: 10px;
    }
    .btn-open-backend {
      display: block;
      text-align: center;
      padding: 8px 12px;
      border-radius: 8px;
      background: #166534;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.15s;
    }
    .btn-open-backend:hover {
      background: #14532d;
    }

    /* Seat generator */
    .seat-generator-card {
      padding: 22px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      margin-bottom: 20px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.04);
    }
    .generator-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .generator-header h2 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }
    .generator-header p {
      font-size: 12px;
      color: #64748b;
    }
    .btn-close-generator {
      padding: 6px 12px;
      border: 1px solid #cbd5e1;
      background: #fff;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    .generator-form-row {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      flex-wrap: wrap;
    }
    .generator-form-row label {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }
    .generator-form-row input {
      height: 38px;
      padding: 0 10px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      width: 110px;
    }
    .btn-generate-seats {
      height: 38px;
      padding: 0 18px;
      border-radius: 8px;
      background: #0f766e;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-generate-seats:hover {
      background: #115e59;
    }
  `]
})
export class AdminComponent implements OnInit {
  ents = ENTS;
  keys = Object.keys(ENTS);
  cfg: any = ENTS.terminales;
  seccion = 'resumen';
  bus: any = null;
  hoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  cargando = false;
  viajesTotal = 0;
  programados = 0;
  busesActivos = 0;
  busesTotal = 0;
  capacidadTotal = 0;
  terminalesTotal = 0;
  personal = 0;
  totalVentas = '0.00';
  boletosTotal = 0;
  g: any = { filas1: 3, recargo1: 25, filas2: 9, recargo2: 0 };

  constructor(public api: Api) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.cargando = true;
    forkJoin({
      terminales: this.api.get<any[]>('/api/admin/terminales'),
      buses: this.api.get<any[]>('/api/admin/buses'),
      viajes: this.api.get<any[]>('/api/admin/viajes'),
      usuarios: this.api.get<any[]>('/api/admin/usuarios'),
      ventas: this.api.get<any>('/api/reportes/ventas')
    }).subscribe({
      next: d => {
        this.terminalesTotal = d.terminales.length;
        this.busesTotal = d.buses.length;
        this.busesActivos = d.buses.filter(x => x.estado === 'ACTIVO').length;
        this.capacidadTotal = d.buses.reduce((acc, b) => acc + (b.capacidad_total || 0), 0);
        this.viajesTotal = d.viajes.length;
        this.programados = d.viajes.filter(x => x.estado === 'PROGRAMADO').length;
        this.personal = d.usuarios.filter(x => x.rol !== 'CLIENTE').length;

        if (d.ventas?.total) {
          this.totalVentas = Number(d.ventas.total.total || 0).toFixed(2);
          this.boletosTotal = d.ventas.total.boletos || 0;
        }

        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  abrirResumen(): void {
    this.seccion = 'resumen';
    this.bus = null;
    this.cargarResumen();
  }

  abrir(k: string): void {
    this.seccion = k;
    this.cfg = this.ents[k];
    this.bus = null;
  }

  icono(k: string): string {
    return '';
  }

  limpiarBloqueos(): void {
    this.api.post('/api/admin/clean-locks').subscribe({
      next: (r: any) => {
        this.api.toast.success(r.mensaje || 'Bloqueos liberados', 'Mantenimiento');
        this.cargarResumen();
      }
    });
  }

  onAccion(e: any): void {
    if (e.tipo === 'manifiesto') {
      window.open(`/api/viajes/${e.row.id}/manifiesto`);
    } else if (e.tipo === 'manifiesto_view') {
      this.api.get(`/api/viajes/${e.row.id}/manifiesto?formato=json`).subscribe({
        next: (res: any) => {
          const count = res.pasajeros?.length || 0;
          this.api.toast.info(`Manifiesto viaje #${e.row.id}: ${count} pasajeros confirmados a bordo.`, 'Manifiesto de Pasajeros');
        }
      });
    } else if (e.tipo === 'asientos') {
      this.bus = e.row;
      this.cfg = {
        title: `Asientos del bus ${e.row.placa} (${e.row.marca} ${e.row.modelo || ''})`,
        list: `/api/admin/buses/${e.row.id}/asientos`,
        post: `/api/admin/buses/${e.row.id}/asientos`,
        item: (i: any) => '/api/admin/asientos/' + i,
        fields: [
          { name: 'numero_asiento', type: 'number' },
          { name: 'piso', type: 'sel', options: [1, 2] },
          { name: 'fila', type: 'number' },
          { name: 'columna', type: 'number' },
          { name: 'ubicacion', type: 'sel', options: ['VENTANA', 'PASILLO', 'CENTRO'] },
          { name: 'recargo_precio', type: 'number' }
        ]
      };
    }
  }

  generar(): void {
    this.api.post(`/api/admin/buses/${this.bus.id}/asientos/generar`, this.g).subscribe({
      next: (r: any) => {
        this.api.toast.success(`Se generaron ${r.total} asientos correctamente para el bus ${this.bus.placa}.`, 'Croquis generado');
        this.cfg = { ...this.cfg };
        this.cargarResumen();
      }
    });
  }
}
