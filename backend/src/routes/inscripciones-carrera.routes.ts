import { Router } from "express";
import {
  getMiSolicitud,
  solicitarInscripcionCarrera,
  getTodasLasSolicitudes,
  getSolicitudPorId,
  revisarSolicitud,
  descargarDocumento,
} from "../controllers/inscripciones-carrera.controller";
import {
  verificarToken,
  esProfesorOAdmin,
  esAdmin,
} from "../middlewares/roles.middlewares";

const router = Router();

// ── Student endpoints ─────────────────────────

// GET /api/inscripciones-carrera/mi-solicitud — student's own application
router.get("/mi-solicitud", verificarToken, getMiSolicitud);

// POST /api/inscripciones-carrera/solicitar — apply with documents (multipart)
router.post("/solicitar", verificarToken, solicitarInscripcionCarrera);

// ── Admin endpoints ───────────────────────────

// GET /api/inscripciones-carrera — list all applications (admin)
router.get("/", [verificarToken, esAdmin], getTodasLasSolicitudes);

// GET /api/inscripciones-carrera/documentos/:docId — download document (protected)
router.get("/documentos/:docId", verificarToken, descargarDocumento);

// GET /api/inscripciones-carrera/:id — application detail (admin)
router.get("/:id", [verificarToken, esAdmin], getSolicitudPorId);

// PUT /api/inscripciones-carrera/:id/revisar — approve/reject (admin)
router.put("/:id/revisar", [verificarToken, esAdmin], revisarSolicitud);

export default router;
