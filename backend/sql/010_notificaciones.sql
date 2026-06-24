-- ============================================
-- Migration 010: Sistema de Notificaciones
-- ============================================
-- Crea la tabla de notificaciones para el centro
-- de notificaciones in-app del campus virtual.
-- ============================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT,
  tipo ENUM('sistema','inscripcion','nota','examen','carrera','anuncio') NOT NULL DEFAULT 'sistema',
  referencia_id INT DEFAULT NULL,
  referencia_tipo VARCHAR(50) DEFAULT NULL,
  leida TINYINT(1) NOT NULL DEFAULT 0,
  creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_leida (usuario_id, leida),
  INDEX idx_creada_en (creada_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- Idempotent column addition for existing DBs.
-- The CREATE TABLE IF NOT EXISTS above only creates when the
-- table is missing. If the table already existed from
-- 001_init.sql (which historically lacked these columns),
-- these ALTERs add them safely without data loss.
-- MySQL does not support ADD COLUMN IF NOT EXISTS consistently,
-- so this uses INFORMATION_SCHEMA + prepared statements.
-- ────────────────────────────────────────────────────────────

SET @schema_name = DATABASE();

SET @add_referencia_id = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE notificaciones ADD COLUMN referencia_id INT DEFAULT NULL AFTER tipo',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'notificaciones'
    AND COLUMN_NAME = 'referencia_id'
);

PREPARE stmt FROM @add_referencia_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_referencia_tipo = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE notificaciones ADD COLUMN referencia_tipo VARCHAR(50) DEFAULT NULL AFTER referencia_id',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'notificaciones'
    AND COLUMN_NAME = 'referencia_tipo'
);

PREPARE stmt FROM @add_referencia_tipo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_creada_en = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE notificaciones ADD COLUMN creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER leida',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'notificaciones'
    AND COLUMN_NAME = 'creada_en'
);

PREPARE stmt FROM @add_creada_en;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sync_legacy_created_at = (
  SELECT IF(
    SUM(COLUMN_NAME = 'created_at') > 0 AND SUM(COLUMN_NAME = 'creada_en') > 0,
    'UPDATE notificaciones SET creada_en = COALESCE(created_at, creada_en) WHERE created_at IS NOT NULL',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'notificaciones'
    AND COLUMN_NAME IN ('created_at', 'creada_en')
);

PREPARE stmt FROM @sync_legacy_created_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
