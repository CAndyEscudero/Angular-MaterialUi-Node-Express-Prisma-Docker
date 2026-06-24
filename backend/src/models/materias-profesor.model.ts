import { pool } from "../config/db";

export interface ProfesorResumen {
  totalMaterias: number;
  totalEstudiantes: number;
  notasPendientes: number;
  materias: MateriaProfesor[];
}

export interface MateriaProfesor {
  id: number;
  nombre: string;
  codigo: string;
  inscriptos_count: number;
  notas_pendientes: number;
}

export async function obtenerResumenProfesor(profesorId: number): Promise<ProfesorResumen> {
  const [materias] = await pool.query<any[]>(
    `SELECT m.id, m.nombre, m.codigo,
            COALESCE(ins.count, 0) as inscriptos_count,
            COALESCE(pend.count, 0) as notas_pendientes
     FROM materias m
     LEFT JOIN (SELECT materia_id, COUNT(*) as count FROM inscripciones GROUP BY materia_id) ins ON m.id = ins.materia_id
     LEFT JOIN (SELECT materia_id, COUNT(*) as count FROM inscripciones WHERE nota IS NULL GROUP BY materia_id) pend ON m.id = pend.materia_id
     WHERE m.profesor_id = ?
     ORDER BY m.nombre`,
    [profesorId]
  );

  const totalMaterias = materias.length;
  const totalEstudiantes = materias.reduce((sum, m) => sum + m.inscriptos_count, 0);
  const notasPendientes = materias.reduce((sum, m) => sum + m.notas_pendientes, 0);

  return { totalMaterias, totalEstudiantes, notasPendientes, materias };
}
