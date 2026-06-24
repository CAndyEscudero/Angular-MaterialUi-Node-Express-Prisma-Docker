import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import * as AnuncioModel from "../models/anuncios.model";
import * as NotificacionModel from "../models/notificaciones.model";

// ── Helpers ─────────────────────────────────────────────

const VALID_TIPOS = ["general", "materia"] as const;
const VALID_ROLES_DESTINO = ["todos", "admin", "profesor", "alumno"] as const;
const VALID_ESTADOS = ["borrador", "publicado", "archivado"] as const;

function validarEnum<T extends string>(
  value: string | undefined,
  validValues: readonly T[],
  fieldName: string
): T | null {
  if (!value) return null;
  const found = validValues.find((v) => v === value);
  if (!found) {
    throw new Error(
      `Valor inválido para ${fieldName}. Valores permitidos: ${validValues.join(", ")}`
    );
  }
  return found;
}

// ── Notificaciones al publicar ──────────────────────────

/** Notificar a alumnos inscritos en una materia específica */
async function notificarPublicacionMateria(
  anuncioId: number,
  titulo: string,
  materiaId: number
): Promise<void> {
  const tituloNotif = `Nuevo anuncio: ${titulo}`;
  const alumnos = await NotificacionModel.obtenerAlumnosPorMateria(materiaId);

  if (alumnos.length === 0) return;

  await NotificacionModel.crearNotificaciones(
    alumnos.map((a) => ({
      usuario_id: a.usuario_id,
      titulo: tituloNotif,
      mensaje: tituloNotif,
      tipo: "anuncio" as const,
      referencia_id: anuncioId,
      referencia_tipo: "anuncio",
    }))
  );
}

async function notificarPublicacion(
  anuncioId: number,
  titulo: string,
  rolDestino: string
): Promise<void> {
  const tituloNotif = `Nuevo anuncio: ${titulo}`;
  const mensaje = tituloNotif;

  // Recolectar IDs de usuarios según rol_destino
  let usuariosDestino: { id: number; usuario_id: number }[] = [];

  if (rolDestino === "todos" || rolDestino === "alumno") {
    const alumnos = await NotificacionModel.obtenerTodosLosAlumnos();
    usuariosDestino.push(...alumnos);
  }
  if (rolDestino === "todos" || rolDestino === "profesor") {
    const profesores = await NotificacionModel.obtenerTodosLosProfesores();
    usuariosDestino.push(...profesores);
  }
  if (rolDestino === "todos" || rolDestino === "admin") {
    // Admins: buscar usuarios con rol admin
    const [admins] = await pool.query(
      "SELECT id FROM usuarios WHERE rol = 'admin'"
    );
    for (const a of admins as any[]) {
      usuariosDestino.push({ id: a.id, usuario_id: a.id });
    }
  }

  // Eliminar duplicados (mismo usuario_id)
  const vistos = new Set<number>();
  const unicos = usuariosDestino.filter((u) => {
    if (vistos.has(u.usuario_id)) return false;
    vistos.add(u.usuario_id);
    return true;
  });

  if (unicos.length === 0) return;

  // Crear notificaciones
  await NotificacionModel.crearNotificaciones(
    unicos.map((u) => ({
      usuario_id: u.usuario_id,
      titulo: tituloNotif,
      mensaje,
      tipo: "anuncio" as const,
      referencia_id: anuncioId,
      referencia_tipo: "anuncio",
    }))
  );
}

// ── Handlers ────────────────────────────────────────────

/** GET /api/anuncios/admin — todos los anuncios (admin) */
export async function listarTodos(req: Request, res: Response) {
  try {
    const anuncios = await AnuncioModel.listarTodos();
    res.json(anuncios);
  } catch (error) {
    console.error("Error al listar anuncios:", error);
    res.status(500).json({ error: "Error al listar anuncios" });
  }
}

/** GET /api/anuncios/publicados — anuncios publicados visibles (con materia filtering) */
export async function listarPublicados(req: Request, res: Response) {
  try {
    const rol = req.usuario?.rol;
    const usuarioId = req.usuario?.id;

    let anuncios: AnuncioModel.Anuncio[];
    if (rol && usuarioId && (rol === "alumno" || rol === "profesor")) {
      anuncios = await AnuncioModel.listarPublicadosPorUsuario(rol, usuarioId);
    } else {
      anuncios = await AnuncioModel.listarPublicados(rol);
    }
    res.json(anuncios);
  } catch (error) {
    console.error("Error al listar anuncios publicados:", error);
    res.status(500).json({ error: "Error al listar anuncios" });
  }
}

/** GET /api/anuncios/:id — obtener un anuncio */
export async function obtenerPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const anuncio = await AnuncioModel.obtenerPorId(Number(id));
    if (!anuncio) {
      return res.status(404).json({ error: "Anuncio no encontrado" });
    }
    res.json(anuncio);
  } catch (error) {
    console.error("Error al obtener anuncio:", error);
    res.status(500).json({ error: "Error al obtener anuncio" });
  }
}

/** GET /api/anuncios/docente — listar anuncios de materia del profesor */
export async function listarDocente(req: Request, res: Response) {
  try {
    const usuarioId = req.usuario!.id;
    const esAdmin = req.usuario?.rol === "admin";
    const anuncios = await AnuncioModel.listarDocenteMaterias(usuarioId, esAdmin);
    res.json(anuncios);
  } catch (error) {
    console.error("Error al listar anuncios del docente:", error);
    res.status(500).json({ error: "Error al listar anuncios" });
  }
}

/** POST /api/anuncios/materia — crear anuncio de materia (profesor/admin) */
export async function crearMateriaAnuncio(req: Request, res: Response) {
  try {
    const { titulo, contenido, materia_id, estado } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: "El título es obligatorio" });
    }
    if (!contenido || !contenido.trim()) {
      return res.status(400).json({ error: "El contenido es obligatorio" });
    }
    if (!materia_id) {
      return res.status(400).json({ error: "Los anuncios por materia requieren un materia_id" });
    }

    // Verificar que la materia existe y pertenece al profesor (o es admin)
    const [materias] = await pool.query<RowDataPacket[]>(
      "SELECT id, profesor_id FROM materias WHERE id = ?",
      [materia_id]
    );
    const materia = (materias as any[])[0];
    if (!materia) {
      return res.status(404).json({ error: "Materia no encontrada" });
    }

    const esAdmin = req.usuario?.rol === "admin";
    if (!esAdmin && materia.profesor_id !== req.usuario!.id) {
      return res.status(403).json({ error: "No podés crear anuncios para una materia que no te pertenece" });
    }

    const creadoPor = req.usuario!.id;

    // Calcular fecha_publicacion si se publica directamente
    let fechaPub: string | null = null;
    const estadoFinal = estado || "borrador";
    if (estadoFinal === "publicado") {
      fechaPub = new Date().toISOString().slice(0, 19).replace("T", " ");
    }

    const id = await AnuncioModel.crear({
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      tipo: "materia",
      materia_id,
      creado_por: creadoPor,
      rol_destino: "todos", // Los de materia siempre visibles para todos (filtrados por materia)
      estado: estadoFinal as "borrador" | "publicado",
      fecha_publicacion: fechaPub,
    });

    const anuncio = await AnuncioModel.obtenerPorId(id);

    // Notificar a los alumnos de la materia si se publicó
    if (estadoFinal === "publicado") {
      await notificarPublicacionMateria(id, titulo.trim(), materia_id);
    }

    res.status(201).json({ message: "Anuncio de materia creado correctamente", anuncio });
  } catch (error: any) {
    console.error("Error al crear anuncio de materia:", error);
    res.status(500).json({ error: "Error al crear anuncio de materia" });
  }
}

/** POST /api/anuncios — crear anuncio (admin) */
export async function crear(req: Request, res: Response) {
  try {
    const { titulo, contenido, tipo, materia_id, rol_destino, estado, fecha_publicacion } = req.body;

    // Validar campos obligatorios
    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: "El título es obligatorio" });
    }
    if (!contenido || !contenido.trim()) {
      return res.status(400).json({ error: "El contenido es obligatorio" });
    }

    // Validar enums
    const tipoValido = validarEnum(tipo, VALID_TIPOS, "tipo");
    const rolDestinoValido = validarEnum(rol_destino, VALID_ROLES_DESTINO, "rol_destino");
    const estadoValido = validarEnum(estado, VALID_ESTADOS, "estado");

    // Por ahora solo permitir tipo='general' desde la API
    if (tipoValido === "materia" && !materia_id) {
      return res.status(400).json({
        error: "Los anuncios por materia requieren un materia_id",
      });
    }

    const creadoPor = req.usuario!.id;

    // Calcular fecha_publicacion si se publica directamente
    let fechaPub = fecha_publicacion || null;
    if ((estadoValido || "borrador") === "publicado" && !fechaPub) {
      fechaPub = new Date().toISOString().slice(0, 19).replace("T", " ");
    }

    const id = await AnuncioModel.crear({
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      tipo: tipoValido || "general",
      materia_id: materia_id || null,
      creado_por: creadoPor,
      rol_destino: rolDestinoValido || "todos",
      estado: estadoValido || "borrador",
      fecha_publicacion: fechaPub,
    });

    const anuncio = await AnuncioModel.obtenerPorId(id);

    // Notificar si se publicó
    if ((estadoValido || "borrador") === "publicado") {
      await notificarPublicacion(id, titulo.trim(), rolDestinoValido || "todos");
    }

    res.status(201).json({ message: "Anuncio creado correctamente", anuncio });
  } catch (error: any) {
    if (error.message?.startsWith("Valor inválido")) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error al crear anuncio:", error);
    res.status(500).json({ error: "Error al crear anuncio" });
  }
}

/** PUT /api/anuncios/:id — actualizar anuncio (admin / profesor de su materia) */
export async function actualizar(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { titulo, contenido, tipo, materia_id, rol_destino, estado, fecha_publicacion } = req.body;
    const usuarioId = req.usuario!.id;
    const esAdmin = req.usuario?.rol === "admin";

    // Obtener anuncio actual para validación
    const actual = await AnuncioModel.obtenerPorId(Number(id));
    if (!actual) {
      return res.status(404).json({ error: "Anuncio no encontrado" });
    }

    // ── Profesor: ownership check ──
    if (!esAdmin) {
      const esDueno = await AnuncioModel.profesorEsDuenoAnuncio(usuarioId, Number(id));
      if (!esDueno) {
        return res.status(403).json({
          error: "No podés modificar anuncios que no pertenecen a tus materias",
        });
      }
      // Profesor NO puede cambiar a tipo 'general'
      if (tipo !== undefined && tipo === "general") {
        return res.status(403).json({
          error: "No podés cambiar un anuncio de materia a general",
        });
      }
    }

    // Validar enums si se envían
    let tipoValido: "general" | "materia" | undefined;
    let rolDestinoValido: "todos" | "admin" | "profesor" | "alumno" | undefined;
    let estadoValido: "borrador" | "publicado" | "archivado" | undefined;

    if (tipo) {
      const v = validarEnum(tipo, VALID_TIPOS, "tipo");
      if (v) tipoValido = v;
    }
    if (rol_destino) {
      const v = validarEnum(rol_destino, VALID_ROLES_DESTINO, "rol_destino");
      if (v) rolDestinoValido = v;
    }
    if (estado) {
      const v = validarEnum(estado, VALID_ESTADOS, "estado");
      if (v) estadoValido = v;
    }

    // Determinar tipo y materia_id efectivos tras la actualización
    const effectiveTipo = tipoValido || actual.tipo;
    const effectiveMateriaId = materia_id !== undefined ? materia_id : actual.materia_id;

    // Si el resultado final es tipo='materia', materia_id debe estar presente
    if (effectiveTipo === "materia" && (effectiveMateriaId === null || effectiveMateriaId === undefined || effectiveMateriaId === "")) {
      return res.status(400).json({
        error: "Los anuncios por materia requieren un materia_id",
      });
    }

    // ── Profesor: si cambia materia_id, verificar que la nueva materia le pertenece ──
    if (!esAdmin && materia_id !== undefined && materia_id !== actual.materia_id) {
      const nuevaMateriaDueno = await AnuncioModel.profesorEsDuenoMateria(usuarioId, materia_id);
      if (!nuevaMateriaDueno) {
        return res.status(403).json({
          error: "No podés asignar un anuncio a una materia que no te pertenece",
        });
      }
    }

    const data: AnuncioModel.ActualizarAnuncioData = {};
    if (titulo !== undefined) data.titulo = titulo.trim();
    if (contenido !== undefined) data.contenido = contenido.trim();
    if (tipoValido !== undefined) data.tipo = tipoValido;
    if (materia_id !== undefined) data.materia_id = materia_id;
    if (rolDestinoValido !== undefined) data.rol_destino = rolDestinoValido;
    if (estadoValido !== undefined) data.estado = estadoValido;
    if (fecha_publicacion !== undefined) data.fecha_publicacion = fecha_publicacion;

    const ok = await AnuncioModel.actualizar(Number(id), data);
    if (!ok) {
      return res.status(404).json({ error: "Anuncio no encontrado" });
    }

    const anuncio = await AnuncioModel.obtenerPorId(Number(id));
    res.json({ message: "Anuncio actualizado correctamente", anuncio });
  } catch (error: any) {
    if (error.message?.startsWith("Valor inválido")) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error al actualizar anuncio:", error);
    res.status(500).json({ error: "Error al actualizar anuncio" });
  }
}

/** PUT /api/anuncios/:id/publicar — publicar anuncio (admin / profesor de su materia) */
export async function publicarHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario!.id;
    const esAdmin = req.usuario?.rol === "admin";

    const anuncio = await AnuncioModel.obtenerPorId(Number(id));

    if (!anuncio) {
      return res.status(404).json({ error: "Anuncio no encontrado" });
    }

    // ── Profesor: ownership check ──
    if (!esAdmin) {
      const esDueno = await AnuncioModel.profesorEsDuenoAnuncio(usuarioId, Number(id));
      if (!esDueno) {
        return res.status(403).json({
          error: "No podés publicar anuncios que no pertenecen a tus materias",
        });
      }
      // Profesor no puede publicar anuncios generales (ya cubierto por profesorEsDuenoAnuncio
      // que verifica tipo='materia', pero dejamos guarda explícita)
      if (anuncio.tipo !== "materia") {
        return res.status(403).json({
          error: "No podés publicar anuncios generales",
        });
      }
    }

    if (anuncio.estado === "archivado") {
      return res.status(400).json({ error: "No se puede publicar un anuncio archivado" });
    }

    const ok = await AnuncioModel.publicar(Number(id));
    if (!ok) {
      return res.status(400).json({ error: "No se pudo publicar el anuncio" });
    }

    const actualizado = await AnuncioModel.obtenerPorId(Number(id));

    // Notificar a los usuarios correspondientes
    if (anuncio.tipo === "materia" && anuncio.materia_id) {
      await notificarPublicacionMateria(Number(id), anuncio.titulo, anuncio.materia_id);
    } else {
      await notificarPublicacion(Number(id), anuncio.titulo, anuncio.rol_destino);
    }

    res.json({ message: "Anuncio publicado correctamente", anuncio: actualizado });
  } catch (error) {
    console.error("Error al publicar anuncio:", error);
    res.status(500).json({ error: "Error al publicar anuncio" });
  }
}

/** PUT /api/anuncios/:id/archivar — archivar anuncio (admin / profesor de su materia) */
export async function archivarHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario!.id;
    const esAdmin = req.usuario?.rol === "admin";

    // ── Profesor: ownership check ──
    if (!esAdmin) {
      const esDueno = await AnuncioModel.profesorEsDuenoAnuncio(usuarioId, Number(id));
      if (!esDueno) {
        return res.status(403).json({
          error: "No podés archivar anuncios que no pertenecen a tus materias",
        });
      }
    }

    const ok = await AnuncioModel.archivar(Number(id));

    if (!ok) {
      return res.status(400).json({
        error: "No se pudo archivar. Solo se pueden archivar anuncios publicados",
      });
    }

    res.json({ message: "Anuncio archivado correctamente" });
  } catch (error) {
    console.error("Error al archivar anuncio:", error);
    res.status(500).json({ error: "Error al archivar anuncio" });
  }
}

/** DELETE /api/anuncios/:id — eliminar anuncio (admin / profesor de su materia) */
export async function eliminarHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario!.id;
    const esAdmin = req.usuario?.rol === "admin";

    // ── Profesor: ownership check ──
    if (!esAdmin) {
      const esDueno = await AnuncioModel.profesorEsDuenoAnuncio(usuarioId, Number(id));
      if (!esDueno) {
        return res.status(403).json({
          error: "No podés eliminar anuncios que no pertenecen a tus materias",
        });
      }
    }

    const ok = await AnuncioModel.eliminar(Number(id));

    if (!ok) {
      return res.status(404).json({ error: "Anuncio no encontrado" });
    }

    res.json({ message: "Anuncio eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar anuncio:", error);
    res.status(500).json({ error: "Error al eliminar anuncio" });
  }
}
