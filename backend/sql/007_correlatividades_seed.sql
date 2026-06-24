-- ============================================================
-- Migration 007: Correlatividades table + demo seed
--
-- Propósito:
--   Asegurar que la tabla correlatividades exista en bases
--   existentes (ya incluida en 001_init.sql para bases fresh)
--   y agregar datos demo para mostrar la validación de
--   prerrequisitos al inscribirse a materias.
--
-- Idempotente: Se puede ejecutar múltiples veces sin errores.
-- Seguro para DB existente: No borra datos ni tablas.
-- IDs de materia NUNCA hardcodeados — se resuelven por codigo
-- mediante subconsultas, asegurando que funcione sin importar
-- el orden de inserción o auto-increment.
--
-- Cómo ejecutar:
--   docker exec -i thesis-mysql mysql -uroot -proot < 007_correlatividades_seed.sql
--   mysql -u root -p educacion < 007_correlatividades_seed.sql
-- ============================================================

USE educacion;

-- ============================================================
-- 1. Crear tabla si no existe (idempotente)
-- ============================================================
CREATE TABLE IF NOT EXISTS correlatividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    correlativa_id INT NOT NULL,
    tipo ENUM('regular','analitica') DEFAULT 'regular',
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (correlativa_id) REFERENCES materias(id) ON DELETE CASCADE,
    UNIQUE KEY (materia_id, correlativa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. Agregar materia demo: Programación II (si no existe)
--    Se inserta solo si no hay materia con código PROG-201.
-- ============================================================
INSERT IGNORE INTO materias (nombre, codigo, profesor_id) VALUES
('Programación II', 'PROG-201', 2);

-- ============================================================
-- 3. Asignar nota aprobatoria a la inscripción demo existente
--    (alumno_id=1, materia_id=1 → Álgebra Lineal, nota=85)
--    Solo actualiza si nota IS NULL (no sobreescribe si el
--    admin ya cargó una nota manualmente).
--    ID de materia se resuelve por codigo, no hardcodeado.
-- ============================================================
UPDATE inscripciones i
JOIN materias m ON i.materia_id = m.id
SET i.nota = 85, i.estado = 'aprobada', i.fecha_aprobacion = NOW()
WHERE i.alumno_id = 1 AND m.codigo = 'ALG-101' AND i.nota IS NULL;

-- ============================================================
-- 4. Insertar correlatividades demo (si no existen)
--    Los IDs de materia se resuelven mediante subconsultas
--    por codigo UNIQUE, eliminando la dependencia del
--    orden de auto-increment.
--
--    - PROG-101  requiere ALG-101 como 'regular'   (cursada)
--    - PROG-201  requiere PROG-101 como 'analítica' (aprobada)
-- ============================================================
INSERT IGNORE INTO correlatividades (materia_id, correlativa_id, tipo)
SELECT m.id, c.id, 'regular'
FROM materias m
JOIN materias c ON c.codigo = 'ALG-101'
WHERE m.codigo = 'PROG-101';

INSERT IGNORE INTO correlatividades (materia_id, correlativa_id, tipo)
SELECT m.id, c.id, 'analitica'
FROM materias m
JOIN materias c ON c.codigo = 'PROG-101'
WHERE m.codigo = 'PROG-201';

-- ============================================================
-- Fin de migración 007
-- ============================================================
