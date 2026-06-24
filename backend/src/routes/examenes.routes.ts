import { Router } from "express";
import { verificarToken } from "../middlewares/roles.middlewares";
import { getAll, getById, create, update, remove } from "../controllers/examenes.controller";

const router = Router();

router.use(verificarToken);

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
