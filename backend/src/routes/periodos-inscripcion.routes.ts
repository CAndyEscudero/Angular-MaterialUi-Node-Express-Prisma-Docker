import { Router } from "express";
import { verificarToken } from "../middlewares/roles.middlewares";
import { getAll, getById, create, update, remove } from "../controllers/periodos-inscripcion.controller";

const router = Router();

// All routes require authentication
router.use(verificarToken);

// CRUD
router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
