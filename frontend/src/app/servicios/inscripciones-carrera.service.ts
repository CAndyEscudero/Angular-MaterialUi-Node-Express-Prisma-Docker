import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Documento {
  id: number;
  tipo_documento: string;
  nombre_archivo_original: string;
  mime_type: string | null;
  tamanio_bytes: number | null;
  fecha_subida: string;
}

export interface InscripcionCarrera {
  id: number;
  alumno_id: number;
  carrera_id: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  fecha_solicitud: string;
  fecha_revision: string | null;
  revisado_por: number | null;
  motivo_rechazo: string | null;
  alumno_nombre?: string;
  alumno_email?: string;
  alumno_legajo?: string;
  carrera_nombre?: string;
  carrera_codigo?: string;
  documentos?: Documento[];
}

@Injectable({ providedIn: 'root' })
export class InscripcionesCarreraService {
  private readonly URL_API = '/api/inscripciones-carrera';

  constructor(private http: HttpClient) {}

  /** Student: get own application */
  obtenerMiSolicitud(): Observable<InscripcionCarrera | null> {
    return this.http.get<InscripcionCarrera | null>(
      `${this.URL_API}/mi-solicitud`
    );
  }

  /** Student: apply to a carrera with documents */
  solicitar(
    carreraId: number,
    documentos: { tipo: string; archivo: File }[]
  ): Observable<{ message: string; id: number }> {
    const formData = new FormData();
    formData.append('carrera_id', String(carreraId));

    for (const doc of documentos) {
      formData.append(doc.tipo, doc.archivo);
    }

    return this.http.post<{ message: string; id: number }>(
      `${this.URL_API}/solicitar`,
      formData
    );
  }

  /** Admin: list all applications (optional estado filter) */
  obtenerTodas(estado?: string): Observable<InscripcionCarrera[]> {
    const params = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    return this.http.get<InscripcionCarrera[]>(`${this.URL_API}${params}`);
  }

  /** Admin: get application detail */
  obtenerPorId(id: number): Observable<InscripcionCarrera> {
    return this.http.get<InscripcionCarrera>(`${this.URL_API}/${id}`);
  }

  /** Admin: approve/reject application */
  revisar(
    id: number,
    estado: 'aprobada' | 'rechazada',
    motivoRechazo?: string
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.URL_API}/${id}/revisar`,
      { estado, motivo_rechazo: motivoRechazo || null }
    );
  }

  /** Get document download URL */
  obtenerUrlDocumento(docId: number): string {
    return `${this.URL_API}/documentos/${docId}`;
  }

  descargarDocumento(docId: number): Observable<Blob> {
    return this.http.get(`${this.URL_API}/documentos/${docId}`, {
      responseType: 'blob',
    });
  }
}
