import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface RespuestaLogin {
  token: string;
  rol: 'admin' | 'profesor' | 'alumno';
}

export interface CargaUsuario {
  id: number;
  rol: 'admin' | 'profesor' | 'alumno';
}

@Injectable({ providedIn: 'root' })
export class ServicioAutenticacion {
  private readonly CLAVE_TOKEN = 'jwt_token';
  private readonly CLAVE_ROL = 'user_role';
  private readonly CLAVE_USUARIO_ID = 'user_id';
  private readonly URL_API = '/api/usuarios/login';

  constructor(private http: HttpClient, private router: Router) {}

  iniciarSesion(email: string, password: string): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(this.URL_API, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.CLAVE_TOKEN, res.token);
        localStorage.setItem(this.CLAVE_ROL, res.rol);
        // Decode token to extract user id
        const payload = this.decodificarToken(res.token);
        if (payload?.id) {
          localStorage.setItem(this.CLAVE_USUARIO_ID, String(payload.id));
        }
      })
    );
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.CLAVE_TOKEN);
    localStorage.removeItem(this.CLAVE_ROL);
    localStorage.removeItem(this.CLAVE_USUARIO_ID);
    this.router.navigate(['/login']);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.CLAVE_TOKEN);
  }

  obtenerRol(): string | null {
    return localStorage.getItem(this.CLAVE_ROL);
  }

  obtenerUsuarioId(): number | null {
    const id = localStorage.getItem(this.CLAVE_USUARIO_ID);
    return id ? Number(id) : null;
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  redirigirAlPanel(): void {
    const role = this.obtenerRol();
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'profesor':
        this.router.navigate(['/docentes']);
        break;
      case 'alumno':
        this.router.navigate(['/estudiantes']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  private decodificarToken(token: string): CargaUsuario | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
}
