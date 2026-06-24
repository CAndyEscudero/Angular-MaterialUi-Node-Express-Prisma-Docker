import { Request, Response } from "express";
import * as MateriaModel from "../models/materias.model";
import { Materia } from "../models/materias.model";

// Obtener todas las materias (supports ?profesor_id= filter)
export async function getMaterias(req: Request, res: Response) {
  try {
    const profesorId = req.query.profesor_id ? Number(req.query.profesor_id) : undefined;
    const materias = profesorId
      ? await MateriaModel.obtenerMateriasPorProfesor(profesorId)
      : await MateriaModel.obtenerMaterias();
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

// Crear nueva materia (handler para ruta HTTP)
export async function crearMateriaHandler(req: Request, res: Response) {
  try {
    const {
      nombre, codigo, profesor_id, descripcion, cuatrimestre, anio,
      carrera, carrera_id, dia_horario, cupo_maximo, aula,
      modalidad, estado, creditos, anio_carrera
    } = req.body;

    if (!nombre || !codigo || !profesor_id) {
      return res.status(400).json({ error: "Nombre, código y profesor son obligatorios" });
    }

    const nuevaMateria = await MateriaModel.crearMateria(
      nombre,
      codigo,
      profesor_id,
      {
        descripcion,
        cuatrimestre,
        anio,
        carrera,
        carrera_id,
        dia_horario,
        cupo_maximo,
        aula,
        modalidad,
        estado,
        creditos,
        anio_carrera,
      }
    );

    res.status(201).json({
      message: "Materia creada correctamente",
      materia: nuevaMateria
    });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Ya existe una materia con ese código" });
    }
    console.error("Error al crear materia:", error);
    res.status(500).json({ error: "Error al crear materia" });
  }
}

// Actualizar materia
export async function updateMateria(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      nombre, codigo, profesor_id, descripcion, cuatrimestre, anio,
      carrera, carrera_id, dia_horario, cupo_maximo, aula,
      modalidad, estado, creditos, anio_carrera
    } = req.body;

    const materia = await MateriaModel.actualizarMateria(Number(id), {
      nombre,
      codigo,
      profesor_id,
      descripcion,
      cuatrimestre,
      anio,
      carrera,
      carrera_id,
      dia_horario,
      cupo_maximo,
      aula,
      modalidad,
      estado,
      creditos,
      anio_carrera,
    });

    if (!materia) {
      return res.status(404).json({ error: "Materia no encontrada" });
    }

    res.json({
      message: "Materia actualizada exitosamente",
      materia
    });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Ya existe una materia con ese código" });
    }
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
