import {
  InscripcionCarrera,
  Documento,
} from '../../../servicios/inscripciones-carrera.service';

export { InscripcionCarrera, Documento };

// ── Pure formatting utilities (extracted for reuse across child components) ──

export function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'aprobada':
      return 'status-aprobada';
    case 'rechazada':
      return 'status-rechazada';
    case 'cancelada':
      return 'status-cancelada';
    default:
      return 'status-pendiente';
  }
}

export function estadoLabel(estado: string): string {
  switch (estado) {
    case 'aprobada':
      return 'Aprobada';
    case 'rechazada':
      return 'Rechazada';
    case 'cancelada':
      return 'Cancelada';
    default:
      return 'Pendiente';
  }
}

export function formatearBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
