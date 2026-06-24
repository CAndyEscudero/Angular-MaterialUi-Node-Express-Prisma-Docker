import { pool } from "../config/db";

// Create a professor profile linked to a usuario
export async function crearProfesor(usuario_id: number, especialidad?: string) {
  const [result] = await pool.query(
    "INSERT INTO profesores (usuario_id, especialidad) VALUES (?, ?)",
    [usuario_id, especialidad || null]
  );
  return result;
}

// Get professor profile by usuario_id
export async function obtenerProfesorPorUsuarioId(usuario_id: number) {
  const [rows] = await pool.query(
    "SELECT * FROM profesores WHERE usuario_id = ?",
    [usuario_id]
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// Get all professors with user info
export async function obtenerProfesores() {
  const [rows] = await pool.query(
    `SELECT p.id, p.usuario_id, p.especialidad, u.nombre, u.email
     FROM profesores p
     JOIN usuarios u ON p.usuario_id = u.id`
  );
  return rows;
}
