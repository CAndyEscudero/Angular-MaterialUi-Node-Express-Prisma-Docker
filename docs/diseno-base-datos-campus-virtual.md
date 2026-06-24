# Diseño de Base de Datos — Campus Virtual UTN

> Esquema modular para el Campus Virtual. MySQL 8, motor InnoDB.
> Basado en el proyecto existente `educacion` (tesis demo) con extensión progresiva.

---

## 1. Convenciones de Nomenclatura

- **Tablas**: plural, snake_case, español (`usuarios`, `materias`, `inscripciones`)
- **Columnas**: snake_case, español (`fecha_inscripcion`, `alumno_id`)
- **FKs**: `{tabla_origen}_id` referenciando a `{tabla_destino}.id`
- **Timestamps**: `created_at`, `updated_at` donde aplique
- **Soft delete**: no por ahora. Se prefiere columna `activo`/`estado` donde haga falta
- **Encoding**: `utf8mb4` con `utf8mb4_unicode_ci`

---

## 2. Arquitectura General

```
┌────────────────────────────────────────────────────────────┐
│                   educacion (DB)                           │
│                                                            │
│  ┌───────────┐    ┌──────────┐    ┌──────────────────┐    │
│  │ usuarios   │◄───│ perfiles │◄───│ módulos core     │    │
│  │            │    │ alumnos  │    │ materias          │    │
│  │ (auth)     │    │ profes.  │    │ inscripciones     │    │
│  │            │    │          │    │ carreras          │    │
│  └───────────┘    └──────────┘    └──────────────────┘    │
│                                            │               │
│         ┌──────────────────────────────────┘               │
│         ▼                                                  │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Módulos extendidos                               │     │
│  │  correlatividades | anuncios | materiales | tps   │     │
│  │  entregas | asistencias | evaluaciones            │     │
│  │  calendario | mensajes | notificaciones           │     │
│  │  encuestas | biblioteca | certificados | auditoría│     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Tablas Core (Fase 1 — Ya implementadas parcialmente)

### usuarios
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `nombre` | VARCHAR(100) NOT NULL | |
| `email` | VARCHAR(100) UNIQUE NOT NULL | Login |
| `password` | VARCHAR(255) NOT NULL | bcrypt hash |
| `rol` | ENUM('admin','profesor','alumno') NOT NULL | DEFAULT 'alumno' |
| `activo` | TINYINT(1) DEFAULT 1 | Nuevo — para desactivación lógica |
| `telefono` | VARCHAR(20) NULL | Nuevo |
| `foto_url` | VARCHAR(255) NULL | Nuevo |
| `ultimo_acceso` | TIMESTAMP NULL | Nuevo |
| `password_changed_at` | TIMESTAMP NULL | Nuevo |
| `creado_en` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

### carreras
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `nombre` | VARCHAR(150) NOT NULL | |
| `codigo` | VARCHAR(20) UNIQUE NOT NULL | Ej: `LI-SISTEMAS` |
| `descripcion` | TEXT NULL | |
| `duracion_anios` | TINYINT NOT NULL | DEFAULT 5 |
| `activa` | TINYINT(1) DEFAULT 1 | |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

### profesores
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `usuario_id` | INT UNIQUE NOT NULL → usuarios(id) | FK |
| `especialidad` | VARCHAR(100) NULL | Existente |
| `titulo` | VARCHAR(100) NULL | Nuevo — ej: "Lic.", "Ing." |
| `telefono` | VARCHAR(20) NULL | Nuevo |

### alumnos
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `usuario_id` | INT UNIQUE NOT NULL → usuarios(id) | FK |
| `carrera` | VARCHAR(100) NULL | Existente (legacy) |
| `carrera_id` | INT NULL → carreras(id) | Nuevo FK |
| `legajo` | VARCHAR(20) UNIQUE NULL | Generado automáticamente al aprobar inscripción a carrera. Migration 005 agrega `idx_alumnos_legajo` UNIQUE INDEX. Formato: `{prefijo}-{5 dígitos}`. |

### materias
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `nombre` | VARCHAR(100) NOT NULL | |
| `codigo` | VARCHAR(50) UNIQUE NOT NULL | |
| `profesor_id` | INT NOT NULL → usuarios(id) | FK |
| `descripcion` | TEXT NULL | Nuevo (código ya lo espera) |
| `cuatrimestre` | ENUM('1','2') NULL | Nuevo (código ya lo espera) |
| `anio` | INT NULL | Nuevo — año del calendario académico (código ya lo espera como `año`) |
| `carrera` | VARCHAR(100) NULL | Nuevo (código ya lo espera) |
| `carrera_id` | INT NULL → carreras(id) | Nuevo FK |
| `dia_horario` | VARCHAR(255) NULL | Nuevo (código ya lo espera) |
| `cupo_maximo` | INT NULL | Nuevo (código ya lo espera) |
| `aula` | VARCHAR(50) NULL | Nuevo |
| `modalidad` | ENUM('presencial','virtual','hibrida') DEFAULT 'presencial' | Nuevo |
| `estado` | ENUM('activa','inactiva') DEFAULT 'activa' | Nuevo (código ya lo espera) |
| `creditos` | TINYINT NULL | Nuevo |
| `anio_carrera` | TINYINT NULL | Nuevo — año del plan (1-6) |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Nuevo |

### inscripciones
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `alumno_id` | INT NOT NULL → alumnos(id) | FK |
| `materia_id` | INT NOT NULL → materias(id) | FK |
| `nota` | DECIMAL(4,2) NULL | Existente — escala 0-100 |
| `estado` | ENUM('activa','aprobada','rechazada','cancelada') DEFAULT 'activa' | Nuevo |
| `fecha_aprobacion` | TIMESTAMP NULL | Nuevo |
| `fecha_rechazo` | TIMESTAMP NULL | Nuevo |
| `motivo_rechazo` | VARCHAR(255) NULL | Nuevo |
| `fecha_inscripcion` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Existente |
| UNIQUE KEY `alumno_id, materia_id` | | |

---

## 4. Tablas Extendidas (Fase 2 — Pendientes)

### correlatividades
```sql
CREATE TABLE correlatividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    correlativa_id INT NOT NULL,
    tipo ENUM('regular','analitica') DEFAULT 'regular',
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (correlativa_id) REFERENCES materias(id) ON DELETE CASCADE,
    UNIQUE KEY (materia_id, correlativa_id)
);
```

### anuncios
```sql
CREATE TABLE anuncios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    creado_por INT NOT NULL,
    materia_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
);
```

### materiales
```sql
CREATE TABLE materiales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NULL,
    tipo_archivo VARCHAR(50) NULL,
    url_archivo VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
);
```

### trabajos_practicos
```sql
CREATE TABLE trabajos_practicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NULL,
    fecha_entrega DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
);
```

### entregas
```sql
CREATE TABLE entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trabajo_practico_id INT NOT NULL,
    alumno_id INT NOT NULL,
    url_archivo VARCHAR(500) NULL,
    nota DECIMAL(4,2) NULL,
    estado ENUM('pendiente','entregado','corregido','devuelto') DEFAULT 'pendiente',
    fecha_entrega TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trabajo_practico_id) REFERENCES trabajos_practicos(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    UNIQUE KEY (trabajo_practico_id, alumno_id)
);
```

### notificaciones
```sql
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NULL,
    leida TINYINT(1) DEFAULT 0,
    tipo VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);
```

### calendario_eventos
```sql
CREATE TABLE calendario_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NULL,
    tipo ENUM('clase','examen','feriado','reunion','otro') DEFAULT 'otro',
    materia_id INT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE INDEX idx_eventos_fecha ON calendario_eventos(fecha_inicio);
```

### asistencias
```sql
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
);
CREATE INDEX idx_asistencias_materia ON asistencias(materia_id, fecha);
```

### evaluaciones
```sql
CREATE TABLE evaluaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL,
    tipo ENUM('parcial','final','recuperatorio','trabajo_practico') NOT NULL,
    nota DECIMAL(4,2) NULL,
    fecha DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE CASCADE,
    INDEX (inscripcion_id, tipo)
);
```

### certificados
```sql
CREATE TABLE certificados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    tipo ENUM('alumno_regular','analitico','curso','otro') NOT NULL,
    fecha_emision DATE NOT NULL,
    url_archivo VARCHAR(500) NULL,
    estado ENUM('generado','entregado','revocado') DEFAULT 'generado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE
);
```

### mensajes
```sql
CREATE TABLE mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remitente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    asunto VARCHAR(200) NULL,
    cuerpo TEXT NOT NULL,
    leido TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE INDEX idx_mensajes_destinatario ON mensajes(destinatario_id, leido);
```

### encuestas
```sql
CREATE TABLE encuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NULL,
    materia_id INT NULL,
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL
);

CREATE TABLE preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    encuesta_id INT NOT NULL,
    texto TEXT NOT NULL,
    tipo ENUM('multiple_choice','texto','escala','booleano') DEFAULT 'texto',
    orden INT DEFAULT 0,
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id) ON DELETE CASCADE
);

CREATE TABLE respuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta_id INT NOT NULL,
    alumno_id INT NOT NULL,
    texto_respuesta TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    UNIQUE KEY (pregunta_id, alumno_id)
);
```

### biblioteca_items
```sql
CREATE TABLE biblioteca_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(150) NULL,
    descripcion TEXT NULL,
    tipo ENUM('libro','articulo','video','enlace','otro') DEFAULT 'libro',
    url_archivo VARCHAR(500) NULL,
    materia_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL
);
```

### auditoria_logs
```sql
CREATE TABLE auditoria_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id INT NULL,
    detalle JSON NULL,
    direccion_ip VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_auditoria_entidad ON auditoria_logs(entidad, entidad_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_logs(created_at);
```

---

## 4a. Tablas de Inscripción a Carrera (Nuevas — Migration 004)

### inscripciones_carrera
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `alumno_id` | INT NOT NULL → alumnos(id) | FK, UNIQUE por alumno |
| `carrera_id` | INT NOT NULL → carreras(id) | FK |
| `estado` | ENUM('pendiente','aprobada','rechazada','cancelada') | DEFAULT 'pendiente' |
| `fecha_solicitud` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |
| `fecha_revision` | TIMESTAMP NULL | Se setea al revisar |
| `revisado_por` | INT NULL → usuarios(id) | FK, admin que revisó |
| `motivo_rechazo` | VARCHAR(255) NULL | Obligatorio al rechazar |
| UNIQUE KEY `alumno_id` | | Una solicitud activa por alumno |

### documentos_inscripcion
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | INT AUTO_INCREMENT PK | |
| `inscripcion_carrera_id` | INT NOT NULL → inscripciones_carrera(id) | FK con CASCADE |
| `tipo_documento` | ENUM('dni_frente','dni_dorso','titulo_secundario','foto_carnet','otro') | |
| `nombre_archivo_original` | VARCHAR(255) NOT NULL | Nombre original subido |
| `nombre_archivo_guardado` | VARCHAR(255) NOT NULL | Nombre único en disco |
| `ruta_archivo` | VARCHAR(500) NOT NULL | Ruta relativa desde backend/ |
| `mime_type` | VARCHAR(100) NULL | ej: image/jpeg, application/pdf |
| `tamanio_bytes` | INT NULL | Tamaño del archivo |
| `fecha_subida` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

## 5. Índices Recomendados

```sql
-- Usuarios
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Materias
CREATE INDEX idx_materias_profesor ON materias(profesor_id);
CREATE INDEX idx_materias_carrera ON materias(carrera_id);

-- Inscripciones
CREATE UNIQUE INDEX idx_inscripcion_unica ON inscripciones(alumno_id, materia_id);
CREATE INDEX idx_inscripciones_alumno ON inscripciones(alumno_id);
CREATE INDEX idx_inscripciones_materia ON inscripciones(materia_id);
CREATE INDEX idx_inscripciones_estado ON inscripciones(estado);

-- Notificaciones
CREATE INDEX idx_notificaciones_usuario_leida ON notificaciones(usuario_id, leida);

-- Auditoría
CREATE INDEX idx_auditoria_fecha ON auditoria_logs(created_at);
CREATE INDEX idx_auditoria_usuario ON auditoria_logs(usuario_id);

-- Inscripciones Carrera
CREATE INDEX idx_insc_carrera_alumno ON inscripciones_carrera(alumno_id);
CREATE INDEX idx_insc_carrera_estado ON inscripciones_carrera(estado);
CREATE INDEX idx_insc_carrera_carrera ON inscripciones_carrera(carrera_id);
CREATE INDEX idx_docs_inscripcion ON documentos_inscripcion(inscripcion_carrera_id);
```

---

## 6. Plan de Implementación por Fases

### Fase 1 — Core existente + Bugfix (semana 1)
- [x] Esquema base: usuarios, profesores, alumnos, materias, inscripciones
- [ ] **Fix**: Agregar columnas faltantes a `materias` que el backend ya espera
- [ ] Agregar columna `activo` a usuarios
- [ ] Agregar FK `carrera_id` a alumnos
- [ ] Agregar columna `estado` a inscripciones

### Fase 2 — Carreras y organización académica (semana 2)
- [ ] Tabla `carreras`
- [ ] Tabla `correlatividades`
- [ ] Vincular materias con carreras
- [ ] Vincular alumnos con carreras (FK)

### Fase 3 — Comunicación (semana 3)
- [ ] Tabla `anuncios`
- [ ] Tabla `notificaciones`
- [ ] Tabla `mensajes`

### Fase 4 — Materiales y TP (semana 4)
- [ ] Tabla `materiales`
- [ ] Tabla `trabajos_practicos`
- [ ] Tabla `entregas`

### Fase 5 — Asistencia y evaluaciones (semana 5)
- [ ] Tabla `asistencias`
- [ ] Tabla `evaluaciones`
- [ ] Tabla `calendario_eventos`

### Fase 6 — Reportes y certificados (semana 6)
- [ ] Tabla `certificados`
- [ ] Tabla `auditoria_logs`

### Fase 7 — Extras (semana 7+)
- [ ] Encuestas (`encuestas`, `preguntas`, `respuestas`)
- [ ] Biblioteca (`biblioteca_items`)

---

## 7. Notas sobre Compatibilidad

1. **La tabla `materias` actual solo tiene 4 columnas**, pero el controlador backend (`materias.controller.ts:crearMateria`) ya intenta insertar en columnas extendidas (`descripcion`, `cuatrimestre`, `año`, `carrera`, `dia_horario`, `cupo_maximo`, `estado`). Esto es un **bug activo** que se corrige con la expansión del esquema.

2. **La columna `año` usa caracter `ñ`** (MySQL permite UTF-8 en nombres). Se mantiene por compatibilidad con el código existente.

3. **Todas las columnas nuevas son NULL o tienen DEFAULT** para no romper queries existentes.

4. **La tabla `inscripciones` mantiene `nota`** para compatibilidad con el código actual, aunque `evaluaciones` agregará granularidad.

5. **No se eliminan columnas existentes** — solo se agregan nuevas.
