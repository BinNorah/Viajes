import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../api.service';

type AccessMode = 'login' | 'registro';

@Component({
  selector: 'app-login', standalone: true, imports: [FormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <aside class="auth-showcase">
        <a class="auth-brand" routerLink="/"><span class="auth-brand-mark">RP</span><span>Rutas del Perú<small>VIAJES INTERPROVINCIALES</small></span></a>
        <div class="auth-copy"><span class="auth-kicker">TU VIAJE, A TU MANERA</span><h1>Siempre hay<br>un camino<br><em>por descubrir.</em></h1><p>Ingresa para consultar tus pasajes y tener tus viajes siempre a la mano.</p><div class="auth-route-art" aria-hidden="true"><span class="route-sun"></span><span class="route-hill hill-one"></span><span class="route-hill hill-two"></span><span class="route-path"></span><span class="route-pin pin-one">LIM</span><span class="route-pin pin-two">CUS</span></div></div>
        <div class="auth-footnote"><span>●</span> Conectando destinos del Perú</div>
      </aside>
      <div class="auth-panel">
        <a class="auth-back" routerLink="/">← Volver a buscar pasajes</a>
        <div class="auth-card">
          <div class="auth-tabs" role="tablist" aria-label="Acceso a la cuenta"><button type="button" role="tab" [attr.aria-selected]="modo === 'login'" [class.active]="modo === 'login'" (click)="cambiarModo('login')">Iniciar sesión</button><button type="button" role="tab" [attr.aria-selected]="modo === 'registro'" [class.active]="modo === 'registro'" (click)="cambiarModo('registro')">Crear cuenta</button></div>
          @if (modo === 'login') {
            <div class="auth-heading"><span class="auth-kicker">QUÉ BUENO TENERTE DE VUELTA</span><h2>Inicia sesión</h2><p>Ingresa tus datos para continuar.</p></div>
            <form (ngSubmit)="entrar()" #loginForm="ngForm" class="auth-form">
              <label for="login-correo">Correo electrónico</label><div class="auth-input"><span aria-hidden="true">✉</span><input id="login-correo" name="correo" type="email" [(ngModel)]="correo" placeholder="nombre@correo.com" autocomplete="username" required email></div>
              <div class="password-label"><label for="login-password">Contraseña</label><button type="button" class="forgot-link" (click)="ayudaPassword()">¿Necesitas ayuda?</button></div><div class="auth-input"><span aria-hidden="true">▣</span><input id="login-password" name="password" [type]="verPassword ? 'text' : 'password'" [(ngModel)]="password" placeholder="Ingresa tu contraseña" autocomplete="current-password" required><button type="button" class="show-password" [attr.aria-label]="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" (click)="verPassword = !verPassword">{{verPassword ? 'Ocultar' : 'Ver'}}</button></div>
              <button class="auth-submit" type="submit" [disabled]="loginForm.invalid || ingresando"><span>{{ingresando ? 'Ingresando…' : 'Ingresar a mi cuenta'}}</span><span aria-hidden="true">→</span></button>
            </form>
            <p class="auth-switch">¿Aún no tienes cuenta? <button type="button" (click)="cambiarModo('registro')">Regístrate gratis</button></p>
          } @else {
            <div class="auth-heading"><span class="auth-kicker">EMPIEZA A VIAJAR</span><h2>Crea tu cuenta</h2><p>Regístrate como pasajero y consulta tus compras.</p></div>
            <form (ngSubmit)="registrar()" #registroForm="ngForm" class="auth-form register-form">
              <div class="form-two"><div><label for="registro-nombres">Nombres</label><div class="auth-input"><input id="registro-nombres" name="nombres" [(ngModel)]="r.nombres" placeholder="Tus nombres" autocomplete="given-name" required></div></div><div><label for="registro-apellidos">Apellidos</label><div class="auth-input"><input id="registro-apellidos" name="apellidos" [(ngModel)]="r.apellidos" placeholder="Tus apellidos" autocomplete="family-name" required></div></div></div>
              <div><label for="registro-dni">DNI</label><div class="auth-input"><input id="registro-dni" name="dni" [(ngModel)]="r.dni" placeholder="8 dígitos" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" autocomplete="off" required></div></div>
              <div><label for="registro-correo">Correo electrónico</label><div class="auth-input"><span aria-hidden="true">✉</span><input id="registro-correo" name="correo" type="email" [(ngModel)]="r.correo" placeholder="nombre@correo.com" autocomplete="email" required email></div></div>
              <div class="form-two"><div><label for="registro-telefono">Teléfono <small>(opcional)</small></label><div class="auth-input"><input id="registro-telefono" name="telefono" type="tel" [(ngModel)]="r.telefono" placeholder="999 999 999" autocomplete="tel"></div></div><div><label for="registro-password">Contraseña</label><div class="auth-input"><input id="registro-password" name="password" [type]="verPassword ? 'text' : 'password'" [(ngModel)]="r.password" placeholder="Mínimo 6 caracteres" autocomplete="new-password" minlength="6" required></div></div></div>
              <button class="auth-submit" type="submit" [disabled]="registroForm.invalid || registrando"><span>{{registrando ? 'Creando cuenta…' : 'Crear mi cuenta'}}</span><span aria-hidden="true">→</span></button>
            </form>
            <p class="auth-switch">¿Ya tienes cuenta? <button type="button" (click)="cambiarModo('login')">Inicia sesión</button></p>
          }
          <div class="auth-secure"><span aria-hidden="true">✓</span> Tus datos se usan para gestionar tu cuenta de pasajero.</div>
        </div>
        <p class="auth-legal">Al continuar aceptas las condiciones de uso del servicio.</p>
      </div>
    </section>
  `,
  styles: [`
    :host{display:block}.auth-page{display:grid;grid-template-columns:minmax(300px,.9fr) minmax(430px,1.1fr);max-width:1050px;min-height:610px;margin:38px auto 0;border:1px solid #e5ebe5;border-radius:20px;background:#fff;overflow:hidden;box-shadow:0 20px 55px #19392913}.auth-showcase{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:610px;padding:32px;background:linear-gradient(145deg,#153d36,#28614e 65%,#507858);color:#fff;overflow:hidden}.auth-showcase:before{content:'';position:absolute;inset:0;background-image:radial-gradient(#e0efc0 1px,transparent 1px);background-size:20px 20px;opacity:.13;mask-image:linear-gradient(140deg,#000,transparent 75%)}.auth-brand,.auth-brand-mark,.auth-footnote,.auth-copy{position:relative;z-index:1}.auth-brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font:800 14px Manrope,sans-serif}.auth-brand-mark{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:#d9ed93;color:#254936;font-size:12px}.auth-brand small{display:block;margin-top:3px;color:#bdd1bf;font:700 8px 'DM Sans',sans-serif;letter-spacing:.14em}.auth-copy{margin:auto 0 110px}.auth-kicker{color:#77947d;font-size:9px;font-weight:800;letter-spacing:.15em}.auth-showcase .auth-kicker{color:#d7e9af}.auth-copy h1{margin:15px 0 12px;color:#fff;font:800 clamp(35px,4vw,49px)/1.06 Manrope,sans-serif;letter-spacing:-.065em}.auth-copy h1 em{color:#d6ec91;font-style:normal}.auth-copy p{max-width:290px;color:#d4e1d5;font-size:12px;line-height:1.7}.auth-route-art{position:absolute;left:4px;right:-20px;bottom:-103px;height:225px;overflow:hidden;opacity:.9}.route-sun{position:absolute;right:20%;top:8px;width:75px;height:75px;border-radius:50%;background:#edc36e}.route-hill{position:absolute;bottom:0;width:0;height:0;border-left:150px solid transparent;border-right:150px solid transparent}.hill-one{left:0;border-bottom:155px solid #62856b}.hill-two{right:-10px;border-bottom:125px solid #99ad78}.route-path{position:absolute;left:48%;bottom:-8px;width:110px;height:110px;border:13px solid #f3e9cd;border-bottom:0;border-radius:60% 60% 0 0;transform:rotate(-28deg)}.route-pin{position:absolute;padding:4px 7px;border-radius:5px;background:#fff;color:#315742;font:800 8px Manrope,sans-serif}.pin-one{left:29%;top:79px}.pin-two{right:20%;top:46px}.auth-footnote{color:#d6e2d5;font-size:9px;letter-spacing:.04em}.auth-footnote span{margin-right:7px;color:#d5ed83}.auth-panel{display:flex;flex-direction:column;justify-content:center;padding:38px clamp(25px,5vw,66px)}.auth-back{align-self:flex-start;margin-bottom:26px;color:#70817a;font-size:10px;font-weight:700;text-decoration:none}.auth-back:hover{color:#245945}.auth-card{width:100%;max-width:410px;margin:0 auto}.auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:9px;background:#f3f6f1}.auth-tabs button{height:35px;border:0;border-radius:7px;background:transparent;color:#7b8982;font-size:10px;font-weight:700;cursor:pointer}.auth-tabs button.active{background:#fff;color:#244f3c;box-shadow:0 2px 8px #18382a12}.auth-heading{margin:25px 0 20px}.auth-heading h2{margin:7px 0 6px;color:#1b3129;font:800 29px Manrope,sans-serif;letter-spacing:-.055em}.auth-heading p{margin:0;color:#839087;font-size:11px}.auth-form{display:grid;gap:9px}.auth-form label{display:block;margin:5px 0 6px;color:#4b5f53;font-size:10px;font-weight:700}.auth-form label small{color:#9ba69f;font-weight:400}.auth-input{height:43px;display:flex;align-items:center;gap:9px;padding:0 11px;border:1px solid #dfe7df;border-radius:8px;background:#fcfdfb}.auth-input:focus-within{border-color:#7da487;box-shadow:0 0 0 3px #61916b19}.auth-input>span{color:#73907c;font-size:13px}.auth-input input{width:100%;min-width:0;height:100%;padding:0;border:0;outline:0!important;background:transparent;color:#273b31;font-size:11px}.auth-input input::placeholder{color:#a7b1aa}.password-label{display:flex;align-items:center;justify-content:space-between}.password-label label{margin-bottom:6px}.forgot-link{padding:4px 0;border:0;background:none;color:#547c64;font-size:9px;cursor:pointer}.show-password{padding:5px;border:0;background:transparent;color:#527760;font-size:9px;font-weight:700;cursor:pointer}.auth-submit{height:44px;display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding:0 15px;border:0;border-radius:8px;background:#194e43;color:#fff;font-size:11px;font-weight:800;cursor:pointer;transition:background .16s,transform .16s}.auth-submit:hover{background:#286c56;transform:translateY(-1px)}.auth-submit:disabled{opacity:.55;cursor:not-allowed;transform:none}.auth-switch{margin:18px 0;color:#87938c;text-align:center;font-size:10px}.auth-switch button{padding:0;border:0;background:transparent;color:#2f7454;font-size:10px;font-weight:800;cursor:pointer}.auth-secure{display:flex;align-items:center;gap:7px;margin-top:20px;padding-top:14px;border-top:1px solid #edf1ec;color:#88948d;font-size:9px}.auth-secure span{display:grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#e9f3e7;color:#4d875b;font-weight:800}.auth-legal{margin:18px 0 0;color:#a0aaa3;text-align:center;font-size:9px}.register-form{gap:6px}.form-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.form-two>div{min-width:0}.register-form .auth-submit{margin-top:13px}@media(max-width:850px){.auth-page{grid-template-columns:minmax(240px,.8fr) minmax(360px,1.2fr);min-height:570px}.auth-showcase{min-height:570px;padding:25px}.auth-panel{padding:30px 25px}.auth-copy h1{font-size:38px}}@media(max-width:650px){.auth-page{grid-template-columns:1fr;max-width:480px;margin:18px auto 0;border-radius:15px}.auth-showcase{min-height:205px;padding:20px 22px}.auth-copy{margin:20px 0 0}.auth-copy h1{margin:10px 0 5px;font-size:31px}.auth-copy p,.auth-route-art,.auth-footnote{display:none}.auth-panel{padding:21px 20px 25px}.auth-back{margin-bottom:14px}.auth-heading{margin:18px 0 15px}.auth-heading h2{font-size:26px}.auth-secure{margin-top:14px}.auth-legal{margin-top:13px}}
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

  constructor(private api: Api, private router: Router) {}

  cambiarModo(modo: AccessMode): void { this.modo = modo; this.verPassword = false; }
  destino(usuario: any): string {
    const destinos: Record<string, string> = { ADMIN: '/admin', TAQUILLERO: '/taquilla', CHOFER: '/chofer', CLIENTE: '/' };
    return destinos[usuario.rol] || '/';
  }
  ayudaPassword(): void { window.alert('Si olvidaste tu contraseña, comunícate con la empresa para restablecer el acceso.'); }
  entrar(): void {
    if (this.ingresando) return;
    this.ingresando = true;
    this.api.login(this.correo.trim(), this.password).subscribe({
      next: usuario => { this.ingresando = false; this.router.navigateByUrl(this.destino(usuario)); },
      error: () => { this.ingresando = false; }
    });
  }
  registrar(): void {
    if (this.registrando) return;
    this.registrando = true;
    const datos = { ...this.r, dni: this.r.dni.trim(), nombres: this.r.nombres.trim(), apellidos: this.r.apellidos.trim(), correo: this.r.correo.trim() };
    this.api.registro(datos).subscribe({
      next: () => { this.registrando = false; this.router.navigateByUrl('/'); },
      error: () => { this.registrando = false; }
    });
  }
}
