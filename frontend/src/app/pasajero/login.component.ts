import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../api.service';
import { ToastService } from '../toast.service';

type AccessMode = 'login' | 'registro';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <!-- Showcase Lateral -->
        <aside class="auth-showcase">
          <div class="showcase-content">
            <a class="auth-brand" routerLink="/">
              <span class="auth-brand-mark">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4-.2-.8-.6-.9L2 12"></path><path d="M9 18h6"></path><circle cx="6" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle>
                </svg>
              </span>
              <div>
                <strong>Rutas del Perú</strong>
                <small>TRANSPORTE INTERPROVINCIAL</small>
              </div>
            </a>

            <div class="showcase-hero">
              <span class="badge-pill">SISTEMA INTEGRAL DE VIAJES</span>
              <h1>Tu destino comienza <em>aquí.</em></h1>
              <p>Gestiona tus boletos, monitorea rutas en tiempo real o administra la flota completa desde un solo lugar.</p>
            </div>

            <!-- Features list -->
            <div class="showcase-features">
              <div class="feat-item">
                <span class="feat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </span>
                <div>
                  <strong>Emisión Instantánea</strong>
                  <small>Boletos electrónicos con código QR y validación digital</small>
                </div>
              </div>
              <div class="feat-item">
                <span class="feat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </span>
                <div>
                  <strong>Seguridad Garantizada</strong>
                  <small>Bloqueo de asientos atómico y autenticación por roles</small>
                </div>
              </div>
              <div class="feat-item">
                <span class="feat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                    <line x1="8" y1="2" x2="8" y2="18"></line>
                    <line x1="16" y1="6" x2="16" y2="22"></line>
                  </svg>
                </span>
                <div>
                  <strong>Cobertura Nacional</strong>
                  <small>Rutas conectadas entre Lima, Cusco, Huancayo y Ayacucho</small>
                </div>
              </div>
            </div>

            <div class="showcase-footer">
              <span class="status-dot"></span>
              <span>Plataforma certificada • Conexión cifrada TLS 1.3</span>
            </div>
          </div>
        </aside>

        <!-- Form Panel -->
        <main class="auth-main">
          <div class="auth-header-nav">
            <a class="back-link" routerLink="/">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Volver a buscar viajes
            </a>
          </div>

          <div class="auth-box">
            <!-- Selector Tabs -->
            <div class="auth-tabs" role="tablist">
              <button type="button" [class.active]="modo === 'login'" (click)="cambiarModo('login')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                Iniciar sesión
              </button>
              <button type="button" [class.active]="modo === 'registro'" (click)="cambiarModo('registro')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                Crear cuenta
              </button>
            </div>

            @if (modo === 'login') {
              <div class="tab-content">
                <div class="heading-area">
                  <h2>¡Bienvenido de nuevo!</h2>
                  <p>Accede con tus credenciales según tu perfil.</p>
                </div>

                <!-- Quick Demo Buttons -->
                <div class="quick-demo-box">
                  <div class="quick-demo-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    ACCESO RÁPIDO PARA DEMOSTRACIÓN:
                  </div>
                  <div class="demo-buttons-grid">
                    <button type="button" class="btn-demo demo-admin" (click)="cargarDemo('admin')">
                      <span class="role-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                      </span>
                      <span class="role-name">Admin</span>
                    </button>
                    <button type="button" class="btn-demo demo-taquilla" (click)="cargarDemo('taquilla')">
                      <span class="role-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                      </span>
                      <span class="role-name">Taquilla</span>
                    </button>
                    <button type="button" class="btn-demo demo-chofer" (click)="cargarDemo('chofer')">
                      <span class="role-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 16h10"></path><circle cx="7" cy="18" r="1.5"></circle><circle cx="17" cy="18" r="1.5"></circle></svg>
                      </span>
                      <span class="role-name">Chofer</span>
                    </button>
                    <button type="button" class="btn-demo demo-cliente" (click)="cargarDemo('cliente')">
                      <span class="role-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </span>
                      <span class="role-name">Pasajero</span>
                    </button>
                  </div>
                </div>

                <form (ngSubmit)="entrar()" #loginForm="ngForm" class="form-grid">
                  <div class="field-group">
                    <label for="login-correo">Correo electrónico</label>
                    <div class="input-with-icon">
                      <span class="field-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      </span>
                      <input id="login-correo" name="correo" type="email" [(ngModel)]="correo" placeholder="ejemplo@rutas.pe" required email autocomplete="username">
                    </div>
                  </div>

                  <div class="field-group">
                    <div class="field-header">
                      <label for="login-password">Contraseña</label>
                      <button type="button" class="link-btn" (click)="ayudaPassword()">¿Olvidaste tu contraseña?</button>
                    </div>
                    <div class="input-with-icon">
                      <span class="field-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </span>
                      <input id="login-password" name="password" [type]="verPassword ? 'text' : 'password'" [(ngModel)]="password" placeholder="••••••••" required autocomplete="current-password">
                      <button type="button" class="toggle-eye" (click)="verPassword = !verPassword" [title]="verPassword ? 'Ocultar' : 'Mostrar'">
                        {{ verPassword ? 'Ocultar' : 'Ver' }}
                      </button>
                    </div>
                  </div>

                  <button class="btn-submit" type="submit" [disabled]="ingresando">
                    @if (ingresando) {
                      <span class="spinner"></span>
                      <span>Verificando credenciales...</span>
                    } @else {
                      <span>Ingresar al Sistema</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    }
                  </button>
                </form>

                <div class="auth-footer-prompt">
                  ¿Aún no tienes cuenta?
                  <button type="button" class="link-highlight" (click)="cambiarModo('registro')">Regístrate gratis</button>
                </div>
              </div>
            } @else {
              <div class="tab-content">
                <div class="heading-area">
                  <h2>Crea tu cuenta</h2>
                  <p>Regístrate como pasajero para consultar y gestionar tus compras.</p>
                </div>

                <form (ngSubmit)="registrar()" #registroForm="ngForm" class="form-grid">
                  <div class="row-2">
                    <div class="field-group">
                      <label for="reg-nombres">Nombres</label>
                      <input id="reg-nombres" name="nombres" [(ngModel)]="r.nombres" placeholder="Ej. Juan" required>
                    </div>
                    <div class="field-group">
                      <label for="reg-apellidos">Apellidos</label>
                      <input id="reg-apellidos" name="apellidos" [(ngModel)]="r.apellidos" placeholder="Ej. Pérez" required>
                    </div>
                  </div>

                  <div class="row-2">
                    <div class="field-group">
                      <label for="reg-dni">DNI / Documento</label>
                      <input id="reg-dni" name="dni" [(ngModel)]="r.dni" placeholder="8 dígitos" maxlength="8" pattern="[0-9]{8}" required>
                    </div>
                    <div class="field-group">
                      <label for="reg-tel">Teléfono</label>
                      <input id="reg-tel" name="telefono" type="tel" [(ngModel)]="r.telefono" placeholder="987654321">
                    </div>
                  </div>

                  <div class="field-group">
                    <label for="reg-correo">Correo electrónico</label>
                    <div class="input-with-icon">
                      <span class="field-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      </span>
                      <input id="reg-correo" name="correo" type="email" [(ngModel)]="r.correo" placeholder="nombre@correo.com" required email autocomplete="email">
                    </div>
                  </div>

                  <div class="field-group">
                    <label for="reg-pass">Contraseña</label>
                    <div class="input-with-icon">
                      <span class="field-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </span>
                      <input id="reg-pass" name="password" [type]="verPassword ? 'text' : 'password'" [(ngModel)]="r.password" placeholder="Mínimo 6 caracteres" minlength="6" required autocomplete="new-password">
                      <button type="button" class="toggle-eye" (click)="verPassword = !verPassword">
                        {{ verPassword ? 'Ocultar' : 'Ver' }}
                      </button>
                    </div>
                  </div>

                  <button class="btn-submit" type="submit" [disabled]="registrando">
                    @if (registrando) {
                      <span class="spinner"></span>
                      <span>Registrando cuenta...</span>
                    } @else {
                      <span>Crear mi Cuenta de Pasajero</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    }
                  </button>
                </form>

                <div class="auth-footer-prompt">
                  ¿Ya tienes una cuenta?
                  <button type="button" class="link-highlight" (click)="cambiarModo('login')">Inicia sesión</button>
                </div>
              </div>
            }

            <div class="auth-trust-badge">
              <span class="lock-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </span>
              <span>Tus datos personales están protegidos por la Ley N° 29733 de Protección de Datos Personales.</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --primary: #059669;
      --primary-dark: #064e3b;
      --primary-hover: #10b981;
      --primary-light: #ecfdf5;
      --gold: #f59e0b;
      --gold-dark: #d97706;
      --border-color: #cbd5e1;
      --bg-card: #ffffff;
      --bg-hover: #f1f5f9;
      --text-color: #0f172a;
      --text-muted: #64748b;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-2xl: 20px;
    }
    .auth-wrapper {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px 16px;
    }
    .auth-card {
      width: 100%;
      max-width: 1060px;
      display: grid;
      grid-template-columns: 460px 1fr;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-2xl);
      box-shadow: 0 25px 60px -15px rgba(0,0,0,0.12);
      overflow: hidden;
      min-height: 640px;
    }

    /* Showcase Lateral */
    .auth-showcase {
      background: linear-gradient(145deg, #0f231c 0%, #174233 60%, #205c45 100%);
      color: #fff;
      padding: 44px 38px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }
    .auth-showcase::after {
      content: '';
      position: absolute;
      top: -30%;
      right: -30%;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(235, 179, 56, 0.22) 0%, transparent 70%);
      pointer-events: none;
    }

    .showcase-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
      gap: 32px;
    }

    .auth-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      text-decoration: none;
    }
    .auth-brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--gold), #d99b1c);
      color: #174233;
      display: grid;
      place-items: center;
      box-shadow: 0 8px 18px rgba(235,179,56,0.3);
    }
    .auth-brand strong {
      display: block;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .auth-brand small {
      display: block;
      font-size: 9px;
      letter-spacing: 0.14em;
      color: #a4cdbb;
      font-weight: 700;
    }

    .showcase-hero {
      margin-top: 10px;
    }
    .badge-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(235, 179, 56, 0.2);
      color: #ffd874;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
      border: 1px solid rgba(235, 179, 56, 0.35);
    }
    .showcase-hero h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 34px;
      line-height: 1.15;
      font-weight: 800;
      margin: 0 0 14px;
      letter-spacing: -0.02em;
    }
    .showcase-hero h1 em {
      color: #f7ca5d;
      font-style: normal;
    }
    .showcase-hero p {
      font-size: 13.5px;
      line-height: 1.6;
      color: #c9ded5;
      margin: 0;
    }

    .showcase-features {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .feat-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .feat-icon {
      font-size: 18px;
      line-height: 1;
      padding-top: 2px;
    }
    .feat-item strong {
      display: block;
      font-size: 13px;
      color: #fff;
      font-weight: 700;
    }
    .feat-item small {
      display: block;
      font-size: 11.5px;
      color: #a0c2b3;
      line-height: 1.35;
    }

    .showcase-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #8fb8a5;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    /* Main Form Panel */
    .auth-main {
      padding: 38px 46px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .auth-header-nav {
      margin-bottom: 20px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 12.5px;
      font-weight: 600;
      transition: color 0.15s;
    }
    .back-link:hover {
      color: var(--primary);
    }

    .auth-box {
      max-width: 440px;
      margin: 0 auto;
      width: 100%;
    }

    .auth-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 5px;
      background: var(--bg-hover);
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
    }
    .auth-tabs button {
      border: 0;
      background: transparent;
      padding: 9px 12px;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.18s;
    }
    .auth-tabs button.active {
      background: var(--bg-card);
      color: var(--primary);
      box-shadow: 0 3px 10px rgba(0,0,0,0.06);
    }

    .heading-area {
      margin-bottom: 20px;
    }
    .heading-area h2 {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-color);
      margin: 0 0 6px;
      letter-spacing: -0.02em;
    }
    .heading-area p {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    /* Demo Box */
    .quick-demo-box {
      background: #f8faf8;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);
      padding: 12px 14px;
      margin-bottom: 20px;
    }
    .quick-demo-title {
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 8px;
    }
    .demo-buttons-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .btn-demo {
      border: 1px solid var(--border-color);
      background: #fff;
      border-radius: 8px;
      padding: 6px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-demo:hover {
      border-color: var(--primary);
      background: var(--primary-light);
      transform: translateY(-1px);
    }
    .role-icon { font-size: 15px; }
    .role-name { font-size: 10.5px; font-weight: 700; color: var(--text-color); }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field-group label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-color);
    }
    .field-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .link-btn {
      background: none;
      border: 0;
      padding: 0;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--primary);
      cursor: pointer;
    }
    .link-btn:hover { text-decoration: underline; }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }
    .field-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted);
      font-size: 14px;
      pointer-events: none;
    }
    .input-with-icon input, .field-group input {
      width: 100%;
      height: 42px;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0 12px;
      font-size: 13.5px;
      background: #fff;
      color: var(--text-color);
      transition: all 0.15s;
      outline: none;
    }
    .input-with-icon input {
      padding-left: 36px;
      padding-right: 36px;
    }
    .input-with-icon input:focus, .field-group input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(27,77,58,0.12);
    }
    .toggle-eye {
      position: absolute;
      right: 10px;
      border: 0;
      background: none;
      cursor: pointer;
      font-size: 14px;
      padding: 4px;
    }

    .btn-submit {
      margin-top: 12px;
      height: 48px;
      border: 0;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%);
      color: #ffffff !important;
      font-size: 14.5px;
      font-weight: 800;
      letter-spacing: 0.02em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 10px 24px -2px rgba(5, 150, 105, 0.42), 0 4px 10px rgba(0, 0, 0, 0.08);
      position: relative;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px -2px rgba(16, 185, 129, 0.52);
      background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
    }
    .btn-submit:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 6px 14px rgba(5, 150, 105, 0.35);
    }
    .btn-submit:disabled {
      background: linear-gradient(135deg, #047857, #064e3b) !important;
      color: #ffffff !important;
      opacity: 0.8;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: 0 4px 12px rgba(6, 78, 59, 0.25) !important;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .auth-footer-prompt {
      text-align: center;
      margin-top: 18px;
      font-size: 12.5px;
      color: var(--text-muted);
    }
    .link-highlight {
      background: none;
      border: 0;
      padding: 0;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--primary);
      cursor: pointer;
      margin-left: 4px;
    }
    .link-highlight:hover { text-decoration: underline; }

    .auth-trust-badge {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 22px;
      padding-top: 14px;
      border-top: 1px solid var(--border-color);
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .lock-icon { font-size: 12px; }

    @media (max-width: 900px) {
      .auth-card {
        grid-template-columns: 1fr;
        max-width: 500px;
      }
      .auth-showcase {
        display: none;
      }
      .auth-main {
        padding: 30px 24px;
      }
    }
  `]
})
export class LoginComponent {
  modo: AccessMode = 'login';
  correo = '';
  password = '';
  verPassword = false;
  r: any = { dni: '', nombres: '', apellidos: '', correo: '', telefono: '', password: '' };
  ingresando = false;
  registrando = false;

  constructor(
    private api: Api,
    private router: Router,
    private toast: ToastService
  ) {}

  cambiarModo(modo: AccessMode): void {
    this.modo = modo;
    this.verPassword = false;
  }

  cargarDemo(tipo: 'admin' | 'taquilla' | 'chofer' | 'cliente'): void {
    this.modo = 'login';
    if (tipo === 'admin') {
      this.correo = 'admin@rutas.pe';
      this.password = 'admin123';
      this.toast.info('Credenciales de Administrador cargadas.', 'Modo Demo');
    } else if (tipo === 'taquilla') {
      this.correo = 'taquilla@rutas.pe';
      this.password = 'taquilla123';
      this.toast.info('Credenciales de Taquilla cargadas.', 'Modo Demo');
    } else if (tipo === 'chofer') {
      this.correo = 'Angelh3@gmail.com';
      this.password = 'chofer123';
      this.toast.info('Credenciales de Conductor cargadas.', 'Modo Demo');
    } else if (tipo === 'cliente') {
      this.correo = 'luis77@gmail.com';
      this.password = 'cliente123';
      this.toast.info('Credenciales de Pasajero cargadas.', 'Modo Demo');
    }
  }

  destino(usuario: any): string {
    const destinos: Record<string, string> = {
      ADMIN: '/admin',
      TAQUILLERO: '/taquilla',
      CHOFER: '/chofer',
      CLIENTE: '/'
    };
    return destinos[usuario.rol] || '/';
  }

  ayudaPassword(): void {
    this.toast.info('Para restablecer tu contraseña, envía un correo a soporte@rutas.pe o comunícate con la administración.', 'Recuperación de Contraseña');
  }

  entrar(): void {
    if (this.ingresando) return;
    if (!this.correo?.trim() || !this.password) {
      this.toast.error('Por favor, ingresa tu correo electrónico y contraseña.', 'Campos Requeridos');
      return;
    }
    this.ingresando = true;
    this.api.login(this.correo.trim(), this.password).subscribe({
      next: usuario => {
        this.ingresando = false;
        this.toast.success(`¡Bienvenido de vuelta, ${usuario.nombres}!`, 'Sesión Iniciada');
        this.router.navigateByUrl(this.destino(usuario));
      },
      error: (err) => {
        this.ingresando = false;
        const msg = err?.error?.error || 'Credenciales no válidas. Por favor verifica tus datos.';
        this.toast.error(msg, 'Error de Autenticación');
      }
    });
  }

  registrar(): void {
    if (this.registrando) return;
    if (!this.r.nombres?.trim() || !this.r.apellidos?.trim() || !this.r.dni?.trim() || !this.r.correo?.trim() || !this.r.password) {
      this.toast.error('Por favor, completa todos los campos requeridos para continuar.', 'Formulario Incompleto');
      return;
    }
    if (this.r.dni.trim().length !== 8) {
      this.toast.error('El DNI debe contener exactamente 8 dígitos numéricos.', 'DNI Inválido');
      return;
    }
    this.registrando = true;
    const datos = {
      ...this.r,
      dni: this.r.dni.trim(),
      nombres: this.r.nombres.trim(),
      apellidos: this.r.apellidos.trim(),
      correo: this.r.correo.trim()
    };
    this.api.registro(datos).subscribe({
      next: () => {
        this.registrando = false;
        this.toast.success('Tu cuenta fue creada con éxito. ¡Bienvenido a Rutas del Perú!', 'Cuenta Creada');
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.registrando = false;
        const msg = err?.error?.error || 'No se pudo completar el registro.';
        this.toast.error(msg, 'Error al Registrar');
      }
    });
  }
}

