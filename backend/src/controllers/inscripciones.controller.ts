import { Request, Response } from "express";
import { pool } from "../config/db";
import * as InscripcionModel from "../models/inscripciones.model";
import * as NotificacionModel from "../models/notificaciones.model";
import { obtenerAlumnoPorUsuarioId } from "../models/alumnos.model";
import { obtenerMateriaPorId } from "../models/materias.model";
import { verificarCorrelatividades } from "../models/inscripciones.model";
import { hayPeriodoAbierto, getPeriodoStatus } from "../models/periodos-inscripcion.model";

// POST /api/inscripciones — create enrollment
export async function createInscripcion(req: Request, res: Response) {
  try {
    const { materia_id } = req.body;
    const usuarioId = req.usuario?.id;

    if (!materia_id) {
      return res.status(400).json({ error: "materia_id es obligatorio" });
    }

    // Look up the alumno profile for the authenticated user
    const alumno = await obtenerAlumnoPorUsuarioId(usuarioId!);

    if (!alumno) {
      return res.status(400).json({ error: "Perfil de alumno no encontrado" });
    }

    // ── Period validation (fail fast: before DB lookups for materia) ─────────
    // Academic rule: students can only enroll when an enrollment period is open.
    const periodoAbierto = await hayPeriodoAbierto();
    if (!periodoAbierto) {
      return res.status(403).json({
        error: "No hay un período de inscripción abierto",
        mensaje: "Las inscripciones solo están disponibles durante un período de inscripción habilitado",
      });
    }

    // Validate materia exists
    const materia = await obtenerMateriaPorId(materia_id);
    if (!materia) {
      return res.status(404).json({ error: "Materia no encontrada" });
    }

    // Validate capacity: check materia cupo_maximo
    if (materia.cupo_maximo !== null && materia.cupo_maximo > 0) {
      const inscriptosCount = await InscripcionModel.contarInscripcionesPorMateria(materia_id);
      if (inscriptosCount >= materia.cupo_maximo) {
        return res.status(409).json({ error: "La materia no tiene cupos disponibles" });
      }
    }

    // Validate prerequisites (correlatividades)
    const correlativasCheck = await verificarCorrelatividades(alumno.id, materia_id);
    if (!correlativasCheck.ok) {
      const nombresFaltantes = correlativasCheck.faltantes.map(
        (c) => `${c.nombre} (${c.codigo}) — ${c.tipo === 'analitica' ? 'aprobada' : 'regular'}`
      );
      return res.status(409).json({
        error: "No cumples con las correlativas requeridas",
        correlativas_faltantes: correlativasCheck.faltantes,
        detalle: `Faltan: ${nombresFaltantes.join(', ')}`,
      });
    }

    const result = await InscripcionModel.crearInscripcion(alumno.id, materia_id);
    const inscripcionId = (result as any).insertId;

    // ── Notificar al profesor y admin ──
    try {
      if (materia?.profesor_id) {
        const [profUser] = await pool.query(
          "SELECT id FROM usuarios WHERE id = ?",
          [materia.profesor_id]
        );
        if ((profUser as any[])[0]) {
          await NotificacionModel.crearNotificacion({
            usuario_id: materia.profesor_id,
            titulo: "Nueva inscripción",
            mensaje: `${alumno.nombre || "Un alumno"} se inscribió en ${materia.nombre}.`,
            tipo: "inscripcion",
            referencia_id: inscripcionId,
            referencia_tipo: "inscripcion",
          });
        }
      }
    } catch (notifErr) {
      console.error("Error al crear notificación de inscripción:", notifErr);
    }

    res.status(201).json({ message: "Inscripción creada", id: inscripcionId });
  } catch (error: any) {
    // Handle duplicate enrollment (UNIQUE constraint)
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Ya estás inscrito en esta materia" });
    }
    console.error("Error al crear inscripción:", error);
    res.status(500).json({ error: "Error al crear inscripción" });
  }
}

// GET /api/inscripciones/periodo-actual — check current enrollment period
export async function getPeriodoActualHandler(req: Request, res: Response) {
  try {
    const status = await getPeriodoStatus();
    res.json(status);
  } catch (error) {
    console.error("Error al consultar período de inscripción:", error);
    res.status(500).json({ error: "Error al consultar período de inscripción" });
  }
}

// GET /api/inscripciones/alumno/:id — get enrollments by alumno
export async function getInscripcionesByAlumno(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;
    const usuarioRol = req.usuario?.rol;

    // Ownership check: students can only see their own enrollments
    // Admin can see any student's enrollments
    if (usuarioRol !== "admin") {
      const alumno = await obtenerAlumnoPorUsuarioId(usuarioId!);
      if (!alumno || alumno.id !== Number(id)) {
        return res.status(403).json({ error: "No tienes permiso para ver estas inscripciones" });
      }
    }

    const inscripciones = await InscripcionModel.obtenerInscripcionesPorAlumno(Number(id));
    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscripciones del alumno:", error);
    res.status(500).json({ error: "Error al obtener inscripciones" });
  }
}

// GET /api/inscripciones/mias — current student's enrollments
export async function getMisInscripciones(req: Request, res: Response) {
  try {
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: "Acceso denegado" });
    }

    const alumno = await obtenerAlumnoPorUsuarioId(usuarioId);

    if (!alumno) {
      return res.status(404).json({ error: "Perfil de alumno no encontrado" });
    }

    const inscripciones = await InscripcionModel.obtenerInscripcionesPorAlumno(alumno.id);
    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener mis inscripciones:", error);
    res.status(500).json({ error: "Error al obtener inscripciones" });
  }
}

// GET /api/inscripciones/materia/:id — get enrollments by materia
export async function getInscripcionesByMateria(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const inscripciones = await InscripcionModel.obtenerInscripcionesPorMateria(Number(id));
    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscripciones de la materia:", error);
    res.status(500).json({ error: "Error al obtener inscripciones" });
  }
}

// DELETE /api/inscripciones/:id — delete enrollment
export async function deleteInscripcion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deleted = await InscripcionModel.eliminarInscripcion(Number(id));

    if (!deleted) {
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    res.json({ message: "Inscripción eliminada" });
  } catch (error) {
    console.error("Error al eliminar inscripción:", error);
    res.status(500).json({ error: "Error al eliminar inscripción" });
  }
}

// PUT /api/inscripciones/:id/nota — set grade
export async function setNota(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nota } = req.body;

    if (nota === undefined || nota === null) {
      return res.status(400).json({ error: "nota es obligatorio" });
    }

    const notaNum = Number(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 100) {
      return res.status(400).json({ error: "nota debe ser un número entre 0 y 100" });
    }

    const updated = await InscripcionModel.actualizarNota(Number(id), notaNum);
    if (!updated) {
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    // ── Notificar al alumno ──
    try {
      const [insc] = await pool.query(
        `SELECT i.alumno_id, a.usuario_id, m.nombre as materia_nombre
         FROM inscripciones i
         JOIN materias m ON i.materia_id = m.id
         JOIN alumnos a ON i.alumno_id = a.id
         WHERE i.id = ?`,
        [Number(id)]
      );
      const inscData = (insc as any[])[0];
      if (inscData?.usuario_id) {
        await NotificacionModel.crearNotificacion({
          usuario_id: inscData.usuario_id,
          titulo: "Nota cargada",
          mensaje: `Te cargaron la nota de ${inscData.materia_nombre || "una materia"}: ${notaNum}/100.`,
          tipo: "nota",
          referencia_id: Number(id),
          referencia_tipo: "inscripcion",
        });
      }
    } catch (notifErr) {
      console.error("Error al crear notificación de nota:", notifErr);
    }

    res.json({ message: "Nota actualizada", nota: notaNum });
  } catch (error) {
    console.error("Error al actualizar nota:", error);
    res.status(500).json({ error: "Error al actualizar nota" });
  }
}
