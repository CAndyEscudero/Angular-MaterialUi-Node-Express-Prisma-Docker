-- ============================================================
-- Migration 008: Períodos de Inscripción
--
-- Propósito:
--   Agregar una regla de negocio académica defendible:
--   los alumnos SOLO pueden inscribirse a materias cuando hay
--   un período de inscripción activo.
--
--   Esto evita inscripciones fuera de término y permite a la
--   administración definir ventanas de inscripción por
--   cuatrimestre, año académico, o carrera.
--
-- Idempotente: Se puede ejecutar múltiples veces sin errores.
-- Seguro para DB existente: No borra datos ni tablas.
--
-- Demo activo:
--   Se inserta un período demo que cubre desde 30 días antes
--   hasta 60 días después de la fecha actual, garantizando
--   que la inscripción funcione sin cambios manuales en
--   entornos de desarrollo/demo.
--
-- Cómo ejecutar:
--   docker exec -i thesis-mysql mysql -uroot -proot < 008_periodos_inscripcion.sql
--   mysql -u root -p educacion < 008_periodos_inscripcion.sql
-- ============================================================

USE educacion;

-- ============================================================
-- 1. Crear tabla si no existe (idempotente)
-- ============================================================
CREATE TABLE IF NOT EXISTS periodos_inscripcion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    carrera_id INT DEFAULT NULL,
    anio_academico INT DEFAULT NULL,
    cuatrimestre TINYINT DEFAULT NULL COMMENT '1 = primer cuatrimestre, 2 = segundo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL,
    INDEX idx_periodo_fechas (fecha_inicio, fecha_fin),
    INDEX idx_periodo_activo (activo),
    CONSTRAINT chk_fecha CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. Insertar período demo activo (solo si no hay ninguno)
--    Fechas dinámicas: 30 días atrás a 60 días adelante
--    = siempre cubre la fecha actual en entornos demo.
-- ============================================================
INSERT INTO periodos_inscripcion (nombre, fecha_inicio, fecha_fin, activo, anio_academico, cuatrimestre)
SELECT 'Período Demo 2026 - 1er Cuatrimestre',
       DATE_SUB(CURDATE(), INTERVAL 30 DAY),
       DATE_ADD(CURDATE(), INTERVAL 60 DAY),
       1,
       YEAR(CURDATE()),
       1
WHERE NOT EXISTS (
    SELECT 1 FROM periodos_inscripcion WHERE activo = 1
);

-- ============================================================
-- Fin de migración 008
-- ============================================================
