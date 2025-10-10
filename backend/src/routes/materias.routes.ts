import { Router } from "express";
import {
  getMaterias,
  getMateriaById,
  crearMateriaHandler,
  updateMateria,
  deleteMateria
} from "../controllers/materias.controller";
import { verificarToken, esProfesorOAdmin } from "../middlewares/roles.middlewares";

const router = Router();

// Obtener todas las materias
router.get("/", getMaterias);

// Obtener materia por ID
router.get("/:id", getMateriaById);

// Crear nueva materia (solo profesor o admin)
router.post("/", [verificarToken, esProfesorOAdmin], crearMateriaHandler);

// Actualizar materia
router.put("/:id", [verificarToken, esProfesorOAdmin], updateMateria);

// Eliminar materia
router.delete("/:id", [verificarToken, esProfesorOAdmin], deleteMateria);

export default router;
