import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MateriaProfesor {
  id: number;
  nombre: string;
  codigo: string;
  inscriptos_count: number;
  notas_pendientes: number;
}

export interface ProfesorResumen {
  totalMaterias: number;
  totalEstudiantes: number;
  notasPendientes: number;
  materias: MateriaProfesor[];
}

@Injectable({ providedIn: 'root' })
export class MateriasProfesorService {
  private readonly URL_API = '/api/materias/profesor/mis-datos';

  constructor(private http: HttpClient) {}

  obtenerMiResumen(): Observable<ProfesorResumen> {
    return this.http.get<ProfesorResumen>(this.URL_API);
  }
}
