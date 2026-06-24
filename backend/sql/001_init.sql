CREATE DATABASE IF NOT EXISTS educacion;
USE educacion;

-- ============================================================
-- DROP existing tables (reverse dependency order)
-- ============================================================
DROP TABLE IF EXISTS auditoria_logs;
DROP TABLE IF EXISTS respuestas;
DROP TABLE IF EXISTS preguntas;
DROP TABLE IF EXISTS encuestas;
DROP TABLE IF EXISTS biblioteca_items;
DROP TABLE IF EXISTS certificados;
DROP TABLE IF EXISTS evaluaciones;
DROP TABLE IF EXISTS asistencias;
DROP TABLE IF EXISTS calendario_eventos;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS mensajes;
DROP TABLE IF EXISTS entregas;
DROP TABLE IF EXISTS trabajos_practicos;
DROP TABLE IF EXISTS materiales;
DROP TABLE IF EXISTS anuncios;
DROP TABLE IF EXISTS correlatividades;
DROP TABLE IF EXISTS periodos_inscripcion;
DROP TABLE IF EXISTS documentos_inscripcion;
DROP TABLE IF EXISTS inscripciones_carrera;
DROP TABLE IF EXISTS inscripciones;
DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS alumnos;
DROP TABLE IF EXISTS profesores;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS carreras;

-- ============================================================
-- 1. Core tables
-- ============================================================

-- 1.1 Carreras (new — foundational for academic organization)
CREATE TABLE carreras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descripcion TEXT,
    duracion_anios TINYINT NOT NULL DEFAULT 5,
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Usuarios (extended)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin','profesor','alumno') NOT NULL DEFAULT 'alumno',
    activo TINYINT(1) DEFAULT 1,
    telefono VARCHAR(20) DEFAULT NULL,
    foto_url VARCHAR(255) DEFAULT NULL,
    ultimo_acceso TIMESTAMP NULL DEFAULT NULL,
    password_changed_at TIMESTAMP NULL DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 Profesores (extended)
CREATE TABLE profesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    especialidad VARCHAR(100) DEFAULT NULL,
    titulo VARCHAR(100) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.4 Alumnos (extended)
CREATE TABLE alumnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    carrera VARCHAR(100) DEFAULT NULL,
    carrera_id INT DEFAULT NULL,
    legajo VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.5 Materias (extended with columns the backend code already expects)
CREATE TABLE materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    profesor_id INT NOT NULL,
    descripcion TEXT DEFAULT NULL,
    cuatrimestre ENUM('1','2') DEFAULT NULL,
    anio INT DEFAULT NULL,
    carrera VARCHAR(100) DEFAULT NULL,
    carrera_id INT DEFAULT NULL,
    dia_horario VARCHAR(255) DEFAULT NULL,
    cupo_maximo INT DEFAULT NULL,
    aula VARCHAR(50) DEFAULT NULL,
    modalidad ENUM('presencial','virtual','hibrida') DEFAULT 'presencial',
    estado ENUM('activa','inactiva') DEFAULT 'activa',
    creditos TINYINT DEFAULT NULL,
    anio_carrera TINYINT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.6 Inscripciones (extended)
CREATE TABLE inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    materia_id INT NOT NULL,
    nota DECIMAL(4,2) DEFAULT NULL,
    estado ENUM('activa','aprobada','rechazada','cancelada') DEFAULT 'activa',
    fecha_aprobacion TIMESTAMP NULL DEFAULT NULL,
    fecha_rechazo TIMESTAMP NULL DEFAULT NULL,
    motivo_rechazo VARCHAR(255) DEFAULT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    UNIQUE KEY (alumno_id, materia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.7 Correlatividades (new)
CREATE TABLE correlatividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    correlativa_id INT NOT NULL,
    tipo ENUM('regular','analitica') DEFAULT 'regular',
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (correlativa_id) REFERENCES materias(id) ON DELETE CASCADE,
    UNIQUE KEY (materia_id, correlativa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.8 Períodos de Inscripción (academic business rule: enrollments only inside open periods)
CREATE TABLE periodos_inscripcion (
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

-- 1.9 Inscripciones a Carreras (first-level enrollment — gates subject enrollment)
CREATE TABLE inscripciones_carrera (
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

-- 1.10 Documentos de Inscripción a Carrera
CREATE TABLE documentos_inscripcion (
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
-- 2. Communication tables
-- ============================================================

-- 2.1 Anuncios
CREATE TABLE anuncios (
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

-- 2.2 Notificaciones
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT,
    leida TINYINT(1) DEFAULT 0,
    tipo ENUM('sistema','inscripcion','nota','examen','carrera','anuncio') NOT NULL DEFAULT 'sistema',
    referencia_id INT DEFAULT NULL,
    referencia_tipo VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 Mensajes
CREATE TABLE mensajes (
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

-- ============================================================
-- 3. Academic resources
-- ============================================================

-- 3.1 Materiales
CREATE TABLE materiales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo_archivo VARCHAR(50) DEFAULT NULL,
    url_archivo VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 Trabajos Prácticos
CREATE TABLE trabajos_practicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_entrega DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3 Entregas
CREATE TABLE entregas (
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

-- ============================================================
-- 4. Attendance and evaluations
-- ============================================================

-- 4.1 Asistencias
CREATE TABLE asistencias (
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

-- 4.2 Evaluaciones (granular, separate from inscripciones.nota)
CREATE TABLE evaluaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL,
    tipo ENUM('parcial','final','recuperatorio','trabajo_practico') NOT NULL,
    nota DECIMAL(4,2) DEFAULT NULL,
    fecha DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.3 Calendario Eventos
CREATE TABLE calendario_eventos (
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

-- ============================================================
-- 5. Certificates and audit
-- ============================================================

-- 5.1 Certificados
CREATE TABLE certificados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    tipo ENUM('alumno_regular','analitico','curso','otro') NOT NULL,
    fecha_emision DATE NOT NULL,
    url_archivo VARCHAR(500) DEFAULT NULL,
    estado ENUM('generado','entregado','revocado') DEFAULT 'generado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.2 Auditoría Logs
CREATE TABLE auditoria_logs (
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
-- 6. Surveys and library (future)
-- ============================================================

-- 6.1 Encuestas
CREATE TABLE encuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    materia_id INT DEFAULT NULL,
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    encuesta_id INT NOT NULL,
    texto TEXT NOT NULL,
    tipo ENUM('multiple_choice','texto','escala','booleano') DEFAULT 'texto',
    orden INT DEFAULT 0,
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE respuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta_id INT NOT NULL,
    alumno_id INT NOT NULL,
    texto_respuesta TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    UNIQUE KEY (pregunta_id, alumno_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.2 Biblioteca Items
CREATE TABLE biblioteca_items (
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

-- ============================================================
-- 7. Índices de rendimiento
-- ============================================================
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_profesor ON materias(profesor_id);
CREATE INDEX idx_materias_carrera ON materias(carrera_id);
CREATE INDEX idx_alumno ON inscripciones(alumno_id);
CREATE INDEX idx_materia ON inscripciones(materia_id);
CREATE INDEX idx_inscripciones_estado ON inscripciones(estado);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);
CREATE INDEX idx_mensajes_destinatario ON mensajes(destinatario_id, leido);
CREATE INDEX idx_asistencias_materia ON asistencias(materia_id, fecha);
CREATE INDEX idx_evaluaciones_inscripcion ON evaluaciones(inscripcion_id, tipo);
CREATE INDEX idx_auditoria_entidad ON auditoria_logs(entidad, entidad_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_logs(created_at);
CREATE INDEX idx_eventos_fecha ON calendario_eventos(fecha_inicio);
CREATE INDEX idx_insc_carrera_alumno ON inscripciones_carrera(alumno_id);
CREATE INDEX idx_insc_carrera_estado ON inscripciones_carrera(estado);
CREATE INDEX idx_insc_carrera_carrera ON inscripciones_carrera(carrera_id);
CREATE INDEX idx_docs_inscripcion ON documentos_inscripcion(inscripcion_carrera_id);

-- ============================================================
-- Fin del script de inicialización
-- ============================================================
