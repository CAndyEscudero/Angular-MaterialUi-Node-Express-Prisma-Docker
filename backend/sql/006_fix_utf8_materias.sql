-- ============================================================
-- Fix UTF-8 double-encoding in materias.nombre
-- 
-- PROBLEM:
--   The MySQL client connection was defaulting to latin1 while
--   the table uses utf8mb4. When UTF-8 bytes (e.g. C3 81 for Á)
--   were sent over a latin1 connection, MySQL interpreted each
--   byte as a latin1 character and converted it to utf8mb4,
--   producing double-encoded bytes (C3 83 C2 81).
--
--   Stored example:
--     'Álgebra Lineal' → 'Ãlgebra Lineal'
--     'Programación I' → 'ProgramaciÃ³n I'
--
-- FIX:
--   Since rows have unique `codigo` values, we update known
--   seed rows with the correct literals. This is safer than
--   a CONVERT(CONVERT(nombre USING latin1) USING utf8mb4)
--   because it protects against edge cases in charset
--   conversion and is fully deterministic.
--
-- ROOT CAUSE (applied separately):
--   backend/src/config/db.ts now sets charset: "utf8mb4"
--   in the mysql2 pool config, preventing future corruption.
--
-- NOTE:
--   Run this with --default-character-set=utf8mb4 so that
--   the SQL literals are transmitted correctly to the server.
-- ============================================================

USE educacion;

-- Fix known corrupt rows by unique codigo
UPDATE materias SET nombre = 'Álgebra Lineal' WHERE codigo = 'ALG-101';
UPDATE materias SET nombre = 'Programación I' WHERE codigo = 'PROG-101';
