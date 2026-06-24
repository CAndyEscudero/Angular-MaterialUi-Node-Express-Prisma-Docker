import { Component } from '@angular/core';
import { ServicioAutenticacion } from './autenticacion.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio-sesion',
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.css'],
})
export class InicioSesionComponent {
  email = '';
  contrasena = '';
  mensajeError = '';
  cargando = false;

  constructor(private servicioAutenticacion: ServicioAutenticacion, private router: Router) {
    // If already authenticated, redirect to dashboard
    if (this.servicioAutenticacion.estaAutenticado()) {
      this.servicioAutenticacion.redirigirAlPanel();
    }
  }

  onSubmit(): void {
    if (!this.email || !this.contrasena) {
      this.mensajeError = 'Por favor ingrese email y contraseña.';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.servicioAutenticacion.iniciarSesion(this.email, this.contrasena).subscribe({
      next: () => {
        this.servicioAutenticacion.redirigirAlPanel();
      },
      error: (err) => {
        this.cargando = false;
        if (err.status === 401) {
          this.mensajeError = 'Credenciales inválidas.';
        } else {
          this.mensajeError = 'Error de conexión. Intente nuevamente.';
        }
      },
      complete: () => {
        this.cargando = false;
      },
    });
  }
}
