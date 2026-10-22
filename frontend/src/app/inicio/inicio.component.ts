import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../api.service';

interface DestinoPopular {
  origen: string;
  destino: string;
  precioDesde: number;
  duracionAprox: string;
  frecuencia: string;
  categoria: string;
  descripcion: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="landing-container">
      <!-- 1. Hero Section con Buscador Rápido -->
      <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-inner">
          <div class="hero-badge">
            <span class="badge-pulse"></span>
            <span>TRANSPORTE INTERPROVINCIAL CERTIFICADO MTC · SUTRAN</span>
          </div>

          <h1 class="hero-main-title">
            Conectamos el Perú con<br>
            <span class="gradient-text">seguridad, confort y puntualidad.</span>
          </h1>

          <p class="hero-subtitle">
            Reserva tus pasajes en línea en segundos, escoge tu asiento exacto en tiempo real y viaja en la flota de buses más moderna del país.
          </p>

          <!-- Tarjeta de Búsqueda Rápida Directa -->
          <div class="fast-search-card">
            <div class="card-kicker-row">
              <span class="kicker-label">BUSCADOR DIRECTO DE RUTAS</span>
              <span class="kicker-tag">Salidas Diarias Garantizadas</span>
            </div>

            <form (ngSubmit)="buscarPasajes()" class="fast-search-grid">
              <!-- Origen -->
              <div class="search-field">
                <label for="fast-origen">CIUDAD DE ORIGEN</label>
                <div class="field-control">
                  <span class="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </span>
                  <select id="fast-origen" [(ngModel)]="origen" name="origen">
                    <option value="">Selecciona origen...</option>
                    @for (c of ciudades; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Destino -->
              <div class="search-field">
                <label for="fast-destino">CIUDAD DE DESTINO</label>
                <div class="field-control">
                  <span class="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="12 8 8 12 12 16 12 8"></polygon>
                    </svg>
                  </span>
                  <select id="fast-destino" [(ngModel)]="destino" name="destino">
                    <option value="">Selecciona destino...</option>
                    @for (c of ciudades; track c) {
                      <option [value]="c" [disabled]="c === origen">{{ c }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Fecha -->
              <div class="search-field">
                <label for="fast-fecha">FECHA DE SALIDA</label>
                <div class="field-control">
                  <span class="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </span>
                  <input id="fast-fecha" type="date" [(ngModel)]="fecha" [min]="fechaMinima" name="fecha">
                </div>
              </div>

              <!-- Botón Submit -->
              <div class="search-action">
                <button type="submit" class="btn-fast-search">
                  <span>Buscar Pasajes</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </form>
          </div>

          <!-- Métricas de Confianza -->
          <div class="stats-row">
            <div class="stat-pill">
              <b>+50,000</b>
              <span>Pasajeros trasladados</span>
            </div>
            <div class="stat-separator"></div>
            <div class="stat-pill">
              <b>99.8%</b>
              <span>Índice de puntualidad</span>
            </div>
            <div class="stat-separator"></div>
            <div class="stat-pill">
              <b>24/7</b>
              <span>Monitoreo GPS SUTRAN</span>
            </div>
            <div class="stat-separator"></div>
            <div class="stat-pill">
              <b>100%</b>
              <span>Emisión electrónica oficial</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Sección Destinos Populares -->
      <section class="destinations-section">
        <div class="section-heading">
          <span class="sub-badge">RUTAS FRECUENTES</span>
          <h2>Destinos Más Populares</h2>
          <p>Conexiones directas todos los días con salidas programadas en horarios diurnos y nocturnos.</p>
        </div>

        <div class="destinations-grid">
          @for (d of destinosPopulares; track d.origen + d.destino) {
            <div class="destination-card">
              <div class="dest-card-header">
                <span class="dest-category">{{ d.categoria }}</span>
                <span class="dest-frequency">{{ d.frecuencia }}</span>
              </div>
              
              <div class="dest-route">
                <h3>{{ d.origen }}</h3>
                <span class="route-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
                <h3>{{ d.destino }}</h3>
              </div>

              <p class="dest-desc">{{ d.descripcion }}</p>

              <div class="dest-info-row">
                <div class="info-item">
                  <span class="info-label">Duración Aprox.</span>
                  <b>{{ d.duracionAprox }}</b>
                </div>
                <div class="info-item">
                  <span class="info-label">Tarifa desde</span>
                  <b class="price-val">S/ {{ d.precioDesde }}.00</b>
                </div>
              </div>

              <button type="button" class="btn-book-route" (click)="irARuta(d.origen, d.destino)">
                <span>Reservar Pasaje</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          }
        </div>
      </section>

      <!-- 3. Experiencia a Bordo & Servicios de Calidad -->
      <section class="services-section">
        <div class="section-heading">
          <span class="sub-badge">CONFORT Y TECNOLOGÍA</span>
          <h2>Nuestros Servicios de Primera Clase a Bordo</h2>
          <p>Equipamiento diseñado para garantizar tu descanso en cada kilómetro del trayecto.</p>
        </div>

        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7z"></path>
                <path d="M5 18v2h14v-2"></path>
              </svg>
            </div>
            <h4>Asientos Ergonómicos Reclinables</h4>
            <p>Configuraciones de 160° Sofá-Cama y 140° Semi-Cama con soporte lumbar y descansapiés acolchado.</p>
          </div>

          <div class="service-card">
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </div>
            <h4>WiFi Satelital y Conexión USB</h4>
            <p>Acceso a internet a bordo y puertos USB independientes en cada butaca para mantener tus dispositivos con carga.</p>
          </div>

          <div class="service-card">
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <h4>Boleto Digital QR Inmediato</h4>
            <p>Emisión electrónica al instante sin necesidad de imprimir. Valida tu acceso directamente desde tu celular.</p>
          </div>

          <div class="service-card">
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h4>Monitoreo SUTRAN en Tiempo Real</h4>
            <p>Control de velocidad por satélite las 24 horas y relevo de choferes profesionales cada 4 horas de ruta.</p>
          </div>

          <div class="service-card">
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h4>Climatización Inteligente</h4>
            <p>Aire acondicionado ecológico con renovación continua de aire y filtros antibacteriales en ambos pisos.</p>
          </div>

          <div class="service-card">
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <h4>Custodia Segura de Equipaje</h4>
            <p>Registro con ticket codificado para tu maleta en bodega y seguro de equipaje durante todo el viaje.</p>
          </div>
        </div>
      </section>

      <!-- 4. Pasos para Comprar Tu Boleto -->
      <section class="how-it-works-section">
        <div class="section-heading">
          <span class="sub-badge">PROCESO SENCILLO</span>
          <h2>¿Cómo Reservar Tu Viaje en 3 Pasos?</h2>
          <p>Tu pasaje listo en menos de 2 minutos desde cualquier dispositivo.</p>
        </div>

        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">01</div>
            <h4>Busca tu Itinerario</h4>
            <p>Selecciona tu ciudad de origen, destino y fecha. Compara precios, horarios de salida y categorías de servicio.</p>
          </div>

          <div class="step-card">
            <div class="step-number">02</div>
            <h4>Elige tu Asiento en Vivo</h4>
            <p>Visualiza el croquis interactivo de 1er y 2do piso del bus. Escoge entre ventana, pasillo o filas panorámicas.</p>
          </div>

          <div class="step-card">
            <div class="step-number">03</div>
            <h4>Paga y Recibe tu Boleto</h4>
            <p>Realiza tu pago seguro en línea y obtén tu boleto con código QR para abordar directamente en el terminal.</p>
          </div>
        </div>

        <div class="steps-cta">
          <a routerLink="/pasajes" class="btn-primary-action">
            <span>Ir al Buscador de Pasajes</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      </section>

      <!-- 5. Preguntas Frecuentes -->
      <section class="faq-section">
        <div class="section-heading">
          <span class="sub-badge">DUDAS Y CONSULTAS</span>
          <h2>Preguntas Frecuentes</h2>
          <p>Todo lo que necesitas saber antes de abordar tu viaje interprovincial.</p>
        </div>

        <div class="faq-container">
          <div class="faq-item" [class.open]="faqOpen === 1" (click)="toggleFaq(1)">
            <div class="faq-question">
              <h4>¿Con cuánta anticipación debo presentarme en el terminal terrestre?</h4>
              <span class="faq-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
            @if (faqOpen === 1) {
              <div class="faq-answer">
                <p>Se recomienda presentarse como mínimo <strong>30 minutos antes</strong> de la hora programada de salida para el registro de equipaje en bodega y la verificación de identidad con DNI o carné de extranjería.</p>
              </div>
            }
          </div>

          <div class="faq-item" [class.open]="faqOpen === 2" (click)="toggleFaq(2)">
            <div class="faq-question">
              <h4>¿Cuánto equipaje puedo llevar en el viaje?</h4>
              <span class="faq-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
            @if (faqOpen === 2) {
              <div class="faq-answer">
                <p>Cada boleto incluye hasta <strong>20 kg de equipaje en bodega</strong> sin costo adicional, además de un equipaje de mano ligero (mochila o bolso personal) para llevar contigo en la cabina del bus.</p>
              </div>
            }
          </div>

          <div class="faq-item" [class.open]="faqOpen === 3" (click)="toggleFaq(3)">
            <div class="faq-question">
              <h4>¿Cuáles son los requisitos para viajar con menores de edad?</h4>
              <span class="faq-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
            @if (faqOpen === 3) {
              <div class="faq-answer">
                <p>Los menores de edad deben viajar acompañados por al menos uno de sus padres con DNI vigente. En caso de viajar con un tutor o un tercero, es indispensable presentar un <strong>permiso notarial de viaje</strong> emitido conforme a las directivas del MTC.</p>
              </div>
            }
          </div>

          <div class="faq-item" [class.open]="faqOpen === 4" (click)="toggleFaq(4)">
            <div class="faq-question">
              <h4>¿Puedo cambiar la fecha de mi viaje o transferir mi boleto?</h4>
              <span class="faq-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
            @if (faqOpen === 4) {
              <div class="faq-answer">
                <p>Sí, las postergaciones o transferencias se pueden solicitar hasta <strong>4 horas antes</strong> de la salida del bus dirigiéndote a las agencias oficiales o a través de la sección Mis Boletos en el sistema.</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- 6. Call to Action Final -->
      <section class="final-cta-section">
        <div class="final-cta-card">
          <div class="cta-content">
            <span class="cta-pill">VIAJA HOY MISMO</span>
            <h2>¿Listo para planificar tu próximo viaje?</h2>
            <p>Descubre horarios disponibles, asegura tu asiento preferido y disfruta del mejor servicio interprovincial del Perú.</p>
          </div>
          <div class="cta-action">
            <a routerLink="/pasajes" class="btn-cta-large">
              <span>Buscar Boletos Disponibles</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .landing-container {
      display: flex;
      flex-direction: column;
      gap: 70px;
      padding-bottom: 60px;
    }

    /* 1. Hero Section */
    .hero-section {
      position: relative;
      background: radial-gradient(circle at 80% 20%, rgba(30, 95, 70, 0.45) 0%, transparent 60%),
                  linear-gradient(135deg, #071912 0%, #0d2c20 60%, #164634 100%);
      color: #fff;
      padding: 70px 24px 80px;
      border-radius: 0 0 32px 32px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .hero-inner {
      max-width: 1140px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 2;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #9fe2bf;
      margin-bottom: 20px;
    }

    .badge-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 10px #22c55e;
    }

    .hero-main-title {
      font-size: 44px;
      line-height: 1.18;
      font-weight: 800;
      letter-spacing: -0.8px;
      margin: 0 0 16px;
      max-width: 860px;
    }

    .gradient-text {
      background: linear-gradient(135deg, #a7f3d0 0%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 16.5px;
      line-height: 1.6;
      color: #d1fae5;
      max-width: 680px;
      margin: 0 0 36px;
      opacity: 0.92;
    }

    /* Fast Search Card */
    .fast-search-card {
      width: 100%;
      max-width: 1040px;
      background: #ffffff;
      color: #111827;
      border-radius: 20px;
      padding: 24px 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      margin-bottom: 34px;
      text-align: left;
    }

    .card-kicker-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f1f5f9;
    }

    .kicker-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #1b4d3a;
    }

    .kicker-tag {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .fast-search-grid {
      display: grid;
      grid-template-columns: 1.2fr 1.2fr 1fr 1fr;
      gap: 16px;
      align-items: flex-end;
    }

    .search-field label {
      display: block;
      font-size: 11px;
      font-weight: 800;
      color: #475569;
      margin-bottom: 6px;
      letter-spacing: 0.4px;
    }

    .field-control {
      position: relative;
      display: flex;
      align-items: center;
    }

    .field-icon {
      position: absolute;
      left: 12px;
      color: #64748b;
      display: flex;
      align-items: center;
      pointer-events: none;
    }

    .field-control select,
    .field-control input {
      width: 100%;
      height: 46px;
      padding: 0 12px 0 38px;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
      background: #f8fafc;
      transition: all 0.15s ease;
      outline: none;
    }

    .field-control select:focus,
    .field-control input:focus {
      border-color: #1b4d3a;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(27, 77, 58, 0.12);
    }

    .btn-fast-search {
      width: 100%;
      height: 46px;
      background: linear-gradient(135deg, #1b4d3a, #13392a);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 6px 14px rgba(27, 77, 58, 0.28);
    }

    .btn-fast-search:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(27, 77, 58, 0.38);
      background: linear-gradient(135deg, #235e47, #174231);
    }

    /* Stats Row */
    .stats-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .stat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .stat-pill b {
      font-size: 22px;
      color: #ffffff;
      font-weight: 800;
    }

    .stat-pill span {
      font-size: 12px;
      color: #a7f3d0;
      font-weight: 500;
    }

    .stat-separator {
      width: 1px;
      height: 28px;
      background: rgba(255, 255, 255, 0.18);
    }

    /* 2. Destinos Populares */
    .destinations-section,
    .services-section,
    .how-it-works-section,
    .faq-section {
      max-width: 1140px;
      margin: 0 auto;
      padding: 0 20px;
      width: 100%;
    }

    .section-heading {
      text-align: center;
      margin-bottom: 40px;
    }

    .sub-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      color: #1b4d3a;
      background: #e8f5ed;
      padding: 4px 12px;
      border-radius: 999px;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    }

    .section-heading h2 {
      font-size: 30px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0 0 10px;
    }

    .section-heading p {
      font-size: 15px;
      color: #64748b;
      max-width: 620px;
      margin: 0 auto;
    }

    .destinations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 22px;
    }

    .destination-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      transition: all 0.22s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }

    .destination-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
      border-color: #cbd5e1;
    }

    .dest-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .dest-category {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1b4d3a;
      background: #f0fdf4;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .dest-frequency {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }

    .dest-route {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .dest-route h3 {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .route-arrow {
      color: #1b4d3a;
      display: flex;
      align-items: center;
    }

    .dest-desc {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      margin: 0 0 18px;
      flex-grow: 1;
    }

    .dest-info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 14px;
      margin-bottom: 16px;
      border-top: 1px solid #f1f5f9;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .info-label {
      font-size: 10.5px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .info-item b {
      font-size: 13.5px;
      color: #334155;
    }

    .price-val {
      font-size: 17px !important;
      font-weight: 800 !important;
      color: #1b4d3a !important;
    }

    .btn-book-route {
      width: 100%;
      height: 42px;
      background: #f1f5f9;
      color: #1e293b;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .btn-book-route:hover {
      background: #1b4d3a;
      color: #ffffff;
      border-color: #1b4d3a;
    }

    /* 3. Services Section */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    .service-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 26px;
      transition: all 0.2s ease;
    }

    .service-card:hover {
      border-color: #93c5fd;
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
    }

    .service-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #e8f5ed;
      color: #1b4d3a;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .service-card h4 {
      font-size: 16.5px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px;
    }

    .service-card p {
      font-size: 13.5px;
      line-height: 1.55;
      color: #64748b;
      margin: 0;
    }

    /* 4. How it works */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 34px;
    }

    .step-card {
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: 18px;
      padding: 30px 24px;
      position: relative;
    }

    .step-number {
      font-size: 32px;
      font-weight: 900;
      color: #1b4d3a;
      opacity: 0.35;
      margin-bottom: 14px;
    }

    .step-card h4 {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px;
    }

    .step-card p {
      font-size: 13.5px;
      line-height: 1.55;
      color: #64748b;
      margin: 0;
    }

    .steps-cta {
      display: flex;
      justify-content: center;
    }

    .btn-primary-action {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #1b4d3a;
      color: #ffffff;
      padding: 14px 30px;
      border-radius: 12px;
      font-size: 14.5px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 8px 20px rgba(27, 77, 58, 0.25);
    }

    .btn-primary-action:hover {
      background: #13392a;
      transform: translateY(-2px);
      box-shadow: 0 12px 26px rgba(27, 77, 58, 0.35);
    }

    /* 5. FAQ Section */
    .faq-container {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .faq-item {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 22px;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .faq-item:hover {
      border-color: #cbd5e1;
    }

    .faq-item.open {
      border-color: #1b4d3a;
      background: #fafcfb;
    }

    .faq-question {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
    }

    .faq-question h4 {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .faq-arrow {
      color: #64748b;
      display: flex;
      align-items: center;
      transition: transform 0.2s ease;
    }

    .faq-item.open .faq-arrow {
      transform: rotate(180deg);
      color: #1b4d3a;
    }

    .faq-answer {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }

    .faq-answer p {
      font-size: 13.5px;
      line-height: 1.6;
      color: #475569;
      margin: 0;
    }

    /* 6. Final CTA Card */
    .final-cta-section {
      max-width: 1140px;
      margin: 0 auto;
      padding: 0 20px;
      width: 100%;
    }

    .final-cta-card {
      background: linear-gradient(135deg, #071912 0%, #164634 100%);
      border-radius: 24px;
      padding: 44px 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 30px;
      color: #ffffff;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    }

    .cta-pill {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #a7f3d0;
      margin-bottom: 8px;
    }

    .cta-content h2 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 8px;
    }

    .cta-content p {
      font-size: 14.5px;
      color: #d1fae5;
      margin: 0;
      max-width: 520px;
      line-height: 1.5;
    }

    .btn-cta-large {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      color: #1b4d3a;
      padding: 16px 28px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 800;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s ease;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
    }

    .btn-cta-large:hover {
      background: #f0fdf4;
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
    }

    /* Responsive */
    @media (max-width: 900px) {
      .hero-main-title { font-size: 32px; }
      .fast-search-grid { grid-template-columns: 1fr; }
      .steps-grid { grid-template-columns: 1fr; }
      .final-cta-card { flex-direction: column; text-align: center; padding: 32px 24px; }
      .stat-separator { display: none; }
    }
  `]
})
export class InicioComponent implements OnInit {
  ciudades: string[] = [];
  origen = '';
  destino = '';
  fecha = '';
  fechaMinima = new Date().toISOString().split('T')[0];
  faqOpen = 1;

  destinosPopulares: DestinoPopular[] = [
    {
      origen: 'Lima',
      destino: 'Huancayo',
      precioDesde: 35,
      duracionAprox: '6h 30m',
      frecuencia: '8 salidas diarias',
      categoria: 'Sierra Central',
      descripcion: 'Recorrido panorámico por Ticlio hacia el hermoso Valle del Mantaro. Buses de 2 pisos con asientos 160°.'
    },
    {
      origen: 'Lima',
      destino: 'Ayacucho',
      precioDesde: 55,
      duracionAprox: '8h 00m',
      frecuencia: '6 salidas diarias',
      categoria: 'Ruta Histórica',
      descripcion: 'Salidas nocturnas y diurnas hacia la Ciudad de las Iglesias. Climatización y cena ligera a bordo.'
    },
    {
      origen: 'Huancayo',
      destino: 'Lima',
      precioDesde: 35,
      duracionAprox: '6h 30m',
      frecuencia: '8 salidas diarias',
      categoria: 'Retorno Directo',
      descripcion: 'Llegada directa al Gran Terminal de Lima. Asientos reclinables y conectores USB individuales.'
    },
    {
      origen: 'Ayacucho',
      destino: 'Huancayo',
      precioDesde: 40,
      duracionAprox: '5h 00m',
      frecuencia: '4 salidas diarias',
      categoria: 'Conexión Regional',
      descripcion: 'Conecta dos de los departamentos más emblemáticos de la sierra central con máxima seguridad y puntualidad.'
    }
  ];

  constructor(private api: Api, private router: Router) {}

  ngOnInit(): void {
    this.api.get<string[]>('/api/ciudades').subscribe(c => {
      this.ciudades = c || [];
    });
  }

  toggleFaq(id: number): void {
    this.faqOpen = this.faqOpen === id ? 0 : id;
  }

  buscarPasajes(): void {
    const queryParams: any = {};
    if (this.origen) queryParams.origen = this.origen;
    if (this.destino) queryParams.destino = this.destino;
    if (this.fecha) queryParams.fecha = this.fecha;

    this.router.navigate(['/pasajes'], { queryParams });
  }

  irARuta(origen: string, destino: string): void {
    this.router.navigate(['/pasajes'], {
      queryParams: { origen, destino }
    });
  }
}
