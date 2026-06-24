-- ============================================================
-- Migration 005: Legajo automático para alumnos
--
-- Propósito: Agregar índice UNIQUE a legajo de alumnos para
-- garantizar unicidad al generarse automáticamente al aprobar
-- una solicitud de inscripción a carrera.
--
-- Compatibilidad: MySQL 8.0+
-- Idempotente: Se puede ejecutar múltiples veces sin errores
-- Seguro para DB existente: No borra datos ni tablas
--
-- Cómo ejecutar:
--   docker exec -i thesis-mysql mysql -uroot -proot < 005_legajo_alumnos.sql
--   mysql -u root -p educacion < 005_legajo_alumnos.sql
-- ============================================================

USE educacion;

-- ============================================================
-- Helper: add unique index if it does not exist
-- ============================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_add_unique_index_if_not_exists $$
CREATE PROCEDURE sp_add_unique_index_if_not_exists(
    IN p_index_name VARCHAR(64),
    IN p_table_name VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    DECLARE idx_count INT;
    SELECT COUNT(*) INTO idx_count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name;

    IF idx_count = 0 THEN
        SET @sql = CONCAT('CREATE UNIQUE INDEX ', p_index_name, ' ON `', p_table_name, '` ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$
DELIMITER ;

-- ============================================================
-- Add UNIQUE index on alumnos.legajo (nullable — MySQL permite
-- múltiples NULLs en unique indexes)
-- ============================================================
CALL sp_add_unique_index_if_not_exists('idx_alumnos_legajo', 'alumnos', '(legajo)');

-- ============================================================
-- Cleanup
-- ============================================================
DROP PROCEDURE IF EXISTS sp_add_unique_index_if_not_exists;

-- ============================================================
-- Fin de migración 005
-- ============================================================
