import { Router } from "express";
import { verificarToken, esAdmin, esProfesorOAdmin } from "../middlewares/roles.middlewares";
import {
  listarTodos,
  listarPublicados,
  listarDocente,
  obtenerPorId,
  crear,
  crearMateriaAnuncio,
  actualizar,
  publicarHandler,
  archivarHandler,
  eliminarHandler,
} from "../controllers/anuncios.controller";

const router = Router();

// ── Rutas semi-públicas (con verificarToken) ────────────
// NOTA: las rutas fijas deben declararse ANTES que /:id

// GET /api/anuncios/publicados — anuncios publicados visibles
router.get("/publicados", verificarToken, listarPublicados);

// GET /api/anuncios/admin — todos los anuncios (admin panel)
router.get("/admin", verificarToken, esAdmin, listarTodos);

// GET /api/anuncios/docente — anuncios de materia del profesor
router.get("/docente", verificarToken, esProfesorOAdmin, listarDocente);

// POST /api/anuncios/materia — crear anuncio de materia (profesor/admin)
router.post("/materia", verificarToken, esProfesorOAdmin, crearMateriaAnuncio);

// ── Rutas por ID ────────────────────────────────────────

// GET /api/anuncios/:id — ver un anuncio específico
router.get("/:id", verificarToken, obtenerPorId);

// ── Rutas solo admin o profesor (según contexto) ─────────

// POST /api/anuncios — crear anuncio (solo admin)
router.post("/", verificarToken, esAdmin, crear);

// PUT /api/anuncios/:id — actualizar anuncio (admin / profesor de su materia)
router.put("/:id", verificarToken, esProfesorOAdmin, actualizar);

// PUT /api/anuncios/:id/publicar — publicar anuncio (admin / profesor de su materia)
router.put("/:id/publicar", verificarToken, esProfesorOAdmin, publicarHandler);

// PUT /api/anuncios/:id/archivar — archivar anuncio (admin / profesor de su materia)
router.put("/:id/archivar", verificarToken, esProfesorOAdmin, archivarHandler);

// DELETE /api/anuncios/:id — eliminar anuncio (admin / profesor de su materia)
router.delete("/:id", verificarToken, esProfesorOAdmin, eliminarHandler);

export default router;
