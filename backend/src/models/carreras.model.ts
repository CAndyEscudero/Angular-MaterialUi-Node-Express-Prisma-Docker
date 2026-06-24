import { pool } from "../config/db";
import { ResultSetHeader } from "mysql2";

export interface Carrera {
  id?: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  duracion_anios: number;
  activa: number;
  created_at?: Date;
}

// Obtener todas las carreras
export async function obtenerCarreras() {
  const [carreras] = await pool.query(
    "SELECT * FROM carreras ORDER BY nombre ASC"
  );
  return carreras;
}

// Obtener carrera por ID
export async function obtenerCarreraPorId(id: number) {
  const [carrera] = await pool.query(
    "SELECT * FROM carreras WHERE id = ?",
    [id]
  );
  return (carrera as any[])[0];
}

// Crear carrera
export async function crearCarrera(
  nombre: string,
  codigo: string,
  descripcion: string | null,
  duracion_anios: number
) {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO carreras (nombre, codigo, descripcion, duracion_anios) VALUES (?, ?, ?, ?)",
    [nombre, codigo, descripcion, duracion_anios]
  );

  return obtenerCarreraPorId(result.insertId);
}

// Actualizar carrera
export async function actualizarCarrera(
  id: number,
  data: {
    nombre?: string;
    codigo?: string;
    descripcion?: string | null;
    duracion_anios?: number;
    activa?: number;
  }
) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.nombre !== undefined) {
    updates.push("nombre = ?");
    values.push(data.nombre);
  }
  if (data.codigo !== undefined) {
    updates.push("codigo = ?");
    values.push(data.codigo);
  }
  if (data.descripcion !== undefined) {
    updates.push("descripcion = ?");
    values.push(data.descripcion);
  }
  if (data.duracion_anios !== undefined) {
    updates.push("duracion_anios = ?");
    values.push(data.duracion_anios);
  }
  if (data.activa !== undefined) {
    updates.push("activa = ?");
    values.push(data.activa);
  }

  if (updates.length === 0) return obtenerCarreraPorId(id);

  values.push(id);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE carreras SET ${updates.join(", ")} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) return null;

  return obtenerCarreraPorId(id);
}

// Desactivar carrera (soft delete)
export async function desactivarCarrera(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE carreras SET activa = 0 WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

// Eliminar carrera (hard delete)
export async function eliminarCarrera(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM carreras WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
