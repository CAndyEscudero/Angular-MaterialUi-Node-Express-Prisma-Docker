import { Router } from "express";
import {
  getCarreras,
  getCarreraById,
  createCarrera,
  updateCarrera,
  deleteCarrera
} from "../controllers/carreras.controller";
import { verificarToken, esProfesorOAdmin } from "../middlewares/roles.middlewares";

const router = Router();

// Listar todas las carreras (público)
router.get("/", getCarreras);

// Obtener carrera por ID (público)
router.get("/:id", getCarreraById);

// Crear nueva carrera (solo admin — requiere autenticación y rol admin)
router.post("/", [verificarToken, esProfesorOAdmin], createCarrera);

// Actualizar carrera (solo admin)
router.put("/:id", [verificarToken, esProfesorOAdmin], updateCarrera);

// Eliminar/desactivar carrera (solo admin)
router.delete("/:id", [verificarToken, esProfesorOAdmin], deleteCarrera);

export default router;
