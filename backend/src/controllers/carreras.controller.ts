import { Request, Response } from "express";
import * as CarreraModel from "../models/carreras.model";

// Obtener todas las carreras
export async function getCarreras(req: Request, res: Response) {
  try {
    const carreras = await CarreraModel.obtenerCarreras();
    res.json(carreras);
  } catch (error) {
    console.error("Error al obtener carreras:", error);
    res.status(500).json({ error: "Error al obtener carreras" });
  }
}

// Obtener carrera por ID
export async function getCarreraById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const carrera = await CarreraModel.obtenerCarreraPorId(Number(id));

    if (!carrera) {
      return res.status(404).json({ error: "Carrera no encontrada" });
    }

    res.json(carrera);
  } catch (error) {
    console.error("Error al obtener carrera:", error);
    res.status(500).json({ error: "Error al obtener carrera" });
  }
}

// Crear nueva carrera
export async function createCarrera(req: Request, res: Response) {
  try {
    const { nombre, codigo, descripcion, duracion_anios } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({ error: "Nombre y código son obligatorios" });
    }

    const carrera = await CarreraModel.crearCarrera(
      nombre,
      codigo,
      descripcion || null,
      duracion_anios || 5
    );

    res.status(201).json({ message: "Carrera creada correctamente", carrera });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Ya existe una carrera con ese código" });
    }
    console.error("Error al crear carrera:", error);
    res.status(500).json({ error: "Error al crear carrera" });
  }
}

// Actualizar carrera
export async function updateCarrera(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nombre, codigo, descripcion, duracion_anios, activa } = req.body;

    const carrera = await CarreraModel.actualizarCarrera(Number(id), {
      nombre,
      codigo,
      descripcion,
      duracion_anios,
      activa,
    });

    if (!carrera) {
      return res.status(404).json({ error: "Carrera no encontrada" });
    }

    res.json({ message: "Carrera actualizada exitosamente", carrera });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Ya existe una carrera con ese código" });
    }
    console.error("Error al actualizar carrera:", error);
    res.status(500).json({ error: "Error al actualizar carrera" });
  }
}

// Eliminar carrera (desactiva por defecto, hard delete si se fuerza)
export async function deleteCarrera(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { force } = req.query;

    let result: boolean;
    if (force === 'true') {
      result = await CarreraModel.eliminarCarrera(Number(id));
    } else {
      result = await CarreraModel.desactivarCarrera(Number(id));
    }

    if (!result) {
      return res.status(404).json({ error: "Carrera no encontrada" });
    }

    res.json({
      message: force === 'true'
        ? "Carrera eliminada permanentemente"
        : "Carrera desactivada correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar carrera:", error);
    res.status(500).json({ error: "Error al eliminar carrera" });
  }
}
