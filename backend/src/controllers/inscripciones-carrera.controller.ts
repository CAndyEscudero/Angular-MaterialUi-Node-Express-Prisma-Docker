import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { pool } from "../config/db";
import * as InscripcionCarreraModel from "../models/inscripciones-carrera.model";
import * as NotificacionModel from "../models/notificaciones.model";
import {
  obtenerAlumnoPorUsuarioId,
  extraerPrefijoLegajo,
  generarLegajo,
  actualizarLegajo,
} from "../models/alumnos.model";

// ──────────────────────────────────────────────
// Multer configuration
// ──────────────────────────────────────────────

const UPLOADS_DIR = path.resolve(__dirname, "../../uploads/inscripciones-carrera");

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo JPG, PNG y PDF."));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ──────────────────────────────────────────────
// Helper: validate tipo_documento
// ──────────────────────────────────────────────

const TIPOS_VALIDOS = [
  "dni_frente",
  "dni_dorso",
  "titulo_secundario",
  "foto_carnet",
  "otro",
];

function esTipoValido(tipo: string): boolean {
  return TIPOS_VALIDOS.includes(tipo);
}

// ──────────────────────────────────────────────
// GET /api/inscripciones-carrera/mi-solicitud
// Student gets their own application
// ──────────────────────────────────────────────

export async function getMiSolicitud(req: Request, res: Response) {
  try {
    const usuarioId = req.usuario!.id;
    const alumno = await obtenerAlumnoPorUsuarioId(usuarioId);

    if (!alumno) {
      return res.status(400).json({ error: "Perfil de alumno no encontrado" });
    }

    const solicitud = await InscripcionCarreraModel.obtenerPorAlumno(alumno.id);

    res.json(solicitud);
  } catch (error) {
    console.error("Error al obtener solicitud:", error);
    res.status(500).json({ error: "Error al obtener solicitud" });
  }
}

// ──────────────────────────────────────────────
// POST /api/inscripciones-carrera/solicitar
// Student applies to a carrera with documents (multipart/form-data)
// ──────────────────────────────────────────────

export const solicitarInscripcionCarrera = [
  // Multer middleware handles 'documentos' field (array of files)
  upload.fields([
    { name: "dni_frente", maxCount: 1 },
    { name: "dni_dorso", maxCount: 1 },
    { name: "titulo_secundario", maxCount: 1 },
    { name: "foto_carnet", maxCount: 1 },
    { name: "otro", maxCount: 1 },
  ]),

  async (req: Request, res: Response) => {
    try {
      const { carrera_id } = req.body;
      const usuarioId = req.usuario!.id;

      if (!carrera_id) {
        return res.status(400).json({ error: "carrera_id es obligatorio" });
      }

      const alumno = await obtenerAlumnoPorUsuarioId(usuarioId);

      if (!alumno) {
        return res.status(400).json({ error: "Perfil de alumno no encontrado" });
      }

      // Check if student already has a pending/approved application
      const existente = await InscripcionCarreraModel.obtenerPorAlumno(alumno.id);
      if (existente) {
        if (existente.estado === "pendiente") {
          return res.status(409).json({
            error: "Ya tienes una solicitud pendiente. Espera a que sea revisada.",
          });
        }
        if (existente.estado === "aprobada") {
          return res.status(409).json({
            error: "Ya estás inscripto en una carrera.",
          });
        }
        // If rejected or cancelled, they can re-apply (old one stays for history)
      }

      // Create the application
      const inscripcionId = await InscripcionCarreraModel.crearSolicitud(
        alumno.id,
        Number(carrera_id)
      );

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Save document records for uploaded files
      for (const [tipo, fileArray] of Object.entries(files)) {
        if (!esTipoValido(tipo)) continue;
        const file = fileArray[0];
        await InscripcionCarreraModel.insertarDocumento({
          inscripcion_carrera_id: inscripcionId,
          tipo_documento: tipo,
          nombre_archivo_original: file.originalname,
          nombre_archivo_guardado: file.filename,
          ruta_archivo: `uploads/inscripciones-carrera/${file.filename}`,
          mime_type: file.mimetype,
          tamanio_bytes: file.size,
        });
      }

      res.status(201).json({
        message: "Solicitud de inscripción creada correctamente",
        id: inscripcionId,
      });
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          error: "Ya tienes una solicitud activa. No puedes crear otra.",
        });
      }
      if (error?.message?.includes?.("Tipo de archivo no permitido")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error al crear solicitud:", error);
      res.status(500).json({ error: "Error al crear solicitud de inscripción" });
    }
  },
];

// ──────────────────────────────────────────────
// GET /api/inscripciones-carrera (admin)
// Admin lists all applications
// ──────────────────────────────────────────────

export async function getTodasLasSolicitudes(req: Request, res: Response) {
  try {
    const { estado } = req.query;
    const solicitudes = await InscripcionCarreraModel.obtenerTodas(
      estado as string | undefined
    );
    res.json(solicitudes);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
}

// ──────────────────────────────────────────────
// GET /api/inscripciones-carrera/:id (admin)
// Admin gets application detail
// ──────────────────────────────────────────────

export async function getSolicitudPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const solicitud = await InscripcionCarreraModel.obtenerPorId(Number(id));

    if (!solicitud) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    res.json(solicitud);
  } catch (error) {
    console.error("Error al obtener solicitud:", error);
    res.status(500).json({ error: "Error al obtener solicitud" });
  }
}

// ──────────────────────────────────────────────
// PUT /api/inscripciones-carrera/:id/revisar (admin)
// Admin approves or rejects an application
// ──────────────────────────────────────────────

export async function revisarSolicitud(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { estado, motivo_rechazo } = req.body;
    const usuarioId = req.usuario!.id;

    if (!estado || !["aprobada", "rechazada"].includes(estado)) {
      return res
        .status(400)
        .json({ error: "estado debe ser 'aprobada' o 'rechazada'" });
    }

    if (estado === "rechazada" && !motivo_rechazo) {
      return res
        .status(400)
        .json({ error: "motivo_rechazo es obligatorio al rechazar" });
    }

    // Get the application to check it exists and is pending
    const solicitud = await InscripcionCarreraModel.obtenerPorId(Number(id));
    if (!solicitud) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    if (solicitud.estado !== "pendiente") {
      return res.status(400).json({
        error: `La solicitud ya fue ${solicitud.estado}. No se puede modificar.`,
      });
    }

    const updated = await InscripcionCarreraModel.revisarSolicitud(
      Number(id),
      estado,
      usuarioId,
      motivo_rechazo || null
    );

    if (!updated) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    // If approved, update alumno.carrera_id and generate legajo if needed
    if (estado === "aprobada") {
      // Obtener datos actuales del alumno
      const [alumnoRows] = await pool.query(
        "SELECT id, legajo FROM alumnos WHERE id = ?",
        [solicitud.alumno_id]
      );
      const alumno = (alumnoRows as any[])[0];

      // Actualizar carrera_id
      await pool.query(
        "UPDATE alumnos SET carrera_id = ? WHERE id = ?",
        [solicitud.carrera_id, solicitud.alumno_id]
      );

      // Generar legajo si el alumno no tiene uno
      if (alumno && !alumno.legajo) {
        const prefijo = extraerPrefijoLegajo(solicitud.carrera_codigo || "");
        const legajo = await generarLegajo(prefijo);
        await actualizarLegajo(solicitud.alumno_id, legajo);
      }
    }

    // ── Notificar al alumno ──
    try {
      const [usuarioRows] = await pool.query(
        "SELECT usuario_id FROM alumnos WHERE id = ?",
        [solicitud.alumno_id]
      );
      const alumnoUsuario = (usuarioRows as any[])[0];
      if (alumnoUsuario?.usuario_id) {
        if (estado === "aprobada") {
          const [alumnoData] = await pool.query(
            "SELECT legajo FROM alumnos WHERE id = ?",
            [solicitud.alumno_id]
          );
          const legajoVal = (alumnoData as any[])[0]?.legajo || "—";
          await NotificacionModel.crearNotificacion({
            usuario_id: alumnoUsuario.usuario_id,
            titulo: "Solicitud de carrera aprobada",
            mensaje: `¡Felicitaciones! Tu solicitud para ${solicitud.carrera_nombre || "la carrera"} fue aprobada. Tu legajo es ${legajoVal}.`,
            tipo: "carrera",
            referencia_id: solicitud.id,
            referencia_tipo: "inscripcion_carrera",
          });
        } else {
          await NotificacionModel.crearNotificacion({
            usuario_id: alumnoUsuario.usuario_id,
            titulo: "Solicitud de carrera rechazada",
            mensaje: `Tu solicitud para ${solicitud.carrera_nombre || "la carrera"} fue rechazada. Motivo: ${motivo_rechazo || "No especificado"}.`,
            tipo: "carrera",
            referencia_id: solicitud.id,
            referencia_tipo: "inscripcion_carrera",
          });
        }
      }
    } catch (notifErr) {
      console.error("Error al crear notificación:", notifErr);
    }

    res.json({
      message:
        estado === "aprobada"
          ? "Solicitud aprobada correctamente"
          : "Solicitud rechazada",
    });
  } catch (error) {
    console.error("Error al revisar solicitud:", error);
    res.status(500).json({ error: "Error al revisar solicitud" });
  }
}

// ──────────────────────────────────────────────
// GET /api/inscripciones-carrera/documentos/:docId
// Download/view a document (protected — admin or owner)
// ──────────────────────────────────────────────

export async function descargarDocumento(req: Request, res: Response) {
  try {
    const { docId } = req.params;
    const usuarioRol = req.usuario?.rol;
    const usuarioId = req.usuario!.id;

    const doc = await InscripcionCarreraModel.obtenerDocumentoPorId(
      Number(docId)
    );

    if (!doc) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    // Ownership check: student can see own docs; admin can see all
    if (usuarioRol !== "admin") {
      const alumno = await obtenerAlumnoPorUsuarioId(usuarioId);
      if (!alumno || alumno.id !== doc.alumno_id) {
        return res
          .status(403)
          .json({ error: "No tienes permiso para ver este documento" });
      }
    }

    const filePath = path.resolve(__dirname, "../../", doc.ruta_archivo);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo no encontrado en el servidor" });
    }

    res.setHeader("Content-Type", doc.mime_type || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${doc.nombre_archivo_original}"`
    );
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error al descargar documento:", error);
    res.status(500).json({ error: "Error al descargar documento" });
  }
}
