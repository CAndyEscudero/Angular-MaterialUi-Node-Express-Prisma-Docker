import { Request, Response } from "express";
import * as PeriodoModel from "../models/periodos-inscripcion.model";
import * as NotificacionModel from "../models/notificaciones.model";

export async function getAll(req: Request, res: Response) {
  try {
    const periodos = await PeriodoModel.obtenerTodos();
    res.json(periodos);
  } catch (error) {
    console.error("Error al obtener períodos:", error);
    res.status(500).json({ error: "Error al obtener períodos" });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const periodo = await PeriodoModel.obtenerPorId(Number(id));
    if (!periodo) {
      return res.status(404).json({ error: "Período no encontrado" });
    }
    res.json(periodo);
  } catch (error) {
    console.error("Error al obtener período:", error);
    res.status(500).json({ error: "Error al obtener período" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { nombre, fecha_inicio, fecha_fin, activo, carrera_id, anio_academico, cuatrimestre } = req.body;

    if (!nombre || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: "nombre, fecha_inicio y fecha_fin son obligatorios" });
    }

    if (new Date(fecha_fin) < new Date(fecha_inicio)) {
      return res.status(400).json({ error: "fecha_fin debe ser posterior a fecha_inicio" });
    }

    const id = await PeriodoModel.crearPeriodo({
      nombre, fecha_inicio, fecha_fin, activo, carrera_id, anio_academico, cuatrimestre,
    });

    const periodo = await PeriodoModel.obtenerPorId(id);

    // ── Notificar a todos los alumnos y profesores ──
    try {
      const alumnos = await NotificacionModel.obtenerTodosLosAlumnos();
      const profesores = await NotificacionModel.obtenerTodosLosProfesores();
      const todos = [...alumnos, ...profesores].filter((u) => u.usuario_id);

      const notificaciones = todos.map((u) => ({
        usuario_id: u.usuario_id,
        titulo: "Nuevo período de inscripción",
        mensaje: `El período "${nombre}" está abierto del ${fecha_inicio} al ${fecha_fin}.`,
        tipo: "inscripcion" as const,
        referencia_id: id,
        referencia_tipo: "periodo_inscripcion",
      }));

      if (notificaciones.length > 0) {
        await NotificacionModel.crearNotificaciones(notificaciones);
      }
    } catch (notifErr) {
      console.error("Error al notificar sobre período:", notifErr);
    }

    res.status(201).json({ message: "Período creado correctamente", periodo });
  } catch (error) {
    console.error("Error al crear período:", error);
    res.status(500).json({ error: "Error al crear período" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nombre, fecha_inicio, fecha_fin, activo, carrera_id, anio_academico, cuatrimestre } = req.body;

    const existing = await PeriodoModel.obtenerPorId(Number(id));
    if (!existing) {
      return res.status(404).json({ error: "Período no encontrado" });
    }

    const updated = await PeriodoModel.actualizarPeriodo(Number(id), {
      nombre, fecha_inicio, fecha_fin, activo, carrera_id, anio_academico, cuatrimestre,
    });

    if (!updated) {
      return res.status(400).json({ error: "No se pudo actualizar el período" });
    }

    const periodo = await PeriodoModel.obtenerPorId(Number(id));
    res.json({ message: "Período actualizado correctamente", periodo });
  } catch (error) {
    console.error("Error al actualizar período:", error);
    res.status(500).json({ error: "Error al actualizar período" });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await PeriodoModel.obtenerPorId(Number(id));
    if (!existing) {
      return res.status(404).json({ error: "Período no encontrado" });
    }

    await PeriodoModel.eliminarPeriodo(Number(id));
    res.json({ message: "Período eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar período:", error);
    res.status(500).json({ error: "Error al eliminar período" });
  }
}
