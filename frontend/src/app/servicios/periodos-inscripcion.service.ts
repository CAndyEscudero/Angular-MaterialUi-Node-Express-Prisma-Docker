import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PeriodoInscripcion {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: number;
  carrera_id: number | null;
  anio_academico: number | null;
  cuatrimestre: number | null;
  created_at: string;
}

export interface CrearPeriodoData {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo?: number;
  carrera_id?: number | null;
  anio_academico?: number | null;
  cuatrimestre?: number | null;
}

@Injectable({ providedIn: 'root' })
export class PeriodosInscripcionService {
  private readonly URL_API = '/api/periodos-inscripcion';

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<PeriodoInscripcion[]> {
    return this.http.get<PeriodoInscripcion[]>(this.URL_API);
  }

  obtenerPorId(id: number): Observable<PeriodoInscripcion> {
    return this.http.get<PeriodoInscripcion>(`${this.URL_API}/${id}`);
  }

  crear(data: CrearPeriodoData): Observable<{ message: string; periodo: PeriodoInscripcion }> {
    return this.http.post<{ message: string; periodo: PeriodoInscripcion }>(this.URL_API, data);
  }

  actualizar(id: number, data: Partial<CrearPeriodoData>): Observable<{ message: string; periodo: PeriodoInscripcion }> {
    return this.http.put<{ message: string; periodo: PeriodoInscripcion }>(`${this.URL_API}/${id}`, data);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.URL_API}/${id}`);
  }
}
