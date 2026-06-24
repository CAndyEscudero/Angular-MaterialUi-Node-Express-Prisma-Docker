import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Examen {
  id: number;
  materia_id: number;
  nombre: string;
  tipo: 'parcial' | 'final' | 'recuperatorio' | 'otro';
  fecha: string;
  hora: string | null;
  aula: string | null;
  created_at: string;
  materia_nombre?: string;
  materia_codigo?: string;
}

export interface CrearExamenData {
  materia_id: number;
  nombre: string;
  tipo: 'parcial' | 'final' | 'recuperatorio' | 'otro';
  fecha: string;
  hora?: string | null;
  aula?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ExamenesService {
  private readonly URL_API = '/api/examenes';

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<Examen[]> {
    return this.http.get<Examen[]>(this.URL_API);
  }

  obtenerPorId(id: number): Observable<Examen> {
    return this.http.get<Examen>(`${this.URL_API}/${id}`);
  }

  crear(data: CrearExamenData): Observable<{ message: string; examen: Examen }> {
    return this.http.post<{ message: string; examen: Examen }>(this.URL_API, data);
  }

  actualizar(id: number, data: Partial<CrearExamenData>): Observable<{ message: string; examen: Examen }> {
    return this.http.put<{ message: string; examen: Examen }>(`${this.URL_API}/${id}`, data);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.URL_API}/${id}`);
  }
}
