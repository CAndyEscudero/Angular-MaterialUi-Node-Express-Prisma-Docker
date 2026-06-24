import { Materia } from '../../../servicios/materias.service';
import { Carrera } from '../../../servicios/carreras.service';

export { Materia, Carrera };

// ── ProfesorItem (returned by GET /api/profesores) ──

export interface ProfesorItem {
  id: number;
  usuario_id: number;
  especialidad: string;
  nombre: string;
  email: string;
}

// ── Form view model ──

export interface MateriaFormModel {
  nombre: string;
  codigo: string;
  profesor_id: number;
  descripcion: string;
  cuatrimestre: string;
  anio: number;
  carrera: string;
  carrera_id: number;
  dia_horario: string;
  cupo_maximo: number;
  aula: string;
  modalidad: string;
  estado: string;
  creditos: number;
  anio_carrera: number;
}

// ── Factory ──

export function crearMateriaFormModel(): MateriaFormModel {
  return {
    nombre: '',
    codigo: '',
    profesor_id: 0,
    descripcion: '',
    cuatrimestre: '',
    anio: new Date().getFullYear(),
    carrera: '',
    carrera_id: 0,
    dia_horario: '',
    cupo_maximo: 0,
    aula: '',
    modalidad: 'presencial',
    estado: 'activa',
    creditos: 0,
    anio_carrera: 0,
  };
}

// ── Formato ──

export function cuatrimestreLabel(cuatrimestre: string): string {
  return cuatrimestre === '1' ? '1°C' : '2°C';
}

export function cuatrimestreDisplay(cuatrimestre: string | undefined): string {
  if (!cuatrimestre) return '-';
  return cuatrimestre === '1' ? '1°C' : '2°C';
}

export function estadoBadgeClass(estado: string | undefined): string {
  return estado === 'activa' ? 'active-status' : 'inactive-status';
}

export function estadoLabel(estado: string | undefined): string {
  return estado === 'activa' ? 'Activa' : 'Inactiva';
}
