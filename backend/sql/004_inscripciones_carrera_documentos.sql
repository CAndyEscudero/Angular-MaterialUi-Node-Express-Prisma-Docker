-- ============================================================
-- Migration 004: Inscripciones a Carreras y Documentos
--
-- Proposito: Agregar tablas para que los alumnos se inscriban
-- a carreras (primer nivel, antes que inscripcion a materias)
-- y suban documentos requeridos para validacion administrativa.
--
-- Compatibilidad: MySQL 8.0+
-- Idempotente: Se puede ejecutar multiples veces sin errores
-- Seguro para DB existente: No borra datos ni tablas
--
-- Como ejecutar:
--   docker exec -i thesis-mysql mysql -uroot -proot < 004_inscripciones_carrera_documentos.sql
--   mysql -u root -p educacion < 004_inscripciones_carrera_documentos.sql
-- ============================================================

USE educacion;

-- ============================================================
-- Tabla: inscripciones_carrera
-- ============================================================
-- Registra la solicitud de un alumno para inscribirse a una
-- carrera. El estado sigue el flujo: pendiente -> aprobada|rechazada.
-- UNIQUE(alumno_id) garantiza una unica solicitud activa por alumno.
-- ============================================================
CREATE TABLE IF NOT EXISTS inscripciones_carrera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    carrera_id INT NOT NULL,
    estado ENUM('pendiente','aprobada','rechazada','cancelada') NOT NULL DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP NULL DEFAULT NULL,
    revisado_por INT DEFAULT NULL,
    motivo_rechazo VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE,
    FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY uk_alumno_carrera (alumno_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: documentos_inscripcion
-- ============================================================
-- Almacena los metadatos de los documentos subidos por el alumno
-- como parte de su solicitud de inscripcion a carrera.
-- Los archivos se guardan en backend/uploads/inscripciones-carrera/
-- ============================================================
CREATE TABLE IF NOT EXISTS documentos_inscripcion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_carrera_id INT NOT NULL,
    tipo_documento ENUM('dni_frente','dni_dorso','titulo_secundario','foto_carnet','otro') NOT NULL,
    nombre_archivo_original VARCHAR(255) NOT NULL,
    nombre_archivo_guardado VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) DEFAULT NULL,
    tamanio_bytes INT DEFAULT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_carrera_id) REFERENCES inscripciones_carrera(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Indices
-- ============================================================
CREATE INDEX idx_insc_carrera_alumno ON inscripciones_carrera(alumno_id);
CREATE INDEX idx_insc_carrera_estado ON inscripciones_carrera(estado);
CREATE INDEX idx_insc_carrera_carrera ON inscripciones_carrera(carrera_id);
CREATE INDEX idx_docs_inscripcion ON documentos_inscripcion(inscripcion_carrera_id);

-- ============================================================
-- Fin de migracion 004
-- ============================================================
