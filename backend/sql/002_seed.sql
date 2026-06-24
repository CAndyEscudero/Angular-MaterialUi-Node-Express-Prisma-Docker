-- Seed data for thesis demo
-- Run AFTER 001_init.sql
-- Passwords are bcrypt-hashed '123456' (10 salt rounds)

USE educacion;

-- ============================================================
-- Carreras (foundational — needed for FK references)
-- ============================================================
INSERT INTO carreras (nombre, codigo, descripcion, duracion_anios) VALUES
('Ingeniería en Sistemas', 'LI-SISTEMAS', 'Ingeniería en Sistemas de Información', 5);

-- ============================================================
-- Users (3 roles: admin, profesor, alumno)
-- ============================================================
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Admin Usuario',   'admin@test.com',    '$2b$10$e.334LIB6HGlv8StPgExFuLO74yHnEyibw8/pAuSVlzFtnqcaJaAG', 'admin'),
('Profesor Usuario', 'profesor@test.com', '$2b$10$e.334LIB6HGlv8StPgExFuLO74yHnEyibw8/pAuSVlzFtnqcaJaAG', 'profesor'),
('Alumno Usuario',  'alumno@test.com',   '$2b$10$e.334LIB6HGlv8StPgExFuLO74yHnEyibw8/pAuSVlzFtnqcaJaAG', 'alumno');

-- ============================================================
-- Professor profile (links usuario_id=2)
-- ============================================================
INSERT INTO profesores (usuario_id, especialidad) VALUES
(2, 'Matemáticas');

-- ============================================================
-- Student profile (links usuario_id=3)
-- ============================================================
INSERT INTO alumnos (usuario_id, carrera) VALUES
(3, 'Ingeniería en Sistemas');

-- ============================================================
-- Subjects (both assigned to profesor_id=2)
-- ============================================================
INSERT INTO materias (nombre, codigo, profesor_id) VALUES
('Álgebra Lineal',    'ALG-101',  2),
('Programación I',    'PROG-101', 2);

-- ============================================================
-- Enrollment (alumno_id=1 enrolled in materia_id=1)
-- ============================================================
INSERT INTO inscripciones (alumno_id, materia_id) VALUES
(1, 1);
