import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PerfilAlumno {
  id: number;
  usuario_id: number;
  carrera: string | null;
  carrera_id: number | null;
  legajo: string | null;
  nombre: string;
  email: string;
  carrera_nombre: string | null;
}

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  private readonly URL_API = '/api/alumnos';

  constructor(private http: HttpClient) {}

  obtenerMiPerfil(): Observable<PerfilAlumno> {
    return this.http.get<PerfilAlumno>(`${this.URL_API}/mi-perfil`);
  }
}
