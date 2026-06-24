import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Inscripcion {
  id: number;
  alumno_id: number;
  materia_id: number;
  nota: number | null;
  fecha_inscripcion: string;
  materia_nombre?: string;
  materia_codigo?: string;
  alumno_nombre?: string;
  alumno_email?: string;
}

export interface PeriodoInscripcion {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: number;
  carrera_id: number | null;
  anio_academico: number | null;
  cuatrimestre: number | null;
}

export interface PeriodoStatus {
  abierto: boolean;
  periodo?: PeriodoInscripcion;
  mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class InscripcionesService {
  private readonly URL_API = '/api/inscripciones';

  constructor(private http: HttpClient) {}

  crear(materiaId: number): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(this.URL_API, { materia_id: materiaId });
  }

  obtenerPorAlumno(alumnoId: number): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.URL_API}/alumno/${alumnoId}`);
  }

  obtenerMias(): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.URL_API}/mias`);
  }

  obtenerPorMateria(materiaId: number): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.URL_API}/materia/${materiaId}`);
  }

  obtenerPeriodoActual(): Observable<PeriodoStatus> {
    return this.http.get<PeriodoStatus>(`${this.URL_API}/periodo-actual`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.URL_API}/${id}`);
  }

  setNota(id: number, nota: number): Observable<Inscripcion> {
    return this.http.put<Inscripcion>(`${this.URL_API}/${id}/nota`, { nota });
  }
}
