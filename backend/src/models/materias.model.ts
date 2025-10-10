import { pool } from "../config/db";
import { ResultSetHeader } from "mysql2";

// Interfaces
interface Materia {
    id?: number;
    nombre: string;
    profesor_id: number;
    codigo: string;
    descripcion?: string;
    cuatrimestre: '1' | '2';
    año: number;
    carrera: string;
    dia_horario?: string;
    cupo_maximo?: number;
    estado?: 'activa' | 'inactiva';
    created_at?: Date;
}

// Obtener todas las materias
export async function obtenerMaterias() {
  const [materias] = await pool.query(
    `SELECT m.*, u.nombre as profesor_nombre 
     FROM materias m 
     JOIN usuarios u ON m.profesor_id = u.id`
  );
  return materias;
}

// Obtener materia por ID
export async function obtenerMateriaPorId(id: number) {
  const [materia] = await pool.query(
    `SELECT m.*, u.nombre as profesor_nombre 
     FROM materias m 
     JOIN usuarios u ON m.profesor_id = u.id 
     WHERE m.id = ?`, 
    [id]
  );
  return (materia as any[])[0];
}

// Crear materia
export async function crearMateria(
  nombre: string, 
  codigo: string, 
  profesor_id: number
): Promise<Materia> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO materias (nombre, codigo, profesor_id) VALUES (?, ?, ?)",
    [nombre, codigo, profesor_id]
  );

  const newMateria: Materia = {
    id: result.insertId,
    nombre,
    codigo,
    profesor_id,
    cuatrimestre: '1', // Asignar un valor por defecto o ajustar según tu lógica
    año: new Date().getFullYear(), // Asignar el año actual o ajustar según tu lógica
    carrera: '' // Asignar un valor por defecto o ajustar según tu lógica
  };

  return newMateria;
}

// Actualizar materia
export async function actualizarMateria(
  id: number,
  nombre: string,
  codigo: string,
  profesor_id: number
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE materias 
     SET nombre = ?, codigo = ?, profesor_id = ? 
     WHERE id = ?`,
    [nombre, codigo, profesor_id, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return obtenerMateriaPorId(id);
}

// Eliminar materia
export async function eliminarMateria(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM materias WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
}

// Verificar si existe materia
export async function existeMateria(codigo: string): Promise<boolean> {
  const [materias] = await pool.query(
    "SELECT id FROM materias WHERE codigo = ?",
    [codigo]
  );
  return (materias as any[]).length > 0;
}
export { Materia };