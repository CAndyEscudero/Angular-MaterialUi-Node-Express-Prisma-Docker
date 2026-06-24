-- ============================================================
-- Migration 003: Extender esquema para Campus Virtual UTN
--
-- Proposito: Agregar tablas y columnas para los modulos del
-- Campus Virtual sin romper datos existentes.
--
-- Compatibilidad: MySQL 8.0+
-- Idempotente: Se puede ejecutar multiples veces sin errores
-- Seguro para DB existente: No borra datos ni tablas
--
-- Como ejecutar:
--   docker exec -i thesis-mysql mysql -uroot -proot < 003_extender_campus_virtual.sql
--   mysql -u root -p educacion < 003_extender_campus_virtual.sql
-- ============================================================

USE educacion;

-- ============================================================
-- Helper procedures for idempotent schema changes
-- ============================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_add_column_if_not_exists $$
CREATE PROCEDURE sp_add_column_if_not_exists(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_definition TEXT
)
BEGIN
    DECLARE col_count INT;
    SELECT COUNT(*) INTO col_count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name;

    IF col_count = 0 THEN
        -- backtick quoting supports special chars (a UNHEX produced 'n with tilde')
        SET @sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DROP PROCEDURE IF EXISTS sp_add_fk_if_not_exists $$
CREATE PROCEDURE sp_add_fk_if_not_exists(
    IN p_fk_name VARCHAR(64),
    IN p_table_name VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    DECLARE fk_count INT;
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND CONSTRAINT_NAME = p_fk_name;

    IF fk_count = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD CONSTRAINT ', p_fk_name, ' ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists $$
CREATE PROCEDURE sp_add_index_if_not_exists(
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
        SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON `', p_table_name, '` ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DELIMITER ;

-- ============================================================
-- 1. Nuevas columnas en tablas existentes
-- ============================================================

-- 1.1 usuarios
CALL sp_add_column_if_not_exists('usuarios', 'activo',             'TINYINT(1) DEFAULT 1 AFTER rol');
CALL sp_add_column_if_not_exists('usuarios', 'telefono',           'VARCHAR(20) DEFAULT NULL AFTER activo');
CALL sp_add_column_if_not_exists('usuarios', 'foto_url',           'VARCHAR(255) DEFAULT NULL AFTER telefono');
CALL sp_add_column_if_not_exists('usuarios', 'ultimo_acceso',      'TIMESTAMP NULL DEFAULT NULL AFTER foto_url');
CALL sp_add_column_if_not_exists('usuarios', 'password_changed_at','TIMESTAMP NULL DEFAULT NULL AFTER ultimo_acceso');

-- 1.2 profesores
CALL sp_add_column_if_not_exists('profesores', 'titulo',   'VARCHAR(100) DEFAULT NULL AFTER especialidad');
CALL sp_add_column_if_not_exists('profesores', 'telefono', 'VARCHAR(20) DEFAULT NULL AFTER titulo');

-- 1.3 alumnos
CALL sp_add_column_if_not_exists('alumnos', 'carrera_id', 'INT DEFAULT NULL AFTER carrera');
CALL sp_add_column_if_not_exists('alumnos', 'legajo',     'VARCHAR(20) DEFAULT NULL AFTER carrera_id');

-- 1.4 materias: columnas extendidas que el backend ya espera
-- NOTA: Se omite AFTER para columnas que referencian a 'a' + UNHEX + 'o'
--       (la 'n with tilde' causa problemas en transferencia). El orden de
--       columnas no afecta funcionalidad.
CALL sp_add_column_if_not_exists('materias', 'descripcion',   'TEXT DEFAULT NULL AFTER profesor_id');
CALL sp_add_column_if_not_exists('materias', 'cuatrimestre',  "ENUM('1','2') DEFAULT NULL AFTER descripcion");
-- anio (sin tilde): el codigo existente usaba 'anyo' con tilde, pero para
-- evitar problemas de encoding con el caracter no-ASCII al transferir el
-- archivo, la columna se nombra 'anio' y se ajusta el controlador backend.
-- La funcionalidad es identica; MySQL no diferencia.
CALL sp_add_column_if_not_exists('materias', 'anio',          'INT DEFAULT NULL AFTER cuatrimestre');
CALL sp_add_column_if_not_exists('materias', 'carrera',       'VARCHAR(100) DEFAULT NULL');
CALL sp_add_column_if_not_exists('materias', 'carrera_id',    'INT DEFAULT NULL');
CALL sp_add_column_if_not_exists('materias', 'dia_horario',   'VARCHAR(255) DEFAULT NULL');
CALL sp_add_column_if_not_exists('materias', 'cupo_maximo',   'INT DEFAULT NULL');
CALL sp_add_column_if_not_exists('materias', 'aula',          'VARCHAR(50) DEFAULT NULL');
CALL sp_add_column_if_not_exists('materias', 'modalidad',     "ENUM('presencial','virtual','hibrida') DEFAULT 'presencial'");
CALL sp_add_column_if_not_exists('materias', 'estado',        "ENUM('activa','inactiva') DEFAULT 'activa'");
CALL sp_add_column_if_not_exists('materias', 'creditos',      'TINYINT DEFAULT NULL');
CALL sp_add_column_if_not_exists('materias', 'anio_carrera',  'TINYINT DEFAULT NULL');
CALL sp_add_column_if_not_exists('materias', 'created_at',    'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

-- 1.5 inscripciones
CALL sp_add_column_if_not_exists('inscripciones', 'estado',           "ENUM('activa','aprobada','rechazada','cancelada') DEFAULT 'activa' AFTER nota");
CALL sp_add_column_if_not_exists('inscripciones', 'fecha_aprobacion', 'TIMESTAMP NULL DEFAULT NULL AFTER estado');
CALL sp_add_column_if_not_exists('inscripciones', 'fecha_rechazo',    'TIMESTAMP NULL DEFAULT NULL AFTER fecha_aprobacion');
CALL sp_add_column_if_not_exists('inscripciones', 'motivo_rechazo',   'VARCHAR(255) DEFAULT NULL AFTER fecha_rechazo');

-- ============================================================
-- 2. Nuevas tablas
-- ============================================================

-- 2.1 carreras
CREATE TABLE IF NOT EXISTS carreras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT,
    duracion_anios TINYINT NOT NULL DEFAULT 5,
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 correlatividades
CREATE TABLE IF NOT EXISTS correlatividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    correlativa_id INT NOT NULL,
    tipo ENUM('regular','analitica') DEFAULT 'regular',
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (correlativa_id) REFERENCES materias(id) ON DELETE CASCADE,
    UNIQUE KEY (materia_id, correlativa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 anuncios
CREATE TABLE IF NOT EXISTS anuncios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    creado_por INT NOT NULL,
    materia_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.4 materiales
CREATE TABLE IF NOT EXISTS materiales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo_archivo VARCHAR(50) DEFAULT NULL,
    url_archivo VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.5 trabajos_practicos
CREATE TABLE IF NOT EXISTS trabajos_practicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_entrega DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.6 entregas
CREATE TABLE IF NOT EXISTS entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trabajo_practico_id INT NOT NULL,
    alumno_id INT NOT NULL,
    url_archivo VARCHAR(500) DEFAULT NULL,
    nota DECIMAL(4,2) DEFAULT NULL,
    estado ENUM('pendiente','entregado','corregido','devuelto') DEFAULT 'pendiente',
    fecha_entrega TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trabajo_practico_id) REFERENCES trabajos_practicos(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    UNIQUE KEY (trabajo_practico_id, alumno_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.7 notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT,
    leida TINYINT(1) DEFAULT 0,
    tipo VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.8 calendario_eventos
CREATE TABLE IF NOT EXISTS calendario_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME DEFAULT NULL,
    tipo ENUM('clase','examen','feriado','reunion','otro') DEFAULT 'otro',
    materia_id INT DEFAULT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.9 asistencias
CREATE TABLE IF NOT EXISTS asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    alumno_id INT NOT NULL,
    fecha DATE NOT NULL,
    presente TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    UNIQUE KEY (materia_id, alumno_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.10 evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL,
    tipo ENUM('parcial','final','recuperatorio','trabajo_practico') NOT NULL,
    nota DECIMAL(4,2) DEFAULT NULL,
    fecha DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.11 certificados
CREATE TABLE IF NOT EXISTS certificados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    tipo ENUM('alumno_regular','analitico','curso','otro') NOT NULL,
    fecha_emision DATE NOT NULL,
    url_archivo VARCHAR(500) DEFAULT NULL,
    estado ENUM('generado','entregado','revocado') DEFAULT 'generado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.12 mensajes
CREATE TABLE IF NOT EXISTS mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remitente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    asunto VARCHAR(200) DEFAULT NULL,
    cuerpo TEXT NOT NULL,
    leido TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.13 encuestas / preguntas / respuestas
CREATE TABLE IF NOT EXISTS encuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    materia_id INT DEFAULT NULL,
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    encuesta_id INT NOT NULL,
    texto TEXT NOT NULL,
    tipo ENUM('multiple_choice','texto','escala','booleano') DEFAULT 'texto',
    orden INT DEFAULT 0,
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS respuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta_id INT NOT NULL,
    alumno_id INT NOT NULL,
    texto_respuesta TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    UNIQUE KEY (pregunta_id, alumno_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.14 biblioteca_items
CREATE TABLE IF NOT EXISTS biblioteca_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(150) DEFAULT NULL,
    descripcion TEXT,
    tipo ENUM('libro','articulo','video','enlace','otro') DEFAULT 'libro',
    url_archivo VARCHAR(500) DEFAULT NULL,
    materia_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.15 auditoria_logs
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT DEFAULT NULL,
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id INT DEFAULT NULL,
    detalle JSON DEFAULT NULL,
    direccion_ip VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. FKs para columnas nuevas
-- ============================================================
CALL sp_add_fk_if_not_exists('alumnos_ibfk_2',
    'alumnos',
    'FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL');

CALL sp_add_fk_if_not_exists('materias_ibfk_2',
    'materias',
    'FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL');

-- ============================================================
-- 4. Indices
-- ============================================================
CALL sp_add_index_if_not_exists('idx_usuarios_rol', 'usuarios', '(rol)');
CALL sp_add_index_if_not_exists('idx_materias_carrera', 'materias', '(carrera_id)');
CALL sp_add_index_if_not_exists('idx_inscripciones_estado', 'inscripciones', '(estado)');
CALL sp_add_index_if_not_exists('idx_notificaciones_usuario', 'notificaciones', '(usuario_id)');
CALL sp_add_index_if_not_exists('idx_notificaciones_leida', 'notificaciones', '(usuario_id, leida)');
CALL sp_add_index_if_not_exists('idx_mensajes_destinatario', 'mensajes', '(destinatario_id, leido)');
CALL sp_add_index_if_not_exists('idx_asistencias_materia', 'asistencias', '(materia_id, fecha)');
CALL sp_add_index_if_not_exists('idx_evaluaciones_inscripcion', 'evaluaciones', '(inscripcion_id, tipo)');
CALL sp_add_index_if_not_exists('idx_auditoria_entidad', 'auditoria_logs', '(entidad, entidad_id)');
CALL sp_add_index_if_not_exists('idx_auditoria_fecha', 'auditoria_logs', '(created_at)');
CALL sp_add_index_if_not_exists('idx_eventos_fecha', 'calendario_eventos', '(fecha_inicio)');

-- ============================================================
-- Cleanup: drop helper procedures
-- ============================================================
DROP PROCEDURE IF EXISTS sp_add_column_if_not_exists;
DROP PROCEDURE IF EXISTS sp_add_fk_if_not_exists;
DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists;

-- ============================================================
-- Fin de migracion 003
-- ============================================================
