import { PeriodoInscripcion } from '../../../servicios/periodos-inscripcion.service';

export { PeriodoInscripcion };

// ── Admin view model ──

export interface PeriodoAdmin {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  carrera_id: number | null;
  anio_academico: number | null;
  cuatrimestre: number | null;
}

// ── Factory / Mapper ──

export function desdeApi(data: PeriodoInscripcion): PeriodoAdmin {
  return {
    id: data.id,
    nombre: data.nombre,
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin,
    activo: data.activo === 1,
    carrera_id: data.carrera_id,
    anio_academico: data.anio_academico,
    cuatrimestre: data.cuatrimestre,
  };
}

// ── Format helpers ──

export function cuatrimestreLabel(cuatrimestre: number | null): string {
  if (!cuatrimestre) return '—';
  return `${cuatrimestre}° Cuatrimestre`;
}

export function estadoBadgeClass(activo: boolean): string {
  return activo ? 'active-status' : 'inactive-status';
}

export function estadoLabel(activo: boolean): string {
  return activo ? 'Activo' : 'Inactivo';
}
