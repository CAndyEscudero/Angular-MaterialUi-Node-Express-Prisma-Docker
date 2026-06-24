import { pool } from "../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// ──────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────

export interface InscripcionCarrera {
  id: number;
  alumno_id: number;
  carrera_id: number;
  estado: "pendiente" | "aprobada" | "rechazada" | "cancelada";
  fecha_solicitud: Date;
  fecha_revision: Date | null;
  revisado_por: number | null;
  motivo_rechazo: string | null;
  // Joined fields
  alumno_nombre?: string;
  alumno_email?: string;
  alumno_legajo?: string;
  carrera_nombre?: string;
  carrera_codigo?: string;
  documentos?: any[];
}

interface InscripcionCarreraRow extends RowDataPacket, InscripcionCarrera {}

// ──────────────────────────────────────────────
// Student: get own application
// ──────────────────────────────────────────────

export async function obtenerPorAlumno(alumno_id: number) {
  const [rows] = await pool.query<InscripcionCarreraRow[]>(
    `SELECT ic.*, a.legajo as alumno_legajo,
            c.nombre as carrera_nombre, c.codigo as carrera_codigo
     FROM inscripciones_carrera ic
     JOIN alumnos a ON ic.alumno_id = a.id
     JOIN carreras c ON ic.carrera_id = c.id
     WHERE ic.alumno_id = ?`,
    [alumno_id]
  );

  if (rows.length === 0) return null;

  // Attach documents for the application
  const [docs] = await pool.query(
    `SELECT id, tipo_documento, nombre_archivo_original, mime_type, tamanio_bytes, fecha_subida
     FROM documentos_inscripcion
     WHERE inscripcion_carrera_id = ?`,
    [rows[0].id]
  );

  return { ...rows[0], documentos: docs };
}

// ──────────────────────────────────────────────
// Student: create application
// ──────────────────────────────────────────────

export async function crearSolicitud(alumno_id: number, carrera_id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO inscripciones_carrera (alumno_id, carrera_id) VALUES (?, ?)",
    [alumno_id, carrera_id]
  );
  return result.insertId;
}

// ──────────────────────────────────────────────
// Insert a document record
// ──────────────────────────────────────────────

export async function insertarDocumento(data: {
  inscripcion_carrera_id: number;
  tipo_documento: string;
  nombre_archivo_original: string;
  nombre_archivo_guardado: string;
  ruta_archivo: string;
  mime_type: string | null;
  tamanio_bytes: number | null;
}) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO documentos_inscripcion
     (inscripcion_carrera_id, tipo_documento, nombre_archivo_original,
      nombre_archivo_guardado, ruta_archivo, mime_type, tamanio_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.inscripcion_carrera_id,
      data.tipo_documento,
      data.nombre_archivo_original,
      data.nombre_archivo_guardado,
      data.ruta_archivo,
      data.mime_type,
      data.tamanio_bytes,
    ]
  );
  return result.insertId;
}

// ──────────────────────────────────────────────
// Admin: list all applications with filters
// ──────────────────────────────────────────────

export async function obtenerTodas(estado?: string) {
  let sql = `
    SELECT ic.*, a.id as alumno_id_ref, a.legajo as alumno_legajo,
           u.nombre as alumno_nombre, u.email as alumno_email,
           c.nombre as carrera_nombre, c.codigo as carrera_codigo
    FROM inscripciones_carrera ic
    JOIN alumnos a ON ic.alumno_id = a.id
    JOIN usuarios u ON a.usuario_id = u.id
    JOIN carreras c ON ic.carrera_id = c.id
  `;
  const params: any[] = [];

  if (estado) {
    sql += " WHERE ic.estado = ?";
    params.push(estado);
  }

  sql += " ORDER BY ic.fecha_solicitud DESC";

  const [rows] = await pool.query<InscripcionCarreraRow[]>(sql, params);

  // Attach document metadata for each application
  for (const row of rows) {
    const [docs] = await pool.query(
      `SELECT id, tipo_documento, nombre_archivo_original, mime_type, tamanio_bytes, fecha_subida
       FROM documentos_inscripcion
       WHERE inscripcion_carrera_id = ?`,
      [row.id]
    );
    (row as any).documentos = docs;
  }

  return rows;
}

// ──────────────────────────────────────────────
// Admin: get single application by id
// ──────────────────────────────────────────────

export async function obtenerPorId(id: number) {
  const [rows] = await pool.query<InscripcionCarreraRow[]>(
    `SELECT ic.*, a.legajo as alumno_legajo,
            u.nombre as alumno_nombre, u.email as alumno_email,
            c.nombre as carrera_nombre, c.codigo as carrera_codigo
     FROM inscripciones_carrera ic
     JOIN alumnos a ON ic.alumno_id = a.id
     JOIN usuarios u ON a.usuario_id = u.id
     JOIN carreras c ON ic.carrera_id = c.id
     WHERE ic.id = ?`,
    [id]
  );

  if (rows.length === 0) return null;

  const [docs] = await pool.query(
    `SELECT id, tipo_documento, nombre_archivo_original, nombre_archivo_guardado,
            ruta_archivo, mime_type, tamanio_bytes, fecha_subida
     FROM documentos_inscripcion
     WHERE inscripcion_carrera_id = ?`,
    [id]
  );

  return { ...rows[0], documentos: docs };
}

// ──────────────────────────────────────────────
// Admin: approve / reject application
// ──────────────────────────────────────────────

export async function revisarSolicitud(
  id: number,
  estado: "aprobada" | "rechazada",
  revisado_por: number,
  motivo_rechazo?: string | null
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE inscripciones_carrera
     SET estado = ?, fecha_revision = NOW(), revisado_por = ?,
         motivo_rechazo = ?
     WHERE id = ?`,
    [estado, revisado_por, motivo_rechazo || null, id]
  );
  return result.affectedRows > 0;
}

// ──────────────────────────────────────────────
// Get document record by id
// ──────────────────────────────────────────────

export async function obtenerDocumentoPorId(id: number) {
  const [rows] = await pool.query(
    `SELECT di.*, ic.alumno_id
     FROM documentos_inscripcion di
     JOIN inscripciones_carrera ic ON di.inscripcion_carrera_id = ic.id
     WHERE di.id = ?`,
    [id]
  );
  return (rows as any[])[0] || null;
}
