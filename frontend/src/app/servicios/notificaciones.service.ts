import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, of } from 'rxjs';
import { switchMap, shareReplay, catchError } from 'rxjs/operators';

export interface Notificacion {
  id: number;
  usuario_id: number;
  titulo: string;
  mensaje: string | null;
  tipo: 'sistema' | 'inscripcion' | 'nota' | 'examen' | 'carrera' | 'anuncio';
  referencia_id: number | null;
  referencia_tipo: string | null;
  leida: boolean | number;
  creada_en: string;
}

export interface ListarResponse {
  notificaciones: Notificacion[];
  total: number;
  noLeidas: number;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly URL_API = '/api/notificaciones';

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, limite: number = 20): Observable<ListarResponse> {
    return this.http.get<ListarResponse>(
      `${this.URL_API}?pagina=${pagina}&limite=${limite}`
    );
  }

  contarNoLeidas(): Observable<{ cantidad: number }> {
    return this.http.get<{ cantidad: number }>(`${this.URL_API}/no-leidas`);
  }

  /** Polling cada 30s del contador de no leídas — tolerante a errores HTTP */
  pollingNoLeidas$ = interval(30000).pipe(
    switchMap(() =>
      this.contarNoLeidas().pipe(
        catchError((err) => {
          console.warn('[Notificaciones] Error en polling de no leídas, continuando…', err);
          return of({ cantidad: 0 });
        })
      )
    ),
    shareReplay(1)
  );

  marcarLeida(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.URL_API}/${id}/leer`, {});
  }

  marcarTodasLeidas(): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.URL_API}/leer-todas`, {});
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.URL_API}/${id}`);
  }
}
