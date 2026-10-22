import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize, switchMap } from 'rxjs';
import { Api } from '../api.service';
<<<<<<< HEAD
import { BoletoComponent, DesgloseComponent, MapaComponent, PasajeroFormComponent } from '../shared/shared';

@Component({
    selector: 'app-buscar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, MapaComponent, DesgloseComponent, BoletoComponent, PasajeroFormComponent],
    templateUrl: './buscar.component.html'
=======
import { BoletoComponent, DesgloseComponent, MapaComponent, PasajeroFormComponent } from '../shared';

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MapaComponent, DesgloseComponent, BoletoComponent, PasajeroFormComponent],
  template: `
    <!-- Search Banner Header -->
    <section class="hero-wrapper" id="buscador-pasajes">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="pulse-dot"></span>
          <span>SISTEMA DE RESERVAS · SALIDAS CONFIRMADAS EN TIEMPO REAL</span>
        </div>
        <h1 class="hero-title">
          Buscador de Pasajes<br>
          <em>y Asientos en Vivo.</em>
        </h1>
        <p class="hero-desc">
          Filtra por ciudad, selecciona el horario que mejor te convenga y reserva tu butaca favorita en nuestro croquis interactivo de 1 y 2 pisos.
        </p>

        <div class="hero-highlights">
          <span class="highlight-chip">Confirmación de boleto digital inmediata</span>
          <span class="highlight-chip">Bloqueo atómico de asiento por 10 min</span>
          <span class="highlight-chip">Múltiples métodos de pago</span>
        </div>
      </div>

      <!-- Search Panel -->
      <form class="interactive-search-card" id="buscar" (ngSubmit)="buscar()">
        <div class="search-header">
          <div class="search-title-group">
            <span class="kicker">RESERVA DIGITAL DE PASAJES</span>
            <h2>¿A dónde deseas viajar?</h2>
          </div>
          <div class="search-shortcuts">
            <button type="button" class="date-chip" [class.active]="esFecha(0)" (click)="setDateOffset(0)">Hoy</button>
            <button type="button" class="date-chip" [class.active]="esFecha(1)" (click)="setDateOffset(1)">Mañana</button>
            <button type="button" class="date-chip" [class.active]="esFecha(2)" (click)="setDateOffset(2)">Pasado mañana</button>
            <button type="button" class="date-chip" [class.active]="!f.fecha" (click)="clearFecha()">Todas las fechas</button>
          </div>
        </div>

        <div class="search-inputs-grid">
          <!-- Origen -->
          <div class="input-block">
            <label>CIUDAD DE ORIGEN</label>
            <div class="input-container">
              <span class="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </span>
              <select name="origen" [(ngModel)]="f.origen">
                <option value="">Cualquier origen</option>
                @for (c of ciudades; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Swap Button -->
          <button type="button" 
                  class="swap-btn" 
                  aria-label="Intercambiar ciudades de origen y destino"
                  title="Intercambiar origen y destino"
                  (click)="intercambiar()">
            ⇄
          </button>

          <!-- Destino -->
          <div class="input-block">
            <label>CIUDAD DE DESTINO</label>
            <div class="input-container">
              <span class="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="21 10 21 4 4 4 4 20 21 20 17 10"></polygon></svg>
              </span>
              <select name="destino" [(ngModel)]="f.destino">
                <option value="">Cualquier destino</option>
                @for (c of ciudades; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Fecha -->
          <div class="input-block">
            <label>FECHA DE SALIDA</label>
            <div class="input-container">
              <span class="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </span>
              <input name="fecha" type="date" [min]="fechaMinima" [(ngModel)]="f.fecha">
            </div>
          </div>

          <!-- Submit -->
          <button class="search-action-btn" type="submit" [disabled]="cargando">
            <span>{{ cargando ? 'Buscando…' : 'Buscar Salidas' }}</span>
            <span class="arrow-icon">→</span>
          </button>
        </div>

        @if (f.origen && f.origen === f.destino) {
          <p class="search-error-hint">El origen y el destino deben ser ciudades diferentes.</p>
        }
      </form>
    </section>

    <!-- Results Section -->
    <section class="results-wrapper" id="resultados">
      <div class="results-topbar">
        <div>
          <span class="kicker">ITINERARIOS DISPONIBLES</span>
          <h2>Salidas y Horarios de Buses</h2>
          <p class="results-desc">Compara precios, tipos de servicio y disponibilidad de asientos en vivo.</p>
        </div>

        <div class="results-filters-row">
          <!-- Filter by service -->
          <div class="filter-pills">
            <button type="button" class="filter-pill" [class.active]="filtroServicio === 'TODOS'" (click)="filtroServicio = 'TODOS'">Todos los buses</button>
            <button type="button" class="filter-pill" [class.active]="filtroServicio === 'VIP_180'" (click)="filtroServicio = 'VIP_180'">VIP 180°</button>
            <button type="button" class="filter-pill" [class.active]="filtroServicio === 'CAMA_160'" (click)="filtroServicio = 'CAMA_160'">Cama 160°</button>
          </div>

          <!-- Order -->
          <div class="sort-selector">
            <label>Ordenar:</label>
            <select [(ngModel)]="f.orden" (change)="buscar()">
              <option value="hora">Próxima salida</option>
              <option value="precio">Menor precio</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (cargando) {
        <div class="state-card loading-card">
          <div class="state-spinner"></div>
          <h3>Consultando disponibilidad en terminales…</h3>
          <p>Obteniendo salidas programadas y estado de asientos.</p>
        </div>
      } 
      <!-- Trip List -->
      @else if (viajesFiltrados.length) {
        <div class="results-count-bar">
          <span>Se encontraron <b>{{ viajesFiltrados.length }}</b> salidas disponibles</span>
          @if (f.origen || f.destino || f.fecha) {
            <button type="button" class="clear-filters-btn" (click)="limpiarBusqueda()">Limpiar filtros</button>
          }
        </div>

        <div class="trip-cards-grid">
          @for (v of viajesFiltrados; track v.id) {
            <article class="modern-trip-card" [class.is-expanded]="viaje?.id === v.id">
              <!-- Left: Date & Time -->
              <div class="trip-time-col">
                <span class="trip-day-name">{{ diaSemana(v.fecha_salida) }}</span>
                <span class="trip-day-num">{{ dia(v.fecha_salida) }}</span>
                <span class="trip-month">{{ mes(v.fecha_salida) }}</span>
              </div>

              <!-- Center: Route & Itinerary -->
              <div class="trip-route-col">
                <div class="departure-node">
                  <span class="node-time">{{ v.hora_salida }}</span>
                  <b class="node-city">{{ v.origen }}</b>
                  <small class="node-station">{{ v.terminal_origen }}</small>
                </div>

                <div class="timeline-bar">
                  <span class="duration-tag">{{ v.duracion_horas }}h aprox</span>
                  <div class="track-line">
                    <span class="track-dot start-dot"></span>
                    <span class="track-arrow">⇢</span>
                    <span class="track-dot end-dot"></span>
                  </div>
                  <span class="distance-tag">{{ v.distancia_km }} km</span>
                </div>

                <div class="arrival-node">
                  <span class="node-time">Llegada</span>
                  <b class="node-city">{{ v.destino }}</b>
                  <small class="node-station">{{ v.terminal_destino }}</small>
                </div>
              </div>

              <!-- Bus Info & Amenities -->
              <div class="trip-features-col">
                <div class="service-chip service-{{ v.tipo_servicio.toLowerCase() }}">
                  {{ servicio(v.tipo_servicio) }}
                </div>
                <div class="bus-plate">Bus {{ v.placa }} ({{ v.total_pisos }} {{ v.total_pisos > 1 ? 'pisos' : 'piso' }})</div>

                <div class="amenities-list">
                  <span class="amenity-item" title="WiFi a bordo">WiFi</span>
                  <span class="amenity-item" title="Climatización">AC</span>
                  <span class="amenity-item" title="Tomas USB">USB</span>
                  <span class="amenity-item" title="GPS Monitoreado">GPS</span>
                </div>
              </div>

              <!-- Seats & Price CTA -->
              <div class="trip-cta-col">
                <div class="seats-left-tag" [class.few-seats]="v.asientos_libres <= 5">
                  <span class="status-indicator"></span>
                  @if (v.asientos_libres <= 5) {
                    <span>¡Últimos <b>{{ v.asientos_libres }}</b> asientos!</span>
                  } @else {
                    <span><b>{{ v.asientos_libres }}</b> asientos libres</span>
                  }
                </div>

                <div class="price-box">
                  <small>Tarifa por asiento</small>
                  <div class="price-value">S/ {{ precio(v.precio_base) }}</div>
                </div>

                <button class="select-seat-btn" (click)="elegir(v)">
                  <span>{{ viaje?.id === v.id ? 'Viendo Asientos' : 'Elegir Asiento' }}</span>
                  <span class="arrow-move">→</span>
                </button>
              </div>
            </article>
          }
        </div>
      } 
      <!-- Empty State -->
      @else if (consultado) {
        <div class="state-card empty-card">
          <span class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="7" cy="18" r="1.5"></circle><circle cx="17" cy="18" r="1.5"></circle></svg>
          </span>
          <h3>No encontramos salidas para esta búsqueda</h3>
          <p>Prueba seleccionando otra fecha o consulta todas las rutas disponibles en nuestro catálogo.</p>
          <button type="button" class="btn-reset-search" (click)="limpiarBusqueda()">
            Ver Todas las Salidas Disponibles →
          </button>
        </div>
      }
    </section>

    <!-- Interactive Booking & Seat Selection Workspace -->
    @if (viaje) {
      <section class="booking-workspace" id="seleccion-asiento">
        <div class="workspace-header">
          <div>
            <span class="kicker">PROCESO DE RESERVA</span>
            <h2>{{ viaje.origen }} ⟶ {{ viaje.destino }}</h2>
            <p>{{ fechaLarga(viaje.fecha_salida) }} · Salida {{ viaje.hora_salida }} · {{ servicio(viaje.tipo_servicio) }} · Bus {{ viaje.placa }}</p>
          </div>
          <button class="btn-close-workspace" (click)="cerrarViaje()">Cerrar selección</button>
        </div>

        <!-- Step Indicator -->
        <div class="booking-steps-bar">
          <div class="step-badge" [class.active]="reservas.length === 0 && boletos.length === 0" [class.done]="reservas.length > 0 || boletos.length > 0">
            <span class="step-num">1</span>
            <span>Selección de Asientos</span>
          </div>
          <div class="step-line" [class.done]="reservas.length > 0 || boletos.length > 0"></div>
          <div class="step-badge" [class.active]="reservas.length > 0 && boletos.length === 0" [class.done]="boletos.length > 0">
            <span class="step-num">2</span>
            <span>Datos y Pago</span>
          </div>
          <div class="step-line" [class.done]="boletos.length > 0"></div>
          <div class="step-badge" [class.active]="boletos.length > 0">
            <span class="step-num">3</span>
            <span>Boletos Digitales QR</span>
          </div>
        </div>

        <div class="workspace-grid">
          <!-- Left: Seat Map or Checkout Form -->
          <div class="workspace-main-card">
            @if (reservas.length === 0) {
              <div class="step-content">
                <div class="step-title-row">
                  <h3>Selecciona tu ubicación en el bus</h3>
                  <span class="step-hint">Puedes seleccionar 1 o más asientos (hasta 6 para viajar con acompañantes)</span>
                </div>

                <app-mapa [viajeId]="viaje.id" (elegidos)="asientos = $event" (elegido)="asiento = $event"></app-mapa>

                @if (asientos.length > 0) {
                  <div class="fare-continue-box">
                    <app-desglose [asientos]="asientos"></app-desglose>

                    @if (usuarioRegistrado) {
                      <button class="btn-reserve-action" (click)="bloquear()">
                        <span>Bloquear {{ asientos.length }} Asiento{{ asientos.length > 1 ? 's' : '' }} y Continuar</span>
                        <span>→</span>
                      </button>
                    } @else {
                      <div class="login-gate-banner">
                        <div class="gate-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <div>
                          <b>Inicia sesión para continuar tu compra</b>
                          <p>Para garantizar tus boletos necesitas una cuenta de pasajero.</p>
                        </div>
                        <a routerLink="/login" class="gate-btn">Ingresar o Registrarse →</a>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else {
              <!-- Step 2: Passenger Form & Simulated Payment -->
              <div class="checkout-step-container">
                <div class="checkout-step-header">
                  <div>
                    <span class="kicker">PASO 2 DE 3</span>
                    <h3>Datos de Pasajeros y Pago Seguro</h3>
                    <p class="passengers-count-tag">{{ reservas.length }} Pasaje{{ reservas.length > 1 ? 's' : '' }} en Proceso de Compra</p>
                  </div>
                  <!-- Countdown Clock -->
                  <div class="countdown-clock">
                    <span class="clock-label">Tiempo de reserva:</span>
                    <b class="clock-timer">{{ resta }}</b>
                  </div>
                </div>

                @if (expirada) {
                  <div class="alert-expired">
                    Tu tiempo de reserva expiró y los asientos fueron liberados. Por favor, vuelve a seleccionarlos.
                  </div>
                }

                <div class="checkout-forms-layout">
                  <!-- Passenger details for each reserved seat -->
                  <div class="checkout-subpanel">
                    <div class="passengers-header-row">
                      <h4>1. Datos de los Pasajeros</h4>
                      @if (pasajeros.length > 1) {
                        <button type="button" class="btn-copy-contact" (click)="copiarContacto()">
                          Copiar Teléfono a Todos
                        </button>
                      }
                    </div>

                    <div class="passengers-cards-list">
                      @for (pItem of pasajeros; track pItem.id; let i = $index) {
                        <div class="passenger-card-item">
                          <div class="pcard-header">
                            <span class="pcard-badge">Pasajero {{ i + 1 }} {{ i === 0 ? '(Titular)' : '(Acompañante)' }}</span>
                            <span class="pcard-seat">Asiento #{{ pItem.asiento }} (Piso {{ pItem.piso }})</span>
                          </div>

                          <div class="passenger-fields-grid">
                            <div class="field-item">
                              <label>Tipo de Documento</label>
                              <select [(ngModel)]="pItem.tipo_documento">
                                <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                                <option value="PASAPORTE">Pasaporte</option>
                                <option value="CE">Carné de Extranjería</option>
                              </select>
                            </div>

                            <div class="field-item">
                              <label>Número de Documento</label>
                              <input [(ngModel)]="pItem.numero_documento" placeholder="Ej. 71234567" maxlength="15">
                            </div>

                            <div class="field-item">
                              <label>Nombres</label>
                              <input [(ngModel)]="pItem.nombres" placeholder="Nombres del pasajero">
                            </div>

                            <div class="field-item">
                              <label>Apellidos</label>
                              <input [(ngModel)]="pItem.apellidos" placeholder="Apellidos del pasajero">
                            </div>

                            <div class="field-item" style="grid-column: 1 / -1;">
                              <label>Teléfono de Contacto (opcional)</label>
                              <input [(ngModel)]="pItem.telefono" placeholder="987654321">
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Simulated Credit Card Payment -->
                  <div class="checkout-subpanel payment-subpanel">
                    <h4>2. Pago Seguro (Simulación)</h4>
                    <p class="demo-notice">Entorno seguro de prueba. No ingreses datos de una tarjeta bancaria real.</p>

                    <!-- Interactive Virtual Card -->
                    <div class="virtual-card-preview">
                      <div class="vcard-top">
                        <span class="vcard-chip">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                        </span>
                        <span class="vcard-brand">VISA / MASTERCARD</span>
                      </div>
                      <div class="vcard-number">
                        {{ formatCardNumber(tj.tarjeta) || '•••• •••• •••• ••••' }}
                      </div>
                      <div class="vcard-bottom">
                        <div>
                          <small>PASAJERO 1 (TITULAR)</small>
                          <b>{{ (pasajeros[0]?.nombres ? pasajeros[0].nombres + ' ' + pasajeros[0].apellidos : 'TITULAR') | uppercase }}</b>
                        </div>
                        <div>
                          <small>VENCE</small>
                          <b>{{ tj.vencimiento || 'MM/AA' }}</b>
                        </div>
                      </div>
                    </div>

                    <!-- Payment Inputs -->
                    <div class="payment-inputs">
                      <label>Número de Tarjeta
                        <input [(ngModel)]="tj.tarjeta" placeholder="4242 4242 4242 4242" maxlength="19" autocomplete="cc-number">
                      </label>

                      <div class="payment-row-2">
                        <label>Vencimiento
                          <input [(ngModel)]="tj.vencimiento" placeholder="12/28" maxlength="5">
                        </label>
                        <label>CVV
                          <input [(ngModel)]="tj.cvv" placeholder="123" maxlength="4" type="password">
                        </label>
                      </div>
                    </div>

                    <button class="btn-pay-now" (click)="pagar()" [disabled]="pagando">
                      <span>{{ pagando ? 'Procesando pago seguro…' : ('Confirmar y Pagar S/ ' + precioTotalReservas()) }}</span>
                    </button>

                    <button type="button" class="btn-cancel-reservation" (click)="cancelar()">
                      Cancelar reservas y liberar asientos
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Right: Summary Sidebar -->
          <aside class="trip-summary-sidebar">
            <span class="kicker">RESUMEN DEL ITINERARIO</span>
            <h3>{{ viaje.origen }} ⟶ {{ viaje.destino }}</h3>

            <div class="sidebar-details">
              <div class="sidebar-row">
                <span>Fecha de Salida:</span>
                <b>{{ fechaLarga(viaje.fecha_salida) }}</b>
              </div>
              <div class="sidebar-row">
                <span>Hora de Salida:</span>
                <b>{{ viaje.hora_salida }}</b>
              </div>
              <div class="sidebar-row">
                <span>Servicio:</span>
                <b>{{ servicio(viaje.tipo_servicio) }}</b>
              </div>
              <div class="sidebar-row">
                <span>Vehículo:</span>
                <b>Bus {{ viaje.placa }} (Pisos: {{ viaje.total_pisos }})</b>
              </div>
              <div class="sidebar-row">
                <span>Conductor:</span>
                <b>{{ viaje.chofer || 'Asignado en terminal' }}</b>
              </div>
              @if (asientos.length > 0) {
                <div class="sidebar-row highlight-row">
                  <span>Asientos ({{ asientos.length }}):</span>
                  <b>{{ listaAsientosTexto() }}</b>
                </div>
              }
            </div>

            <div class="sidebar-total-card">
              <span>Importe Estimado:</span>
              <b>S/ {{ totalEstimadoTexto() }}</b>
            </div>

            <div class="sidebar-security-badge">
              <span class="shield-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </span>
              <p>Compra protegida. Asientos reservados durante 10 minutos para completar tus datos.</p>
            </div>
          </aside>
        </div>
      </section>
    }

    <!-- Completed Ticket Display (Single or Multiple) -->
    @if (boletos.length > 0) {
      <section class="ticket-success-wrapper" id="confirmacion">
        <div class="success-banner">
          <div class="success-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div>
            <h2>¡Tu compra ha sido confirmada con éxito!</h2>
            <p>Hemos emitido <b>{{ boletos.length }} boleto{{ boletos.length > 1 ? 's' : '' }} electrónico{{ boletos.length > 1 ? 's' : '' }} oficial{{ boletos.length > 1 ? 'es' : '' }}</b> de Rutas del Perú. Puedes imprimirlos o presentarlos en el smartphone.</p>
          </div>
        </div>

        @if (boletos.length > 1) {
          <div class="multi-tickets-nav">
            <span class="multi-nav-label">Selecciona el boleto a visualizar:</span>
            <div class="multi-nav-tabs">
              @for (b of boletos; track b.id; let i = $index) {
                <button type="button"
                        class="ticket-nav-tab"
                        [class.active]="boletoActivoIndex === i"
                        (click)="boletoActivoIndex = i">
                  <b>Boleto {{ i + 1 }}</b>
                  <small>{{ b.nombres }} (Asiento #{{ b.numero_asiento }})</small>
                </button>
              }
            </div>
          </div>
        }

        <app-boleto [b]="boletos[boletoActivoIndex]"></app-boleto>

        <div class="post-purchase-actions">
          <button class="btn-buy-another" (click)="resetSearch()">
            ← Buscar otro viaje
          </button>
          <a routerLink="/mis-viajes" class="btn-view-trips">
            Ver mis pasajes comprados ({{ boletos.length }}) →
          </a>
        </div>
      </section>
    }

    <!-- Features / Value Proposition Section -->
    <section class="benefits-showcase">
      <div class="benefits-header">
        <span class="kicker">POR QUÉ ELEGIRNOS</span>
        <h2>La mejor experiencia en viajes interprovinciales</h2>
      </div>

      <div class="benefits-grid-3">
        <div class="benefit-item">
          <div class="b-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <h3>Rutas directas sin escalas</h3>
          <p>Conectamos Lima, Ayacucho, Huancayo y Cusco con salidas puntuales y terminales certificados.</p>
        </div>

        <div class="benefit-item">
          <div class="b-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><circle cx="9" cy="9" r="1.5"></circle></svg>
          </div>
          <h3>Asientos VIP y Cama 160°</h3>
          <p>Flota de buses modernos Scania y Mercedes-Benz con reclinación ergonómica y climatización.</p>
        </div>

        <div class="benefit-item">
          <div class="b-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          </div>
          <h3>Emisión de Boleto 100% Digital</h3>
          <p>Olvídate de las colas. Tu código QR te permite abordar directamente desde tu teléfono.</p>
        </div>
      </div>
    </section>
  `
>>>>>>> 292f258bc7f547b31f9d482907d7d7304bb875b6
})
export class BuscarComponent implements OnInit, OnDestroy {
  ciudades: string[] = [];
  f: any = { origen: '', destino: '', fecha: '', orden: 'hora' };
  viajes: any[] = [];
  viaje: any = null;
  asiento: any = null;
  asientos: any[] = [];
  reserva: any = null;
  reservas: any[] = [];
  pasajeros: any[] = [];
  resta = '10:00';
  expirada = false;
  cargando = false;
  pagando = false;
  consultado = false;
  filtroServicio = 'TODOS';
  fechaMinima = this.fechaLocal();
  t: any;
  p: any = { tipo_documento: 'DNI' };
  tj: any = {};
  boleto: any = null;
  boletos: any[] = [];
  boletoActivoIndex = 0;
  @ViewChild(MapaComponent) mapa?: MapaComponent;

  constructor(public api: Api, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.api.get<string[]>('/api/ciudades').subscribe(c => this.ciudades = c || []);
    // Prefill user data if logged in
    this.api.ready.then(() => {
      const u = this.api.user();
      if (u) {
        this.p.nombres = u.nombre.split(' ')[0] || '';
        this.p.apellidos = u.nombre.split(' ').slice(1).join(' ') || '';
        this.p.numero_documento = u.dni || '';
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['origen']) this.f.origen = params['origen'];
      if (params['destino']) this.f.destino = params['destino'];
      if (params['fecha']) this.f.fecha = params['fecha'];
      this.buscar();
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.t);
  }

  get viajesFiltrados(): any[] {
    if (this.filtroServicio === 'TODOS') return this.viajes;
    return this.viajes.filter(v => v.tipo_servicio === this.filtroServicio);
  }

  buscar(): void {
    if (this.f.origen && this.f.origen === this.f.destino) return;
    this.cargando = true;
    const filtros: any = { ...this.f };
    if (!filtros.fecha) delete filtros.fecha;
    if (!filtros.origen) delete filtros.origen;
    if (!filtros.destino) delete filtros.destino;

    this.api.get<any[]>('/api/viajes?' + new URLSearchParams(filtros).toString())
      .pipe(finalize(() => this.cargando = false))
      .subscribe(v => {
        this.viajes = v || [];
        this.consultado = true;
      });
  }

  intercambiar(): void {
    const o = this.f.origen;
    this.f.origen = this.f.destino;
    this.f.destino = o;
    if (this.f.origen && this.f.destino) this.buscar();
  }

  setDateOffset(days: number): void {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    this.f.fecha = d.toISOString().slice(0, 10);
    this.buscar();
  }

  clearFecha(): void {
    this.f.fecha = '';
    this.buscar();
  }

  esFecha(days: number): boolean {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return this.f.fecha === d.toISOString().slice(0, 10);
  }

  limpiarBusqueda(): void {
    this.f = { origen: '', destino: '', fecha: '', orden: 'hora' };
    this.filtroServicio = 'TODOS';
    this.buscar();
  }

  elegir(v: any): void {
    this.reset();
    this.viaje = v;
    setTimeout(() => {
      document.getElementById('seleccion-asiento')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  cerrarViaje(): void {
    this.reset();
    this.viaje = null;
  }

  reset(): void {
    clearInterval(this.t);
    this.asiento = null;
    this.asientos = [];
    this.reserva = null;
    this.reservas = [];
    this.pasajeros = [];
    this.boleto = null;
    this.boletos = [];
    this.boletoActivoIndex = 0;
    this.expirada = false;
    this.resta = '10:00';
  }

  resetSearch(): void {
    this.reset();
    this.viaje = null;
    this.buscar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get usuarioRegistrado(): boolean {
    return !!this.api.user();
  }

  bloquear(): void {
    if (!this.usuarioRegistrado) {
      this.api.toast.info('Por favor inicia sesión para continuar con tu reserva.', 'Cuenta requerida');
      this.router.navigateByUrl('/login');
      return;
    }

    if (this.asientos.length === 0) {
      this.api.toast.warning('Selecciona al menos un asiento en el croquis.', 'Sin selección');
      return;
    }

    const aids = this.asientos.map(a => a.id);
    this.api.post('/api/reservas', { viaje_id: this.viaje.id, asientos_ids: aids }).subscribe({
      next: (r: any) => {
        this.reservas = r.reservas || [r];
        this.reserva = this.reservas[0];
        const u = this.api.user();

        this.pasajeros = this.reservas.map((res: any, idx: number) => ({
          id: res.id,
          asiento: res.numero_asiento,
          piso: res.piso,
          tipo_documento: 'DNI',
          numero_documento: (idx === 0 && u?.dni) ? u.dni : '',
          nombres: (idx === 0 && u?.nombre) ? u.nombre.split(' ')[0] : '',
          apellidos: (idx === 0 && u?.nombre) ? u.nombre.split(' ').slice(1).join(' ') : '',
          telefono: (idx === 0 && u?.telefono) ? u.telefono : ''
        }));

        this.api.toast.success(`${this.reservas.length} asiento(s) bloqueado(s) por 10 minutos.`, 'Reserva iniciada');
        this.mapa?.cargar();
        const fin = new Date(this.reservas[0].fecha_expiracion_bloqueo.replace(' ', 'T')).getTime();
        this.t = setInterval(() => {
          const s = Math.max(0, Math.floor((fin - Date.now()) / 1000));
          this.resta = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
          if (!s) {
            clearInterval(this.t);
            this.expirada = true;
            this.reservas = [];
            this.reserva = null;
            this.asientos = [];
            this.asiento = null;
            this.api.toast.warning('El tiempo de reserva expiró y los asientos fueron liberados.', 'Tiempo agotado');
            this.mapa?.cargar();
          }
        }, 500);
      }
    });
  }

  copiarContacto(): void {
    const tel = this.pasajeros[0]?.telefono;
    if (!tel) {
      this.api.toast.info('Ingresa un teléfono en el Pasajero 1 para copiarlo al resto.', 'Sin teléfono');
      return;
    }
    this.pasajeros.forEach(p => p.telefono = tel);
    this.api.toast.success('Teléfono de contacto copiado a todos los pasajeros.', 'Datos replicados');
  }

  formatCardNumber(val: string): string {
    if (!val) return '';
    return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  pagar(): void {
    for (let i = 0; i < this.pasajeros.length; i++) {
      const p = this.pasajeros[i];
      if (!p.nombres?.trim() || !p.apellidos?.trim() || !p.numero_documento?.trim()) {
        this.api.toast.error(`Completa nombres, apellidos y documento del Pasajero ${i + 1} (Asiento #${p.asiento}).`, 'Datos incompletos');
        return;
      }
    }

    if (!this.tj.tarjeta || !this.tj.vencimiento || !this.tj.cvv) {
      this.api.toast.error('Completa los datos de la tarjeta bancaria de prueba.', 'Pago incompleto');
      return;
    }

    this.pagando = true;
    const payload = {
      boletos: this.pasajeros,
      tarjeta: this.tj.tarjeta,
      cvv: this.tj.cvv
    };

    this.api.post('/api/reservas/checkout', payload)
      .pipe(finalize(() => this.pagando = false))
      .subscribe({
        next: (res: any) => {
          clearInterval(this.t);
          this.boletos = res.boletos || [];
          this.boleto = this.boletos[0] || null;
          this.boletoActivoIndex = 0;
          this.reservas = [];
          this.reserva = null;
          this.asientos = [];
          this.asiento = null;
          this.viaje = null;
          this.api.toast.success(`¡Pago completado! Se han emitido ${this.boletos.length} boleto(s).`, 'Compra exitosa');
          this.buscar();
          setTimeout(() => {
            document.getElementById('confirmacion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }
      });
  }

  cancelar(): void {
    if (this.reservas.length === 0) return;
    const bids = this.reservas.map(r => r.id);
    this.api.post('/api/reservas/cancelar-lote', { boletos_ids: bids }).subscribe({
      next: () => {
        this.api.toast.info('Reservas canceladas y asientos liberados.', 'Reserva anulada');
        this.reset();
        this.mapa?.cargar();
      }
    });
  }

  precioTotalReservas(): string {
    const sum = this.reservas.reduce((acc, r) => acc + Number(r.precio_final || 0), 0);
    return sum.toFixed(2);
  }

  listaAsientosTexto(): string {
    return this.asientos.map(a => '#' + a.numero_asiento).join(', ');
  }

  totalEstimadoTexto(): string {
    if (this.asientos.length > 0) {
      const sum = this.asientos.reduce((acc, a) => acc + Number(a.precio_final || (a.precio_base + a.recargo_precio)), 0);
      return sum.toFixed(2);
    }
    return this.precio(this.viaje?.precio_base);
  }

  precio(valor: number): string { return Number(valor || 0).toFixed(2); }
  mes(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { month: 'short' }).replace('.', '').toUpperCase(); }
  dia(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit' }); }
  diaSemana(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '').toUpperCase(); }
  fechaLarga(fecha: string): string { return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  servicio(tipo: string): string {
    const s: Record<string, string> = {
      ECONOMICO: 'Económico',
      EJECUTIVO: 'Ejecutivo',
      CAMA_160: 'Bus Cama 160°',
      VIP_180: 'VIP 180° Panorámico'
    };
    return s[tipo] || tipo;
  }
  private fechaLocal(): string {
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    return hoy.toISOString().slice(0, 10);
  }
}
