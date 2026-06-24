-- ============================================
-- Migration 011: Sistema de Anuncios
-- ============================================
-- Recrea la tabla anuncios con soporte para:
--   - Anuncios generales (tipo='general')
--   - Anuncios por materia (tipo='materia') — preparado para futuro
--   - Roles destino y estados de publicación
--   - Notificaciones automáticas al publicar
-- ============================================

-- ── 1. Crear tabla anuncios (si no existe) ────────────

CREATE TABLE IF NOT EXISTS anuncios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    contenido TEXT NOT NULL,
    tipo ENUM('general','materia') NOT NULL DEFAULT 'general',
    materia_id INT DEFAULT NULL,
    creado_por INT NOT NULL,
    rol_destino ENUM('todos','admin','profesor','alumno') NOT NULL DEFAULT 'todos',
    estado ENUM('borrador','publicado','archivado') NOT NULL DEFAULT 'borrador',
    fecha_publicacion DATETIME DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL,
    INDEX idx_anuncios_estado (estado),
    INDEX idx_anuncios_rol_destino (rol_destino),
    INDEX idx_anuncios_tipo (tipo),
    INDEX idx_anuncios_fecha_publicacion (fecha_publicacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 1.1 Migrar tablas anuncios existentes sin perder datos ──
-- Versiones anteriores (003_extender_campus_virtual.sql) creaban
-- anuncios con un schema mínimo. CREATE TABLE IF NOT EXISTS no
-- actualiza tablas existentes, por eso agregamos columnas faltantes
-- usando INFORMATION_SCHEMA + prepared statements.

SET @schema_name = DATABASE();

SET @add_tipo = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE anuncios ADD COLUMN tipo ENUM('general','materia') NOT NULL DEFAULT 'general' AFTER contenido",
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'anuncios'
    AND COLUMN_NAME = 'tipo'
);
PREPARE stmt FROM @add_tipo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rol_destino = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE anuncios ADD COLUMN rol_destino ENUM('todos','admin','profesor','alumno') NOT NULL DEFAULT 'todos' AFTER creado_por",
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'anuncios'
    AND COLUMN_NAME = 'rol_destino'
);
PREPARE stmt FROM @add_rol_destino;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_estado = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE anuncios ADD COLUMN estado ENUM('borrador','publicado','archivado') NOT NULL DEFAULT 'borrador' AFTER rol_destino",
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'anuncios'
    AND COLUMN_NAME = 'estado'
);
PREPARE stmt FROM @add_estado;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_fecha_publicacion = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE anuncios ADD COLUMN fecha_publicacion DATETIME DEFAULT NULL AFTER estado',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'anuncios'
    AND COLUMN_NAME = 'fecha_publicacion'
);
PREPARE stmt FROM @add_fecha_publicacion;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_creado_en = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE anuncios ADD COLUMN creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER fecha_publicacion',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'anuncios'
    AND COLUMN_NAME = 'creado_en'
);
PREPARE stmt FROM @add_creado_en;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_actualizado_en = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE anuncios ADD COLUMN actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER creado_en',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'anuncios'
    AND COLUMN_NAME = 'actualizado_en'
);
PREPARE stmt FROM @add_actualizado_en;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sync_legacy_dates = (
  SELECT IF(
    SUM(COLUMN_NAME = 'created_at') > 0 AND SUM(COLUMN_NAME = 'updated_at') > 0,
    'UPDATE anuncios SET creado_en = COALESCE(created_at, creado_en), actualizado_en = COALESCE(updated_at, actualizado_en) WHERE created_at IS NOT NULL OR updated_at IS NOT NULL',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'anuncios'
    AND COLUMN_NAME IN ('created_at', 'updated_at')
);
PREPARE stmt FROM @sync_legacy_dates;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── 2. Agregar tipo 'anuncio' al ENUM de notificaciones ──

ALTER TABLE notificaciones
MODIFY COLUMN tipo ENUM('sistema','inscripcion','nota','examen','carrera','anuncio') NOT NULL DEFAULT 'sistema';
