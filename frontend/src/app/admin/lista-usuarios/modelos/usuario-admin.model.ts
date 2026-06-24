import { Usuario } from '../../../servicios/usuarios.service';

export { Usuario };

// ── Types ──

export type RolUsuario = 'admin' | 'profesor' | 'alumno';

// ── Form view model ──

export interface UsuarioFormModel {
  nombre: string;
  email: string;
  contrasena: string;
  rol: RolUsuario;
}

// ── Factory ──

export function crearUsuarioFormModel(): UsuarioFormModel {
  return {
    nombre: '',
    email: '',
    contrasena: '',
    rol: 'alumno',
  };
}

// ── Helpers ──

const ROL_LABELS: Record<RolUsuario, string> = {
  admin: 'Admin',
  profesor: 'Profesor',
  alumno: 'Alumno',
};

export function rolLabel(rol: string): string {
  return ROL_LABELS[rol as RolUsuario] || rol;
}

export function rolBadgeClass(rol: string): string {
  return rol; // 'admin', 'profesor', 'alumno' — used directly as CSS class
}
