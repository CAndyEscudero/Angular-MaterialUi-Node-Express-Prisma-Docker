import { Router } from "express";
import {
  getMaterias,
  getMateriaById,
  crearMateriaHandler,
  updateMateria,
  deleteMateria
} from "../controllers/materias.controller";
import { verificarToken, esProfesorOAdmin } from "../middlewares/roles.middlewares";
import { getMiResumen } from "../controllers/materias-profesor.controller";

const router = Router();

// Obtener todas las materias
router.get("/", getMaterias);

// GET /api/materias/profesor/mis-datos — professor's summary with stats
router.get("/profesor/mis-datos", verificarToken, getMiResumen);

// Obtener materia por ID
router.get("/:id", getMateriaById);

// Crear nueva materia (solo profesor o admin)
router.post("/", [verificarToken, esProfesorOAdmin], crearMateriaHandler);

// Actualizar materia
router.put("/:id", [verificarToken, esProfesorOAdmin], updateMateria);

// Eliminar materia
router.delete("/:id", [verificarToken, esProfesorOAdmin], deleteMateria);

export default router;
