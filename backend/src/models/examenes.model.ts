import { pool } from "../config/db";
import { ResultSetHeader } from "mysql2";

export interface Examen {
  id: number;
  materia_id: number;
  nombre: string;
  tipo: 'parcial' | 'final' | 'recuperatorio' | 'otro';
  fecha: string;
  hora: string | null;
  aula: string | null;
  created_at: string;
  materia_nombre?: string;
  materia_codigo?: string;
}

export interface CrearExamenData {
  materia_id: number;
  nombre: string;
  tipo: 'parcial' | 'final' | 'recuperatorio' | 'otro';
  fecha: string;
  hora?: string | null;
  aula?: string | null;
}

// Get all exams (admin)
export async function obtenerTodos(): Promise<Examen[]> {
  const [rows] = await pool.query(
    `SELECT e.*, m.nombre as materia_nombre, m.codigo as materia_codigo
     FROM examenes e
     JOIN materias m ON e.materia_id = m.id
     ORDER BY e.fecha DESC`
  );
  return rows as Examen[];
}

// Get exams for a specific materia
export async function obtenerPorMateria(materiaId: number): Promise<Examen[]> {
  const [rows] = await pool.query(
    `SELECT e.*, m.nombre as materia_nombre, m.codigo as materia_codigo
     FROM examenes e
     JOIN materias m ON e.materia_id = m.id
     WHERE e.materia_id = ?
     ORDER BY e.fecha DESC`,
    [materiaId]
  );
  return rows as Examen[];
}

// Get exams for a professor's materias
export async function obtenerPorProfesor(profesorId: number): Promise<Examen[]> {
  const [rows] = await pool.query(
    `SELECT e.*, m.nombre as materia_nombre, m.codigo as materia_codigo
     FROM examenes e
     JOIN materias m ON e.materia_id = m.id
     WHERE m.profesor_id = ?
     ORDER BY e.fecha DESC`,
    [profesorId]
  );
  return rows as Examen[];
}

// Get exams for a student's enrolled materias
export async function obtenerPorAlumno(alumnoId: number): Promise<Examen[]> {
  const [rows] = await pool.query(
    `SELECT DISTINCT e.*, m.nombre as materia_nombre, m.codigo as materia_codigo
     FROM examenes e
     JOIN materias m ON e.materia_id = m.id
     JOIN inscripciones i ON i.materia_id = e.materia_id
     WHERE i.alumno_id = ?
     ORDER BY e.fecha ASC`,
    [alumnoId]
  );
  return rows as Examen[];
}

// Get single exam
export async function obtenerPorId(id: number): Promise<Examen | null> {
  const [rows] = await pool.query(
    `SELECT e.*, m.nombre as materia_nombre, m.codigo as materia_codigo
     FROM examenes e
     JOIN materias m ON e.materia_id = m.id
     WHERE e.id = ?`,
    [id]
  );
  return (rows as any[])[0] || null;
}

// Create exam
export async function crearExamen(data: CrearExamenData): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO examenes (materia_id, nombre, tipo, fecha, hora, aula)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.materia_id, data.nombre, data.tipo, data.fecha, data.hora || null, data.aula || null]
  );
  return result.insertId;
}

// Update exam
export async function actualizarExamen(id: number, data: Partial<CrearExamenData>): Promise<boolean> {
  const updates: string[] = [];
  const values: any[] = [];

  const fields: (keyof CrearExamenData)[] = ['materia_id', 'nombre', 'tipo', 'fecha', 'hora', 'aula'];
  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }
  if (updates.length === 0) return false;

  values.push(id);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE examenes SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
}

// Delete exam
export async function eliminarExamen(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM examenes WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

// Verify professor owns the materia
export async function profesorEsDuenoMateria(profesorId: number, materiaId: number): Promise<boolean> {
  const [rows] = await pool.query(
    "SELECT id FROM materias WHERE id = ? AND profesor_id = ?",
    [materiaId, profesorId]
  );
  return (rows as any[]).length > 0;
}
