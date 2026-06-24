import { Router, Request, Response } from "express";
import { verificarToken } from "../middlewares/roles.middlewares";
import * as NotificacionModel from "../models/notificaciones.model";

const router = Router();

// All notification endpoints require authentication
router.use(verificarToken);

// ──────────────────────────────────────────────
// GET /api/notificaciones
// List notifications for authenticated user (paginated)
// ──────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  try {
    const usuarioId = req.usuario!.id;
    const pagina = Number(req.query.pagina) || 1;
    const limite = Number(req.query.limite) || 20;

    const result = await NotificacionModel.listar(usuarioId, pagina, limite);
    res.json(result);
  } catch (error) {
    console.error("Error al listar notificaciones:", error);
    res.status(500).json({ error: "Error al listar notificaciones" });
  }
});

// ──────────────────────────────────────────────
// GET /api/notificaciones/no-leidas
// Count unread notifications
// ──────────────────────────────────────────────

router.get("/no-leidas", async (req: Request, res: Response) => {
  try {
    const usuarioId = req.usuario!.id;
    const cantidad = await NotificacionModel.contarNoLeidas(usuarioId);
    res.json({ cantidad });
  } catch (error) {
    console.error("Error al contar notificaciones:", error);
    res.status(500).json({ error: "Error al contar notificaciones" });
  }
});

// ──────────────────────────────────────────────
// PUT /api/notificaciones/:id/leer
// Mark a single notification as read
// ──────────────────────────────────────────────

router.put("/:id/leer", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario!.id;

    const ok = await NotificacionModel.marcarLeida(Number(id), usuarioId);
    if (!ok) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    res.json({ message: "Notificación marcada como leída" });
  } catch (error) {
    console.error("Error al marcar notificación:", error);
    res.status(500).json({ error: "Error al marcar notificación" });
  }
});

// ──────────────────────────────────────────────
// PUT /api/notificaciones/leer-todas
// Mark all notifications as read for the user
// ──────────────────────────────────────────────

router.put("/leer-todas", async (req: Request, res: Response) => {
  try {
    const usuarioId = req.usuario!.id;
    await NotificacionModel.marcarTodasLeidas(usuarioId);
    res.json({ message: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar todas como leídas:", error);
    res.status(500).json({ error: "Error al marcar notificaciones" });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/notificaciones/:id
// Delete a notification
// ──────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario!.id;

    const ok = await NotificacionModel.eliminar(Number(id), usuarioId);
    if (!ok) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    res.json({ message: "Notificación eliminada" });
  } catch (error) {
    console.error("Error al eliminar notificación:", error);
    res.status(500).json({ error: "Error al eliminar notificación" });
  }
});

export default router;
