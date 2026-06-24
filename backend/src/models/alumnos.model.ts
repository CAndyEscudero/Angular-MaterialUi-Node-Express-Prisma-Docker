import { pool } from "../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface AlumnoRow extends RowDataPacket {
  id: number;
  usuario_id: number;
  carrera: string | null;
  carrera_id: number | null;
  legajo: string | null;
  nombre?: string;
  email?: string;
  carrera_nombre?: string;
}

// Create a student profile linked to a usuario
export async function crearAlumno(usuario_id: number, carrera?: string) {
  const [result] = await pool.query(
    "INSERT INTO alumnos (usuario_id, carrera) VALUES (?, ?)",
    [usuario_id, carrera || null]
  );
  return result;
}

// Get student profile by usuario_id
export async function obtenerAlumnoPorUsuarioId(usuario_id: number) {
  const [rows] = await pool.query<AlumnoRow[]>(
    `SELECT a.id, a.usuario_id, a.carrera, a.carrera_id, a.legajo,
            u.nombre, u.email, c.nombre as carrera_nombre
     FROM alumnos a
     JOIN usuarios u ON a.usuario_id = u.id
     LEFT JOIN carreras c ON a.carrera_id = c.id
     WHERE a.usuario_id = ?`,
    [usuario_id]
  );
  return rows.length > 0 ? rows[0] : null;
}

// Get all students with user info
export async function obtenerAlumnos() {
  const [rows] = await pool.query<AlumnoRow[]>(
    `SELECT a.id, a.usuario_id, a.carrera, a.carrera_id, a.legajo, u.nombre, u.email
     FROM alumnos a
     JOIN usuarios u ON a.usuario_id = u.id`
  );
  return rows;
}

// ──────────────────────────────────────────────
// Legajo generation helpers
// ──────────────────────────────────────────────

/**
 * Extrae el prefijo del código de carrera para el legajo.
 * Usa la parte antes del primer guión; si no hay guión,
 * usa caracteres alfanuméricos en mayúscula; fallback "ALU".
 *
 * Ejemplos:
 *   "LI-003"     -> "LI"
 *   "ING-SIS-01" -> "ING"
 *   "PROG"       -> "PROG"
 *   ""           -> "ALU"
 */
export function extraerPrefijoLegajo(codigoCarrera: string): string {
  if (!codigoCarrera || codigoCarrera.trim() === "") return "ALU";

  const hyphenIdx = codigoCarrera.indexOf("-");
  let prefijo: string;

  if (hyphenIdx > 0) {
    prefijo = codigoCarrera.substring(0, hyphenIdx).trim();
  } else {
    // Sin guión: tomar solo caracteres alfanuméricos en mayúscula
    prefijo = codigoCarrera.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  if (!prefijo || prefijo.length === 0) return "ALU";

  // Solo alfanumérico, mayúscula, máximo 10 caracteres
  prefijo = prefijo.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return prefijo.substring(0, 10);
}

/**
 * Obtiene el número secuencial más alto existente para un prefijo de legajo.
 * Ejemplo: si existen LI-00001, LI-00002, LI-00005, devuelve 5.
 * Si no existe ningún legajo con ese prefijo, devuelve 0.
 */
export async function obtenerMaxSecuenciaLegajo(prefijo: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT MAX(CAST(SUBSTRING(legajo, ?) AS UNSIGNED)) AS max_seq
     FROM alumnos
     WHERE legajo LIKE CONCAT(?, '-%')`,
    [prefijo.length + 2, prefijo] // +2 por el guión
  );
  return (rows[0] as any)?.max_seq || 0;
}

/**
 * Genera el siguiente legajo para un prefijo dado.
 * Formato: {prefijo}-{5 dígitos zero-padded}
 */
export async function generarLegajo(prefijo: string): Promise<string> {
  const maxSeq = await obtenerMaxSecuenciaLegajo(prefijo);
  const nextSeq = maxSeq + 1;
  return `${prefijo}-${String(nextSeq).padStart(5, "0")}`;
}

/**
 * Actualiza el legajo de un alumno.
 */
export async function actualizarLegajo(alumno_id: number, legajo: string): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE alumnos SET legajo = ? WHERE id = ?",
    [legajo, alumno_id]
  );
  return result.affectedRows > 0;
}
