import { Request, Response } from "express";
import * as ProfesorModel from "../models/profesores.model";

// GET /api/profesores — list all professors with user info
export async function getProfesores(req: Request, res: Response) {
  try {
    const profesores = await ProfesorModel.obtenerProfesores();
    res.json(profesores);
  } catch (error) {
    console.error("Error al obtener profesores:", error);
    res.status(500).json({ error: "Error al obtener profesores" });
  }
}
