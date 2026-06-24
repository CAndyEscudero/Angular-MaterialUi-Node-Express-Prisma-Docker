import { Request, Response } from "express";
import * as ProfesorModel from "../models/materias-profesor.model";

export async function getMiResumen(req: Request, res: Response) {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: "Acceso denegado" });
    }
    const resumen = await ProfesorModel.obtenerResumenProfesor(usuarioId);
    res.json(resumen);
  } catch (error) {
    console.error("Error al obtener resumen del profesor:", error);
    res.status(500).json({ error: "Error al obtener resumen" });
  }
}
