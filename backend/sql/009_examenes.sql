-- Migration 009: Tabla de Exámenes
CREATE TABLE IF NOT EXISTS examenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    tipo ENUM('parcial', 'final', 'recuperatorio', 'otro') DEFAULT 'parcial',
    fecha DATE NOT NULL,
    hora TIME DEFAULT NULL,
    aula VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    INDEX idx_examen_materia (materia_id),
    INDEX idx_examen_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert demo exams if table is empty
INSERT INTO examenes (materia_id, nombre, tipo, fecha, hora, aula)
SELECT m.id, 'Parcial 1', 'parcial', DATE_ADD(CURDATE(), INTERVAL 15 DAY), '10:00:00', 'Aula 101'
FROM materias m
WHERE NOT EXISTS (SELECT 1 FROM examenes)
LIMIT 1;

INSERT INTO examenes (materia_id, nombre, tipo, fecha, hora, aula)
SELECT m.id, 'Examen Final', 'final', DATE_ADD(CURDATE(), INTERVAL 60 DAY), '14:00:00', 'Aula 205'
FROM materias m
WHERE NOT EXISTS (SELECT 1 FROM examenes)
LIMIT 1 OFFSET 1;
