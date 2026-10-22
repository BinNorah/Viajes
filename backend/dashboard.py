import os
import sys
import sqlite3
from datetime import datetime
from flask import jsonify, request, render_template_string

def get_system_stats(db_path, db_conn):
    try:
        cur = db_conn.cursor()
        
        # User stats
        cur.execute("SELECT rol, count(*) FROM usuarios GROUP BY rol")
        roles = dict(cur.fetchall())
        total_usuarios = sum(roles.values())
        
        # Terminals and routes
        cur.execute("SELECT count(*) FROM terminales WHERE activo = 1")
        terminales_activos = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM rutas")
        total_rutas = cur.fetchone()[0]
        
        # Buses
        cur.execute("SELECT count(*) FROM buses WHERE estado = 'ACTIVO'")
        buses_activos = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM buses")
        total_buses = cur.fetchone()[0]
        cur.execute("SELECT coalesce(sum(capacidad_total), 0) FROM buses WHERE estado = 'ACTIVO'")
        capacidad_flota = cur.fetchone()[0]
        
        # Trips
        hoy_str = datetime.now().strftime('%Y-%m-%d')
        cur.execute("SELECT count(*) FROM programacion_viajes")
        total_viajes = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM programacion_viajes WHERE fecha_salida = ? AND estado = 'PROGRAMADO'", (hoy_str,))
        viajes_hoy = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM programacion_viajes WHERE fecha_salida >= ? AND estado = 'PROGRAMADO'", (hoy_str,))
        viajes_proximos = cur.fetchone()[0]
        
        # Bookings & revenue
        cur.execute("SELECT count(*), coalesce(sum(precio_final), 0) FROM boletos_reservas WHERE estado_pago = 'PAGADO'")
        pagados_row = cur.fetchone()
        boletos_pagados = pagados_row[0]
        ingresos_totales = pagados_row[1]
        
        cur.execute("SELECT count(*) FROM boletos_reservas WHERE estado_pago = 'BLOQUEADO'")
        bloqueados_count = cur.fetchone()[0]
        
        cur.execute("SELECT count(*) FROM boletos_reservas WHERE estado_pago = 'ANULADO'")
        anulados_count = cur.fetchone()[0]
        
        # Table sizes
        tablas = ['usuarios', 'terminales', 'rutas', 'buses', 'asientos_plantilla', 'programacion_viajes', 'pasajeros', 'boletos_reservas']
        tablas_info = []
        for t in tablas:
            try:
                cur.execute(f"SELECT count(*) FROM {t}")
                cnt = cur.fetchone()[0]
                tablas_info.append({'name': t, 'count': cnt})
            except Exception:
                tablas_info.append({'name': t, 'count': 0})
            
        # DB File size
        db_size_kb = round(os.path.getsize(db_path) / 1024, 1) if os.path.exists(db_path) else 0
        
        # SQLite journal mode & integrity
        try:
            cur.execute("PRAGMA journal_mode")
            journal_mode = cur.fetchone()[0]
        except Exception:
            journal_mode = 'WAL'
        
        return {
            'status': 'OPERATIVO',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'python_version': sys.version.split()[0],
            'sqlite_version': sqlite3.sqlite_version,
            'journal_mode': journal_mode,
            'db_size_kb': db_size_kb,
            'db_path': db_path,
            'usuarios': {
                'total': total_usuarios,
                'roles': roles
            },
            'operacion': {
                'buses_activos': buses_activos,
                'total_buses': total_buses,
                'capacidad_flota': capacidad_flota,
                'terminales_activos': terminales_activos,
                'total_rutas': total_rutas,
                'total_viajes': total_viajes,
                'viajes_hoy': viajes_hoy,
                'viajes_proximos': viajes_proximos
            },
            'finanzas': {
                'ingresos_totales': f"{ingresos_totales:,.2f}",
                'boletos_pagados': boletos_pagados,
                'boletos_bloqueados': bloqueados_count,
                'boletos_anulados': anulados_count
            },
            'tablas': tablas_info
        }
    except Exception as e:
        return {
            'status': 'ALERTA',
            'error': str(e),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rutas del Perú · Backend Control Center</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f17;
      --surface: #111726;
      --surface-elevated: #161e31;
      --border: #1e293b;
      --border-focus: #3b82f6;
      --emerald: #10b981;
      --emerald-subtle: rgba(16, 185, 129, 0.12);
      --indigo: #6366f1;
      --indigo-subtle: rgba(99, 102, 241, 0.12);
      --sky: #0284c7;
      --amber: #f59e0b;
      --rose: #ef4444;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Top Header */
    .topbar {
      height: 64px;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      background: rgba(17, 23, 38, 0.75);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text);
    }
    .brand-mark {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: -0.02em;
    }
    .brand-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .brand-sub {
      font-size: 10px;
      font-family: var(--font-mono);
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }
    
    .topbar-status {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      background: var(--emerald-subtle);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 999px;
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 600;
      color: var(--emerald);
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--emerald);
      box-shadow: 0 0 10px var(--emerald);
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 7px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
      border: 1px solid transparent;
    }
    .btn-secondary {
      background: var(--surface-elevated);
      color: var(--text);
      border-color: var(--border);
    }
    .btn-secondary:hover {
      background: #1e283d;
      border-color: #334155;
    }
    .btn-primary {
      background: #10b981;
      color: #fff;
    }
    .btn-primary:hover {
      background: #059669;
    }
    
    /* Layout */
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 32px 64px;
    }
    
    /* Header hero */
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    .page-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .page-desc {
      font-size: 13px;
      color: var(--text-muted);
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }
    
    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 14px;
      margin-bottom: 32px;
    }
    .metric-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      transition: transform 0.15s, border-color 0.15s;
    }
    .metric-card:hover {
      border-color: #334155;
    }
    .metric-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .metric-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-icon {
      color: var(--text-dim);
    }
    .metric-value {
      font-size: 20px;
      font-weight: 800;
      font-family: var(--font-mono);
      color: var(--text);
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .metric-sub {
      font-size: 11px;
      color: var(--text-dim);
    }
    
    /* Content Columns */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 24px;
    }
    
    /* Panel */
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.015);
    }
    .panel-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .panel-badge {
      font-size: 10px;
      font-family: var(--font-mono);
      padding: 2px 8px;
      background: #1e293b;
      border-radius: 4px;
      color: var(--text-muted);
      font-weight: 600;
    }
    
    /* Endpoints Table */
    .endpoint-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border);
      transition: background 0.12s;
    }
    .endpoint-row:last-child { border-bottom: none; }
    .endpoint-row:hover { background: rgba(255, 255, 255, 0.02); }
    
    .endpoint-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .method-tag {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      padding: 3px 7px;
      border-radius: 4px;
      width: 52px;
      text-align: center;
      flex-shrink: 0;
    }
    .method-get { background: rgba(2, 132, 199, 0.15); color: #38bdf8; border: 1px solid rgba(2, 132, 199, 0.3); }
    .method-post { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .method-put { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .method-delete { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    
    .endpoint-path {
      font-family: var(--font-mono);
      font-size: 12.5px;
      color: #e2e8f0;
      font-weight: 500;
    }
    .endpoint-desc {
      font-size: 11.5px;
      color: var(--text-dim);
      margin-top: 1px;
    }
    
    .endpoint-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .btn-test {
      padding: 5px 12px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 5px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      color: var(--text);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.12s;
    }
    .btn-test:hover {
      background: #243048;
      border-color: #3b82f6;
      color: #fff;
    }
    
    /* SQLite Tables */
    .db-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .db-table th {
      padding: 10px 16px;
      text-align: left;
      font-size: 10.5px;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
      background: rgba(0,0,0,0.15);
    }
    .db-table td {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text-muted);
    }
    .db-table tr:last-child td { border-bottom: none; }
    .table-name {
      font-family: var(--font-mono);
      font-weight: 600;
      color: #cbd5e1;
    }
    
    /* Credentials card */
    .cred-item {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .cred-item:last-child { border-bottom: none; }
    .cred-role {
      font-size: 11px;
      font-weight: 700;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .cred-val {
      font-family: var(--font-mono);
      font-size: 12px;
      color: #38bdf8;
      background: #0d131f;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #1e293b;
    }
    
    /* Modal API Console */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 100;
      display: none;
      place-items: center;
      padding: 24px;
    }
    .modal-card {
      width: 100%;
      max-width: 720px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      animation: modalIn 0.15s ease-out;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-head {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .modal-close {
      background: none;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
      display: grid;
      place-items: center;
      transition: color 0.15s;
    }
    .modal-close:hover { color: #fff; }
    
    .modal-body {
      padding: 20px;
    }
    .req-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .req-input {
      flex: 1;
      height: 38px;
      background: #090d16;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0 12px;
      color: #fff;
      font-family: var(--font-mono);
      font-size: 13px;
      outline: none;
    }
    .req-input:focus { border-color: var(--border-focus); }
    
    .resp-box {
      background: #090d16;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      max-height: 360px;
      overflow-y: auto;
    }
    .resp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 11px;
      color: var(--text-dim);
      font-family: var(--font-mono);
    }
    .resp-code {
      font-family: var(--font-mono);
      font-size: 12px;
      color: #38bdf8;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    /* Toast */
    .toast-pill {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      z-index: 200;
      display: none;
    }
    
    @media (max-width: 1100px) {
      .metrics-grid { grid-template-columns: repeat(3, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 700px) {
      .metrics-grid { grid-template-columns: 1fr 1fr; }
      .topbar { padding: 0 16px; }
      .dashboard-container { padding: 20px 16px; }
    }
  </style>
</head>
<body>

  <!-- Top Header Navigation -->
  <header class="topbar">
    <div class="topbar-brand">
      <div class="brand-mark">RP</div>
      <div>
        <div class="brand-title">Rutas del Perú Core</div>
        <div class="brand-sub">ENGINE API & SYSTEM CONSOLE</div>
      </div>
    </div>

    <div class="topbar-status">
      <div class="status-badge">
        <span class="pulse-dot"></span>
        <span>SISTEMA OPERATIVO</span>
      </div>
      <button class="btn btn-secondary" onclick="cleanLocks()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        Liberar Bloqueos
      </button>
    </div>
  </header>

  <main class="dashboard-container">
    <!-- Hero Header -->
    <section class="page-header">
      <div>
        <h1 class="page-title">Centro de Control de Servidor & APIs</h1>
        <p class="page-desc">Monitoreo de estado de SQLite, concurrencia de reservas y ejecución interactiva de endpoints.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick="testEndpoint('/api/health')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          Health Check
        </button>
        <button class="btn btn-secondary" onclick="location.reload()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          Actualizar
        </button>
      </div>
    </section>

    <!-- Metrics Cards Grid -->
    <section class="metrics-grid">
      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">Recaudación</span>
          <span class="metric-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </span>
        </div>
        <div class="metric-value">S/ {{ stats.finanzas.ingresos_totales }}</div>
        <div class="metric-sub">Ventas confirmadas</div>
      </div>

      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">Boletos</span>
          <span class="metric-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          </span>
        </div>
        <div class="metric-value">{{ stats.finanzas.boletos_pagados }}</div>
        <div class="metric-sub">{{ stats.finanzas.boletos_bloqueados }} en proceso</div>
      </div>

      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">Flota Activa</span>
          <span class="metric-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="7" cy="18" r="1.5"></circle><circle cx="17" cy="18" r="1.5"></circle></svg>
          </span>
        </div>
        <div class="metric-value">{{ stats.operacion.buses_activos }} / {{ stats.operacion.total_buses }}</div>
        <div class="metric-sub">{{ stats.operacion.capacidad_flota }} asientos totales</div>
      </div>

      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">Salidas</span>
          <span class="metric-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </span>
        </div>
        <div class="metric-value">{{ stats.operacion.viajes_proximos }}</div>
        <div class="metric-sub">{{ stats.operacion.viajes_hoy }} viajes hoy</div>
      </div>

      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">Cuentas</span>
          <span class="metric-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          </span>
        </div>
        <div class="metric-value">{{ stats.usuarios.total }}</div>
        <div class="metric-sub">Usuarios en el sistema</div>
      </div>

      <div class="metric-card">
        <div class="metric-top">
          <span class="metric-label">Base SQLite</span>
          <span class="metric-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
          </span>
        </div>
        <div class="metric-value">{{ stats.db_size_kb }} KB</div>
        <div class="metric-sub">Modo {{ stats.journal_mode }} · v{{ stats.sqlite_version }}</div>
      </div>
    </section>

    <!-- Main Content Grid -->
    <div class="content-grid">
      <!-- Left Column: API Directory -->
      <div>
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              Directorio de Endpoints de la API
            </div>
            <span class="panel-badge">REST JSON</span>
          </div>

          <!-- Endpoint list items -->
          <div class="endpoint-row">
            <div class="endpoint-meta">
              <span class="method-tag method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/health</div>
                <div class="endpoint-desc">Verificación de salud del sistema, estado de base de datos y métricas</div>
              </div>
            </div>
            <div class="endpoint-actions">
              <button class="btn-test" onclick="testEndpoint('/api/health')">Probar</button>
            </div>
          </div>

          <div class="endpoint-row">
            <div class="endpoint-meta">
              <span class="method-tag method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/ciudades</div>
                <div class="endpoint-desc">Lista de ciudades con terminales activos para origen y destino</div>
              </div>
            </div>
            <div class="endpoint-actions">
              <button class="btn-test" onclick="testEndpoint('/api/ciudades')">Probar</button>
            </div>
          </div>

          <div class="endpoint-row">
            <div class="endpoint-meta">
              <span class="method-tag method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/viajes</div>
                <div class="endpoint-desc">Salidas programadas vigentes con conteo de asientos libres y tarifas</div>
              </div>
            </div>
            <div class="endpoint-actions">
              <button class="btn-test" onclick="testEndpoint('/api/viajes')">Probar</button>
            </div>
          </div>

          <div class="endpoint-row">
            <div class="endpoint-meta">
              <span class="method-tag method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/reportes/ventas</div>
                <div class="endpoint-desc">Resumen consolidado de ventas, totales en soles y distribución de canales</div>
              </div>
            </div>
            <div class="endpoint-actions">
              <button class="btn-test" onclick="testEndpoint('/api/reportes/ventas')">Probar</button>
            </div>
          </div>

          <div class="endpoint-row">
            <div class="endpoint-meta">
              <span class="method-tag method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/reportes/ocupacion</div>
                <div class="endpoint-desc">Tasa de ocupación porcentual de la flota por viaje programado</div>
              </div>
            </div>
            <div class="endpoint-actions">
              <button class="btn-test" onclick="testEndpoint('/api/reportes/ocupacion')">Probar</button>
            </div>
          </div>

          <div class="endpoint-row">
            <div class="endpoint-meta">
              <span class="method-tag method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/admin/buses</div>
                <div class="endpoint-desc">Listado administrativo de unidades de transporte y estados</div>
              </div>
            </div>
            <div class="endpoint-actions">
              <button class="btn-test" onclick="testEndpoint('/api/admin/buses')">Probar</button>
            </div>
          </div>

          <div class="endpoint-row">
            <div class="endpoint-meta">
              <span class="method-tag method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/admin/terminales</div>
                <div class="endpoint-desc">Terminales terrestres y agencias a nivel nacional</div>
              </div>
            </div>
            <div class="endpoint-actions">
              <button class="btn-test" onclick="testEndpoint('/api/admin/terminales')">Probar</button>
            </div>
          </div>

          <div class="endpoint-row">
            <div class="endpoint-meta">
              <span class="method-tag method-get">GET</span>
              <div>
                <div class="endpoint-path">/api/admin/rutas</div>
                <div class="endpoint-desc">Rutas interprovinciales con distancias kilométricas y duración estimada</div>
              </div>
            </div>
            <div class="endpoint-actions">
              <button class="btn-test" onclick="testEndpoint('/api/admin/rutas')">Probar</button>
            </div>
          </div>

          <div class="endpoint-row">
            <div class="endpoint-meta">
              <span class="method-tag method-post">POST</span>
              <div>
                <div class="endpoint-path">/api/admin/clean-locks</div>
                <div class="endpoint-desc">Limpieza atómica de bloqueos temporales de asientos vencidos (>10 min)</div>
              </div>
            </div>
            <div class="endpoint-actions">
              <button class="btn-test" onclick="cleanLocks()">Ejecutar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: SQLite & Demo Credentials -->
      <div>
        <!-- SQLite Tables -->
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
              Estructura de Datos SQLite
            </div>
            <span class="panel-badge">WAL Mode</span>
          </div>

          <table class="db-table">
            <thead>
              <tr>
                <th>Tabla</th>
                <th style="text-align: right;">Registros</th>
                <th style="text-align: right;">Estado</th>
              </tr>
            </thead>
            <tbody>
              {% for t in stats.tablas %}
              <tr>
                <td class="table-name">{{ t.name }}</td>
                <td style="text-align: right; font-family: var(--font-mono); font-weight:600; color:#fff;">{{ t.count }}</td>
                <td style="text-align: right; color: var(--emerald); font-size: 11px; font-weight: 600;">ACTIVA</td>
              </tr>
              {% endfor %}
            </tbody>
          </table>
        </div>

        <!-- Credentials -->
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Cuentas de Acceso para Pruebas
            </div>
            <span class="panel-badge">Roles</span>
          </div>

          <div class="cred-item">
            <div>
              <div class="cred-role">Administrador</div>
              <small style="color:var(--text-dim); font-size:11px;">Control total</small>
            </div>
            <span class="cred-val">admin@rutas.pe / admin123</span>
          </div>

          <div class="cred-item">
            <div>
              <div class="cred-role">Taquillero</div>
              <small style="color:var(--text-dim); font-size:11px;">Venta presencial POS</small>
            </div>
            <span class="cred-val">taquilla@rutas.pe / taquilla123</span>
          </div>

          <div class="cred-item">
            <div>
              <div class="cred-role">Conductor</div>
              <small style="color:var(--text-dim); font-size:11px;">Hoja de ruta y manifiesto</small>
            </div>
            <span class="cred-val">Angelh3@gmail.com / chofer123</span>
          </div>

          <div class="cred-item">
            <div>
              <div class="cred-role">Pasajero</div>
              <small style="color:var(--text-dim); font-size:11px;">Historial y boletos</small>
            </div>
            <span class="cred-val">luis77@gmail.com / cliente123</span>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Interactive Modal Tester -->
  <div class="modal-overlay" id="modalOverlay" onclick="closeModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-head">
        <div class="modal-title-group">
          <span class="method-tag method-get" id="modalMethod">GET</span>
          <span id="modalPath" style="font-family:var(--font-mono); font-size:13px; font-weight:600;">/api/health</span>
        </div>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>

      <div class="modal-body">
        <div class="req-bar">
          <input type="text" class="req-input" id="modalUrl" readonly>
          <button class="btn btn-primary" onclick="reExecuteModal()">Re-enviar</button>
        </div>

        <div class="resp-box">
          <div class="resp-header">
            <span id="respStatus">Estado: 200 OK</span>
            <span id="respLatency">Latencia: -- ms</span>
          </div>
          <pre class="resp-code" id="modalCode">Consultando...</pre>
        </div>
      </div>
    </div>
  </div>

  <div class="toast-pill" id="toastPill">Acción completada con éxito.</div>

  <script>
    let currentEndpoint = '';

    async function testEndpoint(url) {
      currentEndpoint = url;
      const overlay = document.getElementById('modalOverlay');
      const modalPath = document.getElementById('modalPath');
      const modalUrl = document.getElementById('modalUrl');
      const modalCode = document.getElementById('modalCode');
      const respStatus = document.getElementById('respStatus');
      const respLatency = document.getElementById('respLatency');
      
      modalPath.innerText = url;
      modalUrl.value = window.location.origin + url;
      modalCode.innerText = 'Ejecutando petición...';
      respStatus.innerText = 'Consultando...';
      respLatency.innerText = '';
      overlay.style.display = 'grid';

      const t0 = performance.now();
      try {
        const res = await fetch(url);
        const t1 = performance.now();
        const latency = Math.round(t1 - t0);
        
        respStatus.innerText = 'HTTP ' + res.status + ' ' + (res.ok ? 'OK' : 'ERROR');
        respStatus.style.color = res.ok ? '#10b981' : '#f87171';
        respLatency.innerText = latency + ' ms';
        
        const data = await res.json();
        modalCode.innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        respStatus.innerText = 'Error de Conexión';
        respStatus.style.color = '#f87171';
        modalCode.innerText = 'Error al ejecutar solicitud:\\n' + err.message;
      }
    }

    function reExecuteModal() {
      if (currentEndpoint) {
        testEndpoint(currentEndpoint);
      }
    }

    function closeModal(e) {
      document.getElementById('modalOverlay').style.display = 'none';
    }

    async function cleanLocks() {
      try {
        const res = await fetch('/api/admin/clean-locks', { method: 'POST' });
        const data = await res.json();
        showToast(data.mensaje || 'Bloqueos liberados con éxito.');
      } catch (e) {
        showToast('Error al ejecutar limpieza de bloqueos.');
      }
    }

    function showToast(msg) {
      const p = document.getElementById('toastPill');
      p.innerText = msg;
      p.style.display = 'block';
      setTimeout(() => { p.style.display = 'none'; }, 3000);
    }
  </script>
</body>
</html>
"""

def render_backend_dashboard(db_path, db_conn):
    stats = get_system_stats(db_path, db_conn)
    return render_template_string(DASHBOARD_HTML, stats=stats)
