import { Router } from "express";
import { getProfesores } from "../controllers/profesores.controller";

const router = Router();

// GET /api/profesores — list all professors with user info (public)
router.get("/", getProfesores);

export default router;
