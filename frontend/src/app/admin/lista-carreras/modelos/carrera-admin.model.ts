import { Carrera } from '../../../servicios/carreras.service';

export { Carrera };

// ── Form view model ──

export interface CarreraFormModel {
  nombre: string;
  codigo: string;
  descripcion: string;
  duracion_anios: number;
}

// ── Factory ──

export function crearCarreraFormModel(): CarreraFormModel {
  return {
    nombre: '',
    codigo: '',
    descripcion: '',
    duracion_anios: 5,
  };
}

// ── Helpers ──

export function estadoBadgeClass(activa: number | boolean): string {
  return activa ? 'active-status' : 'inactive-status';
}

export function estadoLabel(activa: number | boolean): string {
  return activa ? 'Activa' : 'Inactiva';
}
