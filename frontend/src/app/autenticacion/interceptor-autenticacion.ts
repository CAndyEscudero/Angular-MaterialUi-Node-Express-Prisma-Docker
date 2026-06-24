import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ServicioAutenticacion } from './autenticacion.service';
import { Router } from '@angular/router';

@Injectable()
export class InterceptorAutenticacion implements HttpInterceptor {
  constructor(private servicioAutenticacion: ServicioAutenticacion, private router: Router) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = this.servicioAutenticacion.obtenerToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.servicioAutenticacion.cerrarSesion();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
