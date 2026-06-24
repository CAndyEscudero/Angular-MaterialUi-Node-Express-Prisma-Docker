import { Anuncio } from '../../../servicios/anuncios.service';

export { Anuncio };

// ── Form view model ──

export interface AnuncioFormModel {
  titulo: string;
  contenido: string;
  tipo: 'general' | 'materia';
  materia_id: number | null;
  rol_destino: 'todos' | 'admin' | 'profesor' | 'alumno';
  estado: 'borrador' | 'publicado' | 'archivado';
}

// ── Factory ──

export function crearAnuncioFormModel(): AnuncioFormModel {
  return {
    titulo: '',
    contenido: '',
    tipo: 'general',
    materia_id: null,
    rol_destino: 'todos',
    estado: 'borrador',
  };
}

// ── Formato ──

export function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    borrador: 'Borrador',
    publicado: 'Publicado',
    archivado: 'Archivado',
  };
  return map[estado] || estado;
}

export function estadoBadgeClass(estado: string): string {
  const map: Record<string, string> = {
    borrador: 'status-draft',
    publicado: 'status-published',
    archivado: 'status-archived',
  };
  return map[estado] || '';
}

export function rolDestinoLabel(rol: string): string {
  const map: Record<string, string> = {
    todos: 'Todos',
    admin: 'Administradores',
    profesor: 'Profesores',
    alumno: 'Alumnos',
  };
  return map[rol] || rol;
}
