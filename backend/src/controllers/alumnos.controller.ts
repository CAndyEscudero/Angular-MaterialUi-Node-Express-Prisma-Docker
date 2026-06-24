import { Request, Response } from "express";
import * as AlumnoModel from "../models/alumnos.model";

// GET /api/alumnos — list all students with user info
export async function getAlumnos(req: Request, res: Response) {
  try {
    const alumnos = await AlumnoModel.obtenerAlumnos();
    res.json(alumnos);
  } catch (error) {
    console.error("Error al obtener alumnos:", error);
    res.status(500).json({ error: "Error al obtener alumnos" });
  }
}

// GET /api/alumnos/mi-perfil — authenticated student's profile
export async function getMiPerfilAlumno(req: Request, res: Response) {
  try {
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: "Acceso denegado" });
    }

    const alumno = await AlumnoModel.obtenerAlumnoPorUsuarioId(usuarioId);

    if (!alumno) {
      return res.status(404).json({ error: "Perfil de alumno no encontrado" });
    }

    res.json(alumno);
  } catch (error) {
    console.error("Error al obtener perfil de alumno:", error);
    res.status(500).json({ error: "Error al obtener perfil de alumno" });
  }
}
