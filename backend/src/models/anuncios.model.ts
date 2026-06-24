import { pool } from "../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// ── Interfaces ──────────────────────────────────────────

export interface Anuncio {
  id: number;
  titulo: string;
  contenido: string;
  tipo: "general" | "materia";
  materia_id: number | null;
  materia_nombre?: string;
  creado_por: number;
  creador_nombre?: string;
  rol_destino: "todos" | "admin" | "profesor" | "alumno";
  estado: "borrador" | "publicado" | "archivado";
  fecha_publicacion: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface CrearAnuncioData {
  titulo: string;
  contenido: string;
  tipo?: "general" | "materia";
  materia_id?: number | null;
  creado_por: number;
  rol_destino?: "todos" | "admin" | "profesor" | "alumno";
  estado?: "borrador" | "publicado" | "archivado";
  fecha_publicacion?: string | null;
}

export interface ActualizarAnuncioData {
  titulo?: string;
  contenido?: string;
  tipo?: "general" | "materia";
  materia_id?: number | null;
  rol_destino?: "todos" | "admin" | "profesor" | "alumno";
  estado?: "borrador" | "publicado" | "archivado";
  fecha_publicacion?: string | null;
}

// ── CRUD ────────────────────────────────────────────────

/** Listar todos los anuncios (admin) */
export async function listarTodos(): Promise<Anuncio[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT a.*, u.nombre AS creador_nombre
     FROM anuncios a
     LEFT JOIN usuarios u ON a.creado_por = u.id
     ORDER BY a.actualizado_en DESC`
  );
  return rows as Anuncio[];
}

/** Listar anuncios publicados visibles para un rol */
export async function listarPublicados(rol?: string): Promise<Anuncio[]> {
  let query = `
    SELECT a.*, u.nombre AS creador_nombre, m.nombre AS materia_nombre
    FROM anuncios a
    LEFT JOIN usuarios u ON a.creado_por = u.id
    LEFT JOIN materias m ON a.materia_id = m.id
    WHERE a.estado = 'publicado'
  `;
  const params: any[] = [];

  if (rol && rol !== "admin") {
    // admin ve todos los publicados; otros roles ven 'todos' o su propio rol
    query += ` AND (a.rol_destino = 'todos' OR a.rol_destino = ?)`;
    params.push(rol);
  } else if (!rol) {
    query += ` AND a.rol_destino = 'todos'`;
  }

  query += ` ORDER BY a.fecha_publicacion DESC, a.creado_en DESC`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return rows as Anuncio[];
}

/** Listar anuncios publicados incluyendo los de materia según inscripción/propiedad del usuario */
export async function listarPublicadosPorUsuario(rol: string, usuarioId: number): Promise<Anuncio[]> {
  let query = `
    SELECT a.*, u.nombre AS creador_nombre, m.nombre AS materia_nombre
    FROM anuncios a
    LEFT JOIN usuarios u ON a.creado_por = u.id
    LEFT JOIN materias m ON a.materia_id = m.id
    WHERE a.estado = 'publicado'
  `;
  const params: any[] = [];

  if (rol === "alumno") {
    query += ` AND (
      (a.tipo = 'general' AND (a.rol_destino = 'todos' OR a.rol_destino = 'alumno'))
      OR
      (a.tipo = 'materia' AND a.materia_id IN (
        SELECT i.materia_id FROM inscripciones i
        JOIN alumnos al ON i.alumno_id = al.id
        WHERE al.usuario_id = ?
      ))
    )`;
    params.push(usuarioId);
  } else if (rol === "profesor") {
    query += ` AND (
      (a.tipo = 'general' AND (a.rol_destino = 'todos' OR a.rol_destino = 'profesor'))
      OR
      (a.tipo = 'materia' AND a.materia_id IN (
        SELECT m2.id FROM materias m2 WHERE m2.profesor_id = ?
      ))
    )`;
    params.push(usuarioId);
  } else if (rol !== "admin") {
    // Fallback: solo general
    query += ` AND (a.rol_destino = 'todos' OR a.rol_destino = ?)`;
    params.push(rol);
  }
  // admin: no filter, see all published

  query += ` ORDER BY a.fecha_publicacion DESC, a.creado_en DESC`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return rows as Anuncio[];
}

/** Listar anuncios de materia creados por un profesor (o propios para admin) */
export async function listarDocenteMaterias(usuarioId: number, esAdmin: boolean = false): Promise<Anuncio[]> {
  let query = `
    SELECT a.*, u.nombre AS creador_nombre, m.nombre AS materia_nombre
    FROM anuncios a
    LEFT JOIN usuarios u ON a.creado_por = u.id
    LEFT JOIN materias m ON a.materia_id = m.id
    WHERE a.tipo = 'materia'
  `;
  const params: any[] = [];

  if (!esAdmin) {
    query += ` AND a.materia_id IN (SELECT m2.id FROM materias m2 WHERE m2.profesor_id = ?)`;
    params.push(usuarioId);
  }

  query += ` ORDER BY a.actualizado_en DESC`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return rows as Anuncio[];
}

/** Obtener anuncio por ID */
export async function obtenerPorId(id: number): Promise<Anuncio | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT a.*, u.nombre AS creador_nombre
     FROM anuncios a
     LEFT JOIN usuarios u ON a.creado_por = u.id
     WHERE a.id = ?`,
    [id]
  );
  return (rows as Anuncio[])[0] || null;
}

/** Crear anuncio */
export async function crear(data: CrearAnuncioData): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO anuncios (titulo, contenido, tipo, materia_id, creado_por, rol_destino, estado, fecha_publicacion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.titulo,
      data.contenido,
      data.tipo || "general",
      data.materia_id || null,
      data.creado_por,
      data.rol_destino || "todos",
      data.estado || "borrador",
      data.fecha_publicacion || null,
    ]
  );
  return result.insertId;
}

/** Actualizar anuncio */
export async function actualizar(
  id: number,
  data: ActualizarAnuncioData
): Promise<boolean> {
  const updates: string[] = [];
  const values: any[] = [];

  const fields: (keyof ActualizarAnuncioData)[] = [
    "titulo",
    "contenido",
    "tipo",
    "materia_id",
    "rol_destino",
    "estado",
    "fecha_publicacion",
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (updates.length === 0) return false;

  values.push(id);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE anuncios SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
}

/** Publicar anuncio (cambia estado y establece fecha_publicacion si no está) */
export async function publicar(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE anuncios
     SET estado = 'publicado',
         fecha_publicacion = COALESCE(fecha_publicacion, NOW())
     WHERE id = ? AND estado != 'archivado'`,
    [id]
  );
  return result.affectedRows > 0;
}

/** Archivar anuncio */
export async function archivar(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE anuncios SET estado = 'archivado' WHERE id = ? AND estado = 'publicado'`,
    [id]
  );
  return result.affectedRows > 0;
}

// ── Ownership helpers ───────────────────────────────

/** Verify a profesor owns the materia (consistent with examenes.model pattern) */
export async function profesorEsDuenoMateria(profesorId: number, materiaId: number): Promise<boolean> {
  const [rows] = await pool.query(
    "SELECT id FROM materias WHERE id = ? AND profesor_id = ?",
    [materiaId, profesorId]
  );
  return (rows as any[]).length > 0;
}

/** Verify a profesor owns the anuncio (tipo=materia, materia belongs to them) */
export async function profesorEsDuenoAnuncio(usuarioId: number, anuncioId: number): Promise<boolean> {
  const [rows] = await pool.query(
    `SELECT a.id FROM anuncios a
     JOIN materias m ON a.materia_id = m.id
     WHERE a.id = ? AND a.tipo = 'materia' AND m.profesor_id = ?`,
    [anuncioId, usuarioId]
  );
  return (rows as any[]).length > 0;
}

/** Eliminar anuncio */
export async function eliminar(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM anuncios WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
