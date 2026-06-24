import { pool } from "../config/db";
import { ResultSetHeader } from "mysql2";

// Interfaces
export interface Materia {
  id?: number;
  nombre: string;
  profesor_id: number;
  codigo: string;
  descripcion?: string;
  cuatrimestre?: '1' | '2';
  anio?: number;
  carrera?: string;
  carrera_id?: number;
  dia_horario?: string;
  cupo_maximo?: number;
  aula?: string;
  modalidad?: 'presencial' | 'virtual' | 'hibrida';
  estado?: 'activa' | 'inactiva';
  creditos?: number;
  anio_carrera?: number;
  created_at?: Date;
  profesor_nombre?: string;
  carrera_nombre?: string;
  inscriptos_count?: number;
  cupos_disponibles?: number | null;
  correlativas?: CorrelativaInfo[];
}

export interface CorrelativaInfo {
  id: number;
  nombre: string;
  codigo: string;
  tipo: 'regular' | 'analitica';
}

// Obtener todas las materias
export async function obtenerMaterias() {
  const [materias] = await pool.query(
    `SELECT m.*, u.nombre as profesor_nombre, c.nombre as carrera_nombre,
            COALESCE(ins.count, 0) as inscriptos_count,
            CASE WHEN m.cupo_maximo IS NOT NULL AND m.cupo_maximo > 0
                 THEN GREATEST(m.cupo_maximo - COALESCE(ins.count, 0), 0)
                 ELSE NULL
            END as cupos_disponibles
     FROM materias m
     JOIN usuarios u ON m.profesor_id = u.id
     LEFT JOIN carreras c ON m.carrera_id = c.id
      LEFT JOIN (SELECT materia_id, COUNT(*) as count FROM inscripciones GROUP BY materia_id) ins ON m.id = ins.materia_id`
  );
  await attachCorrelativas(materias as any[]);
  return materias;
}

// Obtener materia por ID
export async function obtenerMateriaPorId(id: number) {
  const [materia] = await pool.query(
    `SELECT m.*, u.nombre as profesor_nombre, c.nombre as carrera_nombre,
            COALESCE(ins.count, 0) as inscriptos_count,
            CASE WHEN m.cupo_maximo IS NOT NULL AND m.cupo_maximo > 0
                 THEN GREATEST(m.cupo_maximo - COALESCE(ins.count, 0), 0)
                 ELSE NULL
            END as cupos_disponibles
     FROM materias m
     JOIN usuarios u ON m.profesor_id = u.id
     LEFT JOIN carreras c ON m.carrera_id = c.id
     LEFT JOIN (SELECT materia_id, COUNT(*) as count FROM inscripciones GROUP BY materia_id) ins ON m.id = ins.materia_id
      WHERE m.id = ?`,
    [id]
  );
  const result = (materia as any[])[0];
  if (result) {
    await attachCorrelativas([result]);
  }
  return result;
}

// Crear materia (con todos los campos extendidos)
export async function crearMateria(
  nombre: string,
  codigo: string,
  profesor_id: number,
  extras?: {
    descripcion?: string;
    cuatrimestre?: '1' | '2';
    anio?: number;
    carrera?: string;
    carrera_id?: number;
    dia_horario?: string;
    cupo_maximo?: number;
    aula?: string;
    modalidad?: 'presencial' | 'virtual' | 'hibrida';
    estado?: 'activa' | 'inactiva';
    creditos?: number;
    anio_carrera?: number;
  }
) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO materias (
      nombre, codigo, profesor_id, descripcion, cuatrimestre, anio,
      carrera, carrera_id, dia_horario, cupo_maximo, aula,
      modalidad, estado, creditos, anio_carrera
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      codigo,
      profesor_id,
      extras?.descripcion || null,
      extras?.cuatrimestre || null,
      extras?.anio || null,
      extras?.carrera || null,
      extras?.carrera_id || null,
      extras?.dia_horario || null,
      extras?.cupo_maximo || null,
      extras?.aula || null,
      extras?.modalidad || 'presencial',
      extras?.estado || 'activa',
      extras?.creditos || null,
      extras?.anio_carrera || null,
    ]
  );

  return obtenerMateriaPorId(result.insertId);
}

// Actualizar materia (todos los campos)
export async function actualizarMateria(
  id: number,
  data: {
    nombre?: string;
    codigo?: string;
    profesor_id?: number;
    descripcion?: string | null;
    cuatrimestre?: '1' | '2' | null;
    anio?: number | null;
    carrera?: string | null;
    carrera_id?: number | null;
    dia_horario?: string | null;
    cupo_maximo?: number | null;
    aula?: string | null;
    modalidad?: 'presencial' | 'virtual' | 'hibrida';
    estado?: 'activa' | 'inactiva';
    creditos?: number | null;
    anio_carrera?: number | null;
  }
) {
  const updates: string[] = [];
  const values: any[] = [];

  const fields: (keyof typeof data)[] = [
    'nombre', 'codigo', 'profesor_id', 'descripcion', 'cuatrimestre',
    'anio', 'carrera', 'carrera_id', 'dia_horario', 'cupo_maximo',
    'aula', 'modalidad', 'estado', 'creditos', 'anio_carrera'
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (updates.length === 0) return obtenerMateriaPorId(id);

  values.push(id);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE materias SET ${updates.join(", ")} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) return null;

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

// Obtener materias por profesor_id
export async function obtenerMateriasPorProfesor(profesor_id: number) {
  const [materias] = await pool.query(
    `SELECT m.*, u.nombre as profesor_nombre, c.nombre as carrera_nombre,
            COALESCE(ins.count, 0) as inscriptos_count,
            CASE WHEN m.cupo_maximo IS NOT NULL AND m.cupo_maximo > 0
                 THEN GREATEST(m.cupo_maximo - COALESCE(ins.count, 0), 0)
                 ELSE NULL
            END as cupos_disponibles
     FROM materias m
     JOIN usuarios u ON m.profesor_id = u.id
     LEFT JOIN carreras c ON m.carrera_id = c.id
     LEFT JOIN (SELECT materia_id, COUNT(*) as count FROM inscripciones GROUP BY materia_id) ins ON m.id = ins.materia_id
      WHERE m.profesor_id = ?`,
    [profesor_id]
  );
  await attachCorrelativas(materias as any[]);
  return materias;
}

// Verificar si existe materia
export async function existeMateria(codigo: string): Promise<boolean> {
  const [materias] = await pool.query(
    "SELECT id FROM materias WHERE codigo = ?",
    [codigo]
  );
  return (materias as any[]).length > 0;
}

// ── Correlatividades ──────────────────────────────────────────

// Obtener correlativas/prerrequisitos de una materia
export async function obtenerCorrelatividades(materiaId: number): Promise<CorrelativaInfo[]> {
  const [rows] = await pool.query(
    `SELECT c.tipo, c.correlativa_id as id, m.nombre, m.codigo
     FROM correlatividades c
     JOIN materias m ON c.correlativa_id = m.id
     WHERE c.materia_id = ?`,
    [materiaId]
  );
  return rows as CorrelativaInfo[];
}

// Adjuntar correlativas a un arreglo de materias (en-place mutation)
export async function attachCorrelativas(materias: any[]): Promise<void> {
  if (materias.length === 0) return;

  const [correlativas] = await pool.query(
    `SELECT c.materia_id, c.tipo, c.correlativa_id, m.nombre, m.codigo
     FROM correlatividades c
     JOIN materias m ON c.correlativa_id = m.id
     ORDER BY c.materia_id`
  );

  const map = new Map<number, CorrelativaInfo[]>();
  for (const row of correlativas as any[]) {
    if (!map.has(row.materia_id)) {
      map.set(row.materia_id, []);
    }
    map.get(row.materia_id)!.push({
      id: row.correlativa_id,
      nombre: row.nombre,
      codigo: row.codigo,
      tipo: row.tipo,
    });
  }

  for (const materia of materias) {
    materia.correlativas = map.get(materia.id) || [];
  }
}
