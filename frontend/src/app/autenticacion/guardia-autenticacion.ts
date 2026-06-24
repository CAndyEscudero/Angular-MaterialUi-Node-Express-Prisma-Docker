import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { ServicioAutenticacion } from './autenticacion.service';

@Injectable({ providedIn: 'root' })
export class GuardiaAutenticacion implements CanActivate {
  constructor(private servicioAutenticacion: ServicioAutenticacion, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.servicioAutenticacion.estaAutenticado()) {
      return true;
    }
    return this.router.parseUrl('/login');
  }
}
