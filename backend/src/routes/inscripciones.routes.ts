import { Router } from "express";
import {
  createInscripcion,
  getMisInscripciones,
  getInscripcionesByAlumno,
  getInscripcionesByMateria,
  deleteInscripcion,
  setNota,
  getPeriodoActualHandler,
} from "../controllers/inscripciones.controller";
import { verificarToken, esProfesorOAdmin } from "../middlewares/roles.middlewares";

const router = Router();

// POST /api/inscripciones — create enrollment (authenticated)
router.post("/", verificarToken, createInscripcion);

// GET /api/inscripciones/periodo-actual — check current enrollment period
router.get("/periodo-actual", verificarToken, getPeriodoActualHandler);

// GET /api/inscripciones/mias — current student's enrollments
router.get("/mias", verificarToken, getMisInscripciones);

// GET /api/inscripciones/alumno/:id — student's enrollments (authenticated)
router.get("/alumno/:id", verificarToken, getInscripcionesByAlumno);

// GET /api/inscripciones/materia/:id — enrolled students (professor/admin)
router.get("/materia/:id", [verificarToken, esProfesorOAdmin], getInscripcionesByMateria);

// DELETE /api/inscripciones/:id — unenroll (authenticated)
router.delete("/:id", verificarToken, deleteInscripcion);

// PUT /api/inscripciones/:id/nota — set grade (professor/admin)
router.put("/:id/nota", [verificarToken, esProfesorOAdmin], setNota);

export default router;
