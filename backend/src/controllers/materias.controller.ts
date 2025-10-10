import { Request, Response } from "express";
import * as MateriaModel from "../models/materias.model";
import { Materia } from "../models/materias.model";
import { ResultSetHeader } from "mysql2";
import { pool } from "../config/db"; // Asegúrate de que la ruta sea correcta y que exportes 'pool' desde tu módulo de conexión a la base de datos

// Obtener todas las materias
export async function getMaterias(req: Request, res: Response) {
  try {
    const materias = await MateriaModel.obtenerMaterias();
    res.json(materias);
  } catch (error) {
    console.error("Error al obtener materias:", error);
    res.status(500).json({ error: "Error al obtener materias" });
  }
}

// Obtener materia por ID
export async function getMateriaById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const materia = await MateriaModel.obtenerMateriaPorId(Number(id));
    
    if (!materia) {
      return res.status(404).json({ error: "Materia no encontrada" });
    }
    
    res.json(materia);
  } catch (error) {
    console.error("Error al obtener materia:", error);
    res.status(500).json({ error: "Error al obtener materia" });
  }
}

// Crear nueva materia
export async function crearMateria(materia: Omit<Materia, 'id' | 'created_at'>): Promise<Materia> {
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO materias (
            nombre, 
            profesor_id, 
            codigo, 
            descripcion, 
            cuatrimestre, 
            año, 
            carrera, 
            dia_horario, 
            cupo_maximo, 
            estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            materia.nombre,
            materia.profesor_id,
            materia.codigo,
            materia.descripcion,
            materia.cuatrimestre,
            materia.año,
            materia.carrera,
            materia.dia_horario,
            materia.cupo_maximo,
            materia.estado || 'activa'
        ]
    );

    return {
        id: result.insertId,
        ...materia
    };
}

// Actualizar materia
export async function updateMateria(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nombre, codigo, profesor_id } = req.body;

    const materia = await MateriaModel.actualizarMateria(
      Number(id), 
      nombre, 
      codigo, 
      profesor_id
    );

    if (!materia) {
      return res.status(404).json({ error: "Materia no encontrada" });
    }

    res.json({ 
      message: "Materia actualizada exitosamente", 
      materia 
    });
  } catch (error) {
    console.error("Error al actualizar materia:", error);
    res.status(500).json({ error: "Error al actualizar materia" });
  }
}

// Eliminar materia
export async function deleteMateria(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await MateriaModel.eliminarMateria(Number(id));

    if (!result) {
      return res.status(404).json({ error: "Materia no encontrada" });
    }

    res.json({ message: "Materia eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar materia:", error);
    res.status(500).json({ error: "Error al eliminar materia" });
  }
}
export async function crearMateriaHandler(req: Request, res: Response) {
  try {
    const nuevaMateria = await crearMateria(req.body);
    res.status(201).json({
      message: "Materia creada correctamente",
      materia: nuevaMateria
    });
  } catch (error) {
    console.error("Error al crear materia:", error);
    res.status(500).json({ error: "Error al crear materia" });
  }
}
