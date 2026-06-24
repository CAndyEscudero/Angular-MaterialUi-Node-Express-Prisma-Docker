import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CorrelativaInfo {
  id: number;
  nombre: string;
  codigo: string;
  tipo: 'regular' | 'analitica';
}

export interface Materia {
  id: number;
  nombre: string;
  codigo: string;
  profesor_id: number;
  profesor_nombre: string;
  descripcion?: string;
  cuatrimestre?: string;
  anio?: number;
  carrera?: string;
  carrera_id?: number;
  carrera_nombre?: string;
  dia_horario?: string;
  cupo_maximo?: number;
  aula?: string;
  modalidad?: string;
  estado?: string;
  creditos?: number;
  anio_carrera?: number;
  created_at?: string;
  inscriptos_count?: number;
  cupos_disponibles?: number | null;
  correlativas?: CorrelativaInfo[];
}

export interface CrearMateriaData {
  nombre: string;
  codigo: string;
  profesor_id: number;
  descripcion?: string;
  cuatrimestre?: string;
  anio?: number;
  carrera?: string;
  carrera_id?: number;
  dia_horario?: string;
  cupo_maximo?: number;
  aula?: string;
  modalidad?: string;
  estado?: string;
  creditos?: number;
  anio_carrera?: number;
}

@Injectable({ providedIn: 'root' })
export class MateriasService {
  private readonly URL_API = '/api/materias';

  constructor(private http: HttpClient) {}

  obtenerTodas(profesorId?: number): Observable<Materia[]> {
    let params = new HttpParams();
    if (profesorId) {
      params = params.set('profesor_id', String(profesorId));
    }
    return this.http.get<Materia[]>(this.URL_API, { params });
  }

  obtenerPorId(id: number): Observable<Materia> {
    return this.http.get<Materia>(`${this.URL_API}/${id}`);
  }

  crear(data: CrearMateriaData): Observable<{ message: string; materia: Materia }> {
    return this.http.post<{ message: string; materia: Materia }>(this.URL_API, data);
  }

  actualizar(
    id: number,
    data: Partial<CrearMateriaData>
  ): Observable<{ message: string; materia: Materia }> {
    return this.http.put<{ message: string; materia: Materia }>(
      `${this.URL_API}/${id}`,
      data
    );
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.URL_API}/${id}`);
  }
}
