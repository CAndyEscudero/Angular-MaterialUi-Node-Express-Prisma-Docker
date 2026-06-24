import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'profesor' | 'alumno';
  creado_en: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly URL_API = '/api/usuarios';

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.URL_API);
  }

  crear(data: { nombre: string; email: string; password: string; rol: string }): Observable<Usuario> {
    return this.http.post<Usuario>(this.URL_API, data);
  }

  actualizar(id: number, data: { nombre?: string; email?: string; rol?: string }): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.URL_API}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.URL_API}/${id}`);
  }
}
