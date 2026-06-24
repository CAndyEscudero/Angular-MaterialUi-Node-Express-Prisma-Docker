import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Anuncio {
  id: number;
  titulo: string;
  contenido: string;
  tipo: 'general' | 'materia';
  materia_id: number | null;
  materia_nombre?: string;
  creado_por: number;
  creador_nombre?: string;
  rol_destino: 'todos' | 'admin' | 'profesor' | 'alumno';
  estado: 'borrador' | 'publicado' | 'archivado';
  fecha_publicacion: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface CrearAnuncioData {
  titulo: string;
  contenido: string;
  tipo?: 'general' | 'materia';
  materia_id?: number | null;
  rol_destino?: 'todos' | 'admin' | 'profesor' | 'alumno';
  estado?: 'borrador' | 'publicado' | 'archivado';
  fecha_publicacion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AnunciosService {
  private readonly URL_API = '/api/anuncios';

  constructor(private http: HttpClient) {}

  /** Admin: listar todos los anuncios */
  listarTodos(): Observable<Anuncio[]> {
    return this.http.get<Anuncio[]>(`${this.URL_API}/admin`);
  }

  /** Obtener anuncios publicados visibles para el rol del usuario */
  obtenerPublicados(): Observable<Anuncio[]> {
    return this.http.get<Anuncio[]>(`${this.URL_API}/publicados`);
  }

  /** Obtener anuncio por ID */
  obtenerPorId(id: number): Observable<Anuncio> {
    return this.http.get<Anuncio>(`${this.URL_API}/${id}`);
  }

  /** Admin: crear anuncio */
  crear(data: CrearAnuncioData): Observable<{ message: string; anuncio: Anuncio }> {
    return this.http.post<{ message: string; anuncio: Anuncio }>(this.URL_API, data);
  }

  /** Actualizar anuncio (admin / profesor de su materia) */
  actualizar(id: number, data: Partial<CrearAnuncioData>): Observable<{ message: string; anuncio: Anuncio }> {
    return this.http.put<{ message: string; anuncio: Anuncio }>(
      `${this.URL_API}/${id}`,
      data
    );
  }

  /** Publicar anuncio (admin / profesor de su materia) */
  publicar(id: number): Observable<{ message: string; anuncio: Anuncio }> {
    return this.http.put<{ message: string; anuncio: Anuncio }>(
      `${this.URL_API}/${id}/publicar`,
      {}
    );
  }

  /** Archivar anuncio (admin / profesor de su materia) */
  archivar(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.URL_API}/${id}/archivar`,
      {}
    );
  }

  /** Eliminar anuncio (admin / profesor de su materia) */
  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.URL_API}/${id}`);
  }

  // ── Profesor/Admin: materia announcements ──────────────

  /** Obtener anuncios de materia del profesor/docente */
  obtenerDocente(): Observable<Anuncio[]> {
    return this.http.get<Anuncio[]>(`${this.URL_API}/docente`);
  }

  /** Crear anuncio de materia (profesor/admin) */
  crearMateria(data: {
    titulo: string;
    contenido: string;
    materia_id: number;
    estado?: 'borrador' | 'publicado';
  }): Observable<{ message: string; anuncio: Anuncio }> {
    return this.http.post<{ message: string; anuncio: Anuncio }>(
      `${this.URL_API}/materia`,
      data
    );
  }
}
