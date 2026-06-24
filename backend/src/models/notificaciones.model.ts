import { pool } from "../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface Notificacion {
  id: number;
  usuario_id: number;
  titulo: string;
  mensaje: string | null;
  tipo: 'sistema' | 'inscripcion' | 'nota' | 'examen' | 'carrera' | 'anuncio';
  referencia_id: number | null;
  referencia_tipo: string | null;
  leida: boolean;
  creada_en: string;
}

export interface CrearNotificacionData {
  usuario_id: number;
  titulo: string;
  mensaje?: string;
  tipo: Notificacion["tipo"];
  referencia_id?: number;
  referencia_tipo?: string;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

export async function crearNotificacion(data: CrearNotificacionData): Promise<number> {
  const ids = await crearNotificaciones([data]);
  return ids[0];
}

export async function crearNotificaciones(
  datos: CrearNotificacionData[]
): Promise<number[]> {
  if (datos.length === 0) return [];

  const values = datos.map((d) => [
    d.usuario_id,
    d.titulo,
    d.mensaje || null,
    d.tipo,
    d.referencia_id || null,
    d.referencia_tipo || null,
  ]);

  const placeholders = datos.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
  const flatValues = ([] as any[]).concat(...values);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, referencia_id, referencia_tipo)
     VALUES ${placeholders}`,
    flatValues
  );

  // Return the IDs of the first and last inserted
  if (datos.length === 1) return [result.insertId];

  const ids: number[] = [];
  for (let i = 0; i < datos.length; i++) {
    ids.push(result.insertId + i);
  }
  return ids;
}

// ──────────────────────────────────────────────
// List notifications for a user (paginated)
// ──────────────────────────────────────────────

export async function listar(
  usuarioId: number,
  pagina: number = 1,
  limite: number = 20
): Promise<{ notificaciones: Notificacion[]; total: number; noLeidas: number }> {
  const offset = (pagina - 1) * limite;

  const [countRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = ?",
    [usuarioId]
  );
  const total = countRows[0].total;

  const [noLeidasRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = ? AND leida = 0",
    [usuarioId]
  );
  const noLeidas = noLeidasRows[0].total;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM notificaciones
     WHERE usuario_id = ?
     ORDER BY creada_en DESC
     LIMIT ? OFFSET ?`,
    [usuarioId, limite, offset]
  );

  return {
    notificaciones: rows as Notificacion[],
    total,
    noLeidas,
  };
}

// ──────────────────────────────────────────────
// Count unread notifications for a user
// ──────────────────────────────────────────────

export async function contarNoLeidas(usuarioId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = ? AND leida = 0",
    [usuarioId]
  );
  return rows[0].total;
}

// ──────────────────────────────────────────────
// Mark a single notification as read
// ──────────────────────────────────────────────

export async function marcarLeida(id: number, usuarioId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?",
    [id, usuarioId]
  );
  return result.affectedRows > 0;
}

// ──────────────────────────────────────────────
// Mark all notifications as read for a user
// ──────────────────────────────────────────────

export async function marcarTodasLeidas(usuarioId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE notificaciones SET leida = 1 WHERE usuario_id = ? AND leida = 0",
    [usuarioId]
  );
  return result.affectedRows > 0;
}

// ──────────────────────────────────────────────
// Delete a notification
// ──────────────────────────────────────────────

export async function eliminar(id: number, usuarioId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?",
    [id, usuarioId]
  );
  return result.affectedRows > 0;
}

// ──────────────────────────────────────────────
// Get alumnos enrolled in a materia (for broadcasting)
// ──────────────────────────────────────────────

export async function obtenerAlumnosPorMateria(materiaId: number): Promise<{ id: number; usuario_id: number }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT a.id, a.usuario_id
     FROM inscripciones i
     JOIN alumnos a ON i.alumno_id = a.id
     WHERE i.materia_id = ?`,
    [materiaId]
  );
  return rows as { id: number; usuario_id: number }[];
}

// ──────────────────────────────────────────────
// Get all alumnos (for broadcasting to all students)
// ──────────────────────────────────────────────

export async function obtenerTodosLosAlumnos(): Promise<{ id: number; usuario_id: number }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, usuario_id FROM alumnos WHERE usuario_id IS NOT NULL"
  );
  return rows as { id: number; usuario_id: number }[];
}

// ──────────────────────────────────────────────
// Get all profesores (for broadcasting to all professors)
// ──────────────────────────────────────────────

export async function obtenerTodosLosProfesores(): Promise<{ id: number; usuario_id: number }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, usuario_id FROM profesores WHERE usuario_id IS NOT NULL"
  );
  return rows as { id: number; usuario_id: number }[];
}
