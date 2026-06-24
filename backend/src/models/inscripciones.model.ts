import { pool } from "../config/db";
import { ResultSetHeader } from "mysql2";
import { obtenerCorrelatividades, CorrelativaInfo } from "./materias.model";

// Count active enrollments for a subject
export async function contarInscripcionesPorMateria(materia_id: number): Promise<number> {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as count FROM inscripciones WHERE materia_id = ?",
    [materia_id]
  );
  return (rows as any[])[0].count;
}

// Create enrollment (student enrolls in a subject)
export async function crearInscripcion(alumno_id: number, materia_id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO inscripciones (alumno_id, materia_id) VALUES (?, ?)",
    [alumno_id, materia_id]
  );
  return result;
}

// Get all enrollments for a student, joined with materia details
export async function obtenerInscripcionesPorAlumno(alumno_id: number) {
  const [rows] = await pool.query(
    `SELECT i.id, i.alumno_id, i.materia_id, i.nota, i.fecha_inscripcion,
            m.nombre as materia_nombre, m.codigo as materia_codigo
     FROM inscripciones i
     JOIN materias m ON i.materia_id = m.id
     WHERE i.alumno_id = ?`,
    [alumno_id]
  );
  return rows;
}

// Get all enrollments for a subject, joined with alumno and user details
export async function obtenerInscripcionesPorMateria(materia_id: number) {
  const [rows] = await pool.query(
    `SELECT i.id, i.alumno_id, i.materia_id, i.nota, i.fecha_inscripcion,
            a.carrera, u.nombre, u.email
     FROM inscripciones i
     JOIN alumnos a ON i.alumno_id = a.id
     JOIN usuarios u ON a.usuario_id = u.id
     WHERE i.materia_id = ?`,
    [materia_id]
  );
  return rows;
}

// Delete enrollment by id
export async function eliminarInscripcion(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM inscripciones WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

// Set/update grade (nota) for an enrollment
export async function actualizarNota(id: number, nota: number | null) {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE inscripciones SET nota = ? WHERE id = ?",
    [nota, id]
  );
  return result.affectedRows > 0;
}

// ── Correlatividades validation ───────────────────────────────

export interface CorrelativaFaltante {
  id: number;
  nombre: string;
  codigo: string;
  tipo: 'regular' | 'analitica';
}

export interface VerificacionCorrelativas {
  ok: boolean;
  faltantes: CorrelativaFaltante[];
}

/**
 * Verifica si un alumno cumple con todas las correlativas
 * de una materia.
 *
 * Reglas de aprobación:
 *   - 'regular':   el alumno tiene inscripción activa o aprobada
 *                   en la materia correlativa (está cursando o ya
 *                   la cursó).
 *   - 'analitica': el alumno tiene la materia correlativa aprobada
 *                   con nota >= 60 (o estado = 'aprobada').
 *
 * Si la materia no tiene correlativas configuradas,
 * retorna { ok: true, faltantes: [] }.
 */
export async function verificarCorrelatividades(
  alumnoId: number,
  materiaId: number
): Promise<VerificacionCorrelativas> {
  const correlativas = await obtenerCorrelatividades(materiaId);
  if (correlativas.length === 0) {
    return { ok: true, faltantes: [] };
  }

  // Obtener TODAS las inscripciones del alumno de una vez
  const [inscripciones] = await pool.query(
    `SELECT materia_id, nota, estado FROM inscripciones WHERE alumno_id = ?`,
    [alumnoId]
  );
  const inscMap = new Map<number, any>();
  for (const row of inscripciones as any[]) {
    inscMap.set(row.materia_id, row);
  }

  const faltantes: CorrelativaFaltante[] = [];

  for (const corr of correlativas) {
    const insc = inscMap.get(corr.id);
    let cumple = false;

    if (corr.tipo === 'regular') {
      // Regular: el alumno tiene/hizo la materia
      cumple = !!(insc && (insc.estado === 'activa' || insc.estado === 'aprobada'));
    } else if (corr.tipo === 'analitica') {
      // Analítica: el alumno aprobó la materia (nota >= 60)
      cumple = !!(insc && (insc.estado === 'aprobada' || (insc.nota !== null && insc.nota >= 60)));
    }

    if (!cumple) {
      faltantes.push({
        id: corr.id,
        nombre: corr.nombre,
        codigo: corr.codigo,
        tipo: corr.tipo,
      });
    }
  }

  return { ok: faltantes.length === 0, faltantes };
}
