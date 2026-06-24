import { Request, Response } from "express";
import * as ExamenModel from "../models/examenes.model";
import * as NotificacionModel from "../models/notificaciones.model";
import { obtenerAlumnoPorUsuarioId } from "../models/alumnos.model";

// GET /api/examenes — list based on role
export async function getAll(req: Request, res: Response) {
  try {
    const rol = req.usuario?.rol;
    const usuarioId = req.usuario!.id;

    let examenes;
    if (rol === 'admin') {
      examenes = await ExamenModel.obtenerTodos();
    } else if (rol === 'profesor') {
      examenes = await ExamenModel.obtenerPorProfesor(usuarioId);
    } else if (rol === 'alumno') {
      const alumno = await obtenerAlumnoPorUsuarioId(usuarioId);
      if (!alumno) return res.status(404).json({ error: "Perfil de alumno no encontrado" });
      examenes = await ExamenModel.obtenerPorAlumno(alumno.id);
    } else {
      return res.status(403).json({ error: "Rol no autorizado" });
    }

    res.json(examenes);
  } catch (error) {
    console.error("Error al obtener exámenes:", error);
    res.status(500).json({ error: "Error al obtener exámenes" });
  }
}

// GET /api/examenes/:id
export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const examen = await ExamenModel.obtenerPorId(Number(id));
    if (!examen) return res.status(404).json({ error: "Examen no encontrado" });
    res.json(examen);
  } catch (error) {
    console.error("Error al obtener examen:", error);
    res.status(500).json({ error: "Error al obtener examen" });
  }
}

// POST /api/examenes — create (profesor or admin)
export async function create(req: Request, res: Response) {
  try {
    const { materia_id, nombre, tipo, fecha, hora, aula } = req.body;
    const rol = req.usuario?.rol;
    const usuarioId = req.usuario!.id;

    if (!materia_id || !nombre || !fecha) {
      return res.status(400).json({ error: "materia_id, nombre y fecha son obligatorios" });
    }

    // If profesor, verify they own the materia
    if (rol === 'profesor') {
      const esDueno = await ExamenModel.profesorEsDuenoMateria(usuarioId, materia_id);
      if (!esDueno) {
        return res.status(403).json({ error: "No puedes crear exámenes para materias que no te pertenecen" });
      }
    }

    const id = await ExamenModel.crearExamen({ materia_id, nombre, tipo, fecha, hora, aula });
    const examen = await ExamenModel.obtenerPorId(id);

    // ── Notificar a los alumnos inscriptos en la materia ──
    try {
      const alumnos = await NotificacionModel.obtenerAlumnosPorMateria(materia_id);
      const notificaciones = alumnos
        .filter((a) => a.usuario_id)
        .map((a) => ({
          usuario_id: a.usuario_id,
          titulo: "Nuevo examen",
          mensaje: `Nuevo examen de ${nombre} para el ${fecha}. Tipo: ${tipo}.`,
          tipo: "examen" as const,
          referencia_id: id,
          referencia_tipo: "examen",
        }));
      if (notificaciones.length > 0) {
        await NotificacionModel.crearNotificaciones(notificaciones);
      }
    } catch (notifErr) {
      console.error("Error al notificar sobre examen:", notifErr);
    }

    res.status(201).json({ message: "Examen creado correctamente", examen });
  } catch (error) {
    console.error("Error al crear examen:", error);
    res.status(500).json({ error: "Error al crear examen" });
  }
}

// PUT /api/examenes/:id — update (profesor or admin)
export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { materia_id, nombre, tipo, fecha, hora, aula } = req.body;
    const rol = req.usuario?.rol;
    const usuarioId = req.usuario!.id;

    const existing = await ExamenModel.obtenerPorId(Number(id));
    if (!existing) return res.status(404).json({ error: "Examen no encontrado" });

    // If profesor, verify they own the materia
    if (rol === 'profesor') {
      const esDueno = await ExamenModel.profesorEsDuenoMateria(usuarioId, existing.materia_id);
      if (!esDueno) {
        return res.status(403).json({ error: "No puedes modificar exámenes de materias que no te pertenecen" });
      }
    }

    const updated = await ExamenModel.actualizarExamen(Number(id), {
      materia_id, nombre, tipo, fecha, hora, aula,
    });

    if (!updated) return res.status(400).json({ error: "No se pudo actualizar el examen" });

    const examen = await ExamenModel.obtenerPorId(Number(id));
    res.json({ message: "Examen actualizado correctamente", examen });
  } catch (error) {
    console.error("Error al actualizar examen:", error);
    res.status(500).json({ error: "Error al actualizar examen" });
  }
}

// DELETE /api/examenes/:id — delete (profesor or admin)
export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const rol = req.usuario?.rol;
    const usuarioId = req.usuario!.id;

    const existing = await ExamenModel.obtenerPorId(Number(id));
    if (!existing) return res.status(404).json({ error: "Examen no encontrado" });

    // If profesor, verify they own the materia
    if (rol === 'profesor') {
      const esDueno = await ExamenModel.profesorEsDuenoMateria(usuarioId, existing.materia_id);
      if (!esDueno) {
        return res.status(403).json({ error: "No puedes eliminar exámenes de materias que no te pertenecen" });
      }
    }

    await ExamenModel.eliminarExamen(Number(id));
    res.json({ message: "Examen eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar examen:", error);
    res.status(500).json({ error: "Error al eliminar examen" });
  }
}
