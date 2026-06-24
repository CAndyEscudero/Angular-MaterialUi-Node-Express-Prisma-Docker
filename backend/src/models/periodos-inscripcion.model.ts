import { pool } from "../config/db";

export interface PeriodoInscripcion {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: number;
  carrera_id: number | null;
  anio_academico: number | null;
  cuatrimestre: number | null;
  created_at: string;
}

export interface PeriodoStatus {
  abierto: boolean;
  periodo?: PeriodoInscripcion;
  mensaje?: string;
}

/**
 * Verifica si hay al menos un período de inscripción abierto
 * en la fecha y hora actuales.
 *
 * Regla de negocio:
 *   - activo = 1
 *   - NOW() BETWEEN fecha_inicio AND fecha_fin (inclusive)
 *
 * Retorna true si hay un período abierto, false en caso contrario.
 */
export async function hayPeriodoAbierto(): Promise<boolean> {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count
     FROM periodos_inscripcion
     WHERE activo = 1
       AND CURDATE() >= fecha_inicio
       AND CURDATE() <= fecha_fin`,
    []
  );
  return (rows as any[])[0].count > 0;
}

/**
 * Obtiene el período de inscripción actualmente abierto.
 * Retorna null si no hay ningún período activo en la fecha actual.
 */
export async function obtenerPeriodoActual(): Promise<PeriodoInscripcion | null> {
  const [rows] = await pool.query(
    `SELECT *
     FROM periodos_inscripcion
     WHERE activo = 1
       AND CURDATE() >= fecha_inicio
       AND CURDATE() <= fecha_fin
     LIMIT 1`,
    []
  );
  const result = (rows as any[])[0];
  return result || null;
}

// ── CRUD data types ──

export interface CrearPeriodoData {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo?: number;
  carrera_id?: number | null;
  anio_academico?: number | null;
  cuatrimestre?: number | null;
}

// ── CRUD operations ──

export async function obtenerTodos(): Promise<PeriodoInscripcion[]> {
  const [rows] = await pool.query(
    "SELECT * FROM periodos_inscripcion ORDER BY fecha_inicio DESC"
  );
  return rows as PeriodoInscripcion[];
}

export async function obtenerPorId(id: number): Promise<PeriodoInscripcion | null> {
  const [rows] = await pool.query(
    "SELECT * FROM periodos_inscripcion WHERE id = ?",
    [id]
  );
  return (rows as any[])[0] || null;
}

export async function crearPeriodo(data: CrearPeriodoData): Promise<number> {
  const [result] = await pool.query<any>(
    `INSERT INTO periodos_inscripcion (nombre, fecha_inicio, fecha_fin, activo, carrera_id, anio_academico, cuatrimestre)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.nombre,
      data.fecha_inicio,
      data.fecha_fin,
      data.activo ?? 1,
      data.carrera_id ?? null,
      data.anio_academico ?? null,
      data.cuatrimestre ?? null,
    ]
  );
  return result.insertId;
}

export async function actualizarPeriodo(id: number, data: Partial<CrearPeriodoData>): Promise<boolean> {
  const updates: string[] = [];
  const values: any[] = [];

  const fields: (keyof CrearPeriodoData)[] = ['nombre', 'fecha_inicio', 'fecha_fin', 'activo', 'carrera_id', 'anio_academico', 'cuatrimestre'];
  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (updates.length === 0) return false;

  values.push(id);
  const [result] = await pool.query<any>(
    `UPDATE periodos_inscripcion SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
}

export async function eliminarPeriodo(id: number): Promise<boolean> {
  const [result] = await pool.query<any>(
    "DELETE FROM periodos_inscripcion WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Retorna el estado actual del período de inscripción.
 * Útil para el endpoint GET /api/inscripciones/periodo-actual.
 */
export async function getPeriodoStatus(): Promise<PeriodoStatus> {
  const periodo = await obtenerPeriodoActual();

  if (!periodo) {
    return {
      abierto: false,
      mensaje: "No hay un período de inscripción abierto en este momento",
    };
  }

  return {
    abierto: true,
    periodo,
    mensaje: `Período de inscripción abierto: ${periodo.nombre}`,
  };
}
