import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../../api.service';
import { ToastService } from '../../toast.service';

type ModoAcceso = 'login' | 'registro';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  modo: ModoAcceso = 'login';
  correo = '';
  password = '';
  verPassword = false;
  ingresando = false;
  registrando = false;

  registroForm = {
    dni: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    password: ''
  };

  constructor(
    private api: Api,
    private router: Router,
    private toast: ToastService
  ) {}

  cambiarModo(nuevoModo: ModoAcceso): void {
    this.modo = nuevoModo;
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

  destinoPorRol(usuario: any): string {
    const destinos: Record<string, string> = {
      ADMIN: '/admin',
      TAQUILLERO: '/taquilla',
      CHOFER: '/chofer',
      CLIENTE: '/'
    };
    return destinos[usuario.rol] || '/';
  }

  ayudaPassword(): void {
    this.toast.info('Para restablecer tu contraseña, escribe a soporte@rutas.pe o comunícate con administración.', 'Recuperación');
  }

  entrar(): void {
    if (this.ingresando) return;
    if (!this.correo?.trim() || !this.password) {
      this.toast.error('Por favor, ingresa tu correo electrónico y contraseña.', 'Campos requeridos');
      return;
    }
    this.ingresando = true;
    this.api.login(this.correo.trim(), this.password).subscribe({
      next: usuario => {
        this.ingresando = false;
        this.router.navigateByUrl(this.destinoPorRol(usuario));
      },
      error: () => {
        this.ingresando = false;
      }
    });
  }

  registrar(): void {
    if (this.registrando) return;
    const { dni, nombres, apellidos, correo, password } = this.registroForm;
    if (!dni?.trim() || !nombres?.trim() || !apellidos?.trim() || !correo?.trim() || !password) {
      this.toast.error('Por favor, completa todos los campos obligatorios.', 'Formulario incompleto');
      return;
    }
    if (dni.trim().length !== 8) {
      this.toast.error('El DNI debe tener exactamente 8 dígitos.', 'DNI inválido');
      return;
    }

    this.registrando = true;
    this.api.registro(this.registroForm).subscribe({
      next: () => {
        this.registrando = false;
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.registrando = false;
      }
    });
  }
}
