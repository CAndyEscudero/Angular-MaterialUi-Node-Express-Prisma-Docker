import { Router } from "express";
import { getAlumnos, getMiPerfilAlumno } from "../controllers/alumnos.controller";
import { verificarToken } from "../middlewares/roles.middlewares";

const router = Router();

// GET /api/alumnos — list all students with user info (public)
router.get("/", getAlumnos);

// GET /api/alumnos/mi-perfil — authenticated student's profile
router.get("/mi-perfil", verificarToken, getMiPerfilAlumno);

export default router;
