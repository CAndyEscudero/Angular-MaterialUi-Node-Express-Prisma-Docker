import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Carrera {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  duracion_anios: number;
  activa: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CarrerasService {
  private readonly URL_API = '/api/carreras';

  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<Carrera[]> {
    return this.http.get<Carrera[]>(this.URL_API);
  }

  obtenerPorId(id: number): Observable<Carrera> {
    return this.http.get<Carrera>(`${this.URL_API}/${id}`);
  }

  crear(data: {
    nombre: string;
    codigo: string;
    descripcion?: string;
    duracion_anios?: number;
  }): Observable<{ message: string; carrera: Carrera }> {
    return this.http.post<{ message: string; carrera: Carrera }>(this.URL_API, data);
  }

  actualizar(
    id: number,
    data: {
      nombre?: string;
      codigo?: string;
      descripcion?: string;
      duracion_anios?: number;
      activa?: number;
    }
  ): Observable<{ message: string; carrera: Carrera }> {
    return this.http.put<{ message: string; carrera: Carrera }>(
      `${this.URL_API}/${id}`,
      data
    );
  }

  eliminar(id: number, force?: boolean): Observable<{ message: string }> {
    const params = force ? '?force=true' : '';
    return this.http.delete<{ message: string }>(
      `${this.URL_API}/${id}${params}`
    );
  }
}
